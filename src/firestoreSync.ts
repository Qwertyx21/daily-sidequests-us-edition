import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
   setDoc,
  updateDoc,
  type DocumentData,
  type Query,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export type PartnerId = 'aaron' | 'vini';

export interface SyncState {
  roomCode: string;
  profiles: Partial<Record<PartnerId, DocumentData>>;
  completedCountsByPartner: Record<PartnerId, number>;
  quests: DocumentData[];
  memories: DocumentData[];
  messages: DocumentData[];
  privateWhispers: Record<PartnerId, string>;
  lastUpdated: number;
}

export interface LegacySeedState extends SyncState {
  profiles: Record<PartnerId, DocumentData>;
}

function roomCollection(roomCode: string, name: string) {
  return collection(db, 'couples', roomCode, name);
}

function roomDocument(roomCode: string, collectionName: string, id: string) {
  return doc(db, 'couples', roomCode, collectionName, id);
}

function extractTimestampFromId(id: unknown, fallback = Date.now()): number {
  if (typeof id !== 'string') return fallback;
  const match = /(\d{10,15})/.exec(id);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/**
 * Ensures any data:image URL fits comfortably within Firestore's 1 MiB document size limit
 * without relying on an external Storage bucket that may not be provisioned.
 */
export async function ensureFirestoreSafeImage(source: string): Promise<string> {
  if (!source || !source.startsWith('data:image/')) return source;
  if (source.length <= 480_000 || typeof document === 'undefined') return source;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 640;
        const size = Math.min(img.width || maxDim, img.height || maxDim);
        const sx = ((img.width || size) - size) / 2;
        const sy = ((img.height || size) - size) / 2;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(source);
          return;
        }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxDim, maxDim);
        let compressed = canvas.toDataURL('image/jpeg', 0.76);
        if (compressed.length > 480_000) {
          compressed = canvas.toDataURL('image/jpeg', 0.6);
        }
        resolve(compressed);
      } catch {
        resolve(source);
      }
    };
    img.onerror = () => resolve(source);
    img.src = source;
  });
}

async function normalizeQuest(roomCode: string, quest: DocumentData): Promise<DocumentData> {
  const createdAt = Number(quest.createdAt) || extractTimestampFromId(quest.id);
  const updatedAt = Number(quest.updatedAt) || createdAt;
  const normalized: DocumentData = { ...quest, createdAt, updatedAt };
  if (typeof quest.senderPhotoUrl === 'string' && quest.senderPhotoUrl) {
    normalized.senderPhotoUrl = await ensureFirestoreSafeImage(quest.senderPhotoUrl);
  }
  if (quest.secretReward?.photoUrl) {
    normalized.secretReward = {
      ...quest.secretReward,
      photoUrl: await ensureFirestoreSafeImage(quest.secretReward.photoUrl)
    };
  }
  return normalized;
}

async function normalizeMemory(roomCode: string, memory: DocumentData): Promise<DocumentData> {
  const createdAt = Number(memory.createdAt) || extractTimestampFromId(memory.id);
  const updatedAt = Number(memory.updatedAt) || createdAt;
  if (!memory.photoUrl) {
    return { ...memory, createdAt, updatedAt };
  }
  return {
    ...memory,
    createdAt,
    updatedAt,
    photoUrl: await ensureFirestoreSafeImage(memory.photoUrl)
  };
}

async function normalizeMessage(roomCode: string, message: DocumentData): Promise<DocumentData> {
  const createdAt = Number(message.createdAt) || extractTimestampFromId(message.id);
  if (!message.photoUrl) {
    return { ...message, createdAt };
  }
  return {
    ...message,
    createdAt,
    photoUrl: await ensureFirestoreSafeImage(message.photoUrl)
  };
}

function changedById<T extends DocumentData>(before: T[], after: T[]): T[] {
  const previous = new Map(before.map((item) => [String(item.id), JSON.stringify(item)]));
  return after.filter((item) => previous.get(String(item.id)) !== JSON.stringify(item));
}

export async function saveChatMessage(roomCode: string, message: DocumentData): Promise<void> {
  const normalized = await normalizeMessage(roomCode, message);
  await setDoc(roomDocument(roomCode, 'chatMessages', String(message.id)), normalized, { merge: true });
}

export async function saveMemory(roomCode: string, memory: DocumentData): Promise<void> {
  const normalized = await normalizeMemory(roomCode, memory);
  await setDoc(roomDocument(roomCode, 'memories', String(memory.id)), normalized, { merge: true });
}

export async function saveQuest(roomCode: string, quest: DocumentData): Promise<void> {
  const normalized = await normalizeQuest(roomCode, quest);
  await setDoc(roomDocument(roomCode, 'quests', String(quest.id)), normalized, { merge: true });
}

export async function saveSharedPromptAnswer(
  roomCode: string,
  questId: string,
  partner: PartnerId,
  answer: { text: string; answeredAt: string; timestamp: number },
  bothCompleted: boolean
): Promise<void> {
  await setDoc(
    roomDocument(roomCode, 'quests', questId),
    {
      answers: {
        [partner]: answer
      },
      isCompleted: bothCompleted,
      updatedAt: Date.now()
    },
    { merge: true }
  );
  await setDoc(
    roomDocument(roomCode, 'aggregates', 'completions'),
    {
      [partner]: increment(1),
      updatedAt: Date.now()
    },
    { merge: true }
  ).catch((err) => console.warn('Could not update aggregate completion count:', err));
}

export async function persistStateChanges(
  before: SyncState,
  after: SyncState,
  partner: PartnerId
): Promise<void> {
  const errors: unknown[] = [];

  // 1. Sync active partner's profile
  try {
    const oldProfile = before.profiles[partner];
    const newProfile = after.profiles[partner];
    if (JSON.stringify(oldProfile) !== JSON.stringify(newProfile) && newProfile) {
      await setDoc(roomDocument(after.roomCode, 'profiles', partner), {
        ...newProfile,
        id: partner
      }, { merge: true });
    }
  } catch (err) {
    console.error('Failed to persist profile update:', err);
    errors.push(err);
  }

  // 2. Sync private note for active partner
  try {
    const oldNote = before.privateWhispers?.[partner] || '';
    const newNote = after.privateWhispers?.[partner] || '';
    if (oldNote !== newNote) {
      await setDoc(roomDocument(after.roomCode, 'privateNotes', partner), {
        text: newNote,
        updatedAt: Date.now()
      }, { merge: true });
    }
  } catch (err) {
    console.error('Failed to persist private note:', err);
  }

  // 3. Sync quests & completion count
  const priorQuests = new Map(before.quests.map((quest) => [quest.id, quest]));
  for (const quest of changedById(before.quests, after.quests)) {
    try {
      const old = priorQuests.get(quest.id);
      const storedQuest = await normalizeQuest(after.roomCode, quest);
      const questRef = roomDocument(after.roomCode, 'quests', quest.id);
      await setDoc(questRef, storedQuest, { merge: true });

      if (old && !old.isCompleted && quest.isCompleted === true && quest.forPartner === partner && !quest.isSharedPrompt) {
        await setDoc(
          roomDocument(after.roomCode, 'aggregates', 'completions'),
          {
            [partner]: increment(1),
            updatedAt: Date.now()
          },
          { merge: true }
        ).catch((err) => console.warn('Could not update aggregate completion count:', err));
      }
    } catch (err) {
      console.error(`Failed to persist quest ${quest.id}:`, err);
      errors.push(err);
    }
  }

  // 4. Sync chat messages
  for (const message of changedById(before.messages, after.messages)) {
    try {
      const messageRef = roomDocument(after.roomCode, 'chatMessages', message.id);
      const oldMessage = before.messages.find((item) => item.id === message.id);
      if (!oldMessage && message.senderId === partner) {
        const normalized = await normalizeMessage(after.roomCode, message);
        await setDoc(messageRef, normalized, { merge: true });
        continue;
      }

      if (!oldMessage && message.senderId !== partner) {
        const updates: Record<string, unknown> = {};
        if (message.seenByPartner) updates.seenByPartner = true;
        for (const [emoji, partners] of Object.entries(message.reactions || {})) {
          if (Array.isArray(partners) && partners.includes(partner)) {
            updates[`reactions.${emoji}`] = arrayUnion(partner);
          }
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(messageRef, updates).catch(() => {});
        }
        continue;
      }

      if (oldMessage) {
        const reactionUpdates: Record<string, unknown> = {};
        const emojis = new Set([
          ...Object.keys(oldMessage.reactions || {}),
          ...Object.keys(message.reactions || {})
        ]);
        for (const emoji of emojis) {
          const oldHas = (oldMessage.reactions?.[emoji] || []).includes(partner);
          const desired = (message.reactions?.[emoji] || []).includes(partner);
          if (oldHas !== desired) {
            reactionUpdates[`reactions.${emoji}`] = desired ? arrayUnion(partner) : arrayRemove(partner);
          }
        }
        if (!oldMessage.seenByPartner && message.seenByPartner) {
          reactionUpdates.seenByPartner = true;
        }
        if (Object.keys(reactionUpdates).length > 0) {
          await updateDoc(messageRef, reactionUpdates);
        }
      }
    } catch (err) {
      console.error(`Failed to persist chat message ${message.id}:`, err);
      errors.push(err);
    }
  }

  // 5. Sync Polaroid & Photo Vault memories
  for (const memory of changedById(before.memories, after.memories)) {
    try {
      const memoryRef = roomDocument(after.roomCode, 'memories', memory.id);
      const normalized = await normalizeMemory(after.roomCode, memory);
      await setDoc(memoryRef, normalized, { merge: true });
    } catch (err) {
      console.error(`Failed to persist memory ${memory.id}:`, err);
      errors.push(err);
    }
  }

  if (errors.length > 0) {
    throw errors[0];
  }
}

export async function seedRoomFromLocal(state: LegacySeedState, partner: PartnerId): Promise<void> {
  const profilesRef = roomCollection(state.roomCode, 'profiles');
  const questsRef = roomCollection(state.roomCode, 'quests');
  const messagesRef = roomCollection(state.roomCode, 'chatMessages');
  const memoriesRef = roomCollection(state.roomCode, 'memories');

  const [profilesSnap, questsSnap, messagesSnap, memoriesSnap] = await Promise.all([
    getDocs(profilesRef),
    getDocs(questsRef),
    getDocs(messagesRef),
    getDocs(memoriesRef)
  ]);

  if (!profilesSnap.docs.some((item) => item.id === partner) && state.profiles[partner]) {
    await setDoc(roomDocument(state.roomCode, 'profiles', partner), {
      ...state.profiles[partner],
      id: partner
    }, { merge: true });
  }

  const existingQuestIds = new Set(questsSnap.docs.map((d) => d.id));
  await Promise.all(
    state.quests
      .filter((quest) => quest?.id && !existingQuestIds.has(quest.id))
      .map(async (quest) =>
        setDoc(
          roomDocument(state.roomCode, 'quests', quest.id),
          await normalizeQuest(state.roomCode, quest),
          { merge: true }
        )
      )
  );

  const existingMessageIds = new Set(messagesSnap.docs.map((d) => d.id));
  await Promise.all(
    state.messages
      .filter((message) => message?.id && !existingMessageIds.has(message.id))
      .map(async (message) =>
        setDoc(
          roomDocument(state.roomCode, 'chatMessages', message.id),
          await normalizeMessage(state.roomCode, message),
          { merge: true }
        )
      )
  );

  const existingMemoryIds = new Set(memoriesSnap.docs.map((d) => d.id));
  await Promise.all(
    state.memories
      .filter((memory) => memory?.id && !existingMemoryIds.has(memory.id))
      .map(async (memory) =>
        setDoc(
          roomDocument(state.roomCode, 'memories', memory.id),
          await normalizeMemory(state.roomCode, memory),
          { merge: true }
        )
      )
  );
}

export async function publishPresence(
  roomCode: string,
  partner: PartnerId,
  update: { isTyping?: boolean; pingAt?: number }
): Promise<void> {
  await setDoc(
    roomDocument(roomCode, 'presence', partner),
    {
      ...update,
      updatedAt: Date.now()
    },
    { merge: true }
  );
}

export function subscribeToRoom(
  roomCode: string,
  partner: PartnerId,
  onUpdate: (update: Partial<SyncState>) => void,
  onPresence: (partner: PartnerId, data: DocumentData) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];
  const subscribe = <T extends DocumentData>(
    refCollection: Query<DocumentData>,
    map: (docs: T[]) => Partial<SyncState>
  ) => {
    unsubs.push(
      onSnapshot(
        refCollection,
        (snapshot) => {
          const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as unknown as T[];
          onUpdate(map(items));
        },
        onError
      )
    );
  };

  subscribe(roomCollection(roomCode, 'profiles'), (profiles) => ({
    profiles: Object.fromEntries(
      profiles
        .filter((item) => item.id === 'aaron' || item.id === 'vini')
        .map((item) => [item.id, item])
    ) as SyncState['profiles']
  }));

  // Subscribe to all quests in the couple's room so each partner sees:
  // 1. Challenges assigned to them (My Challenges)
  // 2. Challenges they assigned to their partner (Challenges Set for Partner)
  // 3. Shared AI / Random prompts & challenges that both partners must answer
  subscribe(roomCollection(roomCode, 'quests'), (quests) => ({
    quests: [...quests].sort((a, b) => {
      const timeA = Number(a.createdAt) || extractTimestampFromId(a.id, 0);
      const timeB = Number(b.createdAt) || extractTimestampFromId(b.id, 0);
      return timeB - timeA;
    }) as SyncState['quests']
  }));

  subscribe(roomCollection(roomCode, 'chatMessages'), (messages) => ({
    messages: [...messages].sort((a, b) => {
      const timeA = Number(a.createdAt) || extractTimestampFromId(a.id, 0);
      const timeB = Number(b.createdAt) || extractTimestampFromId(b.id, 0);
      return timeA - timeB;
    }) as SyncState['messages']
  }));

  subscribe(roomCollection(roomCode, 'memories'), (memories) => ({
    memories: [...memories].sort((a, b) => {
      const timeA = Number(a.createdAt) || extractTimestampFromId(a.id, 0);
      const timeB = Number(b.createdAt) || extractTimestampFromId(b.id, 0);
      return timeB - timeA;
    }) as SyncState['memories']
  }));

  unsubs.push(
    onSnapshot(
      roomDocument(roomCode, 'privateNotes', partner),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        if (typeof data?.text === 'string') {
          onUpdate({
            privateWhispers: {
              aaron: partner === 'aaron' ? data.text : '',
              vini: partner === 'vini' ? data.text : ''
            }
          });
        }
      },
      () => {
        // Ignore optional privateNote listener errors
      }
    )
  );

  unsubs.push(
    onSnapshot(
      roomDocument(roomCode, 'aggregates', 'completions'),
      (snapshot) => {
        const data = snapshot.data() || {};
        onUpdate({
          completedCountsByPartner: {
            aaron: Math.max(0, Number(data.aaron) || 0),
            vini: Math.max(0, Number(data.vini) || 0)
          }
        });
      },
      onError
    )
  );

  unsubs.push(
    onSnapshot(
      roomCollection(roomCode, 'presence'),
      (snapshot) => {
        for (const item of snapshot.docs) {
          if (item.id === 'aaron' || item.id === 'vini') onPresence(item.id, item.data());
        }
      },
      onError
    )
  );

  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}
