import React, { useEffect, useMemo, useState } from 'react';
import { chotBangLuong, getBangLuong } from '../utils/api';
import { exportExcel as exportXlsx, fmt } from '../utils/printExcel';

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
  const [kieuKy, setKieuKy] = useState('week');
  const [ngay, setNgay] = useState(currentDate);
  const [tuan, setTuan] = useState(getCurrentWeekToken());
  const [data, setData] = useState({ rows: [], totals: { tong_ngay_cong: 0, tong_gio_ot: 0, tong_suat_com: 0, tong_luong: 0 }, tham_so: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    const params = kieuKy === 'day' ? { ngay } : { tuan };
    getBangLuong(params)
      .then(result => { setData(result); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, [kieuKy, ngay, tuan]);

  const summaryCards = useMemo(() => ([
    { label: 'Nhân viên', value: data.rows.length, color: 'blue' },
    { label: 'Tổng ngày công', value: fmt(data.totals?.tong_ngay_cong || 0), color: '' },
    { label: 'Tổng OT', value: fmt(data.totals?.tong_gio_ot || 0), color: 'orange' },
    { label: 'Tổng suất cơm', value: fmt(data.totals?.tong_suat_com || 0), color: 'red' },
    { label: 'Tổng lương', value: fmt(data.totals?.tong_luong || 0), color: '' },
  ]), [data]);

  const handleExcel = () => {
    const headers = ['STT', 'Mã NV', 'Họ tên', 'Phòng ban', 'Ngày công', 'OT giờ', 'Suất cơm', 'Lương ngày công', 'Lương OT/H', 'Cơm', 'Tiền ngày công', 'Tiền OT', 'Tiền cơm', 'Tổng lương', 'Trạng thái'];
    const exRows = data.rows.map((row, index) => [
      index + 1,
      row.ma_nv,
      row.ho_ten,
      row.phong_ban || '',
      Number(row.tong_ngay_cong || 0),
      Number(row.tong_gio_ot || 0),
      Number(row.tong_suat_com || 0),
      Number(row.luong_ngay_cong || 0),
      Number(row.luong_ot_gio || 0),
      Number(row.tien_com_ngay || 0),
      Number(row.tien_ngay_cong || 0),
      Number(row.tien_ot || 0),
      Number(row.tien_com || 0),
      Number(row.tong_luong || 0),
      row.da_chot ? 'Đã chốt' : 'Tạm tính',
    ]);
    exportXlsx(headers, exRows, `BangLuong_${data.ky_tinh || (kieuKy === 'day' ? ngay : tuan)}`);
  };

  const handleChot = async () => {
    const kyText = data.label || data.ky_tinh || (kieuKy === 'day' ? ngay : tuan);
    if (!window.confirm(`Chốt bảng lương kỳ ${kyText}?`)) return;
    try {
      setSaving(true);
      await chotBangLuong({ ky_tinh: data.ky_tinh || (kieuKy === 'day' ? `D:${ngay}` : `W:${tuan}`) });
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
            </select>
            {kieuKy === 'day' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <input type="date" value={ngay} onChange={e => setNgay(e.target.value)} />
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0 }}>
                <input type="week" value={tuan} onChange={e => setTuan(e.target.value)} />
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
              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Phòng ban</th>
                    <th className="text-right">Ngày công</th>
                    <th className="text-right">OT giờ</th>
                    <th className="text-right">Suất cơm</th>
                    <th className="text-right">Tiền ngày công</th>
                    <th className="text-right">Tiền OT</th>
                    <th className="text-right">Tiền cơm</th>
                    <th className="text-right">Tổng lương</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, index) => (
                    <tr key={row.id}>
                      <td className="text-center">{index + 1}</td>
                      <td><b>{row.ma_nv}</b></td>
                      <td>{row.ho_ten}</td>
                      <td>{row.phong_ban}</td>
                      <td className="text-right num">{fmt(row.tong_ngay_cong)}</td>
                      <td className="text-right num">{fmt(row.tong_gio_ot)}</td>
                      <td className="text-right num">{fmt(row.tong_suat_com)}</td>
                      <td className="text-right num">{fmt(row.tien_ngay_cong)}</td>
                      <td className="text-right num">{fmt(row.tien_ot)}</td>
                      <td className="text-right num">{fmt(row.tien_com)}</td>
                      <td className="text-right num"><b>{fmt(row.tong_luong)}</b></td>
                      <td>
                        <span className="badge" style={{ background: row.da_chot ? '#e8f5e9' : '#fff3e0', color: row.da_chot ? '#2e7d32' : '#e65100' }}>
                          {row.da_chot ? 'Đã chốt' : 'Tạm tính'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!data.rows.length && (
                    <tr>
                      <td colSpan={12} className="text-center" style={{ padding: 24, color: '#aaa' }}>Chưa có dữ liệu lương</td>
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
