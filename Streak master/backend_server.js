// NEXA STREAK MASTER - Backend Server
// Node.js + Express + API-Football Integration
// Rate Limiting + Caching + Real-time Data

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache

// API Configuration
const API_KEY = 'aaffc4c43b7d54b8d16ca3a956543380';
const FOOTBALL_API_URL = 'https://api.api-football.com/v3';

// Rate limiting variables
let requestCount = 0;
const RATE_LIMIT_PER_MINUTE = 300;
const RATE_LIMIT_RESET = 60000; // 1 minute

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiter Middleware
app.use((req, res, next) => {
  requestCount++;
  
  if (requestCount > RATE_LIMIT_PER_MINUTE) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Max ${RATE_LIMIT_PER_MINUTE} requests per minute`
    });
  }

  setTimeout(() => {
    requestCount = 0;
  }, RATE_LIMIT_RESET);

  next();
});

// Logger
const logger = (endpoint, status) => {
  console.log(`[${new Date().toISOString()}] ${endpoint} - Status: ${status}`);
};

// ===== LIVE MATCHES ENDPOINT =====
app.get('/api/matches/live', async (req, res) => {
  try {
    const cachedData = cache.get('live_matches');
    if (cachedData) {
      logger('/api/matches/live', '200 (cached)');
      return res.json(cachedData);
    }

    const response = await axios.get(
      `${FOOTBALL_API_URL}/fixtures`,
      {
        params: {
          live: 'all',
          league: 135, // Serie A
          season: 2024
        },
        headers: {
          'x-apisports-key': API_KEY
        }
      }
    );

    const matches = response.data.response.map(match => ({
      id: match.fixture.id,
      status: match.fixture.status.short,
      statusLong: match.fixture.status.long,
      minute: match.fixture.status.elapsed,
      home: {
        name: match.teams.home.name,
        logo: match.teams.home.logo,
        goals: match.goals.home
      },
      away: {
        name: match.teams.away.name,
        logo: match.teams.away.logo,
        goals: match.goals.away
      },
      league: {
        name: match.league.name,
        season: match.league.season
      }
    }));

    cache.set('live_matches', matches);
    logger('/api/matches/live', '200');
    res.json(matches);
  } catch (error) {
    logger('/api/matches/live', error.status || '500');
    res.status(error.status || 500).json({
      error: 'Failed to fetch live matches',
      message: error.message
    });
  }
});

// ===== MATCH DETAILS ENDPOINT =====
app.get('/api/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const cachedData = cache.get(`match_${matchId}`);
    
    if (cachedData) {
      logger(`/api/match/${matchId}`, '200 (cached)');
      return res.json(cachedData);
    }

    const response = await axios.get(
      `${FOOTBALL_API_URL}/fixtures`,
      {
        params: {
          id: matchId
        },
        headers: {
          'x-apisports-key': API_KEY
        }
      }
    );

    const match = response.data.response[0];
    const statistics = match.statistics || [];

    const matchData = {
      id: match.fixture.id,
      status: match.fixture.status.short,
      minute: match.fixture.status.elapsed,
      home: {
        name: match.teams.home.name,
        goals: match.goals.home,
        players: match.players.home || []
      },
      away: {
        name: match.teams.away.name,
        goals: match.goals.away,
        players: match.players.away || []
      },
      statistics: {
        home: statistics[0]?.statistics || [],
        away: statistics[1]?.statistics || []
      },
      events: match.events || []
    };

    cache.set(`match_${matchId}`, matchData);
    logger(`/api/match/${matchId}`, '200');
    res.json(matchData);
  } catch (error) {
    logger(`/api/match/${matchId}`, error.status || '500');
    res.status(error.status || 500).json({
      error: 'Failed to fetch match details',
      message: error.message
    });
  }
});

// ===== PLAYER STATISTICS ENDPOINT =====
app.get('/api/player/:playerId/stats', async (req, res) => {
  try {
    const { playerId } = req.params;
    const cachedData = cache.get(`player_${playerId}`);

    if (cachedData) {
      logger(`/api/player/${playerId}/stats`, '200 (cached)');
      return res.json(cachedData);
    }

    const response = await axios.get(
      `${FOOTBALL_API_URL}/players`,
      {
        params: {
          id: playerId,
          season: 2024
        },
        headers: {
          'x-apisports-key': API_KEY
        }
      }
    );

    const player = response.data.response[0].player;
    const statistics = response.data.response[0].statistics[0];

    const playerStats = {
      id: player.id,
      name: player.name,
      age: player.age,
      nationality: player.nationality,
      photo: player.photo,
      stats: {
        games: {
          appearences: statistics.games.appearences,
          minutes: statistics.games.minutes,
          position: statistics.games.position,
          rating: statistics.games.rating
        },
        shots: {
          total: statistics.shots.total,
          on: statistics.shots.on
        },
        goals: {
          total: statistics.goals.total,
          assists: statistics.goals.assists
        },
        passes: {
          total: statistics.passes.total,
          key: statistics.passes.key,
          accuracy: statistics.passes.accuracy
        },
        tackles: {
          total: statistics.tackles.total,
          blocks: statistics.tackles.blocks,
          interceptions: statistics.tackles.interceptions
        },
        duels: {
          total: statistics.duels.total,
          won: statistics.duels.won
        },
        dribbles: {
          attempts: statistics.dribbles.attempts,
          success: statistics.dribbles.success
        },
        fouls: {
          drawn: statistics.fouls.drawn,
          committed: statistics.fouls.committed
        },
        cards: {
          yellow: statistics.cards.yellow,
          red: statistics.cards.red
        }
      }
    };

    cache.set(`player_${playerId}`, playerStats);
    logger(`/api/player/${playerId}/stats`, '200');
    res.json(playerStats);
  } catch (error) {
    logger(`/api/player/${playerId}/stats`, error.status || '500');
    res.status(error.status || 500).json({
      error: 'Failed to fetch player statistics',
      message: error.message
    });
  }
});

// ===== TOP SCORERS ENDPOINT =====
app.get('/api/standings/topscorers/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const cachedData = cache.get(`topscorers_${leagueId}`);

    if (cachedData) {
      logger(`/api/standings/topscorers/${leagueId}`, '200 (cached)');
      return res.json(cachedData);
    }

    const response = await axios.get(
      `${FOOTBALL_API_URL}/players/topscorers`,
      {
        params: {
          league: leagueId,
          season: 2024
        },
        headers: {
          'x-apisports-key': API_KEY
        }
      }
    );

    const topScorers = response.data.response.map((player, index) => ({
      rank: index + 1,
      id: player.player.id,
      name: player.player.name,
      team: player.statistics[0].team.name,
      goals: player.statistics[0].goals.total,
      assists: player.statistics[0].goals.assists,
      games: player.statistics[0].games.appearences,
      photo: player.player.photo
    }));

    cache.set(`topscorers_${leagueId}`, topScorers);
    logger(`/api/standings/topscorers/${leagueId}`, '200');
    res.json(topScorers);
  } catch (error) {
    logger(`/api/standings/topscorers/${leagueId}`, error.status || '500');
    res.status(error.status || 500).json({
      error: 'Failed to fetch top scorers',
      message: error.message
    });
  }
});

// ===== LEAGUE STANDINGS ENDPOINT =====
app.get('/api/standings/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const cachedData = cache.get(`standings_${leagueId}`);

    if (cachedData) {
      logger(`/api/standings/${leagueId}`, '200 (cached)');
      return res.json(cachedData);
    }

    const response = await axios.get(
      `${FOOTBALL_API_URL}/standings`,
      {
        params: {
          league: leagueId,
          season: 2024
        },
        headers: {
          'x-apisports-key': API_KEY
        }
      }
    );

    const standings = response.data.response[0].league.standings[0].map((team) => ({
      rank: team.rank,
      team: team.team.name,
      logo: team.team.logo,
      points: team.points,
      goalsFor: team.goalsDiff,
      goalsAgainst: team.goals.against,
      games: team.all.played,
      wins: team.all.win,
      draws: team.all.draw,
      losses: team.all.lose
    }));

    cache.set(`standings_${leagueId}`, standings);
    logger(`/api/standings/${leagueId}`, '200');
    res.json(standings);
  } catch (error) {
    logger(`/api/standings/${leagueId}`, error.status || '500');
    res.status(error.status || 500).json({
      error: 'Failed to fetch standings',
      message: error.message
    });
  }
});

// ===== INJURIES ENDPOINT =====
app.get('/api/injuries/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const cachedData = cache.get(`injuries_${teamId}`);

    if (cachedData) {
      logger(`/api/injuries/${teamId}`, '200 (cached)');
      return res.json(cachedData);
    }

    const response = await axios.get(
      `${FOOTBALL_API_URL}/players`,
      {
        params: {
          team: teamId,
          season: 2024
        },
        headers: {
          'x-apisports-key': API_KEY
        }
      }
    );

    const injuries = response.data.response
      .filter(p => p.player.injured)
      .map(p => ({
        id: p.player.id,
        name: p.player.name,
        team: p.statistics[0].team.name,
        position: p.statistics[0].games.position,
        reason: p.player.injuryReason || 'Unknown',
        photo: p.player.photo
      }));

    cache.set(`injuries_${teamId}`, injuries);
    logger(`/api/injuries/${teamId}`, '200');
    res.json(injuries);
  } catch (error) {
    logger(`/api/injuries/${teamId}`, error.status || '500');
    res.status(error.status || 500).json({
      error: 'Failed to fetch injuries',
      message: error.message
    });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    api_key: API_KEY ? 'LOADED' : 'MISSING',
    requests_this_minute: requestCount,
    rate_limit: `${requestCount}/${RATE_LIMIT_PER_MINUTE}`
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║  NEXA STREAK MASTER - Backend      ║
║  Server running on port ${PORT}         ║
║  API Key: ${API_KEY.substring(0, 10)}... ║
║  Rate Limit: 300 r/m               ║
║  Cache: 10 minutes                 ║
╚════════════════════════════════════╝
  `);
});

module.exports = app;
