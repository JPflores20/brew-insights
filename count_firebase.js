import { initializeApp } from "firebase/app";
import { getFirestore, collection, getCountFromServer } from "firebase/firestore";
// Using Node native --env-file

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "brewinsights");

async function countDocs() {
  try {
    const coll = collection(db, "hot_block_records");
    const snapshot = await getCountFromServer(coll);
    console.log("TOTAL DOCUMENTS IN FIREBASE:", snapshot.data().count);
    process.exit(0);
  } catch (error) {
    console.error("Error counting docs:", error);
    process.exit(1);
  }
}

countDocs();
