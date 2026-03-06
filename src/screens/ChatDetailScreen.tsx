import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import { Avatar, AvatarStack } from '../components/Avatar';
import { ChatMessage, Connection } from '../types';
import { getImageSource } from '../data/profileImages';
import { subscribeToChat, unsubscribeFromChat } from '../lib/matchmaking';

function getReferralInfo(msg: ChatMessage) {
  const store = useStore.getState();
  const profile = msg.referredProfileId
    ? store.getProfileById(msg.referredProfileId)
    : null;
  const conn = msg.referredProfileId
    ? store.connections.find(c => c.id === msg.referredProfileId)
    : null;
  const photo = profile?.photos?.[0] || conn?.photo;
  const name =
    msg.referredProfileName ||
    profile?.name ||
    conn?.name?.split(' ')[0] ||
    'Unknown';
  return { photo, name, profileId: msg.referredProfileId };
}

export const ChatDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { threadId } = route.params as { threadId: string };

  const thread = useStore((s) => s.chatThreads.find((t) => t.id === threadId));
  const addMessageToThread = useStore((s) => s.addMessageToThread);
  const connections = useStore((s) => s.connections);
  const showToast = useStore((s) => s.showToast);
  const supabaseUserId = useStore((s) => s.supabaseUserId);
  const loadMessages = useStore((s) => s.loadMessages);

  const [inputText, setInputText] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const isGroup = thread?.type === 'group';
  const isDM = thread?.type === 'dm';
  const otherNames = thread?.participantNames.filter((n) => n !== 'You') ?? [];
  const otherPhotos =
    thread?.participantPhotos.filter(
      (_, i) => thread.participants[i] !== 'me',
    ) ?? [];
  const headerTitle = isGroup ? otherNames.join(', ') : otherNames[0] ?? 'Chat';

  useEffect(() => {
    if (supabaseUserId && threadId) {
      loadMessages(threadId);
    }
  }, [supabaseUserId, threadId]);

  useEffect(() => {
    if (!supabaseUserId || !threadId) return;
    const channel = subscribeToChat(threadId, (msg) => {
      if (msg.sender_id === supabaseUserId) return;
      addMessageToThread(threadId, {
        id: msg.id,
        senderId: msg.sender_id,
        senderName: '',
        text: msg.text ?? '',
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: msg.message_type === 'referral_card' ? 'referral' : undefined,
        referredProfileId: msg.referral_profile_id ?? undefined,
      });
    });
    return () => { unsubscribeFromChat(channel); };
  }, [supabaseUserId, threadId]);

  useEffect(() => {
    if (thread?.messages.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [thread?.messages.length]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !thread) return;

    const newMessage: ChatMessage = {
      id: `m_${Date.now()}`,
      senderId: 'me',
      senderName: 'You',
      text: trimmed,
      timestamp: 'Just now',
    };

    addMessageToThread(threadId, newMessage);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const handleReferFriend = (connection: Connection) => {
    if (!thread) return;
    const firstName = connection.name.split(' ')[0];
    const referralMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      senderId: 'me',
      senderName: 'You',
      type: 'referral',
      referredProfileId: connection.id,
      referredProfileName: firstName,
      text: `Referred ${firstName}`,
      timestamp: 'Just now',
    };
    addMessageToThread(threadId, referralMsg);
    setPickerVisible(false);
    showToast('Referral sent');
    setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: true }),
      100,
    );

    const otherParticipantId = thread.participants.find(p => p !== 'me');
    const otherName = otherNames[0] || 'They';
    if (otherParticipantId) {
      setTimeout(() => {
        const responseMsg: ChatMessage = {
          id: `m_${Date.now() + 1}`,
          senderId: otherParticipantId,
          senderName: otherName,
          text: 'Ooh interesting! I might have someone in mind for them too 👀',
          timestamp: 'Just now',
        };
        addMessageToThread(threadId, responseMsg);
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      }, 2500);
    }
  };

  const navigateToProfile = (profileId?: string) => {
    if (profileId) {
      (navigation as any).navigate('ProfileDetail', { profileId });
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === 'me';
    const isSystem = item.senderId === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemRow}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    if (item.type === 'referral') {
      const { photo, name, profileId } = getReferralInfo(item);
      return (
        <View
          style={[
            styles.messageRow,
            isMe ? styles.messageRowMe : styles.messageRowOther,
          ]}
        >
          <View style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <Ionicons name="people" size={14} color={colors.purple} />
              <Text style={styles.referralLabel}>Friend Referral</Text>
            </View>
            <View style={styles.referralBody}>
              <Image
                source={getImageSource(photo)}
                style={styles.referralPhoto}
                resizeMode="cover"
              />
              <Text style={styles.referralName}>{name}</Text>
            </View>
            <TouchableOpacity
              style={styles.referralCta}
              activeOpacity={0.7}
              onPress={() => navigateToProfile(profileId)}
            >
              <Text style={styles.referralCtaText}>View Profile</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.timestamp, isMe && styles.timestampMe]}>
            {item.timestamp}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        {!isMe && isGroup && (
          <Text style={styles.senderLabel}>{item.senderName}</Text>
        )}
        <View
          style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
        >
          <Text style={isMe ? styles.bubbleTextMe : styles.bubbleTextOther}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.timestamp, isMe && styles.timestampMe]}>
          {item.timestamp}
        </Text>
      </View>
    );
  };

  if (!thread) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Thread not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profileParticipant = thread.participants.find(
    (p) => p !== 'me' && !p.startsWith('conn'),
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={26} color={colors.black} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerCenter}
            activeOpacity={0.6}
            onPress={() => navigateToProfile(profileParticipant)}
          >
            <Text style={styles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerRightGroup}>
            {isDM && (
              <TouchableOpacity
                style={styles.referBtn}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.7}
                accessibilityLabel="Refer a friend"
              >
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color={colors.purple}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerAvatar}
              activeOpacity={0.7}
              onPress={() => navigateToProfile(profileParticipant)}
            >
              {isGroup ? (
                <AvatarStack uris={otherPhotos} size={32} max={3} />
              ) : (
                <Avatar uri={otherPhotos[0]} name={otherNames[0]} size={34} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={thread.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.gray400}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim()
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={inputText.trim() ? colors.white : colors.gray400}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Connections picker */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerDismiss}
            activeOpacity={1}
            onPress={() => setPickerVisible(false)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeaderRow}>
              <Text style={styles.pickerTitle}>Refer a Friend</Text>
              <TouchableOpacity
                onPress={() => setPickerVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color={colors.gray600} />
              </TouchableOpacity>
            </View>
            <Text style={styles.pickerSubtitle}>
              Choose a connection to share
            </Text>
            <FlatList
              data={connections}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => handleReferFriend(item)}
                  activeOpacity={0.6}
                >
                  <Avatar uri={item.photo} name={item.name} size={44} />
                  <View style={styles.pickerRowInfo}>
                    <Text style={styles.pickerRowName}>
                      {item.name.split(' ')[0]}
                    </Text>
                    <Text style={styles.pickerRowTag}>{item.tag}</Text>
                  </View>
                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={22}
                    color={colors.gray400}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.gray500,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.black,
    textAlign: 'center',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  referBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.purpleLight + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    marginRight: spacing.xs,
  },

  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  messageRow: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderLabel: {
    ...typography.caption2,
    fontWeight: '600',
    color: colors.gray500,
    marginBottom: 2,
    marginLeft: spacing.xs,
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.xl,
  },
  bubbleMe: {
    backgroundColor: colors.pink,
    borderBottomRightRadius: radii.xs,
  },
  bubbleOther: {
    backgroundColor: colors.gray100,
    borderBottomLeftRadius: radii.xs,
  },
  bubbleTextMe: {
    ...typography.body,
    color: colors.white,
  },
  bubbleTextOther: {
    ...typography.body,
    color: colors.black,
  },
  timestamp: {
    ...typography.caption2,
    color: colors.gray500,
    marginTop: 3,
    marginLeft: spacing.xs,
  },
  timestampMe: {
    marginRight: spacing.xs,
    marginLeft: 0,
  },

  systemRow: {
    alignSelf: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.pinkLight,
    borderRadius: radii.full,
  },
  systemText: {
    ...typography.caption1,
    color: colors.pinkDark,
    textAlign: 'center',
  },

  /* Referral card */
  referralCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: 220,
    ...shadows.md,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  referralLabel: {
    ...typography.caption1,
    color: colors.purple,
    fontWeight: '600',
  },
  referralBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  referralPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray200,
  },
  referralName: {
    ...typography.headline,
    color: colors.black,
    flex: 1,
  },
  referralCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.pink,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
  },
  referralCtaText: {
    ...typography.footnote,
    color: colors.white,
    fontWeight: '700',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.gray50,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.sm + 2 : spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm + 2 : spacing.sm,
    ...typography.body,
    color: colors.black,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.pink,
  },
  sendButtonInactive: {
    backgroundColor: colors.gray100,
  },

  /* Connections picker */
  pickerOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerDismiss: {
    flex: 1,
  },
  pickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    maxHeight: '60%',
    paddingBottom: spacing.huge,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  pickerTitle: {
    ...typography.title3,
    color: colors.black,
  },
  pickerSubtitle: {
    ...typography.subhead,
    color: colors.gray500,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  pickerListContent: {
    paddingHorizontal: spacing.xl,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  pickerRowInfo: {
    flex: 1,
  },
  pickerRowName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.black,
  },
  pickerRowTag: {
    ...typography.footnote,
    color: colors.gray500,
    marginTop: 2,
  },
});
