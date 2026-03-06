import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import { ProfileContent } from '../components/ProfileModules';

export const ProfileDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { profileId, fromMissed, venueName } = route.params as {
    profileId: string;
    fromMissed?: boolean;
    venueName?: string;
  };
  const profile = useStore((s) => s.getProfileById(profileId));
  const sendMessageRequest = useStore(s => s.sendMessageRequest);
  const [msgModalVisible, setMsgModalVisible] = useState(false);
  const [msgText, setMsgText] = useState('');

  if (!profile) {
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
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Profile unavailable</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>{profile.name}</Text>
        {fromMissed ? (
          <TouchableOpacity
            style={styles.msgReqBtn}
            onPress={() => setMsgModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.pink} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileContent profile={profile} showRecrop />
        <View style={{ height: 100 }} />
      </ScrollView>

      {fromMissed && (
        <Modal visible={msgModalVisible} transparent animationType="fade" onRequestClose={() => setMsgModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Message Request</Text>
              <Text style={styles.modalSubtitle}>
                Send {profile.name} a message — they'll see it in their Requests inbox.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Write something..."
                placeholderTextColor={colors.gray400}
                value={msgText}
                onChangeText={setMsgText}
                multiline
                maxLength={200}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setMsgModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSendBtn, !msgText.trim() && { opacity: 0.5 }]}
                  onPress={() => {
                    if (!msgText.trim()) return;
                    sendMessageRequest(profileId, msgText.trim(), venueName);
                    setMsgModalVisible(false);
                    setMsgText('');
                    navigation.goBack();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalSendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  headerSpacer: {
    width: 40,
  },
  msgReqBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalCard: {
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
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.footnote,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.gray50,
    borderRadius: radii.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.black,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.headline,
    color: colors.gray700,
  },
  modalSendBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.pink,
    alignItems: 'center',
  },
  modalSendText: {
    ...typography.headline,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
  },
});
