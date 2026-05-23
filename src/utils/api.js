const BASE = process.env.REACT_APP_API_URL || '';

function getCompanyId() {
  try {
    const u = JSON.parse(localStorage.getItem('sk_user'));
    return u?.cong_ty?.id || null;
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
