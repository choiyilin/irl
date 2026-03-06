import { supabase } from './supabase';

// ── Types ───────────────────────────────────────────────────

export interface SbVenue {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  lat: number;
  lng: number;
  tags: string[];
  rating_avg: number;
  partner: boolean;
  featured: boolean;
  deal_title: string | null;
  deal_details: string | null;
  created_at: string;
  created_by: string | null;
}

export interface SbMissedConnection {
  user_id: string;
  first_name: string;
  age: number;
  photo_url: string | null;
  venue_name: string;
  mutuals: number;
}

// ── Helpers ─────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function photoUrl(storagePath: string): string {
  const { data } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
  return data.publicUrl;
}

const CATEGORY_PHOTO: Record<string, string> = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  bar: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400',
  club: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400',
  activity: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
  other: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
};

// ── Venues ──────────────────────────────────────────────────

export async function fetchVenues(): Promise<{ data: SbVenue[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('rating_avg', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [] };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

export function sbVenueToLocal(v: SbVenue): {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
  deal: string;
  dealValue: string;
  tags: string[];
  description: string;
  photo: string;
  address: string;
  addedBy?: string;
} {
  const cat = (v.category ?? 'other') as string;
  return {
    id: v.id,
    name: v.name,
    category: cat as any,
    latitude: v.lat,
    longitude: v.lng,
    rating: Number(v.rating_avg) || 0,
    deal: v.deal_title ?? '',
    dealValue: v.deal_details ?? '',
    tags: v.tags ?? [],
    description: v.deal_title ? `${v.name} — ${v.deal_title}` : `${v.name} in ${v.neighborhood ?? 'Manhattan'}`,
    photo: CATEGORY_PHOTO[cat] ?? CATEGORY_PHOTO.other,
    address: v.neighborhood ?? '',
    addedBy: v.created_by ?? undefined,
  };
}

export async function addVenueToDb(venue: {
  name: string;
  category: string;
  neighborhood?: string;
  lat: number;
  lng: number;
  tags: string[];
  deal_title?: string;
  deal_details?: string;
  rating_avg?: number;
}): Promise<{ id?: string; error?: string }> {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('venues')
      .insert({ ...venue, created_by: userId })
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { id: data.id };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Ratings ─────────────────────────────────────────────────

export async function rateVenue(
  venueId: string,
  rating: number,
): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();
    const { error } = await supabase
      .from('venue_ratings')
      .upsert(
        { venue_id: venueId, user_id: userId, rating },
        { onConflict: 'venue_id,user_id' },
      );
    if (error) return { error: error.message };

    const { data: avg } = await supabase
      .from('venue_ratings')
      .select('rating')
      .eq('venue_id', venueId);

    if (avg && avg.length > 0) {
      const mean = avg.reduce((s: number, r: any) => s + r.rating, 0) / avg.length;
      await supabase
        .from('venues')
        .update({ rating_avg: Math.round(mean * 10) / 10 })
        .eq('id', venueId);
    }

    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Check-ins ───────────────────────────────────────────────

export async function checkInToVenue(
  venueId: string,
): Promise<{ error?: string }> {
  try {
    const userId = await getUserId();
    const { error } = await supabase
      .from('venue_checkins')
      .insert({ venue_id: venueId, user_id: userId });
    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Missed Connections ──────────────────────────────────────

export async function fetchMissedConnections(): Promise<{
  data: SbMissedConnection[];
  error?: string;
}> {
  try {
    const userId = await getUserId();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: myCheckins } = await supabase
      .from('venue_checkins')
      .select('venue_id')
      .eq('user_id', userId)
      .gte('created_at', since);

    if (!myCheckins?.length) return { data: [] };
    const venueIds = [...new Set(myCheckins.map(c => c.venue_id))];

    const { data: others } = await supabase
      .from('venue_checkins')
      .select('user_id, venue_id')
      .in('venue_id', venueIds)
      .neq('user_id', userId)
      .gte('created_at', since);

    if (!others?.length) return { data: [] };

    const venueByUser = new Map<string, string>();
    for (const o of others) {
      if (!venueByUser.has(o.user_id)) venueByUser.set(o.user_id, o.venue_id);
    }
    const otherUserIds = [...venueByUser.keys()];

    const { data: venueRows } = await supabase
      .from('venues')
      .select('id, name')
      .in('id', venueIds);
    const venueNameMap = new Map((venueRows ?? []).map((v: any) => [v.id, v.name]));

    const { data: myConns } = await supabase
      .from('connections')
      .select('connection_user_id')
      .eq('user_id', userId);
    const myConnSet = new Set((myConns ?? []).map((c: any) => c.connection_user_id));

    const raw = await Promise.all(
      otherUserIds.map(async (uid): Promise<SbMissedConnection | null> => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, age')
          .eq('user_id', uid)
          .eq('profile_status', 'active')
          .maybeSingle();

        if (!profile) return null;

        const { data: photo } = await supabase
          .from('profile_photos')
          .select('storage_path')
          .eq('user_id', uid)
          .eq('slot_index', 1)
          .maybeSingle();

        const { data: theirConns } = await supabase
          .from('connections')
          .select('connection_user_id')
          .eq('user_id', uid);
        const theirConnSet = new Set((theirConns ?? []).map((c: any) => c.connection_user_id));
        let mutuals = 0;
        for (const cid of myConnSet) {
          if (theirConnSet.has(cid)) mutuals++;
        }

        const vId = venueByUser.get(uid)!;

        return {
          user_id: uid,
          first_name: profile.first_name ?? '',
          age: profile.age ?? 0,
          photo_url: photo?.storage_path ? photoUrl(photo.storage_path) : null,
          venue_name: venueNameMap.get(vId) ?? '',
          mutuals,
        };
      }),
    );

    return { data: raw.filter((r): r is SbMissedConnection => r !== null) };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}
