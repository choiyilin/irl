import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radii, typography } from '../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  size = 'md',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === 'sm' && styles.sm,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          size === 'sm' && styles.labelSm,
          selected ? styles.labelSelected : styles.labelUnselected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  selected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  unselected: {
    backgroundColor: colors.white,
    borderColor: colors.gray300,
  },
  label: {
    ...typography.footnote,
    fontWeight: '600',
  },
  labelSm: {
    ...typography.caption2,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.white,
  },
  labelUnselected: {
    color: colors.gray700,
  },
});
