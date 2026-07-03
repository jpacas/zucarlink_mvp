import { renderFooterWithUnsubscribe } from '../../_shared/email-footer.ts'

export interface ForumReplyNotificationData {
  replierName: string
  topicTitle: string
  replyPreview: string
  threadUrl: string
  unsubscribeUrl: string
}

export function renderForumReplyNotificationEmail(data: ForumReplyNotificationData): string {
  const { replierName, topicTitle, replyPreview, threadUrl, unsubscribeUrl } = data
  const preview = replyPreview.length > 200
    ? replyPreview.slice(0, 200).trimEnd() + '…'
    : replyPreview

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
            <h1 style="margin:0 0 8px;color:#201747;font-size:22px;font-weight:700;">Nueva respuesta en tu tema</h1>
            <p style="margin:0 0 24px;color:#5a5a72;font-size:15px;"><strong style="color:#201747;">${escapeHtml(replierName)}</strong> respondió en <strong style="color:#201747;">${escapeHtml(topicTitle)}</strong>.</p>

            <!-- Reply preview -->
            <p style="margin:0 0 32px;color:#201747;font-size:15px;line-height:1.6;padding:20px 24px;background-color:#f4f4f6;border-left:3px solid #0DDB89;border-radius:0 8px 8px 0;font-style:italic;">"${escapeHtml(preview)}"</p>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${escapeHtml(threadUrl)}" style="display:inline-block;background-color:#0029E2;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;">Ver la conversación</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        ${renderFooterWithUnsubscribe(
          'Recibes este correo porque abriste un tema en el foro de <a href="https://zucarlink.com" style="color:#0029E2;text-decoration:none;">zucarlink.com</a>',
          unsubscribeUrl,
        )}

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
