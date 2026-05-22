import React, { useState, useEffect, useRef } from 'react';
import { getNhapXuatTon, getCongTy } from '../utils/api';
import { printHtml, exportExcel, fmt, fmtD } from '../utils/printExcel';

export default function NhapXuatTon() {
  const [rows, setRows]     = useState([]);
  const [cty, setCty]       = useState(null);
  const [filter, setFilter] = useState({ tu_ngay: '', den_ngay: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const p = {};
    if (filter.tu_ngay)  p.tu_ngay  = filter.tu_ngay;
    if (filter.den_ngay) p.den_ngay = filter.den_ngay;
    getNhapXuatTon(p).then(r => { setRows(r); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { getCongTy().then(setCty); }, []);
  useEffect(load, [filter]); // eslint-disable-line

  const filtered = rows.filter(r =>
    !search ||
    r.ma_vat_tu.toLowerCase().includes(search.toLowerCase()) ||
    r.ten_vat_tu.toLowerCase().includes(search.toLowerCase())
  );

  const totals = filtered.reduce((acc, r) => ({
    ton_dau: acc.ton_dau + Number(r.ton_dau_ky  || 0),
    nhap:    acc.nhap    + Number(r.tong_nhap    || 0),
    xuat:    acc.xuat    + Number(r.tong_xuat    || 0),
    cuoi:    acc.cuoi    + Number(r.ton_cuoi_ky  || 0),
  }), { ton_dau: 0, nhap: 0, xuat: 0, cuoi: 0 });

  const tuNgay  = filter.tu_ngay  || cty?.tu_ngay  || '';
  const denNgay = filter.den_ngay || cty?.den_ngay || '';

  const handlePrint = () => {
    const rows_html = filtered.map((r, i) => `
      <tr>
        <td class="center">${i+1}</td>
        <td><b>${r.ma_vat_tu}</b></td>
        <td>${r.ten_vat_tu}</td>
        <td class="center">${r.dvt}</td>
        <td class="num">${fmt(r.ton_dau_ky)}</td>
        <td class="num">${fmt(r.tong_nhap)}</td>
        <td class="num">${fmt(r.tong_xuat)}</td>
        <td class="num" style="font-weight:bold;${Number(r.ton_cuoi_ky)<0?'color:red':''}">${fmt(r.ton_cuoi_ky)}</td>
      </tr>`).join('');

    printHtml(`
      <p><b>${cty?.ten_cong_ty}</b></p>
      <p>${cty?.dia_chi}</p>
      <p>Tên kho: ${cty?.ten_kho}</p>
      <h2 style="margin-top:8px">SỔ THEO DÕI NHẬP - XUẤT - TỒN</h2>
      <p style="text-align:center">Từ ngày: ${fmtD(tuNgay)} &nbsp;đến ngày: ${fmtD(denNgay)}</p>
      <table>
        <colgroup>
          <col style="width:40px"/>
          <col style="width:22mm"/>
          <col style="width:auto"/>
          <col style="width:14px"/>
          <col style="width:20mm"/>
          <col style="width:20mm"/>
          <col style="width:20mm"/>
          <col style="width:20mm"/>
        </colgroup>
        <thead><tr>
          <th style="width:40px">STT</th><th>Mã vật tư</th><th>Tên vật tư</th><th>ĐVT</th>
          <th>Tồn đầu kỳ</th><th>Tổng nhập</th><th>Tổng xuất</th><th>Tồn cuối kỳ</th>
        </tr></thead>
        <tbody>${rows_html}</tbody>
        <tfoot><tr>
          <td colspan="4" class="center"><b>CỘNG</b></td>
          <td class="num"><b>${fmt(totals.ton_dau)}</b></td>
          <td class="num"><b>${fmt(totals.nhap)}</b></td>
          <td class="num"><b>${fmt(totals.xuat)}</b></td>
          <td class="num"><b>${fmt(totals.cuoi)}</b></td>
        </tr></tfoot>
      </table>
      <div class="sig-row">
        ${['Người lập biểu','Thủ kho','Kế toán trưởng','Thủ trưởng đơn vị'].map(t =>
          `<div><p><b>${t}</b></p><p><i>(Ký, ghi rõ họ tên)</i></p><br/><br/>
           <p>${t==='Thủ trưởng đơn vị'?(cty?.thu_truong||''):t==='Thủ kho'?(cty?.thu_kho||''):t==='Người lập biểu'?(cty?.nguoi_lap_bieu||''):''}</p>
          </div>`).join('')}
      </div>
    `, 'Nhập Xuất Tồn');
  };

  // ── XUẤT EXCEL ──────────────────────────────
  const handleExcel = () => {
    const headers = ['STT','Mã vật tư','Tên vật tư','ĐVT','Tồn đầu kỳ','Tổng nhập','Tổng xuất','Tồn cuối kỳ'];
    const exRows  = filtered.map((r, i) => [
      i+1, r.ma_vat_tu, r.ten_vat_tu, r.dvt,
      Number(r.ton_dau_ky), Number(r.tong_nhap), Number(r.tong_xuat), Number(r.ton_cuoi_ky),
    ]);
    exRows.push(['','','','CỘNG', totals.ton_dau, totals.nhap, totals.xuat, totals.cuoi]);
    exportExcel(headers, exRows, 'NhapXuatTon');
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Mặt hàng</div><div className="stat-value">{filtered.length}</div></div>
        <div className="stat-card"><div className="stat-label">Tồn đầu kỳ</div><div className="stat-value">{fmt(totals.ton_dau)}</div></div>
        <div className="stat-card"><div className="stat-label">Tổng nhập</div><div className="stat-value" style={{color:'#2e7d32'}}>{fmt(totals.nhap)}</div></div>
        <div className="stat-card orange"><div className="stat-label">Tổng xuất</div><div className="stat-value" style={{color:'#e65100'}}>{fmt(totals.xuat)}</div></div>
        <div className="stat-card blue"><div className="stat-label">Tồn cuối kỳ</div><div className="stat-value" style={{color:totals.cuoi<0?'#c0392b':'#1565c0'}}>{fmt(totals.cuoi)}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>📊 Sổ nhập - xuất - tồn</h2>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost" onClick={handleExcel}>📥 Xuất Excel</button>
            <button className="btn btn-print"  onClick={handlePrint}>🖨️ In báo cáo</button>
          </div>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group">
              <label>Từ ngày</label>
              <input type="date" value={filter.tu_ngay} onChange={e => setFilter(f=>({...f,tu_ngay:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <input type="date" value={filter.den_ngay} onChange={e => setFilter(f=>({...f,den_ngay:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Tìm kiếm</label>
              <input placeholder="Mã hoặc tên vật tư..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
            </div>
            <button className="btn btn-ghost" onClick={()=>{setFilter({tu_ngay:'',den_ngay:''});setSearch('');}}>Xóa lọc</button>
          </div>

          {loading ? <div className="spinner"/> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width:40}}>STT</th>
                    <th>Mã vật tư</th><th>Tên vật tư</th>
                    <th style={{width:55}}>ĐVT</th>
                    <th className="text-right">Tồn đầu kỳ</th>
                    <th className="text-right">Tổng nhập</th>
                    <th className="text-right">Tổng xuất</th>
                    <th className="text-right">Tồn cuối kỳ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r,i) => (
                    <tr key={r.ma_vat_tu}>
                      <td className="text-center">{i+1}</td>
                      <td><b>{r.ma_vat_tu}</b></td>
                      <td>{r.ten_vat_tu}</td>
                      <td className="text-center">{r.dvt}</td>
                      <td className="num">{fmt(r.ton_dau_ky)}</td>
                      <td className="num" style={{color:'#2e7d32'}}>{fmt(r.tong_nhap)}</td>
                      <td className="num" style={{color:'#e65100'}}>{fmt(r.tong_xuat)}</td>
                      <td className={`num ${Number(r.ton_cuoi_ky)<0?'ton-am':Number(r.ton_cuoi_ky)>0?'ton-duong':''}`}>
                        <b>{fmt(r.ton_cuoi_ky)}</b>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && <tr><td colSpan={8} className="text-center" style={{padding:24,color:'#aaa'}}>Không có dữ liệu</td></tr>}
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
          )}
        </div>
      </div>
    </div>
  );
}
