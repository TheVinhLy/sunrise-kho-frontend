import React, { useState, useEffect } from 'react';
import { getPhieu, getSoChungTu, getCongTy } from '../utils/api';
import { printHtml, fmt, fmtD } from '../utils/printExcel';

function soTienBangChu(n) {
  const donvi = ['','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  const hang  = ['','nghìn','triệu','tỷ'];
  if (!n || n === 0) return 'Không';
  n = Math.round(n);
  let str = '';
  let i = 0;
  while (n > 0) {
    const nhom = n % 1000;
    if (nhom !== 0) {
      const h = Math.floor(nhom / 100);
      const ch = Math.floor((nhom % 100) / 10);
      const dv = nhom % 10;
      let s = '';
      if (h)  s += donvi[h]  + ' trăm ';
      if (ch) s += donvi[ch] + ' mươi ';
      if (dv) s += donvi[dv] + ' ';
      str = s + (hang[i] ? hang[i] + ' ' : '') + str;
    }
    n = Math.floor(n / 1000);
    i++;
  }
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1);
}

export default function InPhieu() {
  const [dsSoCT, setDsSoCT] = useState([]);
  const [cty, setCty]       = useState(null);
  const [soCT, setSoCT]     = useState('');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getSoChungTu().then(setDsSoCT);
    getCongTy().then(setCty);
  }, []);

  useEffect(() => {
    if (!soCT) { setData(null); return; }
    setLoading(true);
    getPhieu(soCT)
      .then(r => { setData(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, [soCT]);

  // ── IN — build HTML string, không dùng DOM ref ──────────────────
  const handlePrint = () => {
    if (!data) return;
    const rows   = data.rows || [];
    const first  = rows[0] || {};
    const isNhap = data.loai === 'nhap';
    const loai   = isNhap ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO';
    const mauSo  = isNhap ? 'Mẫu số: 01-VT' : 'Mẫu số: 02-VT';
    const tongSL = rows.reduce((s,r) => s + Number(isNhap ? r.so_luong_nhap : r.so_luong_xuat || 0), 0);

    const chiTietRows = rows.map((r, i) => {
      const sl = Number(isNhap ? r.so_luong_nhap : r.so_luong_xuat || 0);
      return `<tr>
        <td class="center">${i+1}</td>
        <td>${r.ten_vat_tu || ''}</td>
        <td>${r.ma_vat_tu || ''}</td>
        <td class="center">${r.dvt || ''}</td>
        <td class="num">${fmt(sl)}</td>
        <td class="num">${fmt(sl)}</td>
        <td></td><td></td>
      </tr>`;
    }).join('');

    // Padding rows tối thiểu 5 dòng
    const padRows = Array.from({ length: Math.max(0, 5 - rows.length) })
      .map(() => '<tr style="height:26px"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>')
      .join('');

    const sigNames = isNhap
      ? ['Người lập phiếu','Người giao hàng','Thủ kho','Kế toán trưởng']
      : ['Người lập phiếu','Người nhận hàng','Thủ kho','Kế toán trưởng'];

    const content = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <div>
          <p><strong>${cty?.ten_cong_ty || ''}</strong></p>
          <p>${cty?.dia_chi || ''}</p>
          <p>Tên kho: ${cty?.ten_kho || ''}</p>
        </div>
        <div style="text-align:right;font-style:italic;font-size:12px;">
          <p>${mauSo}</p>
          <p>Ban hành theo TT 200/2014/TT-BTC</p>
        </div>
      </div>
      <hr/>
      <h2>${loai}</h2>
      <p style="text-align:center;font-size:13px;">
        Ngày ${fmtD(first.ngay_chung_tu)} &nbsp;|&nbsp; Số: <strong>${soCT}</strong>
      </p>
      <p style="margin-top:8px;">
        - ${isNhap ? 'Họ tên người giao' : 'Họ tên người nhận hàng'}:
        <strong>${first.nguoi_nhan_giao || '..........................................'}</strong>
      </p>
      <p>- Nhập/Xuất tại kho: <strong>${cty?.ten_kho || ''}</strong></p>
      <p>- Nội dung: <strong>${first.noi_dung || first.dien_giai || ''}</strong></p>
      ${first.ten_nha_cc ? `<p>- Nhà cung cấp: <strong>${first.ten_nha_cc}</strong></p>` : ''}
      <table>
        <colgroup>
          <col style="width:22px"/>
          <col style="width:auto"/>
          <col style="width:24mm"/>
          <col style="width:12mm"/>
          <col style="width:18mm"/>
          <col style="width:18mm"/>
          <col style="width:18mm"/>
          <col style="width:22mm"/>
        </colgroup>
        <thead>
          <tr>
            <th style="width:22px">STT</th>
            <th>Tên vật tư / hàng hoá</th>
            <th style="width:24mm">Mã số</th>
            <th style="width:12mm">ĐVT</th>
            <th style="width:18mm">SL yêu cầu</th>
            <th style="width:18mm">SL thực tế</th>
            <th style="width:18mm">Đơn giá</th>
            <th style="width:22mm">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${chiTietRows}
          ${padRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="center">CỘNG</td>
            <td class="num"><strong>${fmt(tongSL)}</strong></td>
            <td class="num"><strong>${fmt(tongSL)}</strong></td>
            <td></td><td></td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top:10px;font-style:italic;">
        - Tổng số lượng (viết bằng chữ): ${soTienBangChu(tongSL)} ${first.dvt || 'cái'}
      </p>
      <div class="sig-row">
        ${sigNames.map(t => `
          <div>
            <p><strong>${t}</strong></p>
            <p style="font-style:italic;font-size:11px;">(Ký, ghi rõ họ tên)</p>
            <br/><br/>
            <p style="border-top:1px solid #333;padding-top:4px;font-size:12px;">
              ${t==='Người lập phiếu' ? (cty?.nguoi_lap_bieu||'') :
                t==='Thủ kho'         ? (cty?.thu_kho||'') :
                t.includes('giao') || t.includes('nhận') ? (first.nguoi_nhan_giao||'') : ''}
            </p>
          </div>`).join('')}
      </div>`;

    printHtml(content, `${loai} - ${soCT}`);
  };

  const filteredDS = dsSoCT.filter(d =>
    !search ||
    d.so_chung_tu.toLowerCase().includes(search.toLowerCase()) ||
    (d.loai_ct||'').toLowerCase().includes(search.toLowerCase())
  );

  const rows   = data?.rows || [];
  const first  = rows[0] || {};
  const isNhap = data?.loai === 'nhap';
  const loaiPhieu = data?.loai === 'nhap' ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO';
  const tongSL = rows.reduce((s,r) => s + Number(isNhap ? r.so_luong_nhap : r.so_luong_xuat || 0), 0);

  return (
    <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
      {/* Danh sách bên trái */}
      <div className="card" style={{width:260,flexShrink:0,position:'sticky',top:0}}>
        <div className="card-header"><h2 style={{fontSize:13}}>📋 Chọn chứng từ</h2></div>
        <div className="card-body" style={{padding:'10px 12px'}}>
          <input placeholder="Tìm số CT..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%',marginBottom:8,padding:'6px 8px',border:'1px solid #ccc',borderRadius:4,fontFamily:'inherit',fontSize:13}}/>
          <div style={{maxHeight:'calc(100vh - 220px)',overflowY:'auto'}}>
            {filteredDS.map(d => (
              <div key={d.so_chung_tu} onClick={()=>setSoCT(d.so_chung_tu)}
                style={{
                  padding:'8px 10px',cursor:'pointer',borderRadius:6,marginBottom:3,
                  background:soCT===d.so_chung_tu?'#1b3a2f':'#f5f5f5',
                  color:soCT===d.so_chung_tu?'#fff':'#333',
                  fontSize:13,display:'flex',justifyContent:'space-between',alignItems:'center',
                }}>
                <span style={{fontWeight:700}}>{d.so_chung_tu}</span>
                <span style={{fontSize:11,padding:'2px 6px',borderRadius:10,
                  background:d.loai_ct==='Nhập'?'#e8f5e9':'#fff3e0',
                  color:d.loai_ct==='Nhập'?'#2e7d32':'#e65100'}}>
                  {d.loai_ct}
                </span>
              </div>
            ))}
            {!filteredDS.length && <p style={{color:'#aaa',textAlign:'center',padding:16,fontSize:12}}>Không có chứng từ</p>}
          </div>
        </div>
      </div>

      {/* Nội dung phiếu */}
      <div style={{flex:1}}>
        {!soCT && !loading && (
          <div className="card">
            <div className="card-body" style={{textAlign:'center',padding:60,color:'#aaa'}}>
              ← Chọn số chứng từ để xem phiếu
            </div>
          </div>
        )}
        {loading && <div className="spinner"/>}
        {data && !loading && (
          <div className="card">
            <div className="card-header">
              <h2>{loaiPhieu} — {soCT}</h2>
              <button className="btn btn-print" onClick={handlePrint}>🖨️ In phiếu</button>
            </div>
            <div className="card-body">
              {/* Preview phiếu */}
              <div style={{fontFamily:"'Times New Roman',serif",fontSize:13}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div>
                    <p style={{fontWeight:700}}>{cty?.ten_cong_ty}</p>
                    <p style={{fontSize:12}}>{cty?.dia_chi}</p>
                    <p style={{fontSize:12}}>Tên kho: {cty?.ten_kho}</p>
                  </div>
                  <div style={{textAlign:'right',fontSize:12,fontStyle:'italic'}}>
                    <p>{data.loai==='nhap'?'Mẫu số: 01-VT':'Mẫu số: 02-VT'}</p>
                  </div>
                </div>
                <h2 style={{textAlign:'center',fontSize:17,margin:'8px 0 4px'}}>{loaiPhieu}</h2>
                <p style={{textAlign:'center',fontSize:13,marginBottom:10}}>
                  Ngày {fmtD(first.ngay_chung_tu)} &nbsp;|&nbsp; Số: <b>{soCT}</b>
                </p>
                <p>- {isNhap?'Họ tên người giao':'Họ tên người nhận hàng'}: <b>{first.nguoi_nhan_giao||'...'}</b></p>
                <p>- Nhập/Xuất tại kho: <b>{cty?.ten_kho}</b></p>
                <p>- Nội dung: <b>{first.noi_dung||first.dien_giai||''}</b></p>
                {first.ten_nha_cc && <p>- Nhà cung cấp: <b>{first.ten_nha_cc}</b></p>}

                <div className="table-wrap" style={{marginTop:12}}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{width:30}}>STT</th>
                        <th>Tên vật tư / hàng hoá</th>
                        <th style={{width:110}}>Mã số</th>
                        <th style={{width:45}}>ĐVT</th>
                        <th style={{width:80}}>SL yêu cầu</th>
                        <th style={{width:80}}>SL thực tế</th>
                        <th style={{width:80}}>Đơn giá</th>
                        <th style={{width:90}}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r,i) => {
                        const sl = Number(isNhap ? r.so_luong_nhap : r.so_luong_xuat || 0);
                        return (
                          <tr key={r.id}>
                            <td className="text-center">{i+1}</td>
                            <td>{r.ten_vat_tu}</td>
                            <td>{r.ma_vat_tu}</td>
                            <td className="text-center">{r.dvt}</td>
                            <td className="num">{fmt(sl)}</td>
                            <td className="num">{fmt(sl)}</td>
                            <td></td><td></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-center"><b>CỘNG</b></td>
                        <td className="num"><b>{fmt(tongSL)}</b></td>
                        <td className="num"><b>{fmt(tongSL)}</b></td>
                        <td></td><td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p style={{marginTop:10,fontStyle:'italic',fontSize:13}}>
                  - Tổng số lượng (viết bằng chữ): {soTienBangChu(tongSL)} {first.dvt||'cái'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
