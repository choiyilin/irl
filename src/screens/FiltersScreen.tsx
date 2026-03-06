import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import { Chip } from '../components/Chip';

const ETHNICITY_OPTIONS = [
  'White', 'Black', 'Hispanic/Latino', 'Asian',
  'South Asian', 'Middle Eastern', 'Mixed', 'Other',
];

const RELIGION_OPTIONS = [
  'Christian', 'Jewish', 'Muslim', 'Hindu',
  'Buddhist', 'Agnostic', 'Spiritual', 'Atheist',
];

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
}

function StepperRow({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepperBtn} onPress={onDecrement} activeOpacity={0.6}>
          <Ionicons name="remove" size={20} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity style={styles.stepperBtn} onPress={onIncrement} activeOpacity={0.6}>
          <Ionicons name="add" size={20} color={colors.black} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const FiltersScreen: React.FC = () => {
  const navigation = useNavigation();
  const store = useStore();

  const [distance, setDistance] = useState(store.filters.distance);
  const [ageRange, setAgeRange] = useState<[number, number]>([...store.filters.ageRange]);
  const [heightRange, setHeightRange] = useState<[number, number]>([...store.filters.heightRange]);
  const [ethnicities, setEthnicities] = useState<string[]>([...store.filters.ethnicities]);
  const [religions, setReligions] = useState<string[]>([...store.filters.religions]);

  const toggleChip = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  const handleApply = () => {
    store.setFilters({ distance, ageRange, heightRange, ethnicities, religions });
    navigation.goBack();
  };

  const handleReset = () => {
    setDistance(25);
    setAgeRange([21, 35]);
    setHeightRange([60, 78]);
    setEthnicities([]);
    setReligions([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={26} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity onPress={handleApply}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance</Text>
          <StepperRow
            label={`Within ${distance} miles`}
            value={`${distance} mi`}
            onDecrement={() => setDistance(d => Math.max(1, d - 5))}
            onIncrement={() => setDistance(d => Math.min(100, d + 5))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>City</Text>
          <View style={styles.cityRow}>
            <Ionicons name="location" size={18} color={colors.pink} />
            <Text style={styles.cityText}>Manhattan, NYC</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age Range</Text>
          <StepperRow
            label="Min"
            value={`${ageRange[0]}`}
            onDecrement={() => setAgeRange(([min, max]) => [Math.max(18, min - 1), max])}
            onIncrement={() => setAgeRange(([min, max]) => [Math.min(max, min + 1), max])}
          />
          <StepperRow
            label="Max"
            value={`${ageRange[1]}`}
            onDecrement={() => setAgeRange(([min, max]) => [min, Math.max(min, max - 1)])}
            onIncrement={() => setAgeRange(([min, max]) => [min, Math.min(99, max + 1)])}
          />
          <Text style={styles.rangeDisplay}>{ageRange[0]} – {ageRange[1]}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Height Range</Text>
          <StepperRow
            label="Min"
            value={formatHeight(heightRange[0])}
            onDecrement={() => setHeightRange(([min, max]) => [Math.max(48, min - 1), max])}
            onIncrement={() => setHeightRange(([min, max]) => [Math.min(max, min + 1), max])}
          />
          <StepperRow
            label="Max"
            value={formatHeight(heightRange[1])}
            onDecrement={() => setHeightRange(([min, max]) => [min, Math.max(min, max - 1)])}
            onIncrement={() => setHeightRange(([min, max]) => [min, Math.min(96, max + 1)])}
          />
          <Text style={styles.rangeDisplay}>
            {formatHeight(heightRange[0])} – {formatHeight(heightRange[1])}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ethnicity</Text>
          <View style={styles.chipGrid}>
            {ETHNICITY_OPTIONS.map(option => (
              <Chip
                key={option}
                label={option}
                selected={ethnicities.includes(option)}
                onPress={() => setEthnicities(prev => toggleChip(prev, option))}
                style={styles.chip}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Religion</Text>
          <View style={styles.chipGrid}>
            {RELIGION_OPTIONS.map(option => (
              <Chip
                key={option}
                label={option}
                selected={religions.includes(option)}
                onPress={() => setReligions(prev => toggleChip(prev, option))}
                style={styles.chip}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
          <Text style={styles.resetText}>Reset All Filters</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.huge }} />
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  headerTitle: {
    ...typography.headline,
    color: colors.black,
  },
  applyText: {
    ...typography.headline,
    color: colors.pink,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.black,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  stepperLabel: {
    ...typography.body,
    color: colors.gray700,
    flex: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    ...typography.headline,
    color: colors.black,
    minWidth: 50,
    textAlign: 'center',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  cityText: {
    ...typography.body,
    color: colors.gray700,
  },
  rangeDisplay: {
    ...typography.subhead,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  resetText: {
    ...typography.headline,
    color: colors.danger,
  },
});
