// config.js - Master Device Registry
export const DEVICE_REGISTRY = {
    "SIG-20452634": "REDMI NOTE 14 PRO",
    "SIG-5B0D3A5C": "REALME 8 PRO",
    "SIG-121B8F43": "Techno Camon 40 PRO 5G",
    "SIG-76CE9C42": "REDMI NOTE 12"
};

// Isama mo na rin dito ang Firebase DB connection para isang import na lang lahat
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = { 
    apiKey: "AIzaSyD7SFXKTIx3ocIBD9B5JfWiI_sJmZPpbAI", 
    authDomain: "my-admin-portal-12691.firebaseapp.com", 
    projectId: "my-admin-portal-12691", 
    storageBucket: "my-admin-portal-12691.firebasestorage.app", 
    messagingSenderId: "317015091563", 
    appId: "1:317015091563:web:baab5171d8e0a58acd442e" 
};

// Idagdag ito sa config.js
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
