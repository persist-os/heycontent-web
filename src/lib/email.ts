import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD
  }
})

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/api/auth/verify/${token}`

  // Log verification link in development
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔑 Email Verification Link:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(verificationUrl)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👆 Click this link to verify your email\n')
    return
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Verify your AVA IRIS Account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              .container { 
                padding: 20px;
                max-width: 600px;
                margin: 0 auto;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
              }
              .button {
                background: #3b82f6;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                display: inline-block;
                margin: 20px 0;
              }
              .footer {
                color: #666;
                font-size: 14px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 style="color: #1f2937">Welcome to AVA IRIS! 🎉</h1>
              <p>Thanks for signing up. Please verify your email address to get started.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>Or copy and paste this URL into your browser:</p>
              <p style="color: #666">${verificationUrl}</p>
              <div class="footer">
                <p>If you didn't create an account with AVA IRIS, you can safely ignore this email.</p>
                <p>© ${new Date().getFullYear()} AVA IRIS. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
    return info
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export async function sendResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your AVA IRIS Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container { 
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
            }
            .button {
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              display: inline-block;
              margin: 20px 0;
            }
            .footer {
              color: #666;
              font-size: 14px;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="color: #1f2937">Reset Your Password</h1>
            <p>You requested to reset your password. Click the button below to continue:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="color: #666">${resetUrl}</p>
            <div class="footer">
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} AVA IRIS. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  })
} 