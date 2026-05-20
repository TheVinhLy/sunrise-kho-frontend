import React, { useState, useEffect, useRef } from 'react';
import { getNhapXuatTon, getCongTy } from '../utils/api';

const fmt = n => Number(n || 0).toLocaleString('vi-VN');

export default function NhapXuatTon() {
  const [rows, setRows]     = useState([]);
  const [cty, setCty]       = useState(null);
  const [filter, setFilter] = useState({ tu_ngay: '', den_ngay: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter.tu_ngay) params.tu_ngay = filter.tu_ngay;
    if (filter.den_ngay) params.den_ngay = filter.den_ngay;
    getNhapXuatTon(params)
      .then(r => { setRows(r); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { getCongTy().then(setCty); }, []);
  useEffect(load, [filter]); // eslint-disable-line

  const filtered = rows.filter(r =>
    !search ||
    r.ma_vat_tu.toLowerCase().includes(search.toLowerCase()) ||
    r.ten_vat_tu.toLowerCase().includes(search.toLowerCase())
  );

  const totals = filtered.reduce((acc, r) => ({
    ton_dau: acc.ton_dau + (r.ton_dau_ky || 0),
    nhap:    acc.nhap    + (r.tong_nhap || 0),
    xuat:    acc.xuat    + (r.tong_xuat || 0),
    cuoi:    acc.cuoi    + (r.ton_cuoi_ky || 0),
  }), { ton_dau: 0, nhap: 0, xuat: 0, cuoi: 0 });

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Sổ NXT - ${cty?.ten_cong_ty}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13px; margin: 20px; }
        h2,h3 { text-align:center; }
        table { width:100%; border-collapse:collapse; margin-top:12px; }
        th,td { border:1px solid #333; padding:5px 8px; }
        th { background:#1b3a2f; color:#fff; }
        .num { text-align:right; }
        .am { color:red; font-weight:bold; }
        tfoot td { font-weight:bold; background:#e8f5e9; }
        .sig { display:flex; justify-content:space-around; margin-top:40px; text-align:center; }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>`);
    w.document.close();
    w.print();
  };

  const fmtDate = d => d ? d.slice(0,10).split('-').reverse().join('/') : '';
  const tuNgay  = filter.tu_ngay  || cty?.tu_ngay  || '';
  const denNgay = filter.den_ngay || cty?.den_ngay || '';

  return (
    <div>
      {/* Thống kê nhanh */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Tổng mặt hàng</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tồn đầu kỳ</div>
          <div className="stat-value">{fmt(totals.ton_dau)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng nhập</div>
          <div className="stat-value" style={{color:'#2e7d32'}}>{fmt(totals.nhap)}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Tổng xuất</div>
          <div className="stat-value" style={{color:'#e65100'}}>{fmt(totals.xuat)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Tồn cuối kỳ</div>
          <div className="stat-value" style={{color: totals.cuoi < 0 ? '#c0392b' : '#1565c0'}}>{fmt(totals.cuoi)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>📊 Sổ nhập - xuất - tồn</h2>
          <button className="btn btn-print no-print" onClick={handlePrint}>🖨️ In báo cáo</button>
        </div>
        <div className="card-body">
          <div className="filter-bar no-print">
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
            <div className="form-group">
              <label>Tìm kiếm</label>
              <input placeholder="Mã hoặc tên vật tư..."
                value={search} onChange={e => setSearch(e.target.value)} style={{width:220}} />
            </div>
            <button className="btn btn-ghost"
              onClick={() => { setFilter({tu_ngay:'',den_ngay:''}); setSearch(''); }}>
              Xóa lọc
            </button>
          </div>

          {loading ? <div className="spinner" /> : (
            <div ref={printRef}>
              {/* Header in */}
              <div style={{marginBottom:12}}>
                <p style={{fontWeight:700, fontSize:13}}>{cty?.ten_cong_ty}</p>
                <p style={{fontSize:12}}>{cty?.dia_chi}</p>
                <p style={{fontSize:12}}>Tên kho: {cty?.ten_kho}</p>
              </div>
              <h3 style={{textAlign:'center', fontSize:16, margin:'8px 0 4px'}}>
                SỔ THEO DÕI NHẬP - XUẤT - TỒN
              </h3>
              <p style={{textAlign:'center', fontSize:13, marginBottom:10, color:'#555'}}>
                Từ ngày: {fmtDate(tuNgay)} &nbsp;đến ngày: {fmtDate(denNgay)}
              </p>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{width:40}}>STT</th>
                      <th>Mã vật tư</th>
                      <th>Tên vật tư</th>
                      <th style={{width:55}}>ĐVT</th>
                      <th className="text-right">Tồn đầu kỳ</th>
                      <th className="text-right">Tổng nhập</th>
                      <th className="text-right">Tổng xuất</th>
                      <th className="text-right">Tồn cuối kỳ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.ma_vat_tu}>
                        <td className="text-center">{i+1}</td>
                        <td><b>{r.ma_vat_tu}</b></td>
                        <td>{r.ten_vat_tu}</td>
                        <td className="text-center">{r.dvt}</td>
                        <td className="num">{fmt(r.ton_dau_ky)}</td>
                        <td className="num" style={{color:'#2e7d32'}}>{fmt(r.tong_nhap)}</td>
                        <td className="num" style={{color:'#e65100'}}>{fmt(r.tong_xuat)}</td>
                        <td className={`num ${r.ton_cuoi_ky < 0 ? 'ton-am' : r.ton_cuoi_ky > 0 ? 'ton-duong' : ''}`}>
                          {fmt(r.ton_cuoi_ky)}
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan={8} className="text-center" style={{padding:24,color:'#aaa'}}>Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-center"><b>CỘNG</b></td>
                      <td className="num"><b>{fmt(totals.ton_dau)}</b></td>
                      <td className="num" style={{color:'#2e7d32'}}><b>{fmt(totals.nhap)}</b></td>
                      <td className="num" style={{color:'#e65100'}}><b>{fmt(totals.xuat)}</b></td>
                      <td className="num"><b>{fmt(totals.cuoi)}</b></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Chữ ký */}
              <div style={{display:'flex', justifyContent:'space-around', marginTop:40, textAlign:'center'}}>
                {['Người lập biểu', 'Thủ kho', 'Kế toán trưởng', 'Thủ trưởng đơn vị'].map(t => (
                  <div key={t}>
                    <p style={{fontWeight:700}}>{t}</p>
                    <p style={{fontStyle:'italic', fontSize:12}}>(Ký, ghi rõ họ tên)</p>
                    <br/><br/>
                    <p style={{fontSize:12}}>
                      {t === 'Người lập biểu' ? cty?.nguoi_lap_bieu :
                       t === 'Thủ kho' ? cty?.thu_kho :
                       t === 'Thủ trưởng đơn vị' ? cty?.thu_truong : ''}
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
