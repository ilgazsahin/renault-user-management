import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const LOGO_SVG = `
  <svg width="48" height="48" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="40,4 76,40 40,76 4,40"
      fill="none" stroke="#EFDF00" stroke-width="7" stroke-linejoin="round"/>
    <polygon points="40,20 60,40 40,60 20,40"
      fill="none" stroke="#EFDF00" stroke-width="5.5" stroke-linejoin="round"/>
  </svg>
`;

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="max-width:560px;width:100%;border-radius:6px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:#1A1A1A;padding:28px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:14px;">
                    ${LOGO_SVG}
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:16px;font-weight:700;letter-spacing:0.16em;color:#FFFFFF;text-transform:uppercase;">
                      Renault
                    </div>
                    <div style="font-size:10px;letter-spacing:0.14em;color:#757575;text-transform:uppercase;margin-top:2px;">
                      User Management
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Yellow accent bar -->
          <tr><td style="background:#EFDF00;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F4F4F4;padding:20px 40px;border-top:1px solid #E8E8E8;">
              <p style="margin:0;font-size:11px;color:#BDBDBD;text-align:center;">
                © ${new Date().getFullYear()} Renault &nbsp;·&nbsp;
                This is an automated message, please do not reply.
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

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>('MAIL_USER') ?? '';

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.from,
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendWelcomeEmail(
    to: string,
    username: string,
    tempPassword: string,
  ): Promise<void> {
    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#1A1A1A;">Welcome aboard</h2>
      <p style="margin:0 0 28px;font-size:14px;color:#757575;line-height:1.6;">
        An account has been created for you on the Renault User Management portal.
        Here are your login credentials:
      </p>

      <table cellpadding="0" cellspacing="0" width="100%"
        style="background:#F9F9F9;border:1px solid #E8E8E8;border-radius:4px;margin-bottom:28px;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #E8E8E8;width:160px;">
            <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9E9E9E;">
              Username
            </span>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid #E8E8E8;">
            <span style="font-size:15px;font-weight:600;color:#1A1A1A;">${username}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;">
            <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9E9E9E;">
              Temp Password
            </span>
          </td>
          <td style="padding:14px 20px;">
            <span style="font-size:17px;font-weight:700;font-family:monospace;
              background:#1A1A1A;color:#EFDF00;padding:4px 12px;border-radius:3px;
              letter-spacing:0.12em;">
              ${tempPassword}
            </span>
          </td>
        </tr>
      </table>

      <div style="background:#FFF8E1;border-left:3px solid #EFDF00;padding:12px 16px;
        border-radius:0 4px 4px 0;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#5D4037;">
          <strong>Action required:</strong> Please sign in and change your password immediately.
        </p>
      </div>

      <p style="margin:0;font-size:12px;color:#BDBDBD;line-height:1.6;">
        If you did not expect this email, please contact your administrator.
      </p>
    `;

    await this.transporter.sendMail({
      from: `"Renault User Management" <${this.from}>`,
      to,
      subject: 'Your Renault account has been created',
      html: emailWrapper(body),
    });

    this.logger.log(`Welcome email sent to ${to}`);
  }

  async sendPasswordResetEmail(
    to: string,
    username: string,
    tempPassword: string,
  ): Promise<void> {
    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#1A1A1A;">Password reset</h2>
      <p style="margin:0 0 28px;font-size:14px;color:#757575;line-height:1.6;">
        Hi <strong style="color:#1A1A1A;">${username}</strong>, we received a request to reset
        your password. Here is your temporary password:
      </p>

      <table cellpadding="0" cellspacing="0" width="100%"
        style="background:#F9F9F9;border:1px solid #E8E8E8;border-radius:4px;margin-bottom:28px;">
        <tr>
          <td style="padding:14px 20px;width:160px;">
            <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9E9E9E;">
              Temp Password
            </span>
          </td>
          <td style="padding:14px 20px;">
            <span style="font-size:17px;font-weight:700;font-family:monospace;
              background:#1A1A1A;color:#EFDF00;padding:4px 12px;border-radius:3px;
              letter-spacing:0.12em;">
              ${tempPassword}
            </span>
          </td>
        </tr>
      </table>

      <div style="background:#FFF8E1;border-left:3px solid #EFDF00;padding:12px 16px;
        border-radius:0 4px 4px 0;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#5D4037;">
          <strong>Action required:</strong> Sign in with this temporary password and change it immediately.
        </p>
      </div>

      <p style="margin:0;font-size:12px;color:#BDBDBD;line-height:1.6;">
        If you did not request a password reset, please contact your administrator.
      </p>
    `;

    await this.transporter.sendMail({
      from: `"Renault User Management" <${this.from}>`,
      to,
      subject: 'Your password has been reset',
      html: emailWrapper(body),
    });

    this.logger.log(`Password reset email sent to ${to}`);
  }

  async sendPasswordChangedEmail(
    to: string,
    username: string,
  ): Promise<void> {
    const changedAt = new Date().toLocaleString('en-GB', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#1A1A1A;">Password changed</h2>
      <p style="margin:0 0 28px;font-size:14px;color:#757575;line-height:1.6;">
        Hi <strong style="color:#1A1A1A;">${username}</strong>, the password for your
        Renault User Management account was successfully updated.
      </p>

      <table cellpadding="0" cellspacing="0" width="100%"
        style="background:#F9F9F9;border:1px solid #E8E8E8;border-radius:4px;margin-bottom:28px;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #E8E8E8;width:160px;">
            <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9E9E9E;">
              Account
            </span>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid #E8E8E8;">
            <span style="font-size:15px;font-weight:600;color:#1A1A1A;">${username}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;">
            <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9E9E9E;">
              Changed at
            </span>
          </td>
          <td style="padding:14px 20px;">
            <span style="font-size:14px;color:#1A1A1A;">${changedAt}</span>
          </td>
        </tr>
      </table>

      <div style="background:#FFEBEE;border-left:3px solid #D32F2F;padding:12px 16px;
        border-radius:0 4px 4px 0;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#B71C1C;">
          <strong>Wasn't you?</strong> Contact your administrator immediately to secure your account.
        </p>
      </div>

      <p style="margin:0;font-size:12px;color:#BDBDBD;line-height:1.6;">
        This notification was sent to the email address associated with your account.
      </p>
    `;

    await this.transporter.sendMail({
      from: `"Renault User Management" <${this.from}>`,
      to,
      subject: 'Your password has been changed',
      html: emailWrapper(body),
    });

    this.logger.log(`Password changed email sent to ${to}`);
  }
}
