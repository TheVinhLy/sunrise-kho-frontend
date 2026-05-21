import React, { useState, useEffect, useRef } from 'react';
import { getPhieu, getSoChungTu, getCongTy } from '../utils/api';
import { printHtml } from '../utils/printExcel';

const fmt  = n => Number(n || 0).toLocaleString('vi-VN');
const fmtD = d => d ? d.slice(0,10).split('-').reverse().join('/') : '';

function soTienBangChu(n) {
  const donvi = ['','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  const hang  = ['','nghìn','triệu','tỷ'];
  if (!n || n === 0) return 'Không đồng';
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
      if (h) s += donvi[h] + ' trăm ';
      if (ch) s += donvi[ch] + ' mươi ';
      if (dv) s += donvi[dv] + ' ';
      str = s + (hang[i] ? hang[i] + ' ' : '') + str;
    }
    n = Math.floor(n / 1000);
    i++;
  }
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1) + ' đồng';
}

export default function InPhieu() {
  const [dsSoCT, setDsSoCT] = useState([]);
  const [cty, setCty]       = useState(null);
  const [soCT, setSoCT]     = useState('');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const printRef = useRef();

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

  const handlePrint = () => {
    if (!printRef.current) return;
    printHtml(printRef.current.innerHTML, `Phiếu ${soCT}`);
  };

  const isNhap = soCT.toUpperCase().includes('PN') || soCT.toUpperCase().startsWith('PNTP');
  const loaiPhieu = data?.loai === 'nhap' ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO';
  const mauSo    = data?.loai === 'nhap' ? 'Mẫu số: 01-VT' : 'Mẫu số: 02-VT';
  const rows     = data?.rows || [];

  const firstRow = rows[0] || {};
  const tongSL   = rows.reduce((s,r) => s + (data?.loai==='nhap' ? (r.so_luong_nhap||0) : (r.so_luong_xuat||0)), 0);

  const filteredDS = dsSoCT.filter(d =>
    !search ||
    d.so_chung_tu.toLowerCase().includes(search.toLowerCase()) ||
    (d.loai_ct||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{display:'flex', gap:16, alignItems:'flex-start'}}>
      {/* Danh sách chứng từ bên trái */}
      <div className="card" style={{width:260, flexShrink:0, position:'sticky', top:0}}>
        <div className="card-header"><h2 style={{fontSize:13}}>📋 Chọn chứng từ</h2></div>
        <div className="card-body" style={{padding:'10px 12px'}}>
          <input
            placeholder="Tìm số CT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{width:'100%', marginBottom:8, padding:'6px 8px', border:'1px solid #ccc', borderRadius:4, fontFamily:'inherit', fontSize:13}}
          />
          <div style={{maxHeight:'calc(100vh - 220px)', overflowY:'auto'}}>
            {filteredDS.map(d => (
              <div
                key={d.so_chung_tu}
                onClick={() => setSoCT(d.so_chung_tu)}
                style={{
                  padding:'8px 10px',
                  cursor:'pointer',
                  borderRadius:6,
                  marginBottom:3,
                  background: soCT === d.so_chung_tu ? '#1b3a2f' : '#f5f5f5',
                  color: soCT === d.so_chung_tu ? '#fff' : '#333',
                  fontSize:13,
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center',
                  transition:'background .1s',
                }}
                onMouseEnter={e => { if (soCT !== d.so_chung_tu) e.currentTarget.style.background='#e8f5e9'; }}
                onMouseLeave={e => { if (soCT !== d.so_chung_tu) e.currentTarget.style.background='#f5f5f5'; }}
              >
                <span style={{fontWeight:700}}>{d.so_chung_tu}</span>
                <span style={{
                  fontSize:11, padding:'2px 6px', borderRadius:10,
                  background: d.loai_ct==='Nhập' ? '#e8f5e9' : '#fff3e0',
                  color:       d.loai_ct==='Nhập' ? '#2e7d32' : '#e65100',
                }}>{d.loai_ct}</span>
              </div>
            ))}
            {!filteredDS.length && <p style={{color:'#aaa', textAlign:'center', padding:16, fontSize:12}}>Không có chứng từ</p>}
          </div>
        </div>
      </div>

      {/* Nội dung phiếu bên phải */}
      <div style={{flex:1}}>
        {!soCT && !loading && (
          <div className="card">
            <div className="card-body" style={{textAlign:'center', padding:60, color:'#aaa'}}>
              ← Chọn số chứng từ để xem phiếu
            </div>
          </div>
        )}

        {loading && <div className="spinner" />}

        {data && !loading && (
          <div className="card">
            <div className="card-header">
              <h2>{loaiPhieu} — {soCT}</h2>
              <button className="btn btn-print no-print" onClick={handlePrint}>🖨️ In phiếu</button>
            </div>
            <div className="card-body">
              <div ref={printRef}>
                {/* ===== NỘI DUNG PHIẾU ===== */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                  <div>
                    <p style={{fontWeight:700, fontSize:13}}>{cty?.ten_cong_ty}</p>
                    <p style={{fontSize:12}}>{cty?.dia_chi}</p>
                    <p style={{fontSize:12}}>Tên kho: {cty?.ten_kho}</p>
                  </div>
                  <div style={{textAlign:'right', fontSize:12}}>
                    <p style={{fontStyle:'italic'}}>{mauSo}</p>
                    <p>Ban hành theo TT 200/2014/TT-BTC</p>
                  </div>
                </div>

                <hr style={{border:'none', borderTop:'1px solid #ccc', margin:'10px 0'}}/>

                <h2 style={{textAlign:'center', fontSize:18, margin:'8px 0 4px'}}>
                  {loaiPhieu}
                </h2>
                <p style={{textAlign:'center', fontSize:13, color:'#555', marginBottom:12}}>
                  Ngày {fmtD(firstRow.ngay_chung_tu)} &nbsp;|&nbsp; Số: <b>{soCT}</b>
                </p>

                {/* Thông tin chứng từ */}
                <table style={{border:'none', marginBottom:4}} className="info-table">
                  <tbody>
                    <tr>
                      <td style={{border:'none', width:'50%', paddingLeft:0}}>
                        {data.loai==='nhap'
                          ? <p>- Họ tên người giao: <b>{firstRow.nguoi_nhan_giao || '..........................................'}</b></p>
                          : <p>- Họ tên người nhận: <b>{firstRow.nguoi_nhan_giao || '..........................................'}</b></p>
                        }
                        <p>- Theo {data.loai==='nhap' ? 'lệnh nhập kho' : 'lệnh xuất kho'} số: <b>{soCT}</b></p>
                      </td>
                      <td style={{border:'none', width:'50%'}}>
                        <p>- Nhập/Xuất tại kho: <b>{cty?.ten_kho}</b></p>
                        <p>- Địa điểm: <b>{firstRow.dia_chi || cty?.dia_chi}</b></p>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{border:'none', paddingLeft:0}}>
                        - Nội dung: <b>{firstRow.noi_dung || firstRow.dien_giai}</b>
                      </td>
                    </tr>
                    {data.loai==='nhap' && firstRow.ten_nha_cc && (
                      <tr>
                        <td colSpan={2} style={{border:'none', paddingLeft:0}}>
                          - Nhà cung cấp: <b>{firstRow.ten_nha_cc}</b>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Bảng chi tiết */}
                <table>
                  <thead>
                    <tr>
                      <th style={{width:36}}>STT</th>
                      <th>Tên vật tư / hàng hoá</th>
                      <th style={{width:130}}>Mã số</th>
                      <th style={{width:55}}>ĐVT</th>
                      <th style={{width:100}}>SL yêu cầu</th>
                      <th style={{width:100}}>SL thực tế</th>
                      <th style={{width:110}}>Đơn giá</th>
                      <th style={{width:120}}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const sl = data.loai==='nhap' ? r.so_luong_nhap : r.so_luong_xuat;
                      return (
                        <tr key={r.id}>
                          <td style={{textAlign:'center'}}>{i+1}</td>
                          <td>{r.ten_vat_tu}</td>
                          <td>{r.ma_vat_tu}</td>
                          <td style={{textAlign:'center'}}>{r.dvt}</td>
                          <td style={{textAlign:'right'}}>{fmt(sl)}</td>
                          <td style={{textAlign:'right'}}>{fmt(sl)}</td>
                          <td style={{textAlign:'right'}}></td>
                          <td style={{textAlign:'right'}}></td>
                        </tr>
                      );
                    })}
                    {/* Padding rows để đủ tối thiểu 5 dòng */}
                    {Array.from({length: Math.max(0, 5 - rows.length)}).map((_,i) => (
                      <tr key={'pad'+i} style={{height:28}}>
                        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{textAlign:'center'}}>CỘNG</td>
                      <td style={{textAlign:'right'}}><b>{fmt(tongSL)}</b></td>
                      <td style={{textAlign:'right'}}><b>{fmt(tongSL)}</b></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Số tiền bằng chữ */}
                <p style={{margin:'10px 0 4px', fontSize:13}}>
                  - Tổng số lượng (viết bằng chữ): <i>{soTienBangChu(tongSL).replace('đồng','')}{firstRow.dvt || 'cái'}</i>
                </p>
                <p style={{fontSize:13, marginBottom:4}}>
                  - Nhập/Xuất kho ngày {fmtD(firstRow.ngay_chung_tu)}
                </p>
                {data.loai==='nhap' && (
                  <p style={{fontSize:13}}>
                    - Số chứng từ gốc kèm theo: ..........
                  </p>
                )}

                {/* Chữ ký */}
                <div style={{display:'flex', justifyContent:'space-around', marginTop:36, textAlign:'center'}}>
                  {(data.loai==='nhap'
                    ? ['Người lập phiếu', 'Người giao hàng', 'Thủ kho', 'Kế toán trưởng']
                    : ['Người lập phiếu', 'Người nhận hàng', 'Thủ kho', 'Kế toán trưởng']
                  ).map(t => (
                    <div key={t} style={{minWidth:120}}>
                      <p style={{fontWeight:700, fontSize:13}}>{t}</p>
                      <p style={{fontStyle:'italic', fontSize:11}}>(Ký, ghi rõ họ tên)</p>
                      <br/><br/>
                      <p style={{fontSize:12, borderTop:'1px solid #333', paddingTop:4}}>
                        {t==='Người lập phiếu' ? (cty?.nguoi_lap_bieu||'') :
                         t==='Thủ kho'         ? (cty?.thu_kho||'') :
                         t==='Người giao hàng' || t==='Người nhận hàng' ? (firstRow.nguoi_nhan_giao||'') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
