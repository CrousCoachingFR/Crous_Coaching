import { db } from "./auth.js";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LS_KEY = (uid) => `crous_profile_${uid}`;

const EMPTY = {
  training: [], 
  diet:     [], 
  protocol: [], 
  notes:    "",
  updatedAt: null
};

function uid8() { return Math.random().toString(36).slice(2, 10); }

export async function loadProfile(athleteUid) {
  if (db) {
    const ref = doc(db, "profiles", athleteUid);
    const snap = await getDoc(ref);
    if (snap.exists()) return { ...EMPTY, ...snap.data() };
    await setDoc(ref, { ...EMPTY, createdAt: serverTimestamp() });
    return { ...EMPTY };
  }
  const raw = localStorage.getItem(LS_KEY(athleteUid));
  if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  return { ...EMPTY };
}

export async function saveProfile(athleteUid, profile) {
  const payload = { ...profile, updatedAt: new Date().toISOString() };
  if (db) {
    await setDoc(doc(db, "profiles", athleteUid), {
      ...payload,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } else {
    localStorage.setItem(LS_KEY(athleteUid), JSON.stringify(payload));
  }
  return payload;
}

export function newEntry(section, data) {
  return { id: uid8(), createdAt: new Date().toISOString(), ...data };
}

export async function listAthletes() {
  if (db) {
    const { collection, getDocs, query, where } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );
    const q = query(collection(db, "users"), where("role", "==", "client"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }
  const raw = JSON.parse(localStorage.getItem("crous_demo_users") || "{}");
  return Object.values(raw).filter(u => u.role === "client");
}

export async function listInquiries() {
  if (db) {
    const { collection, getDocs, orderBy, query } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );
    const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return JSON.parse(localStorage.getItem("crous_inquiries") || "[]");
}
