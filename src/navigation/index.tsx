import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows, radii } from '../theme';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { FiltersScreen } from '../screens/FiltersScreen';
import { ReferScreen } from '../screens/ReferScreen';
import { VenuesScreen } from '../screens/VenuesScreen';
import { ChatsScreen } from '../screens/ChatsScreen';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { ProfileDetailScreen } from '../screens/ProfileDetailScreen';
import { MyProfileScreen } from '../screens/MyProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { RequestsInboxScreen } from '../screens/RequestsInboxScreen';
import { LikesInboxScreen } from '../screens/LikesInboxScreen';
import { DebugScreen } from '../screens/DebugScreen';

import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { ensureProfile } from '../lib/auth';

export type RootStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Main: undefined;
  Filters: undefined;
  Refer: { profileId: string; profileName: string };
  ChatDetail: { threadId: string };
  ProfileDetail: { profileId: string; fromMissed?: boolean; venueName?: string };
  RequestsInbox: undefined;
  LikesInbox: undefined;
  MyProfile: undefined;
  EditProfile: { profileId: string };
  About: undefined;
  Premium: undefined;
  Debug: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const icons: Record<string, string> = {
    Match: 'heart',
    Venues: 'compass',
    Chats: 'chatbubbles',
    Settings: 'person',
  };

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = icons[route.name] || 'ellipse';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              <View
                style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              >
                <Ionicons
                  name={(isFocused ? iconName : `${iconName}-outline`) as any}
                  size={24}
                  color={isFocused ? colors.pink : colors.gray400}
                  onPress={onPress}
                />
              </View>
              {isFocused && <View style={styles.tabDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Match" component={MatchScreen} />
      <Tab.Screen name="Venues" component={VenuesScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// OnboardingPlaceholder removed — using real OnboardingScreen

export function AppNavigator() {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  const profileStatus = useStore(s => s.profileStatus);
  const setAuthState = useStore(s => s.setAuthState);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { status } = await ensureProfile();
          setAuthState(session.user.id, status);
          if (status === 'active') {
            const s = useStore.getState();
            s.loadMyProfile();
            s.loadFeed();
            s.loadVenues();
            s.loadChats();
          }
        } else {
          setAuthState(null, null);
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [setAuthState]);

  const showOnboarding = isAuthenticated && profileStatus === 'incomplete';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Filters"
              component={FiltersScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="Refer"
              component={ReferScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="ChatDetail"
              component={ChatDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProfileDetail"
              component={ProfileDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RequestsInbox"
              component={RequestsInboxScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LikesInbox"
              component={LikesInboxScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MyProfile"
              component={MyProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="Premium"
              component={PremiumScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="Debug"
              component={DebugScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    paddingVertical: 12,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
    width: '100%',
    maxWidth: 360,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  tabButtonActive: {
    backgroundColor: colors.pinkLight + '40',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pink,
    marginTop: 3,
  },
});
