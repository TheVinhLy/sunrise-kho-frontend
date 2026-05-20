import React, { useState } from 'react';
import { login } from '../utils/api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.username || !form.password) { setErr('Vui lòng nhập đủ thông tin'); return; }
    setLoading(true); setErr('');
    try {
      const user = await login(form);
      localStorage.setItem('sk_user', JSON.stringify(user));
      onLogin(user);
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#1b3a2f 0%,#2d7a50 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '40px 36px',
        width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,.25)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏭</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1b3a2f', marginBottom: 4 }}>
            SUNRISE KHO
          </h1>
          <p style={{ fontSize: 12, color: '#888' }}>Hệ thống quản lý kho</p>
        </div>

        {err && (
          <div style={{
            background: '#fdecea', border: '1px solid #f5c6cb', color: '#b71c1c',
            padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16,
          }}>{err}</div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4 }}>
            Tên đăng nhập
          </label>
          <input
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Admin"
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #ccc',
              borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none',
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4 }}>
            Mật khẩu
          </label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="••••••••"
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #ccc',
              borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', padding: '11px', background: '#2d7a50', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1,
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Đang đăng nhập...' : '🔑 Đăng nhập'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 20 }}>
          CÔNG TY TNHH THỜI TRANG SUNRISE
        </p>
      </div>
    </div>
  );
}
