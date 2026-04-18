import { getNextBus } from './time'

// 🚫 fin de semana
const isWeekend = () => {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

// 🔔 pedir permiso
export const requestPermission = async () => {
  try {
    if (!('Notification' in window)) return false

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (err) {
    console.log('Permission error:', err)
    return false
  }
}

// 🧠 NOTIFICACIÓN INTELIGENTE PRO
export const scheduleSmartNotification = async (
  stopName: string,
  schedules: string[]
) => {
  try {
    if (!('Notification' in window)) return

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    // 🚫 fin de semana
    if (isWeekend()) {
      new Notification('🚫 Sem serviço', {
        body: 'Autocarros só funcionam de segunda a sexta',
        icon: '/logo.png',
      })
      return
    }

    const next = getNextBus(schedules)

    // ❌ no hay buses
    if (!next) {
      new Notification('🚫 Sem autocarros', {
        body: 'Já não há mais autocarros hoje',
        icon: '/logo.png',
      })
      return
    }

    const minutes = next.minutes

    // ⚠️ muy cerca → avisar YA
    if (minutes <= 3) {
      new Notification('🚌 Muito próximo', {
        body: `${stopName} está a chegar agora`,
        icon: '/logo.png',
      })
      return
    }

    // 🔥 queremos avisar 5 min antes
    const notifyIn = (minutes - 5) * 60 * 1000

    // ⚠️ menos de 5 min → avisar ya
    if (notifyIn <= 0) {
      new Notification('🚌 Atenção', {
        body: `${stopName} em menos de 5 minutos`,
        icon: '/logo.png',
      })
      return
    }

    // 🔥 programar notificación
    setTimeout(() => {
      new Notification('🚌 Autocarro a chegar', {
        body: `${stopName} em 5 minutos`,
        icon: '/logo.png',
      })
    }, notifyIn)

    // ✅ feedback silencioso en consola
    console.log(`Notificación programada para ${stopName}`)

  } catch (err) {
    console.log('Smart notification error:', err)
  }
}