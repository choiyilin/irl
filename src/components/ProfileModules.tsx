import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { Profile } from '../types';
import { ProfilePhoto } from './ProfilePhoto';
import { useStore } from '../store';

const PHOTO_HEIGHT = 400;

function InfoRow({ icon, text }: { icon: string; text: string }) {
  if (!text) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={colors.gray500} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

interface PhotoModuleProps {
  photo: any;
  profileId: string;
  photoIndex: number;
  showRecrop?: boolean;
  onRecrop?: (idx: number) => void;
  onLike?: () => void;
}

function PhotoModule({ photo, profileId, photoIndex, showRecrop, onRecrop, onLike }: PhotoModuleProps) {
  return (
    <View style={styles.moduleContainer}>
      <ProfilePhoto
        photo={photo}
        profileId={profileId}
        photoIndex={photoIndex}
        height={PHOTO_HEIGHT}
      />
      {showRecrop && (
        <TouchableOpacity
          style={styles.recropBtn}
          onPress={() => onRecrop?.(photoIndex)}
          activeOpacity={0.7}
        >
          <Ionicons name="crop-outline" size={16} color={colors.white} />
        </TouchableOpacity>
      )}
      {onLike && (
        <TouchableOpacity style={styles.moduleLikeBtn} onPress={onLike} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={20} color={colors.pink} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function PromptModule({
  question,
  answer,
  onLike,
}: {
  question: string;
  answer: string;
  onLike?: () => void;
}) {
  return (
    <View style={[styles.moduleContainer, styles.promptCard]}>
      <Text style={styles.promptQuestion}>{question}</Text>
      <Text style={styles.promptAnswer}>{answer}</Text>
      {onLike && (
        <TouchableOpacity style={styles.promptLikeBtn} onPress={onLike} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={20} color={colors.pink} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const POSITIONS = ['top', 'center', 'bottom'] as const;
const ZOOM_STEPS = [1.0, 1.1, 1.2, 1.3, 1.4];

interface ProfileContentProps {
  profile: Profile;
  onLike?: () => void;
  showRecrop?: boolean;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({ profile, onLike, showRecrop }) => {
  const photos = profile.photos;
  const prompts = profile.prompts;

  const setPhotoCrop = useStore(s => s.setPhotoCrop);
  const resetPhotoCrop = useStore(s => s.resetPhotoCrop);
  const cropSettings = useStore(s => s.photoCropSettings[profile.id]);

  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tempPosition, setTempPosition] = useState<'top' | 'center' | 'bottom'>('top');
  const [tempZoom, setTempZoom] = useState(1.0);

  const openCropModal = (idx: number) => {
    const existing = cropSettings?.[idx];
    setActiveIdx(idx);
    setTempPosition((existing?.position as 'top' | 'center' | 'bottom') ?? 'top');
    setTempZoom(existing?.zoom ?? 1.0);
    setCropModalVisible(true);
  };

  const handleSaveCrop = () => {
    setPhotoCrop(profile.id, activeIdx, tempPosition, tempZoom);
    setCropModalVisible(false);
  };

  const handleResetCrop = () => {
    setTempPosition('top');
    setTempZoom(1.0);
    resetPhotoCrop(profile.id, activeIdx);
  };

  const interleaved: React.ReactNode[] = [];
  const maxPairs = Math.max(photos.length - 1, prompts.length);
  for (let i = 0; i < maxPairs; i++) {
    if (i + 1 < photos.length) {
      interleaved.push(
        <PhotoModule
          key={`photo-${i + 1}`}
          photo={photos[i + 1]}
          profileId={profile.id}
          photoIndex={i + 1}
          showRecrop={showRecrop}
          onRecrop={openCropModal}
          onLike={onLike}
        />,
      );
    }
    if (i < prompts.length) {
      interleaved.push(
        <PromptModule
          key={`prompt-${i}`}
          question={prompts[i].question}
          answer={prompts[i].answer}
          onLike={onLike}
        />,
      );
    }
  }

  return (
    <>
      <PhotoModule
        photo={photos[0]}
        profileId={profile.id}
        photoIndex={0}
        showRecrop={showRecrop}
        onRecrop={openCropModal}
        onLike={onLike}
      />

      {profile.isReferred && (
        <View style={styles.referredBanner}>
          <Text style={styles.referredText}>Referred by a friend 💌</Text>
        </View>
      )}

      <View style={styles.basicsCard}>
        <View style={styles.profileNameRow}>
          <Text style={styles.profileName}>
            {profile.name}, {profile.age}
          </Text>
          {profile.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <InfoRow
          icon="briefcase-outline"
          text={
            profile.job && profile.company
              ? `${profile.job} @ ${profile.company}`
              : profile.job || profile.company
          }
        />
        <InfoRow icon="school-outline" text={profile.school} />
        <InfoRow icon="location-outline" text={profile.neighborhood} />
        <InfoRow icon="home-outline" text={profile.hometown} />
        <InfoRow icon="resize-outline" text={profile.height} />
        <InfoRow icon="sparkles-outline" text={profile.religion} />
        <InfoRow icon="globe-outline" text={profile.ethnicity} />
      </View>

      {interleaved}

      {showRecrop && (
        <Modal visible={cropModalVisible} transparent animationType="slide">
          <View style={styles.cropOverlay}>
            <TouchableOpacity
              style={styles.cropDismiss}
              activeOpacity={1}
              onPress={() => setCropModalVisible(false)}
            />
            <View style={styles.cropSheet}>
              <View style={styles.cropHandle} />
              <Text style={styles.cropTitle}>Adjust Crop</Text>

              <View style={styles.cropPreview}>
                <ProfilePhoto
                  photo={photos[activeIdx]}
                  height={200}
                  overridePosition={tempPosition}
                  overrideZoom={tempZoom}
                  borderRadius={radii.md}
                />
              </View>

              <Text style={styles.cropLabel}>Position</Text>
              <View style={styles.cropSegments}>
                {POSITIONS.map(pos => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.cropSegBtn, tempPosition === pos && styles.cropSegBtnActive]}
                    onPress={() => setTempPosition(pos)}
                  >
                    <Text style={[styles.cropSegText, tempPosition === pos && styles.cropSegTextActive]}>
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.cropLabel}>Zoom: {tempZoom.toFixed(1)}x</Text>
              <View style={styles.zoomRow}>
                {ZOOM_STEPS.map(z => (
                  <TouchableOpacity
                    key={z}
                    style={[styles.zoomChip, Math.abs(tempZoom - z) < 0.01 && styles.zoomChipActive]}
                    onPress={() => setTempZoom(z)}
                  >
                    <Text style={[styles.zoomChipText, Math.abs(tempZoom - z) < 0.01 && styles.zoomChipTextActive]}>
                      {z.toFixed(1)}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.cropActions}>
                <TouchableOpacity style={styles.cropResetBtn} onPress={handleResetCrop}>
                  <Text style={styles.cropResetText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cropSaveBtn} onPress={handleSaveCrop}>
                  <Text style={styles.cropSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  moduleContainer: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  recropBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLikeBtn: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  referredBanner: {
    backgroundColor: colors.pinkLight,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  referredText: {
    ...typography.subhead,
    color: colors.pinkDark,
    fontWeight: '600',
  },
  basicsCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  profileName: {
    ...typography.title1,
    color: colors.black,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  verifiedText: {
    ...typography.caption2,
    fontWeight: '700',
    color: '#4CAF50',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.gray700,
    flex: 1,
  },
  promptCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.sm,
  },
  promptQuestion: {
    ...typography.headline,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  promptAnswer: {
    ...typography.body,
    color: colors.gray700,
    lineHeight: 24,
  },
  promptLikeBtn: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  cropDismiss: {
    flex: 1,
  },
  cropSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  cropHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  cropTitle: {
    ...typography.title3,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cropPreview: {
    marginBottom: spacing.xl,
  },
  cropLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  cropSegments: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.xl,
  },
  cropSegBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  cropSegBtnActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  cropSegText: {
    ...typography.subhead,
    fontWeight: '500',
    color: colors.gray500,
  },
  cropSegTextActive: {
    color: colors.black,
    fontWeight: '600',
  },
  zoomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  zoomChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.gray100,
  },
  zoomChipActive: {
    backgroundColor: colors.pink,
  },
  zoomChipText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.gray600,
  },
  zoomChipTextActive: {
    color: colors.white,
  },
  cropActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cropResetBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.gray300,
  },
  cropResetText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.gray700,
  },
  cropSaveBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.xl,
    backgroundColor: colors.pink,
  },
  cropSaveText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.white,
  },
});
