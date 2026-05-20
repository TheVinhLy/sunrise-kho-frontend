import React, { useState, useEffect } from 'react';
import { getCongTy, updateCongTy } from '../utils/api';

export default function CongTy({ onSave }) {
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { getCongTy().then(setForm).catch(e => setErr(e.message)); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      await updateCongTy(form);
      onSave && onSave(form);
      setMsg('Đã lưu thành công!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setErr(e.message); }
  };

  if (!form) return <div className="spinner" />;

  return (
    <div className="card">
      <div className="card-header">
        <h2>🏢 Thông tin doanh nghiệp</h2>
        <button className="btn btn-primary" onClick={save}>💾 Lưu</button>
      </div>
      <div className="card-body">
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Tên công ty</label>
            <input value={form.ten_cong_ty || ''} onChange={e => set('ten_cong_ty', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Địa chỉ</label>
            <input value={form.dia_chi || ''} onChange={e => set('dia_chi', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Tên kho</label>
            <input value={form.ten_kho || ''} onChange={e => set('ten_kho', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input value={form.so_dien_thoai || ''} onChange={e => set('so_dien_thoai', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Số fax</label>
            <input value={form.so_fax || ''} onChange={e => set('so_fax', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Mã số thuế</label>
            <input value={form.ma_so_thue || ''} onChange={e => set('ma_so_thue', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Thủ trưởng đơn vị</label>
            <input value={form.thu_truong || ''} onChange={e => set('thu_truong', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Người lập biểu</label>
            <input value={form.nguoi_lap_bieu || ''} onChange={e => set('nguoi_lap_bieu', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Thủ kho</label>
            <input value={form.thu_kho || ''} onChange={e => set('thu_kho', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Năm kế toán</label>
            <input type="number" value={form.nam || 2026} onChange={e => set('nam', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Từ ngày</label>
            <input type="date" value={form.tu_ngay || ''} onChange={e => set('tu_ngay', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Đến ngày</label>
            <input type="date" value={form.den_ngay || ''} onChange={e => set('den_ngay', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
