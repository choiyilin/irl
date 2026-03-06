import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';
import { getImageSource } from '../data/profileImages';
import { useStore } from '../store';

const DEFAULT_HEIGHT = 400;

interface ProfilePhotoProps {
  photo: any;
  profileId?: string;
  photoIndex?: number;
  height?: number;
  overridePosition?: 'top' | 'center' | 'bottom';
  overrideZoom?: number;
  borderRadius?: number;
}

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  photo,
  profileId,
  photoIndex = 0,
  height = DEFAULT_HEIGHT,
  overridePosition,
  overrideZoom,
  borderRadius,
}) => {
  const settings = useStore(s =>
    profileId && s.photoCropSettings[profileId]
      ? s.photoCropSettings[profileId][photoIndex]
      : undefined,
  );

  const position = overridePosition ?? (settings?.position as 'top' | 'center' | 'bottom') ?? 'top';
  const zoom = overrideZoom ?? settings?.zoom ?? 1.0;

  const imgHeight = height * 1.15 * zoom;
  const extraHeight = imgHeight - height;
  const translateY =
    position === 'top'
      ? 0
      : position === 'center'
      ? -extraHeight / 2
      : -extraHeight;

  return (
    <View style={[styles.clip, { height, borderRadius: borderRadius ?? radii.lg }]}>
      <Image
        source={getImageSource(photo)}
        style={{
          width: '100%',
          height: imgHeight,
          transform: [{ translateY }],
        }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: colors.gray200,
  },
});
