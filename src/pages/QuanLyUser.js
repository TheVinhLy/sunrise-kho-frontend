import React, { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser, getUserPerms, setUserPerms, getCongTyList } from '../utils/api';

const ALL_MENUS = [
  { key:'cong-ty',   label:'🏢 Thông tin DN' },
  { key:'danh-muc',  label:'📦 Danh mục VTHH' },
  { key:'nhap-lieu', label:'✏️ Nhập liệu' },
  { key:'nxt',       label:'📊 Nhập Xuất Tồn' },
  { key:'chi-tiet',  label:'🔍 Chi tiết N-X-T' },
  { key:'in-phieu',  label:'🖨️ In phiếu' },
];

const BLANK = { username:'', password:'', ho_ten:'', role:'user', is_active:true, timeout_phut:30, cong_ty_id:'' };

export default function QuanLyUser() {
  const [users, setUsers]     = useState([]);
  const [dsCty, setDsCty]     = useState([]);
  const [modal, setModal]     = useState(null);
  const [permModal, setPermModal] = useState(null);
  const [form, setForm]       = useState(BLANK);
  const [perms, setPerms]     = useState([]);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([getUsers(), getCongTyList()])
      .then(([u,c])=>{ setUsers(u); setDsCty(c); setLoading(false); })
      .catch(e=>{ setErr(e.message); setLoading(false); });
  };
  useEffect(load,[]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const openAdd  = () => { setForm(BLANK); setErr(''); setModal({mode:'add'}); };
  const openEdit = (u) => { setForm({...u, password:'', cong_ty_id: u.cong_ty_id||''}); setErr(''); setModal({mode:'edit',id:u.id}); };

  const save = async () => {
    if (!form.username) { setErr('Nhập tên đăng nhập'); return; }
    if (modal.mode==='add' && !form.password) { setErr('Nhập mật khẩu'); return; }
    if (form.role!=='admin' && !form.cong_ty_id) { setErr('User thường phải chọn công ty'); return; }
    try {
      if (modal.mode==='add') await addUser(form);
      else await updateUser(modal.id, form);
      setModal(null); load();
    } catch(e) { setErr(e.message); }
  };

  const del = async (u) => {
    if (u.role==='admin') { alert('Không thể xóa Admin!'); return; }
    if (!window.confirm(`Xóa user "${u.username}"?`)) return;
    await deleteUser(u.id).catch(e=>alert(e.message));
    load();
  };

  const openPerms = async (u) => {
    if (u.role==='admin') { alert('Admin có toàn quyền.'); return; }
    const p = await getUserPerms(u.id).catch(()=>[]);
    setPerms(p); setPermModal(u);
  };

  const savePerms = async () => {
    await setUserPerms(permModal.id, perms).catch(e=>alert(e.message));
    setPermModal(null);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>👥 Quản lý người dùng</h2>
          <button className="btn btn-primary" onClick={openAdd}>+ Thêm user</button>
        </div>
        <div className="card-body">
          {loading ? <div className="spinner"/> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>STT</th><th>Username</th><th>Họ tên</th><th>Vai trò</th>
                    <th>Công ty</th><th>Timeout</th><th>Trạng thái</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u,i)=>(
                    <tr key={u.id}>
                      <td className="text-center">{i+1}</td>
                      <td><b>{u.username}</b></td>
                      <td>{u.ho_ten}</td>
                      <td>
                        <span style={{padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:700,
                          background:u.role==='admin'?'#fff3e0':'#e8f5e9',
                          color:u.role==='admin'?'#e65100':'#2e7d32'}}>
                          {u.role==='admin'?'👑 Admin':'👤 User'}
                        </span>
                      </td>
                      <td style={{fontSize:12}}>
                        {u.role==='admin' ? <span style={{color:'#888'}}>Tất cả</span> : (u.ten_cong_ty||<span style={{color:'#e65100'}}>⚠ Chưa gán</span>)}
                      </td>
                      <td className="text-center">{u.timeout_phut||30} phút</td>
                      <td>
                        <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,
                          background:u.is_active?'#e8f5e9':'#fdecea',
                          color:u.is_active?'#2e7d32':'#c0392b'}}>
                          {u.is_active?'Hoạt động':'Đã khóa'}
                        </span>
                      </td>
                      <td style={{whiteSpace:'nowrap'}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(u)}>✏️ Sửa</button>{' '}
                        <button className="btn btn-ghost btn-sm" onClick={()=>openPerms(u)}>🔐 Quyền</button>{' '}
                        {u.role!=='admin' && <button className="btn btn-danger btn-sm" onClick={()=>del(u)}>🗑️</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm/sửa */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal.mode==='add'?'+ Thêm user':'✏️ Sửa user'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên đăng nhập *</label>
                  <input value={form.username} onChange={e=>set('username',e.target.value)} disabled={modal.mode==='edit'} placeholder="nhanvien01"/>
                </div>
                <div className="form-group">
                  <label>{modal.mode==='add'?'Mật khẩu *':'Mật khẩu mới (bỏ trống = giữ)'}</label>
                  <input type="password" value={form.password} onChange={e=>set('password',e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Họ và tên</label>
                  <input value={form.ho_ten||''} onChange={e=>set('ho_ten',e.target.value)} placeholder="Nguyễn Văn A"/>
                </div>
                <div className="form-group">
                  <label>Vai trò</label>
                  <select value={form.role} onChange={e=>set('role',e.target.value)}>
                    <option value="user">👤 User</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timeout tự đăng xuất (phút)</label>
                  <input type="number" min="5" max="480" value={form.timeout_phut||30} onChange={e=>set('timeout_phut',+e.target.value)}/>
                </div>
                {form.role !== 'admin' && (
                  <div className="form-group" style={{gridColumn:'1/-1'}}>
                    <label>Công ty * (bắt buộc với User thường)</label>
                    <select value={form.cong_ty_id||''} onChange={e=>set('cong_ty_id',+e.target.value||'')}>
                      <option value="">-- Chọn công ty --</option>
                      {dsCty.filter(c=>c.is_active).map(c=>(
                        <option key={c.id} value={c.id}>{c.ten_cong_ty} ({c.ten_kho})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select value={form.is_active} onChange={e=>set('is_active',e.target.value==='true')}>
                    <option value="true">✅ Hoạt động</option>
                    <option value="false">🔒 Khóa</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={save}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal phân quyền */}
      {permModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setPermModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>🔐 Phân quyền — {permModal.username}</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>setPermModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:13,color:'#555',marginBottom:16}}>
                Công ty: <b>{permModal.ten_cong_ty||'—'}</b>
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {ALL_MENUS.map(m=>(
                  <label key={m.key} style={{
                    display:'flex',alignItems:'center',gap:12,cursor:'pointer',
                    padding:'10px 14px',borderRadius:8,
                    background:perms.includes(m.key)?'#e8f5e9':'#f5f5f5',
                    border:`1px solid ${perms.includes(m.key)?'#4caf50':'#e0e0e0'}`,
                  }}>
                    <input type="checkbox" checked={perms.includes(m.key)}
                      onChange={()=>setPerms(p=>p.includes(m.key)?p.filter(x=>x!==m.key):[...p,m.key])}
                      style={{width:16,height:16,cursor:'pointer'}}/>
                    <span style={{fontSize:14,fontWeight:perms.includes(m.key)?700:400}}>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setPermModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={savePerms}>💾 Lưu quyền</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
