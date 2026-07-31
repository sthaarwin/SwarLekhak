import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import theme, { colors } from './src/theme';
import RecordScreen from './src/screens/RecordScreen';
import TemplatesScreen from './src/screens/TemplatesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import DocumentScreen from './src/screens/DocumentScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { supabase } from './src/services/supabaseClient';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Record: '🎤',
  Templates: '📄',
  History: '📋',
};

function TabBar({ state, descriptors, navigation: nav }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = nav.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            nav.navigate(route.name);
          }
        };

        const tabIcon = TAB_ICONS[route.name];

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tabItem,
              isFocused && styles.tabItemActive,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
              {tabIcon}
            </Text>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TopBar({ session, navigation, userName }: { session: Session; navigation: any; userName: string | null }) {
  const displayValue = userName || session.user.email || 'User';
  const initial = (userName || session.user.email || 'U').slice(0, 1).toUpperCase();

  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        <Text style={styles.menuIcon}>☰</Text>
        <Text style={styles.topBarTitle}>Swar-Lekhak</Text>
      </View>
      <Pressable
        onPress={() => {
          console.log('Navigating to Profile...');
          navigation.navigate('Profile');
        }}
        style={styles.accountButton}
      >
        <Text style={styles.accountEmail} numberOfLines={1}>
          {displayValue}
        </Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>{initial}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function HomeTabs({ session, navigation, userName }: { session: Session; navigation: any; userName: string | null }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar session={session} navigation={navigation} userName={userName} />
      <Tab.Navigator tabBar={(props) => <TabBar {...props} />}>
        <Tab.Screen name="Record" component={RecordScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Templates" component={TemplatesScreen} options={{ headerShown: false }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchUserProfile(data.session.user.id);
      }
      setInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        fetchUserProfile(nextSession.user.id);
      } else {
        setUserName(null);
      }
      setInitializing(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      } else if (data?.full_name) {
        setUserName(data.full_name);
      }
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
    }
  }

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <PaperProvider theme={theme}>
      <StatusBar hidden />
      {initializing ? (
        <View style={styles.loadingScreen}>
          <Text style={styles.loadingText}>Swar-Lekhak</Text>
        </View>
      ) : session ? (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home">
              {({ navigation }) => <HomeTabs session={session} navigation={navigation} userName={userName} />}
            </Stack.Screen>
            <Stack.Screen
              name="Document"
              component={DocumentScreen}
              options={{
                headerShown: true,
                headerTitle: 'दस्तावेज',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.primary,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                headerShown: true,
                headerTitle: 'Profile',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.primary,
                headerShadowVisible: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      ) : (
        <LoginScreen />
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 64,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.govBlueDark,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  avatarIcon: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '55%',
  },
  accountEmail: {
    color: colors.onSurfaceVariant,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.govBlueDark,
    fontSize: 28,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
  },
  tabItemActive: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 16,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.secondary,
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primary,
  },
});
