import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import './index.css';

import Menu from './pages/Menu';
import CongTy from './pages/CongTy';
import DanhMuc from './pages/DanhMuc';
import NhapLieu from './pages/NhapLieu';
import NhapXuatTon from './pages/NhapXuatTon';
import ChiTiet from './pages/ChiTiet';
import InPhieu from './pages/InPhieu';
import { getCongTy } from './utils/api';

const NAV = [
  { to: '/',         icon: '🏠', label: 'Menu chính' },
  { to: '/cong-ty',  icon: '🏢', label: 'Thông tin DN' },
  { to: '/danh-muc', icon: '📦', label: 'Danh mục VTHH' },
  { to: '/nhap-lieu',icon: '✏️',  label: 'Nhập liệu' },
  { to: '/nxt',      icon: '📊', label: 'Nhập - Xuất - Tồn' },
  { to: '/chi-tiet', icon: '🔍', label: 'Chi tiết N-X-T' },
  { to: '/in-phieu', icon: '🖨️', label: 'In phiếu' },
];

function Sidebar({ cty }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🏭 SUNRISE KHO</h1>
        <p>{cty?.ten_kho || 'Tô Ký'} · {cty?.nam || 2026}</p>
      </div>
      <nav>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        CÔNG TY TNHH THỜI TRANG SUNRISE
      </div>
    </aside>
  );
}

function PageHeader() {
  const loc = useLocation();
  const current = NAV.find(n => n.to === loc.pathname) || { label: 'Hệ thống quản lý kho' };
  const now = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  return (
    <div className="topbar">
      <span className="topbar-title">{current.icon} {current.label}</span>
      <span>{now}</span>
    </div>
  );
}

export default function App() {
  const [cty, setCty] = useState(null);
  useEffect(() => { getCongTy().then(setCty).catch(() => {}); }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar cty={cty} />
        <div className="main">
          <PageHeader />
          <div className="content">
            <Routes>
              <Route path="/"          element={<Menu cty={cty} />} />
              <Route path="/cong-ty"   element={<CongTy onSave={setCty} />} />
              <Route path="/danh-muc"  element={<DanhMuc />} />
              <Route path="/nhap-lieu" element={<NhapLieu />} />
              <Route path="/nxt"       element={<NhapXuatTon />} />
              <Route path="/chi-tiet"  element={<ChiTiet />} />
              <Route path="/in-phieu"  element={<InPhieu />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
