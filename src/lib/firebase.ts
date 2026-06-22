import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// Inicializar App Check si existe una clave de ReCaptcha en las variables de entorno
let appCheck;
if (typeof window !== "undefined" && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      // isTokenAutoRefreshEnabled renueva el token en segundo plano automáticamente
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.error("Error inicializando App Check:", error);
  }
}

export const auth = getAuth(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const storage = getStorage(app);
export const firestore = getFirestore(app, "brewinsights");