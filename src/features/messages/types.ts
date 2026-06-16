export interface MessageThread {
  threadId: string
  otherProfileId: string
  otherFullName: string
  otherAvatarPath: string | null
  lastMessageBody: string
  lastMessageAt: string | null
  unreadCount: number
}

export interface Message {
  id: string
  senderId: string
  body: string
  isRead: boolean
  createdAt: string
}
