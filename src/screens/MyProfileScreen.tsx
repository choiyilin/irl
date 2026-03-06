import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, shadows } from '../theme';
import { useStore } from '../store';
import { ProfileContent } from '../components/ProfileModules';

export const MyProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const currentUserId = useStore(s => s.currentUserId);
  const supabaseUserId = useStore(s => s.supabaseUserId);
  const loadMyProfile = useStore(s => s.loadMyProfile);
  const profile = useStore(s => s.myProfile ?? s.getProfileById(currentUserId));

  useFocusEffect(useCallback(() => {
    if (supabaseUserId) loadMyProfile();
  }, [supabaseUserId, loadMyProfile]));

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile', { profileId: currentUserId })}
          activeOpacity={0.6}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && profile && (
        <Text style={{ fontSize: 10, color: '#999', textAlign: 'center', paddingVertical: 4 }}>
          Photos saved: {profile.photos.filter((p: any) => typeof p === 'string' && !p.includes('placehold.co')).length}/6
          {'  |  '}Storage objects: {useStore.getState().storageObjectsCount}
        </Text>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileContent profile={profile} showRecrop />
        <View style={{ height: 100 }} />
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headline,
    color: colors.black,
  },
  editBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editBtnText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.pink,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.black,
    marginTop: spacing.xl,
  },
});
