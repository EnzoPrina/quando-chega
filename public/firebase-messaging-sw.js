importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCnfdev_4c7PqX_9D4KkO306ElVie41IQQ",
  authDomain: "quandochega-24f2c.firebaseapp.com",
  projectId: "quandochega-24f2c",
  storageBucket: "quandochega-24f2c.firebasestorage.app",
  messagingSenderId: "886722290849",
  appId: "1:886722290849:web:41c7609135d0350b5afce0",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('📩 Push recibido:', payload)

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo.png',
  })
})