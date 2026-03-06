import { create } from 'zustand';
import { Profile, ChatThread, ChatMessage, Connection, MissedConnection, Venue, Filters, Referral, MessageRequest } from '../types';
import { mockProfiles } from '../data/profiles';
import { mockVenues } from '../data/venues';
import { mockChatThreads, mockConnections, mockMissedConnections } from '../data/chats';
import { resolveProfileId } from '../data/profileIdAlias';
import {
  fetchMatchFeed,
  sbProfileToLocal,
  fetchMyProfile as sbFetchMyProfile,
  sendLike as sbSendLike,
  fetchMyChats,
  fetchMessages as sbFetchMessages,
  sendMessage as sbSendMessage,
  togglePremium as sbTogglePremium,
  fetchLikesReceived as sbFetchLikesReceived,
  fetchStorageObjectsCount,
  fetchIncomingRequests as sbFetchIncomingRequests,
  createMessageRequest as sbCreateMessageRequest,
  updateRequestStatus as sbUpdateRequestStatus,
  type SbIncomingLike,
} from '../lib/matchmaking';
import {
  fetchVenues as sbFetchVenues,
  sbVenueToLocal,
  addVenueToDb,
  rateVenue as sbRateVenue,
  checkInToVenue as sbCheckInToVenue,
  fetchMissedConnections as sbFetchMissedConnections,
} from '../lib/venues';

interface AppState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  supabaseUserId: string | null;
  profileStatus: 'incomplete' | 'active' | null;
  authLoading: boolean;
  setAuthState: (userId: string | null, profileStatus: 'incomplete' | 'active' | null) => void;
  setAuthLoading: (v: boolean) => void;

  isPremium: boolean;
  setPremium: (val: boolean) => void;

  myProfile: Profile | null;
  storageObjectsCount: number;
  loadMyProfile: () => Promise<void>;

  likesInbox: { id: string; fromUser: string; name: string; age: number; photo: string | null; comment: string | null; createdAt: string }[];
  likesInboxLoading: boolean;
  loadLikesReceived: () => Promise<void>;

  profiles: Profile[];
  currentProfileIndex: number;
  nextProfile: () => void;
  getFilteredProfiles: () => Profile[];
  getProfileById: (id: string) => Profile | undefined;

  feedLoading: boolean;
  loadFeed: () => Promise<void>;

  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;

  likedProfiles: string[];
  passedProfiles: string[];
  likeProfile: (profileId: string, note?: string) => void;
  passProfile: (profileId: string) => void;

  chatThreads: ChatThread[];
  addChatThread: (thread: ChatThread) => void;
  addMessageToThread: (threadId: string, message: ChatMessage) => void;

  chatsLoading: boolean;
  loadChats: () => Promise<void>;
  loadMessages: (threadId: string) => Promise<void>;
  sbSendMsg: (threadId: string, text: string) => Promise<void>;

  connections: Connection[];
  addConnection: (connection: Connection) => void;

  missedConnections: MissedConnection[];
  showLast24Hours: boolean;
  toggleLast24Hours: () => void;

  referrals: Referral[];
  referProfile: (profileId: string, friendId: string, friendName: string) => void;

  venues: Venue[];
  addVenue: (venue: Venue) => void;
  savedVenues: string[];
  saveVenue: (venueId: string) => void;
  unsaveVenue: (venueId: string) => void;

  venuesLoading: boolean;
  loadVenues: () => Promise<void>;
  sbRate: (venueId: string, rating: number) => Promise<void>;
  sbCheckIn: (venueId: string) => Promise<void>;

  missedConnectionsLoading: boolean;
  loadMissedConnections: () => Promise<void>;

  savedPlans: { id: string; vibeText: string; venueIds: string[]; createdAt: string }[];
  savePlan: (vibeText: string, venueIds: string[]) => void;

  toastMessage: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;

  lastSupabaseError: string | null;
  setLastError: (msg: string) => void;

  likesReceivedCount: number;
  interestedIn: 'male' | 'female';

  requestsReceived: MessageRequest[];
  requestsLoading: boolean;
  loadRequests: () => Promise<void>;
  getPendingRequestsCount: () => number;
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  sendMessageRequest: (toProfileId: string, message: string, venueName?: string) => void;

  currentUserId: string;
  photoCropSettings: Record<string, Record<number, { position: string; zoom: number }>>;
  setPhotoCrop: (profileId: string, photoIndex: number, position: string, zoom: number) => void;
  resetPhotoCrop: (profileId: string, photoIndex: number) => void;
  updateProfile: (profileId: string, updates: Partial<Profile>) => void;

  referralCode: string;
  invitesSent: number;
  friendsJoined: number;
  appliedReferralCode: string;
  incrementInvitesSent: () => void;
  applyReferralCode: (code: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({
    isAuthenticated: false, supabaseUserId: null, profileStatus: null,
    myProfile: null, currentUserId: 'andrew',
    profiles: mockProfiles, venues: mockVenues,
    chatThreads: mockChatThreads, connections: mockConnections,
    missedConnections: mockMissedConnections,
    feedLoading: false, venuesLoading: false, chatsLoading: false,
  }),

  supabaseUserId: null,
  profileStatus: null,
  authLoading: false,
  setAuthState: (userId, profileStatus) => {
    if (userId) {
      set({
        supabaseUserId: userId, profileStatus, isAuthenticated: true,
        currentUserId: userId,
        profiles: [], venues: [], chatThreads: [],
        connections: [], missedConnections: [], requestsReceived: [],
        likesReceivedCount: 0, myProfile: null,
        feedLoading: true, venuesLoading: true, chatsLoading: true,
      });
    } else {
      set({
        supabaseUserId: null, profileStatus: null,
        isAuthenticated: false, currentUserId: 'andrew',
      });
    }
  },
  setAuthLoading: (v) => set({ authLoading: v }),

  isPremium: false,
  setPremium: (val) => {
    set({ isPremium: val });
    const { supabaseUserId } = get();
    if (supabaseUserId) {
      sbTogglePremium(val).catch(e => get().setLastError(`sbTogglePremium: ${e}`));
    }
  },

  myProfile: null,
  storageObjectsCount: 0,
  loadMyProfile: async () => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    try {
      const [{ data, error }, objCount] = await Promise.all([
        sbFetchMyProfile(),
        fetchStorageObjectsCount(),
      ]);
      if (error || !data) { get().setLastError(error ?? 'loadMyProfile: no data'); return; }

      if (__DEV__) {
        console.log('[loadMyProfile] photos rows:', data.photos.length);
        console.log('[loadMyProfile] storage objects:', objCount);
      }

      const local = sbProfileToLocal(data);

      set({
        myProfile: local as Profile,
        storageObjectsCount: objCount,
        isPremium: data.is_premium,
        interestedIn: (data.interested_in as 'male' | 'female') ?? 'female',
      });
    } catch (e: any) {
      get().setLastError(`loadMyProfile: ${e.message}`);
    }
  },

  likesInbox: [],
  likesInboxLoading: false,
  loadLikesReceived: async () => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    set({ likesInboxLoading: true });
    try {
      const { data, error } = await sbFetchLikesReceived();
      if (error) { get().setLastError(`loadLikesReceived: ${error}`); return; }
      set({
        likesInbox: data.map(l => ({
          id: l.id,
          fromUser: l.from_user,
          name: l.first_name,
          age: l.age,
          photo: l.photo_url,
          comment: l.comment,
          createdAt: l.created_at,
        })),
        likesReceivedCount: data.length,
      });
    } finally {
      set({ likesInboxLoading: false });
    }
  },

  profiles: mockProfiles,
  currentProfileIndex: 0,
  feedLoading: false,

  loadFeed: async () => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    set({ feedLoading: true });
    try {
      const { data, error } = await fetchMatchFeed();
      if (error) { get().setLastError(`loadFeed: ${error}`); return; }
      const localProfiles = data.map(sbProfileToLocal);
      set({ profiles: localProfiles, currentProfileIndex: 0, passedProfiles: [] });
    } finally {
      set({ feedLoading: false });
    }
  },

  nextProfile: () => {
    const { currentProfileIndex } = get();
    const filtered = get().getFilteredProfiles();
    if (currentProfileIndex < filtered.length - 1) {
      set({ currentProfileIndex: currentProfileIndex + 1 });
    }
  },
  getProfileById: (id: string) => {
    const resolved = resolveProfileId(id);
    const { myProfile, currentUserId } = get();
    if (myProfile && resolved === currentUserId) return myProfile;
    return get().profiles.find(p => p.id === resolved);
  },
  getFilteredProfiles: () => {
    const { profiles, filters, referrals, passedProfiles, currentUserId, interestedIn, supabaseUserId } = get();
    let filtered = profiles.filter(p => {
      if (p.id === currentUserId) return false;
      if (passedProfiles.includes(p.id)) return false;
      if (!supabaseUserId && p.gender !== interestedIn) return false;
      return true;
    });

    if (filters.ethnicities.length > 0) {
      filtered = filtered.filter(p => filters.ethnicities.includes(p.ethnicity));
    }
    if (filters.religions.length > 0) {
      filtered = filtered.filter(p => filters.religions.includes(p.religion));
    }
    filtered = filtered.filter(p => p.age >= filters.ageRange[0] && p.age <= filters.ageRange[1]);

    const referredIds = referrals.map(r => r.profileId);
    const referred = filtered.filter(p => referredIds.includes(p.id)).map(p => ({ ...p, isReferred: true }));
    const nonReferred = filtered.filter(p => !referredIds.includes(p.id));
    return [...referred, ...nonReferred];
  },

  filters: {
    distance: 25,
    city: 'Manhattan, NYC',
    ethnicities: [],
    religions: [],
    ageRange: [21, 35],
    heightRange: [60, 78],
  },
  setFilters: (newFilters) => set(state => ({
    filters: { ...state.filters, ...newFilters },
    currentProfileIndex: 0,
  })),

  likedProfiles: [],
  passedProfiles: [],
  likeProfile: (profileId, note) => {
    const state = get();
    const profile = state.profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (state.supabaseUserId) {
      sbSendLike(profileId, { comment: note }).then(({ matched, error }) => {
        if (error) get().setLastError(`sbSendLike: ${error}`);
        const newLiked = [...get().likedProfiles, profileId];
        if (matched) {
          set({ likedProfiles: newLiked, toastMessage: `It's a match with ${profile.name}! 🎉` });
          get().loadChats();
        } else {
          set({ likedProfiles: newLiked, toastMessage: `Liked ${profile.name}` });
        }
        setTimeout(() => get().clearToast(), 3000);
      });
      state.nextProfile();
      return;
    }

    const newLiked = [...state.likedProfiles, profileId];
    const alreadyLiked = ['skyler', 'shannon', 'kaitlyn', 'ari'].includes(profileId);

    let newThreads = [...state.chatThreads];
    if (alreadyLiked && !state.chatThreads.find(t => t.participants.includes(profileId))) {
      const newThread: ChatThread = {
        id: `chat_${Date.now()}`,
        type: 'dm',
        participants: ['me', profileId],
        participantNames: ['You', profile.name],
        participantPhotos: ['', profile.photos[0]],
        lastMessage: note || `You matched with ${profile.name}!`,
        lastMessageTime: 'Just now',
        unread: 1,
        messages: [
          {
            id: `m_${Date.now()}`,
            senderId: 'system',
            senderName: 'IRL',
            text: `You matched with ${profile.name}! ${note ? `Your note: "${note}"` : 'Say hi!'}`,
            timestamp: 'Just now',
          },
        ],
      };
      newThreads = [newThread, ...newThreads];
    }

    set({
      likedProfiles: newLiked,
      chatThreads: newThreads,
      toastMessage: alreadyLiked ? `It's a match with ${profile.name}! 🎉` : `Liked ${profile.name}`,
    });

    state.nextProfile();
    setTimeout(() => get().clearToast(), 3000);
  },
  passProfile: (profileId) => {
    set(state => ({ passedProfiles: [...state.passedProfiles, profileId] }));
    get().nextProfile();
  },

  chatThreads: mockChatThreads,
  chatsLoading: false,
  addChatThread: (thread) => set(state => ({ chatThreads: [thread, ...state.chatThreads] })),
  addMessageToThread: (threadId, message) => {
    const { supabaseUserId } = get();
    set(state => ({
      chatThreads: state.chatThreads.map(t =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, message], lastMessage: message.text, lastMessageTime: 'Just now' }
          : t,
      ),
    }));
    if (supabaseUserId && message.senderId === 'me') {
      sbSendMessage(
        threadId,
        message.text,
        (message.type === 'referral' ? 'referral_card' : 'text') as any,
        message.referredProfileId,
      ).catch(e => get().setLastError(`sbSendMessage: ${e}`));
    }
  },

  loadChats: async () => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    set({ chatsLoading: true });
    try {
      const { data, error } = await fetchMyChats();
      if (error) { get().setLastError(`loadChats: ${error}`); return; }
      const threads: ChatThread[] = data.map(c => {
        const others = c.participants.filter(p => p.user_id !== supabaseUserId);
        return {
          id: c.id,
          type: c.chat_type,
          participants: ['me', ...others.map(o => o.user_id)],
          participantNames: ['You', ...others.map(o => o.first_name)],
          participantPhotos: ['', ...others.map(o => o.photo_url ?? '')],
          lastMessage: c.last_message ?? '',
          lastMessageTime: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unread: 0,
          messages: [],
        };
      });
      set({ chatThreads: threads });
    } finally {
      set({ chatsLoading: false });
    }
  },

  loadMessages: async (threadId: string) => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    const { data, error } = await sbFetchMessages(threadId);
    if (error) { get().setLastError(`loadMessages: ${error}`); return; }
    const messages: ChatMessage[] = data.map(m => ({
      id: m.id,
      senderId: m.sender_id === supabaseUserId ? 'me' : m.sender_id,
      senderName: m.sender_id === supabaseUserId ? 'You' : '',
      text: m.text ?? '',
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: m.message_type === 'referral_card' ? 'referral' as const : undefined,
      referredProfileId: m.referral_profile_id ?? undefined,
    }));
    set(state => ({
      chatThreads: state.chatThreads.map(t =>
        t.id === threadId ? { ...t, messages } : t,
      ),
    }));
  },

  sbSendMsg: async (threadId: string, text: string) => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    const { error } = await sbSendMessage(threadId, text);
    if (error) get().setLastError(`sbSendMsg: ${error}`);
  },

  connections: mockConnections,
  addConnection: (connection) => set(state => ({ connections: [...state.connections, connection] })),

  missedConnections: mockMissedConnections,
  showLast24Hours: false,
  toggleLast24Hours: () => set(state => ({ showLast24Hours: !state.showLast24Hours })),

  referrals: [],
  referProfile: (profileId, friendId, friendName) => {
    const profile = get().profiles.find(p => p.id === profileId);
    if (!profile) return;

    set(state => ({
      referrals: [...state.referrals, { profileId, friendId, friendName, timestamp: new Date().toISOString() }],
      toastMessage: `Sent to ${friendName} — she'll see this profile at the top of her stack`,
    }));
    setTimeout(() => get().clearToast(), 3500);
  },

  venues: mockVenues,
  venuesLoading: false,
  addVenue: (venue) => {
    const { supabaseUserId } = get();
    set(state => ({ venues: [...state.venues, venue] }));
    if (supabaseUserId) {
      addVenueToDb({
        name: venue.name,
        category: venue.category,
        neighborhood: venue.address || undefined,
        lat: venue.latitude,
        lng: venue.longitude,
        tags: venue.tags,
        deal_title: venue.deal || undefined,
        deal_details: venue.dealValue || undefined,
        rating_avg: venue.rating,
      }).catch(e => get().setLastError(`addVenueToDb: ${e}`));
    }
  },
  savedVenues: [],
  saveVenue: (venueId) => set(state => ({ savedVenues: [...state.savedVenues, venueId] })),
  unsaveVenue: (venueId) => set(state => ({ savedVenues: state.savedVenues.filter(id => id !== venueId) })),

  loadVenues: async () => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    set({ venuesLoading: true });
    try {
      const { data, error } = await sbFetchVenues();
      if (error) { get().setLastError(`loadVenues: ${error}`); return; }
      const localVenues = data.map(sbVenueToLocal) as Venue[];
      set({ venues: localVenues });
    } finally {
      set({ venuesLoading: false });
    }
  },

  sbRate: async (venueId: string, rating: number) => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    const { error } = await sbRateVenue(venueId, rating);
    if (error) { get().setLastError(`sbRate: ${error}`); return; }
    get().loadVenues();
    get().showToast('Rating saved');
  },

  sbCheckIn: async (venueId: string) => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    const { error } = await sbCheckInToVenue(venueId);
    if (error) { get().setLastError(`sbCheckIn: ${error}`); return; }
    get().showToast('Checked in!');
  },

  missedConnectionsLoading: false,
  loadMissedConnections: async () => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    set({ missedConnectionsLoading: true });
    try {
      const { data, error } = await sbFetchMissedConnections();
      if (error) { get().setLastError(`loadMissedConnections: ${error}`); return; }
      const mc: MissedConnection[] = data.map(d => ({
        id: d.user_id,
        name: d.first_name,
        age: d.age,
        photo: d.photo_url ?? '',
        venue: d.venue_name,
        mutuals: d.mutuals,
        timeAgo: '',
      }));
      set({ missedConnections: mc });
    } finally {
      set({ missedConnectionsLoading: false });
    }
  },

  savedPlans: [],
  savePlan: (vibeText, venueIds) => {
    set(state => ({
      savedPlans: [...state.savedPlans, { id: `plan_${Date.now()}`, vibeText, venueIds, createdAt: new Date().toISOString() }],
    }));
    get().showToast('Date plan saved!');
  },

  toastMessage: null,
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => get().clearToast(), 3000);
  },
  clearToast: () => set({ toastMessage: null }),

  lastSupabaseError: null,
  setLastError: (msg) => {
    set({ lastSupabaseError: msg });
    console.warn('[Supabase error]', msg);
    if (__DEV__) get().showToast(`SB Error: ${msg.slice(0, 80)}`);
  },

  likesReceivedCount: 12,
  interestedIn: 'female',

  requestsReceived: [
    { id: 'req1', fromProfileId: 'stella', toProfileId: 'andrew', message: 'Saw you at Sotto Voce — want to check out another IRL deal this weekend?', venueName: 'Sotto Voce', timestamp: '1h ago', status: 'pending' },
    { id: 'req2', fromProfileId: 'zoey', toProfileId: 'andrew', message: 'We were both near The Gilded Fox last night! Small world 🌎', venueName: 'The Gilded Fox', timestamp: '3h ago', status: 'pending' },
    { id: 'req3', fromProfileId: 'olivia', toProfileId: 'andrew', message: 'Love your prompt about the West Village wine bars — any recommendations?', venueName: 'Neon Tiger', timestamp: '5h ago', status: 'pending' },
    { id: 'req4', fromProfileId: 'jasmine', toProfileId: 'andrew', message: 'Hey! I think we were at Skybar Tribeca the same night. Cool app concept btw!', venueName: 'Skybar Tribeca', timestamp: '8h ago', status: 'pending' },
    { id: 'req5', fromProfileId: 'lily', toProfileId: 'andrew', message: 'Your founder energy is inspiring — would love to grab coffee sometime ☕', venueName: 'Court 16 Pickleball', timestamp: '12h ago', status: 'pending' },
  ],
  requestsLoading: false,
  loadRequests: async () => {
    const { supabaseUserId } = get();
    if (!supabaseUserId) return;
    set({ requestsLoading: true });
    try {
      const { data, error } = await sbFetchIncomingRequests();
      if (error) { get().setLastError(`loadRequests: ${error}`); return; }
      const mapped: MessageRequest[] = data.map(r => ({
        id: r.id,
        fromProfileId: r.from_user,
        toProfileId: r.to_user,
        message: r.message,
        venueName: r.venue_name,
        timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: r.status,
      }));
      set({ requestsReceived: mapped });
    } finally {
      set({ requestsLoading: false });
    }
  },
  getPendingRequestsCount: () => get().requestsReceived.filter(r => r.status === 'pending').length,
  acceptRequest: (id) => {
    const state = get();
    const req = state.requestsReceived.find(r => r.id === id);
    if (!req) return;
    const sender = state.profiles.find(p => p.id === req.fromProfileId);
    if (!sender) return;

    if (state.supabaseUserId) {
      sbUpdateRequestStatus(id, 'accepted').catch(e => get().setLastError(`sbAcceptRequest: ${e}`));
    }

    const existingThread = state.chatThreads.find(
      t => t.type === 'dm' && t.participants.includes(req.fromProfileId),
    );
    const threadId = existingThread?.id || `chat_req_${Date.now()}`;

    let newThreads = [...state.chatThreads];
    if (!existingThread) {
      newThreads = [{
        id: threadId,
        type: 'dm' as const,
        participants: ['me', req.fromProfileId],
        participantNames: ['You', sender.name],
        participantPhotos: ['', sender.photos[0]],
        lastMessage: req.message,
        lastMessageTime: 'Just now',
        unread: 1,
        messages: [{
          id: `m_${Date.now()}`,
          senderId: req.fromProfileId,
          senderName: sender.name,
          text: req.message,
          timestamp: 'Just now',
        }],
      }, ...newThreads];
    }

    set({
      requestsReceived: state.requestsReceived.map(r =>
        r.id === id ? { ...r, status: 'accepted' as const } : r,
      ),
      chatThreads: newThreads,
      toastMessage: `Chat opened with ${sender.name}`,
    });
    setTimeout(() => get().clearToast(), 3000);
  },
  declineRequest: (id) => {
    const { supabaseUserId } = get();
    if (supabaseUserId) {
      sbUpdateRequestStatus(id, 'declined').catch(e => get().setLastError(`sbDeclineRequest: ${e}`));
    }
    set(state => ({
      requestsReceived: state.requestsReceived.map(r =>
        r.id === id ? { ...r, status: 'declined' as const } : r,
      ),
    }));
  },
  sendMessageRequest: (toProfileId, message, venueName) => {
    const state = get();
    if (state.supabaseUserId) {
      sbCreateMessageRequest(toProfileId, message).then(({ error }) => {
        if (error) get().setLastError(`sbCreateMessageRequest: ${error}`);
      });
    }
    set({
      requestsReceived: [...state.requestsReceived, {
        id: `req_${Date.now()}`,
        fromProfileId: state.currentUserId,
        toProfileId,
        message,
        venueName,
        timestamp: 'Just now',
        status: 'pending',
      }],
      toastMessage: 'Message request sent',
    });
    setTimeout(() => get().clearToast(), 3000);
  },

  currentUserId: 'andrew',
  photoCropSettings: {},
  setPhotoCrop: (profileId, photoIndex, position, zoom) =>
    set(state => ({
      photoCropSettings: {
        ...state.photoCropSettings,
        [profileId]: {
          ...(state.photoCropSettings[profileId] || {}),
          [photoIndex]: { position, zoom },
        },
      },
    })),
  resetPhotoCrop: (profileId, photoIndex) =>
    set(state => {
      const updated = { ...(state.photoCropSettings[profileId] || {}) };
      delete updated[photoIndex];
      return { photoCropSettings: { ...state.photoCropSettings, [profileId]: updated } };
    }),
  updateProfile: (profileId, updates) =>
    set(state => ({
      profiles: state.profiles.map(p =>
        p.id === profileId ? { ...p, ...updates } : p,
      ),
    })),

  referralCode: 'IRL-ANDREW-482',
  invitesSent: 3,
  friendsJoined: 1,
  appliedReferralCode: '',
  incrementInvitesSent: () => set(state => ({ invitesSent: state.invitesSent + 1 })),
  applyReferralCode: (code) => {
    set({ appliedReferralCode: code.toUpperCase().trim() });
    get().showToast('Referral applied!');
  },
}));
