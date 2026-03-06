import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';

interface DiagRow {
  label: string;
  value: string;
  warn?: boolean;
}

interface DiagSection {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  rows: DiagRow[];
}

async function runDiagnostics(): Promise<{ sections: DiagSection[]; raw: string }> {
  const sections: DiagSection[] = [];
  const lines: string[] = [`IRL Debug — ${new Date().toISOString()}`];

  // Auth
  const authRows: DiagRow[] = [];
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      authRows.push({ label: 'getUser error', value: error.message, warn: true });
    } else if (user) {
      authRows.push({ label: 'User ID', value: user.id });
      authRows.push({ label: 'Email', value: user.email ?? '—' });
      authRows.push({ label: 'Provider', value: user.app_metadata?.provider ?? '—' });
    } else {
      authRows.push({ label: 'User', value: 'null (not logged in)', warn: true });
    }
    const { data: { session } } = await supabase.auth.getSession();
    authRows.push({ label: 'Session', value: session ? 'present' : 'none', warn: !session });
  } catch (e: any) {
    authRows.push({ label: 'Auth error', value: e.message, warn: true });
  }
  sections.push({ title: 'Auth', icon: 'key-outline', rows: authRows });

  // Database
  const dbRows: DiagRow[] = [];
  try {
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    dbRows.push({ label: 'profiles (total)', value: String(profilesCount ?? 0) });

    const { count: activeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('profile_status', 'active');
    dbRows.push({ label: 'active profiles', value: String(activeCount ?? 0) });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: myRow } = await supabase
        .from('profiles')
        .select('profile_status, first_name, is_premium, interested_in')
        .eq('user_id', user.id)
        .maybeSingle();

      dbRows.push({
        label: 'my profile exists',
        value: myRow ? 'yes' : 'NO',
        warn: !myRow,
      });
      dbRows.push({
        label: 'my profile_status',
        value: myRow?.profile_status ?? '—',
        warn: myRow?.profile_status !== 'active',
      });
      dbRows.push({ label: 'my first_name', value: myRow?.first_name ?? '—' });
      dbRows.push({ label: 'my is_premium', value: String(myRow?.is_premium ?? false) });
      dbRows.push({ label: 'my interested_in', value: myRow?.interested_in ?? '—' });

      const { count: photoCount } = await supabase
        .from('profile_photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      dbRows.push({
        label: 'my photos',
        value: `${photoCount ?? 0}/6`,
        warn: (photoCount ?? 0) < 6,
      });

      const { count: promptCount } = await supabase
        .from('profile_prompts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      dbRows.push({
        label: 'my prompts',
        value: `${promptCount ?? 0}/3`,
        warn: (promptCount ?? 0) < 3,
      });
    }

    const { count: venueCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true });
    dbRows.push({
      label: 'venues',
      value: String(venueCount ?? 0),
      warn: (venueCount ?? 0) === 0,
    });

    const { count: promptLibCount } = await supabase
      .from('prompt_library')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);
    dbRows.push({ label: 'prompt_library (active)', value: String(promptLibCount ?? 0) });
  } catch (e: any) {
    dbRows.push({ label: 'DB error', value: e.message, warn: true });
  }
  sections.push({ title: 'Database', icon: 'server-outline', rows: dbRows });

  // Storage
  const storageRows: DiagRow[] = [];
  storageRows.push({ label: 'Bucket', value: 'profile-photos' });
  storageRows.push({ label: 'Upload path format', value: '<user_id>/<slot>.png' });
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: files, error: listErr } = await supabase.storage
        .from('profile-photos')
        .list(user.id, { limit: 10 });
      if (listErr) {
        storageRows.push({ label: 'List error', value: listErr.message, warn: true });
      } else {
        storageRows.push({
          label: 'Files in my folder',
          value: files?.map(f => f.name).join(', ') || 'none',
          warn: (files?.length ?? 0) === 0,
        });
      }
    }
  } catch (e: any) {
    storageRows.push({ label: 'Storage error', value: e.message, warn: true });
  }
  sections.push({ title: 'Storage', icon: 'cloud-outline', rows: storageRows });

  const lastErr = useStore.getState().lastSupabaseError;
  sections.push({
    title: 'Errors',
    icon: 'warning-outline',
    rows: [{
      label: 'lastSupabaseError',
      value: lastErr ?? 'none',
      warn: !!lastErr,
    }],
  });

  for (const section of sections) {
    lines.push(`\n── ${section.title} ──`);
    for (const row of section.rows) {
      lines.push(`${row.label}: ${row.value}${row.warn ? ' ⚠️' : ''}`);
    }
  }

  return { sections, raw: lines.join('\n') };
}

export const DebugScreen: React.FC = () => {
  const navigation = useNavigation();
  const [sections, setSections] = useState<DiagSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState('');
  const [ran, setRan] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await runDiagnostics();
      setSections(result.sections);
      setRawText(result.raw);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRan(true);
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (!rawText) return;
    Alert.alert('Debug Diagnostics', rawText);
  }, [rawText]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debug Panel</Text>
        <TouchableOpacity onPress={refresh} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.purple} />
          ) : (
            <Ionicons name="refresh" size={22} color={colors.purple} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!ran && !loading && (
          <View style={styles.placeholder}>
            <Ionicons name="bug-outline" size={48} color={colors.gray300} />
            <Text style={styles.placeholderText}>Tap refresh to run diagnostics</Text>
            <TouchableOpacity style={styles.runBtn} onPress={refresh} activeOpacity={0.7}>
              <Ionicons name="play" size={18} color={colors.white} />
              <Text style={styles.runBtnText}>Run Diagnostics</Text>
            </TouchableOpacity>
          </View>
        )}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon} size={16} color={colors.purple} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.card}>
              {section.rows.map((row, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.sep} />}
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel} numberOfLines={1}>{row.label}</Text>
                    <Text
                      style={[styles.diagValue, row.warn && styles.diagWarn]}
                      numberOfLines={2}
                      selectable
                    >
                      {row.value}{row.warn ? ' ⚠️' : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {ran && (
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
            <Ionicons name="copy-outline" size={16} color={colors.white} />
            <Text style={styles.copyBtnText}>Copy Diagnostics</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: spacing.huge }} />
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.offWhite,
  },
  headerTitle: {
    ...typography.title3,
    color: colors.black,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
  },
  placeholderText: {
    ...typography.subhead,
    color: colors.gray500,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.purple,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
  runBtnText: {
    ...typography.headline,
    color: colors.white,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption1,
    fontWeight: '700',
    color: colors.purple,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginLeft: spacing.lg,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  diagLabel: {
    ...typography.footnote,
    color: colors.gray600,
    flex: 1,
  },
  diagValue: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'right',
    maxWidth: '55%',
  },
  diagWarn: {
    color: colors.danger,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray700,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  copyBtnText: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.white,
  },
});
