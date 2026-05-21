import React, { useState } from 'react';
import { backupDb } from '../utils/api';

export default function Backup() {
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    setLoading(true);
    try {
      backupDb(); // mở tab mới tải file .sql
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>💾 Backup Database</h2>
        </div>
        <div className="card-body">
          {/* Thông tin */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16, marginBottom:24 }}>
            {[
              { icon:'🔄', title:'Tự động', desc:'Supabase tự backup mỗi ngày, giữ 7 ngày lịch sử', color:'#e8f5e9', border:'#2e7d32' },
              { icon:'📥', title:'Thủ công', desc:'Click nút bên dưới để tải file .sql về máy ngay lập tức', color:'#e3f2fd', border:'#1565c0' },
              { icon:'🔒', title:'An toàn', desc:'File .sql chứa toàn bộ dữ liệu, có thể restore bất kỳ lúc nào', color:'#f3e5f5', border:'#6a1b9a' },
            ].map(c => (
              <div key={c.title} style={{ background:c.color, border:`1px solid ${c.border}`, borderRadius:8, padding:'16px 18px' }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{c.icon}</div>
                <div style={{ fontWeight:700, color:c.border, marginBottom:4 }}>{c.title}</div>
                <div style={{ fontSize:12, color:'#555' }}>{c.desc}</div>
              </div>
            ))}
          </div>

          {/* Nút backup */}
          <div style={{ background:'#f9f9f9', border:'1px solid #e0e0e0', borderRadius:8, padding:24, textAlign:'center' }}>
            <p style={{ fontSize:14, color:'#555', marginBottom:16 }}>
              Tải toàn bộ dữ liệu (Danh mục, Chứng từ, Thông tin DN) về máy dưới dạng file <code>.sql</code>
            </p>
            <button
              className="btn btn-primary"
              onClick={handleBackup}
              disabled={loading}
              style={{ fontSize:15, padding:'12px 28px' }}
            >
              {loading ? '⏳ Đang tạo file...' : '📥 Tải backup về máy (.sql)'}
            </button>
            <p style={{ fontSize:11, color:'#aaa', marginTop:12 }}>
              File được đặt tên theo định dạng: <code>sunrise_kho_backup_YYYY-MM-DD.sql</code>
            </p>
          </div>

          {/* Hướng dẫn restore */}
          <div style={{ marginTop:24, padding:'16px 20px', background:'#fff8e1', border:'1px solid #ffe082', borderRadius:8 }}>
            <p style={{ fontWeight:700, marginBottom:8 }}>📋 Cách khôi phục dữ liệu từ file backup:</p>
            <ol style={{ paddingLeft:20, fontSize:13, color:'#555', lineHeight:2 }}>
              <li>Vào <b>Supabase Dashboard</b> → chọn project</li>
              <li>Tab <b>"SQL Editor"</b> (icon terminal bên trái)</li>
              <li>Click <b>"New query"</b></li>
              <li>Mở file <code>.sql</code> bằng Notepad → Copy toàn bộ nội dung</li>
              <li>Paste vào SQL Editor → click <b>"Run"</b></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
