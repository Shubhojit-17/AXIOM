import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Marketplace from './pages/Marketplace';
import ApiDetails from './pages/ApiDetails';
import Playground from './pages/Playground';
import Transactions from './pages/Transactions';
import DeveloperDashboard from './pages/DeveloperDashboard';
import RegisterApi from './pages/RegisterApi';
import ManageApis from './pages/ManageApis';
import ProfilePage from './pages/ProfilePage';
import JudgePage from './pages/JudgePage';

export default function App() {
  return (
    <Routes>
      {/* Public routes without sidebar */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected routes with sidebar layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ApiDetails />} />
        <Route path="/playground/:id" element={<Playground />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
        <Route path="/developer/register" element={<RegisterApi />} />
        <Route path="/developer/manage" element={<ManageApis />} />
        <Route path="/developer/profile" element={<ProfilePage />} />
        <Route path="/judge" element={<JudgePage />} />
      </Route>
    </Routes>
  );
}
