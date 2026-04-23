import { getSupabaseBrowserClient } from '../../lib/supabase'
import type { AdminDashboardKpis, AdminOperationalDashboard } from './types'

interface AdminDashboardKpisRow {
  new_users?: number
  technician_users?: number
  provider_users?: number
  complete_profiles?: number
  incomplete_profiles?: number
  verified_profiles?: number
  pending_profiles?: number
  forum_topics?: number
  forum_replies?: number
  active_providers?: number
  provider_leads?: number
  published_content?: number
}

interface AdminDashboardRow {
  period_days?: number
  generated_at?: string
  kpis?: AdminDashboardKpisRow
  weekly_signups?: Array<{ week_start: string; user_count: number }>
  account_types?: Array<{ account_type: string; user_count: number }>
  countries?: Array<{ country: string; user_count: number }>
  companies?: Array<{ company_name: string; user_count: number }>
  profile_statuses?: Array<{ profile_status: string; user_count: number }>
  verification_statuses?: Array<{ verification_status: string; user_count: number }>
  recent_users?: Array<{
    id: string
    full_name: string
    account_type: string
    country: string | null
    company_name: string | null
    profile_status: string
    verification_status: string
    created_at: string
  }>
  forum_categories?: Array<{
    category_name: string
    topic_count: number
    reply_count: number
  }>
  recent_forum_topics?: Array<{
    id: string
    title: string
    category_name: string
    author_name: string
    reply_count: number
    last_activity_at: string
  }>
  provider_statuses?: Array<{ status: string; provider_count: number }>
  provider_leads_by_provider?: Array<{ provider_name: string; lead_count: number }>
  recent_provider_leads?: Array<{
    id: string
    provider_name: string
    lead_name: string
    lead_company: string | null
    status: string
    created_at: string
  }>
  content_statuses?: Array<{
    content_group: string
    status: string
    item_count: number
  }>
}

function getClient() {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  return client
}

function numberOrZero(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function mapKpis(row: AdminDashboardKpisRow | undefined): AdminDashboardKpis {
  return {
    newUsers: numberOrZero(row?.new_users),
    technicianUsers: numberOrZero(row?.technician_users),
    providerUsers: numberOrZero(row?.provider_users),
    completeProfiles: numberOrZero(row?.complete_profiles),
    incompleteProfiles: numberOrZero(row?.incomplete_profiles),
    verifiedProfiles: numberOrZero(row?.verified_profiles),
    pendingProfiles: numberOrZero(row?.pending_profiles),
    forumTopics: numberOrZero(row?.forum_topics),
    forumReplies: numberOrZero(row?.forum_replies),
    activeProviders: numberOrZero(row?.active_providers),
    providerLeads: numberOrZero(row?.provider_leads),
    publishedContent: numberOrZero(row?.published_content),
  }
}

function mapDashboard(row: AdminDashboardRow): AdminOperationalDashboard {
  return {
    periodDays: numberOrZero(row.period_days) || 30,
    generatedAt: row.generated_at ?? new Date().toISOString(),
    kpis: mapKpis(row.kpis),
    weeklySignups: (row.weekly_signups ?? []).map((item) => ({
      weekStart: item.week_start,
      userCount: item.user_count,
    })),
    accountTypes: (row.account_types ?? []).map((item) => ({
      accountType: item.account_type,
      userCount: item.user_count,
    })),
    countries: (row.countries ?? []).map((item) => ({
      country: item.country,
      userCount: item.user_count,
    })),
    companies: (row.companies ?? []).map((item) => ({
      companyName: item.company_name,
      userCount: item.user_count,
    })),
    profileStatuses: (row.profile_statuses ?? []).map((item) => ({
      profileStatus: item.profile_status,
      userCount: item.user_count,
    })),
    verificationStatuses: (row.verification_statuses ?? []).map((item) => ({
      verificationStatus: item.verification_status,
      userCount: item.user_count,
    })),
    recentUsers: (row.recent_users ?? []).map((item) => ({
      id: item.id,
      fullName: item.full_name,
      accountType: item.account_type,
      country: item.country ?? '',
      companyName: item.company_name ?? '',
      profileStatus: item.profile_status,
      verificationStatus: item.verification_status,
      createdAt: item.created_at,
    })),
    forumCategories: (row.forum_categories ?? []).map((item) => ({
      categoryName: item.category_name,
      topicCount: item.topic_count,
      replyCount: item.reply_count,
    })),
    recentForumTopics: (row.recent_forum_topics ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      categoryName: item.category_name,
      authorName: item.author_name,
      replyCount: item.reply_count,
      lastActivityAt: item.last_activity_at,
    })),
    providerStatuses: (row.provider_statuses ?? []).map((item) => ({
      status: item.status,
      providerCount: item.provider_count,
    })),
    providerLeadsByProvider: (row.provider_leads_by_provider ?? []).map((item) => ({
      providerName: item.provider_name,
      leadCount: item.lead_count,
    })),
    recentProviderLeads: (row.recent_provider_leads ?? []).map((item) => ({
      id: item.id,
      providerName: item.provider_name,
      leadName: item.lead_name,
      leadCompany: item.lead_company ?? '',
      status: item.status,
      createdAt: item.created_at,
    })),
    contentStatuses: (row.content_statuses ?? []).map((item) => ({
      contentGroup: item.content_group,
      status: item.status,
      itemCount: item.item_count,
    })),
  }
}

export async function getAdminOperationalDashboard(
  periodDays: number,
): Promise<AdminOperationalDashboard> {
  const client = getClient()
  const { data, error } = await client.rpc('get_admin_operational_dashboard', {
    period_days: periodDays,
  })

  if (error) {
    throw new Error(error.message)
  }

  return mapDashboard((data ?? {}) as AdminDashboardRow)
}
