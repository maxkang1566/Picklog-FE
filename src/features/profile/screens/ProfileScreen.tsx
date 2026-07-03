/**
 * src/features/profile/screens/ProfileScreen.tsx
 * 프로필 화면 — 유저 정보 + 공간 DNA 시각화
 *
 * 포함 항목:
 * - 프로필 카드 (아바타, 닉네임, 저장 장소 수)
 * - 공간 DNA 결과 카드 (코드 + 성향 설명)
 * - 3축 비율 바 (Density / Stimulus / Temporal)
 * - "지금 당장 갈 곳 추천" 버튼
 */

import React, { useMemo, useEffect, useState } from 'react';
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
import { UserSpaceDNA, SpaceDNAResult } from '../../../types/dna';
import dnaService from '../../../services/dnaService';
import { usePlaceStore } from '../../../store/usePlaceStore';
import { useAuthStore } from '../../../store/useAuthStore';

/** SpaceDNAResult (quiz output) → UserSpaceDNA (display format) */
function convertDNA(raw: SpaceDNAResult): UserSpaceDNA {
  const t = raw.type; // e.g. "SMV"
  return {
    userId: 'me',
    code: `${t[0]}-${t[1]}-${t[2]}`,   // "S-M-V"
    score: {
      D: raw.density.dense,
      S: raw.density.sparse,
      H: raw.stimulus.high,
      M: raw.stimulus.mild,
      F: raw.temporal.fresh,
      V: raw.temporal.vintage,
    },
    placeCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// ── DNA 비율 바 컴포넌트 ──────────────────────────────────
interface DNABarProps {
  leftLabel: string;
  rightLabel: string;
  leftKey: string;
  rightKey: string;
  leftValue: number;  // 퍼센트 (0~100)
  rightValue: number;
  axisLabel: string;
  leftColor: string;
  rightColor: string;
}

function DNABar({
  leftLabel,
  rightLabel,
  leftKey,
  rightKey,
  leftValue,
  rightValue,
  axisLabel,
  leftColor,
  rightColor,
}: DNABarProps) {
  const dominant = leftValue >= rightValue ? 'left' : 'right';

  return (
    <View style={barStyles.wrap}>
      <View style={barStyles.header}>
        <Text style={barStyles.axisLabel}>{axisLabel}</Text>
        <Text style={barStyles.dominant}>
          {dominant === 'left' ? leftKey : rightKey} 우세
        </Text>
      </View>

      {/* 바 트랙 */}
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${leftValue}%` as `${number}%`, backgroundColor: leftColor }]} />
        <View style={[barStyles.fill, { width: `${rightValue}%` as `${number}%`, backgroundColor: rightColor }]} />
      </View>

      {/* 레이블 */}
      <View style={barStyles.labels}>
        <View style={barStyles.labelLeft}>
          <View style={[barStyles.dot, { backgroundColor: leftColor }]} />
          <Text style={barStyles.labelKey}>{leftKey}</Text>
          <Text style={barStyles.labelName}>{leftLabel}</Text>
          <Text style={barStyles.labelPct}>{leftValue}%</Text>
        </View>
        <View style={barStyles.labelRight}>
          <Text style={barStyles.labelPct}>{rightValue}%</Text>
          <Text style={barStyles.labelName}>{rightLabel}</Text>
          <Text style={barStyles.labelKey}>{rightKey}</Text>
          <View style={[barStyles.dot, { backgroundColor: rightColor }]} />
        </View>
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  axisLabel: {
    fontSize: THEME.font.size.sm,
    fontWeight: THEME.font.weight.semibold,
    color: THEME.colors.textMain,
    letterSpacing: 0.2,
  },
  dominant: {
    fontSize: THEME.font.size.xs,
    color: THEME.colors.textMuted,
    fontWeight: THEME.font.weight.medium,
  },
  track: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: THEME.colors.tagBg,
    marginBottom: 8,
  },
  fill: {
    height: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  labelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  labelKey: {
    fontSize: THEME.font.size.xs,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
  },
  labelName: {
    fontSize: THEME.font.size.xs,
    color: THEME.colors.textMuted,
  },
  labelPct: {
    fontSize: THEME.font.size.xs,
    fontWeight: THEME.font.weight.semibold,
    color: THEME.colors.textMain,
  },
});

// ── 메인 화면 ─────────────────────────────────────────────
export default function ProfileScreen({ navigation }: Props) {
  const { user, spaceDNA: rawDNA, userDNA, refreshUserDNA } = useAuthStore();
  const { places, savedPlaceIds } = usePlaceStore();
  const [isDnaLoading, setIsDnaLoading] = useState(false);

  // 화면 진입 시마다 최신 DNA 재조회
  useEffect(() => {
    setIsDnaLoading(true);
    refreshUserDNA().finally(() => setIsDnaLoading(false));
  }, []);

  // userDNA(서버 갱신값)가 있으면 우선 사용, 없으면 퀴즈 결과 변환
  const dna: UserSpaceDNA | null = useMemo(
    () => userDNA ?? (rawDNA ? convertDNA(rawDNA) : null),
    [userDNA, rawDNA],
  );
  const dnaDesc = dna ? dnaService.getDNADescription(dna.code) : null;

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
          <Text style={styles.pageTitle}>내 공간 취향</Text>
        </View>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileImg}>
            <Text style={styles.profileInitial}>
              {user?.nickname ? user.nickname[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nickname ?? '–'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{places.length}</Text>
            <Text style={styles.statLabel}>기록</Text>
          </View>
          <View style={[styles.statBox, { marginLeft: THEME.spacing.sm }]}>
            <Text style={styles.statNum}>{savedPlaceIds.length}</Text>
            <Text style={styles.statLabel}>저장</Text>
          </View>
        </View>

        {/* 공간 DNA 섹션 */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>나의 공간 DNA</Text>
          {isDnaLoading && (
            <ActivityIndicator size="small" color={THEME.colors.textMuted} />
          )}
        </View>

        {dna && dnaDesc ? (
          <>
            {/* DNA 결과 카드 */}
            <View style={styles.dnaCard}>
              <View style={styles.dnaCardTop}>
                <Text style={styles.dnaEmoji}>{dnaDesc.emoji}</Text>
                <View style={styles.dnaCardTexts}>
                  <Text style={styles.dnaCode}>{dna.code}</Text>
                  <Text style={styles.dnaTitle}>{dnaDesc.title}</Text>
                </View>
              </View>
              <Text style={styles.dnaDesc}>{dnaDesc.description}</Text>
              <Text style={styles.dnaPlaceCount}>
                {dna.placeCount}개 장소 기록 기반 분석
              </Text>
            </View>

            {/* 3축 비율 그래프 */}
            <View style={styles.barsCard}>
              <Text style={styles.barsTitle}>공간 DNA 상세 분석</Text>

              <DNABar
                axisLabel="밀도 (Density)"
                leftKey="D"  leftLabel="붐빔"  leftValue={dna.score.D}  leftColor="#FF7B7B"
                rightKey="S" rightLabel="여유" rightValue={dna.score.S} rightColor="#7BB8FF"
              />
              <DNABar
                axisLabel="자극 (Stimulus)"
                leftKey="H"  leftLabel="자극 강함" leftValue={dna.score.H}  leftColor="#FFB347"
                rightKey="M" rightLabel="차분함"   rightValue={dna.score.M} rightColor="#A8D8A8"
              />
              <DNABar
                axisLabel="시간성 (Temporal)"
                leftKey="F"  leftLabel="현대적"  leftValue={dna.score.F}  leftColor="#9B79E4"
                rightKey="V" rightLabel="전통적" rightValue={dna.score.V} rightColor="#C4956A"
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="analytics-outline" size={36} color={THEME.colors.textMuted} />
            <Text style={styles.emptyText}>아직 분석할 장소가 없어요.</Text>
          </View>
        )}

        {/* 추천 버튼 */}
        <TouchableOpacity
          style={styles.recommendBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Recommendation', {})}
        >
          <Ionicons name="navigate-outline" size={20} color="#fff" />
          <View style={styles.recommendBtnTexts}>
            <Text style={styles.recommendBtnTitle}>지금 당장 갈 곳 추천</Text>
            <Text style={styles.recommendBtnSub}>내 DNA에 맞는 공간을 찾아드려요</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
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
    marginBottom: 28,
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

  profileCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  profileImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.accentSoft,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: THEME.font.size.lg,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: 3,
  },
  profileEmail: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
  },
  statBox: {
    alignItems: 'center',
    minWidth: 40,
  },
  statNum: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
  },
  statLabel: {
    fontSize: THEME.font.size.xs,
    color: THEME.colors.textMuted,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeader: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: THEME.spacing.md,
    letterSpacing: -0.3,
  },

  dnaCard: {
    backgroundColor: THEME.colors.textMain,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  dnaCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  dnaEmoji: {
    fontSize: 36,
  },
  dnaCardTexts: { flex: 1 },
  dnaCode: {
    fontSize: THEME.font.size.sm,
    fontWeight: THEME.font.weight.bold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 3,
  },
  dnaTitle: {
    fontSize: THEME.font.size.xxl,
    fontWeight: THEME.font.weight.extrabold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  dnaDesc: {
    fontSize: THEME.font.size.md,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    marginBottom: 12,
  },
  dnaPlaceCount: {
    fontSize: THEME.font.size.xs,
    color: 'rgba(255,255,255,0.45)',
  },

  barsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  barsTitle: {
    fontSize: THEME.font.size.md,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: THEME.spacing.lg,
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xxl,
    gap: 12,
  },
  emptyText: {
    fontSize: THEME.font.size.md,
    color: THEME.colors.textMuted,
  },

  recommendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.lg,
    ...THEME.shadow.soft,
  },
  recommendBtnTexts: { flex: 1 },
  recommendBtnTitle: {
    fontSize: THEME.font.size.lg,
    fontWeight: THEME.font.weight.bold,
    color: '#fff',
    marginBottom: 3,
  },
  recommendBtnSub: {
    fontSize: THEME.font.size.sm,
    color: 'rgba(255,255,255,0.7)',
  },
});
