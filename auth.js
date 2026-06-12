import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let app = null, auth = null, db = null;

if (isFirebaseConfigured) {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
}

export { auth, db };

const DEMO_USERS_KEY   = "crous_demo_users";
const DEMO_SESSION_KEY = "crous_demo_session";

function getDemoUsers() { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "{}"); }
function setDemoUsers(u) { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(u)); }

function seedDemoIfEmpty() {
  const users = getDemoUsers();
  if (Object.keys(users).length === 0) {
    users["admin@crous.fr"] = {
      uid: "demo-admin", email: "admin@crous.fr",
      password: "admin123", displayName: "Crous (admin)", role: "admin"
    };
    users["theo@example.com"] = {
      uid: "demo-theo", email: "theo@example.com",
      password: "athlete123", displayName: "Théo Marchand",
      role: "client", metrics: "24 ans · 78 kg · 182 cm"
    };
    setDemoUsers(users);
  }
}
seedDemoIfEmpty();

export async function signUp({ email, password, displayName, metrics, inviteToken }) {
  if (auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, "users", cred.user.uid), {
      email, displayName, role: "client", metrics: metrics || "", createdAt: serverTimestamp()
    });
    if (inviteToken) await markInviteUsed(inviteToken, cred.user.uid);
    return cred.user;
  }
  const users = getDemoUsers();
  if (users[email]) throw new Error("Email déjà inscrit");
  const uid = "demo-" + Math.random().toString(36).slice(2, 9);
  users[email] = { uid, email, password, displayName, role: "client", metrics: metrics || "" };
  setDemoUsers(users);
  localStorage.setItem(DEMO_SESSION_KEY, email);
  if (inviteToken) await markInviteUsed(inviteToken, uid);
  return users[email];
}

export async function signIn({ email, password }) {
  if (auth) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }
  const users = getDemoUsers();
  const u = users[email];
  if (!u || u.password !== password) throw new Error("Identifiants incorrects");
  localStorage.setItem(DEMO_SESSION_KEY, email);
  return u;
}

export async function signOutUser() {
  if (auth) return signOut(auth);
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export async function getCurrentUserWithRole() {
  if (auth) {
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        unsub();
        if (!user) return resolve(null);
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        resolve({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || data.displayName || user.email,
          role: data.role || "client",
          metrics: data.metrics || ""
        });
      });
    });
  }
  const email = localStorage.getItem(DEMO_SESSION_KEY);
  if (!email) return null;
  const u = getDemoUsers()[email];
  return u || null;
}

export async function requireAuth(role) {
  const u = await getCurrentUserWithRole();
  if (!u) { window.location.href = "login.html"; return null; }
  if (role && u.role !== role) {
    window.location.href = u.role === "admin" ? "admin.html" : "dashboard.html";
    return null;
  }
  return u;
}

export function routeAfterLogin(user) {
  if (user.role === "admin") window.location.href = "admin.html";
  else window.location.href = "dashboard.html";
}

// =============================================================
// INVITATIONS — liens à usage unique, valables 48h
// =============================================================

const DEMO_INVITES_KEY = "crous_invites";

function getDemoInvites() { return JSON.parse(localStorage.getItem(DEMO_INVITES_KEY) || "{}"); }
function setDemoInvites(v) { localStorage.setItem(DEMO_INVITES_KEY, JSON.stringify(v)); }

function genToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48h

// Crée une invitation. Retourne le token à insérer dans le lien :
//   login.html?invite=TOKEN
export async function createInvite({ email, displayName, metrics }) {
  const token = genToken();
  const createdAt = Date.now();
  const expiresAt = createdAt + INVITE_TTL_MS;
  const data = { email, displayName: displayName || "", metrics: metrics || "", used: false };

  if (db) {
    await setDoc(doc(db, "invites", token), {
      ...data,
      createdAt: serverTimestamp(),
      expiresAt: new Date(expiresAt)
    });
  } else {
    const invites = getDemoInvites();
    invites[token] = { ...data, createdAt, expiresAt };
    setDemoInvites(invites);
  }
  return token;
}

// Récupère une invitation par token. Retourne null si introuvable.
export async function getInvite(token) {
  if (!token) return null;
  if (db) {
    const snap = await getDoc(doc(db, "invites", token));
    if (!snap.exists()) return null;
    const d = snap.data();
    const expiresAt = d.expiresAt && d.expiresAt.toMillis ? d.expiresAt.toMillis() : d.expiresAt;
    return { ...d, token, expiresAt };
  }
  const invites = getDemoInvites();
  const inv = invites[token];
  return inv ? { ...inv, token } : null;
}

// Vrai si l'invitation existe, n'a pas été utilisée et n'a pas expiré.
export function isInviteValid(invite) {
  return !!invite && !invite.used && typeof invite.expiresAt === "number" && Date.now() < invite.expiresAt;
}

// Marque une invitation comme utilisée (appelé après création du compte).
export async function markInviteUsed(token, uid) {
  if (!token) return;
  if (db) {
    await setDoc(doc(db, "invites", token), { used: true, usedBy: uid }, { merge: true });
  } else {
    const invites = getDemoInvites();
    if (invites[token]) {
      invites[token].used = true;
      invites[token].usedBy = uid;
      setDemoInvites(invites);
    }
  }
}
