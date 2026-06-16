import { Outlet } from 'react-router-dom'

import { AppHeader } from '../components/AppHeader'
import { SiteFooter } from '../components/SiteFooter'

export function PrivateLayout() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <AppHeader />
      <main id="main-content" className="app-main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
