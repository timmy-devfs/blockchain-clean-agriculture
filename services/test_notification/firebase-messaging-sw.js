importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAddWgmwXUnewvcyra4CWlv_u7XfHEPovc",
    authDomain: "bicap-b4230.firebaseapp.com",
    projectId: "bicap-b4230",
    storageBucket: "bicap-b4230.firebasestorage.app",
    messagingSenderId: "307650253482",
    appId: "1:307650253482:web:7a836504b6b8c5b206f6d3"
});

const messaging = firebase.messaging();

// Lắng nghe thông báo khi web đang đóng/chạy ngầm
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});