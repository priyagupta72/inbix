import { z } from 'zod'

const NAME_MIN = 2
const NAME_MAX = 100
const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

const nameSchema = z
  .string()
  .trim()
  .min(NAME_MIN, `Name must be at least ${NAME_MIN} characters`)
  .max(NAME_MAX, `Name cannot exceed ${NAME_MAX} characters`)
  .regex(/^[a-zA-Z0-9\s\-']+$/, 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes')

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please provide a valid email address')

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password cannot exceed ${PASSWORD_MAX} characters`)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  )

// ==================== REGISTER ====================
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})

// ==================== VERIFY EMAIL ====================
export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required'),
})

// ==================== RESEND VERIFICATION ====================
export const resendVerificationSchema = z.object({
  email: emailSchema,
})

// ==================== LOGIN ====================
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// ==================== GOOGLE OAUTH ====================
export const googleLoginSchema = z.object({
  idToken: z
    .string()
    .trim()
    .min(1, 'Google ID token is required')
    .max(4000, 'Google ID token exceeds maximum allowed length'),
})

// ==================== PASSWORD MANAGEMENT ====================
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password: passwordSchema,
})

export const validateResetTokenSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
})

// ==================== TOKEN MANAGEMENT ====================
export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh token is required'),
})

export const logoutSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh token is required'),
})

// ==================== TYPES ====================
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>