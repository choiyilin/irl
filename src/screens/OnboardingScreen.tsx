import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import {
  BasicsPayload,
  PromptOption,
  saveBasics,
  uploadPhoto,
  fetchPrompts,
  savePrompts,
  activateProfile,
} from '../lib/onboarding';
import { signOut } from '../lib/auth';

const { width: SW } = Dimensions.get('window');
const PHOTO_SIZE = (SW - spacing.xl * 2 - spacing.md * 2) / 3;
const TOTAL_STEPS = 3;

// ── Step indicator ──────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  return (
    <View style={styles.stepBar}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
      ))}
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 1 — Basics
// ════════════════════════════════════════════════════════════
interface BasicsStepProps {
  onNext: (data: BasicsPayload) => void;
  loading: boolean;
}

function BasicsStep({ onNext, loading }: BasicsStepProps) {
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [interestedIn, setInterestedIn] = useState<'male' | 'female' | ''>('');
  const [hometown, setHometown] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [school, setSchool] = useState('');
  const [height, setHeight] = useState('');

  const valid = firstName.trim() && age.trim() && gender && interestedIn;

  const handleNext = () => {
    if (!valid) return;
    onNext({
      first_name: firstName.trim(),
      age: parseInt(age, 10),
      gender: gender as 'male' | 'female',
      interested_in: interestedIn as 'male' | 'female',
      hometown: hometown.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      job_title: jobTitle.trim() || undefined,
      school: school.trim() || undefined,
      height: height.trim() || undefined,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>About You</Text>
      <Text style={styles.stepSubtitle}>The basics to get you started.</Text>

      <Label text="First name" required />
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Andrew" placeholderTextColor={colors.gray400} />

      <Label text="Age" required />
      <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="27" placeholderTextColor={colors.gray400} keyboardType="number-pad" />

      <Label text="I am" required />
      <View style={styles.chipRow}>
        <Chip label="Male" active={gender === 'male'} onPress={() => setGender('male')} />
        <Chip label="Female" active={gender === 'female'} onPress={() => setGender('female')} />
      </View>

      <Label text="Interested in" required />
      <View style={styles.chipRow}>
        <Chip label="Men" active={interestedIn === 'male'} onPress={() => setInterestedIn('male')} />
        <Chip label="Women" active={interestedIn === 'female'} onPress={() => setInterestedIn('female')} />
      </View>

      <Label text="Hometown" />
      <TextInput style={styles.input} value={hometown} onChangeText={setHometown} placeholder="Los Angeles, CA" placeholderTextColor={colors.gray400} />

      <Label text="Neighborhood" />
      <TextInput style={styles.input} value={neighborhood} onChangeText={setNeighborhood} placeholder="West Village" placeholderTextColor={colors.gray400} />

      <Label text="Job title" />
      <TextInput style={styles.input} value={jobTitle} onChangeText={setJobTitle} placeholder="Founder" placeholderTextColor={colors.gray400} />

      <Label text="School" />
      <TextInput style={styles.input} value={school} onChangeText={setSchool} placeholder="NYU" placeholderTextColor={colors.gray400} />

      <Label text="Height" />
      <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="6'1&quot;" placeholderTextColor={colors.gray400} />

      <PrimaryButton label="Next" onPress={handleNext} disabled={!valid} loading={loading} />
      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 2 — Photos
// ════════════════════════════════════════════════════════════
interface PhotosStepProps {
  onNext: (uris: string[]) => void;
  onBack: () => void;
  loading: boolean;
}

function PhotosStep({ onNext, onBack, loading }: PhotosStepProps) {
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const filled = photos.filter(Boolean).length;

  const pickPhoto = useCallback(async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPhotos(prev => {
      const copy = [...prev];
      copy[index] = result.assets[0].uri;
      return copy;
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Add Photos</Text>
      <Text style={styles.stepSubtitle}>Upload 6 photos to complete your profile.</Text>

      <View style={styles.photoGrid}>
        {photos.map((uri, i) => (
          <TouchableOpacity key={i} style={styles.photoSlot} activeOpacity={0.7} onPress={() => pickPhoto(i)}>
            {uri ? (
              <Image source={{ uri }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="add" size={28} color={colors.gray400} />
                <Text style={styles.photoSlotLabel}>{i + 1}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.photoCount}>{filled}/6 photos added</Text>

      <PrimaryButton label="Next" onPress={() => onNext(photos.filter(Boolean) as string[])} disabled={filled < 6} loading={loading} />
      <BackLink onPress={onBack} />
      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 3 — Prompts
// ════════════════════════════════════════════════════════════
interface PromptsStepProps {
  onComplete: (answers: { prompt_id: string; answer: string }[]) => void;
  onBack: () => void;
  loading: boolean;
}

function PromptsStep({ onComplete, onBack, loading }: PromptsStepProps) {
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [selected, setSelected] = useState<(PromptOption | null)[]>([null, null, null]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);

  useEffect(() => {
    fetchPrompts().then(({ data, error }) => {
      if (error) Alert.alert('Error', error);
      setPrompts(data);
      setLoadingPrompts(false);
    });
  }, []);

  const selectPrompt = useCallback((slot: number, prompt: PromptOption) => {
    setSelected(prev => {
      const copy = [...prev];
      copy[slot] = prompt;
      return copy;
    });
  }, []);

  const updateAnswer = useCallback((slot: number, text: string) => {
    setAnswers(prev => {
      const copy = [...prev];
      copy[slot] = text;
      return copy;
    });
  }, []);

  const valid = selected.every(Boolean) && answers.every(a => a.trim().length > 0);

  const handleComplete = () => {
    if (!valid) return;
    onComplete(
      selected.map((p, i) => ({ prompt_id: p!.id, answer: answers[i].trim() })),
    );
  };

  const usedIds = new Set(selected.filter(Boolean).map(p => p!.id));

  if (loadingPrompts) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Your Prompts</Text>
      <Text style={styles.stepSubtitle}>Pick 3 prompts and write your answers.</Text>

      {[0, 1, 2].map(slot => (
        <View key={slot} style={styles.promptSlot}>
          <Text style={styles.promptSlotLabel}>Prompt {slot + 1}</Text>

          {selected[slot] ? (
            <View style={styles.promptSelected}>
              <Text style={styles.promptQuestion}>{selected[slot]!.question}</Text>
              <TouchableOpacity onPress={() => { setSelected(p => { const c = [...p]; c[slot] = null; return c; }); updateAnswer(slot, ''); }}>
                <Ionicons name="close-circle" size={20} color={colors.gray400} />
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptPicker}>
              {prompts.filter(p => !usedIds.has(p.id)).map(p => (
                <TouchableOpacity key={p.id} style={styles.promptChip} onPress={() => selectPrompt(slot, p)} activeOpacity={0.7}>
                  <Text style={styles.promptChipText} numberOfLines={1}>{p.question}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selected[slot] && (
            <TextInput
              style={styles.promptInput}
              value={answers[slot]}
              onChangeText={t => updateAnswer(slot, t)}
              placeholder="Your answer..."
              placeholderTextColor={colors.gray400}
              multiline
            />
          )}
        </View>
      ))}

      <PrimaryButton label="Complete Profile" onPress={handleComplete} disabled={!valid} loading={loading} />
      <BackLink onPress={onBack} />
      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════
// Main OnboardingScreen
// ════════════════════════════════════════════════════════════
export const OnboardingScreen: React.FC = () => {
  const setAuthState = useStore(s => s.setAuthState);
  const supabaseUserId = useStore(s => s.supabaseUserId);
  const logout = useStore(s => s.logout);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleBasics = useCallback(async (data: BasicsPayload) => {
    setLoading(true);
    const { error } = await saveBasics(data);
    setLoading(false);
    if (error) { Alert.alert('Error', error); return; }
    setStep(2);
  }, []);

  const handlePhotos = useCallback(async (uris: string[]) => {
    setLoading(true);
    for (let i = 0; i < uris.length; i++) {
      const { error } = await uploadPhoto(i + 1, uris[i]);
      if (error) {
        setLoading(false);
        Alert.alert('Upload Error', `Photo ${i + 1}: ${error}`);
        return;
      }
    }
    setLoading(false);
    setStep(3);
  }, []);

  const handlePrompts = useCallback(async (answers: { prompt_id: string; answer: string }[]) => {
    setLoading(true);
    const promptPayload = answers.map((a, i) => ({
      slot_index: i + 1,
      prompt_id: a.prompt_id,
      answer: a.answer,
    }));
    const { error: promptErr } = await savePrompts(promptPayload);
    if (promptErr) { setLoading(false); Alert.alert('Error', promptErr); return; }

    const { error: activateErr } = await activateProfile();
    if (activateErr) { setLoading(false); Alert.alert('Error', activateErr); return; }

    setAuthState(supabaseUserId, 'active');
    await useStore.getState().loadMyProfile();
    setLoading(false);
  }, [supabaseUserId, setAuthState]);

  const handleLogout = useCallback(async () => {
    await signOut();
    logout();
  }, [logout]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <StepBar step={step} />
        <View style={{ width: 24 }} />
      </View>
      {step === 1 && <BasicsStep onNext={handleBasics} loading={loading} />}
      {step === 2 && <PhotosStep onNext={handlePhotos} onBack={() => setStep(1)} loading={loading} />}
      {step === 3 && <PromptsStep onComplete={handlePrompts} onBack={() => setStep(2)} loading={loading} />}
    </SafeAreaView>
  );
};

// ── Shared sub-components ───────────────────────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}{required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({ label, onPress, disabled, loading }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.backLink} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.backLinkText}>Back</Text>
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  stepBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  stepDotActive: {
    backgroundColor: colors.pink,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  stepTitle: {
    ...typography.title2,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.subhead,
    color: colors.gray600,
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.pink,
    textTransform: 'none',
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.black,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.pink,
    borderColor: colors.pink,
  },
  chipText: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.gray600,
  },
  chipTextActive: {
    color: colors.white,
  },
  primaryBtn: {
    backgroundColor: colors.pink,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    ...typography.headline,
    color: colors.white,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: spacing.lg,
  },
  backLinkText: {
    ...typography.subhead,
    color: colors.gray500,
  },

  /* ── Photos ── */
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoSlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.33,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotLabel: {
    ...typography.caption2,
    color: colors.gray400,
    marginTop: spacing.xxs,
  },
  photoCount: {
    ...typography.footnote,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  /* ── Prompts ── */
  promptSlot: {
    marginBottom: spacing.xl,
  },
  promptSlotLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  promptSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pinkLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  promptQuestion: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.pinkDark,
    flex: 1,
  },
  promptPicker: {
    maxHeight: 44,
    marginBottom: spacing.xs,
  },
  promptChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  promptChipText: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.gray600,
    maxWidth: 180,
  },
  promptInput: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.black,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
