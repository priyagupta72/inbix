// import { Resend } from 'resend'
// import { generateEmailVerificationToken, generatePasswordResetToken } from './jwt.utils'
// import logger from './logger'

// const resend = new Resend(process.env.RESEND_API_KEY!)
// const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@inbix.com'
// const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// interface User {
//   id: string
//   email: string
//   name?: string | null
// }

// export const sendVerificationEmail = async (user: User): Promise<void> => {
//   const token = generateEmailVerificationToken(user)
//   const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`

//   await resend.emails.send({
//     from: FROM_EMAIL,
//     to: user.email,
//     subject: 'Verify your inbix account',
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>Welcome to inbix!</h2>
//         <p>Hi ${user.name || 'there'},</p>
//         <p>Please verify your email address to activate your account.</p>
//         <a href="${verifyUrl}" 
//            style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
//           Verify Email
//         </a>
//         <p>This link expires in 15 minutes.</p>
//         <p>If you didn't create an account, ignore this email.</p>
//       </div>
//     `,
//   })

//   logger.info('Verification email sent', { userId: user.id, email: user.email })
// }

// export const sendPasswordResetEmail = async (user: User): Promise<void> => {
//   const token = generatePasswordResetToken(user)
//   const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`

//   await resend.emails.send({
//     from: FROM_EMAIL,
//     to: user.email,
//     subject: 'Reset your inbix password',
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>Password Reset Request</h2>
//         <p>Hi ${user.name || 'there'},</p>
//         <p>Click the button below to reset your password.</p>
//         <a href="${resetUrl}"
//            style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
//           Reset Password
//         </a>
//         <p>This link expires in 15 minutes.</p>
//         <p>If you didn't request this, ignore this email.</p>
//       </div>
//     `,
//   })

//   logger.info('Password reset email sent', { userId: user.id, email: user.email })
// }

// export const sendWelcomeEmail = async (user: User): Promise<void> => {
//   await resend.emails.send({
//     from: FROM_EMAIL,
//     to: user.email,
//     subject: 'Welcome to inbix!',
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>You're all set! </h2>
//         <p>Hi ${user.name || 'there'},</p>
//         <p>Your inbix account is ready. Start connecting your inbox and let AI handle your replies.</p>
//         <a href="${FRONTEND_URL}/dashboard"
//            style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
//           Go to Dashboard
//         </a>
//       </div>
//     `,
//   })

//   logger.info('Welcome email sent', { userId: user.id, email: user.email })
// }



import nodemailer from 'nodemailer'
import { generateEmailVerificationToken, generatePasswordResetToken } from './jwt.utils'
import logger from './logger'

// ==================== RESEND (commented out for future use) ====================
// import { Resend } from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY!)
// const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@inbix.com'

// ==================== NODEMAILER (Gmail SMTP) ====================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
})

const FROM_EMAIL = `inbix <${process.env.GMAIL_USER}>`
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

interface User {
  id: string
  email: string
  name?: string | null
}

// ==================== SEND VERIFICATION EMAIL ====================
export const sendVerificationEmail = async (user: User): Promise<void> => {
  const token = generateEmailVerificationToken(user)
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: user.email,
    subject: 'Verify your inbix account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to inbix!</h2>
        <p>Hi ${user.name || 'there'},</p>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
          Verify Email
        </a>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't create an account, ignore this email.</p>
      </div>
    `,
  })

  logger.info('Verification email sent', { userId: user.id, email: user.email })
}

// ==================== SEND PASSWORD RESET EMAIL ====================
export const sendPasswordResetEmail = async (user: User): Promise<void> => {
  const token = generatePasswordResetToken(user)
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: user.email,
    subject: 'Reset your inbix password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name || 'there'},</p>
        <p>Click the button below to reset your password.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
          Reset Password
        </a>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `,
  })

  logger.info('Password reset email sent', { userId: user.id, email: user.email })
}

// ==================== SEND WELCOME EMAIL ====================
export const sendWelcomeEmail = async (user: User): Promise<void> => {
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: user.email,
    subject: 'Welcome to inbix!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're all set!</h2>
        <p>Hi ${user.name || 'there'},</p>
        <p>Your inbix account is ready. Start connecting your inbox and let AI handle your replies.</p>
        <a href="${FRONTEND_URL}/dashboard"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
          Go to Dashboard
        </a>
      </div>
    `,
  })

  logger.info('Welcome email sent', { userId: user.id, email: user.email })
}