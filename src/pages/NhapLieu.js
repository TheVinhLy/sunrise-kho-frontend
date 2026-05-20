import React, { useState, useEffect, useCallback } from 'react';
import { getChungTu, addChungTu, updateChungTu, deleteChungTu, getDanhMuc } from '../utils/api';

const today = () => new Date().toISOString().slice(0, 10);
const BLANK = { ngay_ghi_so: today(), so_chung_tu: '', ngay_chung_tu: today(), dien_giai: '', so_luong_nhap: '', so_luong_xuat: '', ma_vat_tu: '', ten_nha_cc: '', nguoi_nhan_giao: '', noi_dung: '', dia_chi: '' };

const fmt = n => n ? Number(n).toLocaleString('vi-VN') : '';

export default function NhapLieu() {
  const [rows, setRows] = useState([]);
  const [dm, setDm] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [filter, setFilter] = useState({ tu_ngay: '', den_ngay: '', ma_vat_tu: '', loai: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PER = 50;

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter.tu_ngay) params.tu_ngay = filter.tu_ngay;
    if (filter.den_ngay) params.den_ngay = filter.den_ngay;
    if (filter.ma_vat_tu) params.ma_vat_tu = filter.ma_vat_tu;
    if (filter.loai) params.loai = filter.loai;
    getChungTu(params).then(r => { setRows(r); setLoading(false); setPage(1); }).catch(e => { setErr(e.message); setLoading(false); });
  }, [filter]);

  useEffect(load, [load]);
  useEffect(() => { getDanhMuc().then(setDm); }, []);

  const setF = (k, v) => setFilter(f => ({ ...f, [k]: v }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill diễn giải khi chọn loại CT
  const autoSoCT = (prefix) => {
    const matching = rows.filter(r => r.so_chung_tu.startsWith(prefix));
    const nums = matching.map(r => parseInt(r.so_chung_tu.replace(prefix, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  };

  const openAdd = (loai = 'nhap') => {
    const prefix = loai === 'nhap' ? 'PN' : 'PX';
    setForm({ ...BLANK, so_chung_tu: autoSoCT(prefix) });
    setErr(''); setModal({ mode: 'add' });
  };

  const openEdit = (r) => {
    setForm({ ...r, so_luong_nhap: r.so_luong_nhap || '', so_luong_xuat: r.so_luong_xuat || '' });
    setErr(''); setModal({ mode: 'edit', id: r.id });
  };

  const save = async () => {
    if (!form.ma_vat_tu) { setErr('Chọn mã vật tư'); return; }
    if (!form.so_chung_tu) { setErr('Nhập số chứng từ'); return; }
    try {
      if (modal.mode === 'add') await addChungTu(form);
      else await updateChungTu(modal.id, form);
      setModal(null); load();
    } catch (e) { setErr(e.message); }
  };

  const del = async (r) => {
    if (!window.confirm(`Xóa chứng từ ${r.so_chung_tu}?`)) return;
    await deleteChungTu(r.id);
    load();
  };

  // Thống kê
  const tongNhap = rows.reduce((s, r) => s + (r.so_luong_nhap || 0), 0);
  const tongXuat = rows.reduce((s, r) => s + (r.so_luong_xuat || 0), 0);

  // Phân trang
  const totalPages = Math.ceil(rows.length / PER);
  const paged = rows.slice((page - 1) * PER, page * PER);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Tổng chứng từ</div>
          <div className="stat-value">{rows.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng nhập</div>
          <div className="stat-value" style={{ color: '#2e7d32' }}>{fmt(tongNhap)}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Tổng xuất</div>
          <div className="stat-value" style={{ color: '#e65100' }}>{fmt(tongXuat)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>✏️ Bảng nhập liệu chứng từ</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => openAdd('nhap')}>+ Phiếu nhập</button>
            <button className="btn btn-warning" onClick={() => openAdd('xuat')}>+ Phiếu xuất</button>
          </div>
        </div>
        <div className="card-body">
          {/* Filters */}
          <div className="filter-bar">
            <div className="form-group">
              <label>Từ ngày</label>
              <input type="date" value={filter.tu_ngay} onChange={e => setF('tu_ngay', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <input type="date" value={filter.den_ngay} onChange={e => setF('den_ngay', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mã vật tư</label>
              <select value={filter.ma_vat_tu} onChange={e => setF('ma_vat_tu', e.target.value)}>
                <option value="">-- Tất cả --</option>
                {dm.map(d => <option key={d.ma_vat_tu} value={d.ma_vat_tu}>{d.ma_vat_tu}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Loại</label>
              <select value={filter.loai} onChange={e => setF('loai', e.target.value)}>
                <option value="">Tất cả</option>
                <option value="nhap">Nhập</option>
                <option value="xuat">Xuất</option>
              </select>
            </div>
            <button className="btn btn-ghost" onClick={() => setFilter({ tu_ngay: '', den_ngay: '', ma_vat_tu: '', loai: '' })}>Xóa lọc</button>
          </div>

          {loading ? <div className="spinner" /> : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Ngày ghi sổ</th>
                      <th>Số CT</th>
                      <th>Ngày CT</th>
                      <th>Diễn giải</th>
                      <th className="text-right">Nhập</th>
                      <th className="text-right">Xuất</th>
                      <th>Mã VT</th>
                      <th>ĐVT</th>
                      <th>Tên vật tư</th>
                      <th>Nhà CC</th>
                      <th>Người N/G</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r, i) => (
                      <tr key={r.id}>
                        <td className="text-center">{(page - 1) * PER + i + 1}</td>
                        <td>{r.ngay_ghi_so?.slice(0, 10).split('-').reverse().join('/')}</td>
                        <td>
                          <span className={`badge ${r.so_luong_nhap > 0 ? 'badge-nhap' : 'badge-xuat'}`}>
                            {r.so_chung_tu}
                          </span>
                        </td>
                        <td>{r.ngay_chung_tu?.slice(0, 10).split('-').reverse().join('/')}</td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.dien_giai}>{r.dien_giai}</td>
                        <td className="num" style={{ color: '#2e7d32', fontWeight: r.so_luong_nhap > 0 ? 700 : 400 }}>{fmt(r.so_luong_nhap)}</td>
                        <td className="num" style={{ color: '#e65100', fontWeight: r.so_luong_xuat > 0 ? 700 : 400 }}>{fmt(r.so_luong_xuat)}</td>
                        <td><b>{r.ma_vat_tu}</b></td>
                        <td>{r.dvt}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.ten_vat_tu}</td>
                        <td>{r.ten_nha_cc}</td>
                        <td>{r.nguoi_nhan_giao}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️</button>{' '}
                          <button className="btn btn-danger btn-sm" onClick={() => del(r)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {!paged.length && <tr><td colSpan={13} className="text-center" style={{ padding: 24, color: '#aaa' }}>Không có dữ liệu</td></tr>}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="pagi">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                  <span style={{ color: '#888' }}>{rows.length} dòng</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal nhập liệu */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal.mode === 'add' ? '+ Thêm chứng từ' : '✏️ Sửa chứng từ'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Ngày ghi sổ *</label>
                  <input type="date" value={form.ngay_ghi_so} onChange={e => set('ngay_ghi_so', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Số chứng từ *</label>
                  <input value={form.so_chung_tu} onChange={e => set('so_chung_tu', e.target.value)} placeholder="PN0001 / PX0001" />
                </div>
                <div className="form-group">
                  <label>Ngày chứng từ</label>
                  <input type="date" value={form.ngay_chung_tu} onChange={e => set('ngay_chung_tu', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Mã vật tư *</label>
                  <select value={form.ma_vat_tu} onChange={e => {
                    const found = dm.find(d => d.ma_vat_tu === e.target.value);
                    set('ma_vat_tu', e.target.value);
                    if (found) setForm(f => ({ ...f, ma_vat_tu: e.target.value, ten_nha_cc: found.ten_nha_cc || '' }));
                  }}>
                    <option value="">-- Chọn mã vật tư --</option>
                    {dm.map(d => <option key={d.ma_vat_tu} value={d.ma_vat_tu}>{d.ma_vat_tu} - {d.ten_vat_tu}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Số lượng nhập</label>
                  <input type="number" min="0" value={form.so_luong_nhap} onChange={e => set('so_luong_nhap', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Số lượng xuất</label>
                  <input type="number" min="0" value={form.so_luong_xuat} onChange={e => set('so_luong_xuat', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Diễn giải</label>
                  <input value={form.dien_giai || ''} onChange={e => set('dien_giai', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Nhà cung cấp</label>
                  <input value={form.ten_nha_cc || ''} onChange={e => set('ten_nha_cc', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Người nhận/giao</label>
                  <input value={form.nguoi_nhan_giao || ''} onChange={e => set('nguoi_nhan_giao', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Nội dung</label>
                  <textarea value={form.noi_dung || ''} onChange={e => set('noi_dung', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Địa chỉ</label>
                  <input value={form.dia_chi || ''} onChange={e => set('dia_chi', e.target.value)} />
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
