const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Usage:
// 1) Place your service account JSON (from Firebase Console -> Project Settings -> Service accounts -> Generate new private key)
//    in the project root and name it 'serviceAccountKey.json', OR set the env var GOOGLE_APPLICATION_CREDENTIALS to its path.
// 2) Run: node scripts/create_admin.cjs spoilmevintagediy@gmail.com admin@spoilme
//    OR `npm run create-admin` which uses the default email/password below.

const argv = process.argv.slice(2);
const email = argv[0] || 'spoilmevintagediy@gmail.com';
const password = argv[1] || 'admin@spoilme';
const displayName = 'Admin User';

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\nERROR: service account JSON not found.');
  console.error('Resolved service account path:', serviceAccountPath);
  console.error('Environment variable GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '(not set)');
  console.error('Place the file at:', serviceAccountPath);
  console.error('Or set the environment variable GOOGLE_APPLICATION_CREDENTIALS to its path.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

try {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) {
  // If already initialized in the same process, ignore
  console.warn('Firebase admin init warning:', e.message || e);
}

async function ensureAdmin() {
  try {
    // Try to find existing user
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('User already exists with uid:', userRecord.uid);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.message?.includes('user-not-found')) {
        // Create user
        userRecord = await admin.auth().createUser({ email, password, displayName, emailVerified: true });
        console.log('Created new user with uid:', userRecord.uid);
      } else {
        throw err;
      }
    }

    // Set custom claims: admin: true
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`Set custom claim { admin: true } for uid: ${userRecord.uid}`);

    // Update Firestore users document (merge) so your app's user lookup can find it
    try {
      const db = admin.firestore();
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || displayName,
        isAdmin: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Wrote/merged admin user document in Firestore `users/{uid}`.');
    } catch (fsErr) {
      console.warn('Failed to update Firestore users collection:', fsErr.message || fsErr);
    }

    console.log('\nADMIN CREATION COMPLETE');
    console.log('You can now sign in in the app with the admin account and Firestore rules that check request.auth.token.admin will allow writes.');
    process.exit(0);
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    process.exit(2);
  }
}

ensureAdmin();
