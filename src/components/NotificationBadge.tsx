import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 18,
}) => {
  if (count <= 0) return null;

  const label = count > 99 ? '99+' : `${count}`;
  const isWide = label.length > 1;
  const minWidth = isWide ? size + 8 : size;

  return (
    <View
      style={[
        styles.badge,
        {
          minWidth,
          height: size,
          borderRadius: size / 2,
          paddingHorizontal: isWide ? 5 : 0,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.6, lineHeight: size }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});
