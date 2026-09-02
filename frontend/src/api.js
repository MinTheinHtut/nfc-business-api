const configuredUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedConfiguredUrl = configuredUrl?.replace(/\/+$/, '');
const API_URL = normalizedConfiguredUrl
  ? (normalizedConfiguredUrl.endsWith('/api') ? normalizedConfiguredUrl : `${normalizedConfiguredUrl}/api`)
  : (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');
let csrfToken = null;

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const method = (options.method || 'GET').toUpperCase();
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', cache: 'no-store', ...options, headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(!['GET','HEAD','OPTIONS'].includes(method) && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || 'We could not complete that request. Please try again.'); error.status = response.status; error.errors = data.errors; throw error; }
  if (data.csrfToken) csrfToken = data.csrfToken;
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
export const getAdminConfirmations = () => apiRequest('/admin/connections');
export async function downloadSavedConnectionsCsv(search=''){const query=new URLSearchParams();if(search.trim())query.set('search',search.trim());const suffix=query.size?`?${query}`:'';const response=await fetch(`${API_URL}/admin/connections/export.csv${suffix}`,{credentials:'include',cache:'no-store'});if(!response.ok)throw Object.assign(new Error('Export failed'),{status:response.status});return response.blob()}
export const getAdminExhibitors = () => apiRequest('/admin/exhibitors');
export const getAdminExhibitor = (id) => apiRequest(`/admin/exhibitors/${encodeURIComponent(id)}`);
export const getAdminCompanies = () => apiRequest('/admin/companies');
export const getAdminCompany = (id) => apiRequest(`/admin/companies/${encodeURIComponent(id)}`);
export const getAdminNfcTags = () => apiRequest('/admin/nfc-tags');
export const deleteAdminNfcTag = (id) => apiRequest(`/admin/nfc-tags/${encodeURIComponent(id)}`, { method: 'DELETE' });
export function saveAdminExhibitor(exhibitor) { return apiRequest(exhibitor.id ? `/admin/exhibitors/${exhibitor.id}` : '/admin/exhibitors', { method: exhibitor.id ? 'PUT' : 'POST', body: JSON.stringify(exhibitor) }); }
export function saveAdminCompany(company, id) { return apiRequest(id ? `/admin/companies/${encodeURIComponent(id)}` : '/admin/companies', { method: id ? 'PUT' : 'POST', body: JSON.stringify(company) }); }
export const deactivateAdminCompany = (id) => apiRequest(`/admin/companies/${encodeURIComponent(id)}`, { method: 'DELETE' });
export function saveAdminNfcTag(tag) { return apiRequest(tag.id ? `/admin/nfc-tags/${encodeURIComponent(tag.id)}` : '/admin/nfc-tags', { method: tag.id ? 'PUT' : 'POST', body: JSON.stringify(tag) }); }
function companyImportRequest(action, file) { const body = new FormData(); body.append('file', file); return apiRequest(`/admin/companies/import/${action}`, { method: 'POST', body }); }
export const previewCompanyImport = (file) => companyImportRequest('preview', file);
export const commitCompanyImport = (file) => companyImportRequest('commit', file);
export const identifyVisitor = (visitorCode) => apiRequest('/public/visitors/identify', { method:'POST', body:JSON.stringify({ visitorCode }) });
export const connectVisitorCompany = (token, visitorCode) => apiRequest(`/public/companies/${encodeURIComponent(token)}/connect`, { method:'POST', body:JSON.stringify({ visitorCode }) });
export const getAdminVisitors = () => apiRequest('/admin/visitors');
export const getAdminVisitor = (id) => apiRequest(`/admin/visitors/${encodeURIComponent(id)}`);
export function saveAdminVisitor(visitor){return apiRequest(visitor.id?`/admin/visitors/${encodeURIComponent(visitor.id)}`:'/admin/visitors',{method:visitor.id?'PUT':'POST',body:JSON.stringify(visitor)})}
export const deactivateAdminVisitor = (id) => apiRequest(`/admin/visitors/${encodeURIComponent(id)}`,{method:'DELETE'});
function visitorImportRequest(action,file){const body=new FormData();body.append('file',file);return apiRequest(`/admin/visitors/import/${action}`,{method:'POST',body})}
export const previewVisitorImport=(file)=>visitorImportRequest('preview',file);export const commitVisitorImport=(file)=>visitorImportRequest('commit',file);
export const getAdminVisitorConnections = (filters={}) => apiRequest(`/admin/visitor-connections?${new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==''&&value!=null))}`);
export const updateAdminVisitorConnection = (id, values) => apiRequest(`/admin/visitor-connections/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(values)});
export async function downloadConnectionsCsv(filters={}){const query=new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==''&&value!=null));const response=await fetch(`${API_URL}/admin/visitor-connections/export.csv?${query}`,{credentials:'include',cache:'no-store'});if(!response.ok)throw Object.assign(new Error('Export failed'),{status:response.status});return response.blob()}
