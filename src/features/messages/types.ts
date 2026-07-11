export type MessageAttachmentType = 'image' | 'video'

export interface MessageAttachment {
  url: string
  type: MessageAttachmentType
  filename: string | null
  sizeBytes: number | null
}

export interface MessageThread {
  threadId: string
  otherProfileId: string
  otherFullName: string
  otherAvatarPath: string | null
  lastMessageBody: string
  lastMessageAt: string | null
  lastMessageAttachmentType: MessageAttachmentType | null
  unreadCount: number
}

export interface Message {
  id: string
  senderId: string
  body: string
  isRead: boolean
  createdAt: string
  attachment: MessageAttachment | null
}
