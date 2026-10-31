const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;

// Create HTTP server for health checks & Socket.IO mounting
const server = http.createServer((req, res) => {
  // CORS headers for HTTP endpoints
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'supertime-roulette-signaling',
        connections: io.engine.clientsCount,
        queued: queue.length,
        activeMatches: activeMatches.size,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Configure Socket.IO server with high-performance WebSockets
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 10000,
  transports: ['websocket', 'polling'],
});

// State storage
// queue: Array<{ socketId: string, peerId: string, recentPeers: string[], joinedAt: number }>
const queue = [];

// activeMatches: Map<roomId, { peerA: { socketId, peerId }, peerB: { socketId, peerId }, extensions: { [socketId]: boolean } }>
const activeMatches = new Map();

// Map<socketId, roomId>
const socketToRoom = new Map();

// Map<socketId, { peerId: string, recentPeers: string[] }>
const socketMeta = new Map();

// Map<pairKey, timestamp> to enforce cooldown on rematches between same 2 peers
const lastPairMatchTime = new Map();

// Map<socketId, timestamp> for rate-limiting queue joins
const lastQueueJoinTime = new Map();

/**
 * Helper to execute a match between newUser and candidate
 */
function executeMatch(newUser, candidate, candidateIndex) {
  const { socketId: newSocketId, peerId: newPeerId } = newUser;
  const newSocket = io.sockets.sockets.get(newSocketId);
  const candidateSocket = io.sockets.sockets.get(candidate.socketId);
  if (!newSocket || !newSocket.connected || !candidateSocket || !candidateSocket.connected) {
    return false;
  }

  // Remove candidate from queue
  queue.splice(candidateIndex, 1);

  const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const pairKey = [newPeerId, candidate.peerId].sort().join(':');
  lastPairMatchTime.set(pairKey, Date.now());

  // Store active match info
  activeMatches.set(roomId, {
    peerA: { socketId: newSocketId, peerId: newPeerId, meta: newUser },
    peerB: { socketId: candidate.socketId, peerId: candidate.peerId, meta: candidate },
    extensions: {
      [newSocketId]: false,
      [candidate.socketId]: false,
    },
  });

  socketToRoom.set(newSocketId, roomId);
  socketToRoom.set(candidate.socketId, roomId);

  // Join Socket.IO room
  newSocket.join(roomId);
  candidateSocket.join(roomId);

  const callMode = newUser.mode || candidate.mode || 'video';
  console.log(`[Roulette Server] MATCH (${callMode}): ${newPeerId} (initiator) <-> ${candidate.peerId} (receiver) in ${roomId}`);

  // Notify Initiator (User A)
  newSocket.emit('matched', {
    roomId,
    partnerId: candidate.peerId,
    role: 'initiator',
    mode: callMode,
    partnerMeta: {
      isCreator: candidate.isCreator || false,
      username: candidate.username || '',
      creatorEmail: candidate.creatorEmail || '',
      videoRate: candidate.videoRate || 0,
      displayName: candidate.displayName || 'Stranger',
    },
  });

  // Notify Receiver (User B)
  candidateSocket.emit('matched', {
    roomId,
    partnerId: newPeerId,
    role: 'receiver',
    mode: callMode,
    partnerMeta: {
      isCreator: newUser.isCreator || false,
      username: newUser.username || '',
      creatorEmail: newUser.creatorEmail || '',
      videoRate: newUser.videoRate || 0,
      displayName: newUser.displayName || 'Stranger',
    },
  });

  return true;
}

/**
 * Attempt to match a user with the first eligible stranger in FIFO queue
 * Pass 1: Prioritize new strangers (anti-rematch filter)
 * Pass 2 (Fallback): If no new peer available (e.g. 2 users testing or low traffic pool), allow rematch after 2s cooldown
 */
function attemptMatch(newUser) {
  const { socketId: newSocketId, peerId: newPeerId, recentPeers: newRecents = [], mode: newMode = 'video' } = newUser;
  const newSocket = io.sockets.sockets.get(newSocketId);
  if (!newSocket || !newSocket.connected) return false;

  // Pass 1: Find a candidate not in recentPeers and matching the media mode (video <-> video, audio <-> audio)
  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];

    // Skip self
    if (candidate.socketId === newSocketId || candidate.peerId === newPeerId) continue;

    // Filter by media mode: audio only with audio only, video with video
    const candidateMode = candidate.mode || 'video';
    if (candidateMode !== newMode) continue;

    const candidateSocket = io.sockets.sockets.get(candidate.socketId);
    if (!candidateSocket || !candidateSocket.connected) {
      queue.splice(i, 1);
      i--;
      continue;
    }

    const isCandidateRecentForNew = newRecents.includes(candidate.peerId);
    const isNewRecentForCandidate = candidate.recentPeers && candidate.recentPeers.includes(newPeerId);

    if (!isCandidateRecentForNew && !isNewRecentForCandidate) {
      return executeMatch(newUser, candidate, i);
    }
  }

  // Pass 2 (Fallback): If no new peer found, match with available waiting candidate (rematch)
  // Only if media modes match and at least 2000ms have elapsed since their last match together
  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];

    // Skip self
    if (candidate.socketId === newSocketId || candidate.peerId === newPeerId) continue;

    // Filter by media mode
    const candidateMode = candidate.mode || 'video';
    if (candidateMode !== newMode) continue;

    const candidateSocket = io.sockets.sockets.get(candidate.socketId);
    if (!candidateSocket || !candidateSocket.connected) {
      queue.splice(i, 1);
      i--;
      continue;
    }

    const pairKey = [newPeerId, candidate.peerId].sort().join(':');
    const lastMatch = lastPairMatchTime.get(pairKey) || 0;
    const timeSinceLastMatch = Date.now() - lastMatch;

    // Enforce 2s cooldown so devices cleanly tear down the previous WebRTC session
    if (timeSinceLastMatch < 2000) {
      continue;
    }

    console.log(`[Roulette Server] Matching via fallback pool (${newMode}, rematch after ${timeSinceLastMatch}ms): ${newPeerId} <-> ${candidate.peerId}`);
    return executeMatch(newUser, candidate, i);
  }

  return false;
}

/**
 * Remove user from matchmaking queue (by socketId and optional peerId)
 */
function removeFromQueue(socketId, peerId = null) {
  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i].socketId === socketId || (peerId && queue[i].peerId === peerId)) {
      queue.splice(i, 1);
    }
  }
}

/**
 * Tear down room and notify remaining peer
 */
function cleanupRoom(roomId, disconnectedSocketId = null) {
  const match = activeMatches.get(roomId);
  if (!match) return;

  const { peerA, peerB } = match;

  socketToRoom.delete(peerA.socketId);
  socketToRoom.delete(peerB.socketId);
  activeMatches.delete(roomId);

  const socketA = io.sockets.sockets.get(peerA.socketId);
  const socketB = io.sockets.sockets.get(peerB.socketId);

  if (socketA) socketA.leave(roomId);
  if (socketB) socketB.leave(roomId);

  console.log(`[Roulette Server] Room closed: ${roomId}`);
}

/**
 * Broadcast real-time active users count & pool metrics to all clients
 */
function broadcastOnlineStats() {
  const activeCount = io.engine ? io.engine.clientsCount : io.sockets.sockets.size;
  io.emit('online_count', {
    count: Math.max(1, activeCount),
    queued: queue.length,
    activeMatches: activeMatches.size,
  });
}

io.on('connection', (socket) => {
  console.log(`[Roulette Server] Client connected: ${socket.id}`);

  // Emit online count immediately upon connection
  socket.emit('online_count', {
    count: Math.max(1, io.engine ? io.engine.clientsCount : io.sockets.sockets.size),
    queued: queue.length,
    activeMatches: activeMatches.size,
  });
  broadcastOnlineStats();

  // 1. Join matchmaking queue
  socket.on('join_queue', (data = {}) => {
    const {
      peerId,
      recentPeers = [],
      isCreator = false,
      username = '',
      creatorEmail = '',
      videoRate = 0,
      displayName = 'Stranger',
      mode = 'video',
    } = data;
    if (!peerId) return;

    // Rate-limit queue join spam per socket
    const lastJoin = lastQueueJoinTime.get(socket.id) || 0;
    if (Date.now() - lastJoin < 800) {
      return;
    }
    lastQueueJoinTime.set(socket.id, Date.now());

    const userMode = mode === 'audio' ? 'audio' : 'video';

    socketMeta.set(socket.id, { peerId, recentPeers, isCreator, username, creatorEmail, videoRate, displayName, mode: userMode });

    // If currently registered in a room, clean it up silently without triggering cascading peer_left
    const existingRoom = socketToRoom.get(socket.id);
    if (existingRoom) {
      cleanupRoom(existingRoom, socket.id);
    }

    // Ensure not already in queue (clean by both socket.id and peerId)
    removeFromQueue(socket.id, peerId);

    const userObj = {
      socketId: socket.id,
      peerId,
      recentPeers,
      isCreator,
      username,
      creatorEmail,
      videoRate,
      displayName,
      mode: userMode,
      joinedAt: Date.now(),
    };

    // Try matching immediately
    const matched = attemptMatch(userObj);
    if (!matched) {
      queue.push(userObj);
      socket.emit('queued', { queueLength: queue.length });
      console.log(`[Roulette Server] User ${peerId} (${displayName}) queued. Pool size: ${queue.length}`);
    }
  });

  // 1b. Leave matchmaking queue
  socket.on('leave_queue', () => {
    removeFromQueue(socket.id);
    console.log(`[Roulette Server] User ${socket.id} left queue.`);
    broadcastOnlineStats();
  });

  // 2. WebRTC Signal Relay (SDP offer, SDP answer, ICE candidate)
  socket.on('signal', (payload = {}) => {
    const { roomId, type, data } = payload;
    if (!roomId) return;

    console.log(`[Roulette Server] Signal ${type} in ${roomId} from ${socket.id}`);

    // Relay exclusively to the partner in the room
    socket.to(roomId).emit('signal', {
      type,
      data,
      fromSocketId: socket.id,
    });
  });

  // 3. User skips to next peer
  socket.on('skip', (data = {}) => {
    const roomId = data.roomId || socketToRoom.get(socket.id);
    if (!roomId) return;

    console.log(`[Roulette Server] User skipped in room: ${roomId}`);

    // Notify partner that they were skipped
    socket.to(roomId).emit('peer_skipped');

    cleanupRoom(roomId, socket.id);
  });

  // 4. Request time extension (artist discretion)
  socket.on('request_time_extension', (data = {}) => {
    const roomId = data.roomId || socketToRoom.get(socket.id);
    console.log(`[Roulette Server] request_time_extension received from ${socket.id} in room ${roomId}:`, data);
    if (!roomId) return;

    const match = activeMatches.get(roomId);
    if (!match) {
      console.warn(`[Roulette Server] No active match for room ${roomId}`);
      return;
    }

    const cost = data.cost || 0;
    const seconds = data.amountSeconds || data.seconds || 30;

    match.extensions[socket.id] = { requested: true, cost, seconds };

    const partnerId = match.peerA.socketId === socket.id ? match.peerB.socketId : match.peerA.socketId;
    const partnerSocket = io.sockets.sockets.get(partnerId);

    console.log(`[Roulette Server] Relaying peer_requested_time to partner ${partnerId}`);
    if (partnerSocket) {
      partnerSocket.emit('peer_requested_time', { cost, seconds, fromSocketId: socket.id });
    }
    socket.to(roomId).emit('peer_requested_time', { cost, seconds, fromSocketId: socket.id });

    // If both users requested or mutual free
    const partnerExt = match.extensions[partnerId];
    if (partnerExt && partnerExt.requested) {
      match.extensions[match.peerA.socketId] = false;
      match.extensions[match.peerB.socketId] = false;

      io.to(roomId).emit('time_extended', { addedSeconds: seconds, cost });
      console.log(`[Roulette Server] Mutual extension approved for room ${roomId}! (+${seconds}s)`);
    }
  });

  // 4b. Artist explicitly accepts time extension
  socket.on('accept_time_extension', (data = {}) => {
    const roomId = data.roomId || socketToRoom.get(socket.id);
    console.log(`[Roulette Server] accept_time_extension received from ${socket.id} in room ${roomId}:`, data);
    if (!roomId) return;

    const match = activeMatches.get(roomId);
    if (!match) return;

    const seconds = data.amountSeconds || data.seconds || 30;
    const cost = data.cost || 0;

    match.extensions[match.peerA.socketId] = false;
    match.extensions[match.peerB.socketId] = false;

    io.to(roomId).emit('time_extended', { addedSeconds: seconds, cost });
    console.log(`[Roulette Server] Extension accepted and broadcast to room ${roomId}! (+${seconds}s)`);
  });

  // 5. Send Emoji reaction
  socket.on('reaction', (data = {}) => {
    const roomId = data.roomId || socketToRoom.get(socket.id);
    if (!roomId) return;

    socket.to(roomId).emit('reaction', { emoji: data.emoji });
  });

  // 6. Handle Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Roulette Server] Client disconnected: ${socket.id} (${reason})`);

    removeFromQueue(socket.id);

    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit('peer_left');
      cleanupRoom(roomId, socket.id);
    }

    socketMeta.delete(socket.id);
    broadcastOnlineStats();
  });
});

// Periodic queue cleanup for dead connections (every 30s)
setInterval(() => {
  for (let i = queue.length - 1; i >= 0; i--) {
    const item = queue[i];
    const sock = io.sockets.sockets.get(item.socketId);
    if (!sock || !sock.connected) {
      queue.splice(i, 1);
    }
  }
}, 30000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Roulette Socket.IO Signaling Server running on port ${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`======================================================\n`);
});
