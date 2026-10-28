import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from './firebase';
import {
  persistStateChanges,
  publishPresence,
  saveChatMessage,
  saveMemory,
  saveQuest,
  saveSharedPromptAnswer,
  seedRoomFromLocal,
  subscribeToRoom,
  type SyncState
} from './firestoreSync';
import { registerPushToken } from './pushNotifications';
import {
  Heart,
  Flame,
  Sparkles,
  Camera,
  Clock,
  Lock,
  Unlock,
  Gift,
  MessageCircle,
  Image as ImageIcon,
  Ticket,
  Compass,
  Volume2,
  VolumeX,
  UserCheck,
  Edit3,
  Plus,
  Check,
  CheckCheck,
  X,
  RefreshCw,
  Download,
  Maximize2,
  Send,
  Bell,
  Dices,
  PauseCircle,
  PlayCircle,
  Award,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  ChevronRight,
  RotateCcw,
  Smile,
  Sliders,
  Smartphone,
  Share2,
  Copy,
  Wifi,
  Zap,
  Sun,
  Sunset,
  Moon,
  Coffee
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

type PartnerId = 'aaron' | 'vini';
type TabId = 'quests' | 'vault' | 'chat';
type QuestSlotType = 'morning' | 'afternoon' | 'golden' | 'nightcap';
type WashiTheme = 'rose' | 'gold' | 'sage' | 'kraft';
type SiteThemeId =
  | 'rosewater'
  | 'matcha'
  | 'lavender'
  | 'terracotta'
  | 'coastal'
  | 'midnight-velvet'
  | 'espresso-noir'
  | 'starlight';

interface SiteThemeDefinition {
  id: SiteThemeId;
  name: string;
  icon: string;
  tagline: string;
  isDark: boolean;
  bgPrimary: string;
  bgSurface: string;
  bgSurfaceSoft: string;
  bgHeader: string;
  bgBannerGradient: string;
  bgPageRadial: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderPrimary: string;
  accentPrimary: string;
  accentGradient: string;
  swatchColors: [string, string, string];
}

const SITE_THEMES: Record<SiteThemeId, SiteThemeDefinition> = {
  rosewater: {
    id: 'rosewater',
    name: 'Rosewater Cream',
    icon: '🌸',
    tagline: 'Warm editorial ivory, blush rose & sunlit gold',
    isDark: false,
    bgPrimary: '#FAF7F2',
    bgSurface: '#FFFFFF',
    bgSurfaceSoft: '#F3EDE4',
    bgHeader: 'rgba(250, 247, 242, 0.92)',
    bgBannerGradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 50%, #FFFBEB 100%)',
    bgPageRadial:
      'radial-gradient(at 15% 10%, rgba(244, 63, 94, 0.08) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(217, 119, 6, 0.09) 0px, transparent 55%)',
    textPrimary: '#1C1917',
    textSecondary: '#44403C',
    textMuted: '#78716C',
    borderPrimary: '#E7E0D6',
    accentPrimary: '#E11D48',
    accentGradient: 'linear-gradient(135deg, #F43F5E 0%, #F59E0B 100%)',
    swatchColors: ['#FAF7F2', '#F43F5E', '#F59E0B']
  },
  matcha: {
    id: 'matcha',
    name: 'Kyoto Matcha',
    icon: '🍵',
    tagline: 'Serene botanical sage, oat milk & warm bamboo',
    isDark: false,
    bgPrimary: '#F3F7F2',
    bgSurface: '#FFFFFF',
    bgSurfaceSoft: '#E6EFE4',
    bgHeader: 'rgba(243, 247, 242, 0.92)',
    bgBannerGradient: 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 50%, #FEFCE8 100%)',
    bgPageRadial:
      'radial-gradient(at 15% 10%, rgba(16, 185, 129, 0.09) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(132, 204, 22, 0.09) 0px, transparent 55%)',
    textPrimary: '#14261C',
    textSecondary: '#2F483A',
    textMuted: '#5C7667',
    borderPrimary: '#D3E2D0',
    accentPrimary: '#059669',
    accentGradient: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
    swatchColors: ['#F3F7F2', '#10B981', '#0D9488']
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Daydream',
    icon: '💜',
    tagline: 'Dreamy lilac mist, soft wisteria & berry',
    isDark: false,
    bgPrimary: '#F7F4FC',
    bgSurface: '#FFFFFF',
    bgSurfaceSoft: '#EDE7F6',
    bgHeader: 'rgba(247, 244, 252, 0.92)',
    bgBannerGradient: 'linear-gradient(135deg, #F3E8FF 0%, #FFFFFF 50%, #FCE7F3 100%)',
    bgPageRadial:
      'radial-gradient(at 15% 10%, rgba(168, 85, 247, 0.09) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(236, 72, 153, 0.08) 0px, transparent 55%)',
    textPrimary: '#231834',
    textSecondary: '#463561',
    textMuted: '#736091',
    borderPrimary: '#DFD5F0',
    accentPrimary: '#9333EA',
    accentGradient: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
    swatchColors: ['#F7F4FC', '#9333EA', '#EC4899']
  },
  terracotta: {
    id: 'terracotta',
    name: 'Terracotta Sunset',
    icon: '🌅',
    tagline: 'Golden hour desert peach, warm clay & honey',
    isDark: false,
    bgPrimary: '#FDF6F0',
    bgSurface: '#FFFFFF',
    bgSurfaceSoft: '#F7E9DC',
    bgHeader: 'rgba(253, 246, 240, 0.92)',
    bgBannerGradient: 'linear-gradient(135deg, #FFEDD5 0%, #FFFFFF 50%, #FFE4E6 100%)',
    bgPageRadial:
      'radial-gradient(at 15% 10%, rgba(234, 88, 12, 0.09) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(225, 29, 72, 0.08) 0px, transparent 55%)',
    textPrimary: '#2B1810',
    textSecondary: '#573628',
    textMuted: '#8A6251',
    borderPrimary: '#EED6C4',
    accentPrimary: '#EA580C',
    accentGradient: 'linear-gradient(135deg, #EA580C 0%, #E11D48 100%)',
    swatchColors: ['#FDF6F0', '#EA580C', '#E11D48']
  },
  coastal: {
    id: 'coastal',
    name: 'Amalfi Coastal',
    icon: '🌊',
    tagline: 'Crisp Mediterranean linen, seafoam & azure',
    isDark: false,
    bgPrimary: '#F2F8FB',
    bgSurface: '#FFFFFF',
    bgSurfaceSoft: '#E3EFF6',
    bgHeader: 'rgba(242, 248, 251, 0.92)',
    bgBannerGradient: 'linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #FEF9C3 100%)',
    bgPageRadial:
      'radial-gradient(at 15% 10%, rgba(2, 132, 199, 0.09) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(14, 165, 233, 0.08) 0px, transparent 55%)',
    textPrimary: '#0F2537',
    textSecondary: '#2C4C66',
    textMuted: '#5D7D99',
    borderPrimary: '#CFE2EE',
    accentPrimary: '#0284C7',
    accentGradient: 'linear-gradient(135deg, #0284C7 0%, #0D9488 100%)',
    swatchColors: ['#F2F8FB', '#0284C7', '#0D9488']
  },
  'midnight-velvet': {
    id: 'midnight-velvet',
    name: 'Midnight Velvet (Dark)',
    icon: '🌙',
    tagline: 'Deep obsidian plum, luminous rose & warm gold',
    isDark: true,
    bgPrimary: '#110E16',
    bgSurface: '#1C1724',
    bgSurfaceSoft: '#272033',
    bgHeader: 'rgba(17, 14, 22, 0.93)',
    bgBannerGradient: 'linear-gradient(135deg, #2A1929 0%, #1C1724 55%, #291E19 100%)',
    bgPageRadial:
      'radial-gradient(at 15% 10%, rgba(244, 63, 94, 0.14) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(245, 158, 11, 0.1) 0px, transparent 55%)',
    textPrimary: '#F8F5FA',
    textSecondary: '#DDD6E5',
    textMuted: '#A398B3',
    borderPrimary: '#362D47',
    accentPrimary: '#FB7185',
    accentGradient: 'linear-gradient(135deg, #F43F5E 0%, #F59E0B 100%)',
    swatchColors: ['#110E16', '#F43F5E', '#F59E0B']
  },
  'espresso-noir': {
    id: 'espresso-noir',
    name: 'Espresso Noir (Dark)',
    icon: '☕',
    tagline: 'Cozy late-night cafe roast, caramel & warm cream',
    isDark: true,
    bgPrimary: '#14110F',
    bgSurface: '#211C18',
    bgSurfaceSoft: '#2D2621',
    bgHeader: 'rgba(20, 17, 15, 0.93)',
    bgBannerGradient: 'linear-gradient(135deg, #2D1F1A 0%, #211C18 55%, #2B2318 100%)',
    bgPageRadial:
      'radial-gradient(at 15% 10%, rgba(217, 119, 6, 0.14) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(244, 63, 94, 0.1) 0px, transparent 55%)',
    textPrimary: '#F7F3EF',
    textSecondary: '#DFD7CF',
    textMuted: '#A89D93',
    borderPrimary: '#3D342D',
    accentPrimary: '#F59E0B',
    accentGradient: 'linear-gradient(135deg, #D97706 0%, #E11D48 100%)',
    swatchColors: ['#14110F', '#D97706', '#E11D48']
  },
  starlight: {
    id: 'starlight',
    name: 'Starlight Aurora (Dark)',
    icon: '🌌',
    tagline: 'Deep midnight sky, bioluminescent cyan & violet',
    isDark: true,
    bgPrimary: '#0B111E',
    bgSurface: '#151E31',
    bgSurfaceSoft: '#1E2A44',
    bgHeader: 'rgba(11, 17, 30, 0.93)',
    bgBannerGradient: 'linear-gradient(135deg, #172542 0%, #151E31 55%, #241B3B 100%)',
    bgPageRadial:
      'radial-gradient(at 15% 10%, rgba(56, 189, 248, 0.14) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(168, 85, 247, 0.14) 0px, transparent 55%)',
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    borderPrimary: '#2B3B59',
    accentPrimary: '#38BDF8',
    accentGradient: 'linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%)',
    swatchColors: ['#0B111E', '#0EA5E9', '#8B5CF6']
  }
};

interface PartnerProfile {
  id: PartnerId;
  name: string;
  nickname: string;
  avatar: string;
  tagline: string;
  accentColor: string;
  backgroundColor: string;
  themeId?: SiteThemeId;
}
interface SecretReward {
  photoUrl: string;
  caption: string;
  sticker: string;
  washi: WashiTheme;
  rewardTag: string;
}

interface PolaroidMemory {
  id: string;
  questId?: string;
  slotType?: QuestSlotType;
  ownerId: PartnerId;
  createdBy: PartnerId;
  photoUrl: string;
  caption: string;
  sticker: string;
  washi: WashiTheme;
  timestamp: string;
  questTitle: string;
  isSecretRewardUnlocked?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

type SharedPromptCategory =
  | 'deep-question'
  | 'mini-challenge'
  | 'spicy-sweet'
  | 'future-us'
  | 'playful-debate';

interface SharedPromptAnswer {
  text: string;
  answeredAt: string;
  timestamp: number;
}

interface QuestItem {
  id: string;
  forPartner: PartnerId;
  assignedBy: PartnerId;
  slot: QuestSlotType;
  slotLabel: string;
  scheduledTime: string;
  scheduledAt?: string;
  assignedAt?: string;
  title: string;
  prompt: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  snoozedMinutesTotal: number; // Strict max 60m
  snoozeUntilTimestamp: number | null; // epoch ms when active snooze expires
  secretReward: SecretReward | null;
  completedMemoryId: string | null;
  createdAt?: number;
  updatedAt?: number;
  dropType?: 'photo-drop' | 'sidequest';
  senderPhotoUrl?: string;
  isSharedPrompt?: boolean;
  promptCategory?: SharedPromptCategory;
  answers?: Partial<Record<PartnerId, SharedPromptAnswer>>;
}

interface GoldenVoucher {
  id: string;
  title: string;
  terms: string;
  icon: string;
  issuedBy: PartnerId;
  forPartner: PartnerId;
  isRedeemed: boolean;
  redeemedAt: string | null;
  unlockedAtQuestCount: number;
  isCustom?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: PartnerId;
  text: string;
  photoUrl?: string;
  timestamp: string;
  reactions: Record<string, PartnerId[]>;
  isSystemSpark?: boolean;
  seenByPartner?: boolean;
  replyToText?: string;
  createdAt?: number;
}

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  icon: string;
  tone: 'rose' | 'amber' | 'emerald';
}

interface AppSharedState {
  roomCode: string;
  profiles: Record<PartnerId, PartnerProfile>;
  completedCountsByPartner: Record<PartnerId, number>;
  streakDays: number;
  streakLastCompletedDate: string | null;
  questDayKey: string;
  totalCompletedQuests: number;
  quests: QuestItem[];
  memories: PolaroidMemory[];
  messages: ChatMessage[];
  privateWhispers: Record<PartnerId, string>; // Private per-device scratchpad never shown on the other partner's screen
  vouchers: GoldenVoucher[];
  lastUpdated: number;
}

const SEEDED_MESSAGE_IDS = new Set(['m-1', 'm-2', 'm-3']);
const STARTER_QUEST_IDS = new Set([
  'q-aaron-morning', 'q-aaron-afternoon', 'q-aaron-golden', 'q-aaron-nightcap',
  'q-vini-morning', 'q-vini-afternoon', 'q-vini-golden', 'q-vini-nightcap'
]);
const STARTER_MEMORY_IDS = new Set(['mem-initial-1', 'mem-initial-2', 'mem-initial-3']);

function extractItemTimestamp(id: string | undefined, explicitTime?: number): number {
  if (typeof explicitTime === 'number' && Number.isFinite(explicitTime) && explicitTime > 0) {
    return explicitTime;
  }
  if (typeof id === 'string') {
    const match = /(\d{10,15})/.exec(id);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

const SHARED_PROMPT_CATEGORY_META: Record<
  SharedPromptCategory,
  { label: string; icon: string; badgeClass: string }
> = {
  'deep-question': {
    label: 'AI Deep Question',
    icon: '💭',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  'mini-challenge': {
    label: 'Couple Mini-Challenge',
    icon: '⚡',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  'spicy-sweet': {
    label: 'Sweet & Flirty Spark',
    icon: '🔥',
    badgeClass: 'bg-pink-100 text-pink-800 border-pink-200'
  },
  'future-us': {
    label: 'Future Us Dream',
    icon: '🌙',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  'playful-debate': {
    label: 'Playful Couple Debate',
    icon: '🎲',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
};

const AI_COUPLE_PROMPTS_POOL: Array<{
  category: SharedPromptCategory;
  title: string;
  prompt: string;
}> = [
  {
    category: 'deep-question',
    title: 'Small Moment, Big Love',
    prompt: 'What is one small, ordinary moment with your partner recently that secretly meant the world to you?'
  },
  {
    category: 'mini-challenge',
    title: '3-Emoji Vibe Check Challenge',
    prompt: 'Pick 3 emojis that describe your partner’s energy right now and write one sentence explaining why!'
  },
  {
    category: 'spicy-sweet',
    title: 'First Crush Confession',
    prompt: 'What was the very first thing you noticed or thought about your partner that made you fall for them?'
  },
  {
    category: 'future-us',
    title: 'Spontaneous 48-Hour Escape',
    prompt: 'If we packed a bag tonight for a surprise 48-hour trip together, where are we going and what is the first thing we do?'
  },
  {
    category: 'playful-debate',
    title: 'Zombie Apocalypse Duo Roles',
    prompt: 'If the two of us were in a movie survival adventure together, what role would each of us play and who gets us into trouble first?'
  },
  {
    category: 'deep-question',
    title: 'Time-Machine Replay',
    prompt: 'If we could relive one single day or date from our relationship from start to finish, which memory would you choose?'
  },
  {
    category: 'mini-challenge',
    title: 'Right-In-Front-Of-Me Challenge',
    prompt: 'Look around you right now: describe what you are doing in 10 words and name one thing that would be better if your partner were right next to you.'
  },
  {
    category: 'spicy-sweet',
    title: 'Favorite Little Habit',
    prompt: 'What is a tiny habit, laugh, or expression your partner does without realizing how adorable it is?'
  },
  {
    category: 'future-us',
    title: 'Sunday Morning 5 Years From Now',
    prompt: 'Paint a picture of our ideal cozy Sunday morning together five years in the future—what does it look, sound, and smell like?'
  },
  {
    category: 'playful-debate',
    title: 'Our Official Couple Soundtrack',
    prompt: 'If a movie about Aaron & Vini came out today, what song plays during the opening credits and why?'
  },
  {
    category: 'deep-question',
    title: 'Unspoken Appreciation',
    prompt: 'What is something your partner does for you or for "us" that you want to thank them for right now?'
  },
  {
    category: 'mini-challenge',
    title: 'Two Truths & A Wish (Us Edition)',
    prompt: 'Write two favorite memories of us and one secret wish you want the two of us to do together next month!'
  },
  {
    category: 'spicy-sweet',
    title: 'Heart-Skip Compliment',
    prompt: 'Give your partner the most specific, unfiltered compliment that you know will make them blush when they read it.'
  },
  {
    category: 'future-us',
    title: 'Bucket List SideQuest',
    prompt: 'Name one wild or romantic bucket-list experience Neither of us has ever tried that we HAVE to conquer together.'
  },
  {
    category: 'playful-debate',
    title: 'Desert Island Luxury',
    prompt: 'We are stranded on a cozy tropical island together for a month: besides food, what is the one ridiculous item your partner would insist on bringing?'
  },
  {
    category: 'deep-question',
    title: 'Safe Harbor Feeling',
    prompt: 'When do you feel the most calm, understood, and at home with your partner?'
  },
  {
    category: 'mini-challenge',
    title: '6-Word Love Story Challenge',
    prompt: 'Write the story of Aaron & Vini in exactly 6 words—make them count!'
  },
  {
    category: 'spicy-sweet',
    title: 'Next Hug Forecast',
    prompt: 'Describe in vivid detail the exact hug or kiss waiting for your partner the next time you see each other.'
  }
];

function withoutStarterQuests(quests: QuestItem[]): QuestItem[] {
  return quests.filter((quest) => quest?.id && !STARTER_QUEST_IDS.has(quest.id));
}

function mergeQuests(current: QuestItem[], incoming: QuestItem[]): QuestItem[] {
  const merged = new Map<string, QuestItem>();
  for (const quest of [...withoutStarterQuests(current), ...withoutStarterQuests(incoming)]) {
    if (!quest?.id) continue;
    const previous = merged.get(quest.id);
    if (!previous) {
      const answers = quest.answers || {};
      const isSharedDone = quest.isSharedPrompt
        ? Boolean(answers.aaron?.text && answers.vini?.text)
        : Boolean(quest.isCompleted);
      merged.set(quest.id, {
        ...quest,
        isCompleted: isSharedDone,
         ...(quest.isSharedPrompt ? { answers } : {}),
        createdAt: extractItemTimestamp(quest.id, quest.createdAt) || Date.now()
      });
      continue;
    }

    const mergedAnswers: Partial<Record<PartnerId, SharedPromptAnswer>> = {
      ...(previous.answers || {}),
      ...(quest.answers || {})
    };
    const isSharedPrompt = Boolean(previous.isSharedPrompt || quest.isSharedPrompt);
    const isCompleted = isSharedPrompt
      ? Boolean(mergedAnswers.aaron?.text && mergedAnswers.vini?.text)
      : Boolean(previous.isCompleted || quest.isCompleted);

    merged.set(quest.id, {
      ...previous,
      ...quest,
      isSharedPrompt,
      isCompleted,
      ...(isSharedPrompt ? { answers: mergedAnswers } : {}),
      createdAt: extractItemTimestamp(quest.id, quest.createdAt ?? previous.createdAt) || Date.now()
    });
  }
  return [...merged.values()].sort(
    (a, b) => extractItemTimestamp(b.id, b.createdAt) - extractItemTimestamp(a.id, a.createdAt)
  );
}

function withoutStarterMemories(memories: PolaroidMemory[]): PolaroidMemory[] {
  return memories.filter((memory) => memory?.id && !STARTER_MEMORY_IDS.has(memory.id));
}

function mergeMemories(current: PolaroidMemory[], incoming: PolaroidMemory[]): PolaroidMemory[] {
  const merged = new Map<string, PolaroidMemory>();
  for (const memory of [...withoutStarterMemories(current), ...withoutStarterMemories(incoming)]) {
    if (!memory?.id) continue;
    const previous = merged.get(memory.id);
    if (!previous) {
      merged.set(memory.id, memory);
      continue;
    }
    const prevUpdated = extractItemTimestamp(previous.id, previous.updatedAt ?? previous.createdAt);
    const nextUpdated = extractItemTimestamp(memory.id, memory.updatedAt ?? memory.createdAt);
    if (nextUpdated >= prevUpdated) {
      merged.set(memory.id, { ...previous, ...memory });
    }
  }
  return [...merged.values()].sort(
    (a, b) => extractItemTimestamp(b.id, b.createdAt) - extractItemTimestamp(a.id, a.createdAt)
  );
}

function mergeChatMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const merged = new Map<string, ChatMessage>();
  for (const message of [...current, ...incoming]) {
    if (!message?.id || SEEDED_MESSAGE_IDS.has(message.id) || message.id.startsWith('msg-reply-')) continue;
    const previous = merged.get(message.id);
    if (!previous) {
      merged.set(message.id, {
        ...message,
        reactions: message.reactions || {},
        createdAt: extractItemTimestamp(message.id, message.createdAt) || Date.now()
      });
      continue;
    }

    const reactions: Record<string, PartnerId[]> = {};
    const sourceReactions = message.reactions !== undefined ? message.reactions : previous.reactions || {};
    for (const [emoji, partners] of Object.entries(sourceReactions || {})) {
      if (Array.isArray(partners) && partners.length > 0) {
        reactions[emoji] = [...new Set(partners)];
      }
    }
    merged.set(message.id, {
      ...previous,
      ...message,
      createdAt: extractItemTimestamp(message.id, message.createdAt ?? previous.createdAt) || Date.now(),
      seenByPartner: !!previous.seenByPartner || !!message.seenByPartner,
      reactions
    });
  }
  return [...merged.values()].sort(
    (a, b) => extractItemTimestamp(a.id, a.createdAt) - extractItemTimestamp(b.id, b.createdAt)
  );
}

function getLocalDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function wasRecentlyAssigned(quest: QuestItem): boolean {
  const timestamp = quest.assignedAt ? new Date(quest.assignedAt).getTime() : Number.NaN;
  return Number.isFinite(timestamp) && Date.now() - timestamp >= 0 && Date.now() - timestamp < 10 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Preloaded Curated Polaroid Film Assets (Inlined at Build Time)
// ---------------------------------------------------------------------------

const FILM_PRESETS = [
  {
    id: 'morning-coffee',
    label: 'Morning Lattes & Croissants',
    url: 'data:image/jpeg;base64,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',
    defaultCaption: 'Sleepy morning lattes waiting for you ☕🥐',
    sticker: '☕'
  },
  {
    id: 'afternoon-cafe',
    label: 'Sunlit Matcha Date Table',
    url: 'data:image/jpeg;base64,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',
    defaultCaption: 'Still my favorite table with my favorite person 🍵🌷',
    sticker: '🌷'
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour Balcony Sky',
    url: 'data:image/jpeg;base64,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',
    defaultCaption: 'Caught this pink sky thinking of you 🌆✨',
    sticker: '✨'
  },
  {
    id: 'nightcap-cocoa',
    label: 'Late Night Cocoa & Fairy Lights',
    url: 'data:image/jpeg;base64,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',
    defaultCaption: 'Saved the warmest marshmallow mug for tonight 🌙🧸',
    sticker: '🌙'
  }
];

const STICKER_OPTIONS = ['💌', '✨', '☕', '💋', '🌷', '🔥', '🧸', '🌙', '🍓', '🥂', '🎶', '🦋'];

const WASHI_STYLES: Record<WashiTheme, { label: string; bgClass: string; pattern: string }> = {
  rose: {
    label: 'Rose Water Gingham',
    bgClass: 'bg-rose-300/80 border-rose-400/40',
    pattern: 'repeating-linear-gradient(45deg, rgba(244,63,94,0.22) 0px, rgba(244,63,94,0.22) 6px, rgba(255,255,255,0.45) 6px, rgba(255,255,255,0.45) 12px)'
  },
  gold: {
    label: 'Amber Honey Foil',
    bgClass: 'bg-amber-300/80 border-amber-400/40',
    pattern: 'repeating-linear-gradient(-45deg, rgba(217,119,6,0.25) 0px, rgba(217,119,6,0.25) 5px, rgba(254,243,199,0.6) 5px, rgba(254,243,199,0.6) 10px)'
  },
  sage: {
    label: 'Pressed Botanical',
    bgClass: 'bg-emerald-200/80 border-emerald-400/30',
    pattern: 'repeating-linear-gradient(90deg, rgba(16,185,129,0.18) 0px, rgba(16,185,129,0.18) 4px, rgba(236,253,245,0.6) 4px, rgba(236,253,245,0.6) 8px)'
  },
  kraft: {
    label: 'Vintage Kraft Parcel',
    bgClass: 'bg-orange-200/85 border-orange-300/50',
    pattern: 'repeating-linear-gradient(30deg, rgba(180,83,9,0.16) 0px, rgba(180,83,9,0.16) 7px, rgba(255,237,213,0.5) 7px, rgba(255,237,213,0.5) 14px)'
  }
};

const AVATAR_OPTIONS = ['🦊', '🐰', '🐻', '🐱', '🐼', '🐨', '🦁', '🐸', '☕', '🌸', '🌙', '🍓'];

const QUICK_LOVE_SPARKS = [
  'Sending you a big kiss 💋',
  'Did you see your new challenge? 👀',
  'Check the Photo Vault! 📸',
  'You + me + coffee in 10 mins? ☕',
  'Missing your face right now 🥺❤️'
];

const REACTION_EMOJIS = ['❤️', '💋', '🥺', '😂', '🔥'];

// ---------------------------------------------------------------------------
// Web Audio API Sound Synthesizer (Chimes, Polaroid Shutter, Flip, Wax Stamp)
// ---------------------------------------------------------------------------

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.isMuted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  playChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.48);
    });
  }

  playFanfare() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 987.77, 1174.66];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.8);
    });
  }

  playCardFlip() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playWaxStamp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(140, now);
    thud.frequency.exponentialRampToValueAtTime(48, now + 0.22);
    thudGain.gain.setValueAtTime(0.28, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.26);

    const sparkle = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkle.type = 'triangle';
    sparkle.frequency.setValueAtTime(880, now + 0.12);
    sparkle.frequency.exponentialRampToValueAtTime(1318.5, now + 0.38);
    sparkleGain.gain.setValueAtTime(0.1, now + 0.12);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkle.start(now + 0.12);
    sparkle.stop(now + 0.44);
  }

  playPolaroidShutter() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }
}

const soundEngine = new SoundEffectsEngine();

// ---------------------------------------------------------------------------
// Celebratory Confetti Engine
// ---------------------------------------------------------------------------

function triggerCelebrationConfetti() {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = ['#F43F5E', '#FB7185', '#F59E0B', '#FBBF24', '#10B981', '#EC4899', '#FFF1F2'];
  const particles = Array.from({ length: 85 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 160,
    y: canvas.height * 0.45,
    vx: (Math.random() - 0.5) * 15,
    vy: -Math.random() * 14 - 5,
    size: Math.random() * 8 + 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    vRot: (Math.random() - 0.5) * 12,
    shape: Math.random() > 0.35 ? 'rect' : 'heart',
    alpha: 1
  }));

  let frame = 0;
  const animate = () => {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38;
      p.vx *= 0.99;
      p.rotation += p.vRot;
      if (frame > 55) p.alpha = Math.max(0, p.alpha - 0.025);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'heart') {
        const s = p.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s * 1.2, 0, -s * 0.4);
        ctx.bezierCurveTo(s * 0.5, -s * 1.2, s, -s * 0.4, 0, s * 0.4);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      }
      ctx.restore();
    });

    if (frame < 95) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(animate);
}

// ---------------------------------------------------------------------------
// Client-Side Image Compression Helper
// ---------------------------------------------------------------------------

function compressImageFile(file: File, maxDim = 640, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const { width, height } = img;
        const size = Math.min(width, height);
        const sx = (width - size) / 2;
        const sy = (height - size) / 2;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxDim, maxDim);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 480_000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.62);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function saveStateToLocalStorage(state: AppSharedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    try {
      // If localStorage is near the 5MB limit due to many photos, keep all chats & quests and the 8 most recent photos in localStorage
      // (Firestore cloud + IndexedDB persistentLocalCache retain 100% of photos permanently).
      const compactState: AppSharedState = {
        ...state,
        memories: state.memories.slice(0, 8)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compactState));
    } catch {
      // Ignore storage quota errors
    }
  }
}

// ---------------------------------------------------------------------------
// Copy to Clipboard Helper (Canvas-Safe with execCommand Fallback)
// ---------------------------------------------------------------------------

function copyTextSafe(text: string): boolean {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Initial Default Couple State (Aaron & Vini)
// ---------------------------------------------------------------------------

function createInitialState(): AppSharedState {
  return {
    roomCode: 'AARON-VINI-US',
    profiles: {
      aaron: {
        id: 'aaron',
        name: 'Aaron',
        nickname: 'Sunbeam Bear',
        avatar: '🐻',
        tagline: 'Coffee brewer & late-night shoulder masseuse',
        accentColor: '#E11D48',
        backgroundColor: '#FAF7F2'
      },
      vini: {
        id: 'vini',
        name: 'Vini',
        nickname: 'Honeybee',
        avatar: '🐰',
        tagline: 'Sunset chaser & reigning Polaroid curator',
        accentColor: '#D97706',
        backgroundColor: '#FAF7F2'
      }
    },
    completedCountsByPartner: { aaron: 0, vini: 0 },
    streakDays: 0,
    streakLastCompletedDate: null,
    questDayKey: getLocalDateKey(),
    totalCompletedQuests: 0,
    quests: [],
    memories: [],
    messages: [],
    vouchers: [],
    privateWhispers: {
      aaron: '',
      vini: ''
    },
    lastUpdated: Date.now()
  };
}

const STORAGE_KEY = 'daily_sidequests_us_edition_v2';
const DEVICE_LOCK_KEY = 'daily_sidequests_device_owner_v2';
const DARK_MODE_KEY = 'daily_sidequests_dark_mode_v1';
const THEME_STORAGE_KEY = 'daily_sidequests_theme_id_v1';
const AUTHORIZED_EMAILS: Record<PartnerId, string> = {
  aaron: 'aaronmathewg21@gmail.com',
  vini: 'viniputhran17@gmail.com'
};

function triggerLockScreenNotification(title: string, body: string, tag = 'sidequest-alert') {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, {
            body,
            tag,
            vibrate: [200, 100, 200]
          } as NotificationOptions);
        })
        .catch(() => {
          new Notification(title, { body, tag });
        });
    } else {
      new Notification(title, { body, tag });
    }
  } catch {
    console.error('Browser notification could not be displayed.');
  }
}

// ---------------------------------------------------------------------------
// Main Application Component
// ---------------------------------------------------------------------------

export default function App() {
  // The signed-in Google account selects the partner; URL parameters never control identity.
  const initialDeviceState = useMemo(() => {
    try {
      const savedLock = localStorage.getItem(DEVICE_LOCK_KEY);
      if (savedLock) {
        const parsed = JSON.parse(savedLock);
        if (parsed && (parsed.partner === 'aaron' || parsed.partner === 'vini')) {
          return { partner: parsed.partner as PartnerId, locked: !!parsed.locked };
        }
      }
    } catch {
      // ignore storage errors
    }
    return { partner: 'aaron' as PartnerId, locked: true };
  }, []);

  // Active Partner Role & Device Lock State
  // When `isDeviceLocked` is true (default for real two-phone use), Aaron's phone is locked to Aaron's perspective
  // and Vini's phone is locked to Vini's perspective so Aaron's side chat/private notes are never shown on Vini's app!
  const [activePartner, setActivePartner] = useState<PartnerId>(initialDeviceState.partner);
  const [isDeviceLocked, setIsDeviceLocked] = useState<boolean>(initialDeviceState.locked);
  const [questViewSubMode, setQuestViewSubMode] = useState<'my-quests' | 'assign-partner' | 'shared-prompts'>('my-quests');

  const [activeTab, setActiveTab] = useState<TabId>('quests');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [siteThemeId, setSiteThemeId] = useState<SiteThemeId>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as SiteThemeId | null;
      if (savedTheme && SITE_THEMES[savedTheme]) {
        return savedTheme;
      }
      if (localStorage.getItem(DARK_MODE_KEY) === 'true') {
        return 'midnight-velvet';
      }
    } catch {
      // ignore storage errors
    }
    return 'rosewater';
  });
  const activeSiteTheme = SITE_THEMES[siteThemeId] || SITE_THEMES.rosewater;
  const isDarkMode = activeSiteTheme.isDark;
  const lastLightThemeRef = useRef<SiteThemeId>(activeSiteTheme.isDark ? 'rosewater' : activeSiteTheme.id);
  const lastDarkThemeRef = useRef<SiteThemeId>(activeSiteTheme.isDark ? activeSiteTheme.id : 'midnight-velvet');

  useEffect(() => {
    if (activeSiteTheme.isDark) {
      lastDarkThemeRef.current = activeSiteTheme.id;
    } else {
      lastLightThemeRef.current = activeSiteTheme.id;
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, activeSiteTheme.id);
      localStorage.setItem(DARK_MODE_KEY, String(activeSiteTheme.isDark));
    } catch {
      // Theme still works for this session if storage is unavailable.
    }
  }, [activeSiteTheme]);

  const handleSelectSiteTheme = (nextThemeId: SiteThemeId) => {
    if (!SITE_THEMES[nextThemeId]) return;
    soundEngine.playCardFlip();
    setSiteThemeId(nextThemeId);
  };

  const handleToggleDarkMode = () => {
    soundEngine.playCardFlip();
    setSiteThemeId((currentId) => {
      const cur = SITE_THEMES[currentId] || SITE_THEMES.rosewater;
      return cur.isDark ? lastLightThemeRef.current : lastDarkThemeRef.current;
    });
  };
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const [syncChannelStatus, setSyncChannelStatus] = useState<'live' | 'local'>('live');
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    try {
      return typeof Notification !== 'undefined' ? Notification.permission : 'default';
    } catch {
      return 'default';
    }
  });
  const [pushSetupStatus, setPushSetupStatus] = useState('');
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // Core Shared Couple State
  const [appState, setAppState] = useState<AppSharedState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.profiles && Array.isArray(parsed.quests)) {
          const hasStreakMetadata = Object.prototype.hasOwnProperty.call(parsed, 'streakLastCompletedDate');
          return {
            ...createInitialState(),
            ...parsed,
            completedCountsByPartner: {
              aaron: Math.max(0, Number(parsed.completedCountsByPartner?.aaron) || 0),
              vini: Math.max(0, Number(parsed.completedCountsByPartner?.vini) || 0)
            },
            quests: withoutStarterQuests(parsed.quests),
            memories: withoutStarterMemories(Array.isArray(parsed.memories) ? parsed.memories : []),
            messages: mergeChatMessages([], Array.isArray(parsed.messages) ? parsed.messages : []),
            vouchers: [],
            streakDays: hasStreakMetadata ? Math.max(0, Number(parsed.streakDays) || 0) : 0,
            streakLastCompletedDate: typeof parsed.streakLastCompletedDate === 'string'
              ? parsed.streakLastCompletedDate
              : null,
            questDayKey: typeof parsed.questDayKey === 'string' ? parsed.questDayKey : ''
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return createInitialState();
  });
  const knownQuestIdsRef = useRef(new Set(appState.quests.map((quest) => quest.id)));
  const knownMessageIdsRef = useRef(new Set(appState.messages.map((message) => message.id)));
  const hasChatSnapshotRef = useRef(false);
  const hasQuestSnapshotRef = useRef(false);
  const poppedPromptIdsRef = useRef(new Set<string>());
  const autoPromptGeneratedRef = useRef(false);
  const lastPingAtRef = useRef(0);

  // Per-Device Private Drafts (Never synced or exposed to the other partner's chat UI!)
  const [chatDraftsByPartner, setChatDraftsByPartner] = useState<Record<PartnerId, string>>({
    aaron: '',
    vini: ''
  });
  const [showPrivateNotePad, setShowPrivateNotePad] = useState<boolean>(false);

  // In-app Notification Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Modals State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isLiveSyncModalOpen, setIsLiveSyncModalOpen] = useState<boolean>(false);
  const [editingQuest, setEditingQuest] = useState<QuestItem | null>(null);
  const [completingQuest, setCompletingQuest] = useState<QuestItem | null>(null);
  const [unlockedPolaroidModal, setUnlockedPolaroidModal] = useState<PolaroidMemory | null>(null);
  const [editingMemoryModal, setEditingMemoryModal] = useState<PolaroidMemory | null>(null);
  const [isSpontaneousMemoryOpen, setIsSpontaneousMemoryOpen] = useState<boolean>(false);
  const [lightboxMemory, setLightboxMemory] = useState<PolaroidMemory | null>(null);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState<boolean>(false);
  const [isCustomVoucherModalOpen, setIsCustomVoucherModalOpen] = useState<boolean>(false);
  const [challengeDropType, setChallengeDropType] = useState<'photo-drop' | 'sidequest'>('photo-drop');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengePrompt, setChallengePrompt] = useState('');
  const [challengeDateTime, setChallengeDateTime] = useState('');
  const [challengePhotoUrl, setChallengePhotoUrl] = useState('');
  const [challengePhotoBusy, setChallengePhotoBusy] = useState(false);
  const [activeSharedPromptModalId, setActiveSharedPromptModalId] = useState<string | null>(null);
  const [sharedPromptDrafts, setSharedPromptDrafts] = useState<Record<string, string>>({});
  const photoUploadRef = useRef<HTMLInputElement | null>(null);
  const chatPhotoUploadRef = useRef<HTMLInputElement | null>(null);
  const challengeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const challengeGalleryInputRef = useRef<HTMLInputElement | null>(null);

  // Photo Vault filter
  const [vaultFilter, setVaultFilter] = useState<'all' | PartnerId>('all');
  const [flippedVouchers, setFlippedVouchers] = useState<Record<string, boolean>>({});
  const [stampingVoucherId, setStampingVoucherId] = useState<string | null>(null);

  // Active Reaction Message ID
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  // Refs for real-time sync
  const appStateRef = useRef(appState);
  const syncBaselineRef = useRef<SyncState>(appState);
  const persistenceQueueRef = useRef(Promise.resolve());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStateRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const otherPartner: PartnerId = activePartner === 'aaron' ? 'vini' : 'aaron';
  const currentProfile = appState.profiles[activePartner];
  const partnerProfile = appState.profiles[otherPartner];
  const chatDraft = chatDraftsByPartner[activePartner] || '';

  // Helper to show a toast
  const pushToast = useCallback((title: string, message: string, icon = '✨', tone: 'rose' | 'amber' | 'emerald' = 'rose') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [{ id, title, message, icon, tone }, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Save device lock preference
  const saveDeviceIdentity = (partner: PartnerId, locked: boolean) => {
    setActivePartner(partner);
    setIsDeviceLocked(locked);
    try {
      localStorage.setItem(DEVICE_LOCK_KEY, JSON.stringify({ partner, locked }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void getRedirectResult(auth).catch((error: unknown) => {
      if (error instanceof Error && error.message) {
        setAuthError(error.message);
      }
    });
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthChecking(false);
        if (!user?.email) {
          setAuthEmail(null);
          return;
        }
        const email = user.email.trim().toLowerCase();
        const partner = (['aaron', 'vini'] as PartnerId[]).find(
          (id) => AUTHORIZED_EMAILS[id] === email
        );
        if (!partner) {
          setAuthEmail(null);
          setAuthError('This Google account is not authorized for this couple app.');
          void signOut(auth).catch((error: unknown) => {
            setAuthError(error instanceof Error ? error.message : 'Unable to sign out the unauthorized account.');
          });
          return;
        }
        setAuthError('');
        setAuthEmail(email);
        saveDeviceIdentity(partner, true);
        setQuestViewSubMode('my-quests');
        setAppState((current) => {
          const scoped = {
            ...current,
            quests: mergeQuests([], current.quests || []),
            privateWhispers: {
              aaron: partner === 'aaron' ? current.privateWhispers?.aaron || '' : '',
              vini: partner === 'vini' ? current.privateWhispers?.vini || '' : ''
            }
          };
          saveStateToLocalStorage(scoped);
          return scoped;
        });
      },
      (error) => {
        setAuthChecking(false);
        setAuthError(`Google sign-in status could not be checked: ${error.message}`);
      }
    );
    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setAuthError(error instanceof Error ? error.message : 'Google sign-in failed.');
    }
  };

  const requestPushNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setPushSetupStatus('This browser does not support notifications.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission !== 'granted') {
        setPushSetupStatus('Notification access was not granted; background alerts are off.');
        return;
      }
      await registerPushToken(activePartner, appState.roomCode);
      setPushSetupStatus('Background challenge notifications are enabled on this device.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not enable background notifications.';
      setPushSetupStatus(message);
      console.error('Background push subscription failed:', error);
    }
  };

  useEffect(() => {
    if (authEmail && notifPermission === 'granted') {
      void registerPushToken(activePartner, appState.roomCode).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Could not restore the push subscription.';
        setPushSetupStatus(message);
        console.error('Background push subscription restore failed:', error);
      });
    }
  }, [activePartner, appState.roomCode, authEmail, notifPermission]);

  // Keep the latest state available to realtime listeners and persistence callbacks.
  appStateRef.current = appState;

  // Persist local changes; Firestore snapshots deliver updates to the other device.
  const updateSharedState = useCallback((updater: (prev: AppSharedState) => AppSharedState) => {
    setAppState((prev) => {
      const updated = updater(prev);
      const next = {
        ...updated,
        quests: mergeQuests(prev.quests || [], updated.quests || []),
        memories: mergeMemories([], updated.memories || []),
        messages: mergeChatMessages(prev.messages || [], updated.messages || []),
        lastUpdated: Date.now()
      };
      appStateRef.current = next;
      saveStateToLocalStorage(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!authEmail) return;
    const targetState = appState;
    persistenceQueueRef.current = persistenceQueueRef.current
      .then(async () => {
        const previous = syncBaselineRef.current;
        await persistStateChanges(previous, targetState, activePartner);
        syncBaselineRef.current = targetState;
        setSyncChannelStatus('live');
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Could not save your changes to Firestore.';
        setSyncChannelStatus('local');
        setAuthError(message);
        console.error('Firestore update failed:', error);
      });
  }, [activePartner, appState, authEmail]);

  useEffect(() => {
    if (!authEmail) return;
    let active = true;
    const unsubscribe = subscribeToRoom(
      appState.roomCode,
      activePartner,
      (update) => {
        if (!active) return;
        const current = appStateRef.current;
        const merged: AppSharedState = {
          ...current,
          ...update,
          profiles: {
            ...current.profiles,
            ...(update.profiles as Partial<Record<PartnerId, PartnerProfile>> || {})
          },
          completedCountsByPartner: {
            ...current.completedCountsByPartner,
            ...(update.completedCountsByPartner || {})
          },
          quests: update.quests
            ? mergeQuests(current.quests || [], update.quests as QuestItem[])
            : current.quests,
          memories: update.memories
            ? mergeMemories(current.memories || [], update.memories as PolaroidMemory[])
            : current.memories,
          messages: update.messages
            ? mergeChatMessages(current.messages || [], update.messages as ChatMessage[])
            : current.messages,
          privateWhispers: {
            ...current.privateWhispers,
            ...(update.privateWhispers
              ? {
                  [activePartner]:
                    update.privateWhispers[activePartner] ?? current.privateWhispers[activePartner]
                }
              : {})
          },
          lastUpdated: Date.now()
        };
        const newAssignments = merged.quests.filter(
          (quest) =>
            !quest.isSharedPrompt &&
            quest.forPartner === activePartner &&
            quest.assignedBy !== activePartner &&
            wasRecentlyAssigned(quest) &&
            !knownQuestIdsRef.current.has(quest.id)
        );
        const newSharedPrompts = merged.quests.filter(
          (quest) =>
            quest.isSharedPrompt &&
            !quest.answers?.[activePartner]?.text &&
            !poppedPromptIdsRef.current.has(quest.id)
        );
        for (const quest of merged.quests) knownQuestIdsRef.current.add(quest.id);
        if (update.quests) hasQuestSnapshotRef.current = true;
        if (newAssignments.length) {
          const newest = newAssignments[0];
          const assignedByName = merged.profiles[newest.assignedBy]?.name || 'Your partner';
          const body = `${assignedByName} set a challenge for you: ${newest.title}`;
          pushToast('New challenge received', body, '🔔', 'amber');
          soundEngine.playChime();
          triggerLockScreenNotification('New challenge received', body, `challenge-${newest.id}`);
        }
        if (newSharedPrompts.length) {
          const newestPrompt = newSharedPrompts[0];
          for (const p of newSharedPrompts) poppedPromptIdsRef.current.add(p.id);
          setActiveSharedPromptModalId(newestPrompt.id);
          soundEngine.playChime();
          pushToast(
            '✨ Couple Prompt for Both of You!',
            `"${newestPrompt.title}" — Both ${merged.profiles.aaron.name} & ${merged.profiles.vini.name} must answer!`,
            '🤖',
            'rose'
          );
        }
        const newMessages = hasChatSnapshotRef.current
          ? merged.messages.filter(
              (message) => message.senderId !== activePartner && !knownMessageIdsRef.current.has(message.id)
            )
          : [];
        for (const message of merged.messages) knownMessageIdsRef.current.add(message.id);
        if (update.messages) hasChatSnapshotRef.current = true;
        if (newMessages.length) {
          soundEngine.playChime();
          const newestMessage = newMessages[newMessages.length - 1];
          pushToast('New chat message', newestMessage.text, '💬', 'rose');
        }
        syncBaselineRef.current = merged;
        appStateRef.current = merged;
        setAppState(merged);
        saveStateToLocalStorage(merged);
        setSyncChannelStatus('live');
      },
      (sender, data) => {
        if (sender === activePartner) return;
        if (data.isTyping === true) {
          setPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
        } else if (data.isTyping === false) {
          setPartnerTyping(false);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
        const pingAt = Number(data.pingAt) || 0;
        if (pingAt && pingAt > lastPingAtRef.current && pingAt > Date.now() - 15000) {
          lastPingAtRef.current = pingAt;
          soundEngine.playChime();
          const senderName = appStateRef.current.profiles[sender]?.name || 'Your partner';
          const text = `${senderName} sent a Heart Ping! 💓`;
          pushToast(text, 'Thinking of you right now 💓', '💓', 'rose');
          triggerLockScreenNotification(text, 'Thinking of you right now 💓', `heart-ping-${pingAt}`);
        }
      },
      (error) => {
        setSyncChannelStatus('local');
        setAuthError(`Firestore sync failed: ${error.message}`);
        console.error('Firestore listener failed:', error);
      }
    );

    return () => {
      active = false;
      unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activePartner, appState.roomCode, authEmail, pushToast]);

  useEffect(() => {
    if (!authEmail) return;
    const initialData = appStateRef.current;
    void seedRoomFromLocal(initialData, activePartner).catch((error: unknown) => {
      console.error('Firestore migration failed:', error);
    });
  }, [activePartner, authEmail]);

  // Broadcast live typing state through a small Firestore presence document.
  const emitTypingSignal = useCallback(
    (isTypingNow: boolean) => {
      if (typingStateRef.current === isTypingNow) return;
      typingStateRef.current = isTypingNow;
      void publishPresence(appState.roomCode, activePartner, { isTyping: isTypingNow }).catch((error: unknown) => {
        console.error('Could not publish typing state:', error);
      });
    },
    [activePartner, appState.roomCode]
  );

  // Mark incoming partner messages as "Seen ✓✓" when viewing Chat Tab on this partner's device
  useEffect(() => {
    if (activeTab !== 'chat') return;
    const hasUnseenFromPartner = appState.messages.some(
      (m) => m.senderId !== activePartner && !m.seenByPartner
    );
    if (hasUnseenFromPartner) {
      updateSharedState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.senderId !== activePartner ? { ...m, seenByPartner: true } : m
        )
      }));
    }
  }, [activeTab, activePartner, appState.messages, updateSharedState]);

  // 1-second interval timer for live snooze countdowns.
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      setAppState((prev) => {
        const hasExpired = prev.quests.some(
          (q) => q.snoozeUntilTimestamp !== null && q.snoozeUntilTimestamp <= now
        );
        if (!hasExpired) return prev;
        return {
          ...prev,
          quests: prev.quests.map((q) =>
            q.snoozeUntilTimestamp !== null && q.snoozeUntilTimestamp <= now
              ? { ...q, snoozeUntilTimestamp: null }
              : q
          )
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activePartner, appState.roomCode, pushToast]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [appState.messages.length, activeTab, partnerTyping]);

  // Toggle sound mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.isMuted = next;
    if (!next) {
      soundEngine.playChime();
    }
  };

  // Switch active partner role (only when Device Lock is unlocked, or inside Device Lock settings)
  const handleSwitchPartner = (partner: PartnerId) => {
    if (partner !== activePartner) {
      pushToast('Partner view is locked', 'Sign out and authenticate with the other partner’s Google account to change accounts.', '🔒', 'amber');
    }
  };

  // Mystery Drop Engine
  const handleSurpriseDrop = () => {
    const targetPartner = questViewSubMode === 'assign-partner' ? otherPartner : activePartner;
    const partnerQuests = appState.quests.filter((q) => q.forPartner === targetPartner);
    const lockedQuests = partnerQuests.filter((q) => !q.isUnlocked);

    soundEngine.playChime();
    triggerCelebrationConfetti();

    if (lockedQuests.length > 0) {
      const chosen = lockedQuests[Math.floor(Math.random() * lockedQuests.length)];
      updateSharedState((prev) => ({
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === chosen.id ? { ...q, isUnlocked: true } : q
        )
      }));
      pushToast(
        `Mystery Quest Dropped for ${appState.profiles[targetPartner].name}! 🎲`,
        `${chosen.slotLabel}: "${chosen.title}" is now unlocked!`,
        '🎉',
        'amber'
      );
    } else {
      const bonusIdeas = [
        {
          title: '60-Second Slow Dance in the Kitchen',
          prompt: 'Put on our favorite song right now, grab my hand, and slow-dance in the kitchen for 60 seconds.'
        },
        {
          title: 'Secret Polaroid Compliment Note',
          prompt: 'Write down 2 things you adore about me on a sticky note and snap a Polaroid of it.'
        },
        {
          title: 'Forehead Kiss & Tea Delivery',
          prompt: 'Bring your partner a warm cup of tea or water accompanied by two forehead kisses.'
        }
      ];
      const pick = bonusIdeas[Math.floor(Math.random() * bonusIdeas.length)];
      const targetQuest = partnerQuests.find((q) => !q.isCompleted) || partnerQuests[partnerQuests.length - 1];
      updateSharedState((prev) => ({
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === targetQuest.id
            ? {
                ...q,
                isUnlocked: true,
                isCompleted: false,
                title: pick.title,
                prompt: pick.prompt,
                snoozeUntilTimestamp: null
              }
            : q
        )
      }));
      pushToast(
        `Bonus Surprise Quest Rolled! 🎲`,
        `Sent "${pick.title}" to ${appState.profiles[targetPartner].name}'s timeline!`,
        '✨',
        'rose'
      );
    }
  };

  // Unlock a specific locked quest slot early
  const handleUnlockQuestSlot = (quest: QuestItem) => {
    soundEngine.playChime();
    updateSharedState((prev) => ({
      ...prev,
      quests: prev.quests.map((q) => (q.id === quest.id ? { ...q, isUnlocked: true } : q))
    }));
    pushToast(
      `${quest.slotLabel} Unlocked!`,
      `"${quest.title}" is ready to complete.`,
      '🔓',
      'emerald'
    );
  };

  // Delay / Snooze Mechanics: Strict cumulative maximum of 60 minutes
  const handleSnoozeQuest = (quest: QuestItem, addMinutes: number) => {
    const remainingBudget = Math.max(0, 60 - quest.snoozedMinutesTotal);
    const actualAdd = Math.min(addMinutes, remainingBudget);
    if (actualAdd <= 0) {
      pushToast(
        '60-Minute Snooze Limit Reached',
        'Each daily mission can only be delayed up to 60 minutes total!',
        '⏳',
        'amber'
      );
      return;
    }

    soundEngine.playCardFlip();
    const baseTime =
      quest.snoozeUntilTimestamp && quest.snoozeUntilTimestamp > Date.now()
        ? quest.snoozeUntilTimestamp
        : Date.now();
    const nextSnoozeUntil = baseTime + actualAdd * 60 * 1000;
    const nextTotal = quest.snoozedMinutesTotal + actualAdd;

    updateSharedState((prev) => ({
      ...prev,
      quests: prev.quests.map((q) =>
        q.id === quest.id
          ? {
              ...q,
              snoozedMinutesTotal: nextTotal,
              snoozeUntilTimestamp: nextSnoozeUntil
            }
          : q
      )
    }));

    pushToast(
      `Snoozed +${actualAdd}m (${nextTotal}/60m used)`,
      `"${quest.title}" is paused. Tap Instant Resume anytime!`,
      '⏳',
      'amber'
    );
  };

  // Instant Resume from Snooze
  const handleResumeSnoozedQuest = (quest: QuestItem) => {
    soundEngine.playChime();
    updateSharedState((prev) => ({
      ...prev,
      quests: prev.quests.map((q) =>
        q.id === quest.id ? { ...q, snoozeUntilTimestamp: null } : q
      )
    }));
    pushToast(
      `Mission Resumed! ⚡`,
      `"${quest.title}" is active again—you've got this!`,
      '⚡',
      'emerald'
    );
  };

  // Handle camera snap or photo upload inside the "Send a Love Drop / SideQuest" modal
  const handleChallengePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setChallengePhotoBusy(true);
    try {
      const compressed = await compressImageFile(file, 640, 0.78);
      setChallengePhotoUrl(compressed);
      soundEngine.playPolaroidShutter();
      if (!challengeTitle.trim()) {
        setChallengeTitle(`📸 Photo Drop from ${currentProfile.name}`);
      }
    } catch {
      pushToast('Photo Error', 'Could not read that image. Try another photo.', '⚠️', 'amber');
    } finally {
      setChallengePhotoBusy(false);
    }
  };

  // Acknowledge / Love a Photo Drop sent by partner (1-tap completion without forcing recipient to snap a new photo unless they want to)
  const handleAcknowledgePhotoDrop = (quest: QuestItem) => {
    if (quest.forPartner !== activePartner || quest.isCompleted) return;
    const now = Date.now();
    const formattedTime = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (quest.senderPhotoUrl) {
      const newMemory: PolaroidMemory = {
        id: 'mem-' + now,
        questId: quest.id,
        slotType: quest.slot,
        ownerId: quest.forPartner,
        createdBy: quest.assignedBy,
        photoUrl: quest.senderPhotoUrl,
        caption: quest.title || `Photo Drop from ${appState.profiles[quest.assignedBy]?.name || partnerProfile.name}`,
        sticker: '💖',
        washi: 'rose',
        timestamp: `OCT 28 '26 • ${formattedTime}`,
        questTitle: 'Photo Drop 📸',
        createdAt: now,
        updatedAt: now
      };
      finalizeQuestAndReward(quest, newMemory);
      return;
    }
    handleInitiateQuestCompletion(quest);
  };

  // Complete a Quest -> Auto-unlock Preloaded Secret Reward OR open Blank Polaroid Studio
  const handleInitiateQuestCompletion = (quest: QuestItem) => {
    if (quest.forPartner !== activePartner || quest.isCompleted) return;
    if (quest.secretReward) {
      const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMemory: PolaroidMemory = {
        id: 'mem-' + Date.now(),
        questId: quest.id,
        slotType: quest.slot,
        ownerId: quest.forPartner,
        createdBy: quest.assignedBy,
        photoUrl: quest.secretReward.photoUrl,
        caption: quest.secretReward.caption,
        sticker: quest.secretReward.sticker,
        washi: quest.secretReward.washi,
        timestamp: `OCT 27 '26 • ${formattedTime}`,
        questTitle: quest.slotLabel.replace(/^[^\s]+\s/, ''),
        isSecretRewardUnlocked: true
      };

      finalizeQuestAndReward(quest, newMemory);
    } else {
      setCompletingQuest(quest);
    }
  };

  // Commit completion and advance the streak only after every challenge for that day is done.
  const finalizeQuestAndReward = (quest: QuestItem, memory: PolaroidMemory) => {
    if (quest.forPartner !== activePartner || quest.isCompleted) return;
    soundEngine.playFanfare();
    triggerCelebrationConfetti();

    const now = Date.now();
    const enrichedMemory: PolaroidMemory = {
      ...memory,
      createdAt: memory.createdAt || now,
      updatedAt: now
    };
    const completedQuest: QuestItem = {
      ...quest,
      isCompleted: true,
      snoozeUntilTimestamp: null,
      completedMemoryId: enrichedMemory.id
    };

    void saveMemory(appState.roomCode, enrichedMemory).catch((err) =>
      console.error('Failed to immediately save completed quest memory:', err)
    );
    void saveQuest(appState.roomCode, completedQuest).catch((err) =>
      console.error('Failed to immediately save completed quest:', err)
    );

    updateSharedState((prev) => {
      const currentQuest = prev.quests.find((item) => item.id === quest.id);
      if (!currentQuest || currentQuest.isCompleted || currentQuest.forPartner !== activePartner) return prev;
      const completedQuests = prev.quests.map((q) =>
        q.id === quest.id ? completedQuest : q
      );
      return {
        ...prev,
        totalCompletedQuests: prev.totalCompletedQuests + 1,
        quests: completedQuests,
        memories: [enrichedMemory, ...prev.memories]
      };
    });

    setCompletingQuest(null);
    setUnlockedPolaroidModal(enrichedMemory);
  };

  // Send Chat Message; Firestore snapshots deliver it to the other device immediately.
  const handleSendMessage = (customText?: string, isSpark = false, photoUrl?: string) => {
    const text = (customText !== undefined ? customText : chatDraft).trim();
    if (!text && !photoUrl) return;

    soundEngine.playCardFlip();
    emitTypingSignal(false);
    const now = Date.now();
    const formattedTime = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `msg-${now}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: activePartner,
      text: text || '📸 Sent a photo',
      ...(photoUrl ? { photoUrl } : {}),
      timestamp: formattedTime,
      reactions: {},
      isSystemSpark: isSpark,
      seenByPartner: false,
      createdAt: now
    };

    knownMessageIdsRef.current.add(newMsg.id);
    void saveChatMessage(appState.roomCode, newMsg).catch((err) =>
      console.error('Failed to immediately persist chat message:', err)
    );

    updateSharedState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg]
    }));

    if (customText === undefined) {
      setChatDraftsByPartner((prev) => ({ ...prev, [activePartner]: '' }));
    }
  };

  const handleChatPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    try {
      const timestamp = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      for (const file of files) {
        const now = Date.now();
        const compressedUrl = await compressImageFile(file, 640, 0.78);
        const caption = chatDraft.trim() || file.name.replace(/\.[^.]+$/, '') || 'Shared in Us Chat ❤️';
        const vaultMemory: PolaroidMemory = {
          id: `photo-${now}-${Math.random().toString(36).slice(2, 9)}`,
          ownerId: activePartner,
          createdBy: activePartner,
          photoUrl: compressedUrl,
          caption,
          sticker: '💬',
          washi: 'rose',
          timestamp,
          questTitle: 'Us Chat Photo',
          createdAt: now,
          updatedAt: now
        };
        void saveMemory(appState.roomCode, vaultMemory).catch((err) =>
          console.error('Failed to save chat photo to Photo Vault:', err)
        );
        updateSharedState((prev) => ({
          ...prev,
          memories: [vaultMemory, ...prev.memories]
        }));
        handleSendMessage(chatDraft.trim() || `📸 ${caption}`, false, compressedUrl);
      }
      pushToast('Photo sent & saved! 📸', 'Delivered to chat and saved permanently in Photo Vault.', '📸', 'emerald');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send the selected photo.';
      pushToast('Photo upload error', message, '⚠️', 'amber');
    }
  };

  // Toggle Emoji Reaction on Chat Message
  const handleToggleReaction = (messageId: string, emoji: string) => {
    soundEngine.playCardFlip();
    updateSharedState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => {
        if (m.id !== messageId) return m;
        const currentList = m.reactions[emoji] || [];
        const exists = currentList.includes(activePartner);
        const nextList = exists
          ? currentList.filter((id) => id !== activePartner)
          : [...currentList, activePartner];
        const nextReactions = { ...m.reactions };
        if (nextList.length === 0) {
          delete nextReactions[emoji];
        } else {
          nextReactions[emoji] = nextList;
        }
        return { ...m, reactions: nextReactions };
      })
    }));
    setActiveReactionMessageId(null);
  };

  // Send Heart Ping to Partner's Phone
  const handleSendHeartPing = () => {
    soundEngine.playChime();
    void publishPresence(appState.roomCode, activePartner, { pingAt: Date.now() }).catch((error: unknown) => {
      setAuthError(error instanceof Error ? error.message : 'Could not send your Heart Ping.');
    });
    pushToast(
      `Heart Ping Sent to ${partnerProfile.name}! 💓`,
      `${partnerProfile.name}'s phone just chimed with your love ping.`,
      '💓',
      'rose'
    );
  };

  // Download Polaroid Keepsake as PNG
  const handleDownloadPolaroid = (memory: PolaroidMemory) => {
    soundEngine.playPolaroidShutter();
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 880;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#E7E0D6';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    ctx.fillStyle =
      memory.washi === 'rose'
        ? '#FDA4AF'
        : memory.washi === 'gold'
        ? '#FCD34D'
        : memory.washi === 'sage'
        ? '#6EE7B7'
        : '#FDBA74';
    ctx.fillRect(250, 12, 220, 34);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 48, 60, 624, 624);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 60, 624, 624);

      ctx.font = '48px sans-serif';
      ctx.fillText(memory.sticker || '💌', 610, 668);

      ctx.fillStyle = '#292524';
      ctx.font = '34px "Caveat", cursive, sans-serif';
      ctx.textAlign = 'center';
      const words = memory.caption.split(' ');
      let line = '';
      let y = 742;
      words.forEach((w) => {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > 600) {
          ctx.fillText(line.trim(), canvas.width / 2, y);
          line = w + ' ';
          y += 38;
        } else {
          line = test;
        }
      });
      if (line.trim()) ctx.fillText(line.trim(), canvas.width / 2, y);

      ctx.fillStyle = '#A8A29E';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(
        `${memory.timestamp} • ${appState.profiles[memory.ownerId].name.toUpperCase()} & ${appState.profiles[memory.createdBy].name.toUpperCase()}`,
        canvas.width / 2,
        848
      );

      const link = document.createElement('a');
      link.download = `polaroid-${memory.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      pushToast('Polaroid Keepsake Saved! 📸', 'Downloaded high-res Polaroid PNG to your device.', '📸', 'emerald');
    };
    img.src = memory.photoUrl;
  };

  const handlePhotoVaultUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setPhotoUploadError('');
    try {
      const timestamp = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      const now = Date.now();
      const memories = await Promise.all(
        files.map(async (file, index): Promise<PolaroidMemory> => {
          const itemTime = now + index;
          return {
            id: `photo-${itemTime}-${Math.random().toString(36).slice(2, 9)}`,
            ownerId: activePartner,
            createdBy: activePartner,
            photoUrl: await compressImageFile(file, 640, 0.78),
            caption: file.name.replace(/\.[^.]+$/, ''),
            sticker: '📷',
            washi: 'rose',
            timestamp,
            questTitle: 'Photo Vault',
            createdAt: itemTime,
            updatedAt: itemTime
          };
        })
      );
      updateSharedState((prev) => ({ ...prev, memories: [...memories, ...prev.memories] }));
      await Promise.all(memories.map((memory) => saveMemory(appState.roomCode, memory)));
      pushToast('Photos added', `${memories.length} photo${memories.length === 1 ? '' : 's'} saved to the shared Photo Vault.`, '📸', 'emerald');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add the selected photos.';
      setPhotoUploadError(message);
      console.error('Photo Vault upload failed:', error);
    }
  };

  // Summon a random AI / Couple Prompt that pops up on BOTH Aaron & Vini's phones
  const handleDropSharedPrompt = useCallback(
    (categoryFilter?: SharedPromptCategory, isSilentAuto = false) => {
      const currentQuests = appStateRef.current.quests || [];
      const existingTitles = new Set(
        currentQuests.filter((q) => q.isSharedPrompt).map((q) => q.title.toLowerCase())
      );
      const pool = categoryFilter
        ? AI_COUPLE_PROMPTS_POOL.filter((item) => item.category === categoryFilter)
        : AI_COUPLE_PROMPTS_POOL;
      const unaskedPool = pool.filter((item) => !existingTitles.has(item.title.toLowerCase()));
      const candidates = unaskedPool.length > 0 ? unaskedPool : pool;
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      const now = Date.now();
      const timeLabel = new Date(now).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const meta = SHARED_PROMPT_CATEGORY_META[chosen.category];
      const newSharedPrompt: QuestItem = {
        id: `shared-prompt-${now}-${Math.random().toString(36).slice(2, 7)}`,
        forPartner: 'aaron',
        assignedBy: activePartner,
        slot: 'golden',
        slotLabel: `${meta.icon} ${meta.label}`,
        scheduledTime: timeLabel,
        scheduledAt: new Date(now).toISOString(),
        assignedAt: new Date(now).toISOString(),
        title: chosen.title,
        prompt: chosen.prompt,
        isUnlocked: true,
        isCompleted: false,
        snoozedMinutesTotal: 0,
        snoozeUntilTimestamp: null,
        secretReward: null,
        completedMemoryId: null,
        createdAt: now,
        updatedAt: now,
        isSharedPrompt: true,
        promptCategory: chosen.category,
        answers: {}
      };

      knownQuestIdsRef.current.add(newSharedPrompt.id);
      poppedPromptIdsRef.current.add(newSharedPrompt.id);

      void saveQuest(appStateRef.current.roomCode, newSharedPrompt).catch((err) =>
        console.error('Failed to immediately save shared couple prompt:', err)
      );

      updateSharedState((prev) => ({
        ...prev,
        quests: [newSharedPrompt, ...prev.quests]
      }));

      setActiveSharedPromptModalId(newSharedPrompt.id);
      soundEngine.playChime();
      if (!isSilentAuto) {
        triggerCelebrationConfetti();
      }
      pushToast(
        '✨ AI Couple Prompt Popped Up!',
        `"${chosen.title}" — Both ${appStateRef.current.profiles.aaron.name} & ${appStateRef.current.profiles.vini.name} have to answer!`,
        meta.icon,
        'rose'
      );
    },
    [activePartner, pushToast, updateSharedState]
  );

  // Automatically pop up a random shared AI prompt when the room has no active unanswered prompt
  useEffect(() => {
    if (!authEmail) return;
    const timer = setTimeout(() => {
      if (!hasQuestSnapshotRef.current || autoPromptGeneratedRef.current) return;
      const sharedPrompts = appStateRef.current.quests.filter((q) => q.isSharedPrompt);
      const unansweredByEither = sharedPrompts.find(
        (q) => !q.answers?.aaron?.text || !q.answers?.vini?.text
      );
      if (unansweredByEither) {
        // If the current partner hasn't answered it yet, pop it up once per session
        if (
          !unansweredByEither.answers?.[activePartner]?.text &&
          !poppedPromptIdsRef.current.has(unansweredByEither.id)
        ) {
          poppedPromptIdsRef.current.add(unansweredByEither.id);
          setActiveSharedPromptModalId(unansweredByEither.id);
        }
        autoPromptGeneratedRef.current = true;
        return;
      }

      // If no shared prompt exists or the last one was answered > 4 hours ago, pop up a fresh one!
      const latestCreatedAt = sharedPrompts.reduce(
        (max, q) => Math.max(max, extractItemTimestamp(q.id, q.createdAt)),
        0
      );
      if (sharedPrompts.length === 0 || Date.now() - latestCreatedAt > 4 * 60 * 60 * 1000) {
        autoPromptGeneratedRef.current = true;
        handleDropSharedPrompt(undefined, true);
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [authEmail, activePartner, appState.quests.length, handleDropSharedPrompt]);

  // Submit activePartner's answer to a Shared Couple Prompt
  const handleSubmitSharedPromptAnswer = (promptQuest: QuestItem, rawAnswer?: string) => {
    const draftText = (
      rawAnswer !== undefined ? rawAnswer : sharedPromptDrafts[promptQuest.id] || ''
    ).trim();
    if (!draftText) return;

    const now = Date.now();
    const formattedTime = new Date(now).toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short'
    });
    const myAnswer: SharedPromptAnswer = {
      text: draftText,
      answeredAt: formattedTime,
      timestamp: now
    };
    const nextAnswers: Partial<Record<PartnerId, SharedPromptAnswer>> = {
      ...(promptQuest.answers || {}),
      [activePartner]: myAnswer
    };
    const bothCompleted = Boolean(nextAnswers.aaron?.text && nextAnswers.vini?.text);

    if (bothCompleted) {
      soundEngine.playFanfare();
      triggerCelebrationConfetti();
    } else {
      soundEngine.playChime();
    }

    void saveSharedPromptAnswer(
      appState.roomCode,
      promptQuest.id,
      activePartner,
      myAnswer,
      bothCompleted
    ).catch((err) => console.error('Failed to persist shared prompt answer:', err));

    updateSharedState((prev) => ({
      ...prev,
      totalCompletedQuests: bothCompleted ? prev.totalCompletedQuests + 1 : prev.totalCompletedQuests,
      quests: prev.quests.map((q) =>
        q.id === promptQuest.id
          ? {
              ...q,
              answers: {
                ...(q.answers || {}),
                [activePartner]: myAnswer
              },
              isCompleted: Boolean(
                (activePartner === 'aaron' ? myAnswer.text : q.answers?.aaron?.text) &&
                  (activePartner === 'vini' ? myAnswer.text : q.answers?.vini?.text)
              ),
              updatedAt: now
            }
          : q
      )
    }));

    setSharedPromptDrafts((prev) => ({ ...prev, [promptQuest.id]: '' }));

    // Also share a spark note in Us Chat so both partners see it in their permanent chat history
    handleSendMessage(
      `🤖✨ Answered "${promptQuest.title}": ${draftText}`,
      true
    );

    if (bothCompleted) {
      pushToast(
        'Both Answers Unlocked! 🎉',
        `You and ${partnerProfile.name} both answered "${promptQuest.title}"!`,
        '💖',
        'emerald'
      );
    } else {
      pushToast(
        'Answer Locked In! ✨',
        `Saved! Both answers will reveal as soon as ${partnerProfile.name} answers.`,
        '🔒',
        'amber'
      );
    }
  };

  const myQuestsList = useMemo(
    () =>
      appState.quests
        .filter((q) => !q.isSharedPrompt && q.forPartner === activePartner)
        .sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
          const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : extractItemTimestamp(a.id, a.createdAt);
          const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : extractItemTimestamp(b.id, b.createdAt);
          return timeB - timeA;
        }),
    [appState.quests, activePartner]
  );

  // Challenges set BY activePartner FOR otherPartner (e.g. Vini's list of challenges set for Aaron)
  const challengesSetForPartnerList = useMemo(
    () =>
      appState.quests
        .filter((q) => !q.isSharedPrompt && q.forPartner === otherPartner)
        .sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
          const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : extractItemTimestamp(a.id, a.createdAt);
          const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : extractItemTimestamp(b.id, b.createdAt);
          return timeB - timeA;
        }),
    [appState.quests, otherPartner]
  );

  // Shared AI / Random Couple Prompts that BOTH Aaron & Vini answer
  const sharedPromptsList = useMemo(
    () =>
      appState.quests
        .filter((q) => Boolean(q.isSharedPrompt))
        .sort((a, b) => extractItemTimestamp(b.id, b.createdAt) - extractItemTimestamp(a.id, a.createdAt)),
    [appState.quests]
  );

  const activeSharedPrompt = useMemo(
    () =>
      sharedPromptsList.find((q) => !q.answers?.aaron?.text || !q.answers?.vini?.text) ||
      sharedPromptsList[0] ||
      null,
    [sharedPromptsList]
  );

  const activeModalSharedPrompt = useMemo(
    () =>
      activeSharedPromptModalId
        ? sharedPromptsList.find((q) => q.id === activeSharedPromptModalId) || null
        : null,
    [activeSharedPromptModalId, sharedPromptsList]
  );

  // Quests for the currently viewed sub-mode:
  // 'my-quests': Active partner's own challenges to complete
  // 'assign-partner': Challenges set for the OTHER partner (so Vini sees all challenges she set for Aaron!)
  const displayedQuests = useMemo(() => {
    if (questViewSubMode === 'assign-partner') {
      return challengesSetForPartnerList;
    }
    return myQuestsList;
  }, [questViewSubMode, challengesSetForPartnerList, myQuestsList]);

  const myUncompletedCount = useMemo(
    () =>
      myQuestsList.filter((q) => q.isUnlocked && !q.isCompleted).length +
      sharedPromptsList.filter((q) => !q.answers?.[activePartner]?.text).length,
    [myQuestsList, sharedPromptsList, activePartner]
  );

  const unseenChatCount = useMemo(
    () => appState.messages.filter((m) => m.senderId !== activePartner && !m.seenByPartner).length,
    [appState.messages, activePartner]
  );

  // Filtered memories for the shared Photo Vault
  const filteredMemories = useMemo(() => {
    if (vaultFilter === 'all') return appState.memories;
    return appState.memories.filter(
      (m) => m.createdBy === vaultFilter || m.ownerId === vaultFilter
    );
  }, [appState.memories, vaultFilter]);

  const questsIntoCurrentCycle = appState.totalCompletedQuests % 3;
  const questsRemainingForNextVoucher = 3 - questsIntoCurrentCycle;

  if (authChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-950 text-white p-6">
        <p className="text-sm">Checking Google account…</p>
      </main>
    );
  }

  if (!authEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-950 text-white p-6">
        <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-700 p-6 space-y-4">
          <div className="text-center space-y-2">
            <h1 className="font-editorial text-2xl font-bold">Daily SideQuests</h1>
            <p className="text-sm text-stone-300">Sign in with the Google account assigned to your side.</p>
            <p className="text-xs text-stone-400">Aaron · {AUTHORIZED_EMAILS.aaron}<br />Vini · {AUTHORIZED_EMAILS.vini}</p>
          </div>
          {authError && <p role="alert" className="rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-200">{authError}</p>}
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            className="w-full min-h-[46px] rounded-xl bg-white text-stone-900 font-bold text-sm"
          >
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <div
      style={
        {
          backgroundColor: activeSiteTheme.bgPrimary,
          backgroundImage: activeSiteTheme.bgPageRadial,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          color: activeSiteTheme.textPrimary,
          '--sq-bg': activeSiteTheme.bgPrimary,
          '--sq-surface': activeSiteTheme.bgSurface,
          '--sq-surface-soft': activeSiteTheme.bgSurfaceSoft,
          '--sq-header-bg': activeSiteTheme.bgHeader,
          '--sq-banner-grad': activeSiteTheme.bgBannerGradient,
          '--sq-text': activeSiteTheme.textPrimary,
          '--sq-text-secondary': activeSiteTheme.textSecondary,
          '--sq-text-muted': activeSiteTheme.textMuted,
          '--sq-border': activeSiteTheme.borderPrimary,
          '--sq-accent': activeSiteTheme.accentPrimary,
          '--sq-accent-grad': activeSiteTheme.accentGradient
        } as React.CSSProperties
      }
      className={`min-h-screen flex flex-col selection:bg-rose-200 selection:text-rose-900 sidequests-theme theme-${activeSiteTheme.id} ${
        isDarkMode ? 'sidequests-dark' : 'sidequests-light'
      }`}
    >
      {/* Google Fonts & Complete Multi-Theme / Dark-Mode Contrast Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .font-handwritten {
          font-family: 'Caveat', cursive;
        }
        .font-editorial {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .perspective-1200 {
          perspective: 1200px;
        }

        /* Universal Theme Variable Overrides (Light & Dark Palettes) */
        .sidequests-theme header.sticky {
          background-color: var(--sq-header-bg) !important;
          border-color: var(--sq-border) !important;
        }
        .sidequests-theme .bg-\\[\\#FAF7F2\\],
        .sidequests-theme .bg-\\[\\#FAF7F2\\]\\/90 {
          background-color: var(--sq-bg) !important;
          color: var(--sq-text) !important;
        }
        .sidequests-theme [class*="via-white"] {
          background-image: var(--sq-banner-grad) !important;
          border-color: var(--sq-border) !important;
        }

        /* Comprehensive Dark Mode Fixes — No Whitened-Out Blocks or Unreadable Text */
        .sidequests-dark .bg-white,
        .sidequests-dark .bg-white\\/80,
        .sidequests-dark .bg-white\\/85,
        .sidequests-dark .bg-white\\/90,
        .sidequests-dark .bg-white\\/95,
        .sidequests-dark nav.fixed {
          background-color: var(--sq-surface) !important;
          color: var(--sq-text) !important;
          border-color: var(--sq-border) !important;
        }
        .sidequests-dark .bg-stone-50,
        .sidequests-dark .bg-stone-50\\/90,
        .sidequests-dark .bg-stone-100,
        .sidequests-dark .bg-stone-100\\/85,
        .sidequests-dark .bg-stone-100\\/90,
        .sidequests-dark .bg-stone-200,
        .sidequests-dark .bg-stone-200\\/60,
        .sidequests-dark .bg-stone-200\\/70,
        .sidequests-dark .bg-stone-200\\/80 {
          background-color: var(--sq-surface-soft) !important;
          color: var(--sq-text) !important;
          border-color: var(--sq-border) !important;
        }
        .sidequests-dark [class*="from-amber-100"],
        .sidequests-dark [class*="from-rose-50"],
        .sidequests-dark [class*="from-amber-50"] {
          background-image: var(--sq-banner-grad) !important;
          border-color: var(--sq-border) !important;
        }
        .sidequests-dark .polaroid-paper {
          background-color: var(--sq-surface-soft) !important;
          background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0) !important;
          border-color: var(--sq-border) !important;
          color: var(--sq-text) !important;
          box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.55) !important;
        }
        .sidequests-dark .bg-rose-50,
        .sidequests-dark .bg-rose-50\\/70,
        .sidequests-dark .bg-rose-50\\/90,
        .sidequests-dark .bg-rose-100,
        .sidequests-dark .bg-rose-100\\/80 {
          background-color: rgba(244, 63, 94, 0.16) !important;
          border-color: rgba(244, 63, 94, 0.35) !important;
          color: #FFE4E6 !important;
        }
        .sidequests-dark .bg-amber-50,
        .sidequests-dark .bg-amber-50\\/70,
        .sidequests-dark .bg-amber-50\\/90,
        .sidequests-dark .bg-amber-50\\/95,
        .sidequests-dark .bg-amber-100,
        .sidequests-dark .bg-amber-100\\/80,
        .sidequests-dark .bg-amber-200\\/60,
        .sidequests-dark .bg-amber-200\\/70,
        .sidequests-dark .bg-amber-200\\/80 {
          background-color: rgba(245, 158, 11, 0.16) !important;
          border-color: rgba(245, 158, 11, 0.35) !important;
          color: #FEF3C7 !important;
        }
        .sidequests-dark .bg-emerald-50,
        .sidequests-dark .bg-emerald-50\\/95,
        .sidequests-dark .bg-emerald-100 {
          background-color: rgba(16, 185, 129, 0.16) !important;
          border-color: rgba(16, 185, 129, 0.35) !important;
          color: #D1FAE5 !important;
        }
        .sidequests-dark .bg-purple-100 {
          background-color: rgba(168, 85, 247, 0.2) !important;
          border-color: rgba(168, 85, 247, 0.4) !important;
          color: #F3E8FF !important;
        }
        .sidequests-dark .text-stone-900,
        .sidequests-dark .text-stone-800 {
          color: var(--sq-text) !important;
        }
        .sidequests-dark .text-stone-700,
        .sidequests-dark .text-stone-600 {
          color: var(--sq-text-secondary) !important;
        }
        .sidequests-dark .text-stone-500,
        .sidequests-dark .text-stone-400 {
          color: var(--sq-text-muted) !important;
        }
        .sidequests-dark .text-rose-950,
        .sidequests-dark .text-rose-900,
        .sidequests-dark .text-rose-800,
        .sidequests-dark .text-rose-700,
        .sidequests-dark .text-rose-600 {
          color: #FDA4AF !important;
        }
        .sidequests-dark .text-amber-950,
        .sidequests-dark .text-amber-900,
        .sidequests-dark .text-amber-800,
        .sidequests-dark .text-amber-700 {
          color: #FCD34D !important;
        }
        .sidequests-dark .text-emerald-950,
        .sidequests-dark .text-emerald-900,
        .sidequests-dark .text-emerald-800,
        .sidequests-dark .text-emerald-700 {
          color: #6EE7B7 !important;
        }
        .sidequests-dark .text-purple-800 {
          color: #D8B4FE !important;
        }
        .sidequests-dark .border-stone-100,
        .sidequests-dark .border-stone-200,
        .sidequests-dark .border-stone-200\\/70,
        .sidequests-dark .border-stone-200\\/80,
        .sidequests-dark .border-stone-200\\/90,
        .sidequests-dark .border-stone-300,
        .sidequests-dark .border-stone-300\\/50,
        .sidequests-dark .border-rose-100,
        .sidequests-dark .border-rose-200,
        .sidequests-dark .border-rose-200\\/60,
        .sidequests-dark .border-rose-200\\/70,
        .sidequests-dark .border-rose-200\\/80,
        .sidequests-dark .border-rose-200\\/90,
        .sidequests-dark .border-amber-200,
        .sidequests-dark .border-amber-200\\/80 {
          border-color: var(--sq-border) !important;
        }
        .sidequests-dark input,
        .sidequests-dark textarea,
        .sidequests-dark select {
          background-color: var(--sq-bg) !important;
          color: var(--sq-text) !important;
          border-color: var(--sq-border) !important;
        }
        .sidequests-dark input::placeholder,
        .sidequests-dark textarea::placeholder {
          color: var(--sq-text-muted) !important;
        }
        .preserve-3d {
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes waxStampPress {
          0% { transform: scale(2.6) rotate(-18deg); opacity: 0; }
          60% { transform: scale(0.92) rotate(-8deg); opacity: 1; }
          80% { transform: scale(1.05) rotate(-6deg); opacity: 1; }
          100% { transform: scale(1) rotate(-8deg); opacity: 1; }
        }
        .animate-wax-stamp {
          animation: waxStampPress 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .polaroid-paper {
          background-color: #FFFDF9;
          background-image: radial-gradient(rgba(180, 83, 9, 0.03) 1px, transparent 0);
          background-size: 14px 14px;
          box-shadow: 0 12px 28px -6px rgba(41, 37, 36, 0.12), 0 4px 10px -2px rgba(41, 37, 36, 0.06);
        }
      `}</style>

      {/* Floating In-App Notification Toasts */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 ${
              t.tone === 'rose'
                ? 'bg-white/95 border-rose-200 text-rose-950'
                : t.tone === 'amber'
                ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                : 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
            }`}
          >
            <span className="text-2xl shrink-0">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider opacity-75">{t.title}</p>
              <p className="text-sm font-medium truncate">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="p-1.5 rounded-full hover:bg-black/5 text-stone-400 hover:text-stone-600"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sticky Top Navigation Bar (TopNav) */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF7F2]/90 border-b border-rose-200/60">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2.5">
          {/* Row 1: Brand Title, Device Lock Badge, Streak Counter, Theme Picker, Sound & Profile Customize */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundImage: activeSiteTheme.accentGradient }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              >
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-editorial font-bold text-lg leading-tight text-stone-900">
                    Daily SideQuests
                  </h1>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {currentProfile.name}&apos;s App {currentProfile.avatar}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Room: {appState.roomCode}
                  </span>
                  <span className="text-stone-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCardFlip();
                      setIsLiveSyncModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-rose-600 underline hover:text-rose-700"
                  >
                    {isDeviceLocked ? `Locked to ${currentProfile.name} 🔒` : 'Connect Phones 📲'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Connect Partner Phone / Device Lock Setup Button */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCardFlip();
                  setIsLiveSyncModalOpen(true);
                }}
                className="min-h-[44px] px-2.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-300/80 text-emerald-900 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition"
                title="Setup Two-Phone Live Sync & Device Privacy Lock"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">2-Phone Sync</span>
              </button>

              {/* Completed Drops Counter Pill */}
              <button
                type="button"
                aria-label={`Completed Love Drops: Aaron ${appState.completedCountsByPartner.aaron}, Vini ${appState.completedCountsByPartner.vini}`}
                className="min-h-[44px] px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-100/90 to-rose-100/90 border border-amber-300/70 flex items-center gap-1.5 shadow-xs"
                title="Completed Love Drops & SideQuests across all time"
              >
                <Check className="w-4 h-4 text-emerald-700" />
                <span className="text-[11px] font-bold text-stone-800">
                  A {appState.completedCountsByPartner.aaron} · V {appState.completedCountsByPartner.vini}
                </span>
              </button>

              {/* Site Theme Picker Trigger */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCardFlip();
                  setIsThemeModalOpen(true);
                }}
                className="min-h-[44px] px-2.5 py-1.5 rounded-2xl bg-white/80 border border-stone-200/80 flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-rose-600 transition"
                aria-label="Change site theme"
                title={`Theme: ${activeSiteTheme.name} (Tap to explore 8 themes)`}
              >
                <span className="text-base leading-none">{activeSiteTheme.icon}</span>
                <span className="hidden md:inline">Themes</span>
              </button>

              {/* Quick Dark / Light Toggle */}
              <button
                type="button"
                onClick={handleToggleDarkMode}
                className="min-w-[44px] min-h-[44px] rounded-2xl bg-white/80 border border-stone-200/80 flex items-center justify-center text-stone-600 hover:text-rose-600 transition"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Sound Mute Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="min-w-[44px] min-h-[44px] rounded-2xl bg-white/80 border border-stone-200/80 flex items-center justify-center text-stone-600 hover:text-rose-600 hover:border-rose-200 transition"
                aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
                title={isMuted ? 'Sound Muted (Tap to Unmute)' : 'Sound Effects Active'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-rose-500" />}
              </button>

              {/* Profile Customization Modal Trigger */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCardFlip();
                  setIsProfileModalOpen(true);
                }}
                className="min-w-[44px] min-h-[44px] rounded-2xl bg-white/80 border border-stone-200/80 flex items-center justify-center text-stone-700 hover:text-rose-600 hover:border-rose-200 transition"
                aria-label="Customize Couple Profiles"
                title="Edit Names, Nicknames & Avatars"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: 3-Mode Love Drops Switcher (For Me / Sent to Partner / Shared AI Prompts) */}
          {isDeviceLocked ? (
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-stone-200/60 border border-stone-300/50">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCardFlip();
                  setQuestViewSubMode('my-quests');
                  setActiveTab('quests');
                }}
                className={`min-h-[44px] px-2.5 py-2 rounded-xl flex items-center justify-between gap-1 transition-all ${
                  questViewSubMode === 'my-quests'
                    ? 'bg-white text-stone-900 shadow-sm border border-rose-200/80'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base leading-none shrink-0">{currentProfile.avatar}</span>
                  <div className="text-left truncate">
                    <p className="text-[11px] font-bold leading-tight truncate">
                      For Me ({currentProfile.name})
                    </p>
                    <p className="text-[9px] text-stone-500 truncate">
                      Photos &amp; SideQuests
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white shrink-0">
                  {myQuestsList.filter((q) => q.isCompleted).length}/{myQuestsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playCardFlip();
                  setQuestViewSubMode('assign-partner');
                  setActiveTab('quests');
                }}
                className={`min-h-[44px] px-2.5 py-2 rounded-xl flex items-center justify-between gap-1 transition-all ${
                  questViewSubMode === 'assign-partner'
                    ? 'bg-white text-stone-900 shadow-sm border border-amber-300/80'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base leading-none shrink-0">📸</span>
                  <div className="text-left truncate">
                    <p className="text-[11px] font-bold leading-tight truncate">
                      Sent to {partnerProfile.name}
                    </p>
                    <p className="text-[9px] text-stone-500 truncate">
                      Drops by {currentProfile.name}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
                  {challengesSetForPartnerList.filter((q) => q.isCompleted).length}/{challengesSetForPartnerList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playCardFlip();
                  setQuestViewSubMode('shared-prompts');
                  setActiveTab('quests');
                }}
                className={`min-h-[44px] px-2.5 py-2 rounded-xl flex items-center justify-between gap-1 transition-all ${
                  questViewSubMode === 'shared-prompts'
                    ? 'bg-white text-stone-900 shadow-sm border border-rose-300/80'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base leading-none shrink-0">🤖</span>
                  <div className="text-left truncate">
                    <p className="text-[11px] font-bold leading-tight truncate">
                      Both of Us ✨
                    </p>
                    <p className="text-[9px] text-stone-500 truncate">
                      AI Prompts &amp; Qs
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white shrink-0">
                  {sharedPromptsList.filter((q) => !q.answers?.[activePartner]?.text).length > 0
                    ? `${sharedPromptsList.filter((q) => !q.answers?.[activePartner]?.text).length} New`
                    : `${sharedPromptsList.filter((q) => q.isCompleted).length} ✓`}
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-stone-200/60 border border-stone-300/50">
              {(['aaron', 'vini'] as PartnerId[]).map((pid) => {
                const prof = appState.profiles[pid];
                const isSelected = activePartner === pid;
                const partnerCompleted = appState.quests.filter(
                  (q) => !q.isSharedPrompt && q.forPartner === pid && q.isCompleted
                ).length;
                const partnerQuestCount = appState.quests.filter((q) => !q.isSharedPrompt && q.forPartner === pid).length;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => handleSwitchPartner(pid)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between transition-all duration-200 ${
                      isSelected
                        ? 'bg-white text-stone-900 shadow-sm border border-rose-200/80'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none">{prof.avatar}</span>
                      <div className="text-left truncate">
                        <p className="text-xs font-bold leading-tight truncate">
                          {prof.name}&apos;s challenges
                        </p>
                        <p className="text-[10px] text-stone-500 truncate">{prof.nickname}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-rose-500 text-white'
                          : 'bg-stone-300/70 text-stone-700'
                      }`}
                    >
                      {partnerCompleted}/{partnerQuestCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 pb-28">
        {/* ================================================================= */}
        {/* TAB 1: DAILY TIMED QUEST TIMELINE, PARTNER LIST & AI PROMPTS      */}
        {/* ================================================================= */}
        {activeTab === 'quests' && (
          <div className="space-y-4">
            {/* Live Shared AI / Random Couple Prompt Spotlight Banner (Always accessible) */}
            {questViewSubMode !== 'shared-prompts' && (
              <div className="rounded-3xl p-4 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-300/80 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                      🤖
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white">
                          Both Must Answer ✨
                        </span>
                        {activeSharedPrompt && (
                          <span className="text-[11px] font-bold text-stone-600">
                            {activeSharedPrompt.answers?.aaron?.text ? 'Aaron ✓' : 'Aaron ⏳'} •{' '}
                            {activeSharedPrompt.answers?.vini?.text ? 'Vini ✓' : 'Vini ⏳'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-editorial font-bold text-base text-stone-900 mt-1">
                        {activeSharedPrompt
                          ? activeSharedPrompt.title
                          : 'Pop Up a Random AI Challenge or Question for Both of Us!'}
                      </h3>
                      <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
                        {activeSharedPrompt
                          ? activeSharedPrompt.prompt
                          : 'Tap below to summon a spontaneous question or mini-challenge that pops up on both Aaron & Vini’s phones.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeSharedPrompt && (
                      <button
                        type="button"
                        onClick={() => setActiveSharedPromptModalId(activeSharedPrompt.id)}
                        className="min-h-[40px] px-3.5 py-2 rounded-2xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition"
                      >
                        {activeSharedPrompt.answers?.[activePartner]?.text
                          ? 'View Answers 👀'
                          : 'Answer Now ✍️'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDropSharedPrompt()}
                      className="min-h-[40px] px-3.5 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold shadow-xs hover:brightness-105 transition flex items-center gap-1.5"
                    >
                      <Dices className="w-4 h-4" />
                      <span>Random AI Prompt 🎲</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Header banner for current sub-mode */}
            <div className="rounded-3xl p-4 bg-gradient-to-br from-rose-50 via-white to-amber-50 border border-rose-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-2xl shrink-0">
                  {questViewSubMode === 'assign-partner'
                    ? '📸'
                    : questViewSubMode === 'shared-prompts'
                    ? '🤖'
                    : currentProfile.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-editorial font-bold text-lg text-stone-900">
                      {questViewSubMode === 'assign-partner'
                        ? `Love Drops & SideQuests Sent to ${partnerProfile.name}`
                        : questViewSubMode === 'shared-prompts'
                        ? `AI & Random Couple Prompts (Aaron & Vini)`
                        : `${currentProfile.name}'s Love Drops & SideQuests`}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                      {questViewSubMode === 'assign-partner'
                        ? `${challengesSetForPartnerList.length} sent by ${currentProfile.name}`
                        : questViewSubMode === 'shared-prompts'
                        ? 'Both partners answer'
                        : `From ${partnerProfile.name} for you`}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {questViewSubMode === 'assign-partner'
                      ? `Send a random photo just to show ${partnerProfile.name} what you're up to, or post a fun SideQuest! Everything you send stays listed here.`
                      : questViewSubMode === 'shared-prompts'
                      ? `Random AI questions and mini-prompts pop up for both of you. Submit your answer to unlock ${partnerProfile.name}'s response!`
                      : `Photo Drops and SideQuests sent to you by ${partnerProfile.name} appear right here.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {questViewSubMode === 'shared-prompts' ? (
                  <button
                    type="button"
                    onClick={() => handleDropSharedPrompt()}
                    className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Pop Up Random Prompt for Both 🎲</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setChallengeDropType('photo-drop');
                      setChallengeTitle('');
                      setChallengePrompt('');
                      setChallengeDateTime('');
                      setChallengePhotoUrl('');
                      setIsCreateChallengeOpen(true);
                    }}
                    className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Send Photo or SideQuest to {partnerProfile.name}</span>
                  </button>
                )}
              </div>
            </div>

            {questViewSubMode === 'shared-prompts' ? (
              <div className="space-y-4">
                {/* Category Quick-Summon Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(Object.keys(SHARED_PROMPT_CATEGORY_META) as SharedPromptCategory[]).map((cat) => {
                    const meta = SHARED_PROMPT_CATEGORY_META[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleDropSharedPrompt(cat)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-2xl bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-xs font-bold text-stone-700 flex items-center gap-1.5 shrink-0 shadow-2xs transition"
                      >
                        <span>{meta.icon}</span>
                        <span>+ {meta.label}</span>
                      </button>
                    );
                  })}
                </div>

                {sharedPromptsList.length === 0 ? (
                  <div className="rounded-3xl p-6 text-center bg-white/85 border border-stone-200 space-y-3">
                    <p className="font-bold text-stone-800">No shared couple prompts yet</p>
                    <p className="text-xs text-stone-500">
                      Tap &ldquo;Pop Up Random Prompt for Both&rdquo; above to drop a question or challenge onto both phones!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sharedPromptsList.map((promptItem) => {
                      const myAns = promptItem.answers?.[activePartner];
                      const partnerAns = promptItem.answers?.[otherPartner];
                      const bothDone = Boolean(myAns?.text && partnerAns?.text);
                      const catMeta = promptItem.promptCategory
                        ? SHARED_PROMPT_CATEGORY_META[promptItem.promptCategory]
                        : SHARED_PROMPT_CATEGORY_META['deep-question'];
                      const draftVal = sharedPromptDrafts[promptItem.id] || '';

                      return (
                        <div
                          key={promptItem.id}
                          className={`rounded-3xl p-5 border transition-all ${
                            bothDone
                              ? 'bg-white/95 border-emerald-200 shadow-xs'
                              : 'bg-white border-rose-300 shadow-md shadow-rose-100/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-stone-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${catMeta.badgeClass}`}
                              >
                                {catMeta.icon} {catMeta.label}
                              </span>
                              <span className="text-xs text-stone-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {promptItem.scheduledTime}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                bothDone
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {bothDone
                                ? '💖 Both Answered!'
                                : `${myAns?.text ? 'You ✓' : 'You ⏳'} • ${
                                    partnerAns?.text
                                      ? `${partnerProfile.name} ✓`
                                      : `${partnerProfile.name} ⏳`
                                  }`}
                            </span>
                          </div>

                          <div className="py-3.5">
                            <h3 className="font-editorial font-bold text-lg text-stone-900">
                              {promptItem.title}
                            </h3>
                            <p className="text-sm text-stone-700 mt-1 leading-relaxed">
                              {promptItem.prompt}
                            </p>
                          </div>

                          {/* Answer Input if current partner hasn't answered yet */}
                          {!myAns?.text ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmitSharedPromptAnswer(promptItem);
                              }}
                              className="space-y-2.5 pt-2 border-t border-stone-100"
                            >
                              {partnerAns?.text && (
                                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2">
                                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>
                                    {partnerProfile.name} has already answered! Submit your answer below to unlock {partnerProfile.name}&apos;s response.
                                  </span>
                                </div>
                              )}
                              <textarea
                                rows={2}
                                required
                                value={draftVal}
                                onChange={(e) =>
                                  setSharedPromptDrafts((prev) => ({
                                    ...prev,
                                    [promptItem.id]: e.target.value
                                  }))
                                }
                                placeholder={`Write your answer as ${currentProfile.name}...`}
                                className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:border-rose-400"
                              />
                              <div className="flex justify-end">
                                <button
                                  type="submit"
                                  className="min-h-[42px] px-5 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold shadow-sm hover:brightness-105 transition flex items-center gap-1.5"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Submit My Answer &amp; Sync ✨</span>
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100">
                              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                    <span>{currentProfile.avatar}</span>
                                    <span>{currentProfile.name}&apos;s Answer</span>
                                  </span>
                                  <span className="text-[10px] text-rose-600">{myAns.answeredAt}</span>
                                </div>
                                <p className="text-sm text-stone-800 leading-relaxed">{myAns.text}</p>
                              </div>

                              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                    <span>{partnerProfile.avatar}</span>
                                    <span>{partnerProfile.name}&apos;s Answer</span>
                                  </span>
                                  {partnerAns?.answeredAt && (
                                    <span className="text-[10px] text-amber-700">{partnerAns.answeredAt}</span>
                                  )}
                                </div>
                                {partnerAns?.text ? (
                                  <p className="text-sm text-stone-800 leading-relaxed">{partnerAns.text}</p>
                                ) : (
                                  <p className="text-xs text-stone-500 italic py-1">
                                    Waiting for {partnerProfile.name} to answer on their phone… ⏳
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
            /* Assigned Love Drops & SideQuests (both My Drops and Sent to Partner remain visible!) */
            <div className="space-y-3.5">
              {displayedQuests.length === 0 && (
                <div className="rounded-3xl p-6 text-center bg-white/85 border border-stone-200">
                  <p className="font-bold text-stone-800">
                    {questViewSubMode === 'assign-partner'
                      ? `No Photo Drops or SideQuests sent to ${partnerProfile.name} yet`
                      : 'No Photo Drops or SideQuests for you yet'}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {questViewSubMode === 'assign-partner'
                      ? `Tap "Send Photo or SideQuest to ${partnerProfile.name}" above to snap a photo or send a moment—everything you send stays listed right here!`
                      : `When ${partnerProfile.name} sends you a Photo Drop or SideQuest, it will pop up here in real time.`}
                  </p>
                </div>
              )}
              {displayedQuests.map((quest) => {
                const isAssigningForPartner = quest.forPartner !== activePartner;
                const isSnoozed =
                  quest.snoozeUntilTimestamp !== null && quest.snoozeUntilTimestamp > nowTick;
                const snoozeRemainingSec = isSnoozed
                  ? Math.max(0, Math.ceil((quest.snoozeUntilTimestamp! - nowTick) / 1000))
                  : 0;
                const snoozeMM = String(Math.floor(snoozeRemainingSec / 60)).padStart(2, '0');
                const snoozeSS = String(snoozeRemainingSec % 60).padStart(2, '0');
                const remainingSnoozeAllowance = Math.max(0, 60 - quest.snoozedMinutesTotal);
                const linkedMemory = quest.completedMemoryId
                  ? appState.memories.find((m) => m.id === quest.completedMemoryId) || null
                  : null;

                return (
                  <div
                    key={quest.id}
                    className={`rounded-3xl transition-all duration-300 border ${
                      quest.isCompleted
                        ? 'bg-white/95 border-emerald-200/90 shadow-xs'
                        : !quest.isUnlocked && !isAssigningForPartner
                        ? 'bg-stone-100/85 border-stone-200/90'
                        : isSnoozed
                        ? 'bg-amber-50/90 border-amber-300/80'
                        : 'bg-white/95 border-rose-200/90 shadow-md shadow-rose-100/50'
                    }`}
                  >
                    {/* Card Header Bar */}
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2 flex-wrap border-b border-stone-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-stone-900">
                          {quest.dropType === 'photo-drop' || quest.senderPhotoUrl ? '📸 Photo Drop' : quest.slotLabel}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {quest.scheduledTime}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                          {isAssigningForPartner
                            ? `Sent by ${currentProfile.name} to ${partnerProfile.name}`
                            : `From ${appState.profiles[quest.assignedBy]?.name || partnerProfile.name}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Secret Preloaded Reward Indicator Badge */}
                        {quest.secretReward && !quest.isCompleted && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            {isAssigningForPartner
                              ? 'Secret Polaroid Preloaded ✓'
                              : '🔒 Secret Polaroid Inside'}
                          </span>
                        )}

                        {quest.isCompleted ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {isAssigningForPartner
                              ? `Seen / Completed by ${partnerProfile.name}`
                              : 'Completed'}
                          </span>
                        ) : isAssigningForPartner ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Sent to {partnerProfile.name} 💌
                          </span>
                        ) : null}

                        {/* Only show Edit / Secret Reward button when assigning for partner OR when Device Lock is off */}
                        {(isAssigningForPartner || !isDeviceLocked) && (
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playCardFlip();
                              setEditingQuest(quest);
                            }}
                            className="min-h-[38px] px-2.5 py-1 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 flex items-center gap-1 transition"
                            title="Edit Drop or Pre-attach Secret Polaroid Reward"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{quest.secretReward ? 'Edit / Secret 🎁' : 'Add Secret 🎁'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Body Based on State */}
                    {!quest.isUnlocked && !isAssigningForPartner ? (
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-stone-200/80 border border-stone-300 flex items-center justify-center text-stone-500 shrink-0">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-700">
                              Mystery Timed Drop • Scheduled for {quest.scheduledTime}
                            </p>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {partnerProfile.name} hid a surprise drop here! Wait for drop time or reveal early.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnlockQuestSlot(quest)}
                          className="min-h-[44px] px-4 py-2 rounded-2xl bg-white border border-stone-300 text-stone-800 hover:border-rose-300 hover:text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition shrink-0"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Reveal Drop Now</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        <div>
                          <h3 className="font-bold text-base text-stone-900">{quest.title}</h3>
                          {quest.prompt && (
                            <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                              {quest.prompt}
                            </p>
                          )}
                        </div>

                        {/* Sender's Attached Photo Drop (Shown directly on the card when the sender snapped/uploaded a photo!) */}
                        {quest.senderPhotoUrl && (
                          <div className="rounded-2xl overflow-hidden border border-rose-200/80 bg-stone-50/70 p-2.5 space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5" />
                                <span>
                                  Photo shared by {appState.profiles[quest.assignedBy]?.name || partnerProfile.name}
                                </span>
                              </span>
                              <span className="text-[10px] font-semibold text-stone-500">
                                Saved in Photo Vault ✓
                              </span>
                            </div>
                            <div className="rounded-xl overflow-hidden max-h-80 bg-stone-900/5 flex items-center justify-center">
                              <img
                                src={quest.senderPhotoUrl}
                                alt={quest.title}
                                className="w-full max-h-80 object-cover rounded-xl"
                              />
                            </div>
                          </div>
                        )}

                        {/* If viewing Partner Assignment Mode: show secret reward preview & instant unlock toggle for partner */}
                        {isAssigningForPartner && !quest.isCompleted && (
                          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {quest.secretReward ? (
                                <img
                                  src={quest.secretReward.photoUrl}
                                  alt="Preloaded secret"
                                  className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                                  <Camera className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-amber-950">
                                  {quest.secretReward
                                    ? `Secret Polaroid Ready for ${partnerProfile.name}: "${quest.secretReward.caption}"`
                                    : quest.senderPhotoUrl
                                    ? `Your photo is live on ${partnerProfile.name}'s screen!`
                                    : `Optional: ${partnerProfile.name} can snap a photo when completing this`}
                                </p>
                                <p className="text-[11px] text-amber-800">
                                  Status on {partnerProfile.name}&apos;s phone:{' '}
                                  <strong>{quest.isUnlocked ? 'Delivered & Active' : `Locked until ${quest.scheduledTime}`}</strong>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!quest.isUnlocked && (
                                <button
                                  type="button"
                                  onClick={() => handleUnlockQuestSlot(quest)}
                                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition"
                                >
                                  Drop to {partnerProfile.name} Now ⚡
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* If Snoozed: Live Countdown Banner + Instant Resume */}
                        {isSnoozed && !isAssigningForPartner && (
                          <div className="rounded-2xl p-3.5 bg-amber-100/80 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <PauseCircle className="w-5 h-5 text-amber-700 shrink-0 animate-pulse" />
                              <div>
                                <p className="text-xs font-bold text-amber-950">
                                  Snoozed • Resumes in{' '}
                                  <span className="font-mono text-sm px-1.5 py-0.5 rounded bg-amber-200/80">
                                    {snoozeMM}:{snoozeSS}
                                  </span>
                                </p>
                                <p className="text-[11px] text-amber-800">
                                  Cumulative delay used: {quest.snoozedMinutesTotal} / 60 mins max
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleResumeSnoozedQuest(quest)}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-700 transition shrink-0"
                            >
                              <PlayCircle className="w-4 h-4" />
                              <span>Instant Resume ⚡</span>
                            </button>
                          </div>
                        )}

                        {/* If Active on MY Quests: Snooze Controls + Complete / Love Photo Drop Buttons */}
                        {!quest.isCompleted && !isAssigningForPartner && (
                          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-100">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-semibold text-stone-500 mr-1">
                                Snooze ({quest.snoozedMinutesTotal}/60m):
                              </span>
                              <button
                                type="button"
                                disabled={remainingSnoozeAllowance < 15}
                                onClick={() => handleSnoozeQuest(quest, 15)}
                                className={`min-h-[40px] px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                                  remainingSnoozeAllowance >= 15
                                    ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-300'
                                    : 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
                                }`}
                              >
                                +15m
                              </button>
                              <button
                                type="button"
                                disabled={remainingSnoozeAllowance < 30}
                                onClick={() => handleSnoozeQuest(quest, 30)}
                                className={`min-h-[40px] px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                                  remainingSnoozeAllowance >= 30
                                    ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-300'
                                    : 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
                                }`}
                              >
                                +30m
                              </button>
                              <button
                                type="button"
                                disabled={remainingSnoozeAllowance <= 0}
                                onClick={() => handleSnoozeQuest(quest, remainingSnoozeAllowance)}
                                className={`min-h-[40px] px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                                  remainingSnoozeAllowance > 0
                                    ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-300'
                                    : 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed'
                                }`}
                              >
                                Max ({remainingSnoozeAllowance}m)
                              </button>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {quest.senderPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleAcknowledgePhotoDrop(quest)}
                                  className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                                >
                                  <Heart className="w-4 h-4 fill-white" />
                                  <span>Love &amp; Keep Photo 💖</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleInitiateQuestCompletion(quest)}
                                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200 hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>
                                  {quest.secretReward
                                    ? 'Complete & Unlock Secret Polaroid 📸'
                                    : quest.senderPhotoUrl
                                    ? 'Snap Photo Back 📸'
                                    : 'Complete & Snap Polaroid 📸'}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If Completed: Embedded Editable Retro Polaroid Keepsake Card! */}
                        {quest.isCompleted && linkedMemory && (
                          <div className="pt-2">
                            <div className="max-w-xs mx-auto polaroid-paper rounded-2xl p-3.5 pb-5 relative transform -rotate-1 hover:rotate-0 transition-transform duration-300 border border-stone-200/90">
                              <div
                                className={`w-28 h-6 mx-auto -mt-6 mb-2.5 rounded-xs border shadow-2xs ${
                                  WASHI_STYLES[linkedMemory.washi].bgClass
                                }`}
                                style={{
                                  backgroundImage: WASHI_STYLES[linkedMemory.washi].pattern
                                }}
                              />

                              <div
                                onClick={() => setLightboxMemory(linkedMemory)}
                                className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200 cursor-pointer group"
                              >
                                <img
                                  src={linkedMemory.photoUrl}
                                  alt={linkedMemory.caption}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                                  <span className="text-[11px] font-bold text-white bg-black/50 px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                                    <Maximize2 className="w-3 h-3" /> Zoom Keepsake
                                  </span>
                                </div>
                                <span className="absolute bottom-2 right-2 text-2xl drop-shadow-md">
                                  {linkedMemory.sticker}
                                </span>
                              </div>

                              <div className="mt-3 text-center px-1">
                                <p className="font-handwritten text-xl text-stone-800 leading-snug">
                                  &ldquo;{linkedMemory.caption}&rdquo;
                                </p>
                                <p className="text-[10px] font-mono tracking-wider text-stone-400 uppercase mt-1.5">
                                  {linkedMemory.timestamp} •{' '}
                                  {linkedMemory.isSecretRewardUnlocked
                                    ? `Secret Gift from ${appState.profiles[linkedMemory.createdBy].name}`
                                    : `Captured by ${appState.profiles[linkedMemory.ownerId].name}`}
                                </p>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-stone-200/70 flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingMemoryModal(linkedMemory)}
                                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>Swap Photo / Edit Caption</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPolaroid(linkedMemory)}
                                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition"
                                  title="Download Polaroid PNG"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: LOVE VAULT / MEMORY SCRAPBOOK                              */}
        {/* ================================================================= */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-4 bg-gradient-to-br from-amber-50/90 via-white to-rose-50/90 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-editorial font-bold text-xl text-stone-900 flex items-center gap-2">
                  <span>Photo Vault</span>
                  <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    {appState.memories.length} Photos
                  </span>
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Photos are shared between both accounts. Choose images from your device photo library.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={photoUploadRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void handlePhotoVaultUpload(event)}
                  className="hidden"
                  aria-label="Select photos to add to Photo Vault"
                />
                <button
                  type="button"
                  onClick={() => photoUploadRef.current?.click()}
                  className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md hover:brightness-105 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add photos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSpontaneousMemoryOpen(true)}
                  className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-xs"
                >
                  Create a keepsake
                </button>
              </div>
            </div>

            {photoUploadError && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{photoUploadError}</p>}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Memories ✨' },
                {
                  id: 'aaron',
                  label: `From ${appState.profiles.aaron.name} ${appState.profiles.aaron.avatar}`
                },
                {
                  id: 'vini',
                  label: `From ${appState.profiles.vini.name} ${appState.profiles.vini.avatar}`
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setVaultFilter(tab.id as 'all' | PartnerId)}
                  className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
                    vaultFilter === tab.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white/85 text-stone-600 border border-stone-200 hover:border-rose-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {filteredMemories.map((mem, idx) => (
                <div
                  key={mem.id}
                  className={`polaroid-paper rounded-2xl p-3.5 pb-5 border border-stone-200/90 transition-all duration-300 hover:shadow-xl ${
                    idx % 2 === 0 ? 'sm:-rotate-1 hover:rotate-0' : 'sm:rotate-1 hover:rotate-0'
                  }`}
                >
                  <div
                    className={`w-28 h-6 mx-auto -mt-6 mb-2.5 rounded-xs border shadow-2xs ${
                      WASHI_STYLES[mem.washi].bgClass
                    }`}
                    style={{ backgroundImage: WASHI_STYLES[mem.washi].pattern }}
                  />

                  <div
                    onClick={() => setLightboxMemory(mem)}
                    className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200 cursor-pointer group"
                  >
                    <img
                      src={mem.photoUrl}
                      alt={mem.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/55 text-white backdrop-blur-xs">
                        {mem.questTitle}
                      </span>
                    </div>
                    <span className="absolute bottom-2 right-2 text-2xl drop-shadow-md">
                      {mem.sticker}
                    </span>
                  </div>

                  <div className="mt-3 text-center px-1">
                    <p className="font-handwritten text-xl text-stone-800 leading-snug">
                      &ldquo;{mem.caption}&rdquo;
                    </p>
                    <p className="text-[10px] font-mono tracking-wider text-stone-400 uppercase mt-1.5">
                      {mem.timestamp} • From {appState.profiles[mem.createdBy].name}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingMemoryModal(mem)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Swap Image</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setLightboxMemory(mem)}
                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition"
                        title="Fullscreen Zoom"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPolaroid(mem)}
                        className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition"
                        title="Download Polaroid PNG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: COUPLE STREAKS & 3D FLIPPABLE GOLDEN VOUCHERS              */}
        {/* ================================================================= */}
        {false && (
          <div className="space-y-4">
            <div className="rounded-3xl p-4 bg-gradient-to-br from-amber-100/80 via-amber-50/60 to-rose-100/70 border border-amber-300/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Flame className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-editorial font-bold text-xl text-stone-900">
                        {appState.streakDays} Day Couple Streak 🔥
                      </h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/80 text-amber-900 border border-amber-300">
                        {appState.totalCompletedQuests} Quests Done
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 mt-0.5">
                      Every 3 completed quests unlocks a 3D Golden Love Voucher. Tap any card to flip!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCardFlip();
                    setIsCustomVoucherModalOpen(true);
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-stone-900 text-amber-200 hover:bg-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition shrink-0"
                >
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>Issue Custom Love Coupon ✨</span>
                </button>
              </div>

              <div className="bg-white/80 rounded-2xl p-3 border border-amber-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  {[1, 2, 3].map((step) => {
                    const filled = questsIntoCurrentCycle >= step;
                    return (
                      <div
                        key={step}
                        className={`flex-1 h-3 rounded-full transition-all duration-500 flex items-center justify-center ${
                          filled
                            ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-2xs'
                            : 'bg-stone-200'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-amber-900 shrink-0">
                  {questsIntoCurrentCycle}/3 to Next Golden Voucher 🎟️
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {appState.vouchers.map((voucher) => {
                const isFlipped = !!flippedVouchers[voucher.id];
                const isStamping = stampingVoucherId === voucher.id;
                const issuer = appState.profiles[voucher.issuedBy];
                const recipient = appState.profiles[voucher.forPartner];

                return (
                  <div key={voucher.id} className="perspective-1200 h-64 w-full">
                    <div
                      className={`relative w-full h-full preserve-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* FRONT OF 3D VOUCHER CARD */}
                      <div
                        onClick={() => {
                          soundEngine.playCardFlip();
                          setFlippedVouchers((prev) => ({
                            ...prev,
                            [voucher.id]: !prev[voucher.id]
                          }));
                        }}
                        className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-5 bg-gradient-to-br from-amber-50 via-[#FFFDF7] to-amber-100/90 border-2 border-amber-300/90 shadow-md hover:shadow-lg cursor-pointer flex flex-col justify-between overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-200/70 text-amber-900 border border-amber-400/50">
                            ✦ Golden Love Certificate ✦
                          </span>
                          <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5" /> Tap to Flip
                          </span>
                        </div>

                        <div className="my-auto py-2 flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-rose-500 text-white text-3xl flex items-center justify-center shadow-md border-2 border-white shrink-0">
                            {voucher.icon}
                          </div>
                          <div>
                            <h3 className="font-editorial font-bold text-lg text-stone-900 leading-snug">
                              {voucher.title}
                            </h3>
                            <p className="text-xs text-stone-600 mt-1">
                              For <strong className="text-stone-900">{recipient.name}</strong> • Signed by{' '}
                              <strong className="text-stone-900">{issuer.name}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-amber-200/80 flex items-center justify-between">
                          <span className="font-handwritten text-lg text-amber-900">
                            Bearer: {recipient.nickname} {recipient.avatar}
                          </span>
                          {voucher.isRedeemed ? (
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-2xs">
                              💮 Wax Sealed &amp; Redeemed
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-900 bg-amber-200/60 px-2.5 py-1 rounded-full">
                              Ready to Claim →
                            </span>
                          )}
                        </div>
                      </div>

                      {/* BACK OF 3D VOUCHER CARD */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-5 bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-amber-50 border-2 border-amber-400/80 shadow-xl flex flex-col justify-between overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                            Perk Terms &amp; Redemption
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playCardFlip();
                              setFlippedVouchers((prev) => ({
                                ...prev,
                                [voucher.id]: false
                              }));
                            }}
                            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-200 flex items-center gap-1 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Flip Back
                          </button>
                        </div>

                        <div className="my-auto space-y-2">
                          <p className="text-sm text-amber-100/95 leading-relaxed">
                            &ldquo;{voucher.terms}&rdquo;
                          </p>
                          <p className="font-handwritten text-xl text-amber-300">
                            Signed with love, {issuer.name} {issuer.avatar}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                          {voucher.isRedeemed ? (
                            <div className="w-full flex items-center justify-between gap-2">
                              <div
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 border-2 border-amber-300 shadow-lg ${
                                  isStamping ? 'animate-wax-stamp' : ''
                                }`}
                              >
                                <span className="text-base">💮</span>
                                <div>
                                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white">
                                    SEALED WITH LOVE
                                  </p>
                                  <p className="text-[10px] text-rose-100">
                                    {voucher.redeemedAt}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playCardFlip();
                                  updateSharedState((prev) => ({
                                    ...prev,
                                    vouchers: prev.vouchers.map((v) =>
                                      v.id === voucher.id
                                        ? { ...v, isRedeemed: false, redeemedAt: null }
                                        : v
                                    )
                                  }));
                                }}
                                className="min-h-[38px] px-2.5 py-1 rounded-xl text-[11px] text-stone-300 hover:text-white hover:bg-white/10 transition"
                              >
                                Unseal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playWaxStamp();
                                triggerCelebrationConfetti();
                                setStampingVoucherId(voucher.id);
                                const stampTime = new Date().toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                                updateSharedState((prev) => ({
                                  ...prev,
                                  vouchers: prev.vouchers.map((v) =>
                                    v.id === voucher.id
                                      ? {
                                          ...v,
                                          isRedeemed: true,
                                          redeemedAt: `OCT 27 • ${stampTime}`
                                        }
                                      : v
                                  )
                                }));
                                pushToast(
                                  'Golden Voucher Claimed & Wax Stamped! 💮',
                                  `${recipient.name} redeemed "${voucher.title}"!`,
                                  '💮',
                                  'amber'
                                );
                              }}
                              className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 text-stone-950 font-extrabold text-xs shadow-lg hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2"
                            >
                              <Award className="w-4 h-4" />
                              <span>Claim &amp; Stamp Wax Seal 💮</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: SIMULTANEOUS REAL-TIME COUPLE CHAT (WHATSAPP/IG STYLE)     */}
        {/* ================================================================= */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-235px)] min-h-[460px] rounded-3xl bg-white/90 border border-rose-200/80 shadow-sm overflow-hidden">
            {/* Chat Header: Shows ONLY the Other Partner as Recipient (Like WhatsApp / Instagram DM) */}
            <div className="px-4 py-3 bg-gradient-to-r from-rose-50 via-white to-amber-50 border-b border-rose-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-xl">
                  {partnerProfile.avatar}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-sm text-stone-900">
                      {partnerProfile.name} ({partnerProfile.nickname})
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      {currentProfile.name}&apos;s Private Chat View
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {partnerTyping
                      ? `${partnerProfile.name} is typing right now...`
                      : `Logged in as ${currentProfile.name} • ${partnerProfile.name}'s screen only shows ${partnerProfile.name}'s side`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Private Self-Scratchpad Toggle (Hidden from the other partner's UI!) */}
                <button
                  type="button"
                  onClick={() => setShowPrivateNotePad(!showPrivateNotePad)}
                  className={`min-h-[38px] px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 transition ${
                    showPrivateNotePad
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                  title={`Only visible on ${currentProfile.name}'s phone — never shown on ${partnerProfile.name}'s screen`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{currentProfile.name}&apos;s Private Note</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendHeartPing}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Ping 💓</span>
                </button>
              </div>
            </div>

            {/* Collapsible Private Per-Partner Scratchpad (Strictly hidden on the other partner's side!) */}
            {showPrivateNotePad && (
              <div className="px-4 py-3 bg-stone-900 text-stone-100 border-b border-stone-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Private to {currentProfile.name}&apos;s App Only (Hidden on {partnerProfile.name}&apos;s Phone)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPrivateNotePad(false)}
                    className="text-xs text-stone-400 hover:text-white"
                  >
                    Hide
                  </button>
                </div>
                <input
                  type="text"
                  value={appState.privateWhispers?.[activePartner] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateSharedState((prev) => ({
                      ...prev,
                      privateWhispers: {
                        ...(prev.privateWhispers || { aaron: '', vini: '' }),
                        [activePartner]: val
                      }
                    }));
                  }}
                  placeholder={`Jot down a surprise date idea or gift note for ${partnerProfile.name}...`}
                  className="w-full min-h-[38px] px-3 rounded-xl bg-stone-800 border border-stone-700 text-xs text-amber-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Message History Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {appState.messages.map((msg) => {
                const isMe = msg.senderId === activePartner;
                const senderProf = appState.profiles[msg.senderId];
                const reactionEntries = Object.entries(msg.reactions || {});

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[85%]">
                      {!isMe && (
                        <span className="text-lg mb-1 shrink-0">{senderProf.avatar}</span>
                      )}
                      <div
                        onClick={() =>
                          setActiveReactionMessageId(
                            activeReactionMessageId === msg.id ? null : msg.id
                          )
                        }
                        className={`rounded-2xl px-4 py-2.5 cursor-pointer transition relative ${
                          isMe
                            ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-br-xs shadow-xs'
                            : 'bg-stone-100 text-stone-800 border border-stone-200/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.photoUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-white/25 max-w-[240px]">
                            <img
                              src={msg.photoUrl}
                              alt={msg.text || 'Shared chat photo'}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div
                          className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                            isMe ? 'text-rose-100' : 'text-stone-400'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {isMe && (
                            <span
                              className="inline-flex items-center ml-0.5"
                              title={msg.seenByPartner ? `Seen by ${partnerProfile.name}` : 'Sent'}
                            >
                              <CheckCheck
                                className={`w-3.5 h-3.5 ${
                                  msg.seenByPartner ? 'text-amber-200' : 'text-rose-200/60'
                                }`}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Emoji Reaction Picker Popover */}
                    {activeReactionMessageId === msg.id && (
                      <div className="mt-1.5 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-full shadow-md border border-rose-200 z-10">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="w-8 h-8 rounded-full hover:bg-rose-50 flex items-center justify-center text-base transition transform hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Rendered Reaction Pills */}
                    {reactionEntries.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 px-2">
                        {reactionEntries.map(([emoji, reactors]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="px-2 py-0.5 rounded-full bg-white border border-rose-200 shadow-2xs text-xs flex items-center gap-1 hover:bg-rose-50"
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-bold text-stone-600">
                              {reactors.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {partnerTyping && (
                <div className="flex items-center gap-2 text-xs text-stone-500 italic pl-2">
                  <span>{partnerProfile.avatar}</span>
                  <span>{partnerProfile.name} is typing a message...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Love Prompt Sparks Strip */}
            <div className="px-3 py-2 bg-stone-50/90 border-t border-stone-200/70 flex items-center gap-1.5 overflow-x-auto">
              <Sparkles className="w-4 h-4 text-rose-500 shrink-0 ml-1" />
              {QUICK_LOVE_SPARKS.map((spark) => (
                <button
                  key={spark}
                  type="button"
                  onClick={() => handleSendMessage(spark, true)}
                  className="min-h-[36px] px-3 py-1 rounded-full bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200/90 text-xs font-medium shrink-0 transition"
                >
                  {spark}
                </button>
              ))}
            </div>

            {/* Message Input Composer (Isolated per Partner Device) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-stone-200/80 flex items-center gap-2"
            >
              <input
                ref={chatPhotoUploadRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => void handleChatPhotoUpload(event)}
                className="hidden"
                aria-label="Send photo in chat"
              />
              <button
                type="button"
                onClick={() => chatPhotoUploadRef.current?.click()}
                className="min-w-[44px] min-h-[44px] rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center transition shrink-0"
                title="Send a photo in chat (also saves to Photo Vault)"
                aria-label="Attach photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={chatDraft}
                onChange={(e) => {
                  const val = e.target.value;
                  setChatDraftsByPartner((prev) => ({ ...prev, [activePartner]: val }));
                  emitTypingSignal(val.length > 0);
                }}
                placeholder={`Message ${partnerProfile.name} as ${currentProfile.name}...`}
                className="flex-1 min-h-[44px] px-4 rounded-2xl bg-stone-100/90 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-rose-400 focus:bg-white transition"
              />
              <button
                type="submit"
                className="min-w-[48px] min-h-[44px] px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 3-DESTINATION THUMB-ACCESSIBLE BOTTOM NAVIGATION BAR                */}
      {/* =================================================================== */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-md bg-white/95 border-t border-rose-200/80 shadow-lg"
      >
        <div className="max-w-2xl mx-auto px-3 py-1.5 grid grid-cols-3 gap-1">
          {[
            {
              id: 'quests',
              label: 'Love Drops',
              icon: Compass,
              badge: myUncompletedCount
            },
            {
              id: 'vault',
              label: 'Photo Vault',
              icon: ImageIcon,
              badge: appState.memories.length
            },
            {
              id: 'chat',
              label: 'Us Chat',
              icon: MessageCircle,
              badge: unseenChatCount > 0 ? unseenChatCount : appState.messages.length
            }
          ].map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundEngine.playCardFlip();
                  setActiveTab(item.id as TabId);
                }}
                className={`min-h-[52px] rounded-2xl flex flex-col items-center justify-center gap-0.5 relative transition-all ${
                  isSelected
                    ? 'bg-rose-50/90 text-rose-600 font-bold'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                <div className="relative">
                  <IconComponent className={`w-5 h-5 ${isSelected ? ' stroke-[2.5]' : ''}`} />
                  {item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-3 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* =================================================================== */}
      {/* MODAL 0: TWO-PHONE LIVE SYNC & DEVICE IDENTITY LOCK MODAL           */}
      {/* =================================================================== */}
      {isLiveSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full p-5 border border-rose-200 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial font-bold text-lg text-stone-900">
                    2-Phone Live App &amp; Privacy Lock
                  </h3>
                  <p className="text-xs text-stone-500">
                    Keep Aaron&apos;s side on Aaron&apos;s phone &amp; Vini&apos;s side on Vini&apos;s phone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveSyncModalOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    Account-locked partner view
                  </p>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Locked 🔒
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  Signed in as {authEmail}. This account can only use {currentProfile.name}&apos;s challenge view. Sign out to change accounts.
                </p>
                <button
                  type="button"
                  onClick={() => void signOut(auth).catch((error: unknown) =>
                    setAuthError(error instanceof Error ? error.message : 'Unable to sign out.')
                  )}
                  className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold border border-stone-300 bg-stone-50 text-stone-700"
                >
                  Sign out
                </button>
              </div>

              {/* Step 2: Firestore room */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  2. Firestore live sync &amp; room
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Shared Couple Room Code
                    </label>
                    <input
                      type="text"
                      value={appState.roomCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                        updateSharedState((prev) => ({ ...prev, roomCode: code || 'US-2026' }));
                      }}
                      className="w-full min-h-[40px] px-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Copy Dedicated Partner Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/?room=${appState.roomCode}`;
                      copyTextSafe(url);
                      pushToast('Copied Aaron’s App Link! 🔗', url, '🐻', 'rose');
                    }}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy {appState.profiles.aaron.name}&apos;s App Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/?room=${appState.roomCode}`;
                      copyTextSafe(url);
                      pushToast('Copied Vini’s App Link! 🔗', url, '🐰', 'amber');
                    }}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy {appState.profiles.vini.name}&apos;s App Link</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Partner Email Mapping & Firebase Cloud Sync */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    3. Partner Email Mapping &amp; Firebase Cloud
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {syncChannelStatus === 'live' ? 'Firestore Live' : 'Connecting'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                  Signed in as {authEmail}; the matching partner profile is locked on this device.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Aaron&apos;s Google Account Email
                    </label>
                    <input
                      type="email"
                      value={AUTHORIZED_EMAILS.aaron}
                      readOnly
                      className="w-full min-h-[40px] px-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Vini&apos;s Google Account Email
                    </label>
                    <input
                      type="email"
                      value={AUTHORIZED_EMAILS.vini}
                      readOnly
                      className="w-full min-h-[40px] px-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void signOut(auth).catch((error: unknown) =>
                    setAuthError(error instanceof Error ? error.message : 'Unable to sign out.')
                  )}
                  className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold border border-stone-300 bg-stone-50 text-stone-700"
                >
                  Sign out of {authEmail}
                </button>

                <p className="text-[11px] text-stone-600">
                  Chats, your assigned challenges, profiles, and photos sync through Firestore. Security rules are deployed from this project&apos;s <code>firestore.rules</code> file.
                </p>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void requestPushNotifications()}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>
                      {notifPermission === 'granted'
                        ? 'Enable background notifications 🔔'
                        : 'Allow background notifications 🔔'}
                    </span>
                  </button>
                </div>
                {pushSetupStatus && (
                  <p role="status" className="text-[11px] text-stone-600">{pushSetupStatus}</p>
                )}
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsLiveSyncModalOpen(false)}
                className="min-h-[44px] px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md"
              >
                Done &amp; Return to {currentProfile.name}&apos;s App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: SITE THEME PICKER (5 LIGHT THEMES + 3 DARK THEMES)           */}
      {/* =================================================================== */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 border border-rose-200 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeSiteTheme.icon}</span>
                  <h2 className="font-editorial font-bold text-xl text-stone-900">
                    Choose Your Site Theme
                  </h2>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pick from 5 daylight aesthetics or 3 high-contrast dark modes. Saved automatically on your device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
                aria-label="Close theme picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                ☀️ Daylight &amp; Pastel Themes
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.values(SITE_THEMES) as SiteThemeDefinition[])
                  .filter((t) => !t.isDark)
                  .map((theme) => {
                    const isSelected = siteThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSelectSiteTheme(theme.id)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-2 border-rose-500 bg-rose-50/60 shadow-sm'
                            : 'border-stone-200 bg-stone-50/70 hover:border-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                            <span className="text-base">{theme.icon}</span>
                            <span>{theme.name}</span>
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-600 leading-snug">{theme.tagline}</p>
                        <div className="flex items-center gap-1.5 pt-1">
                          {theme.swatchColors.map((hex, i) => (
                            <span
                              key={i}
                              style={{ backgroundColor: hex }}
                              className="w-5 h-5 rounded-full border border-black/15 shadow-2xs"
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 pt-2">
                🌙 High-Contrast Dark Themes
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.values(SITE_THEMES) as SiteThemeDefinition[])
                  .filter((t) => t.isDark)
                  .map((theme) => {
                    const isSelected = siteThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSelectSiteTheme(theme.id)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-2 border-rose-500 bg-rose-50/60 shadow-sm'
                            : 'border-stone-200 bg-stone-50/70 hover:border-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                            <span className="text-base">{theme.icon}</span>
                            <span>{theme.name}</span>
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-600 leading-snug">{theme.tagline}</p>
                        <div className="flex items-center gap-1.5 pt-1">
                          {theme.swatchColors.map((hex, i) => (
                            <span
                              key={i}
                              style={{ backgroundColor: hex }}
                              className="w-5 h-5 rounded-full border border-white/25 shadow-2xs"
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleToggleDarkMode}
                className="min-h-[42px] px-4 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold flex items-center gap-1.5"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>Quick Toggle {isDarkMode ? 'Light' : 'Dark'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="min-h-[42px] px-5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold shadow-sm"
              >
                Done ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateChallengeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            className="bg-white rounded-3xl max-w-lg w-full p-5 border border-rose-200 shadow-2xl space-y-4 my-8"
            onSubmit={(event) => {
              event.preventDefault();
              const isPhotoDrop = challengeDropType === 'photo-drop';
              const finalTitle =
                challengeTitle.trim() ||
                (isPhotoDrop || challengePhotoUrl
                  ? `📸 Photo Drop from ${currentProfile.name}`
                  : '');
              const finalPrompt =
                challengePrompt.trim() ||
                (challengePhotoUrl
                  ? `${currentProfile.name} sent you a photo moment! Tap to view or snap one back.`
                  : '');

              if (!finalTitle) {
                pushToast('Add a title or photo', 'Please add a photo or a short title first.', '✨', 'amber');
                return;
              }
              if (isPhotoDrop && !challengePhotoUrl && !challengePrompt.trim()) {
                pushToast(
                  'Snap or Upload a Photo 📸',
                  'Tap "Take Photo" or "Upload Photo" to send a Photo Drop, or add a note!',
                  '📸',
                  'amber'
                );
                return;
              }

              const target = otherPartner;
              const scheduledDate = challengeDateTime ? new Date(challengeDateTime) : new Date();
              const validDate = Number.isNaN(scheduledDate.getTime()) ? new Date() : scheduledDate;
              const timeLabel = validDate.toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short'
              });
              const now = Date.now();
              const newChallenge: QuestItem = {
                id: `challenge-${now}-${Math.random().toString(36).slice(2, 8)}`,
                forPartner: target,
                assignedBy: activePartner,
                slot: 'golden',
                slotLabel:
                  isPhotoDrop || challengePhotoUrl
                    ? `📸 Photo Drop for ${appState.profiles[target].name}`
                    : `✨ SideQuest for ${appState.profiles[target].name}`,
                dropType: isPhotoDrop || challengePhotoUrl ? 'photo-drop' : 'sidequest',
                ...(challengePhotoUrl ? { senderPhotoUrl: challengePhotoUrl } : {}),
                scheduledTime: timeLabel,
                scheduledAt: validDate.toISOString(),
                assignedAt: new Date(now).toISOString(),
                title: finalTitle,
                prompt: finalPrompt,
                isUnlocked: true,
                isCompleted: false,
                snoozedMinutesTotal: 0,
                snoozeUntilTimestamp: null,
                secretReward: null,
                completedMemoryId: null,
                createdAt: now,
                updatedAt: now
              };

              knownQuestIdsRef.current.add(newChallenge.id);
              void saveQuest(appState.roomCode, newChallenge).catch((err) =>
                console.error('Failed to immediately save new Love Drop:', err)
              );

              // If sender attached a photo, also save it permanently into the shared Photo Vault!
              if (challengePhotoUrl) {
                const senderMemory: PolaroidMemory = {
                  id: `photo-drop-${now}-${Math.random().toString(36).slice(2, 7)}`,
                  questId: newChallenge.id,
                  ownerId: activePartner,
                  createdBy: activePartner,
                  photoUrl: challengePhotoUrl,
                  caption: finalTitle,
                  sticker: '📸',
                  washi: 'rose',
                  timestamp: timeLabel,
                  questTitle: `Photo Drop to ${appState.profiles[target].name}`,
                  createdAt: now,
                  updatedAt: now
                };
                void saveMemory(appState.roomCode, senderMemory).catch((err) =>
                  console.error('Failed to save sender photo drop to Vault:', err)
                );
                updateSharedState((prev) => ({
                  ...prev,
                  quests: [newChallenge, ...prev.quests],
                  memories: [senderMemory, ...prev.memories]
                }));
              } else {
                updateSharedState((prev) => ({ ...prev, quests: [newChallenge, ...prev.quests] }));
              }

              setQuestViewSubMode('assign-partner');
              pushToast(
                challengePhotoUrl
                  ? `Photo Drop Sent to ${appState.profiles[target].name}! 📸`
                  : `SideQuest Sent to ${appState.profiles[target].name}! ✨`,
                `Saved in your "Sent to ${appState.profiles[target].name}" list${
                  challengePhotoUrl ? ' & Photo Vault' : ''
                } and synced live!`,
                challengePhotoUrl ? '📸' : '🔔',
                'emerald'
              );
              setChallengePhotoUrl('');
              setIsCreateChallengeOpen(false);
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-editorial font-bold text-xl text-stone-900">
                  Send a Photo Drop or SideQuest to {partnerProfile.name}
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Snap &amp; send a random photo just to show {partnerProfile.name}, or post a fun SideQuest for them!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateChallengeOpen(false)}
                aria-label="Close form"
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector: Photo Drop vs SideQuest */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-stone-100 border border-stone-200">
              <button
                type="button"
                onClick={() => setChallengeDropType('photo-drop')}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  challengeDropType === 'photo-drop'
                    ? 'bg-white text-rose-600 shadow-xs border border-rose-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>📸 Send Photo Drop</span>
              </button>
              <button
                type="button"
                onClick={() => setChallengeDropType('sidequest')}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  challengeDropType === 'sidequest'
                    ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ Post a SideQuest</span>
              </button>
            </div>

            {/* Camera & Gallery Upload Section (Available in both modes so sender can always attach a photo!) */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-rose-600" />
                  <span>
                    {challengeDropType === 'photo-drop'
                      ? `Your Photo for ${partnerProfile.name}`
                      : `Attach a Photo (Optional)`}
                  </span>
                </span>
                {challengePhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setChallengePhotoUrl('')}
                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Hidden file inputs for Camera Capture and Photo Library */}
              <input
                ref={challengeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => void handleChallengePhotoSelect(e)}
                className="hidden"
              />
              <input
                ref={challengeGalleryInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleChallengePhotoSelect(e)}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => challengeCameraInputRef.current?.click()}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>{challengePhotoBusy ? 'Processing…' : 'Take Photo 📷'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => challengeGalleryInputRef.current?.click()}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-4 h-4 text-rose-500" />
                  <span>Upload Photo 🖼️</span>
                </button>
              </div>

              {challengePhotoUrl && (
                <div className="rounded-xl overflow-hidden border border-rose-200 bg-white p-1.5">
                  <img
                    src={challengePhotoUrl}
                    alt="Preview to send"
                    className="w-full max-h-52 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <label className="block text-xs font-bold text-stone-700">
              {challengeDropType === 'photo-drop' ? 'Caption / Title' : 'SideQuest Title'}
              <input
                required={challengeDropType === 'sidequest' && !challengePhotoUrl}
                placeholder={
                  challengeDropType === 'photo-drop'
                    ? `e.g. Look what I just spotted thinking of you ☕💛`
                    : `e.g. Send me a selfie with your coffee ☕`
                }
                value={challengeTitle}
                onChange={(event) => setChallengeTitle(event.target.value)}
                className="mt-1 w-full min-h-[42px] px-3 rounded-xl bg-stone-50 border border-stone-200 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-stone-700">
              {challengeDropType === 'photo-drop'
                ? `Sweet note or message for ${partnerProfile.name} (optional)`
                : `Details / prompt for ${partnerProfile.name}`}
              <textarea
                required={challengeDropType === 'sidequest' && !challengePhotoUrl}
                rows={2}
                placeholder={
                  challengeDropType === 'photo-drop'
                    ? `Add a note to go with your photo (or leave blank to just send the photo!)...`
                    : `Describe what ${partnerProfile.name} can do or share for this SideQuest...`
                }
                value={challengePrompt}
                onChange={(event) => setChallengePrompt(event.target.value)}
                className="mt-1 w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-stone-700">
              Date and time (optional — defaults to right now)
              <input
                type="datetime-local"
                value={challengeDateTime}
                onChange={(event) => setChallengeDateTime(event.target.value)}
                className="mt-1 w-full min-h-[42px] px-3 rounded-xl bg-stone-50 border border-stone-200 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateChallengeOpen(false)}
                className="min-h-[42px] px-4 rounded-xl bg-stone-100 text-stone-700 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-sm font-bold shadow-sm"
              >
                {challengeDropType === 'photo-drop' || challengePhotoUrl
                  ? `Send Photo Drop to ${partnerProfile.name} 📸`
                  : `Send SideQuest to ${partnerProfile.name} 🚀`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: SHARED AI / RANDOM COUPLE PROMPT POP-UP (BOTH MUST ANSWER)   */}
      {/* =================================================================== */}
      {activeModalSharedPrompt && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full p-5 border-2 border-rose-300 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
                  {activeModalSharedPrompt.promptCategory
                    ? SHARED_PROMPT_CATEGORY_META[activeModalSharedPrompt.promptCategory].icon
                    : '🤖'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      Pop-Up Couple Prompt ✨
                    </span>
                    <span className="text-[11px] font-bold text-stone-600">
                      Both Aaron &amp; Vini Answer
                    </span>
                  </div>
                  <h3 className="font-editorial font-bold text-lg text-stone-900 mt-0.5">
                    {activeModalSharedPrompt.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSharedPromptModalId(null)}
                className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-600 hover:bg-stone-300"
                aria-label="Close prompt popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-200/80 space-y-2">
              <p className="text-sm text-stone-800 font-medium leading-relaxed">
                {activeModalSharedPrompt.prompt}
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs font-bold">
                <span
                  className={`px-2.5 py-0.5 rounded-full ${
                    activeModalSharedPrompt.answers?.aaron?.text
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {appState.profiles.aaron.avatar} {appState.profiles.aaron.name}:{' '}
                  {activeModalSharedPrompt.answers?.aaron?.text ? 'Answered ✓' : 'Waiting ⏳'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full ${
                    activeModalSharedPrompt.answers?.vini?.text
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {appState.profiles.vini.avatar} {appState.profiles.vini.name}:{' '}
                  {activeModalSharedPrompt.answers?.vini?.text ? 'Answered ✓' : 'Waiting ⏳'}
                </span>
              </div>
            </div>

            {!activeModalSharedPrompt.answers?.[activePartner]?.text ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitSharedPromptAnswer(activeModalSharedPrompt);
                }}
                className="space-y-3"
              >
                {activeModalSharedPrompt.answers?.[otherPartner]?.text && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {partnerProfile.name} already answered! Submit your answer below to reveal both answers side-by-side.
                    </span>
                  </div>
                )}
                <label className="block text-xs font-bold text-stone-700">
                  Your Answer ({currentProfile.name} {currentProfile.avatar})
                  <textarea
                    required
                    rows={3}
                    value={sharedPromptDrafts[activeModalSharedPrompt.id] || ''}
                    onChange={(e) =>
                      setSharedPromptDrafts((prev) => ({
                        ...prev,
                        [activeModalSharedPrompt.id]: e.target.value
                      }))
                    }
                    placeholder={`Type your answer for ${partnerProfile.name} to see...`}
                    className="mt-1.5 w-full p-3 rounded-2xl bg-white border border-stone-300 text-sm focus:outline-none focus:border-rose-500"
                  />
                </label>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDropSharedPrompt()}
                    className="min-h-[42px] px-3.5 py-2 rounded-2xl bg-white border border-stone-300 text-stone-700 text-xs font-bold flex items-center gap-1.5 hover:bg-stone-100 transition"
                  >
                    <Dices className="w-4 h-4 text-rose-500" />
                    <span>Roll Different Prompt 🎲</span>
                  </button>
                  <button
                    type="submit"
                    className="min-h-[42px] px-5 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold shadow-md hover:brightness-105 transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Answer ✨</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                    <p className="text-xs font-bold text-rose-900">
                      {currentProfile.avatar} {currentProfile.name}&apos;s Answer
                    </p>
                    <p className="text-sm text-stone-800">
                      {activeModalSharedPrompt.answers[activePartner]?.text}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                    <p className="text-xs font-bold text-amber-950">
                      {partnerProfile.avatar} {partnerProfile.name}&apos;s Answer
                    </p>
                    {activeModalSharedPrompt.answers?.[otherPartner]?.text ? (
                      <p className="text-sm text-stone-800">
                        {activeModalSharedPrompt.answers[otherPartner]?.text}
                      </p>
                    ) : (
                      <p className="text-xs text-stone-500 italic">
                        Waiting for {partnerProfile.name} to submit their answer… ⏳
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => handleDropSharedPrompt()}
                    className="min-h-[42px] px-3.5 py-2 rounded-2xl bg-white border border-stone-300 text-stone-700 text-xs font-bold flex items-center gap-1.5 hover:bg-stone-100 transition"
                  >
                    <Dices className="w-4 h-4 text-rose-500" />
                    <span>Next Random Prompt 🎲</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSharedPromptModalId(null)}
                    className="min-h-[42px] px-5 py-2 rounded-2xl bg-stone-900 text-white text-xs font-bold"
                  >
                    Done ❤️
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: DUAL PROFILE CUSTOMIZATION MODAL                           */}
      {/* =================================================================== */}
      {isProfileModalOpen && (
        <ProfileCustomizationModal
          profiles={appState.profiles}
          partnerId={activePartner}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={(nextProfiles) => {
            soundEngine.playChime();
            updateSharedState((prev) => ({
              ...prev,
              profiles: { ...prev.profiles, [activePartner]: nextProfiles[activePartner] }
            }));
            setIsProfileModalOpen(false);
            pushToast('Couple Profiles Updated! 💑', 'Names, nicknames, and avatars synced live.', '✨', 'emerald');
          }}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 2: QUEST & SECRET PRELOADED REWARD EDITOR MODAL               */}
      {/* =================================================================== */}
      {editingQuest && (
        <QuestSecretEditorModal
          quest={editingQuest}
          profiles={appState.profiles}
          onClose={() => setEditingQuest(null)}
          onSave={(updatedQuest) => {
            soundEngine.playChime();
            void saveQuest(appState.roomCode, updatedQuest).catch((err) =>
              console.error('Failed to immediately save edited quest:', err)
            );
            updateSharedState((prev) => ({
              ...prev,
              quests: prev.quests.map((q) => (q.id === updatedQuest.id ? updatedQuest : q))
            }));
            setEditingQuest(null);
            pushToast(
              'Mission & Secret Reward Saved! 🎁',
              `Synced ${updatedQuest.slotLabel} to ${appState.profiles[updatedQuest.forPartner].name}'s phone.`,
              '🎁',
              'rose'
            );
          }}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 3: BLANK POLAROID STUDIO (CAMERA / UPLOAD FOR COMPLETION)     */}
      {/* =================================================================== */}
      {completingQuest && (
        <PolaroidStudioModal
          mode="complete-quest"
          quest={completingQuest}
          activePartner={activePartner}
          profiles={appState.profiles}
          onClose={() => setCompletingQuest(null)}
          onSaveMemory={(memory) => finalizeQuestAndReward(completingQuest, memory)}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 4: SPONTANEOUS MEMORY STUDIO (DIRECT TO LOVE VAULT)           */}
      {/* =================================================================== */}
      {isSpontaneousMemoryOpen && (
        <PolaroidStudioModal
          mode="spontaneous"
          activePartner={activePartner}
          profiles={appState.profiles}
          onClose={() => setIsSpontaneousMemoryOpen(false)}
          onSaveMemory={(memory) => {
            const now = Date.now();
            const enriched: PolaroidMemory = {
              ...memory,
              createdAt: memory.createdAt || now,
              updatedAt: now
            };
            soundEngine.playFanfare();
            triggerCelebrationConfetti();
            void saveMemory(appState.roomCode, enriched).catch((err) =>
              console.error('Failed to immediately save spontaneous memory:', err)
            );
            updateSharedState((prev) => ({
              ...prev,
              memories: [enriched, ...prev.memories]
            }));
            setIsSpontaneousMemoryOpen(false);
            pushToast(
              'Pinned to Photo Vault! 📸',
              'Your new Polaroid memory is now synced to both phones.',
              '📸',
              'emerald'
            );
          }}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 5: SWAP / EDIT EXISTING POLAROID MEMORY MODAL                 */}
      {/* =================================================================== */}
      {editingMemoryModal && (
        <PolaroidStudioModal
          mode="edit-existing"
          existingMemory={editingMemoryModal}
          activePartner={activePartner}
          profiles={appState.profiles}
          onClose={() => setEditingMemoryModal(null)}
          onSaveMemory={(updatedMemory) => {
            const enriched: PolaroidMemory = {
              ...updatedMemory,
              updatedAt: Date.now()
            };
            soundEngine.playPolaroidShutter();
            void saveMemory(appState.roomCode, enriched).catch((err) =>
              console.error('Failed to immediately save updated memory:', err)
            );
            updateSharedState((prev) => ({
              ...prev,
              memories: prev.memories.map((m) =>
                m.id === enriched.id ? enriched : m
              )
            }));
            setEditingMemoryModal(null);
            if (lightboxMemory?.id === enriched.id) {
              setLightboxMemory(enriched);
            }
            pushToast(
              'Polaroid Keepsake Updated! ✨',
              'Photo, handwritten caption & sticker swapped on both devices.',
              '📸',
              'emerald'
            );
          }}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 6: CELEBRATORY UNLOCKED POLAROID REWARD REVEAL MODAL          */}
      {/* =================================================================== */}
      {unlockedPolaroidModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-3xl max-w-md w-full p-5 border border-rose-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-editorial font-bold text-lg text-stone-900">
                    {unlockedPolaroidModal.isSecretRewardUnlocked
                      ? 'Secret Preloaded Polaroid Unlocked!'
                      : 'New Polaroid Keepsake Developed!'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Saved automatically to your shared Photo Vault
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnlockedPolaroidModal(null)}
                className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-600 hover:bg-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="polaroid-paper rounded-2xl p-4 pb-6 border border-stone-200">
              <div
                className={`w-28 h-6 mx-auto -mt-6 mb-3 rounded-xs border ${
                  WASHI_STYLES[unlockedPolaroidModal.washi].bgClass
                }`}
                style={{
                  backgroundImage: WASHI_STYLES[unlockedPolaroidModal.washi].pattern
                }}
              />
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={unlockedPolaroidModal.photoUrl}
                  alt={unlockedPolaroidModal.caption}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2.5 right-2.5 text-3xl drop-shadow-md">
                  {unlockedPolaroidModal.sticker}
                </span>
              </div>
              <div className="mt-3 text-center">
                <p className="font-handwritten text-2xl text-stone-800">
                  &ldquo;{unlockedPolaroidModal.caption}&rdquo;
                </p>
                <p className="text-[10px] font-mono text-stone-400 uppercase mt-1">
                  {unlockedPolaroidModal.timestamp}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = unlockedPolaroidModal;
                  setUnlockedPolaroidModal(null);
                  setEditingMemoryModal(target);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-2xl bg-white border border-stone-300 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-stone-50"
              >
                <Camera className="w-4 h-4" />
                <span>Swap Photo / Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setUnlockedPolaroidModal(null)}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md"
              >
                Keep in Photo Vault ❤️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 7: FULLSCREEN ZOOM LIGHTBOX FOR LOVE VAULT                    */}
      {/* =================================================================== */}
      {lightboxMemory && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  {lightboxMemory.questTitle}
                </p>
                <p className="text-xs text-stone-300">{lightboxMemory.timestamp}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxMemory(null)}
                className="min-w-[44px] min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="polaroid-paper rounded-3xl p-4 pb-7 border border-stone-200 shadow-2xl">
              <div
                className={`w-32 h-7 mx-auto -mt-7 mb-3 rounded-xs border ${
                  WASHI_STYLES[lightboxMemory.washi].bgClass
                }`}
                style={{ backgroundImage: WASHI_STYLES[lightboxMemory.washi].pattern }}
              />
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={lightboxMemory.photoUrl}
                  alt={lightboxMemory.caption}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 right-3 text-4xl drop-shadow-md">
                  {lightboxMemory.sticker}
                </span>
              </div>
              <div className="mt-4 text-center px-2">
                <p className="font-handwritten text-2xl text-stone-900 leading-snug">
                  &ldquo;{lightboxMemory.caption}&rdquo;
                </p>
                <p className="text-xs font-mono text-stone-400 uppercase mt-2">
                  {lightboxMemory.timestamp} • {appState.profiles[lightboxMemory.ownerId].name} &amp;{' '}
                  {appState.profiles[lightboxMemory.createdBy].name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const mem = lightboxMemory;
                  setEditingMemoryModal(mem);
                }}
                className="flex-1 min-h-[46px] rounded-2xl bg-white text-stone-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-50 transition"
              >
                <Camera className="w-4 h-4 text-rose-500" />
                <span>Swap Image / Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPolaroid(lightboxMemory)}
                className="flex-1 min-h-[46px] rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:brightness-105 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 8: CUSTOM VOUCHER GIFTING MODAL                               */}
      {/* =================================================================== */}
      {false && isCustomVoucherModalOpen && (
        <CustomVoucherModal
          activePartner={activePartner}
          profiles={appState.profiles}
          onClose={() => setIsCustomVoucherModalOpen(false)}
          onCreateVoucher={(newVoucher) => {
            soundEngine.playFanfare();
            triggerCelebrationConfetti();
            updateSharedState((prev) => ({
              ...prev,
              vouchers: [newVoucher, ...prev.vouchers]
            }));
            setIsCustomVoucherModalOpen(false);
            pushToast(
              'Custom Golden Voucher Gifted! 🎟️',
              `Issued "${newVoucher.title}" to ${appState.profiles[newVoucher.forPartner].name}.`,
              '🎁',
              'amber'
            );
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Modal 1: Dual Profile Customization Modal
// ---------------------------------------------------------------------------

function ProfileCustomizationModal({
  profiles,
  partnerId,
  onClose,
  onSave
}: {
  profiles: Record<PartnerId, PartnerProfile>;
  partnerId: PartnerId;
  onClose: () => void;
  onSave: (next: Record<PartnerId, PartnerProfile>) => void;
}) {
  const [draft, setDraft] = useState<Record<PartnerId, PartnerProfile>>(profiles);

  const updatePartnerField = (pid: PartnerId, field: keyof PartnerProfile, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], [field]: value }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full p-5 border border-rose-200 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h3 className="font-editorial font-bold text-lg text-stone-900">
              Couple Profile Customization
            </h3>
            <p className="text-xs text-stone-500">
              Personalize names, nicknames, and avatar icons in real time
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {[partnerId].map((pid) => {
            const p = draft[pid];
            return (
              <div
                key={pid}
                className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    Your profile
                  </span>
                  <span className="text-2xl">{p.avatar}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updatePartnerField(pid, 'name', e.target.value)}
                      className="w-full min-h-[42px] px-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Pet Nickname
                    </label>
                    <input
                      type="text"
                      value={p.nickname}
                      onChange={(e) => updatePartnerField(pid, 'nickname', e.target.value)}
                      className="w-full min-h-[42px] px-3 rounded-xl bg-stone-50 border border-stone-200 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Choose Avatar Icon
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVATAR_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => updatePartnerField(pid, 'avatar', icon)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                          p.avatar === icon
                            ? 'bg-rose-100 border-rose-400 scale-110'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={`background-${pid}`} className="text-[11px] font-bold text-stone-600">
                    This device&apos;s background color
                  </label>
                  <input
                    id={`background-${pid}`}
                    type="color"
                    value={p.backgroundColor || '#FAF7F2'}
                    onChange={(e) => updatePartnerField(pid, 'backgroundColor', e.target.value)}
                    className="w-12 h-9 rounded-lg border border-stone-200 cursor-pointer"
                    aria-label={`${p.name}'s background color`}
                  />
                </div>
              </div>
            );
          })}

        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-2xl bg-stone-200/70 text-stone-700 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="min-h-[44px] px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md"
          >
            Save Profiles ❤️
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Modal 2: Quest & Preloaded Secret Polaroid Reward Editor Modal
// ---------------------------------------------------------------------------

function QuestSecretEditorModal({
  quest,
  profiles,
  onClose,
  onSave
}: {
  quest: QuestItem;
  profiles: Record<PartnerId, PartnerProfile>;
  onClose: () => void;
  onSave: (updated: QuestItem) => void;
}) {
  const [title, setTitle] = useState(quest.title);
  const [prompt, setPrompt] = useState(quest.prompt);
  const [scheduledTime, setScheduledTime] = useState(quest.scheduledTime);
  const [hasSecretReward, setHasSecretReward] = useState(!!quest.secretReward);
  const [photoUrl, setPhotoUrl] = useState(
    quest.secretReward?.photoUrl || FILM_PRESETS[0].url
  );
  const [caption, setCaption] = useState(
    quest.secretReward?.caption || 'Unlocked a secret memory just for you 💌'
  );
  const [sticker, setSticker] = useState(quest.secretReward?.sticker || '💌');
  const [washi, setWashi] = useState<WashiTheme>(quest.secretReward?.washi || 'rose');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file);
    setPhotoUrl(compressed);
    setHasSecretReward(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full p-5 border border-rose-200 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              {quest.slotLabel} • For {profiles[quest.forPartner].name}
            </span>
            <h3 className="font-editorial font-bold text-lg text-stone-900">
              Customize Mission &amp; Secret Polaroid Reward
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Challenge Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-stone-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Scheduled Drop
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-stone-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              Challenge Instructions / Micro-Quest Prompt
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-white border border-stone-200 text-sm"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-rose-600" />
                <div>
                  <p className="text-xs font-bold text-rose-950">
                    Preload a Secret Polaroid Reward 🎁
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Hidden on {profiles[quest.forPartner].name}&apos;s phone until they complete this quest!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasSecretReward(!hasSecretReward)}
                className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-bold transition ${
                  hasSecretReward
                    ? 'bg-rose-600 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {hasSecretReward ? 'Secret Attached ✓' : 'No Preload (Blank Frame)'}
              </button>
            </div>

            {hasSecretReward && (
              <div className="space-y-3 pt-2 border-t border-rose-200/60">
                <div className="flex items-center gap-3">
                  <img
                    src={photoUrl}
                    alt="Secret preview"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-sm shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <label className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-rose-100/50 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Surprise Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {FILM_PRESETS.map((preset, idx) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setPhotoUrl(preset.url);
                            setCaption(preset.defaultCaption);
                            setSticker(preset.sticker);
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg bg-white/80 hover:bg-white border border-stone-200 text-stone-700 shrink-0"
                        >
                          Preset #{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-900 mb-1">
                    Secret Handwritten Polaroid Caption
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-xl bg-white border border-rose-200 font-handwritten text-xl text-stone-800"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    {STICKER_OPTIONS.slice(0, 7).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSticker(st)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border ${
                          sticker === st
                            ? 'bg-white border-rose-500 scale-110'
                            : 'bg-white/50 border-transparent'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {(['rose', 'gold', 'sage', 'kraft'] as WashiTheme[]).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWashi(w)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                          washi === w
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-600 border-stone-200'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-2xl bg-stone-200/70 text-stone-700 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                ...quest,
                title: title.trim() || quest.title,
                prompt: prompt.trim() || quest.prompt,
                scheduledTime: scheduledTime.trim() || quest.scheduledTime,
                secretReward: hasSecretReward
                  ? {
                      photoUrl,
                      caption: caption.trim() || 'Secret Polaroid for you 💌',
                      sticker,
                      washi,
                      rewardTag: `Secret Gift from ${profiles[quest.assignedBy].name}`
                    }
                  : null
              })
            }
            className="min-h-[44px] px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md"
          >
            Save Mission &amp; Reward 🎁
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Modal 3/4/5: Interactive Polaroid Studio (Camera / Upload / Swap / Edit)
// ---------------------------------------------------------------------------

function PolaroidStudioModal({
  mode,
  quest,
  existingMemory,
  activePartner,
  profiles,
  onClose,
  onSaveMemory
}: {
  mode: 'complete-quest' | 'spontaneous' | 'edit-existing';
  quest?: QuestItem;
  existingMemory?: PolaroidMemory;
  activePartner: PartnerId;
  profiles: Record<PartnerId, PartnerProfile>;
  onClose: () => void;
  onSaveMemory: (memory: PolaroidMemory) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState<string>(
    existingMemory?.photoUrl || FILM_PRESETS[2].url
  );
  const [caption, setCaption] = useState<string>(
    existingMemory?.caption ||
      (quest ? `Completed ${quest.title}! ✨` : 'Spontaneous moment worth keeping forever 📸❤️')
  );
  const [sticker, setSticker] = useState<string>(existingMemory?.sticker || '✨');
  const [washi, setWashi] = useState<WashiTheme>(existingMemory?.washi || 'rose');
  const [questTitle] = useState<string>(
    existingMemory?.questTitle ||
      (quest ? quest.slotLabel.replace(/^[^\s]+\s/, '') : 'Spontaneous Keepsake')
  );
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is blocked in this preview frame—use Upload Photo or Film Presets below!');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 600 }, height: { ideal: 600 } },
        audio: false
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 60);
    } catch {
      setCameraError('Could not open webcam—choose a photo file or film preset below!');
    }
  };

  const captureWebcamFrame = () => {
    if (!videoRef.current) return;
    soundEngine.playPolaroidShutter();
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const sx = ((video.videoWidth || 480) - size) / 2;
      const sy = ((video.videoHeight || 480) - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480);
      setPhotoUrl(canvas.toDataURL('image/jpeg', 0.82));
    }
    stopCamera();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playPolaroidShutter();
    const compressed = await compressImageFile(file);
    setPhotoUrl(compressed);
  };

  const handleConfirm = () => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const result: PolaroidMemory = existingMemory
      ? {
          ...existingMemory,
          photoUrl,
          caption: caption.trim() || existingMemory.caption,
          sticker,
          washi,
          questTitle: questTitle.trim() || existingMemory.questTitle
        }
      : {
          id: 'mem-' + Date.now(),
          questId: quest?.id,
          slotType: quest?.slot,
          ownerId: quest ? quest.forPartner : activePartner,
          createdBy: activePartner,
          photoUrl,
          caption: caption.trim() || 'Captured for our Photo Vault ❤️',
          sticker,
          washi,
          timestamp: `OCT 27 '26 • ${formattedTime}`,
          questTitle: questTitle.trim() || 'SideQuest Keepsake',
          isSecretRewardUnlocked: false
        };
    onSaveMemory(result);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full p-5 border border-rose-200 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              {mode === 'complete-quest'
                ? 'Blank Polaroid Frame Studio'
                : mode === 'edit-existing'
                ? 'Swap / Edit Polaroid Keepsake'
                : 'New Photo Vault Keepsake'}
            </span>
            <h3 className="font-editorial font-bold text-lg text-stone-900">
              {mode === 'complete-quest'
                ? `Snap Proof for "${quest?.title}"`
                : mode === 'edit-existing'
                ? 'Customize Polaroid Photo & Handwritten Note'
                : `Add Spontaneous Memory (${profiles[activePartner].name})`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
          <div className="max-w-xs mx-auto polaroid-paper rounded-2xl p-3.5 pb-5 border border-stone-200">
            <div
              className={`w-28 h-6 mx-auto -mt-6 mb-2.5 rounded-xs border ${
                WASHI_STYLES[washi].bgClass
              }`}
              style={{ backgroundImage: WASHI_STYLES[washi].pattern }}
            />
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-900 border border-stone-200">
              {isCameraActive ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={captureWebcamFrame}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 min-h-[42px] px-4 py-2 rounded-full bg-rose-600 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Shutter 📸</span>
                  </button>
                </div>
              ) : (
                <>
                  <img
                    src={photoUrl}
                    alt="Polaroid preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 text-3xl drop-shadow-md">
                    {sticker}
                  </span>
                </>
              )}
            </div>
            <div className="mt-3 text-center">
              <p className="font-handwritten text-xl text-stone-800 leading-snug">
                &ldquo;{caption || 'Write your caption below...'}&rdquo;
              </p>
            </div>
          </div>

          {cameraError && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
              {cameraError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <label className="min-h-[44px] px-3 py-2 rounded-2xl bg-white border border-rose-300 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-rose-50 transition">
              <Upload className="w-4 h-4" />
              <span>Upload Photo (Auto-Compress)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startLiveCamera}
              className="min-h-[44px] px-3 py-2 rounded-2xl bg-white border border-stone-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-stone-50 transition"
            >
              <Camera className="w-4 h-4 text-rose-500" />
              <span>{isCameraActive ? 'Close Camera' : 'Use Live Camera'}</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1.5">
              Or Pick a Warm Instant-Film Preset:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FILM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playPolaroidShutter();
                    setPhotoUrl(preset.url);
                    setSticker(preset.sticker);
                  }}
                  className={`rounded-xl overflow-hidden border-2 aspect-square relative group ${
                    photoUrl === preset.url ? 'border-rose-500 scale-102' : 'border-transparent'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              Handwritten Polaroid Caption (&apos;Caveat&apos; Script)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a sweet memory note..."
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-stone-200 font-handwritten text-xl text-stone-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Sticker Pin
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                {STICKER_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSticker(st)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border ${
                      sticker === st
                        ? 'bg-rose-100 border-rose-400 scale-110'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Washi Tape Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['rose', 'gold', 'sage', 'kraft'] as WashiTheme[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWashi(w)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold capitalize border ${
                      washi === w
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-2xl bg-stone-200/70 text-stone-700 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="min-h-[44px] px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md"
          >
            {mode === 'complete-quest'
              ? 'Develop Polaroid & Complete Quest 🎉'
              : 'Save Polaroid Keepsake 📸'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Modal 8: Custom Golden Voucher Gifting Modal
// ---------------------------------------------------------------------------

function CustomVoucherModal({
  activePartner,
  profiles,
  onClose,
  onCreateVoucher
}: {
  activePartner: PartnerId;
  profiles: Record<PartnerId, PartnerProfile>;
  onClose: () => void;
  onCreateVoucher: (voucher: GoldenVoucher) => void;
}) {
  const otherPartner: PartnerId = activePartner === 'aaron' ? 'vini' : 'aaron';
  const [title, setTitle] = useState('Homemade Pasta & Wine Night');
  const [terms, setTerms] = useState(
    'Redeemable any evening for fresh homemade pasta, candlelit table, and zero dishes for the recipient.'
  );
  const [icon, setIcon] = useState('🍝');
  const [forPartner, setForPartner] = useState<PartnerId>(otherPartner);

  const iconChoices = ['🍝', '💆‍♀️', '🍨', '🍿', '☕', '🥂', '🛁', '✈️', '🧸', '🥞'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-md w-full p-5 border border-amber-300 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Custom Golden Love Coupon
            </span>
            <h3 className="font-editorial font-bold text-lg text-stone-900">
              Gift a 3D Voucher to Your Partner
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              Recipient Partner
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['aaron', 'vini'] as PartnerId[]).map((pid) => (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setForPartner(pid)}
                  className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                    forPartner === pid
                      ? 'bg-amber-100 border-amber-400 text-amber-950'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}
                >
                  <span>{profiles[pid].avatar}</span>
                  <span>For {profiles[pid].name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              Voucher Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-stone-200 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              Perk Terms &amp; Fine Print
            </label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full p-3 rounded-xl bg-white border border-stone-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              Certificate Seal Icon
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {iconChoices.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border ${
                    icon === ic
                      ? 'bg-amber-100 border-amber-400 scale-110'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-2xl bg-stone-200/70 text-stone-700 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const issuedBy: PartnerId = forPartner === 'aaron' ? 'vini' : 'aaron';
              onCreateVoucher({
                id: 'v-custom-' + Date.now(),
                title: title.trim() || 'Custom Love Coupon',
                terms: terms.trim() || 'Redeemable anytime with love.',
                icon,
                issuedBy,
                forPartner,
                isRedeemed: false,
                redeemedAt: null,
                unlockedAtQuestCount: 3,
                isCustom: true
              });
            }}
            className="min-h-[44px] px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-md"
          >
            Issue Golden Voucher 🎟️
          </button>
        </div>
      </div>
    </div>
  );
}
