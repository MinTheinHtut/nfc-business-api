import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminCompaniesPage from './pages/AdminCompaniesPage.jsx';
import CompanyFormPage from './pages/CompanyFormPage.jsx';
import AdminNfcTagsPage from './pages/AdminNfcTagsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PublicCompanyPage from './pages/PublicCompanyPage.jsx';
import AdminExhibitorsPage from './pages/AdminExhibitorsPage.jsx';
import AdminConfirmationsPage from './pages/AdminConfirmationsPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/company/:token" element={<PublicCompanyPage />} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><DashboardPage admin /></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute adminOnly><AdminCompaniesPage /></ProtectedRoute>} />
      <Route path="/admin/companies/new" element={<ProtectedRoute adminOnly><CompanyFormPage /></ProtectedRoute>} />
      <Route path="/admin/companies/:id/edit" element={<ProtectedRoute adminOnly><CompanyFormPage /></ProtectedRoute>} />
      <Route path="/admin/visitors" element={<ProtectedRoute adminOnly><AdminCompaniesPage /></ProtectedRoute>} />
      <Route path="/admin/visitors/new" element={<ProtectedRoute adminOnly><CompanyFormPage /></ProtectedRoute>} />
      <Route path="/admin/visitors/:id/edit" element={<ProtectedRoute adminOnly><CompanyFormPage /></ProtectedRoute>} />
      <Route path="/admin/exhibitors" element={<ProtectedRoute adminOnly><AdminExhibitorsPage /></ProtectedRoute>} />
      <Route path="/admin/confirmations" element={<ProtectedRoute adminOnly><AdminConfirmationsPage /></ProtectedRoute>} />
      <Route path="/admin/nfc-tags" element={<ProtectedRoute adminOnly><AdminNfcTagsPage /></ProtectedRoute>} />
      <Route path="/admin/nfc" element={<ProtectedRoute adminOnly><AdminNfcTagsPage /></ProtectedRoute>} />
      <Route path="/saved" element={<ProtectedRoute exhibitorOnly><DashboardPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<main className="auth-shell"><section className="auth-card"><h1>Page not found</h1><p>This page will be available in a later phase.</p></section></main>} />
    </Routes>
  );
}

export default App;
