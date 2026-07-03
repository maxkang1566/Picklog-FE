/**
 * src/features/social/screens/CollaborativeScreen.tsx
 * 소셜 협업(Collaborative Mapping) 화면
 *
 * 기능:
 * - 내가 속한 그룹 목록
 * - 그룹별 공간 DNA 분석 결과
 * - 그룹 생성 버튼
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { FONTS, SPACING, THEME } from '../../../constants';
import { MOCK_GROUPS, Group } from '../../../services/mock/mockGroups';

type Props = NativeStackScreenProps<RootStackParamList, 'CollaborativeMap'>;

// ─── DNA 축 미니 바 ──────────────────────────────────────

interface MiniBarProps {
  label: string;
  leftKey: string;
  rightKey: string;
  leftValue: number;
  rightValue: number;
  leftColor: string;
  rightColor: string;
}

function MiniBar({ label, leftKey, rightKey, leftValue, rightValue, leftColor, rightColor }: MiniBarProps) {
  const dominant = leftValue >= rightValue ? leftKey : rightKey;
  return (
    <View style={miniBarStyles.wrap}>
      <View style={miniBarStyles.row}>
        <Text style={miniBarStyles.label}>{label}</Text>
        <Text style={miniBarStyles.dominant}>{dominant} 우세</Text>
      </View>
      <View style={miniBarStyles.track}>
        <View style={[miniBarStyles.fill, { width: `${leftValue}%` as `${number}%`, backgroundColor: leftColor }]} />
        <View style={[miniBarStyles.fill, { width: `${rightValue}%` as `${number}%`, backgroundColor: rightColor }]} />
      </View>
      <View style={miniBarStyles.labels}>
        <Text style={miniBarStyles.pct}>{leftKey} {leftValue}%</Text>
        <Text style={miniBarStyles.pct}>{rightKey} {rightValue}%</Text>
      </View>
    </View>
  );
}

const miniBarStyles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: FONTS.size.xs, color: THEME.colors.textSub, fontWeight: FONTS.weight.medium },
  dominant: { fontSize: FONTS.size.xs, color: THEME.colors.textMuted },
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: THEME.colors.divider,
    marginBottom: 3,
  },
  fill: { height: '100%' },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  pct: { fontSize: FONTS.size.xs, color: THEME.colors.textMuted },
});

// ─── 멤버 아바타 목록 ────────────────────────────────────

function MemberAvatars({ members }: { members: Group['members'] }) {
  return (
    <View style={avatarStyles.row}>
      {members.map((m, i) => (
        <View
          key={m.id}
          style={[avatarStyles.circle, { marginLeft: i === 0 ? 0 : -8 }]}
        >
          <Text style={avatarStyles.initial}>{m.profileInitial}</Text>
        </View>
      ))}
      <Text style={avatarStyles.names}>
        {members.map(m => m.nickname).join(', ')}
      </Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.accentSoft,
    borderWidth: 2,
    borderColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: FONTS.size.xs, fontWeight: FONTS.weight.bold, color: THEME.colors.textSub },
  names: { fontSize: FONTS.size.xs, color: THEME.colors.textMuted, marginLeft: 10 },
});

// ─── 그룹 카드 ───────────────────────────────────────────

function GroupCard({ group, onPress }: { group: Group; onPress: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={cardStyles.card}>
      {/* 카드 헤더 */}
      <TouchableOpacity
        style={cardStyles.header}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.8}
      >
        <Text style={cardStyles.emoji}>{group.coverEmoji}</Text>
        <View style={cardStyles.headerTexts}>
          <Text style={cardStyles.name}>{group.name}</Text>
          <Text style={cardStyles.desc} numberOfLines={1}>{group.description}</Text>
        </View>
        <View style={cardStyles.placeBadge}>
          <Text style={cardStyles.placeCount}>{group.placeIds.length}곳</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={THEME.colors.textMuted}
        />
      </TouchableOpacity>

      {/* 멤버 */}
      <MemberAvatars members={group.members} />

      {/* DNA 요약 + 확장 패널 */}
      <View style={cardStyles.dnaSummaryRow}>
        <View style={cardStyles.dnaCodeBadge}>
          <Text style={cardStyles.dnaCodeText}>{group.dna.code}</Text>
        </View>
        <Text style={cardStyles.dnaTitle}>{group.dna.title}</Text>
      </View>
      <Text style={cardStyles.dnaDesc}>{group.dna.description}</Text>

      {expanded && (
        <View style={cardStyles.expandedSection}>
          <Text style={cardStyles.expandedLabel}>그룹 공간 DNA 분석</Text>
          <MiniBar
            label="밀도 (Density)"
            leftKey="D" leftValue={group.dna.score.density.D} leftColor="#FF7B7B"
            rightKey="S" rightValue={group.dna.score.density.S} rightColor="#7BB8FF"
          />
          <MiniBar
            label="자극 (Stimulus)"
            leftKey="H" leftValue={group.dna.score.stimulus.H} leftColor="#FFB347"
            rightKey="M" rightValue={group.dna.score.stimulus.M} rightColor="#A8D8A8"
          />
          <MiniBar
            label="시간성 (Temporal)"
            leftKey="F" leftValue={group.dna.score.temporal.F} leftColor="#9B79E4"
            rightKey="V" rightValue={group.dna.score.temporal.V} rightColor="#C4956A"
          />
        </View>
      )}

      {/* 공간 보기 버튼 */}
      <TouchableOpacity style={cardStyles.viewBtn} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name="map-outline" size={14} color={THEME.colors.accentDark} />
        <Text style={cardStyles.viewBtnText}>공동 저장 공간 보기</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  emoji: { fontSize: 28 },
  headerTexts: { flex: 1 },
  name: { fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold, color: THEME.colors.textMain, marginBottom: 2 },
  desc: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted },
  placeBadge: {
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  placeCount: { fontSize: FONTS.size.xs, fontWeight: FONTS.weight.semibold, color: THEME.colors.textSub },
  dnaSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dnaCodeBadge: {
    backgroundColor: THEME.colors.accentDark,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dnaCodeText: { fontSize: FONTS.size.xs, fontWeight: FONTS.weight.bold, color: '#fff', letterSpacing: 1 },
  dnaTitle: { fontSize: FONTS.size.sm, fontWeight: FONTS.weight.semibold, color: THEME.colors.textSub },
  dnaDesc: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, marginBottom: 12, lineHeight: 18 },
  expandedSection: {
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: THEME.radius.sm,
    padding: SPACING.sm,
    marginBottom: 12,
  },
  expandedLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textSub,
    marginBottom: 10,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.sm,
    paddingVertical: 8,
  },
  viewBtnText: { fontSize: FONTS.size.sm, fontWeight: FONTS.weight.medium, color: THEME.colors.accentDark },
});

// ─── 메인 화면 ───────────────────────────────────────────

export default function CollaborativeScreen({ navigation }: Props) {
  const handleCreateGroup = () => {
    Alert.alert(
      '그룹 만들기',
      '친구를 초대해 공동 지도를 시작해보세요.\n(그룹 생성 기능은 준비 중입니다)',
      [{ text: '확인', style: 'default' }],
    );
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
          <Text style={styles.pageTitle}>함께하는 공간</Text>
        </View>

        {/* 소개 배너 */}
        <View style={styles.introBanner}>
          <Text style={styles.introEmoji}>🤝</Text>
          <View style={styles.introTexts}>
            <Text style={styles.introTitle}>Collaborative Mapping</Text>
            <Text style={styles.introDesc}>
              친구와 함께 하나의 지도 위에서{'\n'}공간을 저장하고 취향을 나눠요
            </Text>
          </View>
        </View>

        {/* 내 그룹 목록 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>내 그룹</Text>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreateGroup}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.createBtnText}>그룹 만들기</Text>
          </TouchableOpacity>
        </View>

        {MOCK_GROUPS.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            onPress={() =>
              Alert.alert(group.name, `${group.placeIds.length}개의 공동 저장 공간이 있어요.`)
            }
          />
        ))}

        {/* 안내 문구 */}
        <View style={styles.tipBox}>
          <Ionicons name="information-circle-outline" size={16} color={THEME.colors.textMuted} />
          <Text style={styles.tipText}>
            그룹 구성원들의 저장 공간을 분석해{'\n'}그룹만의 공간 DNA를 도출해드려요
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.colors.bgBot },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
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
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: THEME.colors.textMain,
    letterSpacing: -0.5,
  },

  introBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.textMain,
    borderRadius: THEME.radius.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 14,
  },
  introEmoji: { fontSize: 32 },
  introTexts: { flex: 1 },
  introTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  introDesc: {
    fontSize: FONTS.size.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: THEME.colors.textMain,
    letterSpacing: -0.3,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: THEME.radius.button,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createBtnText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: '#fff',
  },

  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: THEME.radius.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FONTS.size.sm,
    color: THEME.colors.textMuted,
    lineHeight: 18,
  },
});
