import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AppHomePage } from '../pages/AppHomePage'
import { AppDirectoryPage } from '../pages/AppDirectoryPage'
import { BlogListPage } from '../pages/BlogListPage'
import { ContentDetailPage } from '../pages/ContentDetailPage'
import { DirectoryPage } from '../pages/DirectoryPage'
import { DirectoryProfileDetailPage } from '../pages/DirectoryProfileDetailPage'
import { EventsPage } from '../pages/EventsPage'
import { ForumPage } from '../pages/ForumPage'
import { ForumNewThreadPage } from '../pages/ForumNewThreadPage'
import { ForumThreadPage } from '../pages/ForumThreadPage'
import { HomePage } from '../pages/HomePage'
import { InformationHubPage } from '../pages/InformationHubPage'
import { LoginPage } from '../pages/LoginPage'
import { MessagesPage } from '../pages/MessagesPage'
import { NewsListPage } from '../pages/NewsListPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProfilePage } from '../pages/ProfilePage'
import { PublicProfilePage } from '../pages/PublicProfilePage'
import { PricesPage } from '../pages/PricesPage'
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
        <Route path="directory/:profileId" element={<PublicProfilePage />} />
        <Route path="forum" element={<ForumPage />} />
        <Route path="informacion" element={<InformationHubPage />} />
        <Route path="informacion/noticias" element={<NewsListPage />} />
        <Route path="informacion/blog" element={<BlogListPage />} />
        <Route path="informacion/eventos" element={<EventsPage />} />
        <Route path="informacion/precios" element={<PricesPage />} />
        <Route path="informacion/:slug" element={<ContentDetailPage />} />
        <Route path="forum/category/:categorySlug" element={<ForumPage />} />
        <Route path="forum/thread/:threadSlug" element={<ForumThreadPage />} />
        <Route path="forum/new" element={<ForumNewThreadPage />} />
        <Route path="foro" element={<Navigate to="/forum" replace />} />
        <Route path="foro/nuevo" element={<ForumNewThreadPage />} />
        <Route path="foro/tema/:threadSlug" element={<ForumThreadPage />} />
        <Route path="foro/:categorySlug" element={<ForumPage />} />
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
