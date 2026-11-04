# CrisisLens: Multimodal Evidence-Aware Disaster Intelligence Platform

> **Meta Global AI Developer Hackathon 2026**  
> Evidence-Aware Multimodal Disaster Intelligence with Chronological Timeline Reconstruction, RAG Standard Operating Procedures, and Emergency Dispatch Integration.

---

## 🌟 Key Capabilities

1. **Chronological Ground-Truth Reconstruction**:
   - Disentangles ground observation timestamps (`observed_at`) from late platform receipt times (`submitted_at`) caused by storm-induced cell tower disruptions.
   - Automatically orders events into true chronological sequence with uncertainty metrics.

2. **Meta Muse Spark Multimodal Synthesis**:
   - Synthesizes heterogeneous evidence (citizen photos, river gauges, LoRaWAN telemetry, aerial drone orthomosaics, and responder reports).
   - Extracts primary hazard, damage modes, and visible structural/flood evidence.

3. **Inviolable Disaster Safety Invariants & Guardrails**:
   - Enforces the non-authoritative advisory principle: AI models are strictly **prohibited from declaring roadways, bridges, or structures 100% safe**.
   - Mandatory human-in-the-loop responder verification workflow.

4. **Evidence-Aware RAG Knowledge Base**:
   - Grounded in official disaster management protocols from **FEMA (P-259)** and **NDMA (National Disaster Management Authority)** standard operating procedures.
   - Context-aware retrieval with mandated responder actions and source document citations.

5. **Emergency Dispatch Network**:
   - Real-time directory and dispatch system for City Police Control Rooms, General Hospitals, and FEMA/NDMA nodes.
   - Dynamic Haversine distance ranking and audit logging for dispatch status transitions (*Pending Responder Verification* ➔ *Dispatched & Verified*).

---

## 🚀 Running the Application

### Local Development (Full-Stack in Port 3000)
```bash
# Install dependencies
npm install

# Start development server (serves frontend + Express API on port 3000)
npm run dev

# Build for production
npm run build
```

---

## ☁️ Deployment Guide

### Frontend Deployment on Vercel
1. Import repository on [Vercel.com](https://vercel.com).
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - `VITE_BACKEND_URL`: `https://crisislens-backend-oc50.onrender.com` (or your active Render URL)
6. Hit **Deploy**!

### Backend Deployment on Render.com
1. Create a Web Service on [Render.com](https://render.com).
2. Build Command: `pip install -r requirements.txt` (or Node.js `npm run build && npm start`)
3. Set environment variable: `CORS_ORIGINS=["*"]`
4. Copy your live Render URL into the CrisisLens frontend connection settings.

---

## 🛡️ License & Advisory Disclaimer
Advisory decision support only. Not an authoritative emergency response entity. Physical ground inspection by certified civil engineers or Incident Command Safety Officers is mandatory prior to transit route clearance.