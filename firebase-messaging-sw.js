importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAc9X6ovcPQKnZyO_cTGIDVKNLvdYMx8PQ",
  authDomain: "matplan-42a33.firebaseapp.com",
  databaseURL: "https://matplan-42a33-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "matplan-42a33",
  storageBucket: "matplan-42a33.firebasestorage.app",
  messagingSenderId: "429921532031",
  appId: "1:429921532031:web:9deb776dc6f9195e07674a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const tittel = payload.notification ? payload.notification.title : '🛒 Handleliste';
  const body   = payload.notification ? payload.notification.body  : 'Listen er oppdatert!';
  self.registration.showNotification(tittel, {
    body: body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'handleliste-varsel',
    renotify: true
  });
});
