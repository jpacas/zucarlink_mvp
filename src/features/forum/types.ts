export interface ForumCategory {
  id: string
  slug: string
  name: string
  description: string
}

export interface ForumAuthor {
  id: string
  fullName: string
  roleTitle: string
  companyName: string
  avatarUrl: string | null
}

export interface ForumThreadCard {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  category: Pick<ForumCategory, 'slug' | 'name'>
  author: ForumAuthor
  replyCount: number
  likeCount: number
  viewerLiked: boolean
  createdAt: string
  lastActivityAt: string
}

export interface ForumReply {
  id: string
  body: string
  createdAt: string
  parentReplyId: string | null
  parentAuthorName: string | null
  author: ForumAuthor
}

export interface ForumThreadDetail extends ForumThreadCard {
  replies: ForumReply[]
}

export interface ForumTopicLikeState {
  likeCount: number
  viewerLiked: boolean
}

export interface ForumContribution {
  id: string
  type: 'thread' | 'reply'
  title: string
  slug: string
  createdAt: string
}
