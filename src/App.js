import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import './index.css';

import Login      from './pages/Login';
import Menu       from './pages/Menu';
import CongTy     from './pages/CongTy';
import DanhMuc    from './pages/DanhMuc';
import NhapLieu   from './pages/NhapLieu';
import NhapXuatTon from './pages/NhapXuatTon';
import ChiTiet    from './pages/ChiTiet';
import InPhieu    from './pages/InPhieu';
import QuanLyUser from './pages/QuanLyUser';
import Backup     from './pages/Backup';
import { getCongTy } from './utils/api';

const ALL_NAV = [
  { to: '/',             icon: '🏠', label: 'Menu chính',       key: null },
  { to: '/cong-ty',     icon: '🏢', label: 'Thông tin DN',      key: 'cong-ty' },
  { to: '/danh-muc',    icon: '📦', label: 'Danh mục VTHH',    key: 'danh-muc' },
  { to: '/nhap-lieu',   icon: '✏️',  label: 'Nhập liệu',        key: 'nhap-lieu' },
  { to: '/nxt',         icon: '📊', label: 'Nhập - Xuất - Tồn', key: 'nxt' },
  { to: '/chi-tiet',    icon: '🔍', label: 'Chi tiết N-X-T',   key: 'chi-tiet' },
  { to: '/in-phieu',    icon: '🖨️', label: 'In phiếu',          key: 'in-phieu' },
  { to: '/backup',      icon: '💾', label: 'Backup DB',          key: '__admin__' },
  { to: '/quan-ly-user',icon: '👥', label: 'Quản lý User',      key: '__admin__' },
];

function Sidebar({ cty, user, onLogout }) {
  const isAdmin = user?.role === 'admin';
  const menus   = user?.menus || [];

  const navItems = ALL_NAV.filter(n => {
    if (!n.key) return true;                    // Menu chính — luôn hiện
    if (n.key === '__admin__') return isAdmin;  // Quản lý user — chỉ admin
    return isAdmin || menus.includes(n.key);    // Các menu khác theo quyền
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🏭 SUNRISE KHO</h1>
        <p>{cty?.ten_kho || 'Tô Ký'} · {cty?.nam || 2026}</p>
      </div>
      <nav>
        {navItems.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>👤 {user?.ho_ten || user?.username}</span>
        <span style={{ fontSize: 10, color: '#5a9e78' }}>
          {user?.role === 'admin' ? '👑 Quản trị viên' : '👤 Nhân viên'}
        </span>
        <button onClick={onLogout} style={{
          marginTop: 6, padding: '5px 10px', background: 'transparent',
          border: '1px solid #2d5c47', borderRadius: 4, color: '#7ec8a0',
          cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', textAlign: 'left',
        }}>
          🚪 Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function PageHeader({ user }) {
  const loc = useLocation();
  const current = ALL_NAV.find(n => n.to === loc.pathname) || { label: 'Hệ thống quản lý kho' };
  const now = new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
  return (
    <div className="topbar">
      <span className="topbar-title">{current.icon} {current.label}</span>
      <span>{now}</span>
    </div>
  );
}

// Guard route theo quyền
function ProtectedRoute({ menuKey, user, children }) {
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return children;
  if (!menuKey) return children;
  if (menuKey === '__admin__') return <Navigate to="/" />;
  if (!user.menus?.includes(menuKey)) {
    return (
      <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>
        🔒 Bạn không có quyền truy cập trang này
      </div>
    );
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sk_user')); } catch { return null; }
  });
  const [cty, setCty] = useState(null);
  const timerRef = useRef(null);

  // Auto-logout sau timeout_phut phút không hoạt động
  const resetTimer = useCallback(() => {
    if (!user) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const minutes = user.timeout_phut || 30;
    timerRef.current = setTimeout(() => {
      localStorage.removeItem('sk_user');
      setUser(null);
      alert(`⏰ Phiên làm việc đã hết hạn sau ${minutes} phút không hoạt động. Vui lòng đăng nhập lại.`);
    }, minutes * 60 * 1000);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown','mousemove','keydown','scroll','touchstart','click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // bắt đầu timer ngay khi login
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);

  useEffect(() => {
    if (user) getCongTy().then(setCty).catch(() => {});
  }, [user]);

  const handleLogin = (u) => { setUser(u); };
  const handleLogout = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    localStorage.removeItem('sk_user');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar cty={cty} user={user} onLogout={handleLogout} />
        <div className="main">
          <PageHeader user={user} />
          <div className="content">
            <Routes>
              <Route path="/"              element={<Menu cty={cty} user={user} />} />
              <Route path="/cong-ty"       element={<ProtectedRoute menuKey="cong-ty"    user={user}><CongTy onSave={setCty} /></ProtectedRoute>} />
              <Route path="/danh-muc"      element={<ProtectedRoute menuKey="danh-muc"   user={user}><DanhMuc /></ProtectedRoute>} />
              <Route path="/nhap-lieu"     element={<ProtectedRoute menuKey="nhap-lieu"  user={user}><NhapLieu /></ProtectedRoute>} />
              <Route path="/nxt"           element={<ProtectedRoute menuKey="nxt"        user={user}><NhapXuatTon /></ProtectedRoute>} />
              <Route path="/chi-tiet"      element={<ProtectedRoute menuKey="chi-tiet"   user={user}><ChiTiet /></ProtectedRoute>} />
              <Route path="/in-phieu"       element={<ProtectedRoute menuKey="in-phieu"   user={user}><InPhieu /></ProtectedRoute>} />
              <Route path="/backup"         element={<ProtectedRoute menuKey="__admin__"  user={user}><Backup /></ProtectedRoute>} />
              <Route path="/quan-ly-user"   element={<ProtectedRoute menuKey="__admin__"  user={user}><QuanLyUser /></ProtectedRoute>} />
              <Route path="*"              element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
