import { renderFooterWithUnsubscribe } from '../../_shared/email-footer.ts'

export interface UnreadReminderConversation {
  senderName: string
  preview: string
  unreadCount: number
}

export interface UnreadReminderData {
  recipientName: string
  conversations: UnreadReminderConversation[]
  unsubscribeUrl: string
}

export function renderUnreadReminderEmail(data: UnreadReminderData): string {
  const { conversations, unsubscribeUrl } = data

  const items = conversations
    .map(
      (c) => `
    <p style="margin:0 0 16px;color:#201747;font-size:15px;line-height:1.6;padding:16px 20px;background-color:#f4f4f6;border-left:3px solid #FF724B;border-radius:0 8px 8px 0;">
      <strong>${escapeHtml(c.senderName)}</strong>${c.unreadCount > 1 ? ` (${c.unreadCount} mensajes)` : ''}: <em>"${escapeHtml(truncate(c.preview, 160))}"</em>
    </p>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background-color:#201747;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Zucarlink</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:40px;">
            <h1 style="margin:0 0 8px;color:#201747;font-size:22px;font-weight:700;">Tienes mensajes sin leer</h1>
            <p style="margin:0 0 24px;color:#5a5a72;font-size:15px;">Llevan más de 24 horas esperando tu respuesta en Zucarlink.</p>

            ${items}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://zucarlink.com/app/messages" style="display:inline-block;background-color:#0029E2;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;margin-top:8px;">Ver mensajes</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        ${renderFooterWithUnsubscribe(
          'Recibes este correo porque tienes mensajes sin leer en <a href="https://zucarlink.com" style="color:#0029E2;text-decoration:none;">zucarlink.com</a>',
          unsubscribeUrl,
        )}

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max).trimEnd() + '…' : str
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
