// ============================================================
// Email Templates
// ============================================================

export interface InvitationEmailData {
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
}

/**
 * Generate invitation email HTML template.
 */
export function invitationEmailHtml(data: InvitationEmailData): string {
  const expiryStr = data.expiresAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">MimoNotes</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Undangan Workspace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Halo,
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                <strong>${escapeHtml(data.inviterName || data.inviterEmail)}</strong> mengundang Anda untuk bergabung ke workspace <strong>${escapeHtml(data.workspaceName)}</strong> sebagai <strong>${escapeHtml(data.role)}</strong>.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(data.acceptUrl)}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      Terima Undangan
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;line-height:1.5;">
                Atau copy link ini ke browser Anda:
              </p>
              <p style="margin:0 0 16px;color:#2563eb;font-size:13px;word-break:break-all;">
                <a href="${escapeHtml(data.acceptUrl)}" style="color:#2563eb;">${escapeHtml(data.acceptUrl)}</a>
              </p>

              <!-- Expiry Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;border-radius:8px;padding:12px 16px;margin:16px 0;">
                <tr>
                  <td>
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                      ⚠️ Undangan ini berlaku hingga <strong>${expiryStr}</strong>. Setelah itu, undangan akan kedaluwarsa.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;">
                Email ini dikirim oleh MimoNotes. Jika Anda tidak merasa mengundang siapa pun, abaikan email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate invitation email plain text version.
 */
export function invitationEmailText(data: InvitationEmailData): string {
  const expiryStr = data.expiresAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
MimoNotes — Undangan Workspace

Halo,

${data.inviterName || data.inviterEmail} mengundang Anda untuk bergabung ke workspace "${data.workspaceName}" sebagai ${data.role}.

Terima undangan:
${data.acceptUrl}

Undangan ini berlaku hingga ${expiryStr}.

---
Email ini dikirim oleh MimoNotes. Jika Anda tidak merasa mengundang siapa pun, abaikan email ini.
`.trim();
}

/**
 * Escape HTML to prevent XSS in email templates.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
