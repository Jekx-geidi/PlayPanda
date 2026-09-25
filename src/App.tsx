import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MarketingLayout from './layouts/MarketingLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import ScorerPage from './pages/ScorerPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import DashboardPage from './pages/DashboardPage'
import ParticipantRoute from './routes/ParticipantRoute'
import AdminTournamentsPage from './pages/AdminTournamentsPage'
import TournamentWizardPage from './pages/TournamentWizardPage'
import TournamentsPage from './pages/TournamentsPage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import LeaderboardsPage from './pages/LeaderboardsPage'
import PlayerProfilePage from './pages/PlayerProfilePage'
import PlayersPage from './pages/PlayersPage'
import MyProfileRedirect from './pages/MyProfileRedirect'
import ProfileEditPage from './pages/ProfileEditPage'
import ChallengesPage from './pages/ChallengesPage'
import PlayerTimelinePage from './pages/PlayerTimelinePage'
import MatchSharePage from './pages/MatchSharePage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/player/:username" element={<PlayerProfilePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/profile" element={<MyProfileRedirect />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/player/:username/timeline" element={<PlayerTimelinePage />} />
          <Route path="/matches/:id/share" element={<MatchSharePage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/profile" element={<Navigate to="/register" replace />} />
        <Route path="/dashboard" element={<ParticipantRoute><DashboardPage /></ParticipantRoute>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tournaments"
          element={
            <ProtectedRoute role="admin">
              <AdminTournamentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tournaments/:id"
          element={
            <ProtectedRoute role="admin">
              <TournamentWizardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scorer"
          element={
            <ProtectedRoute role="scorer">
              <ScorerPage />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
