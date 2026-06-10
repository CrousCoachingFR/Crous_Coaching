// =============================================================
// AUTH — Wrapper Firebase Auth + fallback localStorage (mode démo)
// =============================================================

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

// ---------- DEMO MODE (localStorage) ----------------------------
// Used when Firebase config isn't set yet. Lets the UI be fully clickable.

const DEMO_USERS_KEY = "crous_demo_users";
const DEMO_SESSION_KEY = "crous_demo_session";

function getDemoUsers() { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "{}"); }
function setDemoUsers(u) { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(u)); }

function seedDemoIfEmpty() {
  const users = getDemoUsers();
  if (Object.keys(users).length === 0) {
    users["admin@crous.fr"] = {
      uid: "demo-admin",
      email: "admin@crous.fr",
      password: "admin123",
      displayName: "Crous (admin)",
      role: "admin"
    };
    users["theo@example.com"] = {
      uid: "demo-theo",
      email: "theo@example.com",
      password: "athlete123",
      displayName: "Théo Marchand",
      role: "client",
      metrics: "24 ans · 78 kg · 182 cm"
    };
    setDemoUsers(users);
  }
}
seedDemoIfEmpty();

// ---------- PUBLIC API ----------------------------------------

export async function signUp({ email, password, displayName }) {
  if (auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, "users", cred.user.uid), {
      email, displayName, role: "client", createdAt: serverTimestamp()
    });
    return cred.user;
  }
  // demo
  const users = getDemoUsers();
  if (users[email]) throw new Error("Email déjà inscrit");
  const uid = "demo-" + Math.random().toString(36).slice(2, 9);
  users[email] = { uid, email, password, displayName, role: "client" };
  setDemoUsers(users);
  localStorage.setItem(DEMO_SESSION_KEY, email);
  return users[email];
}

export async function signIn({ email, password }) {
  if (auth) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }
  // demo
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
  // demo
  const email = localStorage.getItem(DEMO_SESSION_KEY);
  if (!email) return null;
  const u = getDemoUsers()[email];
  return u || null;
}

// Used by guarded pages
export async function requireAuth(role /* "client" | "admin" | null */) {
  const u = await getCurrentUserWithRole();
  if (!u) { window.location.href = "login.html"; return null; }
  if (role && u.role !== role) {
    // wrong role — bounce
    window.location.href = u.role === "admin" ? "admin.html" : "dashboard.html";
    return null;
  }
  return u;
}

export function routeAfterLogin(user) {
  if (user.role === "admin") window.location.href = "admin.html";
  else window.location.href = "dashboard.html";
}
