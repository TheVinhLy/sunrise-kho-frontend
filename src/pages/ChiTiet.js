import React, { useState, useEffect } from 'react';
import { getChiTiet, getDanhMuc, getCongTy } from '../utils/api';
import { printHtml, exportExcel, fmt, fmtD } from '../utils/printExcel';

export default function ChiTiet() {
  const [dm, setDm]         = useState([]);
  const [cty, setCty]       = useState(null);
  const [maVT, setMaVT]     = useState('');
  const [data, setData]     = useState(null);
  const [filter, setFilter] = useState({ tu_ngay: '', den_ngay: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getDanhMuc().then(setDm); getCongTy().then(setCty); }, []);

  useEffect(() => {
    if (!maVT) return;
    setLoading(true);
    const p = {};
    if (filter.tu_ngay)  p.tu_ngay  = filter.tu_ngay;
    if (filter.den_ngay) p.den_ngay = filter.den_ngay;
    getChiTiet(maVT, p).then(r => { setData(r); setLoading(false); }).catch(() => setLoading(false));
  }, [maVT, filter]); // eslint-disable-line

  const totNhap = data?.chi_tiet.reduce((s,r) => s + Number(r.so_luong_nhap||0), 0) || 0;
  const totXuat = data?.chi_tiet.reduce((s,r) => s + Number(r.so_luong_xuat||0), 0) || 0;
  const tonCuoi = (data?.ton_dau_ky || 0) + totNhap - totXuat;

  const tuNgay  = filter.tu_ngay  || cty?.tu_ngay  || '';
  const denNgay = filter.den_ngay || cty?.den_ngay || '';

  const handlePrint = () => {
    if (!data) return;
    const rows_html = data.chi_tiet.map((r,i) => `
      <tr>
        <td class="center">${i+1}</td>
        <td>${fmtD(r.ngay_chung_tu)}</td>
        <td>${r.so_chung_tu}</td>
        <td>${fmtD(r.ngay_ghi_so)}</td>
        <td>${r.dien_giai||''}</td>
        <td class="num">${Number(r.so_luong_nhap)>0?fmt(r.so_luong_nhap):''}</td>
        <td class="num">${Number(r.so_luong_xuat)>0?fmt(r.so_luong_xuat):''}</td>
        <td class="num" style="font-weight:bold;${Number(r.ton_luy_ke)<0?'color:red':''}">${fmt(r.ton_luy_ke)}</td>
      </tr>`).join('');

    printHtml(`
      <p><b>${cty?.ten_cong_ty}</b></p>
      <p>${cty?.dia_chi}</p>
      <h3>SỔ CHI TIẾT VẬT LIỆU, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA</h3>
      <p style="text-align:center">Từ ${fmtD(tuNgay)} đến ${fmtD(denNgay)}</p>
      <p><b>Tên vật tư:</b> ${data.danh_muc?.ten_vat_tu} &nbsp;&nbsp; <b>Mã:</b> ${data.danh_muc?.ma_vat_tu} &nbsp;&nbsp; <b>ĐVT:</b> ${data.danh_muc?.dvt}</p>
      <table>
        <colgroup>
          <col style="width:40px"/>
          <col style="width:20mm"/>
          <col style="width:22mm"/>
          <col style="width:20mm"/>
          <col style="width:auto"/>
          <col style="width:18mm"/>
          <col style="width:18mm"/>
          <col style="width:20mm"/>
        </colgroup>
        <thead><tr>
          <th style="width:40px">STT</th><th>Ngày CT</th><th>Số CT</th><th>Ngày g/sổ</th>
          <th>Diễn giải</th><th>Nhập</th><th>Xuất</th><th>Tồn lũy kế</th>
        </tr></thead>
        <tbody>
          <tr><td></td><td colspan="4"><i>Tồn đầu kỳ</i></td><td></td><td></td>
            <td class="num"><b>${fmt(data.ton_dau_ky)}</b></td></tr>
          ${rows_html}
        </tbody>
        <tfoot><tr>
          <td colspan="5" class="center"><b>CỘNG</b></td>
          <td class="num"><b>${fmt(totNhap)}</b></td>
          <td class="num"><b>${fmt(totXuat)}</b></td>
          <td class="num"><b>${fmt(tonCuoi)}</b></td>
        </tr></tfoot>
      </table>
      <div class="sig-row">
        ${['Người lập biểu','Thủ kho','Kế toán trưởng'].map(t =>
          `<div><p><b>${t}</b></p><p><i>(Ký, ghi rõ họ tên)</i></p><br/><br/>
           <p>${t==='Người lập biểu'?(cty?.nguoi_lap_bieu||''):t==='Thủ kho'?(cty?.thu_kho||''):''}</p>
          </div>`).join('')}
      </div>
    `, `Chi tiết NXT - ${maVT}`);
  };

  // ── XUẤT EXCEL ──────────────────────────────
  const handleExcel = () => {
    if (!data) return;
    const headers = ['STT','Ngày CT','Số CT','Ngày ghi sổ','Diễn giải','Nhập','Xuất','Tồn lũy kế'];
    const exRows  = [
      ['','','','','Tồn đầu kỳ','','',data.ton_dau_ky],
      ...data.chi_tiet.map((r,i) => [
        i+1, fmtD(r.ngay_chung_tu), r.so_chung_tu, fmtD(r.ngay_ghi_so),
        r.dien_giai||'', Number(r.so_luong_nhap)||'', Number(r.so_luong_xuat)||'', Number(r.ton_luy_ke),
      ]),
      ['','','','','CỘNG', totNhap, totXuat, tonCuoi],
    ];
    exportExcel(headers, exRows, `ChiTiet_${maVT}`);
  };

  return (
    <div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group" style={{minWidth:280}}>
              <label>Chọn mã vật tư *</label>
              <select value={maVT} onChange={e=>setMaVT(e.target.value)}>
                <option value="">-- Chọn mã vật tư --</option>
                {dm.map(d=><option key={d.ma_vat_tu} value={d.ma_vat_tu}>{d.ma_vat_tu} — {d.ten_vat_tu}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Từ ngày</label>
              <input type="date" value={filter.tu_ngay} onChange={e=>setFilter(f=>({...f,tu_ngay:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <input type="date" value={filter.den_ngay} onChange={e=>setFilter(f=>({...f,den_ngay:e.target.value}))}/>
            </div>
            <button className="btn btn-ghost" onClick={()=>setFilter({tu_ngay:'',den_ngay:''})}>Xóa lọc</button>
            {data && <>
              <button className="btn btn-ghost" onClick={handleExcel} style={{marginLeft:'auto'}}>📥 Xuất Excel</button>
              <button className="btn btn-print"  onClick={handlePrint}>🖨️ In</button>
            </>}
          </div>
        </div>
      </div>

      {data && !loading && (
        <div className="stats-grid" style={{marginBottom:16}}>
          <div className="stat-card">
            <div className="stat-label">Tên vật tư</div>
            <div style={{fontSize:13,fontWeight:700,color:'#1b3a2f',marginTop:4,lineHeight:1.3}}>{data.danh_muc?.ten_vat_tu}</div>
          </div>
          <div className="stat-card"><div className="stat-label">Tồn đầu kỳ</div><div className="stat-value">{fmt(data.ton_dau_ky)}</div></div>
          <div className="stat-card"><div className="stat-label">Tổng nhập</div><div className="stat-value" style={{color:'#2e7d32'}}>{fmt(totNhap)}</div></div>
          <div className="stat-card orange"><div className="stat-label">Tổng xuất</div><div className="stat-value" style={{color:'#e65100'}}>{fmt(totXuat)}</div></div>
          <div className="stat-card blue"><div className="stat-label">Tồn cuối kỳ</div><div className="stat-value" style={{color:tonCuoi<0?'#c0392b':'#1565c0'}}>{fmt(tonCuoi)}</div></div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>🔍 Chi tiết N-X-T {maVT ? `— ${maVT}` : ''}</h2>
        </div>
        <div className="card-body">
          {!maVT && <p style={{textAlign:'center',color:'#aaa',padding:40}}>← Chọn mã vật tư để xem chi tiết</p>}
          {loading && <div className="spinner"/>}
          {data && !loading && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width:40}}>STT</th><th>Ngày CT</th><th>Số CT</th>
                    <th>Ngày ghi sổ</th><th>Diễn giải</th>
                    <th className="text-right">Nhập</th>
                    <th className="text-right">Xuất</th>
                    <th className="text-right">Tồn lũy kế</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{fontStyle:'italic',background:'#f9f9f9'}}>
                    <td></td><td colSpan={4}><i>Tồn đầu kỳ</i></td>
                    <td></td><td></td>
                    <td className="num"><b>{fmt(data.ton_dau_ky)}</b></td>
                  </tr>
                  {data.chi_tiet.map((r,i) => (
                    <tr key={r.id}>
                      <td className="text-center">{i+1}</td>
                      <td>{fmtD(r.ngay_chung_tu)}</td>
                      <td><span className={`badge ${r.so_luong_nhap>0?'badge-nhap':'badge-xuat'}`}>{r.so_chung_tu}</span></td>
                      <td>{fmtD(r.ngay_ghi_so)}</td>
                      <td style={{maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.dien_giai}>{r.dien_giai}</td>
                      <td className="num" style={{color:'#2e7d32',fontWeight:Number(r.so_luong_nhap)>0?700:400}}>
                        {Number(r.so_luong_nhap)>0?fmt(r.so_luong_nhap):''}
                      </td>
                      <td className="num" style={{color:'#e65100',fontWeight:Number(r.so_luong_xuat)>0?700:400}}>
                        {Number(r.so_luong_xuat)>0?fmt(r.so_luong_xuat):''}
                      </td>
                      <td className={`num ${Number(r.ton_luy_ke)<0?'ton-am':''}`}><b>{fmt(r.ton_luy_ke)}</b></td>
                    </tr>
                  ))}
                  {!data.chi_tiet.length && <tr><td colSpan={8} className="text-center" style={{padding:24,color:'#aaa'}}>Không có giao dịch trong kỳ</td></tr>}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="text-center"><b>CỘNG</b></td>
                    <td className="num" style={{color:'#2e7d32'}}><b>{fmt(totNhap)}</b></td>
                    <td className="num" style={{color:'#e65100'}}><b>{fmt(totXuat)}</b></td>
                    <td className="num"><b>{fmt(tonCuoi)}</b></td>
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
