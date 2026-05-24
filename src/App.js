import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import './index.css';

import Login         from './pages/Login';
import Menu          from './pages/Menu';
import CongTy        from './pages/CongTy';
import DanhMuc       from './pages/DanhMuc';
import NhapLieu      from './pages/NhapLieu';
import NhapXuatTon   from './pages/NhapXuatTon';
import ChiTiet       from './pages/ChiTiet';
import InPhieu       from './pages/InPhieu';
import QuanLyUser    from './pages/QuanLyUser';
import QuanLyCongTy  from './pages/QuanLyCongTy';
import Backup        from './pages/Backup';
import DoiMatKhau    from './pages/DoiMatKhau';
import { getCongTy } from './utils/api';

const ALL_NAV = [
  { to:'/',              icon:'🏠', label:'Menu chính',       key:null },
  { to:'/cong-ty',      icon:'🏢', label:'Thông tin DN',      key:'cong-ty' },
  { to:'/danh-muc',     icon:'📦', label:'Danh mục VTHH',    key:'danh-muc' },
  { to:'/nhap-lieu',    icon:'✏️',  label:'Nhập liệu',        key:'nhap-lieu' },
  { to:'/nxt',          icon:'📊', label:'Nhập - Xuất - Tồn', key:'nxt' },
  { to:'/chi-tiet',     icon:'🔍', label:'Chi tiết N-X-T',   key:'chi-tiet' },
  { to:'/in-phieu',     icon:'🖨️', label:'In phiếu',          key:'in-phieu' },
  { to:'/backup',       icon:'💾', label:'Backup DB',          key:'__admin__' },
  { to:'/ql-cong-ty',   icon:'🏭', label:'Quản lý công ty',   key:'__admin__' },
  { to:'/quan-ly-user', icon:'👥', label:'Quản lý User',      key:'__admin__' },
  { to:'/doi-mat-khau',  icon:'🔑', label:'Đổi mật khẩu',     key:'__self__' },
];

function Sidebar({ cty, user, onLogout, onSwitchCompany }) {
  const isAdmin = user?.role === 'admin';
  const menus   = user?.menus || [];

  const navItems = ALL_NAV.filter(n => {
    if (!n.key) return true;
    if (n.key === '__admin__') return isAdmin;
    if (n.key === '__self__') return true; // Mọi user đều thấy
    return isAdmin || menus.includes(n.key);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🏭 QUẢN LÝ KHO</h1>
        <p style={{fontSize:11, color:'#7ec8a0', lineHeight:1.4}}>
          {cty?.ten_kho || '...'} · {cty?.nam || 2026}
        </p>
        {/* Tên công ty — click để đổi (Admin) */}
        <div style={{
          marginTop:6, padding:'4px 8px', background:'rgba(255,255,255,.1)',
          borderRadius:4, fontSize:11, color:'#a8d8c0', lineHeight:1.3,
        }}>
          {cty?.ten_cong_ty || '...'}
        </div>
        {isAdmin && (
          <button
            onClick={onSwitchCompany}
            style={{
              marginTop:6, width:'100%', padding:'4px 8px',
              background:'transparent', border:'1px solid #2d5c47',
              borderRadius:4, color:'#7ec8a0', cursor:'pointer',
              fontSize:11, fontFamily:'inherit',
            }}
          >
            🔄 Đổi công ty
          </button>
        )}
      </div>
      <nav>
        {navItems.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to==='/'}
            className={({isActive})=>isActive?'active':''}>
            <span className="icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer" style={{display:'flex',flexDirection:'column',gap:4}}>
        <span>👤 {user?.ho_ten || user?.username}</span>
        <span style={{fontSize:10,color:'#5a9e78'}}>
          {user?.role==='admin' ? '👑 Quản trị viên' : '👤 Nhân viên'}
        </span>
        <button onClick={onLogout} style={{
          marginTop:6, padding:'5px 10px', background:'transparent',
          border:'1px solid #2d5c47', borderRadius:4, color:'#7ec8a0',
          cursor:'pointer', fontSize:12, fontFamily:'inherit', textAlign:'left',
        }}>
          🚪 Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function PageHeader() {
  const loc = useLocation();
  const current = ALL_NAV.find(n=>n.to===loc.pathname) || {label:'Hệ thống quản lý kho'};
  const now = new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
  return (
    <div className="topbar">
      <span className="topbar-title">{current.icon} {current.label}</span>
      <span>{now}</span>
    </div>
  );
}

function ProtectedRoute({ menuKey, user, children }) {
  if (!user) return <Navigate to="/login"/>;
  if (user.role==='admin') return children;
  if (!menuKey) return children;
  if (menuKey==='__admin__') return <div style={{textAlign:'center',padding:60,color:'#aaa'}}>🔒 Chỉ Admin được truy cập</div>;
  if (!user.menus?.includes(menuKey)) return <div style={{textAlign:'center',padding:60,color:'#aaa'}}>🔒 Bạn không có quyền truy cập trang này</div>;
  return children;
}

// Modal đổi công ty cho Admin
function SwitchCompanyModal({ user, onSelect, onClose }) {
  const dsCty = user?.ds_cong_ty || [];
  const [loading, setLoading] = useState(false);
  const { selectCompany } = require('./utils/api');

  const handle = async (ctyId) => {
    setLoading(true);
    try {
      const cty = await selectCompany(ctyId);
      onSelect(cty);
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-header">
          <h3>🔄 Đổi công ty</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:13,color:'#555',marginBottom:14}}>Chọn công ty để làm việc:</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {dsCty.map(ct=>(
              <button key={ct.id} onClick={()=>handle(ct.id)} disabled={loading}
                style={{
                  padding:'12px 16px', background:'#f5f5f5', border:'2px solid #e0e0e0',
                  borderRadius:8, cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                  opacity: loading?.6:1,
                }}
                onMouseEnter={e=>{e.currentTarget.style.background='#e8f5e9';e.currentTarget.style.borderColor='#2d7a50';}}
                onMouseLeave={e=>{e.currentTarget.style.background='#f5f5f5';e.currentTarget.style.borderColor='#e0e0e0';}}
              >
                <div style={{fontWeight:700,fontSize:14,color:'#1b3a2f'}}>{ct.ten_cong_ty}</div>
                <div style={{fontSize:12,color:'#888',marginTop:2}}>Kho: {ct.ten_kho} | Năm: {ct.nam}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(()=>{ try { return JSON.parse(localStorage.getItem('sk_user')); } catch { return null; } });
  const [cty, setCty]   = useState(()=>{ try { return JSON.parse(localStorage.getItem('sk_user'))?.cong_ty; } catch { return null; } });
  const [showSwitch, setShowSwitch] = useState(false);
  const timerRef = useRef(null);

  // Auto-logout
  const resetTimer = useCallback(()=>{
    if (!user) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const minutes = user.timeout_phut || 30;
    timerRef.current = setTimeout(()=>{
      localStorage.removeItem('sk_user');
      setUser(null); setCty(null);
      alert(`⏰ Phiên làm việc hết hạn sau ${minutes} phút không hoạt động.`);
    }, minutes*60*1000);
  },[user]);

  useEffect(()=>{
    if (!user) return;
    const events=['mousedown','mousemove','keydown','scroll','touchstart','click'];
    events.forEach(e=>window.addEventListener(e,resetTimer,{passive:true}));
    resetTimer();
    return ()=>{ events.forEach(e=>window.removeEventListener(e,resetTimer)); if(timerRef.current) clearTimeout(timerRef.current); };
  },[user,resetTimer]);

  // Load thông tin công ty mới nhất
  useEffect(()=>{
    if (user?.cong_ty?.id) getCongTy().then(setCty).catch(()=>{});
  },[user]);

  const handleLogin = (u) => {
    setUser(u);
    setCty(u.cong_ty);
  };

  const handleLogout = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    localStorage.removeItem('sk_user');
    setUser(null); setCty(null);
  };

  const handleSwitchCompany = (newCty) => {
    const updated = { ...user, cong_ty: newCty };
    localStorage.setItem('sk_user', JSON.stringify(updated));
    setUser(updated);
    setCty(newCty);
    setShowSwitch(false);
    window.location.reload(); // reload để các component fetch lại data
  };

  if (!user || !user.cong_ty) return <Login onLogin={handleLogin}/>;

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar
          cty={cty} user={user}
          onLogout={handleLogout}
          onSwitchCompany={()=>setShowSwitch(true)}
        />
        <div className="main">
          <PageHeader/>
          <div className="content">
            <Routes>
              <Route path="/"             element={<Menu cty={cty} user={user}/>}/>
              <Route path="/cong-ty"      element={<ProtectedRoute menuKey="cong-ty"   user={user}><CongTy onSave={setCty}/></ProtectedRoute>}/>
              <Route path="/danh-muc"     element={<ProtectedRoute menuKey="danh-muc"  user={user}><DanhMuc/></ProtectedRoute>}/>
              <Route path="/nhap-lieu"    element={<ProtectedRoute menuKey="nhap-lieu" user={user}><NhapLieu/></ProtectedRoute>}/>
              <Route path="/nxt"          element={<ProtectedRoute menuKey="nxt"       user={user}><NhapXuatTon/></ProtectedRoute>}/>
              <Route path="/chi-tiet"     element={<ProtectedRoute menuKey="chi-tiet"  user={user}><ChiTiet/></ProtectedRoute>}/>
              <Route path="/in-phieu"     element={<ProtectedRoute menuKey="in-phieu"  user={user}><InPhieu/></ProtectedRoute>}/>
              <Route path="/backup"       element={<ProtectedRoute menuKey="__admin__" user={user}><Backup/></ProtectedRoute>}/>
              <Route path="/ql-cong-ty"   element={<ProtectedRoute menuKey="__admin__" user={user}><QuanLyCongTy/></ProtectedRoute>}/>
              <Route path="/quan-ly-user" element={<ProtectedRoute menuKey="__admin__" user={user}><QuanLyUser/></ProtectedRoute>}/>
              <Route path="/doi-mat-khau"  element={<DoiMatKhau user={user}/>}/>
              <Route path="*"             element={<Navigate to="/"/>}/>
            </Routes>
          </div>
        </div>

        {showSwitch && (
          <SwitchCompanyModal
            user={user}
            onSelect={handleSwitchCompany}
            onClose={()=>setShowSwitch(false)}
          />
        )}
      </div>
    </BrowserRouter>
  );
}
