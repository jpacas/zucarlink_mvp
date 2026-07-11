import { captureException } from './sentry'

interface AttachmentCleanupFailure {
  path: string | string[]
  bucket: 'forum-media' | 'message-media'
  cause: unknown
}

// Se dispara cuando falla el borrado de compensación de un adjunto (ej. tras un
// insert fallido en DB, o al eliminar un tema/respuesta). El archivo puede quedar
// huérfano en Storage; esto deja rastro para poder auditarlo.
export function logAttachmentCleanupFailure({ path, bucket, cause }: AttachmentCleanupFailure) {
  console.error('[attachment-cleanup] fallo al borrar adjunto de Storage', { path, bucket, cause })
  captureException(cause, { path, bucket, scope: 'attachment-cleanup' })
}
