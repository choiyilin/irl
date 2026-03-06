import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import { Avatar } from '../components/Avatar';

const FREE_LIMIT = 3;

export const LikesInboxScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isPremium = useStore(s => s.isPremium);
  const likesInbox = useStore(s => s.likesInbox);
  const likesInboxLoading = useStore(s => s.likesInboxLoading);
  const loadLikesReceived = useStore(s => s.loadLikesReceived);
  const supabaseUserId = useStore(s => s.supabaseUserId);
  const likesReceivedCount = useStore(s => s.likesReceivedCount);
  const setPremium = useStore(s => s.setPremium);

  useEffect(() => {
    if (supabaseUserId) loadLikesReceived();
  }, [supabaseUserId]);

  const isDemo = !supabaseUserId;
  const totalCount = isDemo ? likesReceivedCount : likesInbox.length;
  const visibleLikes = isPremium ? likesInbox : likesInbox.slice(0, FREE_LIMIT);
  const hiddenCount = isPremium ? 0 : Math.max(0, totalCount - FREE_LIMIT);

  const renderItem = ({ item, index }: { item: typeof likesInbox[0]; index: number }) => {
    const isLocked = !isPremium && index >= FREE_LIMIT;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          if (isLocked) return;
          navigation.navigate('ProfileDetail', { profileId: item.fromUser });
        }}
      >
        <View style={styles.cardRow}>
          {isLocked ? (
            <View style={styles.blurredAvatar}>
              <Ionicons name="lock-closed" size={20} color={colors.white} />
            </View>
          ) : (
            <Avatar uri={item.photo ?? undefined} name={item.name} size={52} />
          )}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, isLocked && styles.cardNameBlurred]}>
              {isLocked ? '••••••' : item.name}
            </Text>
            {item.comment ? (
              <Text style={[styles.cardComment, isLocked && styles.cardNameBlurred]} numberOfLines={1}>
                "{isLocked ? '••••••••' : item.comment}"
              </Text>
            ) : (
              <Text style={styles.cardSubtext}>Liked your profile</Text>
            )}
          </View>
          {!isLocked && (
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDemoList = () => {
    const demoItems = Array.from({ length: Math.min(totalCount, 8) }, (_, i) => ({
      id: `demo_${i}`,
      fromUser: '',
      name: i < FREE_LIMIT ? `Person ${i + 1}` : '',
      age: 0,
      photo: null,
      comment: null,
      createdAt: '',
      locked: !isPremium && i >= FREE_LIMIT,
    }));

    return (
      <FlatList
        data={demoItems}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              {item.locked ? (
                <View style={styles.blurredAvatar}>
                  <Ionicons name="lock-closed" size={20} color={colors.white} />
                </View>
              ) : (
                <View style={styles.demoAvatar}>
                  <Ionicons name="heart" size={22} color={colors.pink} />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, item.locked && styles.cardNameBlurred]}>
                  {item.locked ? '••••••' : `Someone liked you`}
                </Text>
                <Text style={styles.cardSubtext}>
                  {item.locked ? '••••••••' : 'Tap to see who'}
                </Text>
              </View>
              {!item.locked && (
                <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
              )}
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={26} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Likes {totalCount > 0 ? `(${totalCount})` : ''}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {likesInboxLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      ) : totalCount === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={56} color={colors.gray300} />
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptySubtitle}>
            When someone likes your profile, they'll appear here.
          </Text>
        </View>
      ) : isDemo ? (
        <>
          {renderDemoList()}
          {!isPremium && hiddenCount > 0 && (
            <View style={styles.upsellBar}>
              <Ionicons name="diamond-outline" size={18} color={colors.purple} />
              <Text style={styles.upsellText}>
                {hiddenCount} more {hiddenCount === 1 ? 'like' : 'likes'} — unlock with IRL+
              </Text>
              <TouchableOpacity
                style={styles.upsellBtn}
                activeOpacity={0.7}
                onPress={() => setPremium(true)}
              >
                <Text style={styles.upsellBtnText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <>
          <FlatList
            data={visibleLikes}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          />
          {!isPremium && hiddenCount > 0 && (
            <View style={styles.upsellBar}>
              <Ionicons name="diamond-outline" size={18} color={colors.purple} />
              <Text style={styles.upsellText}>
                {hiddenCount} more {hiddenCount === 1 ? 'like' : 'likes'} — unlock with IRL+
              </Text>
              <TouchableOpacity
                style={styles.upsellBtn}
                activeOpacity={0.7}
                onPress={() => setPremium(true)}
              >
                <Text style={styles.upsellBtnText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
  list: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardName: {
    ...typography.headline,
    color: colors.black,
  },
  cardNameBlurred: {
    color: colors.gray300,
  },
  cardComment: {
    ...typography.subhead,
    color: colors.gray600,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardSubtext: {
    ...typography.caption1,
    color: colors.gray500,
    marginTop: 2,
  },
  blurredAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.black,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.subhead,
    color: colors.gray500,
    textAlign: 'center',
  },
  upsellBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purpleLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  upsellText: {
    ...typography.subhead,
    color: colors.black,
    flex: 1,
  },
  upsellBtn: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  upsellBtnText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.white,
  },
});
