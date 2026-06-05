const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore'); 
const serviceAccount = require('./serviceAccountKey.json');

// Inicializamos la App de Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Conexión limpia a tu base de datos personalizada
const db = getFirestore('brewinsights');

async function migrateAllUsers() {
  let nextPageToken;
  let totalMigrated = 0;

  console.log("🔄 Iniciando migración de usuarios a Firestore...");

  do {
    const listUsersResult = await admin.auth().listUsers(500, nextPageToken);
    
    if (listUsersResult.users.length === 0) {
      console.log("ℹ️ No se encontraron usuarios en Authentication para migrar.");
      break;
    }

    const batch = db.batch();

    listUsersResult.users.forEach((userRecord) => {
      const userRef = db.collection('user_permissions').doc(userRecord.uid);
      
      batch.set(userRef, {
        email: userRecord.email || "",
        permissions: [], // Vacío por seguridad hasta aprobación del admin
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    totalMigrated += listUsersResult.users.length;
    console.log(`✅ Bloque procesado. Total migrados hasta ahora: ${totalMigrated}`);

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`🎉 ¡Migración completada con éxito! Se sincronizaron ${totalMigrated} documentos.`);
  process.exit(0);
}

migrateAllUsers().catch((error) => {
  console.error("❌ Error en la migración:", error);
  process.exit(1);
});