import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://tbsnhkerfkovxsgreqqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRic25oa2VyZmtvdnhzZ3JlcXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg5NTEsImV4cCI6MjA5NTIwNDk1MX0.lIMcF5ATSBr9rQKxv_PGz0btEIF7uZB6z5O_DBw5f_Y";
const ORANGE = "#E8681A";
const BUCKET = "productos";

// ─── Usuarios hardcoded (en producción usar Supabase Auth) ───────────────────
const USUARIOS = [
  { id: 1, nombre: "Fanny",    password: "TEC-Admin-2026", rol: "admin"    },
  { id: 2, nombre: "Admin2",   password: "TEC-Admin-2026", rol: "admin"    },
  { id: 3, nombre: "Empleado", password: "TEC-Staff-2026", rol: "empleado" },
];

// ─── Supabase helpers ────────────────────────────────────────────────────────
const sb = {
  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
  async get(table, query = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers: this.headers });
    return r.json();
  },
  async post(table, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: this.headers, body: JSON.stringify(body) });
    return r.json();
  },
  async patch(table, id, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: this.headers, body: JSON.stringify(body) });
    return r.json();
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: this.headers });
  },
  async uploadFoto(file, path) {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type, "x-upsert": "true" },
      body: file,
    });
    if (!r.ok) throw new Error("Error subiendo foto");
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  },
  async deleteFoto(path) {
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "DELETE", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
  },
};

function fmt(n) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0); }
function fmtDate(d) { return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

const ESTATUS_COLORES = {
  pendiente:  { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" },
  confirmado: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  en_proceso: { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
  entregado:  { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  cancelado:  { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
};

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
@keyframes spin    { to{transform:rotate(360deg)} }
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Inter',sans-serif; background:#f5f5f0; color:#1a1a1a; min-height:100vh; }
input,select,textarea { font-family:'Inter',sans-serif; }

/* LOGIN */
.login-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1a1a1a 0%,#2d1a0a 100%); padding:24px; }
.login-card { background:#fff; border-radius:20px; padding:40px 36px; width:100%; max-width:380px; box-shadow:0 20px 60px rgba(0,0,0,.3); animation:fadeIn .4s; }
.login-logo { text-align:center; margin-bottom:28px; }
.login-logo-txt { font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:-.5px; }
.login-logo-txt span { color:#E8681A; }
.login-sub { font-size:13px; color:#999; margin-top:4px; font-weight:500; }
.login-label { font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.8px; margin-bottom:5px; display:block; }
.login-inp { width:100%; border:1.5px solid #e5e1db; border-radius:10px; padding:11px 14px; font-size:14px; outline:none; transition:border-color .15s; margin-bottom:14px; }
.login-inp:focus { border-color:#E8681A; }
.login-btn { width:100%; background:#E8681A; color:#fff; border:none; border-radius:12px; padding:14px; font-family:'Inter',sans-serif; font-weight:800; font-size:15px; cursor:pointer; transition:background .15s; margin-top:4px; }
.login-btn:hover { background:#c85515; }
.login-err { background:#fff3f0; border:1.5px solid #ffccc7; border-radius:10px; padding:10px 14px; font-size:13px; color:#c62828; font-weight:600; margin-bottom:14px; }

/* LAYOUT */
.layout { display:flex; min-height:100vh; }
.sidebar { width:220px; background:#1a1a1a; color:#fff; display:flex; flex-direction:column; flex-shrink:0; position:sticky; top:0; height:100vh; overflow-y:auto; }
.sidebar-logo { padding:20px 18px 16px; border-bottom:1px solid rgba(255,255,255,.08); }
.sidebar-logo-txt { font-size:16px; font-weight:900; text-transform:uppercase; letter-spacing:-.3px; }
.sidebar-logo-txt span { color:#E8681A; }
.sidebar-user { font-size:11px; color:#888; margin-top:3px; }
.sidebar-nav { flex:1; padding:12px 0; }
.nav-item { display:flex; align-items:center; gap:10px; padding:10px 18px; font-size:13px; font-weight:600; color:#aaa; cursor:pointer; transition:all .15s; border-left:3px solid transparent; }
.nav-item:hover { color:#fff; background:rgba(255,255,255,.05); }
.nav-item.active { color:#fff; background:rgba(232,104,26,.15); border-left-color:#E8681A; }
.nav-item .ico { font-size:16px; width:20px; text-align:center; }
.sidebar-footer { padding:14px 18px; border-top:1px solid rgba(255,255,255,.08); }
.logout-btn { background:none; border:1.5px solid rgba(255,255,255,.15); border-radius:8px; color:#aaa; font-family:'Inter',sans-serif; font-size:12px; font-weight:600; padding:8px 12px; cursor:pointer; width:100%; transition:all .15s; }
.logout-btn:hover { border-color:#E8681A; color:#E8681A; }

.content { flex:1; overflow-y:auto; }
.page-header { background:#fff; border-bottom:1.5px solid #f0ede8; padding:18px 28px; display:flex; align-items:center; justify-content:space-between; gap:16px; position:sticky; top:0; z-index:10; }
.page-title { font-size:20px; font-weight:800; color:#1a1a1a; }
.page-body { padding:24px 28px; animation:fadeIn .25s; }

/* BOTONES */
.btn { border:none; border-radius:10px; padding:9px 18px; font-family:'Inter',sans-serif; font-weight:700; font-size:13px; cursor:pointer; transition:all .15s; display:inline-flex; align-items:center; gap:7px; }
.btn-primary { background:#E8681A; color:#fff; }
.btn-primary:hover { background:#c85515; }
.btn-secondary { background:#f5f3ef; color:#555; }
.btn-secondary:hover { background:#ede9e3; }
.btn-danger { background:#fef2f2; color:#dc2626; border:1.5px solid #fecaca; }
.btn-danger:hover { background:#fee2e2; }
.btn-sm { padding:6px 12px; font-size:12px; }
.btn:disabled { opacity:.5; cursor:not-allowed; }

/* CARDS / STATS */
.stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14px; margin-bottom:24px; }
.stat-card { background:#fff; border-radius:14px; padding:18px 20px; border:1.5px solid #f0ede8; }
.stat-num { font-size:28px; font-weight:900; color:#1a1a1a; line-height:1; margin-bottom:4px; }
.stat-num.orange { color:#E8681A; }
.stat-lbl { font-size:12px; font-weight:600; color:#aaa; text-transform:uppercase; letter-spacing:.8px; }

/* TABLA */
.table-wrap { background:#fff; border-radius:14px; border:1.5px solid #f0ede8; overflow:hidden; }
.table-toolbar { padding:14px 18px; border-bottom:1px solid #f0ede8; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.search-inp { border:1.5px solid #e5e1db; border-radius:9px; padding:8px 13px; font-size:13px; outline:none; font-family:'Inter',sans-serif; transition:border-color .15s; min-width:200px; }
.search-inp:focus { border-color:#E8681A; }
table { width:100%; border-collapse:collapse; }
th { font-size:11px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:.8px; padding:10px 16px; text-align:left; border-bottom:1px solid #f0ede8; background:#fafaf8; }
td { padding:11px 16px; font-size:13px; border-bottom:1px solid #f9f7f5; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
tr:hover td { background:#fafaf8; }
.prod-thumb { width:42px; height:42px; border-radius:8px; object-fit:cover; background:#f0ede8; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }
.prod-thumb img { width:100%; height:100%; object-fit:cover; }
.badge { display:inline-flex; align-items:center; padding:3px 9px; border-radius:99px; font-size:11px; font-weight:700; }
.badge-green  { background:#f0fdf4; color:#166534; }
.badge-red    { background:#fef2f2; color:#dc2626; }
.badge-orange { background:#fff7ed; color:#9a3412; }
.badge-blue   { background:#eff6ff; color:#1e40af; }
.badge-gray   { background:#f5f5f5; color:#666; }

/* MODAL */
.modal-ov { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:500; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(3px); animation:fadeIn .2s; }
.modal { background:#fff; border-radius:18px; width:100%; max-width:580px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,.2); }
.modal-header { padding:20px 24px; border-bottom:1px solid #f0ede8; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; background:#fff; z-index:1; }
.modal-header h3 { font-size:17px; font-weight:800; }
.modal-body { padding:20px 24px; }
.modal-footer { padding:16px 24px; border-top:1px solid #f0ede8; display:flex; gap:10px; justify-content:flex-end; background:#fafaf8; border-radius:0 0 18px 18px; }

/* FORM */
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-full { grid-column:1/-1; }
.field { display:flex; flex-direction:column; gap:5px; }
.field label { font-size:11px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.8px; }
.field input, .field select, .field textarea { border:1.5px solid #e5e1db; border-radius:10px; padding:9px 13px; font-size:14px; outline:none; transition:border-color .15s; width:100%; }
.field input:focus, .field select:focus, .field textarea:focus { border-color:#E8681A; }
.field textarea { resize:vertical; min-height:70px; }
.toggle-wrap { display:flex; align-items:center; gap:10px; }
.toggle { width:42px; height:24px; background:#e5e1db; border-radius:99px; position:relative; cursor:pointer; transition:background .2s; flex-shrink:0; }
.toggle.on { background:#E8681A; }
.toggle::after { content:''; position:absolute; top:3px; left:3px; width:18px; height:18px; background:#fff; border-radius:50%; transition:transform .2s; box-shadow:0 1px 4px rgba(0,0,0,.2); }
.toggle.on::after { transform:translateX(18px); }

/* FOTOS */
.fotos-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:6px; }
.foto-slot { aspect-ratio:1; border-radius:10px; overflow:hidden; position:relative; background:linear-gradient(135deg,#faf7f4,#f0ede8); border:1.5px solid #ede9e3; display:flex; align-items:center; justify-content:center; }
.foto-slot img { width:100%; height:100%; object-fit:cover; }
.foto-slot .del-foto { position:absolute; top:4px; right:4px; background:rgba(0,0,0,.6); color:#fff; border:none; border-radius:50%; width:22px; height:22px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.foto-add { cursor:pointer; border:2px dashed #e5e1db; color:#ccc; font-size:24px; transition:all .15s; }
.foto-add:hover { border-color:#E8681A; color:#E8681A; background:#fff7f2; }
.upload-progress { height:4px; background:#f0ede8; border-radius:99px; overflow:hidden; margin-top:6px; }
.upload-bar { height:100%; background:#E8681A; border-radius:99px; transition:width .3s; }

/* PEDIDO DETAIL */
.pedido-items { background:#fafaf8; border-radius:12px; padding:14px 16px; }
.pedido-item-row { display:flex; justify-content:space-between; font-size:13px; padding:4px 0; border-bottom:1px solid #f0ede8; }
.pedido-item-row:last-child { border-bottom:none; }
.estatus-select { border:1.5px solid #e5e1db; border-radius:8px; padding:6px 10px; font-size:13px; font-weight:600; font-family:'Inter',sans-serif; outline:none; cursor:pointer; }

/* SPINNER */
.spinner { width:32px; height:32px; border:3px solid #f0ede8; border-top-color:#E8681A; border-radius:50%; animation:spin .7s linear infinite; }
.center-spinner { display:flex; align-items:center; justify-content:center; padding:60px; }

/* TOAST */
.toast-wrap { position:fixed; bottom:24px; right:24px; z-index:999; display:flex; flex-direction:column; gap:8px; }
.toast { background:#1a1a1a; color:#fff; border-radius:12px; padding:12px 18px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; animation:fadeIn .3s; box-shadow:0 4px 20px rgba(0,0,0,.2); min-width:220px; }
.toast.success { background:#166534; }
.toast.error   { background:#dc2626; }

@media(max-width:768px){
  .sidebar { display:none; }
  .form-grid { grid-template-columns:1fr; }
  .fotos-grid { grid-template-columns:repeat(3,1fr); }
  .page-body { padding:16px 14px 80px; }
  .page-header { padding:14px 16px; }
  .page-title { font-size:17px; }
  .table-wrap { overflow-x:auto; }
  .modal { border-radius:0; max-height:100vh; height:100vh; }
  .modal-ov { padding:0; align-items:flex-end; }
}

/* BARRA NAVEGACIÓN INFERIOR MÓVIL */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #1a1a1a;
  border-top: 1px solid rgba(255,255,255,.1);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}
.bottom-nav-inner {
  display: flex;
  align-items: stretch;
}
.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 4px 8px;
  cursor: pointer;
  border: none;
  background: none;
  color: #666;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  gap: 3px;
  transition: color .15s;
  -webkit-tap-highlight-color: transparent;
}
.bottom-nav-item.active { color: #E8681A; }
.bottom-nav-item .ico { font-size: 20px; line-height: 1; }
@media(max-width:768px){
  .bottom-nav { display: block; }
  .layout { padding-bottom: 0; }
}
`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  return { toasts, add };
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === "success" ? "✓" : "✕"} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr]   = useState("");

  const handleLogin = () => {
    const u = USUARIOS.find(x => x.nombre.toLowerCase() === user.toLowerCase() && x.password === pass);
    if (u) { onLogin(u); }
    else { setErr("Usuario o contraseña incorrectos."); }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-txt">TODO EN <span>CAJAS</span>.COM</div>
          <div className="login-sub">Panel de Administración</div>
        </div>
        {err && <div className="login-err">{err}</div>}
        <label className="login-label">Usuario</label>
        <input className="login-inp" placeholder="Tu nombre de usuario" value={user}
          onChange={e => { setUser(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <label className="login-label">Contraseña</label>
        <input className="login-inp" type="password" placeholder="••••••••" value={pass}
          onChange={e => { setPass(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <button className="login-btn" onClick={handleLogin}>Entrar</button>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ usuario, pagina, setPagina, onLogout }) {
  const isAdmin = usuario.rol === "admin";
  const navItems = [
    ...(isAdmin ? [
      { id: "dashboard", ico: "📊", label: "Dashboard" },
      { id: "productos", ico: "📦", label: "Productos" },
    ] : []),
    { id: "pedidos",   ico: "🛒", label: "Pedidos" },
    ...(isAdmin ? [
      { id: "reportes",  ico: "📈", label: "Reportes" },
      { id: "ajustes",   ico: "⚙️",  label: "Ajustes" },
    ] : []),
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-txt">TODO EN <span>CAJAS</span></div>
        <div className="sidebar-user">👤 {usuario.nombre} · {usuario.rol === "admin" ? "Admin" : "Empleado"}</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div key={item.id} className={`nav-item${pagina === item.id ? " active" : ""}`}
            onClick={() => setPagina(item.id)}>
            <span className="ico">{item.ico}</span>{item.label}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ toast }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      sb.get("productos", "?select=id,activo,stock&activo=eq.true"),
      sb.get("pedidos", "?select=id,estatus,subtotal&order=created_at.desc&limit=100"),
    ]).then(([prods, peds]) => {
      const totalProds   = prods.length;
      const stockBajo    = prods.filter(p => p.stock <= 5).length;
      const pedPendientes = peds.filter(p => p.estatus === "pendiente").length;
      const ventasMes    = peds.filter(p => p.estatus === "entregado").reduce((s, p) => s + (p.subtotal || 0), 0);
      setStats({ totalProds, stockBajo, pedPendientes, ventasMes });
    });
  }, []);

  if (!stats) return <div className="center-spinner"><div className="spinner"/></div>;

  return (
    <div className="page-body">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num orange">{stats.totalProds}</div>
          <div className="stat-lbl">Productos activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: stats.stockBajo > 0 ? "#ff9800" : "#22c55e" }}>{stats.stockBajo}</div>
          <div className="stat-lbl">Stock bajo (≤5 pzas)</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: stats.pedPendientes > 0 ? "#E8681A" : "#22c55e" }}>{stats.pedPendientes}</div>
          <div className="stat-lbl">Pedidos pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-num orange">{fmt(stats.ventasMes)}</div>
          <div className="stat-lbl">Ventas entregadas</div>
        </div>
      </div>
      <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #f0ede8", padding:"20px 24px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Accesos rápidos</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ background:"#fff7f2", border:"1.5px solid #fed7aa", borderRadius:12, padding:"14px 18px", fontSize:13, fontWeight:600, color:"#9a3412" }}>
            📦 Ve a <strong>Productos</strong> para agregar fotos y especificaciones a tu catálogo
          </div>
          <div style={{ background:"#eff6ff", border:"1.5px solid #bfdbfe", borderRadius:12, padding:"14px 18px", fontSize:13, fontWeight:600, color:"#1e40af" }}>
            🛒 Revisa <strong>Pedidos</strong> para ver las órdenes recibidas por WhatsApp
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Productos ───────────────────────────────────────────────────────────────
function Productos({ toast }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [modal, setModal]         = useState(null); // null | "nuevo" | producto
  const fileRef = useRef();

  const cargar = () => {
    setLoading(true);
    sb.get("productos", "?order=categoria,nombre&select=*").then(d => { setProductos(d); setLoading(false); });
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.sku?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleActivo = async (prod) => {
    await sb.patch("productos", prod.id, { activo: !prod.activo });
    setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, activo: !p.activo } : p));
    toast.add(`Producto ${!prod.activo ? "activado" : "desactivado"} en inventario`);
  };

  const toggleOnline = async (prod) => {
    await sb.patch("productos", prod.id, { visible_online: !prod.visible_online });
    setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, visible_online: !p.visible_online } : p));
    toast.add(`Tienda online: ${!prod.visible_online ? "✅ visible" : "🔴 oculto"}`);
  };

  return (
    <>
      <div className="page-header">
        <span className="page-title">📦 Productos</span>
        <button className="btn btn-primary" onClick={() => setModal("nuevo")}>+ Nuevo producto</button>
      </div>
      <div className="page-body">
        <div className="table-wrap">
          <div className="table-toolbar">
            <input className="search-inp" placeholder="Buscar por nombre, SKU o categoría…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{filtrados.length} productos</span>
          </div>
          {loading ? <div className="center-spinner"><div className="spinner"/></div> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Inventario</th>
                    <th>Tienda online</th>
                    <th>Fotos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="prod-thumb">
                            {prod.imagenes && prod.imagenes.length > 0
                              ? <img src={prod.imagenes[0]} alt={prod.nombre} />
                              : <span style={{ fontSize: 18 }}>📦</span>}
                          </div>
                          <span style={{ fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                            {prod.nombre}
                          </span>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: "monospace", fontSize: 12, color: "#aaa" }}>{prod.sku}</span></td>
                      <td><span className="badge badge-orange">{prod.categoria || "—"}</span></td>
                      <td><strong>{fmt(prod.precio)}</strong></td>
                      <td>
                        <span className={`badge ${prod.stock <= 5 ? "badge-red" : prod.stock <= 20 ? "badge-orange" : "badge-green"}`}>
                          {prod.stock} pzas
                        </span>
                      </td>
                      <td>
                        <div className="toggle-wrap">
                          <div className={`toggle${prod.activo ? " on" : ""}`} onClick={() => toggleActivo(prod)} />
                          <span style={{ fontSize: 12, color: "#aaa" }}>{prod.activo ? "Sí" : "No"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="toggle-wrap">
                          <div className={`toggle${prod.visible_online ? " on" : ""}`} onClick={() => toggleOnline(prod)} />
                          <span style={{ fontSize: 12, color: prod.visible_online ? "#22c55e" : "#aaa" }}>
                            {prod.visible_online ? "Visible" : "Oculto"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: prod.imagenes?.length > 0 ? "#22c55e" : "#aaa", fontWeight: 600 }}>
                          {prod.imagenes?.length || 0} / 4
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(prod)}>✏️ Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal !== null && (
        <ModalProducto
          prod={modal === "nuevo" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); cargar(); toast.add(modal === "nuevo" ? "Producto creado ✓" : "Producto actualizado ✓"); }}
          toast={toast}
        />
      )}
    </>
  );
}

// ─── Modal Producto ───────────────────────────────────────────────────────────
function ModalProducto({ prod, onClose, onSaved, toast }) {
  const esNuevo = !prod;
  const [form, setForm] = useState({
    nombre:      prod?.nombre      || "",
    sku:         prod?.sku         || "",
    categoria:   prod?.categoria   || "",
    precio:      prod?.precio      || "",
    stock:       prod?.stock       || "",
    material:    prod?.material    || "",
    resistencia:    prod?.resistencia    || "",
    cantidad_atado: prod?.cantidad_atado || "",
    precio_atado:   prod?.precio_atado   || "",
    largo:       prod?.largo       || "",
    ancho:       prod?.ancho       || "",
    alto:        prod?.alto        || "",
    descripcion: prod?.descripcion || "",
    activo:      prod?.activo      ?? true,
    visible_online: prod?.visible_online ?? false,
    imagenes:    prod?.imagenes    || [],
  });
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo]   = useState(false);
  const [progreso, setProgreso]   = useState(0);
  const fileRef = useRef();

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFotos = async (files) => {
    if (form.imagenes.length + files.length > 4) {
      toast.add("Máximo 4 fotos por producto", "error"); return;
    }
    setSubiendo(true);
    setProgreso(0);
    const nuevas = [...form.imagenes];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext  = file.name.split(".").pop();
      const path = `${form.sku || "prod"}-${Date.now()}-${i}.${ext}`;
      try {
        const url = await sb.uploadFoto(file, path);
        nuevas.push(url);
        setProgreso(Math.round(((i + 1) / files.length) * 100));
      } catch (e) {
        toast.add("Error subiendo foto", "error");
      }
    }
    setForm(f => ({ ...f, imagenes: nuevas }));
    setSubiendo(false);
    setProgreso(0);
    toast.add(`${files.length} foto(s) subida(s) ✓`);
  };

  const eliminarFoto = async (idx) => {
    const url = form.imagenes[idx];
    // Extraer path del bucket
    const path = url.split(`/storage/v1/object/public/${BUCKET}/`)[1];
    if (path) await sb.deleteFoto(path);
    setForm(f => ({ ...f, imagenes: f.imagenes.filter((_, i) => i !== idx) }));
    toast.add("Foto eliminada");
  };

  const guardar = async () => {
    if (!form.nombre || !form.sku || !form.precio) {
      toast.add("Nombre, SKU y precio son obligatorios", "error"); return;
    }
    setGuardando(true);
    const data = {
      nombre:      form.nombre,
      sku:         form.sku,
      categoria:   form.categoria,
      precio:      parseFloat(form.precio) || 0,
      stock:       parseInt(form.stock)    || 0,
      material:    form.material,
      resistencia: form.resistencia,
      largo:       parseFloat(form.largo)    || null,
      ancho:       parseFloat(form.ancho)    || null,
      alto:        parseFloat(form.alto)     || null,
      descripcion: form.descripcion,
      activo:      form.activo,
      visible_online: form.visible_online,
      imagenes:    form.imagenes,
    };
    if (esNuevo) await sb.post("productos", data);
    else         await sb.patch("productos", prod.id, data);
    setGuardando(false);
    onSaved();
  };

  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{esNuevo ? "Nuevo producto" : `Editar: ${prod.nombre}`}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Fotos */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: ".8px", display: "block", marginBottom: 8 }}>
              Fotos del producto ({form.imagenes.length}/4)
            </label>
            <div className="fotos-grid">
              {form.imagenes.map((url, i) => (
                <div className="foto-slot" key={i}>
                  <img src={url} alt={`foto-${i}`} />
                  <button className="del-foto" onClick={() => eliminarFoto(i)}>✕</button>
                </div>
              ))}
              {form.imagenes.length < 4 && (
                <div className="foto-slot foto-add" onClick={() => fileRef.current.click()}>
                  {subiendo ? <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} /> : "+"}
                </div>
              )}
            </div>
            {subiendo && (
              <div className="upload-progress">
                <div className="upload-bar" style={{ width: `${progreso}%` }} />
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={e => handleFotos(Array.from(e.target.files))} />
            <p style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>JPG o PNG · Máx. 4 fotos · Se guardan en Supabase Storage</p>
          </div>

          <div className="form-grid">
            <div className="field form-full">
              <label>Nombre *</label>
              <input placeholder="Ej. Caja Regular 22×22×11 cm" value={form.nombre} onChange={setF("nombre")} />
            </div>
            <div className="field">
              <label>SKU *</label>
              <input placeholder="Ej. CJR-001" value={form.sku} onChange={setF("sku")} />
            </div>
            <div className="field">
              <label>Categoría</label>
              <select value={form.categoria} onChange={setF("categoria")}>
                <option value="">Sin categoría</option>
                <option>Saldos</option>
                <option>Alimentos y Bebidas</option>
                <option>Material de Embalaje</option>
                <option>Cajas Armables</option>
                <option>Cajas para Envío</option>
                <option>Cajas Especiales</option>
                <option>Contenedores</option>
                <option>Relleno</option>
                <option>Cintas</option>
                <option>Sobres</option>
              </select>
            </div>
            <div className="field">
              <label>Precio (MXN) *</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.precio} onChange={setF("precio")} />
            </div>
            <div className="field">
              <label>Stock (piezas)</label>
              <input type="number" placeholder="0" value={form.stock} onChange={setF("stock")} />
            </div>

            <div style={{ gridColumn: "1/-1", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: ".8px", paddingTop: 4, paddingBottom: 4, borderBottom: "1px solid #f0ede8" }}>
              Medidas
            </div>
            <div className="field">
              <label>Largo (cm)</label>
              <input type="number" step="0.1" placeholder="0" value={form.largo} onChange={setF("largo")} />
            </div>
            <div className="field">
              <label>Ancho (cm)</label>
              <input type="number" step="0.1" placeholder="0" value={form.ancho} onChange={setF("ancho")} />
            </div>
            <div className="field">
              <label>Alto (cm)</label>
              <input type="number" step="0.1" placeholder="0" value={form.alto} onChange={setF("alto")} />
            </div>
            <div style={{ gridColumn: "1/-1", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: ".8px", paddingTop: 4, paddingBottom: 4, borderBottom: "1px solid #f0ede8" }}>
              Precio por atado
            </div>
            <div className="field">
              <label>Cantidad del atado (pzas)</label>
              <input type="number" placeholder="Ej. 50" value={form.cantidad_atado} onChange={setF("cantidad_atado")} />
            </div>
            <div className="field">
              <label>Precio del atado (MXN)</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.precio_atado} onChange={setF("precio_atado")} />
            </div>

            <div style={{ gridColumn: "1/-1", fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: ".8px", paddingTop: 4, paddingBottom: 4, borderBottom: "1px solid #f0ede8" }}>
              Material
            </div>
            <div className="field">
              <label>Material</label>
              <select value={form.material} onChange={setF("material")}>
                <option value="">—</option>
                <option>Caple</option>
                <option>SBS</option>
                <option>Microcorrugado</option>
                <option>Corrugado</option>
                <option>Doble corrugado</option>
                <option>Rígido</option>
                <option>Bond</option>
                <option>PET</option>
                <option>Lámina</option>
              </select>
            </div>
            {/* Campo dinámico según material */}
            {["Caple","SBS","PET"].includes(form.material) && (
              <div className="field">
                <label>Calibre</label>
                <input placeholder="Ej. 14pt, 18pt" value={form.resistencia} onChange={setF("resistencia")} />
              </div>
            )}
            {["Bond"].includes(form.material) && (
              <div className="field">
                <label>Gramaje</label>
                <input placeholder="Ej. 90g/m², 120g/m²" value={form.resistencia} onChange={setF("resistencia")} />
              </div>
            )}
            {["Microcorrugado","Corrugado","Doble corrugado"].includes(form.material) && (
              <div className="field">
                <label>Resistencia</label>
                <input placeholder="Ej. ECT-32, BCT-150kg" value={form.resistencia} onChange={setF("resistencia")} />
              </div>
            )}

            <div className="field form-full">
              <label>Descripción</label>
              <textarea placeholder="Usos, características especiales…" value={form.descripcion} onChange={setF("descripcion")} />
            </div>

            <div className="field form-full">
              <label>Estado en inventario</label>
              <div className="toggle-wrap">
                <div className={`toggle${form.activo ? " on" : ""}`} onClick={() => setForm(f => ({ ...f, activo: !f.activo }))} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>
                  {form.activo ? "✅ Activo en inventario" : "❌ Inactivo en inventario"}
                </span>
              </div>
            </div>
            <div className="field form-full">
              <label>Visible en tienda online</label>
              <div className="toggle-wrap">
                <div className={`toggle${form.visible_online ? " on" : ""}`} onClick={() => setForm(f => ({ ...f, visible_online: !f.visible_online }))} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>
                  {form.visible_online ? "🌐 Visible en todoencajas.com" : "🔴 Oculto en todoencajas.com"}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
                Actívalo solo cuando quieras que este producto aparezca en la tienda en línea.
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : esNuevo ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────
function Pedidos({ toast, usuario }) {
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtro, setFiltro]     = useState("todos");
  const [detalle, setDetalle]   = useState(null);

  const cargar = () => {
    setLoading(true);
    sb.get("pedidos", "?order=created_at.desc").then(d => { setPedidos(d); setLoading(false); });
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = pedidos.filter(p => filtro === "todos" || p.estatus === filtro);

  const cambiarEstatus = async (id, estatus, notas) => {
    const pedidoActual = pedidos.find(p => p.id === id);

    // Si cambia a "confirmado" y antes NO era confirmado → descontar stock
    if (estatus === "confirmado" && pedidoActual?.estatus !== "confirmado") {
      try {
        const items = typeof pedidoActual.items === "string"
          ? JSON.parse(pedidoActual.items)
          : pedidoActual.items || [];

        for (const item of items) {
          // Obtener stock actual
          const prods = await sb.get("productos", `?id=eq.${item.id}&select=id,stock`);
          if (prods && prods.length > 0) {
            const nuevoStock = Math.max(0, (prods[0].stock || 0) - (item.qty || 1));
            await sb.patch("productos", item.id, { stock: nuevoStock });
          }
        }
        toast.add("✅ Stock descontado del inventario");
      } catch(e) {
        console.error("Error descontando stock:", e);
        toast.add("⚠️ Error al descontar stock", "error");
      }
    }

    // Si cambia de "confirmado" a otro estado (ej. cancelado) → restaurar stock
    if (pedidoActual?.estatus === "confirmado" && estatus === "cancelado") {
      try {
        const items = typeof pedidoActual.items === "string"
          ? JSON.parse(pedidoActual.items)
          : pedidoActual.items || [];

        for (const item of items) {
          const prods = await sb.get("productos", `?id=eq.${item.id}&select=id,stock`);
          if (prods && prods.length > 0) {
            const stockRestaurado = (prods[0].stock || 0) + (item.qty || 1);
            await sb.patch("productos", item.id, { stock: stockRestaurado });
          }
        }
        toast.add("↩️ Stock restaurado por cancelación");
      } catch(e) {
        console.error("Error restaurando stock:", e);
      }
    }

    await sb.patch("pedidos", id, { estatus, notas });
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estatus, notas } : p));
    setDetalle(prev => prev ? { ...prev, estatus, notas } : null);
    toast.add(`Estatus actualizado: ${estatus}`);
  };

  const FILTROS = ["todos", "pendiente", "confirmado", "en_proceso", "entregado", "cancelado"];

  return (
    <>
      <div className="page-header">
        <span className="page-title">🛒 Pedidos</span>
        <button className="btn btn-secondary btn-sm" onClick={cargar}>↻ Actualizar</button>
      </div>
      <div className="page-body">
        {/* Filtros estatus */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {FILTROS.map(f => (
            <button key={f} className={`btn btn-sm ${filtro === f ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFiltro(f)}>
              {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
              {f !== "todos" && <span style={{ background: "rgba(255,255,255,.25)", borderRadius: 99, padding: "0 6px", marginLeft: 4, fontSize: 11 }}>
                {pedidos.filter(p => p.estatus === f).length}
              </span>}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          {loading ? <div className="center-spinner"><div className="spinner"/></div> : filtrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#bbb" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <p style={{ fontWeight: 600 }}>No hay pedidos {filtro !== "todos" ? `con estatus "${filtro}"` : "aún"}</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Entrega</th>
                    <th>Subtotal</th>
                    <th>Estatus</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(ped => {
                    const ec = ESTATUS_COLORES[ped.estatus] || ESTATUS_COLORES.pendiente;
                    return (
                      <tr key={ped.id}>
                        <td style={{ fontFamily: "monospace", color: "#aaa", fontSize: 12 }}>#{ped.id}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{ped.nombre}</div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>{ped.telefono}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: 12 }}>
                            {ped.entrega === "tienda" ? "🏪 Tienda" : ped.entrega === "cdmx" ? "🚚 CDMX" : "📦 Foráneo"}
                          </span>
                          {ped.colonia && <div style={{ fontSize: 11, color: "#aaa" }}>{ped.colonia}</div>}
                          {ped.estado  && <div style={{ fontSize: 11, color: "#aaa" }}>{ped.estado}</div>}
                        </td>
                        <td><strong>{fmt(ped.subtotal)}</strong></td>
                        <td>
                          <span className="badge" style={{ background: ec.bg, color: ec.color, border: `1px solid ${ec.border}` }}>
                            {ped.estatus?.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>{fmtDate(ped.created_at)}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => setDetalle(ped)}>Ver</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detalle && (
        <ModalPedido pedido={detalle} onClose={() => setDetalle(null)}
          onCambiarEstatus={cambiarEstatus} toast={toast} />
      )}
    </>
  );
}

// ─── Modal Pedido ─────────────────────────────────────────────────────────────
function getMsgWA(pedido, costoEnvio = "") {
  const id = pedido.id;
  const nombre = pedido.nombre;
  const tel = pedido.telefono?.replace(/\D/g, "");
  const entrega = pedido.entrega;
  const subtotal = pedido.subtotal || 0;
  const esGratis = entrega === "cdmx" && subtotal >= 8000;

  let msg = "";
  if (entrega === "tienda") {
    msg = `Hola ${nombre}, recibimos tu pedido #${id} ✅. Ya está siendo procesado. Te avisamos en cuanto esté listo para recoger en tienda. ¡Gracias por tu compra en Todo en Cajas! 📦`;
  } else if (entrega === "cdmx" && esGratis) {
    msg = `Hola ${nombre}, recibimos tu pedido #${id} ✅. Tu pedido supera los $8,000 por lo que el envío es *completamente gratis* 🎉. En breve coordinamos la entrega. ¿A qué hora te queda mejor recibirlo?`;
  } else if (entrega === "cdmx" && !esGratis) {
    msg = `Hola ${nombre}, recibimos tu pedido #${id} ✅. Para la entrega en CDMX el costo de envío a tu zona es de *$${costoEnvio || "___"}*. ¿Confirmamos el pedido con ese costo?`;
  } else {
    msg = `Hola ${nombre}, recibimos tu pedido #${id} ✅. Para el envío a *${pedido.estado || "tu estado"}* el costo por paquetería es de *$${costoEnvio || "___"}*. ¿Confirmamos?`;
  }
  return { url: `https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`, esGratis, entrega };
}

function getMsgEntregado(pedido) {
  const tel = pedido.telefono?.replace(/\D/g, "");
  const msg = `Hola ${pedido.nombre}, tu pedido #${pedido.id} fue entregado con éxito ✅. ¡Muchas gracias por tu compra en Todo en Cajas! Si necesitas algo más, aquí estamos 📦`;
  return `https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`;
}

function ModalPedido({ pedido, onClose, onCambiarEstatus }) {
  const [estatus, setEstatus]     = useState(pedido.estatus);
  const [notas, setNotas]         = useState(pedido.notas || "");
  const [costoEnvio, setCostoEnvio] = useState("");
  const ec = ESTATUS_COLORES[estatus] || ESTATUS_COLORES.pendiente;
  const items = typeof pedido.items === "string" ? JSON.parse(pedido.items) : pedido.items || [];
  const necesitaCosto = (pedido.entrega === "cdmx" && (pedido.subtotal || 0) < 8000) || pedido.entrega === "foraneo";
  const waInfo = getMsgWA(pedido, costoEnvio);

  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Pedido #{pedido.id}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Cliente */}
          <div style={{ background: "#fafaf8", border: "1.5px solid #f0ede8", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8 }}>Cliente</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{pedido.nombre}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>📱 {pedido.telefono}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              {pedido.entrega === "tienda" ? "🏪 Recoger en tienda"
                : pedido.entrega === "cdmx" ? `🚚 CDMX${pedido.colonia ? ` · ${pedido.colonia}` : ""}${pedido.direccion ? ` · ${pedido.direccion}` : ""}`
                : `📦 Foráneo · ${pedido.estado || ""}${pedido.ciudad ? `, ${pedido.ciudad}` : ""}`}
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{fmtDate(pedido.created_at)}</div>
          </div>

          {/* Productos */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8 }}>Productos</div>
            <div className="pedido-items">
              {items.map((item, i) => (
                <div className="pedido-item-row" key={i}>
                  <span>{item.nombre} ×{item.qty}</span>
                  <strong>{fmt(item.precio * item.qty)}</strong>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14, paddingTop: 8, marginTop: 4 }}>
                <span>Subtotal</span>
                <span style={{ color: ORANGE }}>{fmt(pedido.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Notificar al cliente por WhatsApp */}
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 10 }}>
              💬 Notificar al cliente por WhatsApp
            </div>

            {/* Si necesita costo de envío, mostrar campo */}
            {necesitaCosto && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: ".8px", display: "block", marginBottom: 4 }}>
                  Costo de envío a cotizar ($)
                </label>
                <input
                  type="number"
                  placeholder="Ej. 150"
                  value={costoEnvio}
                  onChange={e => setCostoEnvio(e.target.value)}
                  style={{ border: "1.5px solid #e5e1db", borderRadius: 8, padding: "7px 12px", fontSize: 14, fontFamily: "Inter,sans-serif", outline: "none", width: "100%" }}
                />
                <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Llena el costo antes de enviar el mensaje al cliente.</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Botón confirmar pedido */}
              <a href={waInfo.url} target="_blank" rel="noopener noreferrer"
                style={{ background: "#25D366", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                <span>💬</span>
                {pedido.entrega === "tienda" ? "Confirmar — Recoger en tienda"
                  : waInfo.esGratis ? "Confirmar — Envío gratis CDMX 🎉"
                  : pedido.entrega === "cdmx" ? "Confirmar — Cotizar envío CDMX"
                  : "Confirmar — Cotizar envío foráneo"}
              </a>

              {/* Botón entregado */}
              <a href={getMsgEntregado(pedido)} target="_blank" rel="noopener noreferrer"
                style={{ background: "#166534", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                <span>✅</span> Notificar entrega al cliente
              </a>
            </div>
          </div>

          {/* Estatus */}
          <div className="field">
            <label>Estatus del pedido</label>
            <select className="estatus-select" value={estatus} onChange={e => setEstatus(e.target.value)}
              style={{ borderColor: ec.border, color: ec.color, background: ec.bg }}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_proceso">En proceso</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Notas */}
          <div className="field">
            <label>Notas internas</label>
            <textarea placeholder="Observaciones, acuerdos con el cliente…" value={notas}
              onChange={e => setNotas(e.target.value)} style={{ minHeight: 60 }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={() => { onCambiarEstatus(pedido.id, estatus, notas); onClose(); }}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reportes ─────────────────────────────────────────────────────────────────
function Reportes() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      sb.get("pedidos", "?select=id,estatus,subtotal,items,created_at&order=created_at.desc"),
      sb.get("productos", "?select=id,nombre,stock,imagenes&activo=eq.true&order=stock.asc&limit=5"),
    ]).then(([pedidos, stockBajo]) => {
      const entregados = pedidos.filter(p => p.estatus === "entregado");
      const totalVentas = entregados.reduce((s, p) => s + (p.subtotal || 0), 0);
      const porEstatus = {};
      pedidos.forEach(p => { porEstatus[p.estatus] = (porEstatus[p.estatus] || 0) + 1; });

      // Productos más pedidos
      const conteo = {};
      pedidos.forEach(p => {
        const items = typeof p.items === "string" ? JSON.parse(p.items) : p.items || [];
        items.forEach(i => { conteo[i.nombre] = (conteo[i.nombre] || 0) + (i.qty || 1); });
      });
      const masVendidos = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);

      setData({ pedidos, totalVentas, porEstatus, masVendidos, stockBajo });
    });
  }, []);

  if (!data) return <div className="center-spinner"><div className="spinner"/></div>;

  return (
    <div className="page-body">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num orange">{fmt(data.totalVentas)}</div>
          <div className="stat-lbl">Total ventas entregadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{data.pedidos.length}</div>
          <div className="stat-lbl">Pedidos totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-num orange">{data.porEstatus.pendiente || 0}</div>
          <div className="stat-lbl">Pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: "#22c55e" }}>{data.porEstatus.entregado || 0}</div>
          <div className="stat-lbl">Entregados</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Más vendidos */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #f0ede8", padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
            🏆 Productos más pedidos
          </div>
          {data.masVendidos.length === 0
            ? <p style={{ fontSize: 13, color: "#bbb" }}>Sin datos aún</p>
            : data.masVendidos.map(([nombre, qty], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < data.masVendidos.length - 1 ? "1px solid #f0ede8" : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{i + 1}. {nombre}</span>
                <span className="badge badge-orange">{qty} pzas</span>
              </div>
            ))}
        </div>

        {/* Stock bajo */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #f0ede8", padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
            ⚠️ Stock más bajo
          </div>
          {data.stockBajo.length === 0
            ? <p style={{ fontSize: 13, color: "#bbb" }}>Todo bien con el stock</p>
            : data.stockBajo.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < data.stockBajo.length - 1 ? "1px solid #f0ede8" : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 600, maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</span>
                <span className={`badge ${p.stock <= 5 ? "badge-red" : "badge-orange"}`}>{p.stock} pzas</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Ajustes ──────────────────────────────────────────────────────────────────
function Ajustes({ usuario, toast }) {
  const [passActual, setPassActual]   = useState("");
  const [passNueva, setPassNueva]     = useState("");
  const [passConfirm, setPassConfirm] = useState("");

  const cambiarPass = () => {
    const u = USUARIOS.find(x => x.id === usuario.id);
    if (u.password !== passActual)  { toast.add("Contraseña actual incorrecta", "error"); return; }
    if (passNueva !== passConfirm)  { toast.add("Las contraseñas no coinciden", "error"); return; }
    if (passNueva.length < 8)       { toast.add("Mínimo 8 caracteres", "error"); return; }
    u.password = passNueva;
    setPassActual(""); setPassNueva(""); setPassConfirm("");
    toast.add("Contraseña actualizada ✓");
  };

  return (
    <div className="page-body">
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #f0ede8", padding: "24px", maxWidth: 480 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>🔒 Cambiar contraseña</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Contraseña actual</label>
            <input type="password" value={passActual} onChange={e => setPassActual(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field">
            <label>Nueva contraseña</label>
            <input type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>
          <div className="field">
            <label>Confirmar nueva contraseña</label>
            <input type="password" value={passConfirm} onChange={e => setPassConfirm(e.target.value)} placeholder="Repite la nueva contraseña" />
          </div>
          <button className="btn btn-primary" onClick={cambiarPass}>Cambiar contraseña</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #f0ede8", padding: "24px", maxWidth: 480, marginTop: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>👥 Usuarios del panel</div>
        {USUARIOS.map(u => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0ede8" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{u.nombre}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>Contraseña: {u.id === usuario.id ? u.password : "••••••••"}</div>
            </div>
            <span className={`badge ${u.rol === "admin" ? "badge-orange" : "badge-blue"}`}>
              {u.rol === "admin" ? "Admin" : "Empleado"}
            </span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#bbb", marginTop: 10 }}>Para agregar usuarios, edita el archivo y agrega una entrada en USUARIOS.</p>
      </div>
    </div>
  );
}

function BottomNav({ usuario, pagina, setPagina, onLogout }) {
  const isAdmin = usuario.rol === "admin";
  const items = [
    ...(isAdmin ? [{ id: "dashboard", ico: "📊", label: "Inicio" }] : []),
    ...(isAdmin ? [{ id: "productos", ico: "📦", label: "Productos" }] : []),
    { id: "pedidos", ico: "🛒", label: "Pedidos" },
    ...(isAdmin ? [{ id: "reportes", ico: "📈", label: "Reportes" }] : []),
    ...(isAdmin ? [{ id: "ajustes", ico: "⚙️", label: "Ajustes" }] : []),
  ];
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map(item => (
          <button key={item.id} className={`bottom-nav-item${pagina === item.id ? " active" : ""}`}
            onClick={() => setPagina(item.id)}>
            <span className="ico">{item.ico}</span>
            {item.label}
          </button>
        ))}
        <button className="bottom-nav-item" onClick={onLogout}>
          <span className="ico">🚪</span>
          Salir
        </button>
      </div>
    </nav>
  );
}


export default function AdminApp() {
  const [usuario, setUsuario] = useState(null);
  const [pagina, setPagina]   = useState("dashboard");
  const toast = useToast();

  const onLogin = (u) => {
    setUsuario(u);
    setPagina(u.rol === "admin" ? "dashboard" : "pedidos");
  };

  if (!usuario) return (
    <>
      <style>{css}</style>
      <Login onLogin={onLogin} />
      <ToastContainer toasts={toast.toasts} />
    </>
  );

  const PAGE_TITLES = { dashboard: "Dashboard", productos: "Productos", pedidos: "Pedidos", reportes: "Reportes", ajustes: "Ajustes" };

  return (
    <>
      <style>{css}</style>
      <div className="layout">
        <Sidebar usuario={usuario} pagina={pagina} setPagina={setPagina} onLogout={() => setUsuario(null)} />
        <div className="content">
          {pagina === "dashboard" && usuario.rol === "admin" && <><div className="page-header"><span className="page-title">📊 Dashboard</span></div><Dashboard toast={toast}/></>}
          {pagina === "productos" && usuario.rol === "admin" && <Productos toast={toast} />}
          {pagina === "pedidos"   && <Pedidos toast={toast} usuario={usuario} />}
          {pagina === "reportes"  && usuario.rol === "admin" && <><div className="page-header"><span className="page-title">📈 Reportes</span></div><Reportes/></>}
          {pagina === "ajustes"   && usuario.rol === "admin" && <><div className="page-header"><span className="page-title">⚙️ Ajustes</span></div><Ajustes usuario={usuario} toast={toast}/></>}
        </div>
        <BottomNav usuario={usuario} pagina={pagina} setPagina={setPagina} onLogout={() => setUsuario(null)} />
      </div>
      <ToastContainer toasts={toast.toasts} />
    </>
  );
}
