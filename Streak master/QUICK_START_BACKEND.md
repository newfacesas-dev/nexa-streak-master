# 🚀 NEXA STREAK MASTER - QUICK START GUIDE

## Avviare il Backend Localmente

---

## 📋 REQUISITI

```
✅ Node.js v16+ installato
✅ npm o yarn
✅ API Key: aaffc4c43b7d54b8d16ca3a956543380
✅ Terminal/CMD
```

---

## 🏃 SETUP VELOCE (5 minuti)

### Step 1: Installare dipendenze

```bash
# Vai nella cartella del backend
cd path/to/nexa-streak-backend

# Installa le dipendenze
npm install

# Output atteso:
# added 85 packages...
```

### Step 2: Creare file .env

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

### Step 3: Avviare il server

```bash
# Development mode (auto-reload)
npm run dev

# Output atteso:
# ╔════════════════════════════════════╗
# ║  NEXA STREAK MASTER - Backend      ║
# ║  Server running on port 3000       ║
# ║  API Key: aaffc4c... ✓             ║
# ║  Rate Limit: 300 r/m               ║
# ║  Cache: 10 minutes                 ║
# ╚════════════════════════════════════╝
```

### Step 4: Test il server

Apri il browser e vai a:

```
http://localhost:3000/health
```

Risposta attesa:
```json
{
  "status": "OK",
  "uptime": 123.45,
  "api_key": "LOADED",
  "rate_limit": "1/300"
}
```

---

## 🧪 TEST GLI ENDPOINT

Usa cURL o Postman:

### 1️⃣ Partite LIVE

```bash
curl http://localhost:3000/api/matches/live

# Risposta:
# [
#   {
#     "id": 123456,
#     "status": "LIVE",
#     "minute": 45,
#     "home": { "name": "Inter", "goals": 2 },
#     "away": { "name": "Napoli", "goals": 1 }
#   }
# ]
```

### 2️⃣ Top Scorers Serie A

```bash
# League ID: 135 = Serie A
curl http://localhost:3000/api/standings/topscorers/135

# Risposta:
# [
#   { "rank": 1, "name": "Lautaro", "goals": 15, ... }
# ]
```

### 3️⃣ Classifica Serie A

```bash
curl http://localhost:3000/api/standings/135

# Risposta:
# [
#   { "rank": 1, "team": "Inter", "points": 85 }
# ]
```

---

## 🔌 INTEGRARE NEL FRONTEND

Modifica il file HTML:

```javascript
// Aggiungi questo nel <script>

const BACKEND_URL = 'http://localhost:3000'; // Development
// const BACKEND_URL = 'https://your-production-url'; // Production

// Funzione per fetcare dati dal backend
async function fetchFromBackend(endpoint) {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Errore:', error);
  }
}

// Esempio: Carica le partite LIVE
async function loadLiveMatches() {
  const matches = await fetchFromBackend('/api/matches/live');
  console.log('Partite LIVE:', matches);
  
  // Aggiorna il frontend con i dati reali
  // ...
}

// Chiama quando la pagina carica
document.addEventListener('DOMContentLoaded', loadLiveMatches);
```

---

## 📊 LEAGUE IDs PER SERIE A E ALTRE LEGHE

```
Serie A: 135
Premier League: 39
La Liga: 140
Bundesliga: 78
Ligue 1: 61
Eredivisie: 88
Liga Portugal: 94
```

Usa questi IDs negli endpoint:

```
/api/standings/:leagueId
/api/standings/topscorers/:leagueId
/api/injuries/:teamId
```

---

## 🛠️ COMANDI UTILI

```bash
# Development (auto-reload)
npm run dev

# Production
npm start

# Installa una nuova dipendenza
npm install package-name

# Cancella node_modules (se problemi)
rm -rf node_modules
npm install
```

---

## 🔐 VARIABILI ENVIRONMENT

File `.env`:

```env
API_KEY=aaffc4c43b7d54b8d16ca3a956543380
PORT=3000
NODE_ENV=development
RATE_LIMIT_PER_MINUTE=300
```

---

## 🚨 ERRORI COMUNI

### Error: Cannot find module 'express'

```bash
→ Soluzione: npm install
```

### Error: Port 3000 already in use

```bash
→ Soluzione: Cambia PORT in .env
→ Oppure: killall node (Mac/Linux)
```

### Error: API Key invalid

```bash
→ Soluzione: Verifica che la key sia in .env
→ Riavvia il server
```

### CORS error nel frontend

```bash
→ Soluzione: Il backend ha CORS abilitato
→ Verifica l'URL nel fetch
→ Assicurati che il backend sia online
```

---

## 📈 RATE LIMITING

```
Rate Limit: 300 requests per minute
Cioè: 5 requests per secondo max

Se superato:
→ Errore 429 "Too Many Requests"
→ Aspetta 1 minuto prima di rifare il request
```

---

## 💾 CACHING

Il backend fa cache di:
```
- Live matches: 10 minuti
- Player stats: 10 minuti
- Standings: 10 minuti
- Top scorers: 10 minuti
```

Per refreshare manualmente i dati:
```bash
# Ricomincia il server: npm run dev
# Oppure aspetta 10 minuti
```

---

## 🎯 PROSSIMI STEP

```
1. [✓] Backend running localmente
2. [ ] Test tutti gli endpoint
3. [ ] Integra nel frontend HTML
4. [ ] Test il flusso completo
5. [ ] Deploy su Vercel/Railway
6. [ ] App LIVE! 🚀
```

---

## 📞 SUPPORTO

Se hai problemi:

1. Verifica che Node.js sia installato:
   ```bash
   node --version
   ```

2. Controlla l'API Key in .env

3. Vedi i logs del server

4. Riavvia il server: `npm run dev`

---

**TI SERVE AIUTO? Contattami!** 💬
