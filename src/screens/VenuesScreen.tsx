import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, layout } from '../theme';
import { useStore } from '../store';
import type { Venue } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = layout.screenHeight * 0.44;
const HIGHLIGHT_CARD_WIDTH = SCREEN_WIDTH * 0.6;

const MANHATTAN_REGION = {
  latitude: 40.735,
  longitude: -73.995,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

type Category = 'all' | Venue['category'];

const CATEGORIES: { key: Category; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'restaurant', label: 'Restaurants', icon: 'restaurant-outline' },
  { key: 'bar', label: 'Bars', icon: 'wine-outline' },
  { key: 'club', label: 'Clubs', icon: 'musical-notes-outline' },
  { key: 'activity', label: 'Activities', icon: 'basketball-outline' },
  { key: 'coffee', label: 'Coffee', icon: 'cafe-outline' },
  { key: 'dessert', label: 'Dessert', icon: 'ice-cream-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const TAG_FILTERS = [
  'first date',
  'drinks',
  'activity',
  'bottomless',
  'group outing',
  'nightlife',
  'views',
  'upscale',
];

const CATEGORY_COLORS: Record<Venue['category'], string> = {
  restaurant: '#FF8A65',
  bar: colors.purple,
  club: colors.pink,
  activity: colors.success,
  coffee: '#A1887F',
  dessert: '#F48FB1',
  other: '#90A4AE',
};

const CATEGORY_ICONS: Record<Venue['category'], string> = {
  restaurant: 'restaurant',
  bar: 'wine',
  club: 'musical-notes',
  activity: 'basketball',
  coffee: 'cafe',
  dessert: 'ice-cream',
  other: 'ellipse',
};

const FORM_TAGS = [
  'first date', 'drinks', 'activity', 'bottomless', 'group outing',
  'late night', 'cozy', 'upscale', 'budget',
];

const ADD_CATEGORIES: { key: Venue['category']; label: string; icon: string }[] = [
  { key: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline' },
  { key: 'bar', label: 'Bar', icon: 'wine-outline' },
  { key: 'club', label: 'Club', icon: 'musical-notes-outline' },
  { key: 'activity', label: 'Activity', icon: 'basketball-outline' },
  { key: 'coffee', label: 'Coffee', icon: 'cafe-outline' },
  { key: 'dessert', label: 'Dessert', icon: 'ice-cream-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const DEFAULT_PHOTOS: Record<string, string> = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  bar: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400',
  club: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400',
  activity: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
  other: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
};

const INITIAL_FORM = {
  name: '',
  category: '' as Venue['category'] | '',
  neighborhood: 'Manhattan, NYC',
  address: '',
  tags: [] as string[],
  rating: 0,
  deal: '',
  notes: '',
};

function StarRating({ rating }: { rating: number }) {
  const stars: React.ReactNode[] = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Ionicons key={i} name="star" size={13} color="#FFB800" />);
    } else if (i - rating < 1) {
      stars.push(<Ionicons key={i} name="star-half" size={13} color="#FFB800" />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={13} color={colors.gray300} />);
    }
  }
  return (
    <View style={styles.starRow}>
      {stars}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

type ChatBubble = { role: 'system' | 'user' | 'assistant'; text: string; plan?: PlanStop[] };
type PlanStop = { label: string; venue: Venue; why: string; time: string };

const VIBE_KEYWORDS: Record<string, string[]> = {
  romantic: ['cozy', 'first date', 'intimate', 'dinner', 'views', 'romantic'],
  cozy: ['cozy', 'first date', 'coffee'],
  upscale: ['upscale', 'views', 'dinner'],
  casual: ['first date', 'casual', 'fun', 'coffee'],
  fun: ['activity', 'fun', 'group outing'],
  active: ['activity', 'sporty', 'fun'],
  nightlife: ['nightlife', 'dancing', 'drinks', 'late night', 'club'],
  loud: ['nightlife', 'dancing', 'group outing'],
  chill: ['cozy', 'coffee', 'casual'],
  drinks: ['drinks', 'first date', 'cozy'],
  korean: ['korean', 'soju', 'karaoke', 'late night', 'drinks'],
  ktown: ['korean', 'soju', 'karaoke', 'late night', 'drinks'],
  koreatown: ['korean', 'soju', 'karaoke', 'late night', 'drinks'],
  soju: ['korean', 'soju', 'late night', 'drinks'],
  kbbq: ['korean', 'late night', 'group outing'],
  karaoke: ['korean', 'karaoke', 'fun', 'late night', 'group outing'],
  clubbing: ['club', 'dancing', 'nightlife', 'late night'],
  party: ['club', 'dancing', 'nightlife', 'group outing', 'late night'],
  'turn up': ['club', 'dancing', 'nightlife', 'late night'],
  dance: ['club', 'dancing', 'nightlife'],
  'bar hop': ['drinks', 'late night', 'group outing'],
  'central park': ['outdoor', 'scenic', 'daytime', 'romantic', 'activity'],
  park: ['outdoor', 'scenic', 'daytime', 'activity', 'casual'],
  picnic: ['outdoor', 'casual', 'romantic', 'budget', 'daytime'],
  walk: ['outdoor', 'scenic', 'casual', 'daytime'],
  outdoors: ['outdoor', 'scenic', 'daytime', 'activity'],
  'day date': ['daytime', 'casual', 'first date', 'outdoor', 'coffee'],
};

type PlanShape = 'nightlife' | 'park' | 'default';

function detectPlanShape(vibe: string): PlanShape {
  const l = vibe.toLowerCase();
  if (/club|party|turn up|ktown|koreatown|soju|karaoke|late night|dancing|nightlife/.test(l)) return 'nightlife';
  if (/park|picnic|walk|outdoor|day date|stroll/.test(l)) return 'park';
  return 'default';
}

function generatePlan(vibe: string, venues: Venue[]): { stops: PlanStop[]; backup: PlanStop } {
  const lower = vibe.toLowerCase();
  const matchedTags = new Set<string>();
  for (const [kw, tags] of Object.entries(VIBE_KEYWORDS)) {
    if (lower.includes(kw)) tags.forEach(t => matchedTags.add(t));
  }
  if (matchedTags.size === 0) {
    ['first date', 'drinks', 'dinner', 'cozy'].forEach(t => matchedTags.add(t));
  }

  const scored = venues.map(v => {
    let score = v.tags.filter(t => matchedTags.has(t)).length;
    if (v.deal) score += 0.5;
    score += v.rating / 10;
    return { venue: v, score };
  }).sort((a, b) => b.score - a.score);

  const pick = (cats: Venue['category'][], exclude: string[]): Venue => {
    const match = scored.find(s => cats.includes(s.venue.category) && !exclude.includes(s.venue.id));
    return match?.venue || scored.find(s => !exclude.includes(s.venue.id))!.venue;
  };

  const shape = detectPlanShape(vibe);
  const usedIds: string[] = [];

  let stops: PlanStop[];
  if (shape === 'nightlife') {
    const dinner = pick(['restaurant'], usedIds); usedIds.push(dinner.id);
    const bar = pick(['bar'], usedIds); usedIds.push(bar.id);
    const club = pick(['club'], usedIds); usedIds.push(club.id);
    stops = [
      { label: 'Dinner', venue: dinner, why: '', time: '8:00 PM' },
      { label: 'Drinks', venue: bar, why: '', time: '10:00 PM' },
      { label: 'Late night', venue: club, why: '', time: '11:30 PM' },
    ];
  } else if (shape === 'park') {
    const coffee = pick(['coffee'], usedIds); usedIds.push(coffee.id);
    const activity = pick(['activity'], usedIds); usedIds.push(activity.id);
    const after = pick(['dessert', 'restaurant'], usedIds); usedIds.push(after.id);
    stops = [
      { label: 'Meet-up', venue: coffee, why: '', time: '11:00 AM' },
      { label: 'Main date', venue: activity, why: '', time: '12:30 PM' },
      { label: 'After', venue: after, why: '', time: '2:30 PM' },
    ];
  } else {
    const preGame = pick(['bar', 'coffee'], usedIds); usedIds.push(preGame.id);
    const main = pick(['restaurant'], usedIds); usedIds.push(main.id);
    const after = pick(['dessert', 'activity', 'club'], usedIds); usedIds.push(after.id);
    stops = [
      { label: 'Pre-game', venue: preGame, why: '', time: '7:00 PM' },
      { label: 'Main date', venue: main, why: '', time: '8:15 PM' },
      { label: 'After', venue: after, why: '', time: '10:00 PM' },
    ];
  }

  const backup = pick(['restaurant', 'bar', 'activity'], usedIds);

  const whyFit = (v: Venue) => {
    const common = v.tags.filter(t => matchedTags.has(t));
    if (common.length > 0) return `Matches your "${common[0]}" vibe — ${v.rating}★ rated.`;
    return `Highly rated at ${v.rating}★ with a great atmosphere.`;
  };
  stops = stops.map(s => ({ ...s, why: whyFit(s.venue) }));

  return {
    stops,
    backup: { label: 'Backup', venue: backup, why: whyFit(backup), time: '' },
  };
}

export const VenuesScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const { venues, savedVenues, saveVenue, unsaveVenue, showToast, addVenue, savePlan } = useStore();
  const supabaseUserId = useStore(s => s.supabaseUserId);
  const loadVenues = useStore(s => s.loadVenues);
  const venuesLoading = useStore(s => s.venuesLoading);
  const sbRate = useStore(s => s.sbRate);
  const sbCheckIn = useStore(s => s.sbCheckIn);

  useEffect(() => {
    if (supabaseUserId) { loadVenues(); }
  }, [supabaseUserId]);

  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [detailVenue, setDetailVenue] = useState<Venue | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm, setAddForm] = useState(INITIAL_FORM);

  const [plannerVisible, setPlannerVisible] = useState(false);
  const [plannerChat, setPlannerChat] = useState<ChatBubble[]>([
    { role: 'system', text: 'Use AI to put together your date. Describe the vibe.' },
  ]);
  const [vibeInput, setVibeInput] = useState('');
  const [currentPlan, setCurrentPlan] = useState<{ stops: PlanStop[]; backup: PlanStop } | null>(null);

  const updateForm = useCallback((key: string, value: any) => {
    setAddForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleFormTag = useCallback((tag: string) => {
    setAddForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const handleAddVenue = useCallback(() => {
    if (!addForm.name.trim() || !addForm.category || addForm.rating === 0) {
      showToast('Please fill in name, category, and rating');
      return;
    }

    const newVenue: Venue = {
      id: `user_${Date.now()}`,
      name: addForm.name.trim(),
      category: addForm.category as Venue['category'],
      latitude: 40.735 + (Math.random() - 0.5) * 0.03,
      longitude: -73.995 + (Math.random() - 0.5) * 0.03,
      rating: addForm.rating,
      deal: addForm.deal.trim(),
      dealValue: addForm.deal.trim() ? 'Community' : '',
      tags: addForm.tags,
      description: addForm.notes.trim() || `${addForm.name.trim()} — added by the community.`,
      photo: DEFAULT_PHOTOS[addForm.category] || DEFAULT_PHOTOS.other,
      address: addForm.address.trim() || addForm.neighborhood,
      addedBy: 'you',
      notes: addForm.notes.trim(),
    };

    addVenue(newVenue);
    setAddModalVisible(false);
    setAddForm(INITIAL_FORM);
    showToast(`${newVenue.name} added!`);
  }, [addForm, addVenue, showToast]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  }, []);

  const filteredVenues = useMemo(() => {
    let result = venues;
    if (selectedCategory !== 'all') {
      result = result.filter(v => v.category === selectedCategory);
    }
    if (activeTags.length > 0) {
      result = result.filter(v => activeTags.some(tag => v.tags.includes(tag)));
    }
    return result;
  }, [venues, selectedCategory, activeTags]);

  const dealsVenues = useMemo(
    () => venues.filter(v => v.deal && !v.addedBy),
    [venues],
  );

  const communityDeals = useMemo(
    () => venues.filter(v => v.deal && v.addedBy),
    [venues],
  );

  const focusVenue = useCallback(
    (venue: Venue) => {
      mapRef.current?.animateToRegion(
        {
          latitude: venue.latitude,
          longitude: venue.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        600,
      );
      setDetailVenue(venue);
    },
    [],
  );

  const isSaved = useCallback(
    (id: string) => savedVenues.includes(id),
    [savedVenues],
  );

  const toggleSave = useCallback(
    (id: string) => {
      if (savedVenues.includes(id)) {
        unsaveVenue(id);
        showToast('Removed from saved');
      } else {
        saveVenue(id);
        showToast('Saved to your plan!');
      }
    },
    [savedVenues, saveVenue, unsaveVenue, showToast],
  );

  const isFormValid = addForm.name.trim() && addForm.category && addForm.rating > 0;

  const handleSendVibe = useCallback(() => {
    const text = vibeInput.trim();
    if (!text) return;
    setVibeInput('');
    const plan = generatePlan(text, venues);
    setCurrentPlan(plan);

    const allStops = [...plan.stops, plan.backup];
    const planText = allStops.map(s =>
      `${s.label}: ${s.venue.name}` +
      (s.time ? ` — ${s.time}` : '') +
      `\n${s.venue.address}` +
      `\n${s.why}` +
      (s.venue.deal ? `\nDeal: ${s.venue.deal}` : ''),
    ).join('\n\n');

    setPlannerChat(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: `Your IRL Date Plan\n\n${planText}`, plan: allStops },
    ]);
  }, [vibeInput, venues]);

  const handlePinOnMap = useCallback(() => {
    if (!currentPlan) return;
    const firstVenue = currentPlan.stops[0].venue;
    setPlannerVisible(false);
    mapRef.current?.animateToRegion({
      latitude: firstVenue.latitude,
      longitude: firstVenue.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }, 600);
    setDetailVenue(firstVenue);
  }, [currentPlan]);

  const handleSavePlan = useCallback(() => {
    if (!currentPlan) return;
    const venueIds = currentPlan.stops.map(s => s.venue.id);
    const vibeText = plannerChat.find(m => m.role === 'user')?.text || '';
    savePlan(vibeText, venueIds);
  }, [currentPlan, plannerChat, savePlan]);

  const openPlanner = useCallback(() => {
    setPlannerChat([{ role: 'system', text: 'Use AI to put together your date. Describe the vibe.' }]);
    setCurrentPlan(null);
    setVibeInput('');
    setPlannerVisible(true);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={openPlanner}
            >
              <Ionicons name="search" size={20} color={colors.purple} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setAddModalVisible(true)}
            >
              <Ionicons name="add" size={22} color={colors.black} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="bookmark-outline" size={22} color={colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {venuesLoading && venues.length === 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.purple} />
            <Text style={[styles.emptyText, { marginTop: spacing.md }]}>Loading venues...</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Map */}
          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={MANHATTAN_REGION}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {venues.map(venue => (
                <Marker
                  key={venue.id}
                  coordinate={{
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                  }}
                  onPress={() => focusVenue(venue)}
                >
                  <View style={[styles.markerDot, { backgroundColor: CATEGORY_COLORS[venue.category] || '#90A4AE' }]}>
                    <Ionicons
                      name={(CATEGORY_ICONS[venue.category] || 'ellipse') as any}
                      size={12}
                      color={colors.white}
                    />
                  </View>
                </Marker>
              ))}
            </MapView>

            <View style={styles.mapFade} pointerEvents="none" />
          </View>

          {/* Highlights carousel */}
          <View style={styles.highlightsSection}>
            <Text style={styles.sectionLabel}>Today's Deals</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightsScroll}
              decelerationRate="fast"
              snapToInterval={HIGHLIGHT_CARD_WIDTH + spacing.md}
            >
              {dealsVenues.map(venue => (
                <TouchableOpacity
                  key={venue.id}
                  style={styles.highlightCard}
                  activeOpacity={0.85}
                  onPress={() => focusVenue(venue)}
                >
                  <Image source={{ uri: venue.photo }} style={styles.highlightPhoto} />
                  <View style={styles.highlightInfo}>
                    <Text style={styles.highlightName} numberOfLines={1}>
                      {venue.name}
                    </Text>
                    <Text style={styles.highlightDeal} numberOfLines={2}>
                      {venue.deal}
                    </Text>
                    <View style={styles.highlightBadge}>
                      <Ionicons name="pricetag" size={11} color={colors.white} />
                      <Text style={styles.highlightBadgeText}>{venue.dealValue}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Community Adds carousel */}
          {communityDeals.length > 0 && (
            <View style={styles.highlightsSection}>
              <Text style={styles.sectionLabel}>Community Adds</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.highlightsScroll}
                decelerationRate="fast"
                snapToInterval={HIGHLIGHT_CARD_WIDTH + spacing.md}
              >
                {communityDeals.map(venue => (
                  <TouchableOpacity
                    key={venue.id}
                    style={styles.highlightCard}
                    activeOpacity={0.85}
                    onPress={() => focusVenue(venue)}
                  >
                    <Image source={{ uri: venue.photo }} style={styles.highlightPhoto} />
                    <View style={styles.highlightInfo}>
                      <Text style={styles.highlightName} numberOfLines={1}>
                        {venue.name}
                      </Text>
                      <Text style={styles.highlightDeal} numberOfLines={2}>
                        {venue.deal}
                      </Text>
                      <View style={[styles.highlightBadge, { backgroundColor: colors.success }]}>
                        <Ionicons name="person" size={11} color={colors.white} />
                        <Text style={styles.highlightBadgeText}>Community</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Tag search */}
          <View style={styles.tagSection}>
            <Text style={styles.sectionLabel}>Search by Vibe</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {TAG_FILTERS.map(tag => {
                const active = activeTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagChipLabel, active && styles.tagChipLabelActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Category filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon}
                    size={15}
                    color={active ? colors.white : colors.gray600}
                    style={{ marginRight: spacing.xs }}
                  />
                  <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Venue list */}
          <View style={styles.listSection}>
            {filteredVenues.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name={venues.length === 0 ? 'location-outline' : 'search-outline'} size={36} color={colors.gray400} />
                <Text style={styles.emptyText}>
                  {venues.length === 0
                    ? 'No venues yet — run seed script in Supabase'
                    : 'No venues match your filters'}
                </Text>
              </View>
            ) : (
              filteredVenues.map(venue => (
                <TouchableOpacity
                  key={venue.id}
                  style={styles.venueCard}
                  activeOpacity={0.8}
                  onPress={() => focusVenue(venue)}
                >
                  <Image source={{ uri: venue.photo }} style={styles.venueThumb} />
                  <View style={styles.venueInfo}>
                    <View style={styles.venueTopRow}>
                      <Text style={styles.venueName} numberOfLines={1}>
                        {venue.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleSave(venue.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={isSaved(venue.id) ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={isSaved(venue.id) ? colors.pink : colors.gray500}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.venueMetaRow}>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: (CATEGORY_COLORS[venue.category] || '#90A4AE') + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryBadgeText,
                            { color: CATEGORY_COLORS[venue.category] || '#90A4AE' },
                          ]}
                        >
                          {venue.category}
                        </Text>
                      </View>
                      <StarRating rating={venue.rating} />
                    </View>

                    {venue.deal ? (
                      <Text style={styles.venueDeal} numberOfLines={1}>
                        <Ionicons name="pricetag-outline" size={12} color={colors.purple} />{' '}
                        {venue.deal}
                      </Text>
                    ) : venue.addedBy ? (
                      <View style={styles.addedByBadge}>
                        <Ionicons name="person-outline" size={11} color={colors.success} />
                        <Text style={styles.addedByText}>Added by you</Text>
                      </View>
                    ) : null}

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.venueTagsScroll}
                    >
                      {venue.tags.map(tag => (
                        <View key={tag} style={styles.venueTag}>
                          <Text style={styles.venueTagText}>{tag}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Venue detail modal */}
        <Modal
          visible={detailVenue !== null}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailVenue(null)}
        >
          {detailVenue && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandleRow}>
                  <View style={styles.modalHandle} />
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalContent}
                >
                  <Image source={{ uri: detailVenue.photo }} style={styles.modalPhoto} />

                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalName}>{detailVenue.name}</Text>
                      <Text style={styles.modalAddress}>
                        <Ionicons name="location-outline" size={13} color={colors.gray500} />{' '}
                        {detailVenue.address}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setDetailVenue(null)}
                    >
                      <Ionicons name="close" size={20} color={colors.gray600} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalMetaRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: (CATEGORY_COLORS[detailVenue.category] || '#90A4AE') + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryBadgeText,
                          { color: CATEGORY_COLORS[detailVenue.category] || '#90A4AE' },
                        ]}
                      >
                        {detailVenue.category}
                      </Text>
                    </View>
                    <StarRating rating={detailVenue.rating} />
                    {detailVenue.addedBy && (
                      <View style={styles.addedByBadge}>
                        <Ionicons name="person-outline" size={11} color={colors.success} />
                        <Text style={styles.addedByText}>Added by you</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.modalDescription}>{detailVenue.description}</Text>

                  {detailVenue.deal ? (
                    <View style={styles.dealCard}>
                      <View style={styles.dealHeader}>
                        <Ionicons name="pricetag" size={16} color={colors.purple} />
                        <Text style={styles.dealTitle}>
                          {detailVenue.addedBy ? 'Community Deal' : 'Exclusive Deal'}
                        </Text>
                        <View style={styles.dealValueBadge}>
                          <Text style={styles.dealValueText}>{detailVenue.dealValue}</Text>
                        </View>
                      </View>
                      <Text style={styles.dealText}>{detailVenue.deal}</Text>
                      <TouchableOpacity
                        style={styles.unlockButton}
                        activeOpacity={0.8}
                        onPress={() => {
                          showToast('Deal unlocked! Show this at the venue');
                        }}
                      >
                        <Ionicons name="lock-open-outline" size={16} color={colors.white} />
                        <Text style={styles.unlockButtonText}>Unlock Deal</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={styles.modalTagsWrap}>
                    {detailVenue.tags.map(tag => (
                      <View key={tag} style={styles.modalTag}>
                        <Text style={styles.modalTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalActions}>
                    {!!supabaseUserId && (
                      <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.success }]}
                        activeOpacity={0.8}
                        onPress={() => { sbCheckIn(detailVenue.id); }}
                      >
                        <Ionicons name="location" size={18} color={colors.white} />
                        <Text style={[styles.saveButtonText, { color: colors.white }]}>Check In</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        isSaved(detailVenue.id) && styles.saveButtonActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => toggleSave(detailVenue.id)}
                    >
                      <Ionicons
                        name={isSaved(detailVenue.id) ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={isSaved(detailVenue.id) ? colors.white : colors.black}
                      />
                      <Text
                        style={[
                          styles.saveButtonText,
                          isSaved(detailVenue.id) && styles.saveButtonTextActive,
                        ]}
                      >
                        {isSaved(detailVenue.id) ? 'Saved' : 'Add to Plan'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </Modal>

        {/* AI Date Planner modal */}
        <Modal
          visible={plannerVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPlannerVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHandleRow}>
                <View style={styles.modalHandle} />
              </View>
              <View style={styles.plannerHeader}>
                <Ionicons name="sparkles" size={20} color={colors.purple} />
                <Text style={styles.plannerTitle}>AI Date Planner</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setPlannerVisible(false)}>
                  <Ionicons name="close" size={20} color={colors.gray600} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.plannerScroll}
                contentContainerStyle={styles.plannerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {plannerChat.map((msg, i) => (
                  <View
                    key={i}
                    style={[
                      styles.chatBubble,
                      msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                    ]}
                  >
                    <Text style={[styles.chatBubbleText, msg.role === 'user' && styles.chatBubbleTextUser]}>
                      {msg.text}
                    </Text>
                  </View>
                ))}

                {currentPlan && (
                  <View style={styles.planActions}>
                    <TouchableOpacity style={styles.planActionBtn} onPress={handlePinOnMap} activeOpacity={0.7}>
                      <Ionicons name="location" size={16} color={colors.white} />
                      <Text style={styles.planActionText}>Pin on map</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.planActionBtnOutline} onPress={handleSavePlan} activeOpacity={0.7}>
                      <Ionicons name="bookmark" size={16} color={colors.purple} />
                      <Text style={styles.planActionTextOutline}>Save plan</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              <View style={styles.plannerInputRow}>
                <TextInput
                  style={styles.plannerInput}
                  value={vibeInput}
                  onChangeText={setVibeInput}
                  placeholder="e.g. romantic dinner in the Village..."
                  placeholderTextColor={colors.gray400}
                  returnKeyType="send"
                  onSubmitEditing={handleSendVibe}
                />
                <TouchableOpacity
                  style={[styles.plannerSendBtn, !vibeInput.trim() && { opacity: 0.4 }]}
                  onPress={handleSendVibe}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-up" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add Venue modal */}
        <Modal
          visible={addModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setAddModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHandleRow}>
                <View style={styles.modalHandle} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.addFormContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Form header */}
                <View style={styles.addFormHeader}>
                  <Text style={styles.addFormTitle}>Add a Venue</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setAddModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} color={colors.gray600} />
                  </TouchableOpacity>
                </View>

                {/* Name */}
                <Text style={styles.addLabel}>Venue Name <Text style={styles.addRequired}>*</Text></Text>
                <TextInput
                  style={styles.addInput}
                  value={addForm.name}
                  onChangeText={v => updateForm('name', v)}
                  placeholder="e.g. Joe's Coffee"
                  placeholderTextColor={colors.gray400}
                />

                {/* Category */}
                <Text style={styles.addLabel}>Category <Text style={styles.addRequired}>*</Text></Text>
                <View style={styles.addChipsWrap}>
                  {ADD_CATEGORIES.map(cat => {
                    const active = addForm.category === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[styles.addChip, active && styles.addChipActive]}
                        onPress={() => updateForm('category', cat.key)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={14}
                          color={active ? colors.white : colors.gray600}
                        />
                        <Text style={[styles.addChipText, active && styles.addChipTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Neighborhood */}
                <Text style={styles.addLabel}>Neighborhood</Text>
                <TextInput
                  style={styles.addInput}
                  value={addForm.neighborhood}
                  onChangeText={v => updateForm('neighborhood', v)}
                  placeholder="Manhattan, NYC"
                  placeholderTextColor={colors.gray400}
                />

                {/* Address */}
                <Text style={styles.addLabel}>Address</Text>
                <TextInput
                  style={styles.addInput}
                  value={addForm.address}
                  onChangeText={v => updateForm('address', v)}
                  placeholder="123 Main St"
                  placeholderTextColor={colors.gray400}
                />

                {/* Rating */}
                <Text style={styles.addLabel}>Rating <Text style={styles.addRequired}>*</Text></Text>
                <View style={styles.addStarRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => updateForm('rating', n)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name={n <= addForm.rating ? 'star' : 'star-outline'}
                        size={32}
                        color={n <= addForm.rating ? '#FFB800' : colors.gray300}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tags */}
                <Text style={styles.addLabel}>Tags</Text>
                <View style={styles.addChipsWrap}>
                  {FORM_TAGS.map(tag => {
                    const active = addForm.tags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.addChip, active && styles.addChipActive]}
                        onPress={() => toggleFormTag(tag)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.addChipText, active && styles.addChipTextActive]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Deal */}
                <Text style={styles.addLabel}>Deal <Text style={styles.addOptional}>(optional)</Text></Text>
                <TextInput
                  style={styles.addInput}
                  value={addForm.deal}
                  onChangeText={v => updateForm('deal', v)}
                  placeholder="e.g. $10 off dinner, 2-for-1 cocktails"
                  placeholderTextColor={colors.gray400}
                />

                {/* Notes */}
                <Text style={styles.addLabel}>Notes <Text style={styles.addOptional}>(optional)</Text></Text>
                <TextInput
                  style={[styles.addInput, styles.addInputMultiline]}
                  value={addForm.notes}
                  onChangeText={v => updateForm('notes', v)}
                  placeholder="What makes this place special?"
                  placeholderTextColor={colors.gray400}
                  multiline
                />

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
                  onPress={handleAddVenue}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.white} />
                  <Text style={styles.submitButtonText}>Add Venue</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.title1,
    color: colors.black,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  /* ---------- Map ---------- */
  mapWrapper: {
    height: MAP_HEIGHT,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: colors.background,
    opacity: 0.5,
  },
  markerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.white,
    ...shadows.sm,
  },

  /* ---------- Highlights ---------- */
  highlightsSection: {
    marginTop: -spacing.xxxl,
    zIndex: 10,
    paddingBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.headline,
    color: colors.black,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  highlightsScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  highlightCard: {
    width: HIGHLIGHT_CARD_WIDTH,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.md,
  },
  highlightPhoto: {
    width: 80,
    height: 90,
    backgroundColor: colors.gray200,
  },
  highlightInfo: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  highlightName: {
    ...typography.footnote,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 2,
  },
  highlightDeal: {
    ...typography.caption2,
    color: colors.gray600,
    marginBottom: spacing.xs,
    lineHeight: 15,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.purple,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  highlightBadgeText: {
    ...typography.caption2,
    fontWeight: '700',
    color: colors.white,
  },

  /* ---------- Tag search ---------- */
  tagSection: {
    paddingBottom: spacing.md,
  },
  chipsRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  tagChipActive: {
    backgroundColor: colors.pinkLight,
    borderColor: colors.pink,
  },
  tagChipLabel: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.gray600,
  },
  tagChipLabelActive: {
    color: colors.pinkDark,
  },

  /* ---------- Category filter ---------- */
  categoryRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  categoryLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.gray600,
  },
  categoryLabelActive: {
    color: colors.white,
  },

  /* ---------- Venue list ---------- */
  listSection: {
    paddingHorizontal: spacing.xl,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.subhead,
    color: colors.gray500,
  },
  venueCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  venueThumb: {
    width: 100,
    height: 120,
    backgroundColor: colors.gray200,
  },
  venueInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  venueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  venueName: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.black,
    flex: 1,
    marginRight: spacing.sm,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  categoryBadgeText: {
    ...typography.caption2,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  ratingText: {
    ...typography.caption2,
    fontWeight: '600',
    color: colors.gray600,
    marginLeft: 3,
  },
  venueDeal: {
    ...typography.caption1,
    color: colors.purple,
    fontWeight: '500',
    marginBottom: 4,
  },
  addedByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  addedByText: {
    ...typography.caption2,
    color: colors.success,
    fontWeight: '600',
  },
  venueTagsScroll: {
    marginTop: 2,
  },
  venueTag: {
    backgroundColor: colors.gray100,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
  },
  venueTagText: {
    ...typography.caption2,
    color: colors.gray600,
  },

  /* ---------- Detail Modal ---------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    maxHeight: layout.screenHeight * 0.88,
  },
  modalHandleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  modalContent: {
    paddingBottom: spacing.huge,
  },
  modalPhoto: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray200,
  },
  modalHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'flex-start',
  },
  modalName: {
    ...typography.title2,
    color: colors.black,
  },
  modalAddress: {
    ...typography.footnote,
    color: colors.gray500,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  modalDescription: {
    ...typography.subhead,
    color: colors.gray700,
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  dealCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.purpleLight + '40',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.purpleLight,
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dealTitle: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.black,
    flex: 1,
  },
  dealValueBadge: {
    backgroundColor: colors.purple,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dealValueText: {
    ...typography.caption2,
    fontWeight: '700',
    color: colors.white,
  },
  dealText: {
    ...typography.footnote,
    color: colors.gray700,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  unlockButtonText: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.white,
  },
  modalTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  modalTag: {
    backgroundColor: colors.gray100,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  modalTagText: {
    ...typography.caption1,
    color: colors.gray600,
    fontWeight: '500',
  },
  modalActions: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    gap: spacing.sm,
  },
  saveButtonActive: {
    backgroundColor: colors.pink,
    borderColor: colors.pink,
  },
  saveButtonText: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.black,
  },
  saveButtonTextActive: {
    color: colors.white,
  },

  /* ---------- Add Venue Form ---------- */
  addFormContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  addFormTitle: {
    ...typography.title2,
    color: colors.black,
  },
  addLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  addRequired: {
    color: colors.pink,
    textTransform: 'none',
    letterSpacing: 0,
  },
  addOptional: {
    color: colors.gray400,
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
  },
  addInput: {
    backgroundColor: colors.gray50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.black,
  },
  addInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  addChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  addChipActive: {
    backgroundColor: colors.pink,
    borderColor: colors.pink,
  },
  addChipText: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.gray600,
  },
  addChipTextActive: {
    color: colors.white,
  },
  addStarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    ...typography.headline,
    color: colors.white,
  },

  /* ---------- AI Planner ---------- */
  plannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  plannerTitle: {
    ...typography.title3,
    color: colors.black,
    flex: 1,
  },
  plannerScroll: {
    flex: 1,
  },
  plannerScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  chatBubble: {
    maxWidth: '85%',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chatBubbleAssistant: {
    backgroundColor: colors.gray100,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: radii.xs,
  },
  chatBubbleUser: {
    backgroundColor: colors.pink,
    alignSelf: 'flex-end',
    borderBottomRightRadius: radii.xs,
  },
  chatBubbleText: {
    ...typography.subhead,
    color: colors.black,
    lineHeight: 21,
  },
  chatBubbleTextUser: {
    color: colors.white,
  },
  planActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  planActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.purple,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  planActionText: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.white,
  },
  planActionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.purple,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  planActionTextOutline: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.purple,
  },
  plannerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    gap: spacing.sm,
  },
  plannerInput: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  plannerSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
