const BASE = process.env.REACT_APP_API_URL || '';

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi server');
  }
  return res.json();
}

export const getCongTy = () => api('/api/cong-ty');
export const updateCongTy = (data) => api('/api/cong-ty', { method: 'PUT', body: data });

export const getDanhMuc = () => api('/api/danh-muc');
export const addDanhMuc = (data) => api('/api/danh-muc', { method: 'POST', body: data });
export const updateDanhMuc = (id, data) => api(`/api/danh-muc/${id}`, { method: 'PUT', body: data });
export const deleteDanhMuc = (id) => api(`/api/danh-muc/${id}`, { method: 'DELETE' });

export const getChungTu = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api('/api/chung-tu' + (q ? '?' + q : ''));
};
export const addChungTu = (data) => api('/api/chung-tu', { method: 'POST', body: data });
export const updateChungTu = (id, data) => api(`/api/chung-tu/${id}`, { method: 'PUT', body: data });
export const deleteChungTu = (id) => api(`/api/chung-tu/${id}`, { method: 'DELETE' });

export const getNhapXuatTon = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api('/api/nhap-xuat-ton' + (q ? '?' + q : ''));
};

export const getChiTiet = (maVatTu, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api(`/api/chi-tiet/${encodeURIComponent(maVatTu)}` + (q ? '?' + q : ''));
};

export const getPhieu = (soChungTu) => api(`/api/phieu/${encodeURIComponent(soChungTu)}`);
export const getSoChungTu = () => api('/api/so-chung-tu');
