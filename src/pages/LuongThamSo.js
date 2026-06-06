import React, { useEffect, useMemo, useState } from 'react';
import { addLuongThamSo, deleteLuongThamSo, getLuongThamSo, updateLuongThamSo } from '../utils/api';

const FIXED_ITEMS = [
  { ma_tham_so: 'NGAY_CONG', ten_tham_so: 'Lương ngày công', don_vi: 'đ/ngày', ghi_chu: 'Mặc định cho tính lương ngày công' },
  { ma_tham_so: 'OT_GIO', ten_tham_so: 'Lương OT/H', don_vi: 'đ/giờ', ghi_chu: 'Mặc định cho tính lương tăng ca' },
  { ma_tham_so: 'COM', ten_tham_so: 'Cơm', don_vi: 'đ/suất', ghi_chu: 'Mặc định cho phụ cấp cơm' },
];

export default function LuongThamSo() {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getLuongThamSo()
      .then(data => { setRows(data); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  };

  useEffect(load, []);

  const merged = useMemo(() => FIXED_ITEMS.map(item => {
    const found = rows.find(row => row.ma_tham_so === item.ma_tham_so);
    return { ...item, ...found };
  }), [rows]);

  const openAdd = (item) => {
    setForm({ ...item, gia_tri: 0 });
    setErr('');
    setModal({ mode: 'add', code: item.ma_tham_so });
  };

  const openEdit = (row, item) => {
    setForm({
      ma_tham_so: row.ma_tham_so,
      ten_tham_so: row.ten_tham_so,
      gia_tri: row.gia_tri,
      don_vi: row.don_vi || item.don_vi,
      ghi_chu: row.ghi_chu || item.ghi_chu,
    });
    setErr('');
    setModal({ mode: 'edit', id: row.id, code: row.ma_tham_so });
  };

  const save = async () => {
    if (!form?.ma_tham_so || !form?.ten_tham_so) {
      setErr('Thiếu mã hoặc tên tham số');
      return;
    }
    try {
      const payload = {
        ...form,
        gia_tri: form.gia_tri === '' || form.gia_tri === null ? 0 : Number(form.gia_tri),
      };
      if (modal.mode === 'add') await addLuongThamSo(payload);
      else await updateLuongThamSo(modal.id, payload);
      setModal(null);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const del = async (row) => {
    if (!window.confirm(`Xóa tham số "${row.ten_tham_so}"?`)) return;
    await deleteLuongThamSo(row.id).catch(e => alert(e.message));
    load();
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>💰 Tham số lương</h2>
          <button className="btn btn-primary" onClick={() => openAdd({ ma_tham_so: '', ten_tham_so: '', don_vi: '', ghi_chu: '' })}>+ Thêm tham số</button>
        </div>
        <div className="card-body">
          {loading ? <div className="spinner" /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên tham số</th>
                    <th className="text-right">Giá trị</th>
                    <th>Đơn vị</th>
                    <th>Ghi chú</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {merged.map(item => {
                    const row = rows.find(r => r.ma_tham_so === item.ma_tham_so);
                    return (
                      <tr key={item.ma_tham_so}>
                        <td><b>{item.ma_tham_so}</b></td>
                        <td>{row?.ten_tham_so || item.ten_tham_so}</td>
                        <td className="text-right num">{Number(row?.gia_tri || 0).toLocaleString('vi-VN')}</td>
                        <td>{row?.don_vi || item.don_vi}</td>
                        <td>{row?.ghi_chu || item.ghi_chu}</td>
                        <td>
                          <span className="badge" style={{ background: row ? '#e8f5e9' : '#fff3e0', color: row ? '#2e7d32' : '#e65100' }}>
                            {row ? 'Đang dùng' : 'Chưa tạo'}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {row ? (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row, item)}>✏️</button>{' '}
                              <button className="btn btn-danger btn-sm" onClick={() => del(row)}>🗑️</button>
                            </>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => openAdd(item)}>+ Tạo</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && form && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3>{modal.mode === 'add' ? '+ Thêm tham số lương' : '✏️ Sửa tham số lương'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Mã tham số *</label>
                  <input value={form.ma_tham_so || ''} onChange={e => setForm(prev => ({ ...prev, ma_tham_so: e.target.value }))} placeholder="NGAY_CONG" />
                </div>
                <div className="form-group">
                  <label>Tên tham số *</label>
                  <input value={form.ten_tham_so || ''} onChange={e => setForm(prev => ({ ...prev, ten_tham_so: e.target.value }))} placeholder="Lương ngày công" />
                </div>
                <div className="form-group">
                  <label>Giá trị</label>
                  <input type="number" min="0" step="0.01" value={form.gia_tri ?? ''} onChange={e => setForm(prev => ({ ...prev, gia_tri: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Đơn vị</label>
                  <input value={form.don_vi || ''} onChange={e => setForm(prev => ({ ...prev, don_vi: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Ghi chú</label>
                  <textarea value={form.ghi_chu || ''} onChange={e => setForm(prev => ({ ...prev, ghi_chu: e.target.value }))} />
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
