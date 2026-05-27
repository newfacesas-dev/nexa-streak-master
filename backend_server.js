const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const API_KEY = 'aaffc4c43b7d54b8d16ca3a956543380';
const FOOTBALL_API_URL = 'https://v3.football.api-sports.io';

app.get('/api/matches/live', async (req, res) => {
  try {
    console.log('🔄 Fetching live matches from api-football...');
    const response = await axios.get(`${FOOTBALL_API_URL}/fixtures`, {
      params: { season: 2026, status: 'NS' },
      headers: { 'x-apisports-key': API_KEY }
    });

    console.log('✅ API Response:', response.data.response?.length || 0, 'matches');
    
    const matches = (response.data.response || []).map(m => ({
      id: m.fixture.id,
      status: m.fixture.status.short,
      minute: m.fixture.status.elapsed || 0,
      home: { name: m.teams.home.name, logo: m.teams.home.logo, goals: m.goals.home },
      away: { name: m.teams.away.name, logo: m.teams.away.logo, goals: m.goals.away },
      league: { name: m.league.name, id: m.league.id, season: m.league.season, country: m.league.country }
    }));
    
    res.json(matches);
  } catch (error) {
    console.error('❌ API ERROR:', error.message);
    console.error('Response:', error.response?.data || 'No response');
    res.json([]);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', api_key: 'LOADED', mode: 'LIVE API' });
});

app.listen(3000, () => {
  console.log('\n╔════════════════════════════════════╗\n║  NEXA STREAK MASTER - LIVE API    ║\n║  Server running on port 3000       ║\n║  ✅ Tutte le leghe disponibili     ║\n║  ✅ Dati REALI da api-football    ║\n╚════════════════════════════════════╝\n');
});

module.exports = app;
