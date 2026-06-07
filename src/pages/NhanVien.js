import React, { useEffect, useState } from 'react';
import { getNhanVien, addNhanVien, updateNhanVien, deleteNhanVien, getLuongThamSo } from '../utils/api';
import { exportExcel } from '../utils/printExcel';

const BLANK = {
  ma_nv: '',
  ho_ten: '',
  cccd: '',
  dia_chi: '',
  trang_thai: 'dang_lam',
  phong_ban: '',
  chuc_vu: '',
  sdt: '',
  hinh_thuc_luong: 'ngay_cong',
  luong_co_ban: '',
  luong_ngay: '',
  he_so_ot: 1,
  phu_cap: '',
  ngay_vao_lam: '',
  luong_ngay_cong: '',
  luong_ot_gio: '',
  tien_com_ngay: '',
  ghi_chu: '',
  is_active: true,
};

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const norm = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_');

const classifyType = (row) => {
  const code = norm(row.ma_tham_so);
  const name = norm(row.ten_tham_so);
  if (code.includes('ngay_cong') || name.includes('ngay_cong') || name.includes('luong_ngay')) return 'ngay_cong';
  if (code.includes('ot_gio') || code.includes('ot') || name.includes('ot') || name.includes('tang_ca')) return 'ot_gio';
  if (code.includes('com') || name.includes('com')) return 'com';
  return null;
};

const buildOptions = (rows, type) => {
  const seen = new Set();
  return rows
    .filter(row => classifyType(row) === type)
    .map(row => ({
      value: Number(row.gia_tri || 0),
      label: `${row.ten_tham_so || row.ma_tham_so} - ${money(row.gia_tri)}${row.don_vi ? ` ${row.don_vi}` : ''}`,
    }))
    .filter(item => {
      const key = `${item.value}|${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.value - b.value);
};

export default function NhanVien() {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [salaryOptions, setSalaryOptions] = useState({ ngayCong: [], ot: [], com: [] });

  const load = () => {
    setLoading(true);
    Promise.all([getNhanVien(), getLuongThamSo().catch(() => [])])
      .then(([data, params]) => {
        setRows(data);
        setSalaryOptions({
          ngayCong: buildOptions(params, 'ngay_cong'),
          ot: buildOptions(params, 'ot_gio'),
          com: buildOptions(params, 'com'),
        });
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, []);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const openAdd = () => { setForm(BLANK); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (row) => {
    setForm({
      ...BLANK,
      ...row,
      trang_thai: row.trang_thai || (row.is_active === false ? 'nghi_viec' : 'dang_lam'),
      hinh_thuc_luong: row.hinh_thuc_luong || 'ngay_cong',
      ngay_vao_lam: row.ngay_vao_lam || '',
      he_so_ot: row.he_so_ot ?? 1,
    });
    setErr('');
    setModal({ mode: 'edit', id: row.id });
  };

  const save = async () => {
    if (!form.ma_nv || !form.ho_ten) {
      setErr('Nhập mã nhân viên và họ tên');
      return;
    }
    try {
      const payload = {
        ...form,
        trang_thai: form.trang_thai || 'dang_lam',
        hinh_thuc_luong: form.hinh_thuc_luong || 'ngay_cong',
        luong_co_ban: form.luong_co_ban === '' ? null : Number(form.luong_co_ban),
        luong_ngay: form.luong_ngay === '' ? null : Number(form.luong_ngay),
        he_so_ot: form.he_so_ot === '' ? 1 : Number(form.he_so_ot),
        phu_cap: form.phu_cap === '' ? null : Number(form.phu_cap),
        luong_ngay_cong: form.luong_ngay_cong === '' ? null : Number(form.luong_ngay_cong),
        luong_ot_gio: form.luong_ot_gio === '' ? null : Number(form.luong_ot_gio),
        tien_com_ngay: form.tien_com_ngay === '' ? null : Number(form.tien_com_ngay),
        is_active: (form.trang_thai || 'dang_lam') === 'dang_lam',
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
    const headers = ['STT', 'Mã NV', 'Họ tên', 'Lương ngày', 'Hệ số OT', 'Lương OT/H', 'Cơm', 'CCCD', 'Địa chỉ', 'Trạng thái', 'Hình thức lương', 'Lương cơ bản', 'Phụ cấp', 'Phòng ban', 'Chức vụ', 'SĐT', 'Ngày vào làm', 'Ghi chú', 'Tạo lúc', 'Cập nhật lúc'];
    const exRows = filtered.map((row, index) => [
      index + 1,
      row.ma_nv,
      row.ho_ten,
      Number(row.luong_ngay || row.luong_ngay_cong || 0),
      Number(row.he_so_ot || 1),
      Number(row.luong_ot_gio || 0),
      Number(row.tien_com_ngay || 0),
      row.cccd || '',
      row.dia_chi || '',
      row.trang_thai || (row.is_active ? 'dang_lam' : 'nghi_viec'),
      row.hinh_thuc_luong || 'ngay_cong',
      Number(row.luong_co_ban || 0),
      Number(row.phu_cap || 0),
      row.phong_ban || '',
      row.chuc_vu || '',
      row.sdt || '',
      row.ngay_vao_lam || '',
      row.ghi_chu || '',
      row.created_at || '',
      row.updated_at || '',
    ]);
    exportExcel(headers, exRows, 'DanhSachNhanVien');
  };

  const renderSalarySelect = (label, fieldKey, options, syncLuongNgayCong = false) => {
    const current = form[fieldKey] === null || form[fieldKey] === undefined ? '' : String(form[fieldKey]);
    const hasCurrent = options.some(opt => String(opt.value) === current);
    return (
      <div className="form-group">
        <label>{label}</label>
        <select
          value={current}
          onChange={e => {
            const value = e.target.value;
            set(fieldKey, value === '' ? '' : Number(value));
            if (syncLuongNgayCong) set('luong_ngay_cong', value === '' ? '' : Number(value));
          }}
        >
          <option value="">-- Chọn từ tham số / nhập tay --</option>
          {!hasCurrent && current !== '' && (
            <option value={current}>Giá trị hiện tại - {money(current)}</option>
          )}
          {options.map((opt, idx) => (
            <option key={`${fieldKey}_${idx}_${opt.value}`} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={form[fieldKey] ?? ''}
          onChange={e => {
            set(fieldKey, e.target.value);
            if (syncLuongNgayCong) set('luong_ngay_cong', e.target.value);
          }}
          placeholder="Nhập tay nếu không chọn trong danh sách"
        />
      </div>
    );
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
                    <th style={{ minWidth: 180 }}>Họ tên</th>
                    <th className="text-right">Lương ngày</th>
                    <th className="text-right">Lương OT/H</th>
                    <th className="text-right">Cơm</th>
                    <th>SĐT</th>
                    <th>CCCD</th>
                    <th>Địa chỉ</th>
                    <th>Trạng thái</th>
                    <th>Hình thức lương</th>
                    <th>Ngày vào làm</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, index) => (
                    <tr key={row.id}>
                      <td className="text-center">{index + 1}</td>
                      <td><b>{row.ma_nv}</b></td>
                      <td>{row.ho_ten}</td>
                      <td className="text-right num">{money(row.luong_ngay || row.luong_ngay_cong)}</td>
                      <td className="text-right num">{money(row.luong_ot_gio)}</td>
                      <td className="text-right num">{money(row.tien_com_ngay)}</td>
                      <td>{row.sdt}</td>
                      <td>{row.cccd}</td>
                      <td>{row.dia_chi}</td>
                      <td>
                        <span className="badge" style={{ background: (row.trang_thai || (row.is_active ? 'dang_lam' : 'nghi_viec')) === 'dang_lam' ? '#e8f5e9' : '#fdecea', color: (row.trang_thai || (row.is_active ? 'dang_lam' : 'nghi_viec')) === 'dang_lam' ? '#2e7d32' : '#c0392b' }}>
                          {(row.trang_thai || (row.is_active ? 'dang_lam' : 'nghi_viec')) === 'dang_lam' ? 'Đang làm' : 'Nghỉ việc'}
                        </span>
                      </td>
                      <td>{row.hinh_thuc_luong === 'thang' ? 'Tháng' : 'Ngày công'}</td>
                      <td>{row.ngay_vao_lam || ''}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>✏️</button>{' '}
                        <button className="btn btn-danger btn-sm" onClick={() => del(row)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={13} className="text-center" style={{ padding: 24, color: '#aaa' }}>Chưa có nhân viên nào</td>
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
                  <label>CCCD</label>
                  <input value={form.cccd || ''} onChange={e => set('cccd', e.target.value)} placeholder="0792..." />
                </div>
                <div className="nv-salary-row" style={{ gridColumn: '1 / -1' }}>
                  {renderSalarySelect('Lương ngày công', 'luong_ngay', salaryOptions.ngayCong, true)}
                  {renderSalarySelect('Lương OT/H', 'luong_ot_gio', salaryOptions.ot)}
                  {renderSalarySelect('Cơm', 'tien_com_ngay', salaryOptions.com)}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Địa chỉ</label>
                  <input value={form.dia_chi || ''} onChange={e => set('dia_chi', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select value={form.trang_thai || 'dang_lam'} onChange={e => set('trang_thai', e.target.value)}>
                    <option value="dang_lam">Đang làm</option>
                    <option value="nghi_viec">Nghỉ việc</option>
                  </select>
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
                  <label>Hình thức lương</label>
                  <select value={form.hinh_thuc_luong || 'ngay_cong'} onChange={e => set('hinh_thuc_luong', e.target.value)}>
                    <option value="ngay_cong">Ngày công</option>
                    <option value="thang">Tháng</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ngày vào làm</label>
                  <input type="date" value={form.ngay_vao_lam || ''} onChange={e => set('ngay_vao_lam', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Lương cơ bản</label>
                  <input type="number" min="0" step="0.01" value={form.luong_co_ban ?? ''} onChange={e => set('luong_co_ban', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Hệ số OT</label>
                  <input type="number" min="0" step="0.01" value={form.he_so_ot ?? 1} onChange={e => set('he_so_ot', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Phụ cấp</label>
                  <input type="number" min="0" step="0.01" value={form.phu_cap ?? ''} onChange={e => set('phu_cap', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Tạo lúc</label>
                  <input value={form.created_at ? String(form.created_at).slice(0, 19).replace('T', ' ') : ''} readOnly />
                </div>
                <div className="form-group">
                  <label>Cập nhật lúc</label>
                  <input value={form.updated_at ? String(form.updated_at).slice(0, 19).replace('T', ' ') : ''} readOnly />
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
