import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Verification link:', confirmLink)
    return // Don't attempt to send email in development
  }

  try {
    await resend.emails.send({
      from: `AVA IRIS <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Verify your email address</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${confirmLink}">${confirmLink}</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this email, you can safely ignore it.</p>
      `
    })
  } catch (error) {
    console.error('Failed to send verification email:', error)
    throw new Error('Failed to send verification email')
  }
} 