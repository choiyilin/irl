import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radii, typography, shadows, layout } from '../theme';
import { useStore } from '../store';
import { Profile } from '../types';
import { ProfileContent } from '../components/ProfileModules';
import { NotificationBadge } from '../components/NotificationBadge';

const CONTENT_PADDING = spacing.lg;

function NoteModal({
  visible,
  onClose,
  onSend,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: (note?: string) => void;
}) {
  const [note, setNote] = useState('');

  const handleSkip = () => {
    onSend();
    setNote('');
  };

  const handleSend = () => {
    onSend(note.trim() || undefined);
    setNote('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Send a note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Write something nice..."
            placeholderTextColor={colors.gray400}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={200}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnSecondary} onPress={handleSkip}>
              <Text style={styles.modalBtnSecondaryText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSend}>
              <Text style={styles.modalBtnPrimaryText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const UPSELL_FEATURES = [
  { icon: 'checkmark-circle' as const, text: 'Access verified profiles' },
  { icon: 'shield-checkmark' as const, text: 'Height verification (ID-based)' },
  { icon: 'people' as const, text: 'Priority referrals' },
  { icon: 'pricetag' as const, text: 'Venue perks & partner deals' },
];

export const MatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const store = useStore();
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [plusMode, setPlusMode] = useState(false);
  const [plusIndex, setPlusIndex] = useState(0);
  const [upsellVisible, setUpsellVisible] = useState(false);

  useEffect(() => {
    if (store.supabaseUserId) {
      store.loadFeed();
    }
  }, [store.supabaseUserId]);

  const allFiltered = store.getFilteredProfiles();
  const plusFiltered = allFiltered.filter(p => p.verified);

  const activeProfiles = plusMode ? plusFiltered : allFiltered;
  const activeIndex = plusMode ? plusIndex : store.currentProfileIndex;
  const currentProfile: Profile | undefined = activeProfiles[activeIndex];

  const handlePlusPress = () => {
    if (store.isPremium) {
      setPlusMode(true);
      setPlusIndex(0);
    } else {
      setUpsellVisible(true);
    }
  };

  const handleJoinPlus = () => {
    store.setPremium(true);
    setUpsellVisible(false);
    setPlusMode(true);
    setPlusIndex(0);
    store.showToast('Welcome to IRL+!');
  };

  const handlePass = () => {
    if (!currentProfile) return;
    store.passProfile(currentProfile.id);
    if (plusMode) {
      // passedProfiles updated → plusFiltered recomputes without this profile
      // plusIndex stays, list shrinks, next profile slides in
    }
  };

  const handleLikePress = () => {
    setNoteModalVisible(true);
  };

  const handleNoteSend = (note?: string) => {
    if (currentProfile) {
      store.likeProfile(currentProfile.id, note);
      if (plusMode) {
        setPlusIndex(i => i + 1);
      }
    }
    setNoteModalVisible(false);
  };

  const handleModuleLike = () => {
    handleLikePress();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {plusMode && (
          <TouchableOpacity
            onPress={() => setPlusMode(false)}
            style={styles.backBtn}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={24} color={colors.black} />
          </TouchableOpacity>
        )}
        <Text style={plusMode ? styles.plusLogoText : styles.logoText}>
          {plusMode ? 'IRL+' : 'IRL'}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.likesBtn}
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('LikesInbox')}
        >
          <Ionicons name="heart" size={22} color={colors.pink} />
          <NotificationBadge count={store.likesReceivedCount} />
        </TouchableOpacity>
        {!plusMode && (
          <TouchableOpacity
            style={styles.plusBtn}
            onPress={handlePlusPress}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={colors.purple} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => (navigation as any).navigate('Filters')}
        >
          <Ionicons name="funnel-outline" size={22} color={colors.black} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (store.feedLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={[styles.emptySubtitle, { marginTop: spacing.md }]}>Loading profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    const hasSeenAll = allFiltered.length === 0 && !store.feedLoading;
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.emptyState}>
          <Ionicons name={hasSeenAll ? 'people-outline' : 'heart-dislike-outline'} size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>
            {plusMode ? 'No more verified profiles' : hasSeenAll ? 'No profiles yet' : 'You\'re all caught up'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {plusMode
              ? 'You\'ve seen all verified profiles. Check back later!'
              : hasSeenAll
                ? 'Invite friends and check back soon — new people join every day.'
                : 'Check back soon or adjust your filters to see more people.'}
          </Text>
          {plusMode && (
            <TouchableOpacity
              style={styles.backToAllBtn}
              onPress={() => setPlusMode(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.backToAllText}>Back to all profiles</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileContent profile={currentProfile} onLike={handleModuleLike} />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtnOutlined} onPress={handlePass} activeOpacity={0.7}>
          <Ionicons name="close" size={28} color={colors.gray700} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleLikePress} activeOpacity={0.7}>
          <Ionicons name="heart" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      <NoteModal
        visible={noteModalVisible}
        onClose={() => setNoteModalVisible(false)}
        onSend={handleNoteSend}
      />

      {/* Premium upsell modal */}
      <Modal
        visible={upsellVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpsellVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upsellCard}>
            <View style={styles.upsellBadge}>
              <Ionicons name="diamond-outline" size={28} color={colors.purple} />
            </View>

            <Text style={styles.upsellTitle}>IRL+</Text>
            <Text style={styles.upsellSubtitle}>
              Unlock the premium experience
            </Text>

            <View style={styles.upsellFeatures}>
              {UPSELL_FEATURES.map((feat, i) => (
                <View key={i} style={styles.upsellFeatureRow}>
                  <Ionicons name={feat.icon} size={20} color={colors.purple} />
                  <Text style={styles.upsellFeatureText}>{feat.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.joinBtn}
              onPress={handleJoinPlus}
              activeOpacity={0.8}
            >
              <Text style={styles.joinBtnText}>Join IRL+</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notNowBtn}
              onPress={() => setUpsellVisible(false)}
              activeOpacity={0.6}
            >
              <Text style={styles.notNowText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: CONTENT_PADDING,
    paddingVertical: spacing.sm,
    height: layout.headerHeight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    ...typography.title2,
    color: colors.pink,
    fontWeight: '800',
    letterSpacing: 1,
  },
  plusLogoText: {
    ...typography.title2,
    color: colors.purple,
    fontWeight: '800',
    letterSpacing: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxs,
  },
  likesBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.pinkLight + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.purpleLight + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 40,
    height: 40,
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
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: spacing.sm,
  },
  bottomSpacer: {
    height: 100,
  },
  actionBar: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.md,
  },
  actionBtnOutlined: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  actionBtnPrimary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.black,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.gray500,
    textAlign: 'center',
  },
  backToAllBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.purpleLight + '50',
  },
  backToAllText: {
    ...typography.headline,
    color: colors.purple,
  },

  /* Note modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 340,
    ...shadows.xl,
  },
  modalTitle: {
    ...typography.title3,
    color: colors.black,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  noteInput: {
    backgroundColor: colors.gray50,
    borderRadius: radii.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.black,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    ...typography.headline,
    color: colors.gray700,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.pink,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    ...typography.headline,
    color: colors.white,
  },

  /* Upsell modal */
  upsellCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.xl,
  },
  upsellBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purpleLight + '50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  upsellTitle: {
    ...typography.title1,
    color: colors.purple,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  upsellSubtitle: {
    ...typography.subhead,
    color: colors.gray600,
    marginBottom: spacing.xl,
  },
  upsellFeatures: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  upsellFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  upsellFeatureText: {
    ...typography.body,
    color: colors.black,
    flex: 1,
  },
  joinBtn: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.purple,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  joinBtnText: {
    ...typography.headline,
    color: colors.white,
    fontWeight: '700',
  },
  notNowBtn: {
    paddingVertical: spacing.sm,
  },
  notNowText: {
    ...typography.subhead,
    color: colors.gray500,
  },
});
