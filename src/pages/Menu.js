import React from 'react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  { to: '/cong-ty',   icon: '🏢', label: 'Thông tin\nDoanh nghiệp', color: '#e3f2fd', border: '#1565c0', desc: 'Cài đặt thông tin công ty, kho, năm kế toán' },
  { to: '/danh-muc',  icon: '📦', label: 'Danh mục\nVật tư HH',    color: '#e8f5e9', border: '#2e7d32', desc: 'Quản lý mã, tên vật tư, nhà cung cấp' },
  { to: '/nhap-lieu', icon: '✏️',  label: 'Nhập liệu\nChứng từ',    color: '#fff8e1', border: '#f57f17', desc: 'Nhập phiếu nhập kho, xuất kho hàng ngày' },
  { to: '/nxt',       icon: '📊', label: 'Nhập Xuất Tồn\nTổng hợp', color: '#f3e5f5', border: '#6a1b9a', desc: 'Báo cáo tồn kho theo từng mã vật tư' },
  { to: '/chi-tiet',  icon: '🔍', label: 'Chi tiết\nN-X-T',         color: '#fce4ec', border: '#880e4f', desc: 'Xem chi tiết nhập xuất tồn từng mặt hàng' },
  { to: '/in-phieu',  icon: '🖨️', label: 'In phiếu\nN-X-T',         color: '#e0f2f1', border: '#004d40', desc: 'In phiếu nhập kho / xuất kho theo chứng từ' },
];

export default function Menu({ cty }) {
  const nav = useNavigate();
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
        {MODULES.map(m => (
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

      <div style={{ marginTop: 28, padding: '14px 18px', background: '#f9f9f9', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 12, color: '#888' }}>
        💡 Mọi dữ liệu được lưu vào SQLite database · Backup: tải file <code>sunrise_kho.db</code> về máy
      </div>
    </div>
  );
}
