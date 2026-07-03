/** Standard footer row with an unsubscribe/preferences link, matching the brand email templates. */
export function renderFooterWithUnsubscribe(baseText: string, unsubscribeUrl: string): string {
  return `<tr>
          <td style="background-color:#f4f4f6;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:#9090a8;font-size:13px;">${baseText}</p>
            <p style="margin:0;color:#9090a8;font-size:13px;"><a href="${unsubscribeUrl}" style="color:#0029E2;text-decoration:none;">Gestionar preferencias de correo</a></p>
          </td>
        </tr>`
}
