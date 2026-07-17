const BASE = process.env.REACT_APP_API_URL || '';

function getCompanyId() {
  try {
    const u = JSON.parse(localStorage.getItem('sk_user'));
    const id = u?.cong_ty?.id || u?.cong_ty_id || u?.company_id || null;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch { return null; }
}

async function api(path, options = {}) {
  const ctyId = getCompanyId();
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(ctyId ? { 'X-Company-Id': ctyId } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Lỗi server');
  }
  return res.json();
}

// Auth
export const login         = (data)       => api('/api/auth/login', { method: 'POST', body: data });
export const selectCompany = (cong_ty_id) => api('/api/auth/select-company', { method: 'POST', body: { cong_ty_id } });

// Quản lý công ty (Admin)
export const getCongTyList    = ()       => api('/api/cong-ty-list');
export const addCongTy        = (data)   => api('/api/cong-ty-list', { method: 'POST', body: data });
export const updateCongTyById = (id, data) => api(`/api/cong-ty-list/${id}`, { method: 'PUT', body: data });

// Thông tin công ty hiện tại
export const getCongTy    = ()     => api('/api/cong-ty');
export const updateCongTy = (data) => api('/api/cong-ty', { method: 'PUT', body: data });

// Users
export const getUsers     = ()          => api('/api/users');
export const addUser      = (data)      => api('/api/users', { method: 'POST', body: data });
export const updateUser   = (id, data)  => api(`/api/users/${id}`, { method: 'PUT', body: data });
export const deleteUser   = (id)        => api(`/api/users/${id}`, { method: 'DELETE' });
export const getUserPerms = (id)        => api(`/api/users/${id}/permissions`);
export const setUserPerms = (id, menus) => api(`/api/users/${id}/permissions`, { method: 'PUT', body: { menus } });

// DVT
export const getDvt    = ()     => api('/api/dvt');
export const addDvt    = (data) => api('/api/dvt', { method: 'POST', body: data });
export const deleteDvt = (id)   => api(`/api/dvt/${id}`, { method: 'DELETE' });

// Nhân viên
export const getNhanVien    = ()          => api('/api/nhan-vien');
export const addNhanVien    = (data)      => api('/api/nhan-vien', { method: 'POST', body: data });
export const updateNhanVien = (id, data)  => api(`/api/nhan-vien/${id}`, { method: 'PUT', body: data });
export const deleteNhanVien = (id)        => api(`/api/nhan-vien/${id}`, { method: 'DELETE' });
export const importNhanVien = (rows)      => api('/api/nhan-vien/import', { method: 'POST', body: { rows } });

// Tham số lương
export const getLuongThamSo    = ()          => api('/api/luong-tham-so');
export const addLuongThamSo    = (data)      => api('/api/luong-tham-so', { method: 'POST', body: data });
export const updateLuongThamSo = (id, data)  => api(`/api/luong-tham-so/${id}`, { method: 'PUT', body: data });
export const deleteLuongThamSo = (id)        => api(`/api/luong-tham-so/${id}`, { method: 'DELETE' });

// Chấm công nhân viên
export const getChamCongNv    = (params={}) => { const q = new URLSearchParams(params).toString(); return api('/api/cham-cong-nv'+(q?'?'+q:'')); };
export const addChamCongNv    = (data)      => api('/api/cham-cong-nv', { method: 'POST', body: data });
export const updateChamCongNv = (id, data)  => api(`/api/cham-cong-nv/${id}`, { method: 'PUT', body: data });
export const deleteChamCongNv = (id)        => api(`/api/cham-cong-nv/${id}`, { method: 'DELETE' });
export const importChamCongNv = (rows)      => api('/api/cham-cong-nv/import', { method: 'POST', body: { rows } });

// Bảng lương
export const getBangLuong  = (params={}) => { const q = new URLSearchParams(params).toString(); return api('/api/bang-luong'+(q?'?'+q:'')); };
export const getBangLuongChiTiet = (params={}) => { const q = new URLSearchParams(params).toString(); return api('/api/bang-luong-chi-tiet'+(q?'?'+q:'')); };
export const chotBangLuong = (data)      => api('/api/bang-luong/chot', { method: 'POST', body: data });

// Danh mục
export const getDanhMuc    = ()          => api('/api/danh-muc');
export const addDanhMuc    = (data)      => api('/api/danh-muc', { method: 'POST', body: data });
export const updateDanhMuc = (id, data)  => api(`/api/danh-muc/${id}`, { method: 'PUT', body: data });
export const deleteDanhMuc = (id)        => api(`/api/danh-muc/${id}`, { method: 'DELETE' });

// Chứng từ
export const getChungTu    = (params={}) => { const q = new URLSearchParams(params).toString(); return api('/api/chung-tu'+(q?'?'+q:'')); };
export const addChungTu    = (data)      => api('/api/chung-tu', { method: 'POST', body: data });
export const updateChungTu = (id, data)  => api(`/api/chung-tu/${id}`, { method: 'PUT', body: data });
export const deleteChungTu = (id)        => api(`/api/chung-tu/${id}`, { method: 'DELETE' });

// Báo cáo
export const getNhapXuatTon = (params={}) => { const q = new URLSearchParams(params).toString(); return api('/api/nhap-xuat-ton'+(q?'?'+q:'')); };
export const getChiTiet     = (ma, params={}) => { const q = new URLSearchParams(params).toString(); return api(`/api/chi-tiet/${encodeURIComponent(ma)}`+(q?'?'+q:'')); };
export const getPhieu       = (soCT)     => api(`/api/phieu/${encodeURIComponent(soCT)}`);
export const getSoChungTu   = ()         => api('/api/so-chung-tu');

// Backup
export const backupDb = () => {
  const ctyId = getCompanyId();
  const now   = new Date().toISOString().slice(0,10);
  const a     = document.createElement('a');
  a.href      = BASE + '/api/backup';
  // Thêm header không được với thẻ a, dùng fetch + blob
  fetch(BASE + '/api/backup', {
    headers: { 'X-Company-Id': ctyId },
  })
  .then(r => r.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `backup_${now}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};

// NCC
export const getNhaCc    = ()          => api('/api/nha-cc');
export const addNhaCc    = (data)      => api('/api/nha-cc', { method: 'POST', body: data });
export const updateNhaCc = (id, data)  => api(`/api/nha-cc/${id}`, { method: 'PUT', body: data });
export const deleteNhaCc = (id)        => api(`/api/nha-cc/${id}`, { method: 'DELETE' });
