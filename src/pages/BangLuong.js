import React, { useEffect, useMemo, useState } from 'react';
import { chotBangLuong, getBangLuong } from '../utils/api';
import { fmt, loadXlsxStyle } from '../utils/printExcel';

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

export default function BangLuong() {
  const currentDate = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [kieuKy, setKieuKy] = useState('week');
  const [ngay, setNgay] = useState(currentDate);
  const [tuan, setTuan] = useState(getCurrentWeekToken());
  const [thang, setThang] = useState(currentMonth);
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
    const params = kieuKy === 'day' ? { ngay } : (kieuKy === 'week' ? { tuan } : { thang });
    getBangLuong(params)
      .then(result => { setData(result); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, [kieuKy, ngay, tuan, thang]);

  const summaryCards = useMemo(() => ([
    { label: 'Nhân viên', value: data.rows.length, color: 'blue' },
    { label: 'Tổng ngày công', value: fmt(data.totals?.tong_ngay_cong || 0), color: '' },
    { label: 'Tổng OT', value: fmt(data.totals?.tong_gio_ot || 0), color: 'orange' },
    { label: 'Tổng suất cơm', value: fmt(data.totals?.tong_suat_com || 0), color: 'red' },
    { label: 'Tổng lương', value: fmt(data.totals?.tong_luong || 0), color: '' },
  ]), [data]);

  const handleExcel = async () => {
    try {
      const XLSXStyle = await loadXlsxStyle();
      const sheetRows = [
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
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
        { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
        { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },
        { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } },
        { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } },
        { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } },
        { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } },
        { s: { r: data.rows.length + 2, c: 0 }, e: { r: data.rows.length + 2, c: 5 } },
      ];
      ws['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
        { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 },
      ];
      ws['!rows'] = [{ hpt: 26 }, { hpt: 22 }];

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
      const bodyStyle = {
        font: { name: 'Times New Roman', sz: 12 },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D7E6DD' } },
          bottom: { style: 'thin', color: { rgb: 'D7E6DD' } },
          left: { style: 'thin', color: { rgb: 'D7E6DD' } },
          right: { style: 'thin', color: { rgb: 'D7E6DD' } },
        },
      };
      const totalStyle = {
        ...bodyStyle,
        font: { name: 'Times New Roman', bold: true, sz: 12 },
        fill: { fgColor: { rgb: 'EEF6F2' } },
      };

      for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
        for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: rowIndex, c: colIndex });
          if (!ws[cellRef]) continue;
          if (rowIndex === 0) ws[cellRef].s = headerStyle;
          else if (rowIndex === 1) ws[cellRef].s = subHeaderStyle;
          else if (rowIndex === data.rows.length + 2) ws[cellRef].s = totalStyle;
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
      const kyFile = data.ky_tinh || (kieuKy === 'day' ? ngay : (kieuKy === 'week' ? tuan : thang));
      XLSXStyle.writeFile(wb, `BangLuong_${kyFile}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert(e.message || 'Không xuất được Excel.');
    }
  };

  const handleChot = async () => {
    const kyText = data.label || data.ky_tinh || (kieuKy === 'day' ? ngay : (kieuKy === 'week' ? tuan : thang));
    if (!window.confirm(`Chốt bảng lương kỳ ${kyText}?`)) return;
    try {
      setSaving(true);
      await chotBangLuong({ ky_tinh: data.ky_tinh || (kieuKy === 'day' ? `D:${ngay}` : (kieuKy === 'week' ? `W:${tuan}` : thang)) });
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
            {kieuKy === 'day' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <input type="date" value={ngay} onChange={e => setNgay(e.target.value)} />
              </div>
            ) : kieuKy === 'week' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <input type="week" value={tuan} onChange={e => setTuan(e.target.value)} />
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0 }}>
                <input type="month" value={thang} onChange={e => setThang(e.target.value)} />
              </div>
            )}
            <button className="btn btn-ghost" onClick={load}>🔄 Tính lại</button>
            <button className="btn btn-ghost" onClick={handleExcel}>📥 Xuất Excel</button>
            <button className="btn btn-primary" onClick={handleChot} disabled={saving}>{saving ? 'Đang chốt...' : '✅ Chốt lương'}</button>
          </div>
        </div>
        <div className="card-body">
          <div className="filter-bar" style={{ marginBottom: 20 }}>
            <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
              Kỳ tính: {data.label || data.ky_tinh || '-'}
            </span>
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
