import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AppHomePage } from '../pages/AppHomePage'
import { AppDirectoryPage } from '../pages/AppDirectoryPage'
import { DirectoryPage } from '../pages/DirectoryPage'
import { DirectoryProfileDetailPage } from '../pages/DirectoryProfileDetailPage'
import { ForumPage } from '../pages/ForumPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { MessagesPage } from '../pages/MessagesPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProfileEditPage } from '../pages/ProfileEditPage'
import { ProvidersPage } from '../pages/ProvidersPage'
import { RegisterPage } from '../pages/RegisterPage'
import { SettingsPage } from '../pages/SettingsPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="directory" element={<DirectoryPage />} />
        <Route path="forum" element={<ForumPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="app" element={<PrivateLayout />}>
          <Route index element={<AppHomePage />} />
          <Route path="directory" element={<AppDirectoryPage />} />
          <Route path="directory/:profileId" element={<DirectoryProfileDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<ProfileEditPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
