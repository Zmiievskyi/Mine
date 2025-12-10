export function getVerificationEmailTemplate(
  code: string,
  userName?: string,
): { subject: string; html: string } {
  return {
    subject: 'Verify your MineGNK account',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #FF4C00; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">MineGNK</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #363636; font-size: 24px; font-weight: 600;">Verify your email</h2>
              <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                ${userName ? `Hi ${userName},` : 'Hi there,'}
              </p>
              <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                Thank you for registering with MineGNK! Please use the verification code below to verify your email address:
              </p>
              <!-- Verification Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f5f4f4; border: 2px solid #FF4C00; border-radius: 8px; padding: 24px; display: inline-block;">
                      <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #FF4C00; font-family: 'Courier New', monospace;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="margin: 24px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                If you didn't create a MineGNK account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f4f4; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} MineGNK. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                GPU mining made simple for Gcore clients
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}
