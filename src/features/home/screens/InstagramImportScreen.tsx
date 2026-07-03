/**
 * src/features/home/screens/InstagramImportScreen.tsx
 *
 * 상태 머신:
 *   idle        → URL 입력
 *   backgrounded → 크롤링이 백그라운드에서 진행 중 (자유롭게 다른 화면 이동 가능)
 *   preview     → 미리보기 + 보관함 다중 선택 + 저장
 *   selecting   → 후보 장소 여러 개일 때 선택
 *   saving      → 저장 중
 *   done        → 저장 완료
 *   error       → 에러 + 재시도
 *
 * 크롤링 요청(POST /instagram/share)은 fire-and-forget으로 즉시 백그라운드 전환.
 * 결과는 useCrawlingStore → CrawlingPoller를 통해 전달되며,
 * 완료 시 HomeScreen 배너로 사용자에게 알린다.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width - 32; // padding 16*2
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { THEME, COLORS, FONTS, SPACING } from '../../../constants';
import instagramService, {
  ShareCandidate,
  ShareJobSpot,
  ShareResponse,
  CrawlData,
} from '../../../services/instagramService';
import spotService from '../../../services/spotService';
import { useStorageStore } from '../../../store/useStorageStore';
import useCrawlingStore from '../../../store/useCrawlingStore';

type Props = NativeStackScreenProps<RootStackParamList, 'InstagramImport'>;
type ScreenStep = 'idle' | 'backgrounded' | 'preview' | 'selecting' | 'saving' | 'done' | 'error';

// ─────────────────────────────────────────────────────────────────────────────

export default function InstagramImportScreen({ navigation }: Props) {
  const { storages, fetchStorages } = useStorageStore();

  const [step, setStep] = useState<ScreenStep>('idle');
  const [url, setUrl] = useState('');
  const [selectedStorageIds, setSelectedStorageIds] = useState<Set<number>>(new Set());

  // 크롤링 결과
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [candidates, setCandidates] = useState<ShareCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ShareCandidate | null>(null);
  // saved 케이스 (자동 확정된 spot)
  const [savedSpot, setSavedSpot] = useState<ShareJobSpot | null>(null);

  // 완료
  const [donePlaceName, setDonePlaceName] = useState('');
  const [doneStorageNames, setDoneStorageNames] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const isMountedRef = useRef(true);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const handlePreviewImageScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPreviewImageIndex(index);
  }, []);

  // ── 글로벌 크롤링 상태 구독 ────────────────────────────────────────────────
  const globalStatus = useCrawlingStore((s) => s.status);
  const globalResult = useCrawlingStore((s) => s.result);
  const globalErrorMsg = useCrawlingStore((s) => s.errorMsg);

  // ── share 결과 처리 ──────────────────────────────────────────────────────
  const handleShareResult = useCallback((res: ShareResponse) => {
    const result = res.result;
    if (!result) {
      setErrorMsg('크롤링 결과를 받지 못했습니다. 다시 시도해주세요.');
      setStep('error');
      return;
    }

    setCrawlData(result.crawl_data ?? null);

    // 자동 확정 저장 케이스 → 미리보기로 보여주고 추가 저장소 선택 가능
    if (result.status === 'saved' && result.spot) {
      setSavedSpot(result.spot);
      setSelectedStorageIds(new Set([result.spot.storage_id]));
      setStep('preview');
      return;
    }

    // 후보 선택 필요 케이스
    const list = result.candidates ?? [];
    setCandidates(list);

    if (list.length === 0) {
      setErrorMsg('게시물에서 장소를 찾지 못했습니다. 다른 게시물을 시도해주세요.');
      setStep('error');
      return;
    }

    setSelectedCandidate(list[0]);
    setStep('preview');
  }, []);

  // ── 마운트 시: 글로벌 크롤링 상태 확인 ────────────────────────────────────
  useEffect(() => {
    fetchStorages();

    const state = useCrawlingStore.getState();
    if (state.status === 'done' && state.result) {
      // 다른 화면에서 크롤링이 완료됨 → 바로 결과 표시
      handleShareResult(state.result);
      state.dismiss();
    } else if (state.status === 'submitting' || state.status === 'polling') {
      // 아직 진행 중
      setStep('backgrounded');
    } else if (state.status === 'error') {
      setErrorMsg(state.errorMsg);
      setStep('error');
      state.dismiss();
    }

    return () => { isMountedRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── backgrounded 상태에서 글로벌 완료/에러 감지 ────────────────────────────
  useEffect(() => {
    if (step !== 'backgrounded') return;

    if (globalStatus === 'done' && globalResult) {
      handleShareResult(globalResult);
      useCrawlingStore.getState().dismiss();
    } else if (globalStatus === 'error') {
      setErrorMsg(globalErrorMsg);
      setStep('error');
      useCrawlingStore.getState().dismiss();
    }
  }, [globalStatus, globalResult, step, globalErrorMsg, handleShareResult]);

  // ── 보관함 토글 ──────────────────────────────────────────────────────────
  const toggleStorage = useCallback((id: number) => {
    setSelectedStorageIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── 크롤링 시작 (fire-and-forget) ────────────────────────────────────────
  const handleShare = useCallback(() => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      Alert.alert('URL 입력 필요', '인스타그램 게시물 URL을 입력해주세요.');
      return;
    }
    if (!trimmedUrl.includes('instagram.com') && !trimmedUrl.includes('instagr.am')) {
      Alert.alert('URL 오류', '올바른 인스타그램 URL을 입력해주세요.');
      return;
    }
    if (storages.length === 0) {
      Alert.alert('보관함 없음', '보관함을 먼저 만들어주세요.');
      return;
    }

    const store = useCrawlingStore.getState();
    const capturedGen = store.generation;
    store.setSubmitting();
    setStep('backgrounded');

    const storageId = storages[0].id;

    instagramService.share(trimmedUrl, storageId)
      .then(shareRes => {
        // reset() 이 호출됐으면 generation이 달라져서 무시
        if (useCrawlingStore.getState().generation !== capturedGen) return;

        if (shareRes.status === 'pending' && shareRes.job_id) {
          useCrawlingStore.getState().startPolling(shareRes.job_id);
        } else if (shareRes.status === 'done') {
          useCrawlingStore.getState().setDone(shareRes);
        } else if (shareRes.status === 'error' || shareRes.error) {
          useCrawlingStore.getState().setError(shareRes.error ?? '크롤링에 실패했습니다.');
        } else {
          useCrawlingStore.getState().setError(`알 수 없는 응답 상태: ${shareRes.status}`);
        }
      })
      .catch((e: unknown) => {
        if (useCrawlingStore.getState().generation !== capturedGen) return;

        const err = e as { response?: { status?: number }; message?: string; code?: string };
        const isTimeout = err?.code === 'ECONNABORTED' || String(err?.message).includes('timeout');
        const httpStatus = err?.response?.status;
        let msg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        if (isTimeout)            msg = '서버 응답 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.';
        else if (httpStatus === 422) msg = '요청 형식이 올바르지 않습니다 (422).';
        else if (httpStatus === 500) msg = '서버 내부 오류입니다 (500).';
        else if (httpStatus === 401) msg = '인증이 필요합니다. 다시 로그인해주세요.';
        useCrawlingStore.getState().setError(msg);
      });
  }, [url, storages]);

  // ── needs_selection 케이스 저장 ──────────────────────────────────────────
  const handleSave = useCallback(async (candidate: ShareCandidate) => {
    if (selectedStorageIds.size === 0) {
      Alert.alert('보관함 선택 필요', '저장할 보관함을 하나 이상 선택해주세요.');
      return;
    }

    setStep('saving');

    const selectedList = storages.filter(s => selectedStorageIds.has(s.id));

    const saveBody = {
      instagram_url: crawlData?.url ?? url.trim(),
      caption: crawlData?.caption ?? null,
      thumbnail_url: crawlData?.thumbnail_url ?? (crawlData?.images?.[0] ?? null),
      image_urls: crawlData?.images ?? null,
      naver_place_id: candidate.naver_place_id,
      place_name: candidate.name,
      place_address: candidate.road_address ?? candidate.address ?? '',
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      category_group: candidate.category_group ?? null,
      place_raw_payload: candidate.raw_payload ?? null,
      user_memo: '',
      user_rating: 0,
    };

    try {
      await Promise.all(
        selectedList.map(s => instagramService.save({ ...saveBody, storage_id: s.id }))
      );
      setDonePlaceName(candidate.name);
      setDoneStorageNames(selectedList.map(s => s.title));
      setStep('done');
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      const httpStatus = err?.response?.status;
      let msg = '장소 저장에 실패했습니다. 잠시 후 다시 시도해주세요.';
      if (httpStatus === 422) msg = '저장 요청 형식이 올바르지 않습니다 (422).';
      if (httpStatus === 500) msg = '서버 오류로 저장에 실패했습니다 (500).';
      setErrorMsg(msg);
      setStep('error');
    }
  }, [crawlData, url, selectedStorageIds, storages]);

  // ── saved 케이스 추가 저장소 저장 ────────────────────────────────────────
  const handleConfirmSaved = useCallback(async () => {
    if (!savedSpot) return;
    if (selectedStorageIds.size === 0) {
      Alert.alert('보관함 선택 필요', '저장할 보관함을 하나 이상 선택해주세요.');
      return;
    }

    const additionalStorages = storages.filter(
      s => selectedStorageIds.has(s.id) && s.id !== savedSpot.storage_id
    );

    if (additionalStorages.length > 0) {
      setStep('saving');
      try {
        await Promise.all(
          additionalStorages.map(s =>
            spotService.createSpot(s.id, {
              place_id: savedSpot.place_id,
              instagram_url: savedSpot.instagram_url,
              thumbnail_url: savedSpot.thumbnail_url,
              image_urls: savedSpot.image_urls ?? null,
            })
          )
        );
      } catch (e: unknown) {
        const err = e as { response?: { status?: number } };
        setErrorMsg(`추가 저장에 실패했습니다 (${err?.response?.status ?? '알 수 없는 오류'})`);
        setStep('error');
        return;
      }
    }

    const selectedList = storages.filter(s => selectedStorageIds.has(s.id));
    setDonePlaceName(savedSpot.place?.name ?? '장소');
    setDoneStorageNames(selectedList.map(s => s.title));
    setStep('done');
  }, [savedSpot, selectedStorageIds, storages]);

  // ── 초기화 ───────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStep('idle');
    setUrl('');
    setSelectedStorageIds(new Set());
    setCandidates([]);
    setCrawlData(null);
    setSelectedCandidate(null);
    setSavedSpot(null);
    setDonePlaceName('');
    setDoneStorageNames([]);
    setErrorMsg('');
    useCrawlingStore.getState().reset();
  }, []);

  // ─── 완료 화면 ───────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={44} color="#fff" />
          </View>
          <Text style={styles.doneTitle}>저장 완료!</Text>
          <Text style={styles.doneSub}>
            {donePlaceName ? (
              <Text style={{ fontWeight: FONTS.weight.bold, color: THEME.colors.textMain }}>
                {donePlaceName}{'\n'}
              </Text>
            ) : null}
            {doneStorageNames.length > 0
              ? doneStorageNames.join(', ') + '에 저장되었어요.'
              : '보관함에 저장되었어요.'}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>확인</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={handleReset}>
            <Text style={styles.ghostBtnText}>다른 게시물 저장하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const previewImages: string[] = crawlData
    ? [
        ...(crawlData.thumbnail_url ? [crawlData.thumbnail_url] : []),
        ...(crawlData.images ?? []).filter(img => img !== crawlData.thumbnail_url),
      ]
    : [];
  const previewImage = previewImages[0] ?? null;

  // ─── 보관함 다중 선택 UI (공통) ──────────────────────────────────────────
  const StorageMultiSelect = ({ disabledId }: { disabledId?: number }) => (
    <View style={styles.section}>
      <Text style={styles.label}>저장할 보관함 (복수 선택 가능)</Text>
      {storages.map(storage => {
        const isSelected = selectedStorageIds.has(storage.id);
        const isDisabled = storage.id === disabledId;
        return (
          <TouchableOpacity
            key={storage.id}
            style={[styles.storageCheckItem, isSelected && styles.storageCheckItemSelected]}
            onPress={() => !isDisabled && toggleStorage(storage.id)}
            activeOpacity={isDisabled ? 1 : 0.75}
          >
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={22}
              color={isSelected ? COLORS.primary : THEME.colors.textPlaceholder}
            />
            <Ionicons
              name={storage.is_public ? 'people-outline' : 'lock-closed-outline'}
              size={15}
              color={isSelected ? COLORS.primary : THEME.colors.textPlaceholder}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.storageCheckText, isSelected && styles.storageCheckTextSelected]}>
                {storage.title}
              </Text>
              {isDisabled && (
                <Text style={styles.storageCheckSub}>이미 저장됨</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── 메인 화면 ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── 헤더 ── */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              disabled={step === 'saving'}
            >
              <Ionicons name="arrow-back" size={22} color={THEME.colors.textMain} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>인스타그램 가져오기</Text>
          </View>

          {/* ══ STEP: idle / error ══ */}
          {(step === 'idle' || step === 'error') && (
            <>
              <View style={styles.infoCard}>
                <Ionicons name="logo-instagram" size={26} color="#C13584" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>게시물 URL을 붙여넣으세요</Text>
                  <Text style={styles.infoSub}>/p/..., /reel/..., /share/... 모든 형식 지원</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>인스타그램 URL</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="link-outline" size={16} color={THEME.colors.textPlaceholder} />
                  <TextInput
                    style={styles.urlInput}
                    value={url}
                    onChangeText={setUrl}
                    placeholder="https://www.instagram.com/p/..."
                    placeholderTextColor={THEME.colors.textPlaceholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="done"
                  />
                  {url.length > 0 && (
                    <TouchableOpacity onPress={() => setUrl('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={16} color={THEME.colors.textPlaceholder} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {step === 'error' && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, !url.trim() && styles.submitBtnDisabled]}
                onPress={handleShare}
                disabled={!url.trim()}
              >
                <Ionicons name="search-outline" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {step === 'error' ? '다시 시도' : '장소 미리보기'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ══ STEP: backgrounded ══ */}
          {step === 'backgrounded' && (
            <View style={styles.backgroundedBox}>
              <View style={styles.backgroundedIconRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.backgroundedTitle}>분석이 시작됐어요!</Text>
              </View>
              <Text style={styles.backgroundedSub}>
                크롤링이 완료되면 홈 화면에서 알려드릴게요.{'\n'}
                다른 화면을 자유롭게 이용하실 수 있어요.
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="home-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>홈으로 돌아가기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={handleReset}>
                <Text style={styles.ghostBtnText}>취소하고 새 URL 입력하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ STEP: preview (saved) ══ */}
          {step === 'preview' && savedSpot && (
            <>
              {previewImages.length > 0 ? (
                <View style={styles.previewImageWrap}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handlePreviewImageScroll}
                    scrollEventThrottle={16}
                  >
                    {previewImages.map((uri, idx) => (
                      <Image
                        key={idx}
                        source={{ uri }}
                        style={[styles.previewImage, { width: SCREEN_WIDTH }]}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                  {previewImages.length > 1 && (
                    <View style={styles.previewDots}>
                      {previewImages.map((_, idx) => (
                        <View key={idx} style={[styles.previewDot, idx === previewImageIndex && styles.previewDotActive]} />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.previewImage, styles.previewImagePlaceholder]}>
                  <Ionicons name="image-outline" size={40} color={THEME.colors.textPlaceholder} />
                </View>
              )}

              <View style={styles.previewCard}>
                <View style={styles.previewCardHeader}>
                  <View style={styles.previewIconWrap}>
                    <Ionicons name="location" size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewPlaceName} numberOfLines={2}>
                      {savedSpot.place?.name ?? '장소'}
                    </Text>
                    {savedSpot.place?.address ? (
                      <Text style={styles.previewAddress} numberOfLines={1}>{savedSpot.place.address}</Text>
                    ) : null}
                    {savedSpot.place?.category_group ? (
                      <Text style={styles.previewCategory}>{savedSpot.place.category_group}</Text>
                    ) : null}
                  </View>
                </View>
                {crawlData?.caption ? (
                  <View style={styles.captionWrap}>
                    <Ionicons name="chatbubble-outline" size={13} color={THEME.colors.textPlaceholder} />
                    <Text style={styles.captionText} numberOfLines={3}>{crawlData.caption}</Text>
                  </View>
                ) : null}
                <View style={styles.dnaHint}>
                  <Ionicons name="analytics-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.dnaHintText}>저장 후 공간 DNA 분석이 시작됩니다</Text>
                </View>
              </View>

              <StorageMultiSelect disabledId={savedSpot.storage_id} />

              <TouchableOpacity
                style={[styles.submitBtn, selectedStorageIds.size === 0 && styles.submitBtnDisabled]}
                onPress={handleConfirmSaved}
                disabled={selectedStorageIds.size === 0}
              >
                <Ionicons name="bookmark" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {selectedStorageIds.size > 1
                    ? `${selectedStorageIds.size}개 보관함에 저장하기`
                    : '보관함에 저장 확인'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleReset}>
                <Text style={styles.cancelBtnText}>취소하고 다시 입력하기</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ══ STEP: preview (needs_selection) ══ */}
          {step === 'preview' && selectedCandidate && (
            <>
              {previewImages.length > 0 ? (
                <View style={styles.previewImageWrap}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handlePreviewImageScroll}
                    scrollEventThrottle={16}
                  >
                    {previewImages.map((uri, idx) => (
                      <Image
                        key={idx}
                        source={{ uri }}
                        style={[styles.previewImage, { width: SCREEN_WIDTH }]}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                  {previewImages.length > 1 && (
                    <View style={styles.previewDots}>
                      {previewImages.map((_, idx) => (
                        <View key={idx} style={[styles.previewDot, idx === previewImageIndex && styles.previewDotActive]} />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.previewImage, styles.previewImagePlaceholder]}>
                  <Ionicons name="image-outline" size={40} color={THEME.colors.textPlaceholder} />
                </View>
              )}

              <View style={styles.previewCard}>
                <View style={styles.previewCardHeader}>
                  <View style={styles.previewIconWrap}>
                    <Ionicons name="location" size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewPlaceName} numberOfLines={2}>
                      {selectedCandidate.name}
                    </Text>
                    {(selectedCandidate.road_address ?? selectedCandidate.address) ? (
                      <Text style={styles.previewAddress} numberOfLines={1}>
                        {selectedCandidate.road_address ?? selectedCandidate.address}
                      </Text>
                    ) : null}
                    {selectedCandidate.category_group ? (
                      <Text style={styles.previewCategory}>{selectedCandidate.category_group}</Text>
                    ) : null}
                  </View>
                </View>
                {crawlData?.caption ? (
                  <View style={styles.captionWrap}>
                    <Ionicons name="chatbubble-outline" size={13} color={THEME.colors.textPlaceholder} />
                    <Text style={styles.captionText} numberOfLines={3}>{crawlData.caption}</Text>
                  </View>
                ) : null}
                <View style={styles.dnaHint}>
                  <Ionicons name="analytics-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.dnaHintText}>저장 후 공간 DNA 분석이 시작됩니다</Text>
                </View>
              </View>

              {candidates.length > 1 && (
                <TouchableOpacity style={styles.switchCandidateBtn} onPress={() => setStep('selecting')}>
                  <Ionicons name="swap-horizontal-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.switchCandidateText}>
                    다른 장소 후보 보기 ({candidates.length}개)
                  </Text>
                </TouchableOpacity>
              )}

              <StorageMultiSelect />

              <TouchableOpacity
                style={[styles.submitBtn, selectedStorageIds.size === 0 && styles.submitBtnDisabled]}
                onPress={() => handleSave(selectedCandidate)}
                disabled={selectedStorageIds.size === 0}
              >
                <Ionicons name="bookmark" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {selectedStorageIds.size > 1
                    ? `${selectedStorageIds.size}개 보관함에 저장하기`
                    : '보관함에 저장하기'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleReset}>
                <Text style={styles.cancelBtnText}>취소하고 다시 입력하기</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ══ STEP: selecting ══ */}
          {step === 'selecting' && (
            <>
              <View style={styles.selectionHeader}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectionTitle}>어느 장소인가요?</Text>
                  <Text style={styles.selectionSub}>
                    {crawlData?.location_name
                      ? `"${crawlData.location_name}" 관련 장소를 찾았어요`
                      : '게시물에서 장소 후보를 찾았어요'}
                  </Text>
                </View>
              </View>

              {candidates.map((c, idx) => (
                <TouchableOpacity
                  key={c.naver_place_id ?? idx}
                  style={[
                    styles.candidateItem,
                    selectedCandidate?.naver_place_id === c.naver_place_id && styles.candidateItemSelected,
                  ]}
                  onPress={() => { setSelectedCandidate(c); setStep('preview'); }}
                  activeOpacity={0.75}
                >
                  <View style={styles.candidateIcon}>
                    <Ionicons name="location" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.candidateAddr} numberOfLines={1}>
                      {c.road_address ?? c.address ?? ''}
                    </Text>
                    {c.category_group ? (
                      <Text style={styles.candidateCategory}>{c.category_group}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={THEME.colors.textPlaceholder} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.cancelBtn} onPress={handleReset}>
                <Text style={styles.cancelBtnText}>취소하고 다시 입력하기</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ══ STEP: saving ══ */}
          {step === 'saving' && (
            <View style={styles.processingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingMsg}>보관함에 저장하고 있어요...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.colors.bgBot },
  flex: { flex: 1 },
  content: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  backBtn: {
    width: 38, height: 38, backgroundColor: THEME.colors.surface,
    borderRadius: 19, alignItems: 'center', justifyContent: 'center', ...THEME.shadow.soft,
  },
  pageTitle: { fontSize: THEME.font.size.xxl, fontWeight: THEME.font.weight.bold, color: THEME.colors.textMain, letterSpacing: -0.5 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: THEME.colors.surface, borderRadius: THEME.radius.lg,
    padding: SPACING.md, marginBottom: SPACING.lg, ...THEME.shadow.soft,
  },
  infoTitle: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold, color: THEME.colors.textMain, marginBottom: 3 },
  infoSub: { fontSize: FONTS.size.xs, color: THEME.colors.textMuted },

  section: { marginBottom: SPACING.lg },
  label: { fontSize: FONTS.size.sm, fontWeight: FONTS.weight.semibold, color: THEME.colors.textSub, marginBottom: 8, marginLeft: 4 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: THEME.colors.surface, borderRadius: THEME.radius.button,
    paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: THEME.colors.border,
  },
  urlInput: { flex: 1, fontSize: FONTS.size.md, color: THEME.colors.textMain, padding: 0 },

  storageCheckItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: THEME.colors.surface, borderRadius: THEME.radius.button,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: THEME.colors.border, marginBottom: 8,
  },
  storageCheckItemSelected: {
    borderColor: THEME.colors.accentDark, backgroundColor: THEME.colors.accentSoft,
  },
  storageCheckText: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.medium, color: THEME.colors.textSub },
  storageCheckTextSelected: { color: THEME.colors.textMain, fontWeight: FONTS.weight.semibold },
  storageCheckSub: { fontSize: FONTS.size.xs, color: COLORS.success, marginTop: 1 },

  // ── 백그라운드 크롤링 안내 ─────────────────────────────────────────────────
  backgroundedBox: {
    alignItems: 'center', gap: 16, paddingVertical: 44,
    backgroundColor: THEME.colors.surface, borderRadius: THEME.radius.lg,
    marginTop: 20, paddingHorizontal: SPACING.lg, ...THEME.shadow.soft,
  },
  backgroundedIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backgroundedTitle: { fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold, color: THEME.colors.textMain },
  backgroundedSub: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, textAlign: 'center', lineHeight: 20 },

  processingBox: {
    alignItems: 'center', gap: 14, paddingVertical: 40,
    backgroundColor: THEME.colors.surface, borderRadius: THEME.radius.lg,
    marginTop: 20, ...THEME.shadow.soft,
  },
  processingMsg: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold, color: THEME.colors.textMain, textAlign: 'center' },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: THEME.colors.heartBg, borderRadius: THEME.radius.sm, padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: { flex: 1, fontSize: FONTS.size.sm, color: COLORS.error, lineHeight: 20 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: THEME.colors.accentDark, borderRadius: THEME.radius.button, paddingVertical: 15,
    marginBottom: SPACING.sm,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#fff', fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold },

  previewImageWrap: {
    borderRadius: THEME.radius.lg, overflow: 'hidden',
    marginBottom: SPACING.md, backgroundColor: THEME.colors.accentSoft,
    height: 220, position: 'relative',
  },
  previewImage: {
    height: 220, backgroundColor: THEME.colors.accentSoft,
  },
  previewImagePlaceholder: { width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: THEME.radius.lg, marginBottom: SPACING.md },
  previewDots: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  previewDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  previewDotActive: { backgroundColor: COLORS.white, width: 16 },
  previewCard: {
    backgroundColor: THEME.colors.surface, borderRadius: THEME.radius.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: THEME.colors.border, ...THEME.shadow.soft,
  },
  previewCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: SPACING.sm },
  previewIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: THEME.colors.accentSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  previewPlaceName:{ fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold, color: THEME.colors.textMain, lineHeight: 24, marginBottom: 4 },
  previewAddress: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, marginBottom: 2 },
  previewCategory: { fontSize: FONTS.size.xs, color: COLORS.primary, fontWeight: FONTS.weight.medium },
  captionWrap: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: THEME.colors.accentSoft, borderRadius: THEME.radius.sm,
    padding: SPACING.sm, marginBottom: SPACING.sm,
  },
  captionText: { flex: 1, fontSize: FONTS.size.sm, color: THEME.colors.textSub, lineHeight: 20 },
  dnaHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: THEME.colors.accentSoft, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10,
  },
  dnaHintText: { fontSize: FONTS.size.xs, color: THEME.colors.textSub, fontWeight: FONTS.weight.medium },

  switchCandidateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', paddingVertical: 10, marginBottom: SPACING.md,
  },
  switchCandidateText: { fontSize: FONTS.size.sm, color: COLORS.primary, fontWeight: FONTS.weight.medium },

  selectionHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: THEME.colors.accentSoft, borderRadius: THEME.radius.sm, padding: SPACING.md, marginBottom: SPACING.md,
  },
  selectionTitle: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.bold, color: THEME.colors.textMain, marginBottom: 3 },
  selectionSub: { fontSize: FONTS.size.sm, color: THEME.colors.textSub },
  candidateItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: THEME.colors.surface, borderRadius: THEME.radius.sm,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: THEME.colors.border,
  },
  candidateItemSelected: { borderColor: THEME.colors.accentDark, borderWidth: 2 },
  candidateIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: THEME.colors.accentSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold, color: COLORS.black, marginBottom: 2 },
  candidateAddr: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, marginBottom: 2 },
  candidateCategory: { fontSize: FONTS.size.xs, color: COLORS.primary, fontWeight: FONTS.weight.medium },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: SPACING.xs },
  cancelBtnText: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, textDecorationLine: 'underline' },

  doneIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  doneTitle: { fontSize: 28, fontWeight: FONTS.weight.bold, color: THEME.colors.textMain, letterSpacing: -0.5 },
  doneSub: { fontSize: FONTS.size.md, color: THEME.colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.md },
  primaryBtn: { backgroundColor: THEME.colors.accentDark, borderRadius: THEME.radius.button, paddingVertical: 14, paddingHorizontal: 52 },
  primaryBtnText: { color: '#fff', fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold },
  ghostBtn: { paddingVertical: 10 },
  ghostBtnText: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, textDecorationLine: 'underline' },
});
