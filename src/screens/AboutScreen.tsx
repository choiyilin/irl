import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../theme';

interface SectionProps {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SECTIONS: SectionProps[] = [
  {
    icon: 'heart-outline',
    title: 'The IRL Story',
    body: 'Dating should feel real, not transactional. IRL brings back the spark of genuine connection — curated people, real places, and moments that matter.',
  },
  {
    icon: 'people-outline',
    title: 'How It Works',
    body: 'Classic browse-and-match meets the real world. Friends refer their best single friends, and our venue discovery helps you plan unforgettable first dates at spots you both love.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'The Embarrassment Reducer',
    body: '"How did you two meet?" — "We met IRL." It\'s the dating app designed so you never have to admit you used a dating app.',
  },
  {
    icon: 'rocket-outline',
    title: 'Viral Growth Engine',
    body: 'Every user becomes a matchmaker. Invite your single friends for better setups, creating organic referral loops that grow the community authentically.',
  },
  {
    icon: 'cash-outline',
    title: 'Revenue Model',
    body: 'Premium subscriptions unlock real-world perks — venue deals, skip-the-line access, complimentary coat check, and student discounts that drive retention.',
  },
  {
    icon: 'megaphone-outline',
    title: 'Go-To-Market',
    body: 'Launch with a curated pool sourced through female peer networks. An application-and-waitlist model creates exclusivity. New York City first, then strategic expansion.',
  },
  {
    icon: 'map-outline',
    title: 'Expansion Plan',
    body: 'NYC → LA → Miami → Chicago, followed by college towns. Each market launches with local venue partnerships and community ambassadors.',
  },
];

const SectionCard: React.FC<SectionProps> = ({ title, body, icon }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardIconWrap}>
        <Ionicons name={icon} size={18} color={colors.pinkDark} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardBody}>{body}</Text>
  </View>
);

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={26} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About IRL</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hero}>
          Real connections.{'\n'}Real places.{'\n'}Real love.
        </Text>

        {SECTIONS.map((section) => (
          <SectionCard key={section.title} {...section} />
        ))}

        <Text style={styles.footer}>
          © {new Date().getFullYear()} IRL Dating, Inc.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.black,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  hero: {
    ...typography.title1,
    color: colors.black,
    marginBottom: spacing.xxl,
    lineHeight: 36,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cardTitle: {
    ...typography.headline,
    color: colors.black,
    flex: 1,
  },
  cardBody: {
    ...typography.subhead,
    color: colors.gray700,
    lineHeight: 22,
  },
  footer: {
    ...typography.caption1,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
