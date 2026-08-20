import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MemberListPage from './pages/members/MemberListPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import MemberFormPage from './pages/members/MemberFormPage';
import OrgManagePage from './pages/organizations/OrgManagePage';
import MemberStatsPage from './pages/statistics/MemberStatsPage';
import CommitteeStatsPage from './pages/statistics/CommitteeStatsPage';
import ActivityStatsPage from './pages/statistics/ActivityStatsPage';
import MemberEvaluationPage from './pages/evaluations/MemberEvaluationPage';
import BadgeEvaluationPage from './pages/badges/BadgeEvaluationPage';
import UserManagePage from './pages/users/UserManagePage';
import NotificationPage from './pages/notifications/NotificationPage';
import DecisionManagePage from './pages/decisions/DecisionManagePage';


function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#232a3b',
            color: '#e8e8e8',
            border: '1px solid #2f3a52',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#3a8f5c',
              secondary: '#e8e8e8',
            },
          },
          error: {
            iconTheme: {
              primary: '#c44545',
              secondary: '#e8e8e8',
            },
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="members" element={<MemberListPage />} />
          <Route path="members/new" element={<MemberFormPage />} />
          <Route path="members/:id" element={<MemberDetailPage />} />
          <Route path="members/:id/edit" element={<MemberFormPage />} />
          <Route path="organizations" element={<OrgManagePage />} />
          <Route path="statistics/members" element={<MemberStatsPage />} />
          <Route path="statistics/committee" element={<CommitteeStatsPage />} />
          <Route path="statistics/activity" element={<ActivityStatsPage />} />
          <Route path="evaluations" element={<MemberEvaluationPage />} />
          <Route path="badges" element={<BadgeEvaluationPage />} />
          <Route path="decisions" element={<DecisionManagePage />} />
          <Route path="users" element={<UserManagePage />} />
          <Route path="notifications" element={<NotificationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
