import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { useStore } from '../store';
import { Avatar } from '../components/Avatar';
import { Connection } from '../types';
import { getImageSource } from '../data/profileImages';

type ReferRouteParams = {
  Refer: { profileId: string; profileName: string };
};

export const ReferScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ReferRouteParams, 'Refer'>>();
  const { profileId, profileName } = route.params;
  const store = useStore();

  const profile = store.profiles.find(p => p.id === profileId);

  const handleSend = (connection: Connection) => {
    store.referProfile(profileId, connection.id, connection.name);
    navigation.goBack();
  };

  const renderConnection = ({ item }: { item: Connection }) => (
    <View style={styles.connectionRow}>
      <Avatar uri={item.photo} name={item.name} size={48} />
      <View style={styles.connectionInfo}>
        <Text style={styles.connectionName}>{item.name}</Text>
        <Text style={styles.connectionTag}>{item.tag}</Text>
      </View>
      <TouchableOpacity
        style={styles.sendBtn}
        onPress={() => handleSend(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.sendBtnText}>Send</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={26} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer to a Friend</Text>
        <View style={styles.headerSpacer} />
      </View>

      {profile && (
        <View style={styles.profilePreview}>
          <Image
            source={getImageSource(profile.photos[0])}
            style={styles.profilePhoto}
            resizeMode="cover"
          />
          <View style={styles.profilePreviewInfo}>
            <Text style={styles.profilePreviewName}>{profileName}</Text>
            <Text style={styles.profilePreviewSub}>
              {profile.age} · {profile.neighborhood || profile.hometown}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.listLabel}>Your connections</Text>

      <FlatList
        data={store.connections}
        keyExtractor={item => item.id}
        renderItem={renderConnection}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No connections yet</Text>
          </View>
        }
      />
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
  headerSpacer: {
    width: 26,
  },
  profilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  profilePhoto: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.gray200,
  },
  profilePreviewInfo: {
    flex: 1,
  },
  profilePreviewName: {
    ...typography.headline,
    color: colors.black,
  },
  profilePreviewSub: {
    ...typography.subhead,
    color: colors.gray500,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
  },
  listLabel: {
    ...typography.footnote,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
  },
  connectionTag: {
    ...typography.footnote,
    color: colors.gray500,
    marginTop: 2,
  },
  sendBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.pink,
    borderRadius: radii.full,
  },
  sendBtnText: {
    ...typography.footnote,
    color: colors.white,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.huge,
  },
  emptyText: {
    ...typography.body,
    color: colors.gray400,
    marginTop: spacing.md,
  },
});
