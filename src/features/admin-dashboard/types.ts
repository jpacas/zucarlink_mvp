export interface AdminDashboardKpis {
  newUsers: number
  technicianUsers: number
  providerUsers: number
  completeProfiles: number
  incompleteProfiles: number
  verifiedProfiles: number
  pendingProfiles: number
  forumTopics: number
  forumReplies: number
  activeProviders: number
  providerLeads: number
  publishedContent: number
}

export interface CountByWeek {
  weekStart: string
  userCount: number
}

export interface CountByAccountType {
  accountType: string
  userCount: number
}

export interface CountByCountry {
  country: string
  userCount: number
}

export interface CountByCompany {
  companyName: string
  userCount: number
}

export interface CountByProfileStatus {
  profileStatus: string
  userCount: number
}

export interface CountByVerificationStatus {
  verificationStatus: string
  userCount: number
}

export interface RecentUser {
  id: string
  fullName: string
  accountType: string
  country: string
  companyName: string
  profileStatus: string
  verificationStatus: string
  createdAt: string
}

export interface ForumCategoryMetric {
  categoryName: string
  topicCount: number
  replyCount: number
}

export interface RecentForumTopic {
  id: string
  title: string
  categoryName: string
  authorName: string
  replyCount: number
  lastActivityAt: string
}

export interface ProviderStatusMetric {
  status: string
  providerCount: number
}

export interface ProviderLeadMetric {
  providerName: string
  leadCount: number
}

export interface RecentProviderLead {
  id: string
  providerName: string
  leadName: string
  leadCompany: string
  status: string
  createdAt: string
}

export interface ContentStatusMetric {
  contentGroup: string
  status: string
  itemCount: number
}

export interface AdminOperationalDashboard {
  periodDays: number
  generatedAt: string
  kpis: AdminDashboardKpis
  weeklySignups: CountByWeek[]
  accountTypes: CountByAccountType[]
  countries: CountByCountry[]
  companies: CountByCompany[]
  profileStatuses: CountByProfileStatus[]
  verificationStatuses: CountByVerificationStatus[]
  recentUsers: RecentUser[]
  forumCategories: ForumCategoryMetric[]
  recentForumTopics: RecentForumTopic[]
  providerStatuses: ProviderStatusMetric[]
  providerLeadsByProvider: ProviderLeadMetric[]
  recentProviderLeads: RecentProviderLead[]
  contentStatuses: ContentStatusMetric[]
}
