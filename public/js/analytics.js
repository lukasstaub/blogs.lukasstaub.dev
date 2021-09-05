// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.1/firebase-analytics.js";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA838q24Rzo6qW2F4PyXJ2i4gOyrRdp4KI",
    authDomain: "lukasstaub-dev.firebaseapp.com",
    projectId: "lukasstaub-dev",
    storageBucket: "lukasstaub-dev.appspot.com",
    messagingSenderId: "461547213445",
    appId: "1:461547213445:web:a7403d1c9202ca3dac8fec",
    measurementId: "G-62KX76LHBW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
