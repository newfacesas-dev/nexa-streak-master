const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = 'aaffc4c43b7d54b8d16ca3a956543380';
const BASE = 'https://v3.football.api-sports.io';
const H = { 'x-apisports-key': API_KEY };

// TOP LEGHE ONLY
const TOP_LEAGUES = [1, 2, 3, 4, 39, 61, 78, 135, 140, 143, 253, 307, 549];
// 1=Mondiali, 2=Champions, 3=Europa, 4=Europei, 39=Premier, 61=Ligue1
// 78=Bundesliga, 135=SerieA, 140=LaLiga, 143=Copa del Rey, 253=MLS, 307=Saudi, 549=Damallsvenskan

const cache = {};
function gc(k) { if (cache[k] && Date.now()-cache[k].t < 60000) return cache[k].d; return null; }
function sc(k,d,ttl=60000) { cache[k] = {d, t: Date.now(), ttl}; }
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
    events: (m.events||[]).filter(e => e.type === 'Goal' || e.type === 'subst')
  };
}

function filterTopLeagues(matches) {
  return matches.filter(m => TOP_LEAGUES.includes(m.league.id));
}

// ═══ LIVE (solo top leghe) ═══
app.get('/api/matches/live', async (req, res) => {
  try {
    const c = gc('live'); if (c) return res.json(c);
    const r = await axios.get(`${BASE}/fixtures`, { params: { live: 'all' }, headers: H });
    const all = (r.data.response||[]).map(mapFixture);
    const data = filterTopLeagues(all);
    sc('live', data);
    console.log(`✅ Live: ${all.length} totali, ${data.length} top leghe`);
    res.json(data);
  } catch(e) { console.error('❌',e.message); res.json([]); }
});

// ═══ OGGI ═══
app.get('/api/matches/today', async (req, res) => {
  try {
    const c = gc('today'); if (c) return res.json(c);
    const today = formatDate(new Date());
    const r = await axios.get(`${BASE}/fixtures`, { params: { date: today }, headers: H });
    const all = (r.data.response||[]).map(mapFixture);
    const data = filterTopLeagues(all);
    sc('today', data);
    console.log(`✅ Today: ${data.length} top leghe`);
    res.json(data);
  } catch(e) { res.json([]); }
});

// ═══ DOMANI ═══
app.get('/api/matches/tomorrow', async (req, res) => {
  try {
    const c = gc('tomorrow'); if (c) return res.json(c);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const r = await axios.get(`${BASE}/fixtures`, { params: { date: formatDate(tomorrow) }, headers: H });
    const all = (r.data.response||[]).map(mapFixture);
    const data = filterTopLeagues(all);
    sc('tomorrow', data);
    console.log(`✅ Tomorrow: ${data.length} top leghe`);
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
      .slice(0, 10);
    sc(key, data, 300000);
    res.json(data);
  } catch(e) { res.json([]); }
});

// ═══ STORICO GOL + ASSIST GIOCATORE ═══
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
      const playerAssists = (m.events||[]).filter(e => e.type==='Goal' && e.assist?.id==id).length;
      const isHome = m.teams.home.players?.some(p => p.player.id==id);
      const myGoals = isHome ? m.goals.home : m.goals.away;
      const oppGoals = isHome ? m.goals.away : m.goals.home;
      return {
        date: m.fixture.date,
        home: m.teams.home.name,
        away: m.teams.away.name,
        score: `${m.goals.home}-${m.goals.away}`,
        goals: playerGoals,
        assists: playerAssists,
        result: myGoals > oppGoals ? 'W' : myGoals < oppGoals ? 'L' : 'D'
      };
    });
    sc(key, history, 300000);
    res.json(history);
  } catch(e) { res.json([]); }
});

// ═══ VERIFICA PICK (gol + assist + doppietta) ═══
app.get('/api/verify-pick/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const { fixtureId, pickType } = req.query;
  // pickType: 'goal' | 'assist' | 'double' | 'triple'

  try {
    console.log(`🔍 Verifica: player ${playerId}, type: ${pickType||'goal'}`);

    let fixtures = [];

    if (fixtureId) {
      const r = await axios.get(`${BASE}/fixtures`, { params: { id: fixtureId }, headers: H });
      fixtures = r.data.response || [];
    } else {
      const today = formatDate(new Date());
      const r = await axios.get(`${BASE}/fixtures`, { params: { date: today }, headers: H });
      fixtures = r.data.response || [];
    }

    for (const match of fixtures) {
      const status = match.fixture.status.short;
      const isFinished = ['FT','AET','PEN'].includes(status);
      const isLive = ['1H','2H','HT','ET'].includes(status);

      const playerGoals = (match.events||[]).filter(e =>
        e.type === 'Goal' && e.player?.id == playerId &&
        e.detail !== 'Missed Penalty' && e.detail !== 'Own Goal'
      ).length;

      const playerAssists = (match.events||[]).filter(e =>
        e.type === 'Goal' && e.assist?.id == playerId
      ).length;

      // Controlla se il giocatore ha partecipato
      const involved = playerGoals > 0 || playerAssists > 0;
      if (!involved && !isFinished && !isLive) continue;

      let scored = false;
      let resultMsg = '';

      switch(pickType) {
        case 'assist':
          scored = playerAssists >= 1;
          resultMsg = scored ? `🎯 ${playerAssists} assist` : 'Nessun assist';
          break;
        case 'double':
          scored = playerGoals >= 2;
          resultMsg = scored ? `⚽⚽ DOPPIETTA! ${playerGoals} gol` : `Solo ${playerGoals} gol`;
          break;
        case 'triple':
          scored = playerGoals >= 3;
          resultMsg = scored ? `⚽⚽⚽ TRIPLETTA! ${playerGoals} gol` : `Solo ${playerGoals} gol`;
          break;
        case 'goal_assist':
          scored = playerGoals >= 1 && playerAssists >= 1;
          resultMsg = scored ? `⚽🎯 Gol+Assist!` : `${playerGoals} gol, ${playerAssists} assist`;
          break;
        default: // 'goal'
          scored = playerGoals >= 1;
          resultMsg = scored ? `⚽ ${playerGoals} gol` : 'Nessun gol';
      }

      return res.json({
        status: isFinished ? 'finished' : isLive ? 'live' : 'pending',
        fixtureStatus: status,
        playerGoals,
        playerAssists,
        scored,
        resultMsg,
        pickType: pickType || 'goal',
        home: match.teams.home.name,
        away: match.teams.away.name,
        score: `${match.goals.home}-${match.goals.away}`,
        minute: match.fixture.status.elapsed,
        fixtureId: match.fixture.id
      });
    }

    res.json({ status: 'not_found', scored: false, playerGoals: 0, playerAssists: 0 });
  } catch(e) {
    console.error('❌ verify:', e.message);
    res.json({ status: 'error', error: e.message });
  }
});

// ═══ GIOCATORE DEL GIORNO ═══
app.get('/api/player-of-day', async (req, res) => {
  try {
    const c = gc('pod'); if (c) return res.json(c);
    const today = formatDate(new Date());

    // Prendi partite finite oggi nelle top leghe
    const r = await axios.get(`${BASE}/fixtures`, {
      params: { date: today, status: 'FT' },
      headers: H
    });

    const topMatches = filterTopLeagues((r.data.response||[]).map(m => m));
    
    let bestPlayer = null;
    let bestScore = 0;

    for (const match of topMatches) {
      const events = match.events || [];
      const scorers = {};
      const assisters = {};

      events.forEach(e => {
        if (e.type === 'Goal' && e.detail !== 'Own Goal' && e.detail !== 'Missed Penalty') {
          const pid = e.player?.id;
          if (pid) scorers[pid] = (scorers[pid] || 0) + 1;
        }
        if (e.type === 'Goal' && e.assist?.id) {
          const pid = e.assist.id;
          assisters[pid] = (assisters[pid] || 0) + 1;
        }
      });

      // Calcola score per ogni giocatore
      Object.entries(scorers).forEach(([pid, goals]) => {
        const assists = assisters[pid] || 0;
        const score = goals * 3 + assists; // gol vale 3, assist 1
        if (score > bestScore) {
          bestScore = score;
          const event = events.find(e => e.player?.id == pid);
          bestPlayer = {
            id: pid,
            name: event?.player?.name || 'Unknown',
            goals,
            assists,
            score,
            match: `${match.teams.home.name} vs ${match.teams.away.name}`,
            matchScore: `${match.goals.home}-${match.goals.away}`,
            league: match.league.name
          };
        }
      });
    }

    const result = bestPlayer || null;
    sc('pod', result, 300000);
    res.json(result);
  } catch(e) {
    console.error('❌ pod:', e.message);
    res.json(null);
  }
});

// ═══ MONDIALI ═══
app.get('/api/matches/worldcup', async (req, res) => {
  try {
    const c = gc('worldcup'); if (c) return res.json(c);
    const liveRes = await axios.get(`${BASE}/fixtures`, {
      params: { live: 'all', league: 1, season: 2026 }, headers: H
    });
    const todayRes = await axios.get(`${BASE}/fixtures`, {
      params: { league: 1, season: 2026, date: formatDate(new Date()) }, headers: H
    });
    const all = [...(liveRes.data.response||[]), ...(todayRes.data.response||[])];
    const unique = all.filter((m,i,arr) => arr.findIndex(x=>x.fixture.id===m.fixture.id)===i);
    const data = unique.map(mapFixture);
    sc('worldcup', data);
    res.json(data);
  } catch(e) { res.json([]); }
});

// ═══ TOP SCORER MONDIALI ═══
app.get('/api/worldcup/topscorers', async (req, res) => {
  try {
    const c = gc('wc_top'); if (c) return res.json(c);
    const r = await axios.get(`${BASE}/players/topscorers`, {
      params: { league: 1, season: 2026 }, headers: H
    });
    const data = (r.data.response||[]).slice(0,20).map(p => ({
      id: p.player.id, name: p.player.name, photo: p.player.photo,
      nationality: p.player.nationality,
      goals: p.statistics[0]?.goals?.total || 0,
      assists: p.statistics[0]?.goals?.assists || 0,
      rating: p.statistics[0]?.games?.rating || null,
      team: p.statistics[0]?.team?.name || '?',
      teamLogo: p.statistics[0]?.team?.logo || ''
    }));
    sc('wc_top', data, 300000);
    res.json(data);
  } catch(e) { res.json([]); }
});

app.listen(3000, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   NEXA STREAK MASTER — BACKEND v5        ║
║   ✅ Solo TOP leghe (Serie A, PL, ecc)   ║
║   ✅ Verifica: gol/assist/doppietta      ║
║   ✅ Giocatore del giorno                ║
║   ✅ Mondiali 2026 ready                 ║
╚══════════════════════════════════════════╝
  `);
});
