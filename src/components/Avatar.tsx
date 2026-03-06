import React from 'react';
import { Image, View, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, typography } from '../theme';

interface AvatarProps {
  uri?: string | number;
  name?: string;
  size?: number;
  style?: ViewStyle;
  badge?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 44,
  style,
  badge,
}) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const imageSource = typeof uri === 'number' ? uri : uri ? { uri } : null;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
      )}
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
  );
};

export const AvatarStack: React.FC<{ uris: any[]; size?: number; max?: number }> = ({
  uris,
  size = 36,
  max = 3,
}) => {
  const displayed = uris.slice(0, max);
  const overflow = uris.length - max;

  return (
    <View style={styles.stack}>
      {displayed.map((uri, i) => (
        <Image
          key={i}
          source={typeof uri === 'number' ? uri : { uri }}
          resizeMode="cover"
          style={[
            styles.stackImage,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: i > 0 ? -(size * 0.3) : 0,
              zIndex: displayed.length - i,
            },
          ]}
        />
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.overflowBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size * 0.3),
            },
          ]}
        >
          <Text style={styles.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray200,
  },
  placeholder: {
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.pinkDark,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.pink,
    borderRadius: radii.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    ...typography.caption2,
    color: colors.white,
    fontWeight: '700',
    fontSize: 9,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackImage: {
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.gray200,
  },
  overflowBadge: {
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  overflowText: {
    ...typography.caption2,
    fontWeight: '700',
    color: colors.gray600,
  },
});
