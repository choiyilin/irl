import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import {
  signInWithApple,
  signInWithGoogle,
  sendPhoneOtp,
  verifyPhoneOtp,
  ensureProfile,
} from '../lib/auth';

export const WelcomeScreen: React.FC = () => {
  const login = useStore((s) => s.login);
  const setAuthState = useStore((s) => s.setAuthState);
  const setAuthLoading = useStore((s) => s.setAuthLoading);
  const authLoading = useStore((s) => s.authLoading);
  const applyReferralCode = useStore((s) => s.applyReferralCode);

  const [refModalVisible, setRefModalVisible] = useState(false);
  const [refCode, setRefCode] = useState('');

  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // ── DEV email/password login (remove before production) ───
  const [devModalVisible, setDevModalVisible] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');

  const handleApplyRef = useCallback(() => {
    if (!refCode.trim()) return;
    applyReferralCode(refCode);
    setRefModalVisible(false);
    setRefCode('');
  }, [refCode, applyReferralCode]);

  const loadMyProfile = useStore((s) => s.loadMyProfile);

  const handlePostAuth = useCallback(async () => {
    const { status, error } = await ensureProfile();
    if (error) {
      console.warn('ensureProfile warning:', error);
    }
    const { data: { user } } = await (await import('../lib/supabase')).supabase.auth.getUser();
    setAuthState(user?.id ?? null, status);
    if (user?.id) loadMyProfile();
  }, [setAuthState, loadMyProfile]);

  const handleApple = useCallback(async () => {
    setAuthLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      setAuthLoading(false);
      if (error !== 'Cancelled') Alert.alert('Apple Sign-In', error);
      return;
    }
    await handlePostAuth();
    setAuthLoading(false);
  }, [handlePostAuth, setAuthLoading]);

  const handleGoogle = useCallback(async () => {
    setAuthLoading(true);
    const { error } = await signInWithGoogle();
    setAuthLoading(false);
    if (error) {
      Alert.alert('Google Sign-In', error);
    }
  }, [setAuthLoading]);

  const handleSendOtp = useCallback(async () => {
    if (!phone.trim()) return;
    setAuthLoading(true);
    const { error } = await sendPhoneOtp(phone.trim());
    setAuthLoading(false);
    if (error) {
      Alert.alert('Phone OTP', error);
      return;
    }
    setOtpSent(true);
  }, [phone, setAuthLoading]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp.trim()) return;
    setAuthLoading(true);
    const { error } = await verifyPhoneOtp(phone.trim(), otp.trim());
    if (error) {
      setAuthLoading(false);
      Alert.alert('Verification', error);
      return;
    }
    await handlePostAuth();
    setAuthLoading(false);
    setPhoneModalVisible(false);
    setOtpSent(false);
    setPhone('');
    setOtp('');
  }, [phone, otp, handlePostAuth, setAuthLoading]);

  // ── DEV handlers (remove before production) ────────────────
  const handleDevSignIn = useCallback(async () => {
    if (!devEmail.trim() || !devPassword.trim()) return;
    setAuthLoading(true);
    const { supabase } = await import('../lib/supabase');
    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail.trim(),
      password: devPassword.trim(),
    });
    if (error) {
      setAuthLoading(false);
      Alert.alert('Dev Sign In', error.message);
      return;
    }
    await handlePostAuth();
    setAuthLoading(false);
    setDevModalVisible(false);
    setDevEmail('');
    setDevPassword('');
  }, [devEmail, devPassword, handlePostAuth, setAuthLoading]);

  const handleDevSignUp = useCallback(async () => {
    if (!devEmail.trim() || !devPassword.trim()) return;
    setAuthLoading(true);
    const { supabase } = await import('../lib/supabase');
    const { error } = await supabase.auth.signUp({
      email: devEmail.trim(),
      password: devPassword.trim(),
    });
    if (error) {
      setAuthLoading(false);
      Alert.alert('Dev Sign Up', error.message);
      return;
    }
    await handlePostAuth();
    setAuthLoading(false);
    setDevModalVisible(false);
    setDevEmail('');
    setDevPassword('');
  }, [devEmail, devPassword, handlePostAuth, setAuthLoading]);

  const handleDemoLogin = useCallback(() => {
    login();
  }, [login]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={['rgba(247,168,200,0.35)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={styles.gradientTL}
      />
      <LinearGradient
        colors={['rgba(199,166,255,0.3)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={styles.gradientTR}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>It's real love</Text>
          </View>

          <View style={styles.buttonSection}>
            {/* Apple */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.authButton}
                activeOpacity={0.7}
                onPress={handleApple}
                disabled={authLoading}
              >
                <Ionicons name="logo-apple" size={20} color={colors.black} style={styles.authIcon} />
                <Text style={styles.authLabel}>Continue with Apple</Text>
              </TouchableOpacity>
            )}

            {/* Google */}
            <TouchableOpacity
              style={styles.authButton}
              activeOpacity={0.7}
              onPress={handleGoogle}
              disabled={authLoading}
            >
              <Ionicons name="logo-google" size={20} color={colors.black} style={styles.authIcon} />
              <Text style={styles.authLabel}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity
              style={styles.authButton}
              activeOpacity={0.7}
              onPress={() => setPhoneModalVisible(true)}
              disabled={authLoading}
            >
              <Ionicons name="call-outline" size={20} color={colors.black} style={styles.authIcon} />
              <Text style={styles.authLabel}>Continue with Phone Number</Text>
            </TouchableOpacity>

            {/* DEV email/password — remove before production */}
            <TouchableOpacity
              style={[styles.authButton, styles.devButton]}
              activeOpacity={0.7}
              onPress={() => setDevModalVisible(true)}
              disabled={authLoading}
            >
              <Ionicons name="code-slash-outline" size={20} color={colors.purple} style={styles.authIcon} />
              <Text style={[styles.authLabel, { color: colors.purple }]}>Continue with Email (Dev)</Text>
            </TouchableOpacity>

            {/* Demo login */}
            <TouchableOpacity
              style={styles.demoLink}
              activeOpacity={0.6}
              onPress={handleDemoLogin}
            >
              <Text style={styles.demoLinkText}>Continue in demo mode</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refLink}
              activeOpacity={0.6}
              onPress={() => setRefModalVisible(true)}
            >
              <Text style={styles.refLinkText}>Have a referral code?</Text>
            </TouchableOpacity>
          </View>

          {authLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.pink} />
            </View>
          )}

          <Text style={styles.disclaimer}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>

      {/* Phone OTP Modal */}
      <Modal
        visible={phoneModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => { setPhoneModalVisible(false); setOtpSent(false); setOtp(''); }}
      >
        <View style={styles.refOverlay}>
          <View style={styles.refCard}>
            <Text style={styles.refTitle}>
              {otpSent ? 'Enter Verification Code' : 'Enter Phone Number'}
            </Text>

            {!otpSent ? (
              <>
                <TextInput
                  style={styles.refInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={colors.gray400}
                  keyboardType="phone-pad"
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.refApplyBtn, !phone.trim() && { opacity: 0.45 }]}
                  activeOpacity={0.7}
                  onPress={handleSendOtp}
                  disabled={authLoading}
                >
                  {authLoading
                    ? <ActivityIndicator color={colors.white} />
                    : <Text style={styles.refApplyText}>Send Code</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.otpSubtitle}>Code sent to {phone}</Text>
                <TextInput
                  style={styles.refInput}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="000000"
                  placeholderTextColor={colors.gray400}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.refApplyBtn, !otp.trim() && { opacity: 0.45 }]}
                  activeOpacity={0.7}
                  onPress={handleVerifyOtp}
                  disabled={authLoading}
                >
                  {authLoading
                    ? <ActivityIndicator color={colors.white} />
                    : <Text style={styles.refApplyText}>Verify</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.refSkipBtn}
              activeOpacity={0.6}
              onPress={() => { setPhoneModalVisible(false); setOtpSent(false); setOtp(''); }}
            >
              <Text style={styles.refSkipText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DEV Email/Password Modal — remove before production */}
      <Modal
        visible={devModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDevModalVisible(false)}
      >
        <View style={styles.refOverlay}>
          <View style={styles.refCard}>
            <View style={styles.devBadge}>
              <Ionicons name="code-slash-outline" size={14} color={colors.purple} />
              <Text style={styles.devBadgeText}>DEV ONLY</Text>
            </View>
            <Text style={styles.refTitle}>Email Login</Text>

            <TextInput
              style={[styles.refInput, { textAlign: 'left', letterSpacing: 0 }]}
              value={devEmail}
              onChangeText={setDevEmail}
              placeholder="email@example.com"
              placeholderTextColor={colors.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <TextInput
              style={[styles.refInput, { textAlign: 'left', letterSpacing: 0 }]}
              value={devPassword}
              onChangeText={setDevPassword}
              placeholder="Password (min 6 chars)"
              placeholderTextColor={colors.gray400}
              secureTextEntry
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={[styles.refApplyBtn, { flex: 1, backgroundColor: colors.purple }, (!devEmail.trim() || !devPassword.trim()) && { opacity: 0.45 }]}
                activeOpacity={0.7}
                onPress={handleDevSignIn}
                disabled={authLoading}
              >
                {authLoading
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.refApplyText}>Sign In</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.refApplyBtn, { flex: 1 }, (!devEmail.trim() || !devPassword.trim()) && { opacity: 0.45 }]}
                activeOpacity={0.7}
                onPress={handleDevSignUp}
                disabled={authLoading}
              >
                {authLoading
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.refApplyText}>Sign Up</Text>
                }
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.refSkipBtn}
              activeOpacity={0.6}
              onPress={() => { setDevModalVisible(false); setDevEmail(''); setDevPassword(''); }}
            >
              <Text style={styles.refSkipText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Referral Code Modal */}
      <Modal
        visible={refModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRefModalVisible(false)}
      >
        <View style={styles.refOverlay}>
          <View style={styles.refCard}>
            <Text style={styles.refTitle}>Enter Referral Code</Text>
            <TextInput
              style={styles.refInput}
              value={refCode}
              onChangeText={(t) => setRefCode(t.toUpperCase())}
              placeholder="e.g. IRL-ANDREW-482"
              placeholderTextColor={colors.gray400}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.refApplyBtn, !refCode.trim() && { opacity: 0.45 }]}
              activeOpacity={0.7}
              onPress={handleApplyRef}
            >
              <Text style={styles.refApplyText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refSkipBtn}
              activeOpacity={0.6}
              onPress={() => { setRefModalVisible(false); setRefCode(''); }}
            >
              <Text style={styles.refSkipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  gradientTL: {
    ...StyleSheet.absoluteFillObject,
    width: '60%',
    height: '50%',
  },
  gradientTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '50%',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  tagline: {
    ...typography.callout,
    fontStyle: 'italic',
    color: colors.gray600,
    marginTop: spacing.sm,
  },
  buttonSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    height: 54,
    paddingHorizontal: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray300,
    ...shadows.sm,
  },
  authIcon: {
    width: 24,
  },
  authLabel: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.black,
    marginLeft: spacing.md,
  },
  demoLink: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  demoLinkText: {
    ...typography.footnote,
    fontWeight: '500',
    color: colors.purple,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    ...typography.caption2,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  refLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  refLinkText: {
    ...typography.footnote,
    color: colors.gray500,
    textDecorationLine: 'underline',
  },
  refOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  refCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    width: '100%',
    ...shadows.md,
  },
  refTitle: {
    ...typography.title3,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  refInput: {
    backgroundColor: colors.gray50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.black,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: spacing.lg,
  },
  otpSubtitle: {
    ...typography.footnote,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  refApplyBtn: {
    backgroundColor: colors.pink,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  refApplyText: {
    ...typography.headline,
    color: colors.white,
  },
  refSkipBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  refSkipText: {
    ...typography.subhead,
    color: colors.gray500,
  },
  devButton: {
    borderColor: colors.purple,
    borderWidth: 1,
    borderStyle: 'dashed' as any,
  },
  devBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    backgroundColor: colors.purpleLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  devBadgeText: {
    ...typography.caption2,
    fontWeight: '700' as const,
    color: colors.purple,
    letterSpacing: 1,
  },
});
