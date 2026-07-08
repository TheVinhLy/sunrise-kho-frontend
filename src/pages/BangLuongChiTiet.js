import React, { useEffect, useMemo, useState } from 'react';
import { getBangLuongChiTiet, getCongTy, getNhanVien } from '../utils/api';
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

function fmtDateVi(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text || '-';
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

export default function BangLuongChiTiet() {
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
  const [data, setData] = useState({ rows: [], totals: { gio: 0, thanh_tien_cong: 0, so_gio_ot: 0, thanh_tien_ot: 0, suat: 0, thanh_tien_com: 0 } });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    setErr('');
    const params = kieuKy === 'week'
      ? { tuan }
      : (kieuKy === 'month' ? { thang } : { tu_ngay: tuNgay, den_ngay: denNgay });
    if (nhanVienId) params.nhan_vien_id = nhanVienId;
    getBangLuongChiTiet(params)
      .then(result => {
        setData(result || { rows: [], totals: { gio: 0, thanh_tien_cong: 0, so_gio_ot: 0, thanh_tien_ot: 0, suat: 0, thanh_tien_com: 0 } });
        setLoading(false);
      })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, [kieuKy, tuan, thang, tuNgay, denNgay, nhanVienId]);

  useEffect(() => {
    getNhanVien().then(rows => setDsNhanVien(Array.isArray(rows) ? rows : [])).catch(() => setDsNhanVien([]));
    getCongTy().then(setCongTy).catch(() => setCongTy(null));
  }, []);

  const groupedRows = useMemo(() => {
    const groups = {};
    for (const r of (data.rows || [])) {
      const key = `${r.ma_nv || ''}||${r.ho_ten || ''}`;
      if (!groups[key]) {
        groups[key] = {
          ma_nv: r.ma_nv || '',
          ho_ten: r.ho_ten || '',
          rows: [],
          totals: { gio: 0, thanh_tien_cong: 0, so_gio_ot: 0, thanh_tien_ot: 0, suat: 0, thanh_tien_com: 0 },
        };
      }
      groups[key].rows.push(r);
      groups[key].totals.gio += Number(r.gio || 0);
      groups[key].totals.thanh_tien_cong += Number(r.thanh_tien_cong || 0);
      groups[key].totals.so_gio_ot += Number(r.so_gio_ot || 0);
      groups[key].totals.thanh_tien_ot += Number(r.thanh_tien_ot || 0);
      groups[key].totals.suat += Number(r.suat || 0);
      groups[key].totals.thanh_tien_com += Number(r.thanh_tien_com || 0);
    }
    return Object.values(groups).map(g => ({
      ...g,
      rows: g.rows.sort((a,b) => String(a.ngay_cham_cong||'').localeCompare(String(b.ngay_cham_cong||''))),
      thanhTien: Number(g.totals.thanh_tien_cong || 0) + Number(g.totals.thanh_tien_ot || 0) + Number(g.totals.thanh_tien_com || 0) + 25000,
      totalAllowance: 25000,
    }));
  }, [data.rows]);

  const summaryCards = useMemo(() => ([
    { label: 'Số dòng', value: data.rows.length, color: 'blue' },
    { label: 'Giờ công', value: fmt(data.totals?.gio || 0), color: '' },
    { label: 'Tiền công', value: fmt(data.totals?.thanh_tien_cong || 0), color: 'orange' },
    { label: 'Giờ OT', value: fmt(data.totals?.so_gio_ot || 0), color: 'red' },
    { label: 'Tiền OT', value: fmt(data.totals?.thanh_tien_ot || 0), color: '' },
    { label: 'Suất cơm', value: fmt(data.totals?.suat || 0), color: 'green' },
    { label: 'Tiền cơm', value: fmt(data.totals?.thanh_tien_com || 0), color: '' },
  ]), [data]);

  const overallTotal = useMemo(() => groupedRows.reduce((sum, g) => sum + g.thanhTien, 0), [groupedRows]);

  const handleExcel = async () => {
    try {
      const XLSXStyle = await loadXlsxStyle();

      const header = [
        ['BẢNG LƯƠNG CHI TIẾT'],
        [`Công ty: ${congTy?.ten_cong_ty || ''}`],
        [`Kho: ${congTy?.ten_kho || ''}`],
        [`Kỳ: ${data.label || data.ky_tinh || '-'}`],
        [],
      ];

      const colHeader = ['STT', 'Ngày', 'Mã NV', 'Họ tên', 'Giờ công', 'Tiền công', 'Giờ OT', 'Tiền OT', 'Suất cơm', 'Tiền cơm', 'Ghi chú'];

      const rowsOut = [];
      // push header lines
      header.forEach(r => rowsOut.push(r));
      // push single column header
      rowsOut.push(colHeader);

      let overallTotal = 0;

      // For each employee group, add rows and subtotal
      for (const g of groupedRows) {
        g.rows.forEach((r, rowIndex) => {
          const ngay = r.ngay_cham_cong ? String(r.ngay_cham_cong).slice(0,10) : '';
          rowsOut.push([
            rowIndex + 1,
            ngay,
            r.ma_nv,
            r.ho_ten,
            Number(r.gio || 0),
            Number(r.thanh_tien_cong || 0),
            Number(r.so_gio_ot || 0),
            Number(r.thanh_tien_ot || 0),
            Number(r.suat || 0),
            Number(r.thanh_tien_com || 0),
            r.ghi_chu || '',
          ]);
        });

        overallTotal += g.thanhTien;
        rowsOut.push([
          'THÀNH TIỀN',
          '',
          '',
          '',
          g.totals.gio,
          g.totals.thanh_tien_cong,
          g.totals.so_gio_ot,
          g.totals.thanh_tien_ot,
          g.totals.suat,
          g.totals.thanh_tien_com,
          '',
        ]);
        rowsOut.push(['TỔNG', '', '', '', '', g.thanhTien, '', '', '', '', '']);
        rowsOut.push([]);
      }

      // overall total row uses overallTotal (sum of per-employee subtotal)
      rowsOut.push(['TỔNG CỘNG', '', '', '', '', overallTotal, '', '', '', '', '']);

      const ws = XLSXStyle.utils.aoa_to_sheet(rowsOut);
      ws['!cols'] = [ {wch:6}, {wch:12}, {wch:12}, {wch:24}, {wch:10}, {wch:14}, {wch:10}, {wch:14}, {wch:10}, {wch:14}, {wch:18} ];

      // simple styling
      const range = XLSXStyle.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSXStyle.utils.encode_cell({r:R,c:C});
          const cell = ws[cellRef];
          if (!cell) continue;
          // header rows style
          if (R <= 3) {
            cell.s = { font:{bold:true, sz:12}, alignment:{horizontal:'left'} };
          } else if (cell.v === 'THÀNH TIỀN' || cell.v === 'TỔNG' || cell.v === 'TỔNG CỘNG') {
            cell.s = { font:{bold:true}, fill:{fgColor:{rgb:'EEF6F2'}}, alignment:{horizontal:'right'} };
          } else if (R > 3 && typeof cell.v === 'number') {
            cell.s = { alignment:{horizontal:'right'} };
          }
        }
      }

      const wb = XLSXStyle.utils.book_new();
      XLSXStyle.utils.book_append_sheet(wb, ws, 'BangLuongChiTiet');
      XLSXStyle.writeFile(wb, `BangLuongChiTiet_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert(e.message || 'Không xuất được Excel.');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>📋 Bảng lương chi tiết</h2>
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
            <button className="btn btn-ghost" onClick={load}>🔄 Tải lại</button>
            <button className="btn btn-ghost" onClick={handleExcel}>📥 Xuất Excel</button>
          </div>
        </div>
        <div className="card-body">
          <div className="filter-bar" style={{ marginBottom: 20 }}>
            <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
              Kỳ tính: {data.label || data.ky_tinh || '-'}
            </span>
            {nhanVienId ? (
              <span className="badge" style={{ background: '#eef6f2', color: '#1b3a2f' }}>
                NV: {dsNhanVien.find(item => String(item.id) === String(nhanVienId))?.ho_ten || nhanVienId}
              </span>
            ) : null}
          </div>

          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {summaryCards.map(card => (
              <div className="stat-card" key={card.label} style={{ background: '#f9fcfa', border: '1px solid #dce9e0', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>{card.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1b3a2f' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {err ? <div className="error-box">{err}</div> : null}
          {loading ? <div className="loading">Đang tải...</div> : (
            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', minWidth: 980 }}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Ngày</th>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Giờ công</th>
                    <th>Tiền công</th>
                    <th>Giờ OT</th>
                    <th>Tiền OT</th>
                    <th>Suất cơm</th>
                    <th>Tiền cơm</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.length ? groupedRows.map((g, groupIndex) => (
                    <React.Fragment key={`${g.ma_nv || 'all'}-${groupIndex}`}>
                      {g.rows.map((row, rowIndex) => (
                        <tr key={`${g.ma_nv}-${groupIndex}-${rowIndex}`}>
                          <td>{rowIndex + 1}</td>
                          <td>{fmtDateVi(row.ngay_cham_cong)}</td>
                          <td>{row.ma_nv}</td>
                          <td>{row.ho_ten}</td>
                          <td>{fmt(row.gio)}</td>
                          <td>{fmt(row.thanh_tien_cong)}</td>
                          <td>{fmt(row.so_gio_ot)}</td>
                          <td>{fmt(row.thanh_tien_ot)}</td>
                          <td>{fmt(row.suat)}</td>
                          <td>{fmt(row.thanh_tien_com)}</td>
                          <td>{row.ghi_chu || ''}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, background: '#f5f9f6' }}>
                        <td>THÀNH TIỀN</td>
                        <td colSpan="3" />
                        <td>{fmt(g.totals.gio)}</td>
                        <td>{fmt(g.totals.thanh_tien_cong)}</td>
                        <td>{fmt(g.totals.so_gio_ot)}</td>
                        <td>{fmt(g.totals.thanh_tien_ot)}</td>
                        <td>{fmt(g.totals.suat)}</td>
                        <td>{fmt(g.totals.thanh_tien_com)}</td>
                        <td />
                      </tr>
                      <tr style={{ fontWeight: 700, background: '#eef6f2' }}>
                        <td>TỔNG</td>
                        <td colSpan="4" />
                        <td>{fmt(g.thanhTien)}</td>
                        <td colSpan="5" />
                      </tr>
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', color: '#888' }}>Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
                {groupedRows.length ? (
                  <tfoot>
                    <tr>
                      <td colSpan="5" style={{ fontWeight: 700 }}>TỔNG CỘNG</td>
                      <td>{fmt(overallTotal)}</td>
                      <td colSpan="5" />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
