import React, { useState, useEffect } from 'react';
import { getCongTyList, addCongTy, updateCongTyById } from '../utils/api';

const BLANK = {
  ten_cong_ty:'', dia_chi:'', ten_kho:'', so_dien_thoai:'', so_fax:'',
  ma_so_thue:'', thu_truong:'', nguoi_lap_bieu:'', thu_kho:'',
  nam:2026, tu_ngay:'2026-01-01', den_ngay:'2026-12-31', is_active:true,
};

export default function QuanLyCongTy() {
  const [rows, setRows]   = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState(BLANK);
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); getCongTyList().then(r=>{setRows(r);setLoading(false);}).catch(e=>{setErr(e.message);setLoading(false);}); };
  useEffect(load, []);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const openAdd  = () => { setForm(BLANK); setErr(''); setModal({mode:'add'}); };
  const openEdit = (r) => { setForm({...r, tu_ngay: r.tu_ngay?.slice(0,10), den_ngay: r.den_ngay?.slice(0,10) }); setErr(''); setModal({mode:'edit',id:r.id}); };

  const save = async () => {
    if (!form.ten_cong_ty) { setErr('Nhập tên công ty'); return; }
    try {
      if (modal.mode==='add') await addCongTy(form);
      else await updateCongTyById(modal.id, form);
      setModal(null); load();
    } catch(e) { setErr(e.message); }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>🏢 Quản lý công ty</h2>
          <button className="btn btn-primary" onClick={openAdd}>+ Thêm công ty</button>
        </div>
        <div className="card-body">
          {loading ? <div className="spinner"/> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width:40}}>ID</th>
                    <th>Tên công ty</th>
                    <th>Tên kho</th>
                    <th>MST</th>
                    <th>SĐT</th>
                    <th>Năm</th>
                    <th style={{width:80}}>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td className="text-center"><b>{r.id}</b></td>
                      <td><b>{r.ten_cong_ty}</b></td>
                      <td>{r.ten_kho}</td>
                      <td>{r.ma_so_thue}</td>
                      <td>{r.so_dien_thoai}</td>
                      <td className="text-center">{r.nam}</td>
                      <td className="text-center">
                        <span style={{
                          padding:'2px 8px', borderRadius:12, fontSize:11,
                          background: r.is_active?'#e8f5e9':'#fdecea',
                          color: r.is_active?'#2e7d32':'#c0392b',
                        }}>
                          {r.is_active ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(r)}>✏️ Sửa</button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && <tr><td colSpan={8} className="text-center" style={{padding:24,color:'#aaa'}}>Chưa có công ty nào</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal" style={{maxWidth:640}}>
            <div className="modal-header">
              <h3>{modal.mode==='add'?'+ Thêm công ty mới':'✏️ Sửa thông tin công ty'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Tên công ty *</label>
                  <input value={form.ten_cong_ty} onChange={e=>set('ten_cong_ty',e.target.value)} placeholder="CÔNG TY TNHH ..." />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Địa chỉ</label>
                  <input value={form.dia_chi||''} onChange={e=>set('dia_chi',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Tên kho</label>
                  <input value={form.ten_kho||''} onChange={e=>set('ten_kho',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Mã số thuế</label>
                  <input value={form.ma_so_thue||''} onChange={e=>set('ma_so_thue',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input value={form.so_dien_thoai||''} onChange={e=>set('so_dien_thoai',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Số fax</label>
                  <input value={form.so_fax||''} onChange={e=>set('so_fax',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Thủ trưởng đơn vị</label>
                  <input value={form.thu_truong||''} onChange={e=>set('thu_truong',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Người lập biểu</label>
                  <input value={form.nguoi_lap_bieu||''} onChange={e=>set('nguoi_lap_bieu',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Thủ kho</label>
                  <input value={form.thu_kho||''} onChange={e=>set('thu_kho',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Năm kế toán</label>
                  <input type="number" value={form.nam||2026} onChange={e=>set('nam',+e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Từ ngày</label>
                  <input type="date" value={form.tu_ngay||''} onChange={e=>set('tu_ngay',e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Đến ngày</label>
                  <input type="date" value={form.den_ngay||''} onChange={e=>set('den_ngay',e.target.value)} />
                </div>
                {modal.mode==='edit' && (
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select value={form.is_active} onChange={e=>set('is_active',e.target.value==='true')}>
                      <option value="true">✅ Hoạt động</option>
                      <option value="false">🔒 Tạm khóa</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={save}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
