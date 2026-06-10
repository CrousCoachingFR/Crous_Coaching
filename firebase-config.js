// =============================================================
// FIREBASE — Configuration du projet
// =============================================================
//
// 1) Allez sur https://console.firebase.google.com/
// 2) Créez un projet (ex. "crous-coaching")
// 3) Ajoutez une application Web (icône </>) — copiez les valeurs ci-dessous
// 4) Dans "Authentication", activez le fournisseur "Email/Mot de passe"
// 5) Dans "Firestore Database", créez la base en mode production
//    et déployez les règles fournies dans /firestore.rules (voir README.md)
//
// Tant que ces valeurs sont fictives, le site fonctionne en mode démo localStorage.
// =============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyAS8emzLtZ_0YiQnpFr-J3yw224cmPrlKY",
  authDomain: "crouscoaching.firebaseapp.com",
  projectId: "crouscoaching",
  storageBucket: "crouscoaching.firebasestorage.app",
  messagingSenderId: "301186568532",
  appId: "1:301186568532:web:0c0506e32f99862813b8c1"
};

export const isFirebaseConfigured =
  !firebaseConfig.apiKey.startsWith("REPLACE");
