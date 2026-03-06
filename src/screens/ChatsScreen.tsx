import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Switch,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, layout } from '../theme';
import { useStore } from '../store';
import { SegmentedControl } from '../components/SegmentedControl';
import { Avatar, AvatarStack } from '../components/Avatar';
import { ChatThread, Connection, MissedConnection } from '../types';
import { getImageSource } from '../data/profileImages';
import { NotificationBadge } from '../components/NotificationBadge';

const SEGMENTS = ['Matches', 'Connections'];

const ChatRow: React.FC<{
  thread: ChatThread;
  onPress: () => void;
  onAvatarPress?: () => void;
}> = ({ thread, onPress, onAvatarPress }) => {
  const isDm = thread.type === 'dm';
  const otherPhotos = thread.participantPhotos.filter((_, i) => thread.participants[i] !== 'me');
  const otherNames = thread.participantNames.filter((n) => n !== 'You');
  const displayName = isDm ? otherNames[0] : otherNames.join(', ');

  return (
    <TouchableOpacity style={styles.chatRow} activeOpacity={0.6} onPress={onPress}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
        {isDm ? (
          <Avatar uri={otherPhotos[0]} name={otherNames[0]} size={52} />
        ) : (
          <AvatarStack uris={otherPhotos} size={44} max={3} />
        )}
      </TouchableOpacity>
      <View style={styles.chatRowContent}>
        <View style={styles.chatRowTop}>
          <Text style={styles.chatRowName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.chatRowTime}>{thread.lastMessageTime}</Text>
        </View>
        <View style={styles.chatRowBottom}>
          <Text style={styles.chatRowPreview} numberOfLines={1}>
            {thread.lastMessage}
          </Text>
          {thread.unread > 0 && (
            <View style={styles.unreadDot} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ConnectionRow: React.FC<{ connection: Connection; onPress: () => void }> = ({
  connection,
  onPress,
}) => (
  <TouchableOpacity style={styles.connectionRow} activeOpacity={0.6} onPress={onPress}>
    <Avatar uri={connection.photo} name={connection.name} size={40} />
    <View style={styles.connectionInfo}>
      <Text style={styles.connectionName}>{connection.name}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
  </TouchableOpacity>
);

const MissedConnectionCard: React.FC<{
  item: MissedConnection;
  onPress: () => void;
}> = ({ item, onPress }) => {
  const firstName = item.name.split(' ')[0];

  return (
    <TouchableOpacity style={styles.missedCard} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.missedPhotoClip}>
        <Image source={getImageSource(item.photo)} style={styles.missedPhotoImg} resizeMode="cover" />
      </View>
      <View style={styles.missedInfo}>
        <Text style={styles.missedName}>{firstName}</Text>
        {!!(item.venue) && (
          <Text style={styles.missedVenue} numberOfLines={1}>
            Near {item.venue}
          </Text>
        )}
        {item.mutuals > 0 && (
          <Text style={styles.missedMutuals} numberOfLines={1}>
            {item.mutuals} {item.mutuals === 1 ? 'mutual' : 'mutuals'} in common
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const ChatsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [segmentIndex, setSegmentIndex] = useState(0);
  const chatThreads = useStore((s) => s.chatThreads);
  const connections = useStore((s) => s.connections);
  const missedConnections = useStore((s) => s.missedConnections);
  const showLast24Hours = useStore((s) => s.showLast24Hours);
  const toggleLast24Hours = useStore((s) => s.toggleLast24Hours);
  const showToast = useStore((s) => s.showToast);
  const supabaseUserId = useStore((s) => s.supabaseUserId);
  const chatsLoading = useStore((s) => s.chatsLoading);
  const loadChats = useStore((s) => s.loadChats);
  const loadMissedConnections = useStore((s) => s.loadMissedConnections);

  useEffect(() => {
    if (supabaseUserId) {
      loadChats();
      loadMissedConnections();
    }
  }, [supabaseUserId]);

  const getFirstProfileId = (thread: ChatThread): string | null => {
    const profileParticipant = thread.participants.find(
      (p) => p !== 'me' && !p.startsWith('conn'),
    );
    return profileParticipant ?? null;
  };

  const navigateToProfile = (profileId: string | null) => {
    if (profileId) {
      navigation.navigate('ProfileDetail', { profileId });
    }
  };

  const renderMatchesTab = () => (
    <FlatList
      data={chatThreads}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ChatRow
          thread={item}
          onPress={() => navigation.navigate('ChatDetail' as any, { threadId: item.id })}
          onAvatarPress={() => navigateToProfile(getFirstProfileId(item))}
        />
      )}
      contentContainerStyle={chatThreads.length === 0 ? styles.emptyList : styles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No messages yet</Text>
      }
    />
  );

  const pendingCount = useStore(s => s.getPendingRequestsCount());

  const renderConnectionsTab = () => (
    <ScrollView
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={styles.requestsRow}
        activeOpacity={0.6}
        onPress={() => navigation.navigate('RequestsInbox' as any)}
      >
        <View style={styles.requestsIconWrap}>
          <Ionicons name="mail-outline" size={20} color={colors.pink} />
          <NotificationBadge count={pendingCount} size={16} />
        </View>
        <Text style={styles.requestsLabel}>Requests</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>My Connections</Text>
      <View style={styles.sectionCard}>
        {connections.map((conn, idx) => (
          <React.Fragment key={conn.id}>
            {idx > 0 && <View style={styles.rowSeparator} />}
            <ConnectionRow
              connection={conn}
              onPress={() => navigateToProfile(conn.id)}
            />
          </React.Fragment>
        ))}
      </View>

      <View style={styles.missedHeader}>
        <Text style={styles.sectionTitle}>Missed Connections</Text>
      </View>
      <Text style={styles.missedExplainer}>
        People who were near your highlighted venues tonight.
      </Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Last 24 hours (demo)</Text>
        <Switch
          value={showLast24Hours}
          onValueChange={toggleLast24Hours}
          trackColor={{ false: colors.gray300, true: colors.pink }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.missedGrid}>
        {missedConnections.map((mc) => (
          <MissedConnectionCard
            key={mc.id}
            item={mc}
            onPress={() => navigation.navigate('ProfileDetail', { profileId: mc.id, fromMissed: true, venueName: mc.venue })}
          />
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.segmentWrap}>
          <SegmentedControl
            segments={SEGMENTS}
            selectedIndex={segmentIndex}
            onChange={setSegmentIndex}
          />
        </View>
      </View>

      {chatsLoading && chatThreads.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        segmentIndex === 0 ? renderMatchesTab() : renderConnectionsTab()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.title2,
    color: colors.black,
  },
  segmentWrap: {
    width: 200,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.gray400,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray400,
    textAlign: 'center',
  },

  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  chatRowContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  chatRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  chatRowName: {
    ...typography.headline,
    color: colors.black,
    flex: 1,
    marginRight: spacing.sm,
  },
  chatRowTime: {
    ...typography.caption1,
    color: colors.gray500,
  },
  chatRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatRowPreview: {
    ...typography.subhead,
    color: colors.gray600,
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.pink,
    marginLeft: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginLeft: 64,
  },

  sectionTitle: {
    ...typography.headline,
    color: colors.black,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  connectionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  connectionName: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.black,
  },
  connectionTag: {
    ...typography.caption1,
    color: colors.gray500,
    marginTop: 1,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginLeft: 68,
  },

  missedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
  },
  missedExplainer: {
    ...typography.footnote,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  toggleLabel: {
    ...typography.subhead,
    color: colors.black,
  },
  missedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  missedCard: {
    width: (layout.screenWidth - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  missedPhotoClip: {
    height: 140,
    overflow: 'hidden',
  },
  missedPhotoImg: {
    width: '100%',
    height: 165,
    backgroundColor: colors.gray200,
  },
  missedInfo: {
    padding: spacing.sm,
  },
  missedName: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.black,
  },
  missedVenue: {
    ...typography.caption1,
    color: colors.gray500,
    marginTop: 2,
  },
  missedMutuals: {
    ...typography.caption2,
    color: colors.gray400,
    marginTop: 1,
  },
  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  requestsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.pinkLight + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsLabel: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.black,
    flex: 1,
    marginLeft: spacing.md,
  },
});
