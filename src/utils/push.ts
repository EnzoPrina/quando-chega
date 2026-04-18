import { getMessaging, getToken } from 'firebase/messaging'
import { app } from '../firebase'

export const requestPushToken = async () => {
  try {
    if (!('Notification' in window)) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = getMessaging(app)

    const token = await getToken(messaging, {
      vapidKey: 'BLOpArz05jO5wNBrwwYgdskXBzLgAPhiHfFp6zcfqAKQXpoP7gvjANwtTlpqxzIadD_pXezDdce53567Ue8UHlk', // ⚠️ cambiar esto luego
    })

    return token
  } catch (err) {
    console.log('Push error:', err)
    return null
  }
  
}