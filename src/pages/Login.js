import React, { useState } from 'react';
import { login, selectCompany } from '../utils/api';

export default function Login({ onLogin }) {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [step, setStep]       = useState('login'); // 'login' | 'select-company'
  const [dsCty, setDsCty]     = useState([]);
  const [userTemp, setUserTemp] = useState(null);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) { setErr('Vui lòng nhập đủ thông tin'); return; }
    setLoading(true); setErr('');
    try {
      const user = await login(form);
      if (user.role === 'admin' && user.ds_cong_ty?.length > 0) {
        // Admin → hiện bước chọn công ty
        setUserTemp(user);
        setDsCty(user.ds_cong_ty);
        setStep('select-company');
      } else if (user.cong_ty) {
        // User thường → đã có công ty, vào luôn
        const full = { ...user };
        localStorage.setItem('sk_user', JSON.stringify(full));
        onLogin(full);
      } else {
        setErr('Tài khoản chưa được gán công ty. Liên hệ Admin.');
      }
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  const handleSelectCompany = async (ctyId) => {
    setLoading(true); setErr('');
    try {
      const cty = await selectCompany(ctyId);
      const full = { ...userTemp, cong_ty: cty };
      localStorage.setItem('sk_user', JSON.stringify(full));
      onLogin(full);
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#1b3a2f 0%,#2d7a50 100%)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div style={{
        background:'#fff', borderRadius:12, padding:'40px 36px',
        width:'100%', maxWidth: step === 'select-company' ? 480 : 380,
        boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        transition: 'max-width .3s',
      }}>
        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:24}}>
          <div style={{fontSize:44, marginBottom:6}}>🏭</div>
          <h1 style={{fontSize:20, fontWeight:700, color:'#1b3a2f', marginBottom:4}}>SUNRISE KHO</h1>
          <p style={{fontSize:12, color:'#888'}}>Hệ thống quản lý kho</p>
        </div>

        {err && (
          <div style={{
            background:'#fdecea', border:'1px solid #f5c6cb', color:'#b71c1c',
            padding:'10px 14px', borderRadius:6, fontSize:13, marginBottom:16,
          }}>{err}</div>
        )}

        {/* ── BƯỚC 1: Đăng nhập ── */}
        {step === 'login' && (
          <>
            <div style={{marginBottom:16}}>
              <label style={{display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:4}}>
                Tên đăng nhập
              </label>
              <input
                value={form.username}
                onChange={e => setForm(f=>({...f, username:e.target.value}))}
                onKeyDown={e => e.key==='Enter' && handleLogin()}
                placeholder="Admin"
                autoFocus
                style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:6, fontSize:14, fontFamily:'inherit', outline:'none'}}
              />
            </div>
            <div style={{marginBottom:24}}>
              <label style={{display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:4}}>
                Mật khẩu
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f=>({...f, password:e.target.value}))}
                onKeyDown={e => e.key==='Enter' && handleLogin()}
                placeholder="••••••••"
                style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:6, fontSize:14, fontFamily:'inherit', outline:'none'}}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width:'100%', padding:'11px', background:'#2d7a50', color:'#fff',
                border:'none', borderRadius:6, fontSize:14, fontWeight:700,
                cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, fontFamily:'inherit',
              }}
            >
              {loading ? 'Đang đăng nhập...' : '🔑 Đăng nhập'}
            </button>
          </>
        )}

        {/* ── BƯỚC 2: Admin chọn công ty ── */}
        {step === 'select-company' && (
          <>
            <p style={{fontSize:13, color:'#555', marginBottom:16, textAlign:'center'}}>
              Xin chào <b>{userTemp?.ho_ten}</b>! Chọn công ty để làm việc:
            </p>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {dsCty.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => handleSelectCompany(ct.id)}
                  disabled={loading}
                  style={{
                    padding:'14px 18px',
                    background: '#f5f5f5',
                    border:'2px solid #e0e0e0',
                    borderRadius:8,
                    cursor:'pointer',
                    textAlign:'left',
                    fontFamily:'inherit',
                    transition:'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='#e8f5e9'; e.currentTarget.style.borderColor='#2d7a50'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#e0e0e0'; }}
                >
                  <div style={{fontWeight:700, fontSize:14, color:'#1b3a2f'}}>{ct.ten_cong_ty}</div>
                  <div style={{fontSize:12, color:'#888', marginTop:2}}>
                    Kho: {ct.ten_kho} &nbsp;|&nbsp; Năm: {ct.nam}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setStep('login'); setErr(''); }}
              style={{
                marginTop:16, width:'100%', padding:'9px',
                background:'transparent', border:'1px solid #ccc',
                borderRadius:6, fontSize:13, cursor:'pointer', fontFamily:'inherit', color:'#555',
              }}
            >
              ← Quay lại đăng nhập
            </button>
          </>
        )}

        <p style={{textAlign:'center', fontSize:11, color:'#bbb', marginTop:20}}>
          CÔNG TY TNHH THỜI TRANG SUNRISE
        </p>
      </div>
    </div>
  );
}
