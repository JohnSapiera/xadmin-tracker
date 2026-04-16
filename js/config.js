// js/config.js - Master Device Registry & Firebase Configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== INTEL OPERATION TERMS =====
export const INTEL_TERMS = [
  "INTEL_ACQUISITION",
  "BLACK_OP_SUBSISTENCE",
  "FIELD_LOGISTICS",
  "TACTICAL_RECON",
  "SIGNAL_ENCRYPTION",
  "COVERT_SURVEILLANCE",
  "ASSET_MAINTENANCE",
  "NETWORK_PENETRATION",
  "ENCRYPTED_UPLINK",
  "OPERATIONAL_OVERHEAD"
];

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyD7SFXKTIx3ocIBD9B5JfWiI_sJmZPpbAI",
  authDomain: "my-admin-portal-12691.firebaseapp.com",
  projectId: "my-admin-portal-12691",
  storageBucket: "my-admin-portal-12691.firebasestorage.app",
  messagingSenderId: "317015091563",
  appId: "1:317015091563:web:baab5171d8e0a58acd442e"
};

// ===== INITIALIZE FIREBASE =====
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
