import { Suspense, lazy, type ComponentType } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'

const AppHomePage = lazyNamed(() => import('../pages/AppHomePage'), 'AppHomePage')
const AdminDashboardPage = lazyNamed(
  () => import('../pages/AdminDashboardPage'),
  'AdminDashboardPage',
)
const AdminProvidersPage = lazyNamed(() => import('../pages/AdminProvidersPage'), 'AdminProvidersPage')
const AppProviderEditPage = lazyNamed(() => import('../pages/AppProviderEditPage'), 'AppProviderEditPage')
const AppProviderPage = lazyNamed(() => import('../pages/AppProviderPage'), 'AppProviderPage')
const AppDirectoryPage = lazyNamed(() => import('../pages/AppDirectoryPage'), 'AppDirectoryPage')
const BlogListPage = lazyNamed(() => import('../pages/BlogListPage'), 'BlogListPage')
const ContentDetailPage = lazyNamed(() => import('../pages/ContentDetailPage'), 'ContentDetailPage')
const DirectoryPage = lazyNamed(() => import('../pages/DirectoryPage'), 'DirectoryPage')
const DirectoryProfileDetailPage = lazyNamed(
  () => import('../pages/DirectoryProfileDetailPage'),
  'DirectoryProfileDetailPage',
)
const EventsPage = lazyNamed(() => import('../pages/EventsPage'), 'EventsPage')
const ForumPage = lazyNamed(() => import('../pages/ForumPage'), 'ForumPage')
const ForumNewThreadPage = lazyNamed(() => import('../pages/ForumNewThreadPage'), 'ForumNewThreadPage')
const ForumThreadPage = lazyNamed(() => import('../pages/ForumThreadPage'), 'ForumThreadPage')
const HomePage = lazyNamed(() => import('../pages/HomePage'), 'HomePage')
const InformationHubPage = lazyNamed(() => import('../pages/InformationHubPage'), 'InformationHubPage')
const LoginPage = lazyNamed(() => import('../pages/LoginPage'), 'LoginPage')
const MessagesPage = lazyNamed(() => import('../pages/MessagesPage'), 'MessagesPage')
const NewsListPage = lazyNamed(() => import('../pages/NewsListPage'), 'NewsListPage')
const OnboardingPage = lazyNamed(() => import('../pages/OnboardingPage'), 'OnboardingPage')
const ProfilePage = lazyNamed(() => import('../pages/ProfilePage'), 'ProfilePage')
const PublicProfilePage = lazyNamed(() => import('../pages/PublicProfilePage'), 'PublicProfilePage')
const PricesPage = lazyNamed(() => import('../pages/PricesPage'), 'PricesPage')
const ProviderDetailPage = lazyNamed(() => import('../pages/ProviderDetailPage'), 'ProviderDetailPage')
const ProfileEditPage = lazyNamed(() => import('../pages/ProfileEditPage'), 'ProfileEditPage')
const ProvidersDirectoryPage = lazyNamed(
  () => import('../pages/ProvidersDirectoryPage'),
  'ProvidersDirectoryPage',
)
const ProvidersLandingPage = lazyNamed(
  () => import('../pages/ProvidersLandingPage'),
  'ProvidersLandingPage',
)
const RegisterPage = lazyNamed(() => import('../pages/RegisterPage'), 'RegisterPage')
const SettingsPage = lazyNamed(() => import('../pages/SettingsPage'), 'SettingsPage')

export function AppRouter() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
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
          <Route path="providers" element={<Navigate to="/proveedores" replace />} />
          <Route
            path="providers/directory"
            element={<Navigate to="/proveedores/directorio" replace />}
          />
          <Route path="providers/:slug" element={<LegacyProviderRedirect />} />
          <Route path="proveedores" element={<ProvidersLandingPage />} />
          <Route path="proveedores/directorio" element={<ProvidersDirectoryPage />} />
          <Route path="proveedores/:slug" element={<ProviderDetailPage />} />
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
            <Route path="provider" element={<AppProviderPage />} />
            <Route path="provider/edit" element={<AppProviderEditPage />} />
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="providers-admin" element={<AdminProvidersPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function LegacyProviderRedirect() {
  const { slug = '' } = useParams()

  return <Navigate to={`/proveedores/${slug}`} replace />
}

function RouteLoadingState() {
  return (
    <section className="content-card stack content-card--status" aria-live="polite">
      <p className="eyebrow">Zucarlink</p>
      <h2>Cargando página</h2>
      <p className="helper-text">Estamos preparando el siguiente módulo.</p>
    </section>
  )
}

function lazyNamed<TModule extends Record<string, unknown>, TKey extends keyof TModule & string>(
  load: () => Promise<TModule>,
  exportName: TKey,
) {
  return lazy(async () => {
    const module = await load()

    return {
      default: module[exportName] as ComponentType,
    }
  })
}
