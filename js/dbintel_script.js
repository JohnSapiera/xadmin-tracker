// js/script.js
// CIA Profiles Main Logic
// ========================================

// ⭐ IMPORT FROM SAME FOLDER (js/)
import { db, DEVICE_REGISTRY, INTEL_TERMS } from "./config.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("✅ Modules loaded successfully");
console.log("DB:", db);
console.log("DEVICE_REGISTRY:", DEVICE_REGISTRY);

// ====== GLOBAL STATE ======
let deviceData = {};
let allMissions = [];
const currentAgent = localStorage.getItem("cia_agent") || "UNKNOWN_AGENT";

console.log("Current Agent:", currentAgent);

