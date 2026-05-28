const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = 'aaffc4c43b7d54b8d16ca3a956543380';
const BASE = 'https://v3.football.api-sports.io';
const H = { 'x-apisports-key': API_KEY };

const cache = {};
function gc(k) { if (cache[k] && Date.now()-cache[k].t < 300000) return cache[k].d; return null; }
function sc(k,d) { cache[k] = {d, t: Date.now()}; }
function formatDate(d) { return d.toISOString().split('T')[0]; }

function mapFixture(m) {
  return {
    id: m.fixture.id,
    date: m.fixture.date,
    status: m.fixture.status.short,
    minute: m.fixture.status.elapsed,
    venue: m.fixture.venue?.name,
    home: { id: m.teams.home.id, name: m.teams.home.name, logo: m.teams.home.logo, goals: m.goals.home },
    away: { id: m.teams.away.id, name: m.teams.away.name, logo: m.teams.away.logo, goals: m.goals.away },
    league: { id: m.league.id, name: m.league.name, country: m.league.country, logo: m.league.logo, season: m.league.season },
    events: (m.events||[]).filter(e => e.type === 'Goal')
  };
}

// ═══ LIVE ═══
app.get('/api/matches/live', async (req, res) => {
  try {
    const c = gc('live'); if (c) return res.json(c);
    const r = await axios.get(`${BASE}/fixtures`, { params: { live: 'all' }, headers: H });
    const data = (r.data.response||[]).map(mapFixture);
    sc('live', data);
    console.log('✅ Live:', data.length);
    res.json(data);
  } catch(e) { res.json([]); }
});

// ═══ OGGI ═══
app.get('/api/matches/today', async (req, res) => {
  try {
    const c = gc('today'); if (c) return res.json(c);
    const r = await axios.get(`${BASE}/fixtures`, { params: { date: formatDate(new Date()), status: 'NS' }, headers: H });
    const data = (r.data.response||[]).map(mapFixture);
    sc('today', data);
    res.json(data);
  } catch(e) { res.json([]); }
});

// ═══ DOMANI ═══
app.get('/api/matches/tomorrow', async (req, res) => {
  try {
    const c = gc('tomorrow'); if (c) return res.json(c);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const r = await axios.get(`${BASE}/fixtures`, { params: { date: formatDate(tomorrow), status: 'NS' }, headers: H });
    const data = (r.data.response||[]).map(mapFixture);
    sc('tomorrow', data);
    res.json(data);
  } catch(e) { res.json([]); }
});

// ═══ GIOCATORI SQUADRA ═══
app.get('/api/team/:id/players', async (req, res) => {
  const { id } = req.params;
  const season = req.query.season || '2025';
  try {
    const key = `p_${id}_${season}`;
    const c = gc(key); if (c) return res.json(c);
    const r = await axios.get(`${BASE}/players`, { params: { team: id, season }, headers: H });
    const data = (r.data.response||[]).map(p => {
      const s = p.statistics.find(x => (x.games?.minutes||0) > 0) || p.statistics[0] || {};
      return {
        id: p.player.id, name: p.player.name, photo: p.player.photo,
        age: p.player.age, nationality: p.player.nationality,
        position: s.games?.position || '?',
        rating: s.games?.rating || null,
        minutes: s.games?.minutes || 0,
        appearances: s.games?.appearences || 0,
        goals: s.goals?.total || 0,
        assists: s.goals?.assists || 0,
        shots: s.shots?.total || 0,
        shotsOn: s.shots?.on || 0,
        passes: s.passes?.total || 0,
        keyPasses: s.passes?.key || 0,
        dribbles: s.dribbles?.success || 0,
        tackles: s.tackles?.total || 0,
        yellowCards: s.cards?.yellow || 0,
        redCards: s.cards?.red || 0,
        league: s.league?.name || '?'
      };
    }).filter(p => p.minutes > 0 || p.goals > 0)
      .sort((a,b) => (parseFloat(b.rating)||0) - (parseFloat(a.rating)||0))
      .slice(0, 8);
    sc(key, data);
    res.json(data);
  } catch(e) { res.json([]); }
});

// ═══ STORICO GOL GIOCATORE ═══
app.get('/api/player/:id/history', async (req, res) => {
  const { id } = req.params;
  const season = req.query.season || '2025';
  try {
    const key = `hist_${id}_${season}`;
    const c = gc(key); if (c) return res.json(c);
    const r = await axios.get(`${BASE}/fixtures`, {
      params: { player: id, season, last: 5 },
      headers: H
    });
    const history = (r.data.response||[]).map(m => {
      const playerGoals = (m.events||[]).filter(e => e.type==='Goal' && e.player?.id==id).length;
      const isHome = m.teams.home.id == id;
      const myGoals = isHome ? m.goals.home : m.goals.away;
      const oppGoals = isHome ? m.goals.away : m.goals.home;
      return {
        date: m.fixture.date,
        home: m.teams.home.name,
        away: m.teams.away.name,
        score: `${m.goals.home}-${m.goals.away}`,
        goals: playerGoals,
        result: myGoals > oppGoals ? 'W' : myGoals < oppGoals ? 'L' : 'D'
      };
    });
    sc(key, history);
    res.json(history);
  } catch(e) { res.json([]); }
});

// ═══ VERIFICA PICK (chiave per il gioco!) ═══
app.get('/api/verify-pick/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const { fixtureId } = req.query;
  
  try {
    console.log(`🔍 Verifica pick: player ${playerId}, fixture ${fixtureId}`);
    
    // Se abbiamo fixture ID specifico
    if (fixtureId) {
      const r = await axios.get(`${BASE}/fixtures`, {
        params: { id: fixtureId },
        headers: H
      });
      const fixture = r.data.response?.[0];
      if (!fixture) return res.json({ status: 'not_found' });
      
      const fixtureStatus = fixture.fixture.status.short;
      const isFinished = ['FT','AET','PEN'].includes(fixtureStatus);
      const isLive = ['1H','2H','HT','ET'].includes(fixtureStatus);
      
      const playerGoals = (fixture.events||[]).filter(e => 
        e.type === 'Goal' && e.player?.id == playerId
      ).length;
      
      return res.json({
        status: isFinished ? 'finished' : isLive ? 'live' : 'pending',
        fixtureStatus,
        playerGoals,
        scored: playerGoals > 0,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        score: `${fixture.goals.home}-${fixture.goals.away}`,
        minute: fixture.fixture.status.elapsed
      });
    }
    
    // Cerca nelle partite di oggi finite
    const today = formatDate(new Date());
    const r = await axios.get(`${BASE}/fixtures`, {
      params: { date: today, status: 'FT' },
      headers: H
    });
    
    let result = { status: 'not_played', playerGoals: 0, scored: false };
    
    for (const match of r.data.response||[]) {
      const goals = (match.events||[]).filter(e => 
        e.type === 'Goal' && e.player?.id == playerId
      );
      if (goals.length > 0) {
        result = {
          status: 'finished',
          playerGoals: goals.length,
          scored: true,
          home: match.teams.home.name,
          away: match.teams.away.name,
          score: `${match.goals.home}-${match.goals.away}`,
          fixtureId: match.fixture.id
        };
        break;
      }
    }
    
    console.log(`✅ Verifica result:`, result);
    res.json(result);
  } catch(e) {
    console.error('❌ verify-pick:', e.message);
    res.json({ status: 'error', error: e.message });
  }
});

// ═══ PARTITE FINITE OGGI ═══
app.get('/api/matches/finished', async (req, res) => {
  try {
    const today = formatDate(new Date());
    const r = await axios.get(`${BASE}/fixtures`, {
      params: { date: today, status: 'FT' },
      headers: H
    });
    const data = (r.data.response||[]).map(mapFixture);
    res.json(data);
  } catch(e) { res.json([]); }
});

app.listen(3000, () => {
  console.log(`
╔════════════════════════════════════════╗
║   NEXA STREAK MASTER — BACKEND v4     ║
║   Port 3000                            ║
║   ✅ /api/matches/live                ║
║   ✅ /api/matches/today               ║
║   ✅ /api/matches/tomorrow            ║
║   ✅ /api/matches/finished            ║
║   ✅ /api/team/:id/players            ║
║   ✅ /api/player/:id/history          ║
║   ✅ /api/verify-pick/:playerId NEW!  ║
╚════════════════════════════════════════╝
  `);
});
