import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  Share,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import { getImageSource } from '../data/profileImages';
import { supabaseHealthCheck } from '../lib/supabaseHealth';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  accent?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  onPress,
  trailing,
  accent,
}) => (
  <TouchableOpacity
    style={styles.row}
    activeOpacity={onPress ? 0.6 : 1}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.rowIconWrap, accent && { backgroundColor: colors.pinkLight }]}>
      <Ionicons name={icon} size={18} color={accent ? colors.pinkDark : colors.gray700} />
    </View>
    <Text style={[styles.rowLabel, accent && { color: colors.pinkDark, fontWeight: '600' }]}>
      {label}
    </Text>
    {trailing ?? (
      <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
    )}
  </TouchableOpacity>
);

const SectionLabel: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const logout = useStore((s) => s.logout);
  const currentUserId = useStore((s) => s.currentUserId);
  const currentProfile = useStore((s) => s.myProfile ?? s.getProfileById(s.currentUserId));
  const supabaseUserId = useStore((s) => s.supabaseUserId);
  const profileStatus = useStore((s) => s.profileStatus);
  const showToast = useStore((s) => s.showToast);
  const referralCode = useStore((s) => s.referralCode);
  const invitesSent = useStore((s) => s.invitesSent);
  const friendsJoined = useStore((s) => s.friendsJoined);
  const incrementInvitesSent = useStore((s) => s.incrementInvitesSent);
  const appliedReferralCode = useStore((s) => s.appliedReferralCode);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);

  const handleCopyCode = useCallback(() => {
    showToast('Code copied!');
  }, [showToast]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Join me on IRL — the dating app that gets you off your phone. Use my code: ${referralCode}\n\nhttps://getirl.app/invite/${referralCode}`,
      });
      incrementInvitesSent();
    } catch {
      showToast('Share cancelled');
    }
  }, [referralCode, incrementInvitesSent, showToast]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('MyProfile')}
        >
          <Image
            source={currentProfile ? getImageSource(currentProfile.photos[0]) : { uri: '' }}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentProfile?.name || 'You'}</Text>
            <Text style={styles.profileTagline}>
              {[currentProfile?.neighborhood, currentProfile?.job].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>

        {/* Account */}
        <SectionLabel title="Account" />
        <View style={styles.card}>
          <SettingsRow icon="person-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile', { profileId: currentUserId })} />
          <View style={styles.separator} />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            trailing={
              <Switch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                trackColor={{ false: colors.gray300, true: colors.pink }}
                thumbColor={colors.white}
              />
            }
          />
          <View style={styles.separator} />
          <SettingsRow icon="lock-closed-outline" label="Privacy" onPress={() => {}} />
        </View>

        {/* IRL Premium */}
        <SectionLabel title="IRL Premium" />
        <View style={styles.card}>
          <SettingsRow
            icon="diamond-outline"
            label="Unlock Premium"
            onPress={() => navigation.navigate('Premium')}
            accent
          />
        </View>

        {/* Referrals */}
        <SectionLabel title="Referrals" />
        <View style={styles.card}>
          <SettingsRow
            icon="gift-outline"
            label="Refer Friends"
            onPress={() => setReferralModalVisible(true)}
            accent
          />
          {appliedReferralCode ? (
            <>
              <View style={styles.separator} />
              <View style={styles.row}>
                <View style={styles.rowIconWrap}>
                  <Ionicons name="ticket-outline" size={18} color={colors.gray700} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.gray500 }]}>
                  Referral: {appliedReferralCode}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* About */}
        <SectionLabel title="About" />
        <View style={styles.card}>
          <SettingsRow
            icon="information-circle-outline"
            label="About IRL"
            onPress={() => navigation.navigate('About')}
          />
        </View>

        {/* Support */}
        <SectionLabel title="Support" />
        <View style={styles.card}>
          <SettingsRow icon="help-circle-outline" label="Help Center" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
          <View style={styles.separator} />
          <SettingsRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
        </View>

        {/* Dev — tap label 7× to open Debug Panel */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            const next = devTapCount + 1;
            if (next >= 7) {
              setDevTapCount(0);
              navigation.navigate('Debug');
            } else {
              setDevTapCount(next);
            }
          }}
        >
          <SectionLabel title="Developer" />
        </TouchableOpacity>
        <View style={styles.card}>
          <SettingsRow
            icon="server-outline"
            label="Supabase Status"
            onPress={async () => {
              const result = await supabaseHealthCheck();
              Alert.alert('Supabase', result);
            }}
          />
          {!!supabaseUserId && (
            <>
              <View style={styles.separator} />
              <View style={styles.row}>
                <View style={styles.rowIconWrap}>
                  <Ionicons name="finger-print-outline" size={18} color={colors.gray700} />
                </View>
                <Text style={[styles.rowLabel, { fontSize: 11, color: colors.gray500 }]} numberOfLines={1}>
                  {supabaseUserId.slice(0, 8)}... · {profileStatus ?? '—'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.huge }} />
      </ScrollView>

      {/* Refer Friends Modal */}
      <Modal
        visible={referralModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReferralModalVisible(false)}
      >
        <View style={styles.refOverlay}>
          <View style={styles.refSheet}>
            <View style={styles.refHandleRow}>
              <View style={styles.refHandle} />
            </View>

            <View style={styles.refHeader}>
              <Ionicons name="gift" size={24} color={colors.pink} />
              <Text style={styles.refTitle}>Refer Friends</Text>
              <TouchableOpacity style={styles.refClose} onPress={() => setReferralModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.gray600} />
              </TouchableOpacity>
            </View>

            <Text style={styles.refTagline}>Invite friends. Build your IRL network.</Text>

            <View style={styles.refCodeCard}>
              <Text style={styles.refCodeLabel}>Your Referral Code</Text>
              <Text style={styles.refCode}>{referralCode}</Text>
              <View style={styles.refCodeActions}>
                <TouchableOpacity style={styles.refCopyBtn} onPress={handleCopyCode} activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={16} color={colors.white} />
                  <Text style={styles.refCopyText}>Copy code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.refShareBtn} onPress={handleShare} activeOpacity={0.7}>
                  <Ionicons name="share-outline" size={16} color={colors.purple} />
                  <Text style={styles.refShareText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.refStatsRow}>
              <View style={styles.refStat}>
                <Text style={styles.refStatNum}>{invitesSent}</Text>
                <Text style={styles.refStatLabel}>Invites sent</Text>
              </View>
              <View style={styles.refStatDivider} />
              <View style={styles.refStat}>
                <Text style={styles.refStatNum}>{friendsJoined}</Text>
                <Text style={styles.refStatLabel}>Friends joined</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gray200,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  profileName: {
    ...typography.title3,
    color: colors.black,
  },
  profileTagline: {
    ...typography.footnote,
    color: colors.gray600,
    marginTop: spacing.xxs,
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
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    ...typography.callout,
    color: colors.black,
    flex: 1,
    marginLeft: spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginLeft: 60,
  },
  logoutButton: {
    marginTop: spacing.xxl,
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  logoutText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.danger,
  },

  /* ---------- Referral Modal ---------- */
  refOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  refSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingBottom: spacing.huge,
  },
  refHandleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  refHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  refHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  refTitle: {
    ...typography.title2,
    color: colors.black,
    flex: 1,
  },
  refClose: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refTagline: {
    ...typography.subhead,
    color: colors.gray600,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  refCodeCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.gray50,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  refCodeLabel: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  refCode: {
    ...typography.title1,
    color: colors.black,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  refCodeActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  refCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.pink,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  refCopyText: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.white,
  },
  refShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.purple,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  refShareText: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.purple,
  },
  refStatsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  refStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  refStatNum: {
    ...typography.title2,
    color: colors.black,
  },
  refStatLabel: {
    ...typography.caption1,
    color: colors.gray500,
    marginTop: spacing.xxs,
  },
  refStatDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
  },
});
