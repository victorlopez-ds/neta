import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { markOnboardingSeen } from '@/lib/onboarding';
import { colors, spacing, font, radius } from '@/theme/tokens';

const SLIDES = [
  {
    icon: 'wallet' as const,
    title: 'Track every euro',
    body: 'Log income, essential, personal and leisure spending in seconds with the 5-tier model.',
  },
  {
    icon: 'trending-up' as const,
    title: 'DCA & subscriptions, automated',
    body: 'Set it once — recurring bills and investment plans post themselves every period.',
  },
  {
    icon: 'flash' as const,
    title: 'Instant, always',
    body: 'Everything updates the moment you tap. No spinners, syncs quietly in the background.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  async function finish() {
    await markOnboardingSeen();
    router.replace('/(auth)/sign-in');
  }

  function next() {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      finish();
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.skip} onPress={finish} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={64} color={colors.white} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <Pressable style={styles.cta} onPress={next}>
        <Text style={styles.ctaText}>{index === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brand },
  skip: { position: 'absolute', top: spacing.xl, right: spacing.xl, zIndex: 1 },
  skipText: { color: colors.white, fontWeight: font.weight.semibold as any, fontSize: font.size.sm },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: { fontSize: font.size.xl, fontWeight: font.weight.heavy as any, color: colors.white, textAlign: 'center' },
  body: { fontSize: font.size.md, color: colors.white, opacity: 0.9, textAlign: 'center', marginTop: spacing.md, lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: colors.white, width: 22 },
  cta: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  ctaText: { color: colors.brand, fontSize: font.size.md, fontWeight: font.weight.bold as any },
});
