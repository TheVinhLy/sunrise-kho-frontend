import React, { useState, useEffect } from 'react';
import { getDanhMuc, addDanhMuc, updateDanhMuc, deleteDanhMuc, getDvt, addDvt, deleteDvt, getNhaCc } from '../utils/api';
import { exportExcel } from '../utils/printExcel';

const BLANK = { ma_vat_tu: '', ten_vat_tu: '', dvt: 'Cái', so_luong_dau_ky: 0, nha_cc_id: '', ten_nha_cc: '', dia_chi_ncc: '', ghi_chu: '' };

export default function DanhMuc() {
  const [rows, setRows] = useState([]);
  const [dvtList, setDvtList] = useState([]);
  const [nccList, setNccList] = useState([]);
  const [newDvt, setNewDvt]   = useState('');
  const [showDvt, setShowDvt] = useState(false);
  const [modal, setModal] = useState(null); // null | {mode:'add'|'edit', data}
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); getDanhMuc().then(r => { setRows(r); setLoading(false); }).catch(e => { setErr(e.message); setLoading(false); }); };
  const loadDvt = () => getDvt().then(setDvtList).catch(() => {});
  const loadNcc = () => getNhaCc().then(setNccList).catch(() => {});
  useEffect(() => { load(); loadDvt(); loadNcc(); }, []);

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
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost" onClick={() => {
              const headers = ['STT','Mã vật tư','Tên vật tư','ĐVT','Tồn đầu kỳ','Nhà cung cấp','Địa chỉ NCC','Ghi chú'];
              const exRows = filtered.map((r,i) => [i+1, r.ma_vat_tu, r.ten_vat_tu, r.dvt, Number(r.so_luong_dau_ky||0), r.ten_nha_cc||'', r.dia_chi_ncc||'', r.ghi_chu||'']);
              exportExcel(headers, exRows, 'DanhMucVatTu');
            }}>📥 Xuất Excel</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Thêm mới</button>
          </div>
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
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={form.dvt} onChange={e => set('dvt', e.target.value)} style={{ flex: 1 }}>
                      {dvtList.map(d => <option key={d.id} value={d.ten_dvt}>{d.ten_dvt}</option>)}
                    </select>
                    <button type="button" className="btn btn-ghost btn-sm" title="Thêm ĐVT mới"
                      onClick={() => setShowDvt(true)}>+</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Số lượng đầu kỳ</label>
                  <input type="number" value={form.so_luong_dau_ky} onChange={e => set('so_luong_dau_ky', +e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Nhà cung cấp</label>
                  <div style={{display:'flex', gap:6}}>
                    <select
                      value={form.nha_cc_id || ''}
                      onChange={e => {
                        const ncc = nccList.find(n => n.id === +e.target.value);
                        setForm(f => ({
                          ...f,
                          nha_cc_id:   e.target.value ? +e.target.value : '',
                          ten_nha_cc:  ncc ? ncc.ten_nha_cc : f.ten_nha_cc,
                          dia_chi_ncc: ncc ? (ncc.dia_chi||'') : f.dia_chi_ncc,
                        }));
                      }}
                      style={{flex:1}}
                    >
                      <option value="">-- Chọn hoặc nhập tay bên dưới --</option>
                      {nccList.map(n => (
                        <option key={n.id} value={n.id}>{n.ten_nha_cc}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Tên NCC (có thể sửa tay)</label>
                  <input
                    value={form.ten_nha_cc || ''}
                    onChange={e => set('ten_nha_cc', e.target.value)}
                    placeholder="Tự nhập nếu không có trong danh sách"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Địa chỉ NCC (tự fetch hoặc sửa tay)</label>
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
      {showDvt && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDvt(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>📏 Quản lý đơn vị tính</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDvt(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={newDvt} onChange={e => setNewDvt(e.target.value)}
                  placeholder="Nhập ĐVT mới (VD: Cuộn, Bao...)"
                  onKeyDown={async e => {
                    if (e.key === 'Enter' && newDvt.trim()) {
                      await addDvt({ ten_dvt: newDvt.trim() }).catch(e => alert(e.message));
                      setNewDvt(''); loadDvt();
                    }
                  }}
                  style={{ flex:1, padding:'7px 10px', border:'1px solid #ccc', borderRadius:5, fontSize:13, fontFamily:'inherit' }}
                />
                <button className="btn btn-primary" onClick={async () => {
                  if (!newDvt.trim()) return;
                  await addDvt({ ten_dvt: newDvt.trim() }).catch(e => alert(e.message));
                  setNewDvt(''); loadDvt();
                }}>+ Thêm</button>
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {dvtList.map(d => (
                  <div key={d.id} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'8px 12px', borderRadius:6, marginBottom:4, background:'#f5f5f5',
                  }}>
                    <span style={{ fontSize:14 }}>{d.ten_dvt}</span>
                    <button className="btn btn-danger btn-sm" onClick={async () => {
                      if (!window.confirm(`Xóa ĐVT "${d.ten_dvt}"?`)) return;
                      await deleteDvt(d.id).catch(e => alert(e.message));
                      loadDvt();
                    }}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowDvt(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
