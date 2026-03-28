import { Redis } from '@upstash/redis'
import logger from '../utils/logger'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const setWithExpiry = async (
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> => {
  await redis.set(key, value, { ex: ttlSeconds })
  logger.debug('Redis set', { key, ttl: ttlSeconds })
}

export const get = async (key: string): Promise<string | null> => {
  const value = await redis.get<string>(key)
  return value ?? null
}

export const del = async (key: string): Promise<void> => {
  await redis.del(key)
  logger.debug('Redis del', { key })
}

export const exists = async (key: string): Promise<boolean> => {
  const result = await redis.exists(key)
  return result === 1
}

export default redis