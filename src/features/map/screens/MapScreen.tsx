/**
 * src/features/map/screens/MapScreen.tsx
 * 공간 지도 — 실제 저장된 Spot을 마커로 표시
 *
 * - 모든 보관함의 Spot을 로드해 지도에 핀 표시
 * - 상단 보관함 필터 칩으로 특정 보관함 Spot만 표시
 * - 마커 탭 → 장소 상세 화면
 * - 화면 끝 스와이프 → 탭 전환
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  PanResponder,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigationState } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import NaverMapView from '../components/NaverMapView';
import { useStorageStore } from '../../../store/useStorageStore';
import spotService from '../../../services/spotService';
import { RootStackParamList, TabParamList } from '../../../navigation/types';
import { COLORS, FONTS, SPACING, THEME } from '../../../constants';
import { MapMarker } from '../../../types';
import { ApiSpot } from '../../../types/spot';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TabNavProp = BottomTabNavigationProp<TabParamList>;

const TAB_ORDER: (keyof TabParamList)[] = ['Home', 'Map', 'Saved', 'Feed'];
const EDGE_WIDTH = 40;

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const tabNavigation = useNavigation<TabNavProp>();
  const currentIndex = useNavigationState((state) => state.index);

  const { storages, fetchStorages } = useStorageStore();

  const [allSpots, setAllSpots] = useState<ApiSpot[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState(false);
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null); // null = 전체

  // ── 모든 보관함의 Spot 로드 ──────────────────────────────
  const loadAllSpots = useCallback(async (storageList: typeof storages) => {
    if (storageList.length === 0) {
      setAllSpots([]);
      return;
    }
    setIsLoadingSpots(true);
    try {
      const results = await Promise.all(
        storageList.map((s) =>
          spotService.getSpots(s.id).catch(() => [] as ApiSpot[])
        )
      );
      setAllSpots(results.flat());
    } finally {
      setIsLoadingSpots(false);
    }
  }, []);

  useEffect(() => {
    fetchStorages();
  }, []);

  useEffect(() => {
    if (storages.length > 0) {
      loadAllSpots(storages);
    }
  }, [storages.length]); // 보관함 수가 바뀔 때만 재로드

  // 화면 포커스 시 Spot 재로드 (다른 화면에서 저장/삭제 후 반영)
  useFocusEffect(
    useCallback(() => {
      if (storages.length > 0) {
        loadAllSpots(storages);
      }
    }, [storages, loadAllSpots])
  );

  // ── 선택된 보관함에 따라 Spot 필터링 ────────────────────
  const filteredSpots = useMemo(() => {
    if (selectedStorageId === null) return allSpots;
    return allSpots.filter((s) => s.storage_id === selectedStorageId);
  }, [allSpots, selectedStorageId]);

  // ── Spot → MapMarker 변환 (유효한 좌표 있는 것만) ──────────
  // latitude/longitude 가 0,0 이면 파싱 실패 → 지도 미표시
  const markers: MapMarker[] = useMemo(() => {
    const result: MapMarker[] = [];
    for (const s of filteredSpots) {
      const lat = s.place?.latitude;
      const lng = s.place?.longitude;
      if (!lat || !lng || Math.abs(lat) < 0.001 || Math.abs(lng) < 0.001) continue;
      result.push({
        id: String(s.id),
        title: s.place?.name ?? '이름 없는 장소',
        latitude: lat,
        longitude: lng,
      });
    }
    console.log(`[MapScreen] markers count: ${result.length} / total spots: ${filteredSpots.length}`);
    return result;
  }, [filteredSpots]);

  // spot id → spot 조회용 Map
  const spotsById = useMemo(
    () => new Map(allSpots.map((s) => [String(s.id), s])),
    [allSpots]
  );

  const handleMarkerPress = useCallback((markerId: string) => {
    const spot = spotsById.get(markerId);
    if (spot?.place) {
      // spot에 저장된 이미지를 상세페이지에 전달
      const spotImages: string[] =
        spot.image_urls && spot.image_urls.length > 0
          ? spot.image_urls
          : spot.thumbnail_url
          ? [spot.thumbnail_url]
          : [];
      navigation.navigate('PlaceDetail', {
        placeId: `api-${spot.place_id}`,
        apiPlace: spot.place,
        spotImages,
      });
    }
  }, [spotsById, navigation]);

  // ── Edge Swipe ───────────────────────────────────────────
  const leftEdge = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dx > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => {
        const idx = currentIndex;
        if ((gs.dx > 50 || gs.vx > 0.5) && idx > 0) {
          tabNavigation.navigate(TAB_ORDER[idx - 1]);
        }
      },
    })
  ).current;

  const rightEdge = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dx < -10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => {
        const idx = currentIndex;
        if ((gs.dx < -50 || gs.vx < -0.5) && idx < TAB_ORDER.length - 1) {
          tabNavigation.navigate(TAB_ORDER[idx + 1]);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* ── 상단 헤더 + 보관함 필터 칩 ── */}
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        {/* 타이틀 행 */}
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>공간 지도</Text>
          <View style={styles.titleRight}>
            {isLoadingSpots && (
              <ActivityIndicator size="small" color={THEME.colors.textPlaceholder} style={{ marginRight: 4 }} />
            )}
            <Text style={styles.markerCount}>{markers.length}개</Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => loadAllSpots(storages)}
              disabled={isLoadingSpots}
            >
              <Ionicons name="refresh-outline" size={16} color={THEME.colors.textSub} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 보관함 필터 칩 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipBar}
        >
          {/* 전체 칩 */}
          <TouchableOpacity
            style={[styles.chip, selectedStorageId === null && styles.chipSelected]}
            onPress={() => setSelectedStorageId(null)}
          >
            <Ionicons
              name="bookmark-outline"
              size={12}
              color={selectedStorageId === null ? '#fff' : THEME.colors.textMuted}
            />
            <Text style={[styles.chipText, selectedStorageId === null && styles.chipTextSelected]}>
              전체
            </Text>
          </TouchableOpacity>

          {/* 각 보관함 칩 */}
          {storages.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, selectedStorageId === s.id && styles.chipSelected]}
              onPress={() => setSelectedStorageId(selectedStorageId === s.id ? null : s.id)}
            >
              <Ionicons
                name={s.is_public ? 'people-outline' : 'lock-closed-outline'}
                size={12}
                color={selectedStorageId === s.id ? '#fff' : THEME.colors.textMuted}
              />
              <Text
                style={[styles.chipText, selectedStorageId === s.id && styles.chipTextSelected]}
                numberOfLines={1}
              >
                {s.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* ── 네이버 지도 ── */}
      <NaverMapView markers={markers} onMarkerPress={handleMarkerPress} />

      {/* ── Edge Swipe 투명 레이어 ── */}
      <View style={styles.leftEdge} {...leftEdge.panHandlers} pointerEvents="box-only" />
      <View style={styles.rightEdge} {...rightEdge.panHandlers} pointerEvents="box-only" />

      {/* ── 장소 추가 FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPlace')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color={COLORS.white} style={{ marginRight: 4 }} />
        <Text style={styles.fabText}>장소 추가</Text>
      </TouchableOpacity>

      {/* ── 빈 상태 안내 (마커 없을 때) ── */}
      {!isLoadingSpots && markers.length === 0 && allSpots.length === 0 && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={24} color={THEME.colors.textPlaceholder} />
            <Text style={styles.emptyText}>저장한 공간이 없어요{'\n'}장소를 추가해보세요</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── 헤더 ──────────────────────────────────────────────
  headerArea: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.black,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markerCount: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textMuted,
    fontWeight: FONTS.weight.medium,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 필터 칩 ───────────────────────────────────────────
  chipBar: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    maxWidth: 120,
  },
  chipSelected: {
    backgroundColor: THEME.colors.accentDark,
    borderColor: THEME.colors.accentDark,
  },
  chipText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
    color: THEME.colors.textSub,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: FONTS.weight.semibold,
  },

  // ── Edge Swipe ─────────────────────────────────────────
  leftEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
  },
  rightEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
  },

  // ── FAB ────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentDark,
    borderRadius: 28,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    ...THEME.shadow.float,
  },
  fabText: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },

  // ── 빈 상태 오버레이 ────────────────────────────────────
  emptyOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.float,
  },
  emptyText: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textMuted,
    lineHeight: 18,
  },
});
