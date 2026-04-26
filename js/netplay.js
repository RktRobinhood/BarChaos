'use strict';

// ═══════════════════════════════════════════════════════════
//  netplay.js  –  PeerJS WebRTC P2P multiplayer
//  Host-authoritative · 20 Hz state sync · Up to 4 players
//  Security: SHA-256(name+password) → peer ID; password never transmitted
//            WebRTC DTLS encrypts all game data in transit
// ═══════════════════════════════════════════════════════════

const Netplay = (() => {

  // ── ICE servers (STUN + TURN for NAT traversal) ───────────
  const ICE_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      // Free community TURN — covers symmetric NAT
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:80?transport=tcp',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username:   'openrelayproject',
      credential: 'openrelayproject',
    },
  ];

  const PEER_OPTS = { config: { iceServers: ICE_SERVERS } };

  // ── SHA-256 room code ─────────────────────────────────────
  // The derived peer ID = SHA-256("barchaos:<name>:<pass>") → first 20 hex chars
  // Password never leaves the device; matching hashes are how both sides find each other
  async function deriveRoomCode(roomName, password) {
    const raw  = `barchaos:${roomName.toLowerCase().trim()}:${password}`;
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const hex  = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    return 'bc-' + hex.slice(0, 20); // 80-bit address space
  }

  // ── Module state ──────────────────────────────────────────
  let peer        = null;
  let roomCode    = '';
  let _isHost     = false;
  let connections = []; // { conn, playerIdx }[]
  let localIdx    = 0;
  let playerCount = 1;
  let cbs         = {};
  let syncTimer   = null;

  function makePeer(id) {
    return id ? new Peer(id, PEER_OPTS) : new Peer(PEER_OPTS);
  }

  // ── HOST: create room ─────────────────────────────────────
  async function createRoom(name, password, callbacks) {
    cbs         = callbacks || {};
    _isHost     = true;
    localIdx    = 0;
    connections = [];
    playerCount = 1;

    const code = await deriveRoomCode(name, password);
    roomCode = code;

    return new Promise((resolve, reject) => {
      peer = makePeer(code);

      peer.on('open', id => resolve({ roomCode: id, playerIdx: 0 }));

      peer.on('connection', conn => {
        if (connections.length >= 3) {
          // Room full
          conn.on('open', () => {
            conn.send({ type: 'error', msg: 'Room is full (max 4 players).' });
            setTimeout(() => conn.close(), 600);
          });
          return;
        }

        const slot = connections.length + 1;
        connections.push({ conn, playerIdx: slot });
        playerCount = connections.length + 1;

        conn.on('open', () => {
          conn.send({ type: 'welcome', playerIdx: slot, totalPlayers: playerCount });
          // Inform all existing players of new count
          connections.forEach(c => {
            if (c.conn !== conn && c.conn.open) {
              c.conn.send({ type: 'playerCount', totalPlayers: playerCount });
            }
          });
          if (cbs.onPlayerJoin) cbs.onPlayerJoin(slot, playerCount);
        });

        conn.on('data', raw => {
          try {
            const data = (typeof raw === 'string') ? JSON.parse(raw) : raw;
            if (cbs.onInput) cbs.onInput(slot, data);
          } catch (e) { /* ignore malformed */ }
        });

        conn.on('close', () => {
          connections = connections.filter(c => c.conn !== conn);
          playerCount = connections.length + 1;
          if (cbs.onPlayerLeave) cbs.onPlayerLeave(slot, playerCount);
        });

        conn.on('error', err => console.warn('[Netplay] client conn error:', err));
      });

      peer.on('error', err => {
        if (err.type === 'unavailable-id') {
          reject(new Error('A room with that name and password already exists.'));
        } else {
          reject(new Error(`Connection error: ${err.type}`));
        }
      });
    });
  }

  // ── CLIENT: join room ─────────────────────────────────────
  async function joinRoom(name, password, callbacks) {
    cbs         = callbacks || {};
    _isHost     = false;
    connections = [];

    const code = await deriveRoomCode(name, password);
    roomCode = code;

    return new Promise((resolve, reject) => {
      peer = makePeer(); // random client peer ID

      peer.on('open', () => {
        const conn = peer.connect(code, { reliable: true, serialization: 'json' });
        connections = [{ conn, playerIdx: 0 }];

        let resolved = false;

        conn.on('data', data => {
          if (data.type === 'error') {
            if (!resolved) reject(new Error(data.msg));
            return;
          }
          if (data.type === 'welcome') {
            localIdx    = data.playerIdx;
            playerCount = data.totalPlayers;
            resolved    = true;
            resolve({ playerIdx: localIdx, totalPlayers: playerCount });
          } else if (data.type === 'playerCount') {
            playerCount = data.totalPlayers;
            if (cbs.onPlayerCount) cbs.onPlayerCount(data.totalPlayers);
          } else if (data.type === 'gameStart') {
            if (cbs.onGameStart) cbs.onGameStart(data.levelNum, data.totalPlayers);
          } else if (data.type === 'state') {
            if (cbs.onState) cbs.onState(data.payload);
          }
        });

        conn.on('close', () => {
          if (!resolved) reject(new Error('Host closed connection before welcome.'));
          if (cbs.onDisconnect) cbs.onDisconnect('Host disconnected');
        });

        conn.on('error', err => {
          if (!resolved) reject(new Error(`Connection error: ${err.type}`));
        });
      });

      peer.on('error', err => {
        if (err.type === 'peer-unavailable') {
          reject(new Error('Room not found. Check name and password.'));
        } else {
          reject(new Error(`Connection error: ${err.type}`));
        }
      });
    });
  }

  // ── HOST: broadcast game start ────────────────────────────
  function startGame(levelNum) {
    const msg = { type: 'gameStart', levelNum, totalPlayers: playerCount };
    connections.forEach(c => { if (c.conn.open) c.conn.send(msg); });
  }

  // ── HOST: broadcast state snapshot ───────────────────────
  function broadcastState(payload) {
    if (connections.length === 0) return;
    const msg = { type: 'state', payload };
    connections.forEach(c => {
      if (c.conn.open) { try { c.conn.send(msg); } catch (e) {} }
    });
  }

  // ── CLIENT: send input to host ────────────────────────────
  function sendInput(input) {
    const conn = connections[0]?.conn;
    if (conn?.open) { try { conn.send(input); } catch (e) {} }
  }

  // ── HOST: start 20 Hz state sync interval ────────────────
  function startStateSync(getStateFn) {
    stopStateSync();
    syncTimer = setInterval(() => {
      if (!_isHost || connections.length === 0) return;
      const payload = getStateFn();
      if (payload) broadcastState(payload);
    }, 50); // 20 Hz
  }

  function stopStateSync() {
    if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
  }

  // ── Disconnect / full cleanup ─────────────────────────────
  function disconnect() {
    stopStateSync();
    connections.forEach(c => { try { c.conn.close(); } catch (e) {} });
    connections  = [];
    if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
    _isHost     = false;
    localIdx    = 0;
    playerCount = 1;
    roomCode    = '';
    cbs         = {};
  }

  return {
    createRoom, joinRoom, startGame,
    broadcastState, sendInput,
    startStateSync, stopStateSync, disconnect,
    isHost:            () => _isHost,
    getLocalPlayerIdx: () => localIdx,
    getPlayerCount:    () => playerCount,
    getRoomCode:       () => roomCode,
  };
})();
