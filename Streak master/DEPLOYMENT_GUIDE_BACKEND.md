# 🚀 NEXA STREAK MASTER - DEPLOYMENT GUIDE

## Backend Deployment - Come fare il LIVE

---

## 📋 OPZIONE 1: DEPLOY SU VERCEL (Consigliato - FREE)

### Step 1: Preparare il codice

```bash
# 1. Crea una cartella per il backend
mkdir nexa-streak-backend
cd nexa-streak-backend

# 2. Inizializza git
git init

# 3. Copia i file:
# - backend_server.js
# - package.json
# - .env.example
```

### Step 2: Setup Vercel

```bash
# 1. Installa Vercel CLI
npm install -g vercel

# 2. Login a Vercel
vercel login

# 3. Deploy
vercel --prod

# DONE! Il backend è online 🎉
```

### Step 3: Configurare le variabili di ambiente

```
Dashboard Vercel → Progetto → Settings → Environment Variables

Aggiungi:
- API_KEY = aaffc4c43b7d54b8d16ca3a956543380
- PORT = 3000
- NODE_ENV = production
```

### URL Backend su Vercel:
```
https://your-project-name.vercel.app
```

---

## 🚂 OPZIONE 2: DEPLOY SU RAILWAY (Free tier - 5$ gratis)

### Step 1: Registrarsi

```bash
# Vai su: https://railway.app
# Signup con GitHub
```

### Step 2: Creare nuovo progetto

```bash
# 1. Clicca "New Project"
# 2. Seleziona "Deploy from GitHub"
# 3. Connetti il tuo repository
# 4. Railway auto-deploy!
```

### Step 3: Configurare variabili

```
Dashboard → Variables

Aggiungi:
API_KEY = aaffc4c43b7d54b8d16ca3a956543380
PORT = 3000
NODE_ENV = production
```

### URL Backend su Railway:
```
https://your-project-name.up.railway.app
```

---

## 🏠 OPZIONE 3: DEPLOY LOCALE (Per testing)

### Step 1: Installare dipendenze

```bash
npm install
```

### Step 2: Creare file .env

```bash
cp .env.example .env

# Modifica .env con le tue variabili
# API_KEY è già presente
```

### Step 3: Avviare il server

```bash
# Development (con nodemon)
npm run dev

# Production
npm start

# Server running on: http://localhost:3000
```

---

## 📊 ENDPOINT DISPONIBILI

Una volta online, accedi a questi endpoint:

### 1️⃣ Partite LIVE

```
GET /api/matches/live

Risposta:
{
  "id": 123456,
  "status": "LIVE",
  "minute": 45,
  "home": { "name": "Inter", "goals": 2 },
  "away": { "name": "Napoli", "goals": 1 }
}
```

### 2️⃣ Dettagli Partita

```
GET /api/match/:matchId

Risposta:
{
  "id": 123456,
  "status": "LIVE",
  "minute": 45,
  "statistics": { ... },
  "events": [ ... ]
}
```

### 3️⃣ Statistiche Giocatore

```
GET /api/player/:playerId/stats

Risposta:
{
  "name": "Lautaro Martinez",
  "goals": 12,
  "assists": 3,
  "rating": 8.5,
  "stats": { ... }
}
```

### 4️⃣ Top Scorers

```
GET /api/standings/topscorers/:leagueId

Risposta:
[
  { "rank": 1, "name": "Player", "goals": 15 },
  { "rank": 2, "name": "Player", "goals": 14 }
]
```

### 5️⃣ Classifica

```
GET /api/standings/:leagueId

Risposta:
[
  { "rank": 1, "team": "Inter", "points": 85 },
  { "rank": 2, "team": "Napoli", "points": 80 }
]
```

### 6️⃣ Infortuni

```
GET /api/injuries/:teamId

Risposta:
[
  { "name": "Player", "reason": "Injury", "position": "FW" }
]
```

### 7️⃣ Health Check

```
GET /health

Risposta:
{
  "status": "OK",
  "uptime": 3600,
  "api_key": "LOADED",
  "rate_limit": "45/300"
}
```

---

## 🔌 INTEGRARE NEL FRONTEND

### Modificare il file HTML

```javascript
// Aggiungi all'inizio dello script
const BACKEND_URL = 'https://your-backend-url.vercel.app';

// Esempio: Fetcha le partite LIVE
async function getLiveMatches() {
  const response = await fetch(`${BACKEND_URL}/api/matches/live`);
  const matches = await response.json();
  console.log(matches);
}

// Chiama quando la pagina carica
getLiveMatches();
```

---

## 🔐 SECURITY

### Rate Limiting

```
- Free Plan: 10 requests/min (troppo pochi)
- Pro Plan: 300 requests/min ✅ (consigliato)
- Ultra Plan: 450 requests/min
```

Il backend ha rate limiting integrato a 300 r/m.

### Proteggere l'API Key

```
❌ MAI inserire la key nel frontend
✅ Usa il backend come proxy
✅ Il backend protegge la key
```

---

## 📈 SCALING

### Se il traffico aumenta

```
1. Aggiorna il piano API-Football
2. Aggiungi Redis per caching
3. Usa CDN (Cloudflare gratuito)
4. Aggiungi database (Firebase gratuito)
```

---

## 🐛 TROUBLESHOOTING

### Error: Rate limit exceeded

```
→ Troppi requests al backend
→ Aspetta 1 minuto
→ O aggiorna il piano API-Football
```

### Error: API Key invalid

```
→ Controlla che API_KEY sia corretta
→ Assicurati che sia in .env
→ Riavvia il server
```

### Error: CORS

```
→ Il frontend non può accedere al backend
→ Verifica che CORS sia abilitato nel backend
→ Controlla l'URL del backend nel frontend
```

---

## 📞 SUPPORT

```
- API-Football: support via chat su api-football.com
- Vercel: vercel.com/support
- Railway: railway.app/support
```

---

## ✅ CHECKLIST DEPLOYMENT

```
[ ] Iscritto a api-football.com (PRO Plan)
[ ] API Key salvata
[ ] Repository GitHub creato
[ ] Backend files caricati
[ ] .env configurato
[ ] Vercel/Railway collegato
[ ] Deploy completato
[ ] Health check funziona (/health)
[ ] Endpoints testati
[ ] Frontend collegato al backend
[ ] LIVE! 🚀
```

---

## 🎯 PROSSIMI STEP

1. **Deploy il backend** su Vercel/Railway
2. **Test tutti gli endpoint** con Postman
3. **Collega il frontend** al backend
4. **Test il flusso completo**
5. **Lancio pubblico!**

---

**DOMANDE? Contattami!** 💬
