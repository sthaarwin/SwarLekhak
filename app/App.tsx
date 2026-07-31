import { useEffect, useState } from 'react';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Appbar,
  BottomNavigation,
  PaperProvider,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import theme from './src/theme';
import RecordScreen from './src/screens/RecordScreen';
import TemplatesScreen from './src/screens/TemplatesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import DocumentScreen from './src/screens/DocumentScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { supabase } from './src/services/supabaseClient';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Record: 'microphone',
  Templates: 'file-document-outline',
  History: 'history',
};

function MaterialTabBar({ state, descriptors, navigation, insets }: any) {
  const paperTheme = useTheme();

  return (
    <BottomNavigation.Bar
      navigationState={state}
      safeAreaInsets={insets}
      activeColor={paperTheme.colors.primary}
      inactiveColor={paperTheme.colors.onSurfaceVariant}
      style={{ backgroundColor: paperTheme.colors.surface }}
      onTabPress={({ route, preventDefault }) => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (event.defaultPrevented) {
          preventDefault();
        } else {
          navigation.dispatch(
            CommonActions.navigate(route.name, route.params)
          );
        }
      }}
      renderIcon={({ route, focused, color }) => {
        const iconName = TAB_ICONS[route.name];
        return (
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={color}
          />
        );
      }}
      getLabelText={({ route }) => {
        const { options } = descriptors[route.key];
        return (options.tabBarLabel ?? options.title ?? route.name) as string;
      }}
    />
  );
}

function TopBar({
  session,
  navigation,
  userName,
}: {
  session: Session;
  navigation: any;
  userName: string | null;
}) {
  const paperTheme = useTheme();
  const displayValue = userName || session.user.email || 'User';

  return (
    <Appbar.Header elevated mode="small">
      <Appbar.Content
        title="Swar-Lekhak"
        titleStyle={styles.appBarTitle}
      />
      <View style={styles.accountRow}>
        <Text
          variant="labelMedium"
          numberOfLines={1}
          style={{ color: paperTheme.colors.onSurfaceVariant, maxWidth: 120 }}
        >
          {displayValue}
        </Text>
        <Appbar.Action
          icon="account-circle"
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="प्रोफाइल"
        />
      </View>
    </Appbar.Header>
  );
}

function HomeTabs({
  session,
  navigation,
  userName,
}: {
  session: Session;
  navigation: any;
  userName: string | null;
}) {
  const paperTheme = useTheme();

  return (
    <Surface style={{ flex: 1 }} elevation={0}>
      <TopBar session={session} navigation={navigation} userName={userName} />
      <Tab.Navigator tabBar={(props) => <MaterialTabBar {...props} />}>
        <Tab.Screen
          name="Record"
          component={RecordScreen}
          options={{ headerShown: false, title: 'Record' }}
        />
        <Tab.Screen
          name="Templates"
          component={TemplatesScreen}
          options={{ headerShown: false, title: 'Templates' }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ headerShown: false, title: 'History' }}
        />
      </Tab.Navigator>
    </Surface>
  );
}

function LoadingScreen() {
  const paperTheme = useTheme();

  return (
    <Surface style={styles.loadingScreen} elevation={0}>
      <ActivityIndicator size="large" color={paperTheme.colors.primary} />
      <Text variant="headlineSmall" style={{ color: paperTheme.colors.primary, marginTop: 16 }}>
        Swar-Lekhak
      </Text>
    </Surface>
  );
}

function AppNavigator({ session, userName }: { session: Session; userName: string | null }) {
  const paperTheme = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: paperTheme.colors.surface },
          headerTintColor: paperTheme.colors.primary,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="Home" options={{ headerShown: false }}>
          {({ navigation }) => (
            <HomeTabs session={session} navigation={navigation} userName={userName} />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Document"
          component={DocumentScreen}
          options={{ headerTitle: 'दस्तावेज' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerTitle: 'प्रोफाइल' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
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

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="dark" />
        {initializing ? (
          <LoadingScreen />
        ) : session ? (
          <AppNavigator session={session} userName={userName} />
        ) : (
          <LoginScreen />
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appBarTitle: {
    fontWeight: '700',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
