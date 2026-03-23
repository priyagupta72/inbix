import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import logger from './utils/logger'

dotenv.config()

const app: express.Application = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan('dev'))

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ReplyEngine backend is running!',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  logger.info('Starting ReplyEngine Backend Server...', {
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  })
  logger.info(`Backend running on http://localhost:${PORT}`)
})

export default app