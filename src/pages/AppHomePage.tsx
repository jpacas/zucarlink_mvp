import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { CompletenessNudge } from '../features/dashboard/CompletenessNudge'
import { ForumActivityWidget } from '../features/dashboard/ForumActivityWidget'
import { ProviderStatusNudge } from '../features/dashboard/ProviderStatusNudge'
import { RecentMembersWidget } from '../features/dashboard/RecentMembersWidget'
import { RecentMessagesWidget } from '../features/dashboard/RecentMessagesWidget'
import { useDashboardData } from '../features/dashboard/useDashboardData'
import { getProfileCompleteness } from '../features/profile/profile-status'
import { useCurrentProfile } from '../features/profile/useCurrentProfile'
import { isProviderDraftComplete } from '../features/providers/api'
import { useCurrentProviderProfile } from '../features/providers/useCurrentProviderProfile'

export function AppHomePage() {
  const { user } = useAuth()
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Miembro'
  const firstName = fullName.split(' ')[0]
  const accountType = user?.user_metadata?.account_type as string | undefined
  const isProvider = accountType === 'provider'

  const { profile } = useCurrentProfile(isProvider ? null : user)
  const { provider } = useCurrentProviderProfile(isProvider ? user : null)
  const { data, isLoading } = useDashboardData(user, isProvider)

  const completeness =
    !isProvider && profile
      ? getProfileCompleteness(
          {
            country: profile.country,
            roleTitle: profile.roleTitle,
            companyName: profile.companyName,
            yearsExperience: profile.yearsExperience,
            shortBio: profile.shortBio,
          },
          profile.specialties,
        )
      : null

  const showCompletenessNudge = completeness ? completeness.percent < 100 : false
  const showProviderNudge = isProvider && provider ? !isProviderDraftComplete(provider) : false

  return (
    <div className="stack">
      <section className="stack stack--compact dashboard-greeting">
        <p className="eyebrow">Tu panel</p>
        <h2>Hola, {firstName}</h2>
        <p className="helper-text">
          {isProvider
            ? 'Responde a las conversaciones abiertas y mantén tu ficha comercial lista para nuevas oportunidades.'
            : 'Esto es lo que se movió en la red mientras no estabas.'}
        </p>
      </section>

      {showCompletenessNudge && completeness ? (
        <CompletenessNudge percent={completeness.percent} />
      ) : null}
      {showProviderNudge ? <ProviderStatusNudge /> : null}

      <section className="dashboard-activity-grid">
        <RecentMessagesWidget threads={data.threads} isLoading={isLoading} />

        {isProvider ? (
          <article className="content-card stack dashboard-widget">
            <p className="eyebrow">Presencia comercial</p>
            <h3>Tu ficha en el directorio</h3>
            <p>
              Revisa cómo se ve tu marca ante un potencial cliente y mantén listo el canal de
              contacto interno.
            </p>
            <div className="dashboard-widget__footer actions">
              <Link className="inline-link" to="/app/provider">
                Ver mi ficha →
              </Link>
              <Link className="inline-link" to="/proveedores/directorio">
                Abrir directorio de proveedores →
              </Link>
            </div>
          </article>
        ) : (
          <>
            <ForumActivityWidget
              threads={data.forumThreads}
              activity={data.forumActivity}
              isLoading={isLoading}
            />
            <RecentMembersWidget members={data.members} isLoading={isLoading} />
          </>
        )}
      </section>
    </div>
  )
}
