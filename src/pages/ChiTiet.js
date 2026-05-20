import React, { useState, useEffect, useRef } from 'react';
import { getChiTiet, getDanhMuc, getCongTy } from '../utils/api';

const fmt  = n => Number(n || 0).toLocaleString('vi-VN');
const fmtD = d => d ? d.slice(0,10).split('-').reverse().join('/') : '';

export default function ChiTiet() {
  const [dm, setDm]         = useState([]);
  const [cty, setCty]       = useState(null);
  const [maVT, setMaVT]     = useState('');
  const [data, setData]     = useState(null);
  const [filter, setFilter] = useState({ tu_ngay: '', den_ngay: '' });
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    getDanhMuc().then(setDm);
    getCongTy().then(setCty);
  }, []);

  const load = () => {
    if (!maVT) return;
    setLoading(true);
    const params = {};
    if (filter.tu_ngay) params.tu_ngay = filter.tu_ngay;
    if (filter.den_ngay) params.den_ngay = filter.den_ngay;
    getChiTiet(maVT, params)
      .then(r => { setData(r); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, [maVT, filter]); // eslint-disable-line

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Chi tiết NXT - ${maVT}</title>
      <style>
        body { font-family:'Times New Roman',serif; font-size:13px; margin:20px; }
        h3 { text-align:center; }
        table { width:100%; border-collapse:collapse; margin-top:10px; }
        th,td { border:1px solid #333; padding:5px 8px; }
        th { background:#4a148c; color:#fff; }
        .num { text-align:right; }
        .am  { color:red; font-weight:bold; }
        tfoot td { font-weight:bold; background:#f3e5f5; }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>`);
    w.document.close();
    w.print();
  };

  const totNhap = data?.chi_tiet.reduce((s,r) => s + (r.so_luong_nhap||0), 0) || 0;
  const totXuat = data?.chi_tiet.reduce((s,r) => s + (r.so_luong_xuat||0), 0) || 0;

  return (
    <div>
      {/* Bộ lọc */}
      <div className="card" style={{marginBottom:16}}>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group" style={{minWidth:280}}>
              <label>Chọn mã vật tư *</label>
              <select value={maVT} onChange={e => setMaVT(e.target.value)}>
                <option value="">-- Chọn mã vật tư --</option>
                {dm.map(d => (
                  <option key={d.ma_vat_tu} value={d.ma_vat_tu}>
                    {d.ma_vat_tu} — {d.ten_vat_tu}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Từ ngày</label>
              <input type="date" value={filter.tu_ngay}
                onChange={e => setFilter(f => ({...f, tu_ngay: e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <input type="date" value={filter.den_ngay}
                onChange={e => setFilter(f => ({...f, den_ngay: e.target.value}))} />
            </div>
            <button className="btn btn-ghost"
              onClick={() => setFilter({tu_ngay:'',den_ngay:''})}>
              Xóa lọc
            </button>
            {data && (
              <button className="btn btn-print" onClick={handlePrint} style={{marginLeft:'auto'}}>
                🖨️ In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thông tin vật tư */}
      {data && (
        <div className="stats-grid" style={{marginBottom:16}}>
          <div className="stat-card">
            <div className="stat-label">Tên vật tư</div>
            <div style={{fontSize:13, fontWeight:700, color:'#1b3a2f', marginTop:4, lineHeight:1.3}}>
              {data.danh_muc?.ten_vat_tu}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tồn đầu kỳ</div>
            <div className="stat-value">{fmt(data.ton_dau_ky)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tổng nhập</div>
            <div className="stat-value" style={{color:'#2e7d32'}}>{fmt(totNhap)}</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-label">Tổng xuất</div>
            <div className="stat-value" style={{color:'#e65100'}}>{fmt(totXuat)}</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-label">Tồn cuối kỳ</div>
            <div className="stat-value"
              style={{color: (data.ton_dau_ky + totNhap - totXuat) < 0 ? '#c0392b' : '#1565c0'}}>
              {fmt(data.ton_dau_ky + totNhap - totXuat)}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>🔍 Chi tiết nhập - xuất - tồn {maVT ? `— ${maVT}` : ''}</h2>
        </div>
        <div className="card-body">
          {!maVT && (
            <p style={{textAlign:'center', color:'#aaa', padding:40}}>
              ← Chọn mã vật tư để xem chi tiết
            </p>
          )}
          {loading && <div className="spinner" />}
          {data && !loading && (
            <div ref={printRef}>
              {/* Header in */}
              <div style={{marginBottom:10}}>
                <p style={{fontWeight:700}}>{cty?.ten_cong_ty}</p>
                <p style={{fontSize:12}}>{cty?.dia_chi}</p>
              </div>
              <h3 style={{fontSize:15, margin:'6px 0'}}>
                SỔ CHI TIẾT VẬT LIỆU, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA
              </h3>
              <p style={{textAlign:'center', fontSize:12, marginBottom:6}}>
                Từ {fmtD(filter.tu_ngay || cty?.tu_ngay)} đến {fmtD(filter.den_ngay || cty?.den_ngay)}
              </p>

              {/* Info */}
              <div style={{display:'flex', gap:32, marginBottom:10, fontSize:13}}>
                <span><b>Tên vật tư:</b> {data.danh_muc?.ten_vat_tu}</span>
                <span><b>Mã:</b> {data.danh_muc?.ma_vat_tu}</span>
                <span><b>ĐVT:</b> {data.danh_muc?.dvt}</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{width:40}}>STT</th>
                      <th>Ngày CT</th>
                      <th>Số CT</th>
                      <th>Ngày ghi sổ</th>
                      <th>Diễn giải</th>
                      <th className="text-right">Nhập</th>
                      <th className="text-right">Xuất</th>
                      <th className="text-right">Tồn lũy kế</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Dòng đầu kỳ */}
                    <tr style={{fontStyle:'italic', background:'#f9f9f9'}}>
                      <td></td>
                      <td colSpan={4}><i>Tồn đầu kỳ</i></td>
                      <td></td><td></td>
                      <td className="num"><b>{fmt(data.ton_dau_ky)}</b></td>
                    </tr>
                    {data.chi_tiet.map((r, i) => (
                      <tr key={r.id}>
                        <td className="text-center">{i+1}</td>
                        <td>{fmtD(r.ngay_chung_tu)}</td>
                        <td>
                          <span className={`badge ${r.so_luong_nhap > 0 ? 'badge-nhap' : 'badge-xuat'}`}>
                            {r.so_chung_tu}
                          </span>
                        </td>
                        <td>{fmtD(r.ngay_ghi_so)}</td>
                        <td style={{maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}
                          title={r.dien_giai}>{r.dien_giai}</td>
                        <td className="num" style={{color:'#2e7d32', fontWeight: r.so_luong_nhap > 0 ? 700 : 400}}>
                          {r.so_luong_nhap > 0 ? fmt(r.so_luong_nhap) : ''}
                        </td>
                        <td className="num" style={{color:'#e65100', fontWeight: r.so_luong_xuat > 0 ? 700 : 400}}>
                          {r.so_luong_xuat > 0 ? fmt(r.so_luong_xuat) : ''}
                        </td>
                        <td className={`num ${r.ton_luy_ke < 0 ? 'ton-am' : ''}`}>
                          <b>{fmt(r.ton_luy_ke)}</b>
                        </td>
                      </tr>
                    ))}
                    {!data.chi_tiet.length && (
                      <tr><td colSpan={8} className="text-center" style={{padding:24,color:'#aaa'}}>
                        Không có giao dịch trong kỳ
                      </td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-center"><b>CỘNG</b></td>
                      <td className="num" style={{color:'#2e7d32'}}><b>{fmt(totNhap)}</b></td>
                      <td className="num" style={{color:'#e65100'}}><b>{fmt(totXuat)}</b></td>
                      <td className="num"><b>{fmt(data.ton_dau_ky + totNhap - totXuat)}</b></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Chữ ký */}
              <div style={{display:'flex',justifyContent:'space-around',marginTop:36,textAlign:'center'}}>
                {['Người lập biểu','Thủ kho','Kế toán trưởng'].map(t => (
                  <div key={t}>
                    <p style={{fontWeight:700}}>{t}</p>
                    <p style={{fontStyle:'italic',fontSize:12}}>(Ký, ghi rõ họ tên)</p>
                    <br/><br/>
                    <p style={{fontSize:12}}>
                      {t==='Người lập biểu' ? cty?.nguoi_lap_bieu : t==='Thủ kho' ? cty?.thu_kho : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
