import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync('./spoilme-service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://spoilme-edee0.firebaseio.com' // or your database URL
});

async function setAdminClaim() {
  try {
    // Set custom claims for the admin user
    await admin.auth().setCustomUserClaims('Dzk5mgkC7UYtlN3F6f3kK2EhM1S2', { admin: true });
    console.log('Custom claims set successfully');
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
}

setAdminClaim();
