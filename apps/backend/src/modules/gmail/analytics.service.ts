import { prisma } from '../../index'

export const getAnalytics = async (userId: string) => {
  const messages = await prisma.message.findMany({
    where: { userId },
    select: {
      category:   true,
      isReplied:  true,
      receivedAt: true,
      repliedAt:  true,
    },
  })

  const totalMessages = messages.length
  const totalReplies  = messages.filter(m => m.isReplied).length

  // Avg reply time in minutes
  const repliedMessages = messages.filter(m => m.isReplied && m.repliedAt)
  const avgReplyMinutes = repliedMessages.length > 0
    ? repliedMessages.reduce((sum, m) => {
        const diff = new Date(m.repliedAt!).getTime() - new Date(m.receivedAt).getTime()
        return sum + diff / 1000 / 60
      }, 0) / repliedMessages.length
    : null

  const formatAvgTime = (mins: number | null) => {
    if (mins === null) return '—'
    if (mins < 60) return `${Math.round(mins)}m`
    return `${(mins / 60).toFixed(1)}h`
  }

  // Time saved: assume each reply saves 10 mins
  const timeSavedHrs = ((totalReplies * 10) / 60).toFixed(1)

  // Category breakdown
  const categoryCounts: Record<string, number> = {}
  for (const m of messages) {
    const cat = m.category || 'Other'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  }
  const categoryBreakdown = Object.entries(categoryCounts).map(([label, count]) => ({
    label,
    count,
    pct: totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0,
  }))

  // Message volume — last 30 days
  const now     = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const volumeMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(thirtyDaysAgo.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    volumeMap[key] = 0
  }
  for (const m of messages) {
    const key = new Date(m.receivedAt).toISOString().slice(0, 10)
    if (key in volumeMap) volumeMap[key]++
  }
  const messageVolume = Object.entries(volumeMap).map(([date, count]) => ({ date, count }))

  return {
    totalMessages,
    totalReplies,
    avgReplyTime: formatAvgTime(avgReplyMinutes),
    timeSaved:    `${timeSavedHrs} hrs`,
    categoryBreakdown,
    messageVolume,
  }
}