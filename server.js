const http = require('http');
const { WebSocketServer } = require('ws');
const { randomBytes } = require('crypto');

const PORT = process.env.PORT || 3000;

// ─── Rondas temáticas ───
const ROUNDS = [
  { id: 'liked',    label: 'Liked',      emoji: '😊', phase: '4Ls', color: '#2E8B57' },
  { id: 'learned',  label: 'Learned',    emoji: '📚', phase: '4Ls', color: '#1E6FB5' },
  { id: 'lacked',   label: 'Lacked',     emoji: '😕', phase: '4Ls', color: '#C94A2B' },
  { id: 'longed',   label: 'Longed for', emoji: '⭐', phase: '4Ls', color: '#8B5E3C' },
  { id: 'start',    label: 'Start',      emoji: '🟢', phase: 'SSC', color: '#2E8B57' },
  { id: 'stop',     label: 'Stop',       emoji: '🔴', phase: 'SSC', color: '#C0392B' },
  { id: 'continue', label: 'Continue',   emoji: '🔵', phase: 'SSC', color: '#1E6FB5' },
];

// ─── Ingredientes por ronda ───
const INGREDIENTS = {
  liked:    [
    { id: 'colaboracion',  label: 'Colaboración',    emoji: '🥬' },
    { id: 'entrega',       label: 'Entrega',          emoji: '🍅' },
    { id: 'calidad',       label: 'Calidad',          emoji: '🧀' },
    { id: 'comunicacion',  label: 'Comunicación',     emoji: '🥑' },
  ],
  learned:  [
    { id: 'tecnico',       label: 'Técnico',          emoji: '🔧' },
    { id: 'proceso',       label: 'Proceso',          emoji: '📋' },
    { id: 'teamwork',      label: 'Teamwork',         emoji: '🤝' },
    { id: 'negocio',       label: 'Negocio',          emoji: '💡' },
  ],
  lacked:   [
    { id: 'tiempo',        label: 'Tiempo',           emoji: '⏰' },
    { id: 'claridad',      label: 'Claridad',         emoji: '🌫️' },
    { id: 'dependencias',  label: 'Dependencias',     emoji: '🔗' },
    { id: 'herramientas',  label: 'Herramientas',     emoji: '🛠️' },
  ],
  longed:   [
    { id: 'automatizacion',label: 'Automatización',   emoji: '🤖' },
    { id: 'foco',          label: 'Foco',             emoji: '🎯' },
    { id: 'feedback',      label: 'Feedback',         emoji: '📣' },
    { id: 'mejora',        label: 'Mejora continua',  emoji: '🔄' },
  ],
  start:    [
    { id: 'daily',         label: 'Daily efectivo',   emoji: '📢' },
    { id: 'pair_review',   label: 'Pair review',      emoji: '👥' },
    { id: 'docs',          label: 'Documentación',    emoji: '📝' },
    { id: 'retro',         label: 'Retrospectiva',    emoji: '🔁' },
  ],
  stop:     [
    { id: 'reuniones',     label: 'Reuniones innec.', emoji: '🚫' },
    { id: 'silos',         label: 'Silos',            emoji: '🏚️' },
    { id: 'deuda',         label: 'Deuda técnica',    emoji: '💸' },
    { id: 'bloqueos',      label: 'Bloqueos sin esc.',emoji: '🚧' },
  ],
  continue: [
    { id: 'code_review',   label: 'Code review',      emoji: '👓' },
    { id: 'demos',         label: 'Demos',            emoji: '🎬' },
    { id: 'planning',      label: 'Planificación',    emoji: '🗓️' },
    { id: 'soporte',       label: 'Soporte mutuo',    emoji: '🤜' },
  ],
};

// ─── Preguntas default por ronda ───
const DEFAULT_QUESTIONS = {
  liked:    ['¿Qué fue lo que más disfrutaste de este Sprint?', '¿Qué práctica del equipo destacarías esta vez?', '¿Qué momento del Sprint te dio más satisfacción?'],
  learned:  ['¿Qué aprendiste técnico o de proceso en este Sprint?', '¿Qué conocimiento nuevo llevaste al equipo?', '¿Qué cambiarías en tu forma de trabajar tras lo aprendido?'],
  lacked:   ['¿Qué le faltó al equipo para entregar mejor?', '¿Qué recurso o información te hizo falta?', '¿Qué bloqueó tu trabajo sin que pudieras resolverlo?'],
  longed:   ['¿Qué herramienta o práctica desearías haber tenido?', '¿Qué proceso te hubiera ahorrado tiempo?', '¿Qué apoyo externo necesitabas y no llegó?'],
  start:    ['¿Qué debería empezar a hacer el equipo desde el próximo Sprint?', '¿Qué práctica nueva propondrías implementar?', '¿Qué hábito de trabajo te gustaría ver en el equipo?'],
  stop:     ['¿Qué práctica actual le está costando tiempo o calidad al equipo?', '¿Qué reunión o proceso eliminarías sin dudarlo?', '¿Qué comportamiento del equipo frena la entrega?'],
  continue: ['¿Qué práctica del equipo definitivamente debemos mantener?', '¿Qué proceso está funcionando bien y no debemos romper?', '¿Qué dinámica del equipo quieres que siga igual?'],
};

// ─── Frases motivacionales del splash ───
const SPLASH_QUOTES = [
  'El mejor Sprint es el que el equipo construye junto. 🍔',
  'Inspect & Adapt — y también disfruta el proceso.',
  'Los mejores equipos no esperan la perfección, la construyen ronda a ronda.',
  'Un buen Daily es el ingrediente secreto de cada Sprint.',
  'La retrospectiva no es un juicio — es una receta para mejorar.',
  'Fail fast, learn faster, deliver better. 🚀',
  'El Scrum Team que se ríe junto, entrega junto.',
  'Definition of Done: cuando el equipo está orgulloso de lo que hizo.',
];

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', game: 'Burger Mania Retro v2' }));
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomTeams(playerIds) {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const half = Math.ceil(shuffled.length / 2);
  const teams = { A: shuffled.slice(0, half), B: shuffled.slice(half) };
  return teams;
}

function broadcast(room, msg, excludeWs = null) {
  const data = JSON.stringify(msg);
  for (const client of room.clients) {
    if (client !== excludeWs && client.readyState === 1) client.send(data);
  }
}
function broadcastAll(room, msg) { broadcast(room, msg, null); }

function sendTo(room, playerId, msg) {
  for (const client of room.clients) {
    if (client.playerId === playerId && client.readyState === 1) {
      client.send(JSON.stringify(msg));
    }
  }
}

function roomState(room) {
  return {
    type: 'state',
    players: room.players,
    phase: room.phase,
    roundIdx: room.roundIdx,
    round: ROUNDS[room.roundIdx] || null,
    ingredients: room.roundIdx < ROUNDS.length ? INGREDIENTS[ROUNDS[room.roundIdx].id] : [],
    question: room.currentQuestion,
    timerRunning: room.timerRunning,
    timerSeconds: room.timerSeconds,
    deliveredIds: room.deliveredIds,
    sprintName: room.sprintName,
    teams: room.teams,
    burgers: room.phase === 'reveal' || room.phase === 'ended' ? room.burgers : [],
    votes: room.votes,
    scores: room.scores,
    hostId: room.hostId,
    totalRounds: ROUNDS.length,
    customQuestions: room.customQuestions,
  };
}

function calcScore(room) {
  const scores = {};
  Object.keys(room.players).forEach(id => { scores[id] = { pts: 0, burgers: 0, role: room.players[id].role, name: room.players[id].name, team: room.players[id].team }; });
  room.burgers.forEach(b => {
    if (!scores[b.playerId]) return;
    scores[b.playerId].pts += 1 + b.ingredients.length;
    scores[b.playerId].burgers++;
  });
  // Add vote bonus
  Object.entries(room.voteBonus || {}).forEach(([id, bonus]) => {
    if (scores[id]) scores[id].pts += bonus;
  });
  return scores;
}

wss.on('connection', (ws) => {
  ws.playerId = randomBytes(4).toString('hex');
  ws.roomCode = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'get_splash': {
        const quote = SPLASH_QUOTES[Math.floor(Math.random() * SPLASH_QUOTES.length)];
        ws.send(JSON.stringify({ type: 'splash', quote }));
        break;
      }

      case 'create_room': {
        let code;
        do { code = genCode(); } while (rooms.has(code));
        const room = {
          code, hostId: ws.playerId,
          clients: new Set([ws]),
          players: {},
          burgers: [],
          phase: 'lobby',
          roundIdx: 0,
          currentQuestion: null,
          timerRunning: false,
          timerSeconds: 180,
          timerInterval: null,
          deliveredIds: [],
          sprintName: msg.sprintName || 'Sprint',
          teams: {},
          votes: {},
          voteBonus: {},
          scores: {},
          customQuestions: {},
        };
        rooms.set(code, room);
        ws.roomCode = code;
        room.players[ws.playerId] = {
          id: ws.playerId, name: msg.name, role: msg.role,
          pts: 0, burgers: 0, powerUsed: false, team: null,
        };
        ws.send(JSON.stringify({ type: 'room_created', code, playerId: ws.playerId }));
        ws.send(JSON.stringify(roomState(room)));
        break;
      }

      case 'join_room': {
        const code = (msg.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) { ws.send(JSON.stringify({ type: 'error', msg: 'Sala no encontrada. Revisa el código.' })); return; }
        if (room.phase !== 'lobby') { ws.send(JSON.stringify({ type: 'error', msg: 'El juego ya comenzó.' })); return; }
        if (Object.keys(room.players).length >= 10) { ws.send(JSON.stringify({ type: 'error', msg: 'Sala llena (máx 10).' })); return; }
        ws.roomCode = code;
        room.clients.add(ws);
        room.players[ws.playerId] = {
          id: ws.playerId, name: msg.name, role: msg.role,
          pts: 0, burgers: 0, powerUsed: false, team: null,
        };
        ws.send(JSON.stringify({ type: 'joined', code, playerId: ws.playerId }));
        broadcastAll(room, roomState(room));
        broadcast(room, { type: 'toast', msg: `🍔 ${msg.name} se unió!` }, ws);
        break;
      }

      case 'update_questions': {
        const room = rooms.get(ws.roomCode);
        if (!room || room.hostId !== ws.playerId) return;
        room.customQuestions = msg.questions || {};
        ws.send(JSON.stringify({ type: 'questions_saved' }));
        break;
      }

      case 'start_game': {
        const room = rooms.get(ws.roomCode);
        if (!room || room.hostId !== ws.playerId) return;
        if (Object.keys(room.players).length < 2) { ws.send(JSON.stringify({ type: 'error', msg: 'Necesitas al menos 2 jugadores.' })); return; }
        // Assign random teams
        const playerIds = Object.keys(room.players);
        const teams = randomTeams(playerIds);
        room.teams = teams;
        teams.A.forEach(id => { if (room.players[id]) room.players[id].team = 'A'; });
        teams.B.forEach(id => { if (room.players[id]) room.players[id].team = 'B'; });
        room.phase = 'playing';
        room.roundIdx = 0;
        room.deliveredIds = [];
        room.burgers = [];
        room.voteBonus = {};
        // Pick first question
        const roundId = ROUNDS[0].id;
        const qBank = room.customQuestions[roundId]?.length ? room.customQuestions[roundId] : DEFAULT_QUESTIONS[roundId];
        room.currentQuestion = qBank[Math.floor(Math.random() * qBank.length)];
        broadcastAll(room, { type: 'game_started', sprintName: room.sprintName });
        broadcastAll(room, roomState(room));
        break;
      }

      case 'timer_control': {
        const room = rooms.get(ws.roomCode);
        if (!room || room.hostId !== ws.playerId) return;
        if (msg.action === 'start' && !room.timerRunning) {
          room.timerRunning = true;
          room.timerInterval = setInterval(() => {
            if (room.timerSeconds <= 0) {
              clearInterval(room.timerInterval);
              room.timerRunning = false;
              broadcastAll(room, { type: 'timer_ended' });
              return;
            }
            room.timerSeconds--;
            broadcastAll(room, { type: 'tick', seconds: room.timerSeconds });
          }, 1000);
        } else if (msg.action === 'pause' && room.timerRunning) {
          clearInterval(room.timerInterval);
          room.timerRunning = false;
        } else if (msg.action === 'reset') {
          clearInterval(room.timerInterval);
          room.timerRunning = false;
          room.timerSeconds = msg.seconds || 180;
          broadcastAll(room, { type: 'tick', seconds: room.timerSeconds });
        }
        broadcastAll(room, { type: 'timer_state', running: room.timerRunning, seconds: room.timerSeconds });
        break;
      }

      case 'deliver_burger': {
        const room = rooms.get(ws.roomCode);
        if (!room || room.phase !== 'playing') return;
        const player = room.players[ws.playerId];
        if (!player) return;
        if (room.deliveredIds.includes(ws.playerId)) return;
        const round = ROUNDS[room.roundIdx];
        const burger = {
          id: randomBytes(4).toString('hex'),
          playerId: ws.playerId,
          playerName: player.name,
          playerRole: player.role,
          playerTeam: player.team,
          roundId: round.id,
          roundLabel: round.label,
          ingredients: msg.ingredients || [],
          comment: msg.comment || '',
          ts: Date.now(),
          votes: 0,
        };
        room.burgers.push(burger);
        room.deliveredIds.push(ws.playerId);
        // Notify progress to all
        broadcastAll(room, {
          type: 'delivery_progress',
          deliveredIds: room.deliveredIds,
          totalPlayers: Object.keys(room.players).length,
          playerName: player.name,
        });
        // Check if all delivered
        const allDelivered = Object.keys(room.players).every(id => room.deliveredIds.includes(id));
        if (allDelivered) {
          clearInterval(room.timerInterval);
          room.timerRunning = false;
          room.phase = 'reveal';
          // Filter burgers for current round
          const roundBurgers = room.burgers.filter(b => b.roundId === round.id);
          broadcastAll(room, { type: 'round_complete', burgers: roundBurgers });
          broadcastAll(room, roomState(room));
        }
        break;
      }

      case 'vote': {
        const room = rooms.get(ws.roomCode);
        if (!room || room.phase !== 'reveal') return;
        if (room.votes[ws.playerId]) return;
        // Can't vote for yourself
        const targetBurger = room.burgers.find(b => b.id === msg.burgerId);
        if (!targetBurger || targetBurger.playerId === ws.playerId) return;
        room.votes[ws.playerId] = msg.burgerId;
        targetBurger.votes = (targetBurger.votes || 0) + 1;
        const totalVotes = Object.keys(room.votes).length;
        const totalPlayers = Object.keys(room.players).length;
        broadcastAll(room, {
          type: 'vote_cast',
          totalVotes,
          totalPlayers,
          voterName: room.players[ws.playerId]?.name,
        });
        // All voted
        if (totalVotes >= totalPlayers) {
          const round = ROUNDS[room.roundIdx];
          const roundBurgers = room.burgers.filter(b => b.roundId === round.id);
          const winner = roundBurgers.reduce((a, b) => (b.votes || 0) > (a.votes || 0) ? b : a, roundBurgers[0]);
          if (winner) {
            if (!room.voteBonus[winner.playerId]) room.voteBonus[winner.playerId] = 0;
            room.voteBonus[winner.playerId] += 3;
          }
          room.scores = calcScore(room);
          broadcastAll(room, {
            type: 'vote_result',
            winnerId: winner?.playerId,
            winnerName: winner?.playerName,
            burgerId: winner?.id,
            scores: room.scores,
          });
        }
        break;
      }

      case 'next_round': {
        const room = rooms.get(ws.roomCode);
        if (!room || room.hostId !== ws.playerId) return;
        if (room.roundIdx >= ROUNDS.length - 1) {
          // Game over
          room.phase = 'ended';
          room.scores = calcScore(room);
          const sorted = Object.values(room.scores).sort((a, b) => b.pts - a.pts);
          // Winners by role
          const byRole = {};
          Object.values(room.scores).forEach(s => {
            if (!byRole[s.role] || s.pts > byRole[s.role].pts) byRole[s.role] = s;
          });
          broadcastAll(room, { type: 'game_ended', scores: sorted, byRole, burgers: room.burgers, sprintName: room.sprintName });
        } else {
          room.roundIdx++;
          room.phase = 'playing';
          room.deliveredIds = [];
          room.votes = {};
          room.timerSeconds = 180;
          room.timerRunning = false;
          const roundId = ROUNDS[room.roundIdx].id;
          const qBank = room.customQuestions[roundId]?.length ? room.customQuestions[roundId] : DEFAULT_QUESTIONS[roundId];
          room.currentQuestion = qBank[Math.floor(Math.random() * qBank.length)];
          broadcastAll(room, { type: 'next_round', roundIdx: room.roundIdx, round: ROUNDS[room.roundIdx], ingredients: INGREDIENTS[ROUNDS[room.roundIdx].id] || [], question: room.currentQuestion });
          broadcastAll(room, roomState(room));
        }
        break;
      }

      case 'use_power': {
        const room = rooms.get(ws.roomCode);
        if (!room || room.phase !== 'playing') return;
        const player = room.players[ws.playerId];
        if (!player || player.powerUsed) { ws.send(JSON.stringify({ type: 'error', msg: 'Ya usaste tu poder este juego.' })); return; }
        player.powerUsed = true;
        const role = player.role;
        if (role === 'qa') {
          // Freeze target player 10 sec
          const target = room.players[msg.targetId];
          if (!target) { player.powerUsed = false; return; }
          sendTo(room, msg.targetId, { type: 'frozen', seconds: 10, byName: player.name });
          broadcastAll(room, { type: 'toast', msg: `❄️ ${player.name} congeló a ${target.name} por 10 seg!` });
        } else if (role === 'po') {
          // Add extra question visible to all
          const roundId = ROUNDS[room.roundIdx].id;
          const qBank = room.customQuestions[roundId]?.length ? room.customQuestions[roundId] : DEFAULT_QUESTIONS[roundId];
          const extra = msg.customQuestion || qBank[Math.floor(Math.random() * qBank.length)];
          broadcastAll(room, { type: 'extra_question', question: extra, byName: player.name });
          broadcastAll(room, { type: 'toast', msg: `📣 ${player.name} agregó una pregunta extra!` });
        } else if (role === 'dev') {
          // Skip — just confirm to the dev
          ws.send(JSON.stringify({ type: 'power_skip_ok' }));
          broadcastAll(room, { type: 'toast', msg: `⚡ ${player.name} usó su poder: saltar pregunta!` });
        }
        broadcastAll(room, { type: 'power_used', playerId: ws.playerId, role });
        break;
      }

      case 'host_skip_round': {
        const room = rooms.get(ws.roomCode);
        if (!room || room.hostId !== ws.playerId) return;
        clearInterval(room.timerInterval);
        room.timerRunning = false;
        room.phase = 'reveal';
        const round = ROUNDS[room.roundIdx];
        const roundBurgers = room.burgers.filter(b => b.roundId === round.id);
        broadcastAll(room, { type: 'round_complete', burgers: roundBurgers });
        broadcastAll(room, roomState(room));
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    room.clients.delete(ws);
    const player = room.players[ws.playerId];
    if (player) {
      broadcast(room, { type: 'toast', msg: `👋 ${player.name} se desconectó` });
      delete room.players[ws.playerId];
    }
    if (room.clients.size === 0) {
      setTimeout(() => { if (rooms.get(ws.roomCode)?.clients.size === 0) rooms.delete(ws.roomCode); }, 120000);
    } else {
      broadcastAll(room, roomState(room));
    }
  });
});

server.listen(PORT, () => console.log(`🍔 Burger Mania Retro v2 — port ${PORT}`));