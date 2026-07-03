/**
 * src/features/profile/screens/DNAGuideScreen.tsx
 * 공간 DNA 8가지 유형 소개 화면
 *
 * 드로어 "공간 DNA 소개" 메뉴에서 진입
 * 각 유형 카드: 코드 / 축 조합 / 설명 / 이모지
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { THEME } from '../../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'DNAGuide'>;

// ── DNA 유형 데이터 ────────────────────────────────────────
interface DNAType {
  code: string;
  emoji: string;
  title: string;
  description: string;
  density:  { key: string; label: string };
  stimulus: { key: string; label: string };
  temporal: { key: string; label: string };
}

const DNA_TYPES: DNAType[] = [
  {
    code: 'DHF',
    emoji: '⚡',
    title: '핫플 헌터형',
    description: '항상 최신 핫플을 먼저 찾아다녀요. 사람 많고 화려하고 트렌디할수록 더 좋은 타입.',
    density:  { key: 'D', label: 'Dense · 붐빔, 활기' },
    stimulus: { key: 'H', label: 'High · 자극 강함, 화려함' },
    temporal: { key: 'F', label: 'Fresh · 최신, 현대적' },
  },
  {
    code: 'DHV',
    emoji: '🎭',
    title: '레트로 바이브형',
    description: '오래된 공간에서 터지는 에너지를 즐겨요. 북적이는 빈티지 바, 복고풍 클럽이 딱 맞는 타입.',
    density:  { key: 'D', label: 'Dense · 붐빔, 활기' },
    stimulus: { key: 'H', label: 'High · 자극 강함, 화려함' },
    temporal: { key: 'V', label: 'Vintage · 오래됨, 전통적' },
  },
  {
    code: 'DMF',
    emoji: '☕',
    title: '소셜 카페형',
    description: '사람이 많아도 자극은 적은 차분한 모던 카페 분위기가 가장 편해요.',
    density:  { key: 'D', label: 'Dense · 붐빔, 활기' },
    stimulus: { key: 'M', label: 'Mild · 자극 약함, 차분함' },
    temporal: { key: 'F', label: 'Fresh · 최신, 현대적' },
  },
  {
    code: 'DMV',
    emoji: '🏮',
    title: '로컬 라이프형',
    description: '동네 골목, 재래시장, 오래된 식당처럼 사람 냄새 나는 로컬 공간에서 편안함을 느껴요.',
    density:  { key: 'D', label: 'Dense · 붐빔, 활기' },
    stimulus: { key: 'M', label: 'Mild · 자극 약함, 차분함' },
    temporal: { key: 'V', label: 'Vintage · 오래됨, 전통적' },
  },
  {
    code: 'SHF',
    emoji: '🎨',
    title: '갤러리 탐방형',
    description: '조용하지만 감각적으로 자극되는 현대 예술 공간을 즐겨요. 현대 미술관, 감각적 전시가 최고.',
    density:  { key: 'S', label: 'Sparse · 여유, 조용' },
    stimulus: { key: 'H', label: 'High · 자극 강함, 화려함' },
    temporal: { key: 'F', label: 'Fresh · 최신, 현대적' },
  },
  {
    code: 'SHV',
    emoji: '🏛️',
    title: '박물관 러버형',
    description: '조용하면서도 풍부한 역사적 자극을 주는 공간에 매력을 느껴요. 유물과 역사 공간을 사랑해요.',
    density:  { key: 'S', label: 'Sparse · 여유, 조용' },
    stimulus: { key: 'H', label: 'High · 자극 강함, 화려함' },
    temporal: { key: 'V', label: 'Vintage · 오래됨, 전통적' },
  },
  {
    code: 'SMF',
    emoji: '🌿',
    title: '힐링 산책형',
    description: '조용하고 자극 없는 자연 속 여유로운 현대 공간을 사랑해요. 공원, 식물원, 테라스 카페.',
    density:  { key: 'S', label: 'Sparse · 여유, 조용' },
    stimulus: { key: 'M', label: 'Mild · 자극 약함, 차분함' },
    temporal: { key: 'F', label: 'Fresh · 최신, 현대적' },
  },
  {
    code: 'SMV',
    emoji: '🗺️',
    title: '고요한 탐험가형',
    description: '사람 없는 조용한 오래된 공간에서 깊은 사색을 즐겨요. 한옥, 절, 역사 골목을 좋아해요.',
    density:  { key: 'S', label: 'Sparse · 여유, 조용' },
    stimulus: { key: 'M', label: 'Mild · 자극 약함, 차분함' },
    temporal: { key: 'V', label: 'Vintage · 오래됨, 전통적' },
  },
];

// 축별 배경 색상
const AXIS_COLORS: Record<string, string> = {
  D: '#FFE8E8',
  S: '#E8F0FF',
  H: '#FFF3E0',
  M: '#E8F5E9',
  F: '#F3E8FF',
  V: '#FFF8E8',
};
const AXIS_TEXT_COLORS: Record<string, string> = {
  D: '#D13030',
  S: '#2563EB',
  H: '#C07000',
  M: '#2E7D32',
  F: '#6B21A8',
  V: '#92400E',
};

// ── DNA 카드 컴포넌트 ─────────────────────────────────────
interface DNACardProps {
  item: DNAType;
  expanded: boolean;
  onPress: () => void;
}

function DNACard({ item, expanded, onPress }: DNACardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* 카드 헤더 */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <View style={styles.cardTitles}>
          <Text style={styles.cardCode}>{item.code}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={THEME.colors.textMuted}
        />
      </View>

      {/* 확장 영역 */}
      {expanded && (
        <View style={styles.cardExpanded}>
          <Text style={styles.cardDesc}>{item.description}</Text>

          {/* 3축 태그 */}
          <View style={styles.axisRow}>
            {[
              { key: item.density.key,  label: item.density.label },
              { key: item.stimulus.key, label: item.stimulus.label },
              { key: item.temporal.key, label: item.temporal.label },
            ].map((axis) => (
              <View
                key={axis.key}
                style={[styles.axisTag, { backgroundColor: AXIS_COLORS[axis.key] }]}
              >
                <Text style={[styles.axisTagKey, { color: AXIS_TEXT_COLORS[axis.key] }]}>
                  {axis.key}
                </Text>
                <Text style={[styles.axisTagLabel, { color: AXIS_TEXT_COLORS[axis.key] }]}>
                  {axis.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────
export default function DNAGuideScreen({ navigation }: Props) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const handleCardPress = (code: string) => {
    setExpandedCode((prev) => (prev === code ? null : code));
  };

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
          <Text style={styles.pageTitle}>공간 DNA 소개</Text>
        </View>

        {/* 설명 */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>공간 DNA란?</Text>
          <Text style={styles.introDesc}>
            공간의 특성을 3가지 축으로 분류해{'\n'}
            나만의 공간 취향을 파악하는 기준이에요.
          </Text>
          {/* 3축 요약 */}
          <View style={styles.introAxes}>
            <View style={styles.introAxis}>
              <Text style={styles.introAxisTitle}>밀도 (D/S)</Text>
              <Text style={styles.introAxisDesc}>붐빔 ↔ 여유</Text>
            </View>
            <View style={styles.introAxisDivider} />
            <View style={styles.introAxis}>
              <Text style={styles.introAxisTitle}>자극 (H/M)</Text>
              <Text style={styles.introAxisDesc}>화려함 ↔ 차분함</Text>
            </View>
            <View style={styles.introAxisDivider} />
            <View style={styles.introAxis}>
              <Text style={styles.introAxisTitle}>시간성 (F/V)</Text>
              <Text style={styles.introAxisDesc}>현대적 ↔ 전통적</Text>
            </View>
          </View>
        </View>

        {/* 유형 목록 */}
        <Text style={styles.sectionHeader}>8가지 공간 유형</Text>
        <Text style={styles.sectionSub}>카드를 탭하면 상세 설명을 볼 수 있어요</Text>

        {DNA_TYPES.map((item) => (
          <DNACard
            key={item.code}
            item={item}
            expanded={expandedCode === item.code}
            onPress={() => handleCardPress(item.code)}
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

  introCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  introTitle: {
    fontSize: THEME.font.size.lg,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: 8,
  },
  introDesc: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
    lineHeight: 20,
    marginBottom: THEME.spacing.md,
  },
  introAxes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  introAxis: {
    flex: 1,
    alignItems: 'center',
  },
  introAxisTitle: {
    fontSize: THEME.font.size.xs,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: 3,
  },
  introAxisDesc: {
    fontSize: THEME.font.size.xs,
    color: THEME.colors.textMuted,
  },
  introAxisDivider: {
    width: 1,
    height: 28,
    backgroundColor: THEME.colors.border,
  },

  sectionHeader: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.md,
  },

  // 카드
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  cardTitles: { flex: 1 },
  cardCode: {
    fontSize: THEME.font.size.xs,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: THEME.font.size.lg,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
  },

  // 확장 영역
  cardExpanded: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.divider,
  },
  cardDesc: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
    lineHeight: 21,
    marginBottom: THEME.spacing.md,
  },
  axisRow: {
    gap: THEME.spacing.sm,
  },
  axisTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  axisTagKey: {
    fontSize: THEME.font.size.md,
    fontWeight: THEME.font.weight.extrabold,
    width: 18,
    textAlign: 'center',
  },
  axisTagLabel: {
    fontSize: THEME.font.size.sm,
    fontWeight: THEME.font.weight.medium,
  },
});
