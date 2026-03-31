import { google } from 'googleapis'

// export const getOAuthClient = () => {
//   return new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID!,
//     process.env.GOOGLE_CLIENT_SECRET!,
//     process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
//   )
// }

export const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/gmail/callback'
  )
}

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]