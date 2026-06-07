import React, { useEffect, useMemo, useState } from 'react';
import { chotBangLuong, getBangLuong, getCongTy, getNhanVien } from '../utils/api';
import { fmt, loadXlsxStyle, printHtml } from '../utils/printExcel';

function getCurrentWeekToken() {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = (utcDate.getUTCDay() + 6) % 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 3 - day);
  const firstThursday = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - firstDay);
  const week = 1 + Math.round((utcDate - firstThursday) / (7 * 24 * 3600 * 1000));
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getWeekBounds(weekToken) {
  const matched = String(weekToken || '').match(/^(\d{4})-W(\d{2})$/);
  if (!matched) return null;
  const year = Number(matched[1]);
  const week = Number(matched[2]);
  if (!year || !week) return null;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Start = new Date(jan4);
  week1Start.setUTCDate(jan4.getUTCDate() - jan4Day);
  const startDate = new Date(week1Start);
  startDate.setUTCDate(week1Start.getUTCDate() + (week - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  const toKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  return { start: toKey(startDate), end: toKey(endDate) };
}

function getMonthBounds(monthToken) {
  const text = String(monthToken || '');
  if (!/^\d{4}-\d{2}$/.test(text)) return null;
  const [yearText, monthText] = text.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const start = `${yearText}-${monthText}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const end = `${yearText}-${monthText}-${String(endDay).padStart(2, '0')}`;
  return { start, end };
}

function fmtDateVi(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text || '-';
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

export default function BangLuong() {
  const currentDate = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentWeek = getCurrentWeekToken();
  const currentWeekBounds = getWeekBounds(currentWeek);
  const [kieuKy, setKieuKy] = useState('week');
  const [tuan, setTuan] = useState(currentWeek);
  const [thang, setThang] = useState(currentMonth);
  const [tuNgay, setTuNgay] = useState(currentWeekBounds?.start || currentDate);
  const [denNgay, setDenNgay] = useState(currentWeekBounds?.end || currentDate);
  const [nhanVienId, setNhanVienId] = useState('');
  const [dsNhanVien, setDsNhanVien] = useState([]);
  const [congTy, setCongTy] = useState(null);
  const [data, setData] = useState({ rows: [], totals: { tong_ngay_cong: 0, tong_gio_ot: 0, tong_suat_com: 0, tong_luong: 0 }, tham_so: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const headerCellStyle = {
    textAlign: 'center',
    verticalAlign: 'middle',
    border: '1px solid #2f7d57',
    background: '#ffffff',
    color: '#111',
    fontWeight: 800,
    padding: '8px 6px',
  };

  const subHeaderCellStyle = {
    ...headerCellStyle,
    padding: '6px',
  };

  const load = () => {
    setLoading(true);
    const params = kieuKy === 'week'
      ? { tuan }
      : (kieuKy === 'month' ? { thang } : { tu_ngay: tuNgay, den_ngay: denNgay });
    if (nhanVienId) params.nhan_vien_id = nhanVienId;
    getBangLuong(params)
      .then(result => { setData(result); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, [kieuKy, tuan, thang, tuNgay, denNgay, nhanVienId]);

  useEffect(() => {
    getNhanVien().then(rows => setDsNhanVien(Array.isArray(rows) ? rows : [])).catch(() => setDsNhanVien([]));
    getCongTy().then(setCongTy).catch(() => setCongTy(null));
  }, []);

  const summaryCards = useMemo(() => ([
    { label: 'Nhân viên', value: data.rows.length, color: 'blue' },
    { label: 'Tổng ngày công', value: fmt(data.totals?.tong_ngay_cong || 0), color: '' },
    { label: 'Tổng OT', value: fmt(data.totals?.tong_gio_ot || 0), color: 'orange' },
    { label: 'Tổng suất cơm', value: fmt(data.totals?.tong_suat_com || 0), color: 'red' },
    { label: 'Tổng lương', value: fmt(data.totals?.tong_luong || 0), color: '' },
  ]), [data]);

  const buildHeaderTitle = () => {
    const start = data.start || tuNgay;
    const end = data.end || denNgay;
    const rangeText = `${fmtDateVi(start)} - ${fmtDateVi(end)}`;
    const suffix = kieuKy === 'week' ? 'TUẦN' : (kieuKy === 'month' ? 'THÁNG' : 'NGÀY');
    return `BẢNG LƯƠNG NHÂN CÔNG ${suffix} TỪ ${rangeText}`;
  };

  const handleExcel = async () => {
    try {
      const XLSXStyle = await loadXlsxStyle();
      const excelTitle = buildHeaderTitle();
      const ctyName = String(congTy?.ten_cong_ty || '').trim();
      const ctyAddress = String(congTy?.dia_chi || '').trim();
      const ctyTaxCode = String(congTy?.ma_so_thue || '').trim();
      const headerStartRow = 4;
      const subHeaderRow = headerStartRow + 1;
      const dataStartRow = subHeaderRow + 1;
      const totalRow = dataStartRow + data.rows.length;
      const sheetRows = [
        [ctyName],
        [ctyAddress],
        [`MST: ${ctyTaxCode || ''}`],
        [excelTitle],
        ['STT', 'MÃ NV', 'HỌ VÀ TÊN', 'LƯƠNG NGÀY CÔNG', 'LƯƠNG OT/H', 'CƠM', 'NGÀY CÔNG', null, 'OT', null, 'CƠM', null, 'THU NHẬP'],
        [null, null, null, null, null, null, 'NGÀY', 'LƯƠNG', 'GIỜ', 'LƯƠNG', 'CÔNG', 'TIỀN CƠM', null],
        ...data.rows.map((row, index) => [
          index + 1,
          row.ma_nv,
          row.ho_ten,
          Number(row.luong_ngay_cong || 0),
          Number(row.luong_ot_gio || 0),
          Number(row.tien_com_ngay || 0),
          Number(row.tong_ngay_cong || 0),
          Number(row.tien_ngay_cong || 0),
          Number(row.tong_gio_ot || 0),
          Number(row.tien_ot || 0),
          Number(row.tong_suat_com || 0),
          Number(row.tien_com || 0),
          Number(row.tong_luong || 0),
        ]),
        ['TỔNG', '', '', '', '', '', Number(data.totals?.tong_ngay_cong || 0), '', Number(data.totals?.tong_gio_ot || 0), '', Number(data.totals?.tong_suat_com || 0), '', Number(data.totals?.tong_luong || 0)],
      ];

      const ws = XLSXStyle.utils.aoa_to_sheet(sheetRows);
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 12 } },
        { s: { r: headerStartRow, c: 0 }, e: { r: subHeaderRow, c: 0 } },
        { s: { r: headerStartRow, c: 1 }, e: { r: subHeaderRow, c: 1 } },
        { s: { r: headerStartRow, c: 2 }, e: { r: subHeaderRow, c: 2 } },
        { s: { r: headerStartRow, c: 3 }, e: { r: subHeaderRow, c: 3 } },
        { s: { r: headerStartRow, c: 4 }, e: { r: subHeaderRow, c: 4 } },
        { s: { r: headerStartRow, c: 5 }, e: { r: subHeaderRow, c: 5 } },
        { s: { r: headerStartRow, c: 6 }, e: { r: headerStartRow, c: 7 } },
        { s: { r: headerStartRow, c: 8 }, e: { r: headerStartRow, c: 9 } },
        { s: { r: headerStartRow, c: 10 }, e: { r: headerStartRow, c: 11 } },
        { s: { r: headerStartRow, c: 12 }, e: { r: subHeaderRow, c: 12 } },
        { s: { r: totalRow, c: 0 }, e: { r: totalRow, c: 5 } },
      ];
      ws['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
        { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 },
      ];
      ws['!rows'] = [{ hpt: 22 }, { hpt: 20 }, { hpt: 20 }, { hpt: 26 }, { hpt: 24 }, { hpt: 22 }];

      const range = XLSXStyle.utils.decode_range(ws['!ref']);
      const headerStyle = {
        font: { name: 'Times New Roman', bold: true, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        border: {
          top: { style: 'thin', color: { rgb: '2F7D57' } },
          bottom: { style: 'thin', color: { rgb: '2F7D57' } },
          left: { style: 'thin', color: { rgb: '2F7D57' } },
          right: { style: 'thin', color: { rgb: '2F7D57' } },
        },
      };
      const subHeaderStyle = {
        ...headerStyle,
        font: { name: 'Times New Roman', bold: true, sz: 12 },
      };
      const titleStyle = {
        ...headerStyle,
        font: { name: 'Times New Roman', bold: true, sz: 16 },
      };
      const bodyStyle = {
        font: { name: 'Times New Roman', sz: 12 },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '2F7D57' } },
          bottom: { style: 'thin', color: { rgb: '2F7D57' } },
          left: { style: 'thin', color: { rgb: '2F7D57' } },
          right: { style: 'thin', color: { rgb: '2F7D57' } },
        },
      };
      const totalStyle = {
        ...bodyStyle,
        font: { name: 'Times New Roman', bold: true, sz: 12 },
        fill: { fgColor: { rgb: 'EEF6F2' } },
      };
      const companyStyle = {
        ...bodyStyle,
        font: { name: 'Times New Roman', bold: true, sz: 13 },
        alignment: { horizontal: 'left', vertical: 'center' },
      };

      for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
        for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: rowIndex, c: colIndex });
          if (!ws[cellRef] && rowIndex >= headerStartRow && rowIndex <= totalRow) {
            ws[cellRef] = { t: 's', v: '' };
          }
          if (!ws[cellRef]) continue;
          if (rowIndex <= 2) ws[cellRef].s = companyStyle;
          else if (rowIndex === 3) ws[cellRef].s = titleStyle;
          else if (rowIndex === headerStartRow) ws[cellRef].s = headerStyle;
          else if (rowIndex === subHeaderRow) ws[cellRef].s = subHeaderStyle;
          else if (rowIndex === totalRow) ws[cellRef].s = totalStyle;
          else {
            const isNum = colIndex === 0 || colIndex >= 3;
            ws[cellRef].s = {
              ...bodyStyle,
              alignment: { horizontal: isNum ? 'right' : 'left', vertical: 'center' },
              numFmt: isNum && typeof ws[cellRef].v === 'number' ? '#,##0.##' : undefined,
            };
          }
        }
      }

      const wb = XLSXStyle.utils.book_new();
      XLSXStyle.utils.book_append_sheet(wb, ws, 'BangLuong');
      const kyFile = data.ky_tinh || (kieuKy === 'week' ? `W_${tuan}` : (kieuKy === 'month' ? `M_${thang}` : `R_${tuNgay || 'na'}_${denNgay || 'na'}`));
      XLSXStyle.writeFile(wb, `BangLuong_${kyFile}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert(e.message || 'Không xuất được Excel.');
    }
  };

  const handlePrint = () => {
    const printTitle = buildHeaderTitle();
    const ctyName = String(congTy?.ten_cong_ty || '').trim();
    const ctyAddress = String(congTy?.dia_chi || '').trim();
    const ctyTaxCode = String(congTy?.ma_so_thue || '').trim();
    const nhanVienText = nhanVienId
      ? (dsNhanVien.find(item => String(item.id) === String(nhanVienId))?.ho_ten || 'Đã chọn')
      : 'Tất cả';
    const rowsHtml = data.rows.map((row, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${row.ma_nv || ''}</td>
        <td>${row.ho_ten || ''}</td>
        <td class="num">${fmt(row.tong_ngay_cong)}</td>
        <td class="num">${fmt(row.tong_gio_ot)}</td>
        <td class="num">${fmt(row.tong_suat_com)}</td>
        <td class="num">${fmt(row.tong_luong)}</td>
      </tr>
    `).join('');

    const content = `
      <p><b>${ctyName || ''}</b></p>
      <p>${ctyAddress || ''}</p>
      <p><b>MST:</b> ${ctyTaxCode || ''}</p>
      <h2>${printTitle}</h2>
      <p><b>Nhân viên:</b> ${nhanVienText}</p>
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã NV</th>
            <th>Họ tên</th>
            <th>Ngày công</th>
            <th>Giờ OT</th>
            <th>Suất cơm</th>
            <th>Thu nhập</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7" class="center">Không có dữ liệu</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="center"><b>TỔNG</b></td>
            <td class="num"><b>${fmt(data.totals?.tong_ngay_cong)}</b></td>
            <td class="num"><b>${fmt(data.totals?.tong_gio_ot)}</b></td>
            <td class="num"><b>${fmt(data.totals?.tong_suat_com)}</b></td>
            <td class="num"><b>${fmt(data.totals?.tong_luong)}</b></td>
          </tr>
        </tfoot>
      </table>
    `;
    printHtml(content, 'In bảng lương');
  };

  const handleChot = async () => {
    const kyText = data.label || data.ky_tinh || (kieuKy === 'week'
      ? `Tuần ${tuan || '-'}`
      : (kieuKy === 'month' ? `Tháng ${thang || '-'}` : `${tuNgay || '-'} đến ${denNgay || '-'}`));
    if (!window.confirm(`Chốt bảng lương kỳ ${kyText}?`)) return;
    try {
      setSaving(true);
      await chotBangLuong({
        ky_tinh: data.ky_tinh || (kieuKy === 'week' ? `W:${tuan}` : (kieuKy === 'month' ? `M:${thang}` : `R:${tuNgay}_${denNgay}`)),
        nhan_vien_id: nhanVienId || undefined,
      });
      setSaving(false);
      load();
      alert('Đã chốt bảng lương.');
    } catch (e) {
      setSaving(false);
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>📑 Bảng lương theo kỳ</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={kieuKy} onChange={e => setKieuKy(e.target.value)}>
              <option value="week">Theo tuần</option>
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
            </select>
            {kieuKy === 'week' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <input type="week" value={tuan} onChange={e => setTuan(e.target.value)} />
              </div>
            ) : kieuKy === 'month' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <input type="month" value={thang} onChange={e => setThang(e.target.value)} />
              </div>
            ) : (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)} />
                </div>
              </>
            )}
            <div className="form-group" style={{ margin: 0, minWidth: 220 }}>
              <select value={nhanVienId} onChange={e => setNhanVienId(e.target.value)}>
                <option value="">Tất cả nhân viên</option>
                {dsNhanVien.map(row => (
                  <option key={row.id} value={row.id}>{[row.ma_nv, row.ho_ten].filter(Boolean).join(' - ')}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-ghost" onClick={load}>🔄 Tính lại</button>
            <button className="btn btn-ghost" onClick={handlePrint}>🖨️ In</button>
            <button className="btn btn-ghost" onClick={handleExcel}>📥 Xuất Excel</button>
            <button className="btn btn-primary" onClick={handleChot} disabled={saving}>{saving ? 'Đang chốt...' : '✅ Chốt lương'}</button>
          </div>
        </div>
        <div className="card-body">
          <div className="filter-bar" style={{ marginBottom: 20 }}>
            <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
              Kỳ tính: {data.label || data.ky_tinh || '-'}
            </span>
            {kieuKy === 'week' ? (
              <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
                Tuần: {tuan || '-'}
              </span>
            ) : kieuKy === 'month' ? (
              <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
                Tháng: {thang || '-'}
              </span>
            ) : (
              <>
                <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
                  Từ ngày: {tuNgay || '-'}
                </span>
                <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
                  Đến ngày: {denNgay || '-'}
                </span>
              </>
            )}
            {nhanVienId ? (
              <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
                NV: {dsNhanVien.find(item => String(item.id) === String(nhanVienId))?.ho_ten || nhanVienId}
              </span>
            ) : null}
          </div>

          <div className="stats-grid">
            {summaryCards.map(card => (
              <div key={card.label} className={`stat-card ${card.color || ''}`.trim()}>
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
              </div>
            ))}
          </div>

          {data.tham_so?.length ? (
            <div className="filter-bar" style={{ marginBottom: 20 }}>
              {data.tham_so.map(item => (
                <span key={item.id} className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
                  {item.ten_tham_so}: {Number(item.gia_tri || 0).toLocaleString('vi-VN')} {item.don_vi || ''}
                </span>
              ))}
            </div>
          ) : null}

          {err && <div className="alert alert-error">{err}</div>}

          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table style={{ borderCollapse: 'collapse', minWidth: 1100 }}>
                <thead>
                  <tr>
                    <th rowSpan="2" style={{ ...headerCellStyle, width: 60 }}>STT</th>
                    <th rowSpan="2" style={headerCellStyle}>MÃ NV</th>
                    <th rowSpan="2" style={{ ...headerCellStyle, minWidth: 180 }}>HỌ VÀ TÊN</th>
                    <th rowSpan="2" style={headerCellStyle}>LƯƠNG NGÀY CÔNG</th>
                    <th rowSpan="2" style={headerCellStyle}>LƯƠNG OT/H</th>
                    <th rowSpan="2" style={headerCellStyle}>CƠM</th>
                    <th colSpan="2" style={headerCellStyle}>NGÀY CÔNG</th>
                    <th colSpan="2" style={headerCellStyle}>OT</th>
                    <th colSpan="2" style={headerCellStyle}>CƠM</th>
                    <th rowSpan="2" style={headerCellStyle}>THU NHẬP</th>
                  </tr>
                  <tr>
                    <th style={subHeaderCellStyle}>NGÀY</th>
                    <th style={subHeaderCellStyle}>LƯƠNG</th>
                    <th style={subHeaderCellStyle}>GIỜ</th>
                    <th style={subHeaderCellStyle}>LƯƠNG</th>
                    <th style={subHeaderCellStyle}>CÔNG</th>
                    <th style={subHeaderCellStyle}>TIỀN CƠM</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, index) => (
                    <tr key={row.id}>
                      <td className="text-center" style={{ border: '1px solid #d7e6dd' }}>{index + 1}</td>
                      <td style={{ border: '1px solid #d7e6dd' }}><b>{row.ma_nv}</b></td>
                      <td style={{ border: '1px solid #d7e6dd' }}>{row.ho_ten}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.luong_ngay_cong)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.luong_ot_gio)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.tien_com_ngay)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.tong_ngay_cong)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.tien_ngay_cong)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.tong_gio_ot)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.tien_ot)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.tong_suat_com)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd' }}>{fmt(row.tien_com)}</td>
                      <td className="text-right num" style={{ border: '1px solid #d7e6dd', fontWeight: 800 }}><b>{fmt(row.tong_luong)}</b></td>
                    </tr>
                  ))}
                  {!!data.rows.length && (
                    <tr style={{ background: '#eef6f2' }}>
                      <td colSpan={6} style={{ border: '1px solid #2f7d57', fontWeight: 800, textAlign: 'center', fontFamily: 'Times New Roman, serif' }}>TỔNG</td>
                      <td className="text-right num" style={{ border: '1px solid #2f7d57', fontWeight: 800 }}>{fmt(data.totals?.tong_ngay_cong)}</td>
                      <td style={{ border: '1px solid #2f7d57' }} />
                      <td className="text-right num" style={{ border: '1px solid #2f7d57', fontWeight: 800 }}>{fmt(data.totals?.tong_gio_ot)}</td>
                      <td style={{ border: '1px solid #2f7d57' }} />
                      <td className="text-right num" style={{ border: '1px solid #2f7d57', fontWeight: 800 }}>{fmt(data.totals?.tong_suat_com)}</td>
                      <td style={{ border: '1px solid #2f7d57' }} />
                      <td className="text-right num" style={{ border: '1px solid #2f7d57', fontWeight: 800 }}>{fmt(data.totals?.tong_luong)}</td>
                    </tr>
                  )}
                  {!data.rows.length && (
                    <tr>
                      <td colSpan={13} className="text-center" style={{ padding: 24, color: '#aaa' }}>Chưa có dữ liệu lương</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
