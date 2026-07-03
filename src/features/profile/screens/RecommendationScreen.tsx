/**
 * src/features/profile/screens/RecommendationScreen.tsx
 * 공간 DNA 기반 장소 추천 화면
 *
 * - DNA 3축 필터 선택 UI (Density / Stimulus / Temporal)
 * - 선택에 따른 추천 장소 카드 리스트
 * - 로딩 / 에러 / 빈 상태 처리
 * - 추후 AI/BE 연동 시 dnaService.getRecommendations() 내부만 교체
 * - 이 화면도 실제로 구현까까지는 미정이지만, 추후 개선사항정도로 남겨두는게 좋을것같음.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { THEME } from '../../../constants';
import { Place } from '../../../types';
import { DensityAxis, StimulusAxis, TemporalAxis, DNAFilter } from '../../../types/dna';
import dnaService from '../../../services/dnaService';
import PlaceCard from '../../../components/common/PlaceCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Recommendation'>;

// ── 필터 칩 컴포넌트 ──────────────────────────────────────
interface FilterChipProps {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
  activeColor: string;
}

function FilterChip({ label, sub, active, onPress, activeColor }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[
        chipStyles.chip,
        active && { backgroundColor: activeColor, borderColor: activeColor },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[chipStyles.key, active && chipStyles.keyActive]}>{label}</Text>
      <Text style={[chipStyles.sub, active && chipStyles.subActive]}>{sub}</Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    minWidth: 72,
  },
  key: {
    fontSize: THEME.font.size.md,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
  },
  keyActive: {
    color: '#fff',
  },
  sub: {
    fontSize: THEME.font.size.xs,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  subActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});

// ── 메인 화면 ─────────────────────────────────────────────
export default function RecommendationScreen({ navigation, route }: Props) {
  const [density,  setDensity]  = useState<DensityAxis  | undefined>(undefined);
  const [stimulus, setStimulus] = useState<StimulusAxis | undefined>(undefined);
  const [temporal, setTemporal] = useState<TemporalAxis | undefined>(undefined);

  const [results,  setResults]  = useState<Place[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filter: DNAFilter = { density, stimulus, temporal };
    try {
      const places = await dnaService.getRecommendations(filter);
      setResults(places);
    } catch {
      setError('추천을 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [density, stimulus, temporal]);

  // 필터 변경 시 자동 재조회
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const activeCount = [density, stimulus, temporal].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={THEME.colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>지금 당장 갈 곳</Text>
        </View>

        {/* 서브타이틀 */}
        <Text style={styles.subTitle}>
          원하는 공간 DNA를 선택하면{'\n'}딱 맞는 장소를 찾아드려요 ✨
        </Text>

        {/* 필터 섹션 */}
        <View style={styles.filterSection}>

          {/* Density */}
          <Text style={styles.filterLabel}>밀도 (Density)</Text>
          <View style={styles.chipRow}>
            <FilterChip
              label="D" sub="붐빔 · 활기"
              active={density === 'D'}
              activeColor="#FF7B7B"
              onPress={() => setDensity(density === 'D' ? undefined : 'D')}
            />
            <FilterChip
              label="S" sub="여유 · 조용"
              active={density === 'S'}
              activeColor="#7BB8FF"
              onPress={() => setDensity(density === 'S' ? undefined : 'S')}
            />
          </View>

          {/* Stimulus */}
          <Text style={[styles.filterLabel, { marginTop: THEME.spacing.md }]}>자극 (Stimulus)</Text>
          <View style={styles.chipRow}>
            <FilterChip
              label="H" sub="자극 강함"
              active={stimulus === 'H'}
              activeColor="#FFB347"
              onPress={() => setStimulus(stimulus === 'H' ? undefined : 'H')}
            />
            <FilterChip
              label="M" sub="차분함"
              active={stimulus === 'M'}
              activeColor="#A8D8A8"
              onPress={() => setStimulus(stimulus === 'M' ? undefined : 'M')}
            />
          </View>

          {/* Temporal */}
          <Text style={[styles.filterLabel, { marginTop: THEME.spacing.md }]}>시간성 (Temporal)</Text>
          <View style={styles.chipRow}>
            <FilterChip
              label="F" sub="현대적 · 최신"
              active={temporal === 'F'}
              activeColor="#9B79E4"
              onPress={() => setTemporal(temporal === 'F' ? undefined : 'F')}
            />
            <FilterChip
              label="V" sub="전통 · 빈티지"
              active={temporal === 'V'}
              activeColor="#C4956A"
              onPress={() => setTemporal(temporal === 'V' ? undefined : 'V')}
            />
          </View>
        </View>

        {/* 결과 헤더 */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {activeCount > 0 ? `선택한 DNA 기반 추천` : '전체 추천'}
          </Text>
          {activeCount > 0 && (
            <TouchableOpacity
              onPress={() => { setDensity(undefined); setStimulus(undefined); setTemporal(undefined); }}
            >
              <Text style={styles.resetText}>초기화</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 로딩 */}
        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color={THEME.colors.textMuted} />
            <Text style={styles.stateText}>추천 장소를 찾는 중...</Text>
          </View>
        )}

        {/* 에러 */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color={THEME.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchRecommendations} style={styles.retryBtn}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 빈 결과 */}
        {!loading && !error && results.length === 0 && (
          <View style={styles.stateBox}>
            <Ionicons name="map-outline" size={36} color={THEME.colors.textMuted} />
            <Text style={styles.stateText}>조건에 맞는 장소가 없어요.{'\n'}필터를 바꿔보세요!</Text>
          </View>
        )}

        {/* 결과 카드 */}
        {!loading && !error && results.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.bgBot,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  pageTitle: {
    fontSize: THEME.font.size.xxl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    letterSpacing: -0.5,
  },

  subTitle: {
    fontSize: THEME.font.size.md,
    color: THEME.colors.textMuted,
    lineHeight: 22,
    marginBottom: THEME.spacing.lg,
  },

  filterSection: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  filterLabel: {
    fontSize: THEME.font.size.sm,
    fontWeight: THEME.font.weight.semibold,
    color: THEME.colors.textMuted,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },

  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  resultsTitle: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    letterSpacing: -0.3,
  },
  resetText: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
    fontWeight: THEME.font.weight.medium,
  },

  stateBox: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xxl,
    gap: 12,
  },
  stateText: {
    fontSize: THEME.font.size.md,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.heartBg,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: THEME.font.size.sm,
    color: THEME.colors.error,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: THEME.colors.error,
    borderRadius: THEME.radius.button,
  },
  retryText: {
    fontSize: THEME.font.size.xs,
    color: '#fff',
    fontWeight: THEME.font.weight.semibold,
  },
});
