/**
 * src/features/home/screens/HomeScreen.tsx
 * - 아바타 탭 → Drawer 열기
 * - 오른쪽 스와이프 → Drawer 열기
 * - 왼쪽 스와이프 → 지도 탭으로 이동 (자연스러운 슬라이드 애니메이션)
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import SpaceCard from '../../../components/common/SpaceCard';
import PlaceCard from '../../../components/common/PlaceCard';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { usePlaceStore } from '../../../store/usePlaceStore';
import { useDrawerStore } from '../../../store/useDrawerStore';
import { useAuthStore } from '../../../store/useAuthStore';
import useCrawlingStore from '../../../store/useCrawlingStore';
import { useSwipeTabNavigation } from '../../../hooks/useSwipeTabNavigation';
import { RootStackParamList } from '../../../navigation/types';
import { THEME } from '../../../constants';
import { Place } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { places, isLoading, fetchPlaces } = usePlaceStore();
  const openDrawer = useDrawerStore((state) => state.open);
  const { user } = useAuthStore();
  const { panHandlers, animatedStyle } = useSwipeTabNavigation({ enableDrawer: true });

  const crawlStatus = useCrawlingStore((s) => s.status);
  const dismissCrawl = useCrawlingStore((s) => s.dismiss);

  const avatarInitial = user?.nickname ? user.nickname[0].toUpperCase() : '?';

  useEffect(() => {
    fetchPlaces();
  }, []);

  if (isLoading && places.length === 0) {
    return <LoadingSpinner />;
  }

  const trending = [...places]
    .sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))
    .slice(0, 5);

  const navigateToDetail = (placeId: string) =>
    navigation.navigate('PlaceDetail', { placeId });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── 인스타 크롤링 진행 중 배너 ── */}
      {(crawlStatus === 'submitting' || crawlStatus === 'polling') && (
        <View style={styles.crawlProgressBanner}>
          <ActivityIndicator size="small" color="#C13584" />
          <Text style={styles.crawlProgressText}>인스타그램 게시물 분석 중...</Text>
        </View>
      )}

      {/* ── 인스타 크롤링 완료 배너 ── */}
      {crawlStatus === 'done' && (
        <View style={styles.crawlDoneBanner}>
          <TouchableOpacity
            style={styles.crawlDoneBannerContent}
            onPress={() => navigation.navigate('InstagramImport')}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={16} color="#C13584" />
            <Text style={styles.crawlDoneText} numberOfLines={1}>
              인스타 크롤링 결과가 도착했어요! 탭하여 확인하기
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismissCrawl} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={15} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── 인스타 크롤링 에러 배너 ── */}
      {crawlStatus === 'error' && (
        <View style={[styles.crawlDoneBanner, styles.crawlErrorBanner]}>
          <View style={styles.crawlDoneBannerContent}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            <Text style={[styles.crawlDoneText, { color: '#FF3B30' }]} numberOfLines={1}>
              인스타 분석 중 오류가 발생했어요
            </Text>
          </View>
          <TouchableOpacity onPress={dismissCrawl} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={15} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

      {/* 스와이프 제스처 + 슬라이드 애니메이션 레이어
          ※ panHandlers는 ScrollView가 이미 터치를 처리 중일 때는 개입하지 않음
             (onMoveShouldSetPanResponder 기반 — capture phase 아님)
          ※ 가로 ScrollView(요즘 뜨는 공간) 드래그와 충돌하지 않도록
             threshold를 30px로 설정해 두었음 */}
      <Animated.View style={[styles.flex, animatedStyle]} {...panHandlers}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchPlaces}
              tintColor={THEME.colors.textMuted}
            />
          }
        >
          {/* ── 상단 바 ── */}
          <View style={styles.topBar}>
            {/* 아바타 → Drawer 열기 */}
            <TouchableOpacity onPress={openDrawer} activeOpacity={0.8}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{avatarInitial}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="search" size={20} color={THEME.colors.textMain} />
            </TouchableOpacity>
          </View>

          {/* ── 인사말 ── */}
          <View style={styles.greeting}>
            <Text style={styles.greetingLocation}>✨ 서울특별시 마포구</Text>
            <Text style={styles.greetingTitle}>좋은 아침이에요,{'\n'}반가워요!</Text>
          </View>

          {/* ── 인스타그램 가져오기 배너 ── */}
          <TouchableOpacity
            style={styles.igBanner}
            onPress={() => navigation.navigate('InstagramImport')}
            activeOpacity={0.85}
          >
            <View style={styles.igBannerLeft}>
              <Ionicons name="logo-instagram" size={22} color="#C13584" />
              <View>
                <Text style={styles.igBannerTitle}>인스타그램에서 가져오기</Text>
                <Text style={styles.igBannerSub}>URL을 붙여넣으면 AI가 장소를 분석해요</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>

          {/* ── 요즘 뜨는 공간 ── */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="trending-up-outline" size={20} color={THEME.colors.textMain} />
            <Text style={styles.sectionHeader}>요즘 뜨는 공간</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
            style={styles.hScrollOuter}
          >
            {trending.map((place) => (
              <SpaceCard
                key={place.id}
                place={place}
                onPress={() => navigateToDetail(place.id)}
              />
            ))}
          </ScrollView>

          {/* ── 최근에 저장한 공간 ── */}
          <Text style={[styles.sectionHeader, { marginTop: 16, marginBottom: THEME.spacing.md }]}>최근에 저장한 공간</Text>

          {places.length === 0 ? (
            <EmptyState
              icon={
                <Ionicons
                  name="bookmark-outline"
                  size={24}
                  color={THEME.colors.textMuted}
                />
              }
              message="아직 기록된 공간이 없어요"
              actionLabel="첫 공간을 남겨볼까요?"
              onAction={() => navigation.navigate('AddPlace')}
            />
          ) : (
            places.map((place: Place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onPress={() => navigateToDetail(place.id)}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.bgBot,
  },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xl,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: THEME.font.size.md,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greeting: {
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.xl,
  },
  greetingLocation: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
    fontWeight: THEME.font.weight.medium,
    marginBottom: 8,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    textAlign: 'left',
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: THEME.spacing.md,
  },
  sectionHeader: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    letterSpacing: -0.3,
  },

  hScrollOuter: {
    marginHorizontal: -THEME.spacing.lg,
  },
  hScroll: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
  },

  // ── 크롤링 상태 배너 ─────────────────────────────────────────────────────
  crawlProgressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F7',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCCE8',
  },
  crawlProgressText: {
    fontSize: THEME.font.size.sm,
    color: '#C13584',
    fontWeight: THEME.font.weight.medium,
    flex: 1,
  },
  crawlDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F7',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCCE8',
  },
  crawlDoneBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crawlDoneText: {
    fontSize: THEME.font.size.sm,
    color: '#C13584',
    fontWeight: THEME.font.weight.medium,
    flex: 1,
  },
  crawlErrorBanner: {
    backgroundColor: THEME.colors.heartBg,
    borderBottomColor: THEME.colors.heart,
  },

  igBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    paddingVertical: 14,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  igBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  igBannerTitle: {
    fontSize: THEME.font.size.md,
    fontWeight: THEME.font.weight.semibold,
    color: THEME.colors.textMain,
    marginBottom: 2,
  },
  igBannerSub: {
    fontSize: THEME.font.size.xs,
    color: THEME.colors.textMuted,
  },
});
