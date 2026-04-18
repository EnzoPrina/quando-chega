export function getNextBus(schedules: string[]) {
  const now = new Date()

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const timesInMinutes = schedules.map((t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  })

  const next = timesInMinutes.find((t) => t >= currentMinutes)

  if (!next) return null

  const diff = next - currentMinutes

  const nextHour = Math.floor(next / 60)
  const nextMin = next % 60

  return {
    minutes: diff,
    time: `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`,
  }
}

// formato bonito
export function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  return m === 0 ? `${h}h` : `${h}h ${m}m`
}