/**
 * src/features/auth/screens/SpaceDNAResultScreen.tsx
 * 공간 DNA 결과 화면
 * - 대표 타입 (DHV 등)
 * - 3개 축 퍼센트 바 시각화
 * - 설명 텍스트
 * - 회원가입 완료 버튼 (여기서 실제 API 호출)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../../navigation/types';
import { SpaceDNAResult } from '../../../types';
import { useAuthStore } from '../../../store/useAuthStore';
import { THEME, FONTS, SPACING, shadowStyle } from '../../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'SpaceDNAResult'>;

// ─── 설명 텍스트 ──────────────────────────────────────────

const DNA_DESCRIPTIONS: Record<string, string> = {
  DHF: '활기차고 강렬한 공간에서 에너지를 얻는 트렌디한 탐험가예요. 핫플을 누구보다 먼저 찾아가는 스타일이에요.',
  DHV: '북적이는 분위기를 좋아하지만, 감성과 역사가 깃든 공간에 더 깊은 매력을 느끼는 타입이에요. 사람 냄새 나는 빈티지 공간을 사랑해요.',
  DMF: '사람들과 어울리는 걸 즐기면서도 차분하고 세련된 공간을 선호해요. 인기 있는 신상 카페나 편안한 다이닝이 잘 어울려요.',
  DMV: '활기찬 공간을 좋아하지만 자극보다는 편안함을 추구해요. 오랫동안 사랑받아온 동네 맛집이나 감성 있는 로컬 카페가 제격이에요.',
  SHF: '조용하고 개성 강한 공간에서 특별한 감성을 찾는 타입이에요. 독특한 컨셉의 신상 공간을 혼자 발견하는 걸 즐겨요.',
  SHV: '혼자만 알고 싶은 숨은 빈티지 공간을 찾아다니는 감성 탐험가예요. 강렬한 분위기와 오래된 감성의 조합에 강하게 끌려요.',
  SMF: '미니멀하고 세련된 신상 공간을 선호해요. 트렌디하면서도 과하지 않은 편안한 분위기의 공간이 딱 어울려요.',
  SMV: '조용하고 따뜻한 감성의 공간을 사랑해요. 시간의 흔적이 느껴지는 아늑한 단골 공간이 당신의 진짜 안식처예요.',
};

// ─── 축 색상 ──────────────────────────────────────────────

const AXIS_COLORS = {
  dense:   '#E85D04',
  sparse:  '#0077B6',
  high:    '#7B2FBE',
  mild:    '#52B788',
  fresh:   '#0096C7',
  vintage: '#8B5E3C',
};

// ─── 퍼센트 바 컴포넌트 ──────────────────────────────────

interface AxisBarProps {
  leftLabel: string;
  rightLabel: string;
  leftPct: number;
  leftColor: string;
  rightColor: string;
}

function AxisBar({ leftLabel, rightLabel, leftPct, leftColor, rightColor }: AxisBarProps) {
  const rightPct = 100 - leftPct;
  const dominant = leftPct >= 50 ? 'left' : 'right';

  return (
    <View style={barStyles.container}>
      {/* 라벨 행 */}
      <View style={barStyles.labelRow}>
        <View style={barStyles.labelLeft}>
          {dominant === 'left' && <Ionicons name="checkmark-circle" size={13} color={leftColor} />}
          <Text style={[barStyles.label, dominant === 'left' && { color: leftColor, fontWeight: FONTS.weight.semibold }]}>
            {leftLabel}
          </Text>
          <Text style={[barStyles.pct, { color: leftColor }]}>{leftPct}%</Text>
        </View>
        <View style={barStyles.labelRight}>
          <Text style={[barStyles.pct, { color: rightColor }]}>{rightPct}%</Text>
          <Text style={[barStyles.label, dominant === 'right' && { color: rightColor, fontWeight: FONTS.weight.semibold }]}>
            {rightLabel}
          </Text>
          {dominant === 'right' && <Ionicons name="checkmark-circle" size={13} color={rightColor} />}
        </View>
      </View>
      {/* 퍼센트 바 */}
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${leftPct}%` as any, backgroundColor: leftColor }]} />
        <View style={[barStyles.fill, { width: `${rightPct}%` as any, backgroundColor: rightColor }]} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textMuted,
    fontWeight: FONTS.weight.medium,
  },
  pct: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  track: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: THEME.colors.divider,
  },
  fill: { height: '100%' },
});

// ─── DNA 타입 뱃지 색상 ───────────────────────────────────

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    DHF: '#E85D04', DHV: '#8B5E3C', DMF: '#0096C7', DMV: '#52B788',
    SHF: '#7B2FBE', SHV: '#C77DFF', SMF: '#0077B6', SMV: '#6D6875',
  };
  return map[type] ?? THEME.colors.textMain;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────

export default function SpaceDNAResultScreen({ navigation, route }: Props) {
  const { email, password, nickname, spaceDNA } = route.params;
  const { signup, isLoading, error } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);

  const typeColor = getTypeColor(spaceDNA.type);
  const description = DNA_DESCRIPTIONS[spaceDNA.type] ?? '당신만의 독특한 공간 감각을 가지고 있어요.';

  const handleComplete = async () => {
    if (submitted) return;
    setSubmitted(true);
    await signup({ email, password, nickname, spaceDNA });
    // RootNavigator가 isLoggedIn 변화를 감지해 자동으로 MainTabs로 이동
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* 뒤로가기 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={THEME.colors.textMain} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 타이틀 */}
        <Text style={styles.eyebrow}>나의 공간 DNA</Text>

        {/* DNA 타입 뱃지 */}
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '18', borderColor: typeColor + '40' }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>{spaceDNA.type}</Text>
        </View>

        {/* 설명 */}
        <View style={styles.descCard}>
          <Text style={styles.descText}>{description}</Text>
        </View>

        {/* 축 분석 */}
        <View style={styles.axisSection}>
          <Text style={styles.axisSectionTitle}>축별 성향 분석</Text>

          <View style={styles.axisCard}>
            <View style={styles.axisHeader}>
              <View style={[styles.axisDot, { backgroundColor: AXIS_COLORS.dense }]} />
              <Text style={styles.axisTitle}>분위기 밀도</Text>
            </View>
            <AxisBar
              leftLabel="Dense"
              rightLabel="Sparse"
              leftPct={spaceDNA.density.dense}
              leftColor={AXIS_COLORS.dense}
              rightColor={AXIS_COLORS.sparse}
            />
          </View>

          <View style={styles.axisCard}>
            <View style={styles.axisHeader}>
              <View style={[styles.axisDot, { backgroundColor: AXIS_COLORS.high }]} />
              <Text style={styles.axisTitle}>자극 강도</Text>
            </View>
            <AxisBar
              leftLabel="High Stimulus"
              rightLabel="Mild Stimulus"
              leftPct={spaceDNA.stimulus.high}
              leftColor={AXIS_COLORS.high}
              rightColor={AXIS_COLORS.mild}
            />
          </View>

          <View style={styles.axisCard}>
            <View style={styles.axisHeader}>
              <View style={[styles.axisDot, { backgroundColor: AXIS_COLORS.fresh }]} />
              <Text style={styles.axisTitle}>시간성</Text>
            </View>
            <AxisBar
              leftLabel="Fresh"
              rightLabel="Vintage"
              leftPct={spaceDNA.temporal.fresh}
              leftColor={AXIS_COLORS.fresh}
              rightColor={AXIS_COLORS.vintage}
            />
          </View>
        </View>

        {/* 에러 */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* 완료 버튼 */}
        <TouchableOpacity
          style={[styles.completeBtn, isLoading && styles.completeBtnDisabled]}
          onPress={handleComplete}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.completeBtnText}>
            {isLoading ? '회원가입 중...' : '회원가입 완료'}
          </Text>
          {!isLoading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </TouchableOpacity>

        <Text style={styles.subHint}>
          나중에 설정에서 다시 검사할 수 있어요
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.bgBot,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 100 : 60,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },

  eyebrow: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  // 타입 뱃지
  typeBadge: {
    borderRadius: THEME.radius.xl,
    borderWidth: 2,
    paddingHorizontal: 36,
    paddingVertical: 20,
    marginBottom: SPACING.lg,
  },
  typeText: {
    fontSize: 52,
    fontWeight: FONTS.weight.extrabold,
    letterSpacing: 8,
  },

  // 설명 카드
  descCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...shadowStyle('soft'),
  },
  descText: {
    fontSize: FONTS.size.md,
    color: THEME.colors.textMain,
    lineHeight: 24,
    textAlign: 'center',
  },

  // 축 섹션
  axisSection: { width: '100%', marginBottom: SPACING.lg },
  axisSectionTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: SPACING.md,
  },
  axisCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...shadowStyle('soft'),
  },
  axisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  axisDot: { width: 8, height: 8, borderRadius: 4 },
  axisTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textMuted,
  },

  error: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.error,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },

  // 완료 버튼
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: THEME.radius.button,
    marginTop: SPACING.sm,
  },
  completeBtnDisabled: { opacity: 0.6 },
  completeBtnText: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: '#fff',
  },
  subHint: {
    marginTop: SPACING.md,
    fontSize: FONTS.size.xs,
    color: THEME.colors.textPlaceholder,
  },
});
