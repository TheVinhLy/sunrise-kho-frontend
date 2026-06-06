import React, { useEffect, useMemo, useState } from 'react';
import { chotBangLuong, getBangLuong } from '../utils/api';
import { exportExcel as exportXlsx, fmt } from '../utils/printExcel';

export default function BangLuong() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [thang, setThang] = useState(currentMonth);
  const [data, setData] = useState({ rows: [], totals: { tong_ngay_cong: 0, tong_gio_ot: 0, tong_suat_com: 0, tong_luong: 0 }, tham_so: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = () => {
    setLoading(true);
    getBangLuong({ thang })
      .then(result => { setData(result); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, [thang]);

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
    exportXlsx(headers, exRows, `BangLuong_${thang}`);
  };

  const handleChot = async () => {
    if (!window.confirm(`Chốt bảng lương tháng ${thang}?`)) return;
    try {
      setSaving(true);
      await chotBangLuong({ ky_tinh: thang });
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
          <h2>📑 Bảng lương tháng</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <input type="month" value={thang} onChange={e => setThang(e.target.value)} />
            </div>
            <button className="btn btn-ghost" onClick={load}>🔄 Tính lại</button>
            <button className="btn btn-ghost" onClick={handleExcel}>📥 Xuất Excel</button>
            <button className="btn btn-primary" onClick={handleChot} disabled={saving}>{saving ? 'Đang chốt...' : '✅ Chốt lương'}</button>
          </div>
        </div>
        <div className="card-body">
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
