import React, { useState, useEffect } from 'react';
import { getNhaCc, addNhaCc, updateNhaCc, deleteNhaCc } from '../utils/api';
import { exportExcel } from '../utils/printExcel';

const BLANK = { ten_nha_cc: '', dia_chi: '', so_dien_thoai: '', email: '', ghi_chu: '' };

export default function QuanLyNCC() {
  const [rows, setRows]   = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState(BLANK);
  const [search, setSearch] = useState('');
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getNhaCc()
      .then(r => { setRows(r); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };
  useEffect(load, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openAdd  = () => { setForm(BLANK); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (r) => { setForm({ ...r }); setErr(''); setModal({ mode: 'edit', id: r.id }); };

  const save = async () => {
    if (!form.ten_nha_cc) { setErr('Nhập tên nhà cung cấp'); return; }
    try {
      if (modal.mode === 'add') await addNhaCc(form);
      else await updateNhaCc(modal.id, form);
      setModal(null); load();
    } catch(e) { setErr(e.message); }
  };

  const del = async (r) => {
    if (!window.confirm(`Xóa NCC "${r.ten_nha_cc}"?\nCác vật tư và chứng từ liên kết sẽ bị bỏ liên kết (dữ liệu text vẫn giữ).`)) return;
    await deleteNhaCc(r.id).catch(e => alert(e.message));
    load();
  };

  const filtered = rows.filter(r =>
    !search ||
    r.ten_nha_cc.toLowerCase().includes(search.toLowerCase()) ||
    (r.dia_chi||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>🏭 Quản lý nhà cung cấp</h2>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost" onClick={() => {
              const headers = ['STT','Tên nhà cung cấp','Địa chỉ','Số điện thoại','Email','Ghi chú'];
              const exRows = filtered.map((r,i) => [i+1, r.ten_nha_cc, r.dia_chi||'', r.so_dien_thoai||'', r.email||'', r.ghi_chu||'']);
              exportExcel(headers, exRows, 'DanhSachNCC');
            }}>📥 Xuất Excel</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Thêm NCC</button>
          </div>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group">
              <label>Tìm kiếm</label>
              <input
                placeholder="Tên, địa chỉ..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: 260 }}
              />
            </div>
            <button className="btn btn-ghost" onClick={() => setSearch('')}>Xóa lọc</button>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>
              {filtered.length} / {rows.length} NCC
            </span>
          </div>

          {loading ? <div className="spinner"/> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width:40}}>STT</th>
                    <th>Tên nhà cung cấp</th>
                    <th>Địa chỉ</th>
                    <th>Số điện thoại</th>
                    <th>Email</th>
                    <th>Ghi chú</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id}>
                      <td className="text-center">{i + 1}</td>
                      <td><b>{r.ten_nha_cc}</b></td>
                      <td>{r.dia_chi}</td>
                      <td>{r.so_dien_thoai}</td>
                      <td>{r.email}</td>
                      <td style={{fontSize:12, color:'#888'}}>{r.ghi_chu}</td>
                      <td style={{whiteSpace:'nowrap'}}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️</button>{' '}
                        <button className="btn btn-danger btn-sm" onClick={() => del(r)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={7} className="text-center" style={{padding:24,color:'#aaa'}}>
                      Chưa có nhà cung cấp nào
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{maxWidth:560}}>
            <div className="modal-header">
              <h3>{modal.mode === 'add' ? '+ Thêm nhà cung cấp' : '✏️ Sửa nhà cung cấp'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Tên nhà cung cấp *</label>
                  <input value={form.ten_nha_cc} onChange={e => set('ten_nha_cc', e.target.value)}
                    placeholder="VD: Công ty Khang Thịnh"/>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Địa chỉ</label>
                  <input value={form.dia_chi||''} onChange={e => set('dia_chi', e.target.value)}/>
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input value={form.so_dien_thoai||''} onChange={e => set('so_dien_thoai', e.target.value)}/>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input value={form.email||''} onChange={e => set('email', e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Ghi chú</label>
                  <textarea value={form.ghi_chu||''} onChange={e => set('ghi_chu', e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={save}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
