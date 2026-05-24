import React, { useState } from 'react';

export default function DoiMatKhau({ user }) {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setErr(''); setMsg('');
    if (!form.old_password) { setErr('Nhập mật khẩu hiện tại'); return; }
    if (!form.new_password) { setErr('Nhập mật khẩu mới'); return; }
    if (form.new_password.length < 6) { setErr('Mật khẩu mới phải ít nhất 6 ký tự'); return; }
    if (form.new_password !== form.confirm) { setErr('Xác nhận mật khẩu không khớp'); return; }
    if (form.new_password === form.old_password) { setErr('Mật khẩu mới phải khác mật khẩu cũ'); return; }

    setLoading(true);
    try {
      const BASE = process.env.REACT_APP_API_URL || '';
      const res  = await fetch(BASE + '/api/auth/change-password', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: user.id, old_password: form.old_password, new_password: form.new_password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi server');
      setMsg('✅ Đổi mật khẩu thành công!');
      setForm({ old_password: '', new_password: '', confirm: '' });
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <div className="card-header">
        <h2>🔑 Đổi mật khẩu</h2>
      </div>
      <div className="card-body">
        <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
          Tài khoản: <b>{user?.username}</b> — {user?.ho_ten}
        </p>

        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="form-group">
            <label>Mật khẩu hiện tại *</label>
            <input
              type="password"
              value={form.old_password}
              onChange={e => set('old_password', e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu mới * (ít nhất 6 ký tự)</label>
            <input
              type="password"
              value={form.new_password}
              onChange={e => set('new_password', e.target.value)}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Xác nhận mật khẩu mới *</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && save()}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={loading}
            style={{ padding: '10px 28px' }}
          >
            {loading ? '⏳ Đang lưu...' : '💾 Đổi mật khẩu'}
          </button>
        </div>

        <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff8e1', borderRadius: 6, fontSize: 12, color: '#666' }}>
          💡 Sau khi đổi mật khẩu, lần đăng nhập tiếp theo dùng mật khẩu mới.
        </div>
      </div>
    </div>
  );
}
