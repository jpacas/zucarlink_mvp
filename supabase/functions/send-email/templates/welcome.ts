export interface WelcomeEmailData {
  fullName: string
  accountType: 'technician' | 'provider'
}

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  const { fullName, accountType } = data
  const firstName = fullName.split(' ')[0]

  const isTechnician = accountType === 'technician'
  const ctaUrl = isTechnician
    ? 'https://zucarlink.com/app/directory'
    : 'https://zucarlink.com/app/provider'
  const ctaText = isTechnician ? 'Explorar el directorio' : 'Ver mi perfil de proveedor'

  const bullets = isTechnician
    ? [
        'Conecta con técnicos especializados de toda Latinoamérica',
        'Participa en el foro técnico de la industria azucarera',
        'Accede al directorio privado de profesionales',
        'Envía mensajes directos a otros técnicos',
      ]
    : [
        'Tu ficha ya está visible para técnicos del sector',
        'Recibirás leads de contacto directamente en tu correo',
        'Edita tu perfil y mantén tu información actualizada',
      ]

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background-color:#201747;border-radius:8px 8px 0 0;padding:40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Zucarlink</span>
            <p style="margin:16px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">La red de la industria azucarera</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:40px;">
            <h1 style="margin:0 0 8px;color:#201747;font-size:24px;font-weight:700;">¡Bienvenido/a, ${escapeHtml(firstName)}!</h1>
            <p style="margin:0 0 24px;color:#5a5a72;font-size:15px;line-height:1.6;">Tu perfil en Zucarlink está listo. Ahora formas parte de la red profesional de la industria azucarera.</p>

            <!-- Feature bullets -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              ${bullets.map(bullet => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:24px;vertical-align:top;padding-top:2px;">
                        <span style="display:inline-block;width:8px;height:8px;background-color:#0DDB89;border-radius:50%;margin-top:4px;"></span>
                      </td>
                      <td style="color:#201747;font-size:15px;line-height:1.5;">${escapeHtml(bullet)}</td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${ctaUrl}" style="display:inline-block;background-color:#0029E2;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;">${ctaText}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f4f4f6;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9090a8;font-size:13px;">Recibes este correo porque creaste una cuenta en <a href="https://zucarlink.com" style="color:#0029E2;text-decoration:none;">zucarlink.com</a></p>
          </td>
        </tr>

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
