/**
 * src/features/saved/screens/SavedListScreen.tsx
 * 저장한 공간 목록 — Storage(보관함) API 연동
 *
 * 폴더 칩: 전체 / 실제 Storage 목록 (API)
 * "+" 버튼으로 새 보관함 생성
 * 칩 롱프레스 → 삭제
 */

import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useStorageStore } from '../../../store/useStorageStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSwipeTabNavigation } from '../../../hooks/useSwipeTabNavigation';
import { RootStackParamList } from '../../../navigation/types';
import { COLORS, FONTS, SPACING, THEME } from '../../../constants';
import { ApiSpot } from '../../../types/spot';
import spotService from '../../../services/spotService';
import dnaService from '../../../services/dnaService';
import { derivePlaceDNACode } from '../../../types/dna';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── 저장소 DNA 계산 ─────────────────────────────────────
interface StorageDNAResult {
  code: string;
  axes: { density: number; color: number; form: number };
  count: number; // 분석된 장소 수
}

async function calcStorageDNA(spots: ApiSpot[]): Promise<StorageDNAResult | null> {
  if (spots.length === 0) return null;
  const placeIds = [...new Set(spots.map((s) => s.place_id))];
  const results = await Promise.all(
    placeIds.map((id) => dnaService.getPlaceSpaceDNA(id))
  );
  const valid = results.filter((r) => r !== null && r.has_data);
  if (valid.length === 0) return null;
  const avgDensity = valid.reduce((s, r) => s + r!.mbti_axes.density, 0) / valid.length;
  const avgColor   = valid.reduce((s, r) => s + r!.mbti_axes.color,   0) / valid.length;
  const avgForm    = valid.reduce((s, r) => s + r!.mbti_axes.form,    0) / valid.length;
  return {
    code: derivePlaceDNACode({ density: avgDensity, color: avgColor, form: avgForm }),
    axes: {
      density: Math.round(avgDensity),
      color:   Math.round(avgColor),
      form:    Math.round(avgForm),
    },
    count: valid.length,
  };
}

// ─── SpotCard 컴포넌트 ───────────────────────────────────

interface SpotCardProps {
  spot: ApiSpot;
  onPress: () => void;
  onDelete?: () => void;
  onVisit?: () => void;
  isVisiting?: boolean;
}

const SpotCard = memo(function SpotCard({ spot, onPress, onDelete, onVisit, isVisiting }: SpotCardProps) {
  const place = spot.place;
  const visited = spot.is_visited;
  return (
    <TouchableOpacity style={spotCardStyles.card} onPress={onPress} activeOpacity={0.75}>
      {spot.thumbnail_url ? (
        <Image source={{ uri: spot.thumbnail_url }} style={spotCardStyles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={spotCardStyles.iconWrap}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
        </View>
      )}
      <View style={spotCardStyles.info}>
        <View style={spotCardStyles.nameRow}>
          <Text style={spotCardStyles.name} numberOfLines={1}>
            {place?.name ?? '이름 없는 장소'}
          </Text>
          {visited && (
            <View style={spotCardStyles.visitedBadge}>
              <Ionicons name="checkmark" size={10} color={COLORS.white} />
              <Text style={spotCardStyles.visitedBadgeText}>방문완료</Text>
            </View>
          )}
        </View>
        {place?.address ? (
          <Text style={spotCardStyles.address} numberOfLines={1}>{place.address}</Text>
        ) : null}
        {place?.category_group ? (
          <Text style={spotCardStyles.category}>{place.category_group}</Text>
        ) : null}
        {spot.user_memo ? (
          <Text style={spotCardStyles.memo} numberOfLines={1}>💬 {spot.user_memo}</Text>
        ) : null}
        {spot.thumbnail_url && (
          <Text style={spotCardStyles.igTag}>📷 인스타그램{(spot.image_urls?.length ?? 0) > 1 ? ` +${spot.image_urls!.length - 1}장` : ''}</Text>
        )}
      </View>
      <View style={spotCardStyles.actions}>
        {/* 방문 완료 버튼 */}
        {onVisit && (
          isVisiting ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: 4 }} />
          ) : (
            <TouchableOpacity
              onPress={onVisit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={spotCardStyles.visitBtn}
            >
              <Ionicons
                name={visited ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={22}
                color={visited ? THEME.colors.iosGreen : THEME.colors.textPlaceholder}
              />
            </TouchableOpacity>
          )
        )}
        {onDelete ? (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color={THEME.colors.textPlaceholder} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={THEME.colors.textPlaceholder} />
        )}
      </View>
    </TouchableOpacity>
  );
});

const spotCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: SPACING.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    flexShrink: 0,
    backgroundColor: THEME.colors.accentSoft,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: THEME.colors.iosGreen,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  visitedBadgeText: { fontSize: 9, color: COLORS.white, fontWeight: '600' },
  actions: { alignItems: 'center', gap: 6 },
  visitBtn: { padding: 2 },
  visitBtnDone: { opacity: 1 },
  name: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.black,
    marginBottom: 2,
  },
  address: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textMuted,
    marginBottom: 2,
  },
  category: {
    fontSize: FONTS.size.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weight.medium,
  },
  memo: {
    fontSize: FONTS.size.xs,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  igTag: {
    fontSize: FONTS.size.xs,
    color: '#C13584',
    marginTop: 2,
  },
});

// ─── 폴더 정의 ───────────────────────────────────────────

interface Folder {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  storageId?: number; // 실제 Storage ID (undefined = 전체)
}

const ALL_FOLDER: Folder = {
  id: 'all',
  label: '전체',
  icon: 'bookmark-outline',
};

// ─── 폴더 칩 컴포넌트 ────────────────────────────────────

interface FolderChipProps {
  folder: Folder;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

const FolderChip = memo(function FolderChip({ folder, selected, onPress, onLongPress }: FolderChipProps) {
  return (
    <TouchableOpacity
      style={[chipStyles.chip, selected && chipStyles.chipSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      <Ionicons
        name={folder.icon}
        size={13}
        color={selected ? '#fff' : THEME.colors.textMuted}
      />
      <Text style={[chipStyles.label, selected && chipStyles.labelSelected]}>
        {folder.label}
      </Text>
    </TouchableOpacity>
  );
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipSelected: {
    backgroundColor: THEME.colors.accentDark,
    borderColor: THEME.colors.accentDark,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: THEME.colors.textSub,
  },
  labelSelected: {
    color: '#fff',
    fontWeight: FONTS.weight.semibold,
  },
});

// ─── 메인 화면 ───────────────────────────────────────────

export default function SavedListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { storages, isLoading, fetchStorages, createStorage, deleteStorage } = useStorageStore();
  const { refreshUserDNA } = useAuthStore();
  const { panHandlers, animatedStyle } = useSwipeTabNavigation();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');

  // 전체 탭용 — 모든 보관함 spot 합산
  const [allSpots, setAllSpots] = useState<ApiSpot[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Spot 목록 (보관함 개별 선택 시 로드)
  const [spots, setSpots] = useState<ApiSpot[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState(false);
  const loadingForRef = useRef<string | null>(null);
  // storages를 ref로 유지 → loadAllSpots를 안정적인 참조로 만들기 위함
  const storagesRef = useRef(storages);
  // 이전에 로드한 storages ID 목록 → 동일하면 silent 갱신
  const prevStorageIdsRef = useRef<string>('');

  // 방문 완료 처리 중인 spot ID 추적
  const [visitingSpotId, setVisitingSpotId] = useState<number | null>(null);

  // 저장소 DNA (선택된 보관함의 종합 DNA)
  const [storageDNA, setStorageDNA] = useState<StorageDNAResult | null>(null);

  // 보관함 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 초대 코드 입력 모달
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchStorages();
  }, []);

  // storagesRef를 항상 최신 값으로 동기화
  useEffect(() => {
    storagesRef.current = storages;
  }, [storages]);

  // Storage → Folder 변환
  const folders: Folder[] = useMemo(() => [
    ALL_FOLDER,
    ...storages.map((s): Folder => ({
      id: String(s.id),
      label: s.title,
      icon: (s.is_public ? 'people-outline' : 'lock-closed-outline') as Folder['icon'],
      storageId: s.id,
    })),
  ], [storages]);

  // 보관함 폴더 선택 시 Spot 목록 로드
  const loadSpots = useCallback((folderId: string) => {
    if (folderId === 'all') {
      setSpots([]);
      return;
    }
    const storageId = Number(folderId);
    if (isNaN(storageId)) return;
    if (loadingForRef.current === folderId) return;
    loadingForRef.current = folderId;
    setIsLoadingSpots(true);
    spotService
      .getSpots(storageId)
      .then((data) => {
        console.log(`[SavedList] storage=${storageId} spots=${data.length}`,
          data.map(s => `${s.id}→"${s.place?.name ?? 'MISSING'}"`).join(', '));
        setSpots(data);
      })
      .catch(() => {
        Alert.alert('오류', '보관함 내용을 불러오지 못했습니다.');
        setSpots([]);
      })
      .finally(() => {
        setIsLoadingSpots(false);
        loadingForRef.current = null;
      });
  }, []);

  // storages는 ref로 접근 → useCallback deps에서 제거 → 참조 안정
  // silent=true 이면 이미 데이터가 있을 때 스피너 없이 백그라운드 갱신
  const loadAllSpots = useCallback(async (silent = false) => {
    if (storagesRef.current.length === 0) return;
    if (!silent) setIsLoadingAll(true);
    try {
      const results = await Promise.all(
        storagesRef.current.map((s) => spotService.getSpots(s.id)),
      );
      const combined = results.flat();
      const seen = new Set<number>();
      setAllSpots(combined.filter((s) => {
        if (seen.has(s.place_id)) return false;
        seen.add(s.place_id);
        return true;
      }));
    } catch {
      Alert.alert('오류', '전체 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingAll(false);
    }
  }, []); // storagesRef.current로 접근하므로 deps 없음 → 안정적인 참조

  // 탭 변경 시 spot 로드 + DNA 초기화
  useEffect(() => {
    setStorageDNA(null);
    if (selectedFolderId === 'all') loadAllSpots();
    else loadSpots(selectedFolderId);
  }, [selectedFolderId, loadSpots, loadAllSpots]);

  // 보관함 spots 로드 완료 후 DNA 백그라운드 계산
  useEffect(() => {
    if (selectedFolderId === 'all' || spots.length === 0) return;
    calcStorageDNA(spots).then((code) => setStorageDNA(code));
  }, [spots, selectedFolderId]);

  // storages 업데이트 시 전체 탭이면 재로드
  // ID 목록이 바뀌었을 때만 full 로드, 동일하면 silent 갱신 (스피너 없음)
  useEffect(() => {
    if (selectedFolderId !== 'all' || storages.length === 0) return;
    const newIds = storages.map((s) => s.id).sort().join(',');
    const idsChanged = newIds !== prevStorageIdsRef.current;
    prevStorageIdsRef.current = newIds;
    loadAllSpots(!idsChanged); // IDs 변경 시 full 로드, 동일하면 silent
  }, [storages]); // eslint-disable-line react-hooks/exhaustive-deps

  // 화면 포커스 시 보관함 목록 갱신 (loadAllSpots는 storages useEffect가 처리)
  useFocusEffect(
    useCallback(() => {
      fetchStorages();
      if (selectedFolderId !== 'all') {
        loadingForRef.current = null;
        loadSpots(selectedFolderId);
      }
      // 'all' 탭: fetchStorages → storages 변경 → 위 useEffect → loadAllSpots
    }, [selectedFolderId, loadSpots, fetchStorages]), // loadAllSpots 제거 → 루프 차단
  );

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? ALL_FOLDER;
  const isStorageFolder = selectedFolderId !== 'all';

  /** is_visited 토글 — 방문 완료 ↔ 취소 */
  const handleVisit = useCallback(async (spot: ApiSpot) => {
    if (visitingSpotId === spot.id) return;
    const newVisited = !spot.is_visited;
    console.log(`[handleVisit] spot=${spot.id} ${spot.is_visited ? 'true→false(취소)' : 'false→true(체크)'}`);
    setVisitingSpotId(spot.id);
    try {
      await spotService.updateSpot(spot.storage_id, spot.id, {
        instagram_url: spot.instagram_url,
        thumbnail_url: spot.thumbnail_url,
        user_memo: spot.user_memo,
        user_rating: spot.user_rating,
        is_visited: newVisited,
      });
      console.log(`[handleVisit] PUT 성공 → is_visited=${newVisited}`);

      const toggle = (s: ApiSpot) => s.id === spot.id ? { ...s, is_visited: newVisited } : s;
      setSpots((prev) => prev.map(toggle));
      setAllSpots((prev) => prev.map(toggle));

      console.log('[handleVisit] refreshUserDNA 호출');
      await refreshUserDNA();
      console.log('[handleVisit] refreshUserDNA 완료');
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      console.error(`[handleVisit] 실패 status=${status}`);
      if (status === 403) {
        Alert.alert('권한 없음', '뷰어 권한으로는 방문 처리를 할 수 없습니다.\n편집자(editor) 이상의 권한이 필요합니다.');
      } else {
        Alert.alert('오류', newVisited ? '방문 처리에 실패했습니다.' : '방문 취소에 실패했습니다.');
      }
    } finally {
      setVisitingSpotId(null);
    }
  }, [visitingSpotId, refreshUserDNA]);

  const renderStorageSpotItem = useCallback(({ item }: { item: ApiSpot }) => (
    <SpotCard
      spot={item}
      onPress={() => {
        if (item.place) {
          const spotImages = item.image_urls && item.image_urls.length > 0
            ? item.image_urls
            : item.thumbnail_url ? [item.thumbnail_url] : [];
          navigation.navigate('PlaceDetail', {
            placeId: `api-${item.place_id}`,
            apiPlace: item.place,
            spotImages,
          });
        }
      }}
      onVisit={() => handleVisit(item)}
      isVisiting={visitingSpotId === item.id}
      onDelete={() => {
        const storageId = item.storage_id;
        Alert.alert(
          '장소 삭제',
          `"${item.place?.name ?? `장소 #${item.place_id}`}"을(를)\n보관함에서 제거할까요?`,
          [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제',
              style: 'destructive',
              onPress: async () => {
                try {
                  await spotService.deleteSpot(storageId, item.id);
                  setSpots((prev) => prev.filter((s) => s.id !== item.id));
                } catch {
                  Alert.alert('오류', '삭제에 실패했습니다.');
                }
              },
            },
          ]
        );
      }}
    />
  ), [navigation, handleVisit, visitingSpotId]);

  const renderAllSpotItem = useCallback(({ item }: { item: ApiSpot }) => (
    <SpotCard
      spot={item}
      onPress={() => {
        if (item.place) {
          const spotImages = item.image_urls && item.image_urls.length > 0
            ? item.image_urls
            : item.thumbnail_url ? [item.thumbnail_url] : [];
          navigation.navigate('PlaceDetail', {
            placeId: `api-${item.place_id}`,
            apiPlace: item.place,
            spotImages,
          });
        }
      }}
      onVisit={() => handleVisit(item)}
      isVisiting={visitingSpotId === item.id}
    />
  ), [navigation, handleVisit, visitingSpotId]);

  const handleCreateStorage = useCallback(async () => {
    if (!newTitle.trim()) {
      Alert.alert('입력 오류', '보관함 이름을 입력해주세요.');
      return;
    }
    setIsCreating(true);
    try {
      await createStorage(newTitle.trim());
      setNewTitle('');
      setShowCreateModal(false);
    } catch {
      Alert.alert('오류', '보관함 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  }, [newTitle, createStorage]);

  const handleDeleteStorage = useCallback((folder: Folder) => {
    if (!folder.storageId) return;
    Alert.alert(
      '보관함 삭제',
      `"${folder.label}" 보관함을 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStorage(folder.storageId!);
              if (selectedFolderId === folder.id) setSelectedFolderId('all');
            } catch {
              Alert.alert('오류', '보관함 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  }, [deleteStorage, selectedFolderId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Animated.View style={[styles.flex, animatedStyle]} {...panHandlers}>

        {/* ── 헤더 ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>저장한 공간</Text>
          <View style={styles.headerRight}>
            {(isLoading || isLoadingSpots || isLoadingAll) && (
              <ActivityIndicator size="small" color={THEME.colors.textPlaceholder} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.countText}>
              {selectedFolderId === 'all' ? allSpots.length : spots.length}개
            </Text>
            {/* 초대 코드 입력 버튼 */}
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setShowInviteModal(true)}
            >
              <Ionicons name="enter-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 폴더 칩 스크롤 ── */}
        <View style={styles.folderBarWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.folderBar}
          >
            {folders.map((folder) => (
              <FolderChip
                key={folder.id}
                folder={folder}
                selected={selectedFolderId === folder.id}
                onPress={() => setSelectedFolderId(folder.id)}
                onLongPress={folder.storageId ? () => handleDeleteStorage(folder) : undefined}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Storage 정보 배너 ── */}
        {isStorageFolder && (() => {
          const curStorage = storages.find((s) => String(s.id) === selectedFolderId);
          const isOwner = curStorage?.role === 'owner' || curStorage?.role === undefined;
          const d = storageDNA;
          // 각 축: 우세한 쪽 키와 퍼센트
          const densityKey = d ? (d.axes.density > 50 ? 'D' : 'S') : null;
          const densityPct = d ? (d.axes.density > 50 ? d.axes.density : 100 - d.axes.density) : null;
          const colorKey   = d ? (d.axes.color   > 50 ? 'H' : 'M') : null;
          const colorPct   = d ? (d.axes.color   > 50 ? d.axes.color   : 100 - d.axes.color)   : null;
          const formKey    = d ? (d.axes.form    > 50 ? 'F' : 'V') : null;
          const formPct    = d ? (d.axes.form    > 50 ? d.axes.form    : 100 - d.axes.form)    : null;
          return (
            <View style={styles.storageBannerWrap}>
              {/* 첫째 줄: 아이콘 + 이름 + DNA 뱃지 + 초대 버튼 */}
              <View style={styles.storageBanner}>
                <Ionicons name={selectedFolder.icon} size={14} color={COLORS.primary} />
                <Text style={styles.storageBannerText}>
                  {selectedFolder.label}
                  {curStorage?.is_public ? ' · 공개 보관함' : ' · 비공개 보관함'}
                </Text>
                {d && (
                  <View style={styles.dnaBadge}>
                    <Text style={styles.dnaBadgeText}>{d.code}</Text>
                  </View>
                )}
                {isOwner && curStorage && (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('StorageInvitations', {
                        storageId: curStorage.id,
                        storageTitle: curStorage.title,
                      })
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* 둘째 줄: DNA 퍼센트 (분석된 장소가 있을 때만) */}
              {d && (
                <View style={styles.dnaAxesRow}>
                  {([
                    { key: densityKey, pct: densityPct, label: '밀도' },
                    { key: colorKey,   pct: colorPct,   label: '자극' },
                    { key: formKey,    pct: formPct,    label: '시간' },
                  ] as { key: string | null; pct: number | null; label: string }[]).map((axis) => (
                    <View key={axis.label} style={styles.dnaAxisItem}>
                      <Text style={styles.dnaAxisLabel}>{axis.label}</Text>
                      <View style={styles.dnaAxisBar}>
                        <View style={[styles.dnaAxisFill, { width: `${axis.pct ?? 0}%` as `${number}%` }]} />
                      </View>
                      <Text style={styles.dnaAxisPct}>
                        {axis.key} {axis.pct}%
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.dnaCountText}>{d.count}곳 분석</Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* ── 장소 목록 ── */}
        {isStorageFolder ? (
          /* 보관함 선택 → Spot 목록 표시 */
          isLoadingSpots ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.emptySubtitle}>불러오는 중...</Text>
            </View>
          ) : (
            <FlatList
              data={spots}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={renderStorageSpotItem}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="bookmark-outline" size={56} color={THEME.colors.textPlaceholder} />
                  <Text style={styles.emptyTitle}>보관함이 비어있어요</Text>
                  <Text style={styles.emptySubtitle}>
                    {`${selectedFolder.label}에\n장소를 추가해보세요`}
                  </Text>
                </View>
              }
            />
          )
        ) : (
          /* 전체 탭 → 모든 보관함 Spot 합산 */
          isLoadingAll ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.emptySubtitle}>불러오는 중...</Text>
            </View>
          ) : (
            <FlatList
              data={allSpots}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={renderAllSpotItem}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="bookmark-outline" size={56} color={THEME.colors.textPlaceholder} />
                  <Text style={styles.emptyTitle}>저장한 공간이 없어요</Text>
                  <Text style={styles.emptySubtitle}>
                    지도에서 장소를 검색해{'\n'}보관함에 저장해보세요
                  </Text>
                </View>
              }
            />
          )
        )}
      </Animated.View>

      {/* ── 보관함 생성 모달 ── */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <KeyboardAvoidingView
          style={modalStyles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={modalStyles.backdrop}
            activeOpacity={1}
            onPress={() => setShowCreateModal(false)}
          />
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>새 보관함 만들기</Text>
            <TextInput
              style={modalStyles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="보관함 이름을 입력해주세요"
              placeholderTextColor={THEME.colors.textPlaceholder}
              autoFocus
              maxLength={30}
            />
            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={() => { setShowCreateModal(false); setNewTitle(''); }}
              >
                <Text style={modalStyles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.createBtn, isCreating && { opacity: 0.6 }]}
                onPress={handleCreateStorage}
                disabled={isCreating}
              >
                {isCreating
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={modalStyles.createText}>만들기</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 초대 코드 입력 모달 ── */}
      <Modal visible={showInviteModal} transparent animationType="fade">
        <KeyboardAvoidingView
          style={modalStyles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={modalStyles.backdrop}
            activeOpacity={1}
            onPress={() => { setShowInviteModal(false); setInviteToken(''); }}
          />
          <View style={modalStyles.container}>
            <View style={modalStyles.inviteHeader}>
              <Ionicons name="enter-outline" size={22} color={COLORS.primary} />
              <Text style={modalStyles.title}>초대 코드 입력</Text>
            </View>
            <Text style={modalStyles.inviteDesc}>
              공유받은 초대 링크에서 토큰 부분을 붙여넣으세요.{'\n'}
              <Text style={modalStyles.inviteExample}>예) picklog://invitations/</Text>
              <Text style={[modalStyles.inviteExample, { color: COLORS.primary, fontWeight: FONTS.weight.bold }]}>abc123xyz</Text>
            </Text>
            <TextInput
              style={modalStyles.input}
              value={inviteToken}
              onChangeText={setInviteToken}
              placeholder="초대 토큰을 붙여넣으세요"
              placeholderTextColor={THEME.colors.textPlaceholder}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={() => { setShowInviteModal(false); setInviteToken(''); }}
              >
                <Text style={modalStyles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.createBtn, (isJoining || !inviteToken.trim()) && { opacity: 0.6 }]}
                onPress={() => {
                  const raw = inviteToken.trim();
                  // picklog://invitations/XXX 형태로 붙여넣어도 토큰만 추출
                  const token = raw.replace(/^.*invitations\//, '');
                  if (!token) {
                    Alert.alert('입력 오류', '초대 토큰을 입력해주세요.');
                    return;
                  }
                  setShowInviteModal(false);
                  setInviteToken('');
                  navigation.navigate('InvitationPreview', { token });
                }}
                disabled={isJoining || !inviteToken.trim()}
              >
                <Text style={modalStyles.createText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  countText: {
    fontSize: FONTS.size.md,
    color: THEME.colors.textMuted,
    fontWeight: FONTS.weight.medium,
  },
  inviteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  folderBarWrap: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  folderBar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    flexDirection: 'row',
  },

  storageBannerWrap: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  storageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dnaAxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dnaAxisItem: {
    flex: 1,
    gap: 3,
  },
  dnaAxisLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: FONTS.weight.medium,
  },
  dnaAxisBar: {
    height: 4,
    borderRadius: 99,
    backgroundColor: THEME.colors.border,
    overflow: 'hidden',
  },
  dnaAxisFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
  },
  dnaAxisPct: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: FONTS.weight.bold,
  },
  dnaCountText: {
    fontSize: 9,
    color: THEME.colors.textPlaceholder,
    alignSelf: 'flex-end',
    marginLeft: 2,
  },
  storageBannerText: {
    flex: 1,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.primary,
  },
  dnaBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dnaBadgeText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textSub,
  },
  emptySubtitle: {
    fontSize: FONTS.size.md,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: THEME.radius.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    zIndex: 1,
  },
  title: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.button,
    padding: SPACING.md,
    fontSize: FONTS.size.md,
    color: THEME.colors.textMain,
    backgroundColor: THEME.colors.bgMid,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.radius.button,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FONTS.size.md,
    color: THEME.colors.textSub,
    fontWeight: FONTS.weight.medium,
  },
  createBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.radius.button,
    backgroundColor: THEME.colors.accentDark,
    alignItems: 'center',
  },
  createText: {
    fontSize: FONTS.size.md,
    color: COLORS.white,
    fontWeight: FONTS.weight.semibold,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteDesc: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textMuted,
    lineHeight: 20,
  },
  inviteExample: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textPlaceholder,
  },
});
