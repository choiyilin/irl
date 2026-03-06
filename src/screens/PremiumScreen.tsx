import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../theme';

interface Perk {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
}

const PERKS: Perk[] = [
  { icon: 'checkmark-circle', label: 'Height Verification', detail: 'Verified badge on your profile' },
  { icon: 'gift', label: 'Venue Perks & Deals', detail: 'Exclusive discounts at partner spots' },
  { icon: 'shirt', label: 'Coat Check Included', detail: 'Complimentary at select venues' },
  { icon: 'flash', label: 'Skip the Line', detail: 'Priority entry on busy nights' },
  { icon: 'musical-notes', label: 'Free Cover Before 11pm', detail: 'Early bird gets the vibe' },
  { icon: 'school', label: 'Student Discount', detail: 'Special pricing with .edu email' },
  { icon: 'heart', label: "Ladies' Promos", detail: 'Curated perks and events' },
];

export const PremiumScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleStartTrial = () => {
    Alert.alert(
      'Free Trial Started',
      'This is a demo — premium features are now unlocked!',
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color={colors.black} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <LinearGradient
            colors={[colors.pink, colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Ionicons name="diamond" size={40} color={colors.white} />
            <Text style={styles.heroTitle}>IRL Premium</Text>
            <Text style={styles.heroSubtitle}>
              Unlock the full experience — real perks for real dates.
            </Text>
          </LinearGradient>

          {/* Benefits */}
          <View style={styles.perksCard}>
            {PERKS.map((perk, idx) => (
              <View key={perk.label}>
                <View style={styles.perkRow}>
                  <View style={styles.perkIconWrap}>
                    <Ionicons name={perk.icon} size={20} color={colors.pinkDark} />
                  </View>
                  <View style={styles.perkText}>
                    <Text style={styles.perkLabel}>{perk.label}</Text>
                    <Text style={styles.perkDetail}>{perk.detail}</Text>
                  </View>
                </View>
                {idx < PERKS.length - 1 && <View style={styles.perkSeparator} />}
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <View style={[styles.priceCard, styles.priceCardActive]}>
              <Text style={styles.priceLabel}>Yearly</Text>
              <Text style={styles.priceAmount}>$99.99/yr</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 44%</Text>
              </View>
            </View>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Monthly</Text>
              <Text style={styles.priceAmount}>$14.99/mo</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={handleStartTrial}
          >
            <LinearGradient
              colors={[colors.pink, colors.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Start Free Trial</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.ctaDisclaimer}>
            7-day free trial · Cancel anytime
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  hero: {
    borderRadius: radii.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.largeTitle,
    color: colors.white,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    ...typography.subhead,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  perksCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  perkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  perkLabel: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.black,
  },
  perkDetail: {
    ...typography.caption1,
    color: colors.gray600,
    marginTop: 1,
  },
  perkSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginLeft: 52,
  },
  pricingSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  priceCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  priceCardActive: {
    borderColor: colors.pink,
  },
  priceLabel: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  priceAmount: {
    ...typography.title2,
    color: colors.black,
    marginTop: spacing.xs,
  },
  saveBadge: {
    backgroundColor: colors.pinkLight,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginTop: spacing.sm,
  },
  saveBadgeText: {
    ...typography.caption2,
    fontWeight: '700',
    color: colors.pinkDark,
  },
  ctaButton: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  ctaGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: radii.xl,
  },
  ctaText: {
    ...typography.headline,
    color: colors.white,
    fontSize: 18,
  },
  ctaDisclaimer: {
    ...typography.caption1,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
