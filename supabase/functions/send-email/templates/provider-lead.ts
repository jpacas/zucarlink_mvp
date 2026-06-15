export interface ProviderLeadData {
  providerCompanyName: string
  leadName: string
  leadEmail: string
  leadCompany: string | null
  message: string
  createdAt: string
}

export function renderProviderLeadEmail(data: ProviderLeadData): string {
  const { providerCompanyName, leadName, leadEmail, leadCompany, message, createdAt } = data
  const date = new Date(createdAt).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

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
            <h1 style="margin:0 0 8px;color:#201747;font-size:22px;font-weight:700;">Nueva solicitud de contacto</h1>
            <p style="margin:0 0 24px;color:#5a5a72;font-size:15px;">Has recibido un nuevo lead a través de tu ficha en Zucarlink.</p>

            <!-- Lead card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f6;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;color:#201747;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Datos del contacto</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#5a5a72;font-size:14px;width:120px;">Nombre</td>
                      <td style="padding:6px 0;color:#201747;font-size:14px;font-weight:600;">${escapeHtml(leadName)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#5a5a72;font-size:14px;">Email</td>
                      <td style="padding:6px 0;font-size:14px;"><a href="mailto:${escapeHtml(leadEmail)}" style="color:#0029E2;text-decoration:none;">${escapeHtml(leadEmail)}</a></td>
                    </tr>
                    ${leadCompany ? `
                    <tr>
                      <td style="padding:6px 0;color:#5a5a72;font-size:14px;">Empresa</td>
                      <td style="padding:6px 0;color:#201747;font-size:14px;">${escapeHtml(leadCompany)}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- Message -->
            <p style="margin:0 0 8px;color:#201747;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Mensaje</p>
            <p style="margin:0 0 32px;color:#201747;font-size:15px;line-height:1.6;padding:16px;background-color:#f4f4f6;border-left:3px solid #0029E2;border-radius:0 4px 4px 0;">${escapeHtml(message)}</p>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://zucarlink.com/app/provider" style="display:inline-block;background-color:#0029E2;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;">Ver mi perfil de proveedor</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f4f4f6;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9090a8;font-size:13px;">Este lead fue registrado el ${date} a través de la ficha de <strong>${escapeHtml(providerCompanyName)}</strong> en Zucarlink.</p>
            <p style="margin:8px 0 0;color:#9090a8;font-size:13px;">Recibes este correo porque eres proveedor en <a href="https://zucarlink.com" style="color:#0029E2;text-decoration:none;">zucarlink.com</a></p>
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
