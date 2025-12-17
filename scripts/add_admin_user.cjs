// filepath: scripts/add_admin_user.cjs
// Script to add admin user to Firebase Auth and Firestore
// Usage: node scripts/add_admin_user.cjs
// Requires: spoilme-service-account.json in project root or GOOGLE_APPLICATION_CREDENTIALS env var

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'spoilme-service-account.json');

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {
  console.error('Error initializing Firebase Admin SDK:', e.message);
  console.error('Service account path:', serviceAccountPath);
  console.error('Ensure the file exists and is valid JSON.');
  process.exit(1);
}

const email = 'spoilmevintagediy@gmail.com';
const password = 'admin@spoilme';
const displayName = 'Admin User';

async function addAdminUser() {
  try {
    console.log('Starting admin user setup...');
    console.log('Service account path:', serviceAccountPath);

    // Check if user exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('User already exists with uid:', userRecord.uid);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Create user
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName,
          emailVerified: true
        });
        console.log('Created new user with uid:', userRecord.uid);
      } else {
        throw err;
      }
    }

    // Set custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('Set custom claim { admin: true } for uid:', userRecord.uid);

    // Add to Firestore users collection
    try {
      const db = admin.firestore();
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        email: userRecord.email,
        name: displayName,
        isAdmin: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Added admin user to Firestore users collection.');
    } catch (fsError) {
      console.warn('Failed to write to Firestore users collection:', fsError.message);
      console.log('Custom claim set successfully. Admin access should work via token claim.');
    }

    console.log('Admin user setup complete!');
    console.log('You can now sign in as admin and have full access.');
  } catch (error) {
    console.error('Error adding admin user:', error);
    process.exit(1);
  }
}

addAdminUser();
