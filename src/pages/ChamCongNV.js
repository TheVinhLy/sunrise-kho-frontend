import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addChamCongNv, deleteChamCongNv, getChamCongNv, getNhanVien, importChamCongNv, updateChamCongNv } from '../utils/api';
import { exportExcel, readExcelFile, readExcelTable } from '../utils/printExcel';

const monthKey = new Date().toISOString().slice(0, 7);
const monthStart = `${monthKey}-01`;
const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);

const BLANK = {
  nhan_vien_id: '',
  ngay_cham_cong: new Date().toISOString().slice(0, 10),
  so_ngay_cong: 8,
  so_gio_ot: 0,
  so_suat_com: 1,
  ghi_chu: '',
};

function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pickRowValue(row, aliases) {
  const normalized = Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [normalizeHeader(key), value]));
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (normalized[key] !== undefined && normalized[key] !== null && normalized[key] !== '') return normalized[key];
  }
  return '';
}

function parseDate(value) {
  if (!value && value !== 0) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  if (!text) return '';
  const ymd = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${String(ymd[2]).padStart(2, '0')}-${String(ymd[3]).padStart(2, '0')}`;
  const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

export default function ChamCongNV() {
  const [rows, setRows] = useState([]);
  const [dsNV, setDsNV] = useState([]);
  const [filters, setFilters] = useState({ thang: monthKey, tu_ngay: monthStart, den_ngay: monthEnd, nhan_vien_id: '' });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    const params = {
      thang: filters.thang,
      tu_ngay: filters.tu_ngay,
      den_ngay: filters.den_ngay,
    };
    if (filters.nhan_vien_id) params.nhan_vien_id = filters.nhan_vien_id;

    Promise.allSettled([
      getNhanVien(),
      getChamCongNv(params),
    ])
      .then(([nvResult, ccResult]) => {
        const nv = nvResult.status === 'fulfilled' && Array.isArray(nvResult.value) ? nvResult.value : [];
        const data = ccResult.status === 'fulfilled' && Array.isArray(ccResult.value) ? ccResult.value : [];
        setDsNV(nv);
        setRows(data);
        if (nvResult.status === 'rejected' || ccResult.status === 'rejected') {
          const nvErr = nvResult.status === 'rejected' ? nvResult.reason?.message || 'Lỗi tải nhân viên' : '';
          const ccErr = ccResult.status === 'rejected' ? ccResult.reason?.message || 'Lỗi tải chấm công' : '';
          setErr([nvErr, ccErr].filter(Boolean).join(' | '));
        } else {
          setErr('');
        }
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, [filters.thang, filters.tu_ngay, filters.den_ngay, filters.nhan_vien_id]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const openAdd = () => { setForm(BLANK); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (row) => {
    setForm({
      ...BLANK,
      ...row,
      nhan_vien_id: String(row.nhan_vien_id || ''),
      ngay_cham_cong: parseDate(row.ngay_cham_cong) || '',
    });
    setErr('');
    setModal({ mode: 'edit', id: row.id });
  };

  const save = async () => {
    if (!form.nhan_vien_id || !form.ngay_cham_cong) {
      setErr('Chọn nhân viên và ngày chấm công');
      return;
    }
    try {
      const payload = {
        ...form,
        nhan_vien_id: Number(form.nhan_vien_id),
        so_ngay_cong: Number(form.so_ngay_cong || 0),
        so_gio_ot: Number(form.so_gio_ot || 0),
        so_suat_com: Number(form.so_suat_com || 0),
      };
      if (modal.mode === 'add') {
        await addChamCongNv(payload);
        const month = String(payload.ngay_cham_cong).slice(0, 7);
        const start = `${month}-01`;
        const end = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10);
        // Ensure the freshly created row is visible even when current filters are on another month/employee.
        setFilters(prev => ({ ...prev, thang: month, tu_ngay: start, den_ngay: end, nhan_vien_id: '' }));
      } else {
        await updateChamCongNv(modal.id, payload);
        load();
      }
      setModal(null);
    } catch (e) {
      setErr(e.message);
    }
  };

  const del = async (row) => {
    if (!window.confirm(`Xóa chấm công ngày ${row.ngay_cham_cong} của ${row.ho_ten}?`)) return;
    await deleteChamCongNv(row.id).catch(e => alert(e.message));
    load();
  };

  const handleExcelExport = () => {
    const headers = ['STT', 'Ngày chấm công', 'Mã NV', 'Họ tên', 'Phòng ban', 'Số giờ công', 'Số giờ OT', 'Số suất cơm', 'Ghi chú'];
    const exRows = rows.map((row, index) => [
      index + 1,
      row.ngay_cham_cong,
      row.ma_nv,
      row.ho_ten,
      row.phong_ban || '',
      Number(row.so_ngay_cong || 0),
      Number(row.so_gio_ot || 0),
      Number(row.so_suat_com || 0),
      row.ghi_chu || '',
    ]);
    exportExcel(headers, exRows, `ChamCong_${filters.thang}`);
  };

  const handleTemplate = () => {
    const headers = ['Mã NV', 'Họ tên', 'Ngày chấm công', 'Số giờ công', 'Số giờ OT', 'Số suất cơm', 'Phòng ban', 'Chức vụ', 'SĐT', 'Lương ngày công', 'Lương OT/H', 'Cơm', 'Ghi chú'];
    const exRows = [
      ['NV001', 'Nguyễn Văn A', `${filters.thang}-01`, 1, 2, 1, 'Sản xuất', 'Công nhân', '0900000000', 0, 0, 0, 'Mẫu import'],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
    ];
    exportExcel(headers, exRows, 'Mau_ChamCongNV');
  };

  const handleImportClick = () => fileRef.current?.click();

  const normalizeHeader = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const parseExcelDate = (value) => {
    if (!value && value !== 0) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const text = String(value).trim();
    if (!text) return '';
    const ymd = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymd) return `${ymd[1]}-${String(ymd[2]).padStart(2, '0')}-${String(ymd[3]).padStart(2, '0')}`;
    const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return '';
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setImporting(true);
      const workbookRows = await readExcelTable(file, { sheetIndex: 1, headerRow: 7 });
      const parsedRows = workbookRows.length ? workbookRows : await readExcelFile(file, 1);
      if (!parsedRows.length) {
        alert('File Excel không có dữ liệu.');
        setImporting(false);
        return;
      }
      const prepared = parsedRows.map(row => {
        const normalized = Object.entries(row).reduce((acc, [key, value]) => {
          acc[normalizeHeader(key)] = value;
          return acc;
        }, {});
        return {
          ma_nv: normalized.ma_nv || normalized.ma_nhan_vien || normalized.ma || normalized.employee_code || normalized.code || '',
          ho_ten: normalized.ten || normalized.ho_ten || normalized.ho_va_ten || normalized.employee_name || normalized.name || '',
          ngay_cham_cong: parseExcelDate(normalized.ngay || normalized.ngay_cham_cong || normalized.date),
          so_ngay_cong: normalized.ngay_cong || normalized.so_ngay_cong || normalized.cong || normalized.gio_cong || 0,
          so_gio_ot: normalized.ot || normalized.so_gio_ot || normalized.gio_ot || 0,
          so_suat_com: normalized.com || normalized.so_suat_com || 0,
          phong_ban: normalized.phong_ban || normalized.department || '',
          chuc_vu: normalized.chuc_vu || normalized.position || '',
          sdt: normalized.sdt || normalized.so_dien_thoai || normalized.phone || '',
          luong_ngay_cong: normalized.luong_ngay_cong || normalized.don_gia_ngay_cong || '',
          luong_ot_gio: normalized.luong_ot_gio || normalized.luong_ot_h || '',
          tien_com_ngay: normalized.tien_com_ngay || normalized.luong_com || '',
          ghi_chu: normalized.ghi_chu || normalized.note || '',
        };
      }).filter(row => row.ma_nv && row.ho_ten && row.ngay_cham_cong);

      if (!prepared.length) {
        alert('Không tìm thấy dòng hợp lệ. Cần có Mã NV, Họ tên và Ngày chấm công.');
        setImporting(false);
        return;
      }

      if (!window.confirm(`Import ${prepared.length} dòng chấm công từ file Excel?`)) {
        setImporting(false);
        return;
      }

      await importChamCongNv(prepared);
      setImporting(false);
      load();
    } catch (e) {
      setImporting(false);
      alert(e.message);
    }
  };

  const summary = useMemo(() => rows.reduce((acc, row) => {
    acc.tong_ngay_cong += Number(row.so_ngay_cong || 0);
    acc.tong_gio_ot += Number(row.so_gio_ot || 0);
    acc.tong_suat_com += Number(row.so_suat_com || 0);
    return acc;
  }, { tong_ngay_cong: 0, tong_gio_ot: 0, tong_suat_com: 0 }), [rows]);

  const employeeOptions = useMemo(() => dsNV
    .filter(row => row && row.id !== undefined && row.id !== null)
    .map(row => ({
      id: String(row.id),
      label: [row.ma_nv, row.ho_ten, row.phong_ban || row.chuc_vu || ''].filter(Boolean).join(' - '),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'vi')),
  [dsNV]);

  const selectedNhanVien = useMemo(
    () => dsNV.find(row => String(row.id) === String(form.nhan_vien_id || '')) || null,
    [dsNV, form.nhan_vien_id]
  );

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>🕒 Chấm công nhân viên</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={handleTemplate}>📄 Mẫu Excel</button>
            <button className="btn btn-ghost" onClick={handleImportClick} disabled={importing}>{importing ? 'Đang import...' : '📥 Import Excel'}</button>
            <button className="btn btn-ghost" onClick={handleExcelExport}>📤 Xuất Excel</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Thêm chấm công</button>
          </div>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Dòng chấm công</div>
              <div className="stat-value">{rows.length}</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Tổng giờ công</div>
              <div className="stat-value">{Number(summary.tong_ngay_cong).toLocaleString('vi-VN')}</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-label">Tổng giờ OT</div>
              <div className="stat-value">{Number(summary.tong_gio_ot).toLocaleString('vi-VN')}</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Tổng suất cơm</div>
              <div className="stat-value">{Number(summary.tong_suat_com).toLocaleString('vi-VN')}</div>
            </div>
          </div>

          <div className="filter-bar">
            <div className="form-group">
              <label>Tháng</label>
              <input
                type="month"
                value={filters.thang}
                onChange={e => {
                  const thang = e.target.value;
                  const start = `${thang}-01`;
                  const end = new Date(Number(thang.slice(0, 4)), Number(thang.slice(5, 7)), 0).toISOString().slice(0, 10);
                  setFilters(prev => ({ ...prev, thang, tu_ngay: start, den_ngay: end }));
                }}
              />
            </div>
            <div className="form-group">
              <label>Từ ngày</label>
              <input type="date" value={filters.tu_ngay} onChange={e => setFilters(prev => ({ ...prev, tu_ngay: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <input type="date" value={filters.den_ngay} onChange={e => setFilters(prev => ({ ...prev, den_ngay: e.target.value }))} />
            </div>
            <div className="form-group" style={{ minWidth: 220 }}>
              <label>Nhân viên</label>
              <select value={filters.nhan_vien_id} onChange={e => setFilters(prev => ({ ...prev, nhan_vien_id: e.target.value }))}>
                <option value="">Tất cả</option>
                {employeeOptions.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
              </select>
            </div>
            <button className="btn btn-ghost" onClick={() => setFilters({ thang: monthKey, tu_ngay: monthStart, den_ngay: monthEnd, nhan_vien_id: '' })}>Xóa lọc</button>
          </div>

          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportFile} />

          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Phòng ban</th>
                    <th className="text-right">Giờ công</th>
                    <th className="text-right">OT giờ</th>
                    <th className="text-right">Suất cơm</th>
                    <th>Ghi chú</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id}>
                      <td>{row.ngay_cham_cong}</td>
                      <td><b>{row.ma_nv}</b></td>
                      <td>{row.ho_ten}</td>
                      <td>{row.phong_ban}</td>
                      <td className="text-right num">{Number(row.so_ngay_cong || 0).toLocaleString('vi-VN')}</td>
                      <td className="text-right num">{Number(row.so_gio_ot || 0).toLocaleString('vi-VN')}</td>
                      <td className="text-right num">{Number(row.so_suat_com || 0).toLocaleString('vi-VN')}</td>
                      <td>{row.ghi_chu}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>✏️</button>{' '}
                        <button className="btn btn-danger btn-sm" onClick={() => del(row)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={9} className="text-center" style={{ padding: 24, color: '#aaa' }}>Chưa có dữ liệu chấm công</td>
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
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3>{modal.mode === 'add' ? '+ Thêm chấm công' : '✏️ Sửa chấm công'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Nhân viên *</label>
                  <select
                    value={form.nhan_vien_id || ''}
                    onChange={e => set('nhan_vien_id', e.target.value)}
                    disabled={modal.mode === 'edit'}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {!employeeOptions.length && <option value="" disabled>Chưa có nhân viên</option>}
                    {employeeOptions.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mã NV</label>
                  <input type="text" value={selectedNhanVien?.ma_nv || ''} readOnly placeholder="Tự động theo nhân viên" />
                </div>
                <div className="form-group">
                  <label>Ngày chấm công *</label>
                  <input type="date" value={form.ngay_cham_cong || ''} onChange={e => set('ngay_cham_cong', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Số giờ công</label>
                  <input type="number" min="0" step="0.01" value={form.so_ngay_cong ?? ''} onChange={e => set('so_ngay_cong', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Số giờ OT</label>
                  <input type="number" min="0" step="0.01" value={form.so_gio_ot ?? ''} onChange={e => set('so_gio_ot', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Số suất cơm</label>
                  <input type="number" min="0" step="1" value={form.so_suat_com ?? ''} onChange={e => set('so_suat_com', e.target.value)} />
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
