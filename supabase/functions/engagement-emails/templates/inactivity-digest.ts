import { renderFooterWithUnsubscribe } from '../../_shared/email-footer.ts'

export interface DigestContent {
  unread_messages: number
  my_topics_activity: { title: string; slug: string; new_replies: number }[]
  liked_topics_activity: { title: string; slug: string; new_replies: number }[]
  popular_new_topics: { title: string; slug: string; reply_count: number; likes: number }[]
}

export interface InactivityDigestData {
  fullName: string
  accountType: 'technician' | 'provider'
  digest: DigestContent
  unsubscribeUrl: string
}

export function renderInactivityDigestEmail(data: InactivityDigestData): string {
  const { fullName, accountType, digest, unsubscribeUrl } = data
  const firstName = fullName.split(' ')[0] ?? fullName
  const ctaUrl = accountType === 'provider'
    ? 'https://zucarlink.com/app/provider/leads'
    : 'https://zucarlink.com/forum'

  const sections: string[] = []

  if (digest.unread_messages > 0) {
    sections.push(
      section(
        'Mensajes sin leer',
        `Tienes ${digest.unread_messages} mensaje${digest.unread_messages === 1 ? '' : 's'} esperando respuesta.`,
      ),
    )
  }

  if (digest.my_topics_activity.length > 0) {
    sections.push(
      listSection(
        'Nuevas respuestas en tus temas',
        digest.my_topics_activity.map((t) => ({
          text: `${escapeHtml(t.title)} (${t.new_replies} respuesta${t.new_replies === 1 ? '' : 's'} nueva${t.new_replies === 1 ? '' : 's'})`,
          url: `https://zucarlink.com/forum/thread/${t.slug}`,
        })),
      ),
    )
  }

  if (digest.liked_topics_activity.length > 0) {
    sections.push(
      listSection(
        'Nuevas respuestas en temas que te gustaron',
        digest.liked_topics_activity.map((t) => ({
          text: `${escapeHtml(t.title)} (${t.new_replies} respuesta${t.new_replies === 1 ? '' : 's'} nueva${t.new_replies === 1 ? '' : 's'})`,
          url: `https://zucarlink.com/forum/thread/${t.slug}`,
        })),
      ),
    )
  }

  if (digest.popular_new_topics.length > 0) {
    sections.push(
      listSection(
        'Temas populares que te perdiste',
        digest.popular_new_topics.map((t) => ({
          text: `${escapeHtml(t.title)} (${t.reply_count} respuestas, ${t.likes} me gusta)`,
          url: `https://zucarlink.com/forum/thread/${t.slug}`,
        })),
      ),
    )
  }

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
            <h1 style="margin:0 0 8px;color:#201747;font-size:22px;font-weight:700;">Hola ${escapeHtml(firstName)}, esto pasó mientras no estabas</h1>
            <p style="margin:0 0 24px;color:#5a5a72;font-size:15px;">Un resumen de la actividad de Zucarlink relacionada contigo.</p>

            ${sections.join('')}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${ctaUrl}" style="display:inline-block;background-color:#0029E2;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;margin-top:8px;">Volver a Zucarlink</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        ${renderFooterWithUnsubscribe(
          'Recibes este correo porque llevas un tiempo sin entrar a <a href="https://zucarlink.com" style="color:#0029E2;text-decoration:none;">zucarlink.com</a>',
          unsubscribeUrl,
        )}

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function section(title: string, text: string): string {
  return `<div style="margin:0 0 24px;">
    <h2 style="margin:0 0 8px;color:#201747;font-size:17px;font-weight:700;">${escapeHtml(title)}</h2>
    <p style="margin:0;color:#5a5a72;font-size:15px;">${text}</p>
  </div>`
}

function listSection(title: string, items: { text: string; url: string }[]): string {
  const rows = items
    .map(
      (item) => `
    <li style="margin:0 0 8px;">
      <a href="${item.url}" style="color:#0029E2;text-decoration:none;font-size:15px;">${item.text}</a>
    </li>`,
    )
    .join('')

  return `<div style="margin:0 0 24px;">
    <h2 style="margin:0 0 12px;color:#201747;font-size:17px;font-weight:700;">${escapeHtml(title)}</h2>
    <ul style="margin:0;padding-left:20px;">${rows}</ul>
  </div>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
