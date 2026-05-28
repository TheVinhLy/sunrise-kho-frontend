import React, { useState, useEffect, useCallback } from 'react';
import { getChungTu, addChungTu, updateChungTu, deleteChungTu, getDanhMuc, getNhaCc } from '../utils/api';
import { exportExcel } from '../utils/printExcel';

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const BLANK = {
  ngay_ghi_so: today(), so_chung_tu: '', ngay_chung_tu: today(),
  dien_giai: '', so_luong_nhap: '', so_luong_xuat: '',
  don_gia: '', thanh_tien: 0,
  ma_vat_tu: '', nha_cc_id: '', ten_nha_cc: '', nguoi_nhan_giao: '', noi_dung: '', dia_chi: ''
};

const fmt  = n => n ? Number(n).toLocaleString('vi-VN') : '';
const fmtD = d => d ? d.slice(0,10).split('-').reverse().join('/') : '';

export default function NhapLieu() {
  const [rows, setRows]     = useState([]);
  const [dm, setDm]         = useState([]);
  const [nccList, setNccList] = useState([]);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(BLANK);
  const [filter, setFilter] = useState({ tu_ngay: firstOfMonth(), den_ngay: today(), ma_vat_tu: '', loai: '' });
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const PER = 50;

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter.tu_ngay)   params.tu_ngay   = filter.tu_ngay;
    if (filter.den_ngay)  params.den_ngay  = filter.den_ngay;
    if (filter.ma_vat_tu) params.ma_vat_tu = filter.ma_vat_tu;
    if (filter.loai)      params.loai      = filter.loai;
    getChungTu(params)
      .then(r => { setRows(r); setLoading(false); setPage(1); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [filter]);

  useEffect(load, [load]);
  useEffect(() => { getDanhMuc().then(setDm); getNhaCc().then(setNccList); }, []);

  const setF = (k, v) => setFilter(f => ({ ...f, [k]: v }));

  // Tính thanh tiền tự động
  const set = (k, v) => {
    setForm(f => {
      const updated = { ...f, [k]: v };
      const sl = Number(k === 'so_luong_nhap' ? v : updated.so_luong_nhap || 0)
               + Number(k === 'so_luong_xuat' ? v : updated.so_luong_xuat || 0);
      const dg = Number(k === 'don_gia' ? v : updated.don_gia || 0);
      updated.thanh_tien = sl * dg;
      // Khi nhập SL nhập thì xóa SL xuất và ngược lại
      if (k === 'so_luong_nhap' && v) updated.so_luong_xuat = '';
      if (k === 'so_luong_xuat' && v) updated.so_luong_nhap = '';
      return updated;
    });
  };

  const autoSoCT = (prefix) => {
    const nums = rows
      .filter(r => r.so_chung_tu.startsWith(prefix))
      .map(r => parseInt(r.so_chung_tu.replace(prefix, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  };

  const openAdd = (loai = 'nhap') => {
    const prefix = loai === 'nhap' ? 'PN' : 'PX';
    setForm({ ...BLANK, so_chung_tu: autoSoCT(prefix) });
    setErr(''); setModal({ mode: 'add', loai });
  };

  const openEdit = (r) => {
    setForm({
      ...r,
      so_luong_nhap: r.so_luong_nhap || '',
      so_luong_xuat: r.so_luong_xuat || '',
      don_gia:       r.don_gia || '',
      thanh_tien:    r.thanh_tien || 0,
    });
    setErr('');
    setModal({ mode: 'edit', id: r.id, loai: r.so_luong_nhap > 0 ? 'nhap' : 'xuat' });
  };

  const save = async () => {
    if (!form.ma_vat_tu)  { setErr('Chọn mã vật tư'); return; }
    if (!form.so_chung_tu){ setErr('Nhập số chứng từ'); return; }
    if (!form.so_luong_nhap && !form.so_luong_xuat) { setErr('Nhập số lượng nhập hoặc xuất'); return; }
    try {
      if (modal.mode === 'add') await addChungTu(form);
      else await updateChungTu(modal.id, form);
      setModal(null); load();
    } catch (e) { setErr(e.message); }
  };

  const del = async (r) => {
    if (!window.confirm(`Xóa chứng từ ${r.so_chung_tu}?`)) return;
    await deleteChungTu(r.id); load();
  };

  const tongNhap   = rows.reduce((s,r) => s + Number(r.so_luong_nhap  || 0), 0);
  const tongXuat   = rows.reduce((s,r) => s + Number(r.so_luong_xuat  || 0), 0);
  const tongThTien = rows.reduce((s,r) => s + Number(r.thanh_tien     || 0), 0);

  const totalPages = Math.ceil(rows.length / PER);
  const paged      = rows.slice((page-1)*PER, page*PER);

  // Loại phiếu hiện tại trong modal
  const isNhapModal = modal?.loai === 'nhap';

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Tổng chứng từ</div>
          <div className="stat-value">{rows.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng nhập</div>
          <div className="stat-value" style={{color:'#2e7d32'}}>{fmt(tongNhap)}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Tổng xuất</div>
          <div className="stat-value" style={{color:'#e65100'}}>{fmt(tongXuat)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Tổng thành tiền</div>
          <div className="stat-value" style={{color:'#1565c0'}}>{fmt(tongThTien)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>✏️ Bảng nhập liệu chứng từ</h2>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost" onClick={() => {
              const headers = ['STT','Ngày g/sổ','Số CT','Ngày CT','Diễn giải','Nhập','Xuất','Đơn giá','Thành tiền','Mã VT','ĐVT','Tên vật tư','Nhà CC','Người N/G'];
              const exRows = rows.map((r,i) => [
                i+1, fmtD(r.ngay_ghi_so), r.so_chung_tu, fmtD(r.ngay_chung_tu),
                r.dien_giai||'', Number(r.so_luong_nhap)||0, Number(r.so_luong_xuat)||0,
                Number(r.don_gia)||0, Number(r.thanh_tien)||0,
                r.ma_vat_tu, r.dvt||'', r.ten_vat_tu||'', r.ten_nha_cc||'', r.nguoi_nhan_giao||'',
              ]);
              exportExcel(headers, exRows, 'NhapLieu');
            }}>📥 Xuất Excel</button>
            <button className="btn btn-primary" onClick={() => openAdd('nhap')}>+ Phiếu nhập</button>
            <button className="btn btn-warning" onClick={() => openAdd('xuat')}>+ Phiếu xuất</button>
          </div>
        </div>

        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group">
              <label>Từ ngày</label>
              <input type="date" value={filter.tu_ngay} onChange={e=>setF('tu_ngay',e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
              <input type="date" value={filter.den_ngay} onChange={e=>setF('den_ngay',e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Mã vật tư</label>
              <select value={filter.ma_vat_tu} onChange={e=>setF('ma_vat_tu',e.target.value)}>
                <option value="">-- Tất cả --</option>
                {dm.map(d=><option key={d.ma_vat_tu} value={d.ma_vat_tu}>{d.ma_vat_tu}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Loại</label>
              <select value={filter.loai} onChange={e=>setF('loai',e.target.value)}>
                <option value="">Tất cả</option>
                <option value="nhap">Nhập</option>
                <option value="xuat">Xuất</option>
              </select>
            </div>
            <button className="btn btn-ghost"
              onClick={()=>setFilter({tu_ngay:firstOfMonth(),den_ngay:today(),ma_vat_tu:'',loai:''})}>
              Xóa lọc
            </button>
          </div>

          {loading ? <div className="spinner"/> : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Ngày g/sổ</th>
                      <th>Số CT</th>
                      <th>Ngày CT</th>
                      <th>Diễn giải</th>
                      <th className="text-right">Nhập</th>
                      <th className="text-right">Xuất</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-right">Thành tiền</th>
                      <th>Mã VT</th>
                      <th>ĐVT</th>
                      <th>Tên vật tư</th>
                      <th>Nhà CC</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r,i) => (
                      <tr key={r.id}>
                        <td className="text-center">{(page-1)*PER+i+1}</td>
                        <td>{fmtD(r.ngay_ghi_so)}</td>
                        <td>
                          <span className={`badge ${r.so_luong_nhap>0?'badge-nhap':'badge-xuat'}`}>
                            {r.so_chung_tu}
                          </span>
                        </td>
                        <td>{fmtD(r.ngay_chung_tu)}</td>
                        <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r.dien_giai}>{r.dien_giai}</td>
                        <td className="num" style={{color:'#2e7d32',fontWeight:r.so_luong_nhap>0?700:400}}>{fmt(r.so_luong_nhap)}</td>
                        <td className="num" style={{color:'#e65100',fontWeight:r.so_luong_xuat>0?700:400}}>{fmt(r.so_luong_xuat)}</td>
                        <td className="num">{fmt(r.don_gia)}</td>
                        <td className="num" style={{fontWeight:600}}>{fmt(r.thanh_tien)}</td>
                        <td><b>{r.ma_vat_tu}</b></td>
                        <td>{r.dvt}</td>
                        <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.ten_vat_tu}</td>
                        <td>{r.ten_nha_cc}</td>
                        <td style={{whiteSpace:'nowrap'}}>
                          <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(r)}>✏️</button>{' '}
                          <button className="btn btn-danger btn-sm" onClick={()=>del(r)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {!paged.length && (
                      <tr><td colSpan={14} className="text-center" style={{padding:24,color:'#aaa'}}>Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagi">
                  <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
                  {Array.from({length:totalPages},(_,i)=>(
                    <button key={i} className={page===i+1?'active':''} onClick={()=>setPage(i+1)}>{i+1}</button>
                  ))}
                  <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
                  <span style={{color:'#888'}}>{rows.length} dòng</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal nhập liệu */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modal.mode==='add'
                  ? (isNhapModal ? '📥 Thêm phiếu nhập' : '📤 Thêm phiếu xuất')
                  : '✏️ Sửa chứng từ'}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Ngày ghi sổ *</label>
                  <input type="date" value={form.ngay_ghi_so} onChange={e=>set('ngay_ghi_so',e.target.value)}/>
                </div>
                <div className="form-group">
                  <label>Số chứng từ *</label>
                  <input value={form.so_chung_tu} onChange={e=>set('so_chung_tu',e.target.value)} placeholder="PN0001 / PX0001"/>
                </div>
                <div className="form-group">
                  <label>Ngày chứng từ</label>
                  <input type="date" value={form.ngay_chung_tu} onChange={e=>set('ngay_chung_tu',e.target.value)}/>
                </div>
                <div className="form-group">
                  <label>Mã vật tư *</label>
                  <select value={form.ma_vat_tu} onChange={e=>{
                    const found = dm.find(d=>d.ma_vat_tu===e.target.value);
                    setForm(f=>({
                      ...f,
                      ma_vat_tu:  e.target.value,
                      nha_cc_id:  found?.nha_cc_id || '',
                      ten_nha_cc: found?.ten_nha_cc || f.ten_nha_cc,
                    }));
                  }}>
                    <option value="">-- Chọn mã vật tư --</option>
                    {dm.map(d=><option key={d.ma_vat_tu} value={d.ma_vat_tu}>{d.ma_vat_tu} - {d.ten_vat_tu}</option>)}
                  </select>
                </div>

                {/* Số lượng nhập — disable nếu đang xuất */}
                <div className="form-group">
                  <label>Số lượng nhập {isNhapModal ? '*' : ''}</label>
                  <input
                    type="number" min="0"
                    value={form.so_luong_nhap}
                    disabled={!isNhapModal && !!form.so_luong_xuat}
                    onChange={e=>set('so_luong_nhap',e.target.value)}
                    placeholder={isNhapModal ? '0' : '— (phiếu xuất)'}
                    style={{
                      background: (!isNhapModal) ? '#f5f5f5' : '',
                      color: (!isNhapModal) ? '#aaa' : '',
                    }}
                  />
                </div>

                {/* Số lượng xuất — disable nếu đang nhập */}
                <div className="form-group">
                  <label>Số lượng xuất {!isNhapModal ? '*' : ''}</label>
                  <input
                    type="number" min="0"
                    value={form.so_luong_xuat}
                    disabled={isNhapModal && !!form.so_luong_nhap}
                    onChange={e=>set('so_luong_xuat',e.target.value)}
                    placeholder={!isNhapModal ? '0' : '— (phiếu nhập)'}
                    style={{
                      background: (isNhapModal) ? '#f5f5f5' : '',
                      color: (isNhapModal) ? '#aaa' : '',
                    }}
                  />
                </div>

                {/* Đơn giá và Thành tiền */}
                <div className="form-group">
                  <label>Đơn giá</label>
                  <input
                    type="number" min="0"
                    value={form.don_gia}
                    onChange={e=>set('don_gia',e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Thành tiền (tự tính)</label>
                  <input
                    value={fmt(form.thanh_tien)}
                    readOnly
                    style={{background:'#f0f7f3',fontWeight:700,color:'#1b3a2f'}}
                  />
                </div>

                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Diễn giải</label>
                  <input value={form.dien_giai||''} onChange={e=>set('dien_giai',e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Nhà cung cấp</label>
                  <div style={{display:'flex',gap:6,marginBottom:4}}>
                    <select
                      value={form.nha_cc_id||''}
                      onChange={e=>{
                        const ncc = nccList.find(n=>n.id===+e.target.value);
                        setForm(f=>({
                          ...f,
                          nha_cc_id:  e.target.value ? +e.target.value : '',
                          ten_nha_cc: ncc ? ncc.ten_nha_cc : f.ten_nha_cc,
                        }));
                      }}
                      style={{flex:1}}
                    >
                      <option value="">-- Chọn NCC hoặc nhập tay --</option>
                      {nccList.map(n=>(
                        <option key={n.id} value={n.id}>{n.ten_nha_cc}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={form.ten_nha_cc||''}
                    onChange={e=>set('ten_nha_cc',e.target.value)}
                    placeholder="Tên NCC (tự điền hoặc nhập tay)"
                  />
                </div>
                <div className="form-group">
                  <label>Người nhận/giao</label>
                  <input value={form.nguoi_nhan_giao||''} onChange={e=>set('nguoi_nhan_giao',e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Nội dung</label>
                  <textarea value={form.noi_dung||''} onChange={e=>set('noi_dung',e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Địa chỉ</label>
                  <input value={form.dia_chi||''} onChange={e=>set('dia_chi',e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={save}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
