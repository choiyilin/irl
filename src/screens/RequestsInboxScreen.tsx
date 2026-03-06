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
import { MessageRequest } from '../types';

export const RequestsInboxScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const requests = useStore(s => s.requestsReceived);
  const getProfileById = useStore(s => s.getProfileById);
  const acceptRequest = useStore(s => s.acceptRequest);
  const declineRequest = useStore(s => s.declineRequest);
  const supabaseUserId = useStore(s => s.supabaseUserId);
  const loadRequests = useStore(s => s.loadRequests);
  const requestsLoading = useStore(s => s.requestsLoading);

  useEffect(() => {
    if (supabaseUserId) loadRequests();
  }, [supabaseUserId]);

  const pending = requests.filter(r => r.status === 'pending');

  const renderItem = ({ item }: { item: MessageRequest }) => {
    const sender = getProfileById(item.fromProfileId);
    if (!sender) return null;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardTop}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ProfileDetail', { profileId: item.fromProfileId })}
        >
          <Avatar uri={sender.photos[0]} name={sender.name} size={48} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{sender.name.split(' ')[0]}</Text>
            {!!item.venueName && (
              <Text style={styles.cardVenue} numberOfLines={1}>
                Near {item.venueName} · {item.timestamp}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.cardMessage} numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => declineRequest(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => acceptRequest(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {requestsLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      ) : pending.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-open-outline" size={56} color={colors.gray300} />
          <Text style={styles.emptyTitle}>No pending requests</Text>
          <Text style={styles.emptySubtitle}>
            When someone near your venues sends a message, it'll appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardName: {
    ...typography.headline,
    color: colors.black,
  },
  cardVenue: {
    ...typography.caption1,
    color: colors.gray500,
    marginTop: 2,
  },
  cardMessage: {
    ...typography.body,
    color: colors.gray700,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.gray300,
  },
  declineBtnText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.gray600,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.pink,
  },
  acceptBtnText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.white,
  },
  emptyState: {
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
});
