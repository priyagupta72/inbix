import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { PrismaClient } from '@prisma/client'
import logger from './utils/logger'
import { AppError } from './utils/AppError'
import authRouter from './modules/auth/auth.routes'
import gmailRouter from './modules/gmail/gmail.routes'
import messagesRouter from './modules/messages/messages.routes'
import templateRoutes from './modules/templates/templates.routes'
import settingsRoutes from './modules/settings/settings.routes'


// ─── Prisma Singleton ────────────────────────────────────────────────────────
export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
})

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 200) {
      logger.warn('Slow query detected', {
        query: e.query,
        duration: `${e.duration}ms`,
      })
    }
  })
}

prisma.$on('error', (e: { message: string }) => {
  logger.error('Prisma error', { message: e.message })
})

// ─── App Setup ───────────────────────────────────────────────────────────────
const app: express.Application = express()
const PORT = Number(process.env.PORT) || 8000

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(compression())
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(
  morgan('dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
)

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      service: 'inbix-backend',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch {
    res.status(503).json({
      status: 'error',
      service: 'inbix-backend',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    })
  }
})

// ─── TODO: Mount routers here ────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/gmail', gmailRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/templates', templateRoutes)
app.use('/api/settings', settingsRoutes)
// app.use('/api/analytics', analyticsRouter)

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404))
})

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(
  (
    err: AppError | Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const isAppError = err instanceof AppError
    const statusCode = isAppError ? err.statusCode : 500
    const isOperational = isAppError ? err.isOperational : false

    if (!isOperational) {
      logger.error('Unexpected error', {
        message: err.message,
        stack: err.stack,
      })
    }

    res.status(statusCode).json({
      status: 'error',
      message: isOperational ? err.message : 'Something went wrong',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
  }
)

// ─── Startup ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    // Verify DB connection before accepting traffic
    await prisma.$connect()
    logger.info('Database connected successfully', {
      service: 'inbix-backend',
    })

    const server = app.listen(PORT, () => {
      logger.info(' inbix Backend Server started', {
        service: 'inbix-backend',
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        url: `http://localhost:${PORT}`,
      })
    })

    // ─── Graceful Shutdown ──────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`)
      server.close(async () => {
        await prisma.$disconnect()
        logger.info('Database disconnected. Server closed.')
        process.exit(0)
      })

      // Force kill after 10s if not closed
      setTimeout(() => {
        logger.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10_000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason })
      shutdown('unhandledRejection')
    })
  } catch (error) {
    logger.error('Failed to start server', { error })
    await prisma.$disconnect()
    process.exit(1)
  }
}

bootstrap()

export default app