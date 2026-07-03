/**
 * src/features/place/screens/PlaceDetailScreen.tsx
 * 장소 상세 화면
 *
 * 두 가지 모드:
 *   A) Mock 모드: route.params.placeId → usePlaceStore 에서 조회 (기존)
 *   B) API 모드:  route.params.apiPlace → 네이버 검색 후 /places/from-naver 결과 표시 (신규)
 *
 * "보관함에 저장" 버튼은 API 모드에서만 표시됩니다.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { usePlaceStore } from '../../../store/usePlaceStore';
import { useStorageStore } from '../../../store/useStorageStore';
import { usePlaceSpaceDNA } from '../../../hooks/usePlaceSpaceDNA';
import { RootStackParamList } from '../../../navigation/types';
import { COLORS, FONTS, SPACING, TAG_LABELS, THEME } from '../../../constants';
import { MOCK_PLACE_DNA, DNA_AXIS_LABELS } from '../../../services/mock/mockPlaceDNA';
import { derivePlaceDNACode } from '../../../types/dna';
import spotService from '../../../services/spotService';
import { ApiStorage } from '../../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PlaceDetailScreen({ route, navigation }: Props) {
  const { placeId, apiPlace, spotImages = [] } = route.params;
  const isApiMode = Boolean(apiPlace);
  const [imageIndex, setImageIndex] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setImageIndex(index);
  };

  // ── 공간 DNA (API 모드 전용, place와 병렬로 fetch됨) ─────
  const { dna, isLoading: isDnaLoading } = usePlaceSpaceDNA(
    isApiMode ? apiPlace!.id : null,
  );

  // ── Mock 모드용 ──────────────────────────────────────────
  const { getPlaceById, isSaved, savePlace, unsavePlace, fetchPlaces, places } = usePlaceStore();

  useEffect(() => {
    if (!isApiMode && places.length === 0) fetchPlaces();
  }, []);

  const mockPlace = isApiMode ? null : getPlaceById(placeId);
  const saved = isApiMode ? false : isSaved(placeId);

  // ── 보관함 저장 모달 상태 ────────────────────────────────
  const { storages, fetchStorages } = useStorageStore();
  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStorageId, setSavedStorageId] = useState<number | null>(null);

  const handleOpenPicker = () => {
    fetchStorages();
    setShowPicker(true);
  };

  const handleSaveToStorage = async (storage: ApiStorage) => {
    if (!apiPlace || isSaving) return;
    setIsSaving(true);
    try {
      await spotService.createSpot(storage.id, {
        place_id: apiPlace.id,
        user_memo: '',
        instagram_url: null,
        thumbnail_url: null,
        user_rating: null,
      });
      setSavedStorageId(storage.id);
      setShowPicker(false);
      Alert.alert('저장 완료', `"${apiPlace.name}"이(가) "${storage.title}" 보관함에 저장됐어요!`);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: unknown } };
      console.error('[PlaceDetail] createSpot error:', err?.response?.status, err?.response?.data);
      Alert.alert('저장 실패', '보관함에 저장하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── 로딩 처리 (Mock 모드만) ──────────────────────────────
  if (!isApiMode && !mockPlace) {
    return <LoadingSpinner />;
  }

  // ── 표시할 데이터 통합 ────────────────────────────────────
  const displayName    = isApiMode ? apiPlace!.name    : mockPlace!.title;
  const displayAddress = isApiMode ? apiPlace!.address : mockPlace!.address;
  const displayPhone   = isApiMode ? apiPlace!.phone   : null;
  const displayCategory = isApiMode ? apiPlace!.category_group : null;
  const displayUrl     = isApiMode ? apiPlace!.homepage_url : null;
  const thumbnailUrl   = isApiMode ? null : mockPlace!.thumbnailUrl;

  const displayImages = isApiMode && spotImages.length > 0 ? spotImages : (thumbnailUrl ? [thumbnailUrl] : []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isApiMode ? 90 : 0 }}>

        {/* 대표 이미지 / 슬라이더 */}
        <View style={styles.imageContainer}>
          {displayImages.length > 0 ? (
            <ScrollView
              ref={imageScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleImageScroll}
              scrollEventThrottle={16}
              style={styles.imageSlider}
            >
              {displayImages.map((uri, idx) => (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={[styles.image, { width: SCREEN_WIDTH }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="location" size={48} color={THEME.colors.textPlaceholder} />
            </View>
          )}
          {/* 뒤로가기 */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          {/* 공유 */}
          <TouchableOpacity style={styles.shareButton} onPress={() => Alert.alert('공유', '공유 기능은 준비 중입니다.')}>
            <Ionicons name="share-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          {/* 페이지 인디케이터 */}
          {displayImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {displayImages.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, idx === imageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
          {/* 사진 카운터 */}
          {displayImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>{imageIndex + 1} / {displayImages.length}</Text>
            </View>
          )}
        </View>

        {/* 상세 정보 */}
        <View style={styles.content}>

          {/* 제목 & 북마크(Mock) / 카테고리 배지(API) */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{displayName}</Text>
            {!isApiMode && (
              <TouchableOpacity style={styles.saveBtn} onPress={() => saved ? unsavePlace(placeId) : savePlace(placeId)}>
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={saved ? COLORS.primary : THEME.colors.textSub}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* 카테고리 배지 (API 모드) */}
          {displayCategory && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{displayCategory}</Text>
            </View>
          )}

          {/* 주소 */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={THEME.colors.textMuted} />
            <Text style={styles.address}>{displayAddress}</Text>
          </View>

          {/* 전화번호 (API 모드) */}
          {displayPhone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={THEME.colors.textMuted} />
              <Text style={styles.infoText}>{displayPhone}</Text>
            </View>
          ) : null}

          {/* 홈페이지 (API 모드) */}
          {displayUrl ? (
            <View style={styles.infoRow}>
              <Ionicons name="globe-outline" size={16} color={THEME.colors.textMuted} />
              <Text style={styles.infoText} numberOfLines={1}>{displayUrl}</Text>
            </View>
          ) : null}

          {/* Mock 모드 전용 필드 */}
          {!isApiMode && mockPlace && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="bookmark-outline" size={16} color={THEME.colors.textMuted} />
                <Text style={styles.infoText}>{mockPlace.saveCount.toLocaleString()}명이 저장</Text>
              </View>
              <View style={styles.tagsContainer}>
                {mockPlace.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{TAG_LABELS[tag] ?? tag}</Text>
                  </View>
                ))}
              </View>
              {mockPlace.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionTitle}>소개</Text>
                  <Text style={styles.description}>{mockPlace.description}</Text>
                </View>
              )}
            </>
          )}

          {/* AI 태그 섹션 */}
          <View style={styles.aiSection}>
            <View style={styles.aiSectionHeader}>
              <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
              <Text style={styles.aiSectionTitle}> AI 분석 태그</Text>
              <Text style={styles.comingSoon}>준비 중</Text>
            </View>
            <Text style={styles.aiSectionDesc}>
              AI가 이미지를 분석해 자동으로 태그를 달아드릴 예정이에요.
            </Text>
          </View>

          {/* 공간 DNA (API 모드 전용) */}
          {isApiMode && (
            <View style={styles.dnaSection}>
              <View style={styles.dnaSectionHeader}>
                <Ionicons name="analytics-outline" size={16} color={COLORS.primary} />
                <Text style={styles.dnaSectionTitle}> 공간 DNA</Text>
                {dna?.has_data && (
                  <View style={styles.dnaCodeBadge}>
                    <Text style={styles.dnaCodeText}>
                      {derivePlaceDNACode(dna.mbti_axes)}
                    </Text>
                  </View>
                )}
              </View>

              {isDnaLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 8 }} />
              ) : !dna || !dna.has_data ? (
                <Text style={styles.dnaFallbackText}>
                  아직 공간 DNA 분석이 진행되지 않았습니다.
                </Text>
              ) : (
                <>
                  {/* AI 요약 */}
                  {dna.ai_summary ? (
                    <Text style={styles.dnaAiSummary}>{dna.ai_summary}</Text>
                  ) : null}

                  {/* 축별 점수 바 */}
                  <View style={styles.dnaAxesRow}>
                    {(
                      [
                        {
                          label: '밀도',
                          score: dna.mbti_axes.density,
                          posKey: 'D', posName: '붐빔',
                          negKey: 'S', negName: '여유',
                          posColor: '#FF7B7B', negColor: '#7BB8FF',
                        },
                        {
                          label: '자극',
                          score: dna.mbti_axes.color,
                          posKey: 'H', posName: '자극 강함',
                          negKey: 'M', negName: '차분함',
                          posColor: '#FFB347', negColor: '#A8D8A8',
                        },
                        {
                          label: '시간성',
                          score: dna.mbti_axes.form,
                          posKey: 'F', posName: '현대적',
                          negKey: 'V', negName: '전통적',
                          posColor: '#9B79E4', negColor: '#C4956A',
                        },
                      ] as const
                    ).map((axis, i) => {
                      const isPos = axis.score > 50;
                      const key   = isPos ? axis.posKey  : axis.negKey;
                      const name  = isPos ? axis.posName : axis.negName;
                      const color = isPos ? axis.posColor : axis.negColor;
                      const pct   = Math.round(isPos ? axis.score : 100 - axis.score);
                      return (
                        <React.Fragment key={axis.label}>
                          {i > 0 && <Text style={styles.dnaAxisDivider}>·</Text>}
                          <View style={styles.dnaAxisChip}>
                            <Text style={styles.dnaAxisKey}>{key}</Text>
                            <Text style={styles.dnaAxisName}>{name}</Text>
                            <Text style={styles.dnaAxisLabel}>{axis.label}</Text>
                            <View style={styles.dnaAxisBarTrack}>
                              <View
                                style={[
                                  styles.dnaAxisBarFill,
                                  { width: `${pct}%` as `${number}%`, backgroundColor: color },
                                ]}
                              />
                            </View>
                            <Text style={styles.dnaAxisPct}>{pct}%</Text>
                          </View>
                        </React.Fragment>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Mock 공간 DNA (Mock 모드 전용) */}
          {!isApiMode && MOCK_PLACE_DNA[placeId] ? (
            <View style={styles.dnaSection}>
              <View style={styles.dnaSectionHeader}>
                <Ionicons name="analytics-outline" size={16} color={COLORS.primary} />
                <Text style={styles.dnaSectionTitle}> 공간 DNA</Text>
                <View style={styles.dnaCodeBadge}>
                  <Text style={styles.dnaCodeText}>{MOCK_PLACE_DNA[placeId].code}</Text>
                </View>
              </View>
              <View style={styles.dnaAxesRow}>
                {(['density', 'stimulus', 'temporal'] as const).map((axis, i) => {
                  const dna = MOCK_PLACE_DNA[placeId];
                  const key = dna[axis];
                  const axisLabels = DNA_AXIS_LABELS[axis] as Record<string, { key: string; name: string }>;
                  const label = axisLabels[key] ?? { key: key as string, name: '' };
                  const pct = axis === 'density'
                    ? (key === 'D' ? dna.score.density.D : dna.score.density.S)
                    : axis === 'stimulus'
                    ? (key === 'H' ? dna.score.stimulus.H : dna.score.stimulus.M)
                    : (key === 'F' ? dna.score.temporal.F : dna.score.temporal.V);
                  const color = key === 'D' ? '#FF7B7B' : key === 'S' ? '#7BB8FF'
                    : key === 'H' ? '#FFB347' : key === 'M' ? '#A8D8A8'
                    : key === 'F' ? '#9B79E4' : '#C4956A';
                  const axisLabel = axis === 'density' ? '밀도' : axis === 'stimulus' ? '자극' : '시간성';
                  return (
                    <React.Fragment key={axis}>
                      {i > 0 && <Text style={styles.dnaAxisDivider}>·</Text>}
                      <View style={styles.dnaAxisChip}>
                        <Text style={styles.dnaAxisKey}>{label.key}</Text>
                        <Text style={styles.dnaAxisName}>{label.name}</Text>
                        <Text style={styles.dnaAxisLabel}>{axisLabel}</Text>
                        <View style={styles.dnaAxisBarTrack}>
                          <View style={[styles.dnaAxisBarFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
                        </View>
                        <Text style={styles.dnaAxisPct}>{pct}%</Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* 출처 (Mock 모드) */}
          {!isApiMode && mockPlace && (
            <Text style={styles.sourceText}>
              출처: {mockPlace.sourceType} · {new Date(mockPlace.createdAt).toLocaleDateString('ko-KR')}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ── 보관함에 저장 버튼 (API 모드 전용) ── */}
      {isApiMode && (
        <View style={styles.saveBarWrap}>
          <TouchableOpacity
            style={[styles.saveBar, savedStorageId !== null && styles.saveBarSaved]}
            onPress={savedStorageId !== null ? undefined : handleOpenPicker}
            activeOpacity={0.85}
          >
            <Ionicons
              name={savedStorageId !== null ? 'checkmark-circle' : 'add-circle-outline'}
              size={22}
              color={COLORS.white}
            />
            <Text style={styles.saveBarText}>
              {savedStorageId !== null ? '보관함에 저장됨' : '보관함에 저장하기'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── 보관함 선택 모달 ── */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={() => setShowPicker(false)} />
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>저장할 보관함 선택</Text>

            {storages.length === 0 ? (
              <View style={modalStyles.emptyWrap}>
                <Ionicons name="folder-open-outline" size={40} color={THEME.colors.textPlaceholder} />
                <Text style={modalStyles.emptyText}>보관함이 없습니다.{'\n'}저장한 공간 탭에서 먼저 보관함을 만들어주세요.</Text>
              </View>
            ) : (
              <FlatList
                data={storages}
                keyExtractor={(s) => String(s.id)}
                style={modalStyles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={modalStyles.storageItem}
                    onPress={() => handleSaveToStorage(item)}
                    disabled={isSaving}
                  >
                    <View style={modalStyles.storageIcon}>
                      <Ionicons
                        name={item.is_public ? 'people-outline' : 'lock-closed-outline'}
                        size={18}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={modalStyles.storageInfo}>
                      <Text style={modalStyles.storageTitle}>{item.title}</Text>
                      <Text style={modalStyles.storageMeta}>
                        {item.is_public ? '공개' : '비공개'} 보관함
                      </Text>
                    </View>
                    {isSaving
                      ? <ActivityIndicator size="small" color={COLORS.primary} />
                      : <Ionicons name="chevron-forward" size={16} color={THEME.colors.textPlaceholder} />
                    }
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setShowPicker(false)}>
              <Text style={modalStyles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── 스타일 ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  imageContainer: { position: 'relative', height: 260 },
  imageSlider: { height: 260 },
  image: { height: 260, backgroundColor: THEME.colors.accentSoft },
  imagePlaceholder: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  dotsContainer: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: COLORS.white, width: 18 },
  imageCounter: {
    position: 'absolute', top: 16, right: 56,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  imageCounterText: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  backButton: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8,
  },
  shareButton: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8,
  },
  content: { padding: SPACING.md },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: SPACING.sm,
  },
  title: {
    flex: 1, fontSize: FONTS.size.xxl, fontWeight: FONTS.weight.bold,
    color: COLORS.black, marginRight: SPACING.md,
  },
  saveBtn: { padding: 4 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: SPACING.sm,
  },
  categoryText: { fontSize: FONTS.size.xs, color: COLORS.primary, fontWeight: FONTS.weight.semibold },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 8,
  },
  address: { fontSize: FONTS.size.md, color: THEME.colors.textSub, flex: 1 },
  infoText: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, flex: 1 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: SPACING.md },
  tag: { backgroundColor: COLORS.primaryLight, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: FONTS.size.sm, color: COLORS.primary, fontWeight: FONTS.weight.medium },
  descriptionContainer: { marginBottom: SPACING.md },
  descriptionTitle: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold, color: COLORS.black, marginBottom: SPACING.sm },
  description: { fontSize: FONTS.size.md, color: THEME.colors.textSub, lineHeight: 24 },
  aiSection: { backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md },
  aiSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  aiSectionTitle: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold, color: COLORS.primary, flex: 1 },
  comingSoon: { fontSize: FONTS.size.xs, color: THEME.colors.textMuted, backgroundColor: COLORS.white, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  aiSectionDesc: { fontSize: FONTS.size.sm, color: THEME.colors.textSub, lineHeight: 20 },
  sourceText: { fontSize: FONTS.size.xs, color: THEME.colors.textPlaceholder, marginTop: SPACING.sm },
  dnaSection: { backgroundColor: THEME.colors.accentSoft, borderRadius: THEME.radius.sm, padding: SPACING.md, marginBottom: SPACING.md },
  dnaSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dnaSectionTitle: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold, color: COLORS.primary, flex: 1 },
  dnaCodeBadge: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  dnaCodeText: { fontSize: FONTS.size.xs, fontWeight: FONTS.weight.bold, color: COLORS.white, letterSpacing: 1 },
  dnaAxesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dnaAxisChip: { flex: 1, alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 4 },
  dnaAxisKey: { fontSize: FONTS.size.xl, fontWeight: FONTS.weight.bold, color: COLORS.black, lineHeight: 26 },
  dnaAxisName: { fontSize: FONTS.size.xs, fontWeight: FONTS.weight.medium, color: THEME.colors.textSub, marginTop: 2 },
  dnaAxisLabel: { fontSize: FONTS.size.xs, color: THEME.colors.textPlaceholder, marginTop: 1 },
  dnaAxisDivider: { fontSize: 18, color: THEME.colors.textPlaceholder, marginHorizontal: 6 },
  dnaAxisBarTrack: { width: '100%', height: 4, borderRadius: 99, backgroundColor: THEME.colors.border, overflow: 'hidden', marginTop: 6 },
  dnaAxisBarFill: { height: '100%', borderRadius: 99 },
  dnaAxisPct: { fontSize: FONTS.size.xs, fontWeight: FONTS.weight.bold, color: THEME.colors.textSub, marginTop: 3 },
  dnaFallbackText: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, marginTop: 6, lineHeight: 20 },
  dnaAiSummary: { fontSize: FONTS.size.sm, color: THEME.colors.textSub, lineHeight: 20, marginBottom: 12 },

  // 보관함 저장 바
  saveBarWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.divider,
  },
  saveBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 14,
  },
  saveBarSaved: { backgroundColor: THEME.colors.textPlaceholder },
  saveBarText: { fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold, color: COLORS.white },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '70%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: THEME.colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  title: {
    fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold,
    color: COLORS.black, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },
  list: { maxHeight: 300 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 12, paddingHorizontal: SPACING.lg },
  emptyText: { fontSize: FONTS.size.md, color: THEME.colors.textMuted, textAlign: 'center', lineHeight: 22 },
  storageItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.colors.divider,
    gap: SPACING.md,
  },
  storageIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  storageInfo: { flex: 1 },
  storageTitle: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold, color: COLORS.black },
  storageMeta: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, marginTop: 2 },
  cancelBtn: {
    marginTop: SPACING.md, marginHorizontal: SPACING.lg,
    paddingVertical: 12, borderRadius: THEME.radius.button,
    borderWidth: 1, borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: FONTS.size.md, color: THEME.colors.textSub, fontWeight: FONTS.weight.medium },
});
