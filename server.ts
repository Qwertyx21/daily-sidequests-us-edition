import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
app.use(express.json({ limit: '20mb' }));

const allowedOrigins = new Set([
  'https://couplequests-4faa5.web.app',
  'https://couplequests-4faa5.firebaseapp.com',
  ...(process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : []),
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
]);
app.use((req, res, next) => {
  const origin = req.header('origin');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403);
    return;
  }
  next();
});

type PartnerId = 'aaron' | 'vini';
type StoredState = Record<string, any>;
interface RoomStore { [roomCode: string]: StoredState }
interface ClientIdentity { partner: PartnerId; roomCode: string }

const AUTHORIZED_EMAILS: Record<PartnerId, string> = {
  aaron: 'aaronmathewg21@gmail.com',
  vini: 'viniputhran17@gmail.com'
};
const FIREBASE_PROJECT_ID = 'couplequests-4faa5';
const firebaseKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'couple-rooms.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'push-subscriptions.json');

function readJsonFile<T>(filename: string, fallback: T): T {
  try {
    if (fs.existsSync(filename)) return JSON.parse(fs.readFileSync(filename, 'utf-8')) as T;
  } catch (error) {
    console.error(`Failed to read ${path.basename(filename)}:`, error);
    throw new Error(`Could not read persistent data file ${path.basename(filename)}.`);
  }
  return fallback;
}

function writeJsonFile(filename: string, data: unknown): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
}

const rooms: RoomStore = readJsonFile(STATE_FILE, {});
const subscriptions: Record<PartnerId, webpush.PushSubscription[]> =
  readJsonFile(SUBSCRIPTIONS_FILE, { aaron: [], vini: [] });
const clientRooms = new Map<WebSocket, ClientIdentity>();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function authenticateToken(token: unknown): Promise<PartnerId> {
  if (typeof token !== 'string' || !token) throw new Error('A Firebase ID token is required.');
  const { payload } = await jwtVerify(token, firebaseKeys, {
    audience: FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
  });
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (payload.email_verified !== true) throw new Error('The Google account email must be verified.');
  const partner = (Object.keys(AUTHORIZED_EMAILS) as PartnerId[])
    .find((id) => AUTHORIZED_EMAILS[id] === email);
  if (!partner) throw new Error('This Google account is not authorized for this couple app.');
  return partner;
}

function getBearerToken(req: express.Request): string {
  const header = req.header('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new Error('A Firebase bearer token is required.');
  return match[1];
}

async function requirePartner(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    res.locals.partner = await authenticateToken(getBearerToken(req));
    next();
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'Authentication failed.' });
  }
}

function projectState(state: StoredState | undefined, partner: PartnerId): StoredState | null {
  if (!state) return null;
  return {
    ...state,
    quests: (Array.isArray(state.quests) ? state.quests : []).filter(
      (quest: any) => quest?.forPartner === partner
    ),
    privateWhispers: {
      aaron: partner === 'aaron' ? state.privateWhispers?.aaron || '' : '',
      vini: partner === 'vini' ? state.privateWhispers?.vini || '' : ''
    }
  };
}

function mergeById<T extends { id?: string }>(existing: T[], incoming: T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of existing) if (item?.id) merged.set(item.id, item);
  for (const item of incoming) if (item?.id) merged.set(item.id, item);
  return [...merged.values()];
}

function applyClientState(roomCode: string, partner: PartnerId, input: StoredState): StoredState {
  const current = rooms[roomCode] || {};
  const existingQuests = Array.isArray(current.quests) ? current.quests : [];
  const incomingQuests = Array.isArray(input.quests) ? input.quests : [];
  const legacyCompletedQuests = existingQuests.filter((quest: any) => quest?.isCompleted === true);
  const hasSavedCounts = current.completedCountsByPartner &&
    typeof current.completedCountsByPartner === 'object';
  const legacyCounts = {
    aaron: legacyCompletedQuests.filter((quest: any) => quest.forPartner === 'aaron').length,
    vini: legacyCompletedQuests.filter((quest: any) => quest.forPartner === 'vini').length
  };
  const questMap = new Map<string, any>(existingQuests.map((quest: any) => [quest.id, quest]));
  const notifyAssignments: any[] = [];

  for (const quest of incomingQuests) {
    if (!quest?.id || typeof quest.id !== 'string') continue;
    const stored = questMap.get(quest.id);
    if (!stored) {
      if (quest.assignedBy !== partner || quest.forPartner !== (partner === 'aaron' ? 'vini' : 'aaron')) continue;
      const newQuest = { ...quest, isCompleted: false, assignedAt: quest.assignedAt || new Date().toISOString() };
      questMap.set(quest.id, newQuest);
      notifyAssignments.push(newQuest);
      continue;
    }

    if (stored.forPartner === partner && stored.isCompleted !== true && quest.isCompleted === true) {
      questMap.set(quest.id, {
        ...stored,
        isCompleted: true,
        completedMemoryId: typeof quest.completedMemoryId === 'string' ? quest.completedMemoryId : null
      });
    } else if (stored.forPartner === partner && stored.isCompleted !== true) {
      questMap.set(quest.id, {
        ...stored,
        snoozedMinutesTotal: Number(quest.snoozedMinutesTotal) || stored.snoozedMinutesTotal || 0,
        snoozeUntilTimestamp: Number(quest.snoozeUntilTimestamp) || null
      });
    }
  }

  const next = {
    ...current,
    roomCode,
    profiles: {
      ...(current.profiles || {}),
      [partner]: input.profiles?.[partner] || current.profiles?.[partner]
    },
    completedCountsByPartner: {
      aaron: Math.max(0, Number(hasSavedCounts ? current.completedCountsByPartner.aaron : legacyCounts.aaron) || 0),
      vini: Math.max(0, Number(hasSavedCounts ? current.completedCountsByPartner.vini : legacyCounts.vini) || 0)
    },
    countedCompletions: Array.isArray(current.countedCompletions)
      ? current.countedCompletions
      : legacyCompletedQuests.map((quest: any) => quest.id).filter(Boolean),
    quests: [...questMap.values()],
    memories: mergeById(current.memories || [], input.memories || []),
    messages: mergeById(current.messages || [], input.messages || []),
    privateWhispers: {
      ...(current.privateWhispers || { aaron: '', vini: '' }),
      [partner]: input.privateWhispers?.[partner] || ''
    },
    vouchers: [],
    lastUpdated: Date.now()
  };

  for (const quest of next.quests) {
    if (quest.isCompleted === true) {
      if (!next.countedCompletions.includes(quest.id)) {
        next.completedCountsByPartner[quest.forPartner as PartnerId] += 1;
        next.countedCompletions.push(quest.id);
      }
    }
  }

  rooms[roomCode] = next;
  writeJsonFile(STATE_FILE, rooms);
  return Object.assign(next, { notifyAssignments });
}

function broadcastToRoom(roomCode: string, data: unknown, excludeClient?: WebSocket): void {
  for (const [client, identity] of clientRooms) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN && identity.roomCode === roomCode) {
      client.send(JSON.stringify(data));
    }
  }
}

function broadcastState(roomCode: string, state: StoredState, excludeClient?: WebSocket): void {
  for (const [client, identity] of clientRooms) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN && identity.roomCode === roomCode) {
      client.send(JSON.stringify({
        type: 'STATE_UPDATE',
        roomCode,
        payload: projectState(state, identity.partner)
      }));
    }
  }
}

async function notifyPartner(partner: PartnerId, payload: { title: string; body: string; url: string }) {
  if (!vapidPublicKey || !vapidPrivateKey) return;
  const remaining: webpush.PushSubscription[] = [];
  for (const subscription of subscriptions[partner] || []) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      remaining.push(subscription);
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode !== 404 && statusCode !== 410) {
        console.error('Push delivery failed:', error);
        remaining.push(subscription);
      }
    }
  }
  subscriptions[partner] = remaining;
  writeJsonFile(SUBSCRIPTIONS_FILE, subscriptions);
}

app.get('/api/push/public-key', (_req, res) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(503).json({ error: 'Background push is not configured on the app server.' });
    return;
  }
  res.json({ publicKey: vapidPublicKey });
});

app.post('/api/push/subscribe', requirePartner, (req, res) => {
  const partner = res.locals.partner as PartnerId;
  const subscription = req.body as webpush.PushSubscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    res.status(400).json({ error: 'A valid browser push subscription is required.' });
    return;
  }
  subscriptions[partner] = [
    ...(subscriptions[partner] || []).filter((item) => item.endpoint !== subscription.endpoint),
    subscription
  ];
  writeJsonFile(SUBSCRIPTIONS_FILE, subscriptions);
  res.json({ status: 'ok' });
});

app.get('/api/state', requirePartner, (req, res) => {
  const room = String(req.query.room || 'AARON-VINI-US');
  res.json({ status: 'ok', state: projectState(rooms[room], res.locals.partner as PartnerId) });
});

app.post('/api/state', requirePartner, (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'A state object is required.' });
    return;
  }
  const room = String(req.body.roomCode || 'AARON-VINI-US');
  try {
    const stored = applyClientState(room, res.locals.partner as PartnerId, req.body);
    const notifyAssignments = stored.notifyAssignments as any[];
    delete stored.notifyAssignments;
    broadcastState(room, stored);
    res.json({ status: 'ok', state: projectState(stored, res.locals.partner as PartnerId) });
    const assignedTo = (res.locals.partner as PartnerId) === 'aaron' ? 'vini' : 'aaron';
    for (const quest of notifyAssignments) {
      void notifyPartner(assignedTo, {
        title: 'A new challenge is waiting',
        body: `${stored.profiles?.[res.locals.partner as PartnerId]?.name || 'Your partner'} set a challenge for you${quest.title ? `: ${quest.title}` : '.'}`,
        url: '/'
      }).catch((error: unknown) => console.error('Push notification processing failed:', error));
    }
  } catch (error) {
    console.error('Could not update room state:', error);
    res.status(500).json({ error: 'Could not save room state.' });
  }
});

wss.on('connection', (ws) => {
  let identity: ClientIdentity | null = null;
  let authPending = false;
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!identity) {
        if (authPending) {
          ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Room authentication is already in progress.' }));
          return;
        }
        if (msg.type !== 'JOIN_ROOM') throw new Error('Authenticate before sending room messages.');
        authPending = true;
        const partner = await authenticateToken(msg.token);
        const roomCode = String(msg.roomCode || 'AARON-VINI-US');
        identity = { partner, roomCode };
        authPending = false;
        clientRooms.set(ws, identity);
        ws.send(JSON.stringify({ type: 'AUTH_OK' }));
        const state = projectState(rooms[roomCode], partner);
        if (state) ws.send(JSON.stringify({ type: 'STATE_UPDATE', roomCode, payload: state }));
        return;
      }

      if (msg.type === 'STATE_UPDATE' && msg.payload) {
        const stored = applyClientState(identity.roomCode, identity.partner, msg.payload);
        const assignments = stored.notifyAssignments as any[];
        delete stored.notifyAssignments;
        broadcastState(identity.roomCode, stored, ws);
        for (const quest of assignments) {
          const recipient = identity.partner === 'aaron' ? 'vini' : 'aaron';
          void notifyPartner(recipient, {
            title: 'A new challenge is waiting',
            body: `${stored.profiles?.[identity.partner]?.name || 'Your partner'} set a challenge for you${quest.title ? `: ${quest.title}` : '.'}`,
            url: '/'
          }).catch((error: unknown) => console.error('Push notification processing failed:', error));
        }
      } else if (msg.type === 'PARTNER_TYPING' || msg.type === 'PARTNER_PING') {
        broadcastToRoom(identity.roomCode, { ...msg, fromPartner: identity.partner }, ws);
      }
    } catch (error) {
      authPending = false;
      const message = error instanceof Error ? error.message : 'WebSocket authentication failed.';
      ws.send(JSON.stringify({ type: identity ? 'SYNC_ERROR' : 'AUTH_ERROR', message }));
      if (!identity) ws.close(1008, 'Unauthorized');
    }
  });
  ws.on('close', () => clientRooms.delete(ws));
});

const publicPath = path.join(__dirname, 'public');
const distPath = path.join(__dirname, 'dist');
app.use(express.static(publicPath));
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Daily SideQuests: Us Edition live server running on http://0.0.0.0:${PORT}`);
});
