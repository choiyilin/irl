import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import { ProfilePhoto } from '../components/ProfilePhoto';
import { PROFILE_IMAGES } from '../data/profileImages';
import { uploadPhoto } from '../lib/onboarding';

const GRID_GAP = spacing.sm;
const GRID_COLS = 3;
const SCREEN_W = Dimensions.get('window').width;
const CARD_W = (SCREEN_W - spacing.lg * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const CARD_H = CARD_W * 1.35;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { profileId } = route.params as { profileId: string };
  const supabaseUserId = useStore(s => s.supabaseUserId);
  const currentUserId = useStore(s => s.currentUserId);
  const myProfile = useStore(s => s.myProfile);
  const loadMyProfile = useStore(s => s.loadMyProfile);
  const isSupabaseUser = !!supabaseUserId && profileId === currentUserId;
  const profile = useStore(s => isSupabaseUser ? (s.myProfile ?? s.getProfileById(profileId)) : s.getProfileById(profileId));
  const updateProfile = useStore(s => s.updateProfile);
  const showToast = useStore(s => s.showToast);

  const [photos, setPhotos] = useState<any[]>(() => {
    if (isSupabaseUser && myProfile?.photos?.length) {
      return [...myProfile.photos];
    }
    return profile?.photos?.slice(0, 6) ?? [];
  });

  const [uploading, setUploading] = useState<number | null>(null);

  useEffect(() => {
    if (isSupabaseUser && myProfile?.photos?.length) {
      setPhotos([...myProfile.photos]);
    }
  }, [isSupabaseUser, myProfile?.photos]);

  const photoPool = useMemo(() => {
    if (isSupabaseUser) return [];
    const pool = PROFILE_IMAGES[profileId] || [];
    const allPhotos: any[] = [];
    Object.entries(PROFILE_IMAGES).forEach(([id, imgs]) => {
      if (id !== profileId) allPhotos.push(...imgs);
    });
    return [...pool, ...allPhotos];
  }, [profileId, isSupabaseUser]);

  const [photoOffsets, setPhotoOffsets] = useState([0, 1, 2, 3, 4, 5]);
  const [prompts, setPrompts] = useState(
    profile?.prompts.map(p => ({ ...p })) || [],
  );
  const [job, setJob] = useState(profile?.job || '');
  const [school, setSchool] = useState(profile?.school || '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || '');

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSwapPhoto = (slot: number) => {
    if (isSupabaseUser) {
      handlePickPhoto(slot);
      return;
    }
    setPhotoOffsets(prev => {
      const next = [...prev];
      next[slot] = (next[slot] + 1) % photoPool.length;
      return next;
    });
  };

  const handlePickPhoto = async (slot: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const uri = result.assets[0].uri;
    setUploading(slot);
    const { error } = await uploadPhoto(slot + 1, uri);
    setUploading(null);

    if (error) {
      Alert.alert('Upload Error', error);
      return;
    }

    setPhotos(prev => {
      const copy = [...prev];
      copy[slot] = uri;
      return copy;
    });

    loadMyProfile();
    showToast(`Photo ${slot + 1} updated`);
  };

  const handlePromptChange = (index: number, field: 'question' | 'answer', value: string) => {
    setPrompts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = () => {
    if (isSupabaseUser) {
      updateProfile(profileId, { prompts, job, school, neighborhood });
    } else {
      const newPhotos = photoOffsets.map(offset => photoPool[offset % photoPool.length]);
      updateProfile(profileId, { photos: newPhotos, prompts, job, school, neighborhood });
    }
    showToast('Profile updated');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.6}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Photos</Text>
        <View style={styles.photoGrid}>
          {(isSupabaseUser ? photos : photoOffsets).map((item, i) => (
            <View key={i} style={styles.photoCard}>
              <ProfilePhoto
                photo={isSupabaseUser ? photos[i] : photoPool[item % photoPool.length]}
                height={CARD_H}
                borderRadius={radii.md}
              />
              {uploading === i && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
              <TouchableOpacity
                style={styles.swapBtn}
                onPress={() => handleSwapPhoto(i)}
                activeOpacity={0.7}
                disabled={uploading !== null}
              >
                <Ionicons name={isSupabaseUser ? 'camera' : 'swap-horizontal'} size={14} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.photoIndex}>
                <Text style={styles.photoIndexText}>{i + 1}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Prompts</Text>
        {prompts.map((prompt, i) => (
          <View key={i} style={styles.promptEditCard}>
            <TextInput
              style={styles.promptQuestionInput}
              value={prompt.question}
              onChangeText={v => handlePromptChange(i, 'question', v)}
              placeholder="Prompt question..."
              placeholderTextColor={colors.gray400}
            />
            <TextInput
              style={styles.promptAnswerInput}
              value={prompt.answer}
              onChangeText={v => handlePromptChange(i, 'answer', v)}
              placeholder="Your answer..."
              placeholderTextColor={colors.gray400}
              multiline
            />
          </View>
        ))}

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoFieldRow}>
            <Ionicons name="briefcase-outline" size={18} color={colors.gray500} />
            <TextInput
              style={styles.infoInput}
              value={job}
              onChangeText={setJob}
              placeholder="Job title"
              placeholderTextColor={colors.gray400}
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.infoFieldRow}>
            <Ionicons name="school-outline" size={18} color={colors.gray500} />
            <TextInput
              style={styles.infoInput}
              value={school}
              onChangeText={setSchool}
              placeholder="School"
              placeholderTextColor={colors.gray400}
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.infoFieldRow}>
            <Ionicons name="location-outline" size={18} color={colors.gray500} />
            <TextInput
              style={styles.infoInput}
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="Neighborhood"
              placeholderTextColor={colors.gray400}
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headline,
    color: colors.black,
  },
  saveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveBtnText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.pink,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    marginLeft: spacing.xs,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  photoCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  swapBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndex: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  photoIndexText: {
    ...typography.caption2,
    fontWeight: '700',
    color: colors.black,
  },
  promptEditCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  promptQuestionInput: {
    ...typography.headline,
    color: colors.black,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  promptAnswerInput: {
    ...typography.body,
    color: colors.gray700,
    lineHeight: 24,
    minHeight: 60,
    paddingVertical: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  infoFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  infoInput: {
    ...typography.body,
    color: colors.black,
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginLeft: 50,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.black,
  },
});
