import React, { useState, useEffect } from 'react';
import { getDanhMuc, addDanhMuc, updateDanhMuc, deleteDanhMuc } from '../utils/api';

const BLANK = { ma_vat_tu: '', ten_vat_tu: '', dvt: 'Cái', so_luong_dau_ky: 0, ten_nha_cc: '', dia_chi_ncc: '', ghi_chu: '' };

export default function DanhMuc() {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null); // null | {mode:'add'|'edit', data}
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); getDanhMuc().then(r => { setRows(r); setLoading(false); }).catch(e => { setErr(e.message); setLoading(false); }); };
  useEffect(load, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(BLANK); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (r) => { setForm({ ...r }); setErr(''); setModal({ mode: 'edit', id: r.id }); };

  const save = async () => {
    try {
      if (modal.mode === 'add') await addDanhMuc(form);
      else await updateDanhMuc(modal.id, form);
      setModal(null); load();
    } catch (e) { setErr(e.message); }
  };

  const del = async (r) => {
    if (!window.confirm(`Xóa "${r.ma_vat_tu} - ${r.ten_vat_tu}"?`)) return;
    await deleteDanhMuc(r.id).catch(e => alert(e.message));
    load();
  };

  const filtered = rows.filter(r =>
    !search || r.ma_vat_tu.toLowerCase().includes(search.toLowerCase()) ||
    r.ten_vat_tu.toLowerCase().includes(search.toLowerCase()) ||
    (r.ten_nha_cc || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>📦 Danh mục vật tư hàng hóa</h2>
          <button className="btn btn-primary" onClick={openAdd}>+ Thêm mới</button>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group">
              <label>Tìm kiếm</label>
              <input placeholder="Mã, tên, nhà CC..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
            </div>
            <button className="btn btn-ghost" onClick={() => setSearch('')}>Xóa lọc</button>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>{filtered.length} / {rows.length} mục</span>
          </div>

          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã vật tư</th>
                    <th>Tên vật tư</th>
                    <th>ĐVT</th>
                    <th className="text-right">Tồn đầu kỳ</th>
                    <th>Nhà cung cấp</th>
                    <th>Ghi chú</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id}>
                      <td className="text-center">{i + 1}</td>
                      <td><b>{r.ma_vat_tu}</b></td>
                      <td>{r.ten_vat_tu}</td>
                      <td className="text-center">{r.dvt}</td>
                      <td className="num">{(r.so_luong_dau_ky || 0).toLocaleString('vi-VN')}</td>
                      <td>{r.ten_nha_cc}</td>
                      <td style={{ color: '#888', fontSize: 12 }}>{r.ghi_chu}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️</button>
                        {' '}
                        <button className="btn btn-danger btn-sm" onClick={() => del(r)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && <tr><td colSpan={8} className="text-center" style={{ padding: 24, color: '#aaa' }}>Không có dữ liệu</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal.mode === 'add' ? '+ Thêm vật tư mới' : '✏️ Chỉnh sửa vật tư'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã vật tư *</label>
                  <input value={form.ma_vat_tu} onChange={e => set('ma_vat_tu', e.target.value)} disabled={modal.mode === 'edit'} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Tên vật tư *</label>
                  <input value={form.ten_vat_tu} onChange={e => set('ten_vat_tu', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Đơn vị tính</label>
                  <select value={form.dvt} onChange={e => set('dvt', e.target.value)}>
                    <option>Cái</option><option>Kg</option><option>Mét</option><option>Thùng</option><option>Hộp</option><option>Cuộn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Số lượng đầu kỳ</label>
                  <input type="number" value={form.so_luong_dau_ky} onChange={e => set('so_luong_dau_ky', +e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Nhà cung cấp</label>
                  <input value={form.ten_nha_cc || ''} onChange={e => set('ten_nha_cc', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Địa chỉ NCC</label>
                  <input value={form.dia_chi_ncc || ''} onChange={e => set('dia_chi_ncc', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Ghi chú</label>
                  <textarea value={form.ghi_chu || ''} onChange={e => set('ghi_chu', e.target.value)} />
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
