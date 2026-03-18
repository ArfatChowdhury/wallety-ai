import { initializeApp } from "firebase/app";
import {
    getAuth,
    initializeAuth,
    browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Dynamically get React Native persistence to avoid TypeScript errors
let getReactNativePersistence;
try {
    const authModule = require('firebase/auth');
    getReactNativePersistence = authModule.getReactNativePersistence;
} catch (e) {
    // Fallback if module structure is different
    getReactNativePersistence = () => browserLocalPersistence;
}

export const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase Init - API Key available?', !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY);

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = (() => {
    try {
        // Prefer AsyncStorage-based persistence on React Native if available
        let persistence = browserLocalPersistence;
        try {
            // dynamic require so the app still runs if the package isn't installed
            const RNAsyncStorage = require("@react-native-async-storage/async-storage").default;
            if (RNAsyncStorage && getReactNativePersistence) {
                persistence = getReactNativePersistence(RNAsyncStorage);
            }
        } catch (err) {
            // package not installed or require failed — fall back to browserLocalPersistence
        }

        return initializeAuth(app, {
            persistence,
        });
    } catch (e) {
        // Fallback to regular getAuth if initializeAuth is not available or already initialized
        return getAuth(app);
    }
})();