import React from 'react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  { to: '/cong-ty',   key: 'cong-ty',   icon: '🏢', label: 'Thông tin\nDoanh nghiệp', color: '#e3f2fd', border: '#1565c0', desc: 'Cài đặt thông tin công ty, kho, năm kế toán' },
  { to: '/danh-muc',  key: 'danh-muc',  icon: '📦', label: 'Danh mục\nVật tư HH',    color: '#e8f5e9', border: '#2e7d32', desc: 'Quản lý mã, tên vật tư, nhà cung cấp' },
  { to: '/nhap-lieu', key: 'nhap-lieu', icon: '✏️',  label: 'Nhập liệu\nChứng từ',    color: '#fff8e1', border: '#f57f17', desc: 'Nhập phiếu nhập kho, xuất kho hàng ngày' },
  { to: '/nxt',       key: 'nxt',       icon: '📊', label: 'Nhập Xuất Tồn\nTổng hợp', color: '#f3e5f5', border: '#6a1b9a', desc: 'Báo cáo tồn kho theo từng mã vật tư' },
  { to: '/chi-tiet',  key: 'chi-tiet',  icon: '🔍', label: 'Chi tiết\nN-X-T',         color: '#fce4ec', border: '#880e4f', desc: 'Xem chi tiết nhập xuất tồn từng mặt hàng' },
  { to: '/in-phieu',  key: 'in-phieu',  icon: '🖨️', label: 'In phiếu\nN-X-T',         color: '#e0f2f1', border: '#004d40', desc: 'In phiếu nhập kho / xuất kho theo chứng từ' },
  { to: '/ql-nha-cc', key: 'nha-cc', icon: '🏭', label: 'Quản lý\nNhà cung cấp',  color: '#fff3e0', border: '#e65100', desc: 'Thêm, sửa, xóa danh sách nhà cung cấp' },
  { to: '/ql-nhan-vien', key: 'nhan-vien', icon: '👤', label: 'Nhân viên\n& hồ sơ', color: '#e8f5e9', border: '#1b5e20', desc: 'Quản lý danh sách nhân viên' },
  { to: '/cham-cong-nv', key: 'cham-cong-nv', icon: '🕒', label: 'Chấm công\nNhân viên', color: '#ede7f6', border: '#4527a0', desc: 'Nhập và import chấm công từ Excel' },
  { to: '/bang-luong', key: 'bang-luong', icon: '📑', label: 'Bảng lương\nTháng', color: '#e3f2fd', border: '#0d47a1', desc: 'Tổng hợp lương theo tháng và chốt lương' },
  { to: '/bang-luong-chi-tiet', key: 'bang-luong-chi-tiet', icon: '📋', label: 'Bảng lương\nChi tiết', color: '#e8f5e9', border: '#2e7d32', desc: 'Xem chi tiết công, OT, cơm và xuất Excel' },
  { to: '/luong-tham-so', key: 'luong-tham-so', icon: '💰', label: 'Tham số\nLương', color: '#fff8e1', border: '#b26a00', desc: 'Thiết lập lương ngày công, OT/H, cơm' },
];

export default function Menu({ cty, user }) {
  const nav = useNavigate();
  const isAdmin = user?.role === 'admin';
  const menus = user?.menus || [];
  const visibleModules = MODULES.filter(m => !m.key || isAdmin || menus.includes(m.key));
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, color: '#1b3a2f', marginBottom: 6 }}>
          🏭 HỆ THỐNG QUẢN LÝ KHO
        </h1>
        <p style={{ color: '#555', fontSize: 14 }}>
          {cty?.ten_cong_ty} &nbsp;|&nbsp; Kho: {cty?.ten_kho} &nbsp;|&nbsp; Năm: {cty?.nam}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {visibleModules.map(m => (
          <button
            key={m.to}
            onClick={() => nav(m.to)}
            style={{
              background: m.color,
              border: `2px solid ${m.border}`,
              borderRadius: 10,
              padding: '20px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform .15s, box-shadow .15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: m.border, whiteSpace: 'pre-line', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{m.desc}</div>
          </button>
        ))}
      </div>

    </div>
  );
}
