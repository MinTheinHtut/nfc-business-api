const configuredUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedConfiguredUrl = configuredUrl?.replace(/\/+$/, '');
const API_URL = normalizedConfiguredUrl
  ? (normalizedConfiguredUrl.endsWith('/api') ? normalizedConfiguredUrl : `${normalizedConfiguredUrl}/api`)
  : (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', cache: 'no-store', ...options, headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || 'We could not complete that request. Please try again.'); error.status = response.status; error.errors = data.errors; throw error; }
  return data;
}
export const getPublicCompany = (token) => apiRequest(`/public/companies/${encodeURIComponent(token)}`);
export const getCurrentUser = () => apiRequest('/auth/me');
export const loginUser = (username, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const logoutUser = () => apiRequest('/auth/logout', { method: 'POST' });
export const confirmCompany = (token) => apiRequest(`/public/companies/${encodeURIComponent(token)}/confirm`, { method: 'POST' });
export const getConfirmedContacts = () => apiRequest('/contacts');
export const getContact = (id) => apiRequest(`/contacts/${encodeURIComponent(id)}`);
export const getAdminDashboard = () => apiRequest('/admin/dashboard');
export const getAdminConfirmations = () => apiRequest('/admin/confirmations');
export const getAdminExhibitors = () => apiRequest('/admin/exhibitors');
export const getAdminCompanies = () => apiRequest('/admin/companies');
export const getAdminCompany = (id) => apiRequest(`/admin/companies/${encodeURIComponent(id)}`);
export const getAdminNfcTags = () => apiRequest('/admin/nfc-tags');
export function saveAdminExhibitor(exhibitor) { return apiRequest(exhibitor.id ? `/admin/exhibitors/${exhibitor.id}` : '/admin/exhibitors', { method: exhibitor.id ? 'PUT' : 'POST', body: JSON.stringify(exhibitor) }); }
export function saveAdminCompany(company, id) { return apiRequest(id ? `/admin/companies/${encodeURIComponent(id)}` : '/admin/companies', { method: id ? 'PUT' : 'POST', body: JSON.stringify(company) }); }
export const deactivateAdminCompany = (id) => apiRequest(`/admin/companies/${encodeURIComponent(id)}`, { method: 'DELETE' });
export function saveAdminNfcTag(tag) { return apiRequest(tag.id ? `/admin/nfc-tags/${encodeURIComponent(tag.id)}` : '/admin/nfc-tags', { method: tag.id ? 'PUT' : 'POST', body: JSON.stringify(tag) }); }
function companyImportRequest(action, file) { const body = new FormData(); body.append('file', file); return apiRequest(`/admin/companies/import/${action}`, { method: 'POST', body }); }
export const previewCompanyImport = (file) => companyImportRequest('preview', file);
export const commitCompanyImport = (file) => companyImportRequest('commit', file);
