import React, { useEffect, useState } from 'react';
import { getNhanVien, addNhanVien, updateNhanVien, deleteNhanVien } from '../utils/api';
import { exportExcel } from '../utils/printExcel';

const BLANK = {
  ma_nv: '',
  ho_ten: '',
  phong_ban: '',
  chuc_vu: '',
  sdt: '',
  ngay_vao_lam: '',
  luong_ngay_cong: '',
  luong_ot_gio: '',
  tien_com_ngay: '',
  ghi_chu: '',
  is_active: true,
};

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

export default function NhanVien() {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getNhanVien()
      .then(data => { setRows(data); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, []);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const openAdd = () => { setForm(BLANK); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (row) => { setForm({ ...BLANK, ...row, ngay_vao_lam: row.ngay_vao_lam || '' }); setErr(''); setModal({ mode: 'edit', id: row.id }); };

  const save = async () => {
    if (!form.ma_nv || !form.ho_ten) {
      setErr('Nhập mã nhân viên và họ tên');
      return;
    }
    try {
      const payload = {
        ...form,
        luong_ngay_cong: form.luong_ngay_cong === '' ? null : Number(form.luong_ngay_cong),
        luong_ot_gio: form.luong_ot_gio === '' ? null : Number(form.luong_ot_gio),
        tien_com_ngay: form.tien_com_ngay === '' ? null : Number(form.tien_com_ngay),
      };
      if (modal.mode === 'add') await addNhanVien(payload);
      else await updateNhanVien(modal.id, payload);
      setModal(null);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const del = async (row) => {
    if (!window.confirm(`Xóa nhân viên "${row.ho_ten}"?`)) return;
    await deleteNhanVien(row.id).catch(e => alert(e.message));
    load();
  };

  const filtered = rows.filter(row => {
    const text = `${row.ma_nv || ''} ${row.ho_ten || ''} ${row.phong_ban || ''} ${row.chuc_vu || ''}`.toLowerCase();
    return !search || text.includes(search.toLowerCase());
  });

  const handleExcel = () => {
    const headers = ['STT', 'Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ', 'SĐT', 'Ngày vào làm', 'Lương ngày công', 'Lương OT/H', 'Cơm', 'Ghi chú', 'Trạng thái'];
    const exRows = filtered.map((row, index) => [
      index + 1,
      row.ma_nv,
      row.ho_ten,
      row.phong_ban || '',
      row.chuc_vu || '',
      row.sdt || '',
      row.ngay_vao_lam || '',
      Number(row.luong_ngay_cong || 0),
      Number(row.luong_ot_gio || 0),
      Number(row.tien_com_ngay || 0),
      row.ghi_chu || '',
      row.is_active ? 'Hoạt động' : 'Đã khóa',
    ]);
    exportExcel(headers, exRows, 'DanhSachNhanVien');
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>👤 Quản lý nhân viên</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={handleExcel}>📥 Xuất Excel</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Thêm nhân viên</button>
          </div>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group">
              <label>Tìm kiếm</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mã NV, họ tên, phòng ban..." style={{ width: 280 }} />
            </div>
            <button className="btn btn-ghost" onClick={() => setSearch('')}>Xóa lọc</button>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>{filtered.length} / {rows.length} nhân viên</span>
          </div>

          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>STT</th>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Phòng ban</th>
                    <th>Chức vụ</th>
                    <th>SĐT</th>
                    <th className="text-right">Lương ngày công</th>
                    <th className="text-right">Lương OT/H</th>
                    <th className="text-right">Cơm</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, index) => (
                    <tr key={row.id}>
                      <td className="text-center">{index + 1}</td>
                      <td><b>{row.ma_nv}</b></td>
                      <td>{row.ho_ten}</td>
                      <td>{row.phong_ban}</td>
                      <td>{row.chuc_vu}</td>
                      <td>{row.sdt}</td>
                      <td className="text-right num">{money(row.luong_ngay_cong)}</td>
                      <td className="text-right num">{money(row.luong_ot_gio)}</td>
                      <td className="text-right num">{money(row.tien_com_ngay)}</td>
                      <td>
                        <span className="badge" style={{ background: row.is_active ? '#e8f5e9' : '#fdecea', color: row.is_active ? '#2e7d32' : '#c0392b' }}>
                          {row.is_active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>✏️</button>{' '}
                        <button className="btn btn-danger btn-sm" onClick={() => del(row)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={11} className="text-center" style={{ padding: 24, color: '#aaa' }}>Chưa có nhân viên nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3>{modal.mode === 'add' ? '+ Thêm nhân viên' : '✏️ Sửa nhân viên'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã nhân viên *</label>
                  <input value={form.ma_nv} onChange={e => set('ma_nv', e.target.value)} placeholder="NV001" />
                </div>
                <div className="form-group">
                  <label>Họ tên *</label>
                  <input value={form.ho_ten} onChange={e => set('ho_ten', e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div className="form-group">
                  <label>Phòng ban</label>
                  <input value={form.phong_ban || ''} onChange={e => set('phong_ban', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Chức vụ</label>
                  <input value={form.chuc_vu || ''} onChange={e => set('chuc_vu', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>SĐT</label>
                  <input value={form.sdt || ''} onChange={e => set('sdt', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Ngày vào làm</label>
                  <input type="date" value={form.ngay_vao_lam || ''} onChange={e => set('ngay_vao_lam', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Lương ngày công</label>
                  <input type="number" min="0" step="0.01" value={form.luong_ngay_cong ?? ''} onChange={e => set('luong_ngay_cong', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Lương OT/H</label>
                  <input type="number" min="0" step="0.01" value={form.luong_ot_gio ?? ''} onChange={e => set('luong_ot_gio', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cơm</label>
                  <input type="number" min="0" step="0.01" value={form.tien_com_ngay ?? ''} onChange={e => set('tien_com_ngay', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select value={String(form.is_active)} onChange={e => set('is_active', e.target.value === 'true')}>
                    <option value="true">Hoạt động</option>
                    <option value="false">Đã khóa</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
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
