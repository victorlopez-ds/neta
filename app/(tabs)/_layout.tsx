import { Redirect, Tabs, useRouter } from 'expo-router';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthProvider';
import { colors, radius, shadow } from '@/theme/tokens';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  analysis: 'stats-chart',
  goals: 'layers',
  profile: 'person',
};

/**
 * Custom 5-slot bar matching the mockup, with a prominent center "+" that opens
 * the quick-add modal (adapted from the kit's floating "+" menu). The four real
 * tabs render either side.
 */
function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderTab = (route: any, index: number) => {
    const focused = state.index === index;
    return (
      <Pressable
        key={route.key}
        style={styles.tab}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
      >
        <Ionicons
          name={ICONS[route.name] ?? 'ellipse'}
          size={24}
          color={focused ? colors.brand : colors.textPrimary}
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: (insets.bottom || 12) + 6 }]}>
      {state.routes.slice(0, 2).map((r: any, i: number) => renderTab(r, i))}
      <Pressable style={styles.center} onPress={() => router.push('/movement/new')}>
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>
      {state.routes.slice(2).map((r: any, i: number) => renderTab(r, i + 2))}
    </View>
  );
}

export default function TabsLayout() {
  const { session, initializing } = useAuth();
  if (!initializing && !session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="analysis" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.brandTintBg,
    paddingTop: 14,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  center: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    ...shadow.card,
  },
});
