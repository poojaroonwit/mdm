import nodemailer from 'nodemailer'
import { getSmtpSettings } from '@/lib/smtp-settings'

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const settings = await getSmtpSettings()
  if (!settings) {
    console.warn('SMTP settings not configured, email not sent to:', to)
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.auth.user,
        pass: settings.auth.pass,
      },
    })

    await transporter.sendMail({
      from: settings.from,
      to,
      subject,
      html,
    })

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}
