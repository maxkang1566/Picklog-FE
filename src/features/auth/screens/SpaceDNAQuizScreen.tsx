/**
 * src/features/auth/screens/SpaceDNAQuizScreen.tsx
 * 공간 DNA 퀴즈 화면
 * - 16개 질문, 한 번에 한 문항씩
 * - 5점 척도 / 선택 시 자동 다음으로 이동
 * - 진행률 프로그레스 바
 * - 이전 질문 이동 가능
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { SpaceDNAResult } from '../../../types';
import { THEME, FONTS, SPACING, shadowStyle } from '../../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'SpaceDNAQuiz'>;

// ─── 질문 데이터 ──────────────────────────────────────────

type Axis = 'D' | 'S' | 'H' | 'M' | 'F' | 'V';

interface Question {
  id: number;
  text: string;
  primary: Axis;
  opposite: Axis;
  weight: number;
  section: '분위기 밀도' | '자극 강도' | '시간성';
}

const QUESTIONS: Question[] = [
  // 분위기 밀도 D/S
  { id: 1,  text: '나는 사람 많고 활기찬 공간에 있을 때 에너지를 얻는다.',             primary: 'D', opposite: 'S', weight: 3, section: '분위기 밀도' },
  { id: 2,  text: '나는 북적이는 핫플 거리나 인기 많은 장소에 끌린다.',               primary: 'D', opposite: 'S', weight: 2, section: '분위기 밀도' },
  { id: 3,  text: '나는 혼자 작업할 때도 적당한 소음이 있는 공간이 더 좋다.',         primary: 'D', opposite: 'S', weight: 3, section: '분위기 밀도' },
  { id: 4,  text: '나는 조용하고 한적한 공간에서 더 편안함을 느낀다.',               primary: 'S', opposite: 'D', weight: 3, section: '분위기 밀도' },
  { id: 5,  text: '나는 맛집을 고를 때 사람이 많은 인기 있는 곳을 더 신뢰한다.',     primary: 'D', opposite: 'S', weight: 2, section: '분위기 밀도' },
  { id: 6,  text: '나는 친구들과 만날 때 에너지 넘치는 공간을 선호한다.',             primary: 'D', opposite: 'S', weight: 2, section: '분위기 밀도' },
  // 자극 강도 H/M
  { id: 7,  text: '나는 화려하고 감각적인 인테리어의 공간에 끌린다.',                 primary: 'H', opposite: 'M', weight: 3, section: '자극 강도' },
  { id: 8,  text: '나는 음악, 조명, 색감이 강한 공간이 더 매력적으로 느껴진다.',     primary: 'H', opposite: 'M', weight: 3, section: '자극 강도' },
  { id: 9,  text: '나는 SNS에 올리고 싶은 강렬한 분위기의 공간을 좋아한다.',         primary: 'H', opposite: 'M', weight: 2, section: '자극 강도' },
  { id: 10, text: '나는 미니멀하고 편안한 분위기의 공간을 선호한다.',                 primary: 'M', opposite: 'H', weight: 3, section: '자극 강도' },
  { id: 11, text: '나는 공간을 고를 때 독특한 컨셉이 강한 곳에 더 끌린다.',          primary: 'H', opposite: 'M', weight: 2, section: '자극 강도' },
  // 시간성 F/V
  { id: 12, text: '나는 새로 오픈한 신상 공간을 찾아가는 것을 좋아한다.',             primary: 'F', opposite: 'V', weight: 3, section: '시간성' },
  { id: 13, text: '나는 요즘 유행하는 트렌디한 장소에 끌린다.',                       primary: 'F', opposite: 'V', weight: 2, section: '시간성' },
  { id: 14, text: '나는 오래된 감성과 시간의 흔적이 있는 공간을 좋아한다.',           primary: 'V', opposite: 'F', weight: 3, section: '시간성' },
  { id: 15, text: '나는 세련되고 최신 감각이 느껴지는 공간을 선호한다.',              primary: 'F', opposite: 'V', weight: 2, section: '시간성' },
  { id: 16, text: '나는 오래된 로컬 명소나 빈티지한 분위기의 장소에 끌린다.',        primary: 'V', opposite: 'F', weight: 2, section: '시간성' },
];

const CHOICES = [
  { label: '매우 그렇다', value: 1 },
  { label: '그렇다',     value: 2 },
  { label: '보통',       value: 3 },
  { label: '아니다',     value: 4 },
  { label: '매우 아니다', value: 5 },
];

const SECTION_COLORS: Record<string, string> = {
  '분위기 밀도': '#E85D04',
  '자극 강도':   '#7B2FBE',
  '시간성':      '#0077B6',
};

// ─── 점수 계산 ────────────────────────────────────────────

function calculateDNA(answers: number[]): SpaceDNAResult {
  const scores: Record<Axis, number> = { D: 0, S: 0, H: 0, M: 0, F: 0, V: 0 };

  QUESTIONS.forEach((q, idx) => {
    const r = answers[idx];
    const { primary, opposite, weight } = q;
    if      (r === 1) { scores[primary]  += weight; }
    else if (r === 2) { scores[primary]  += weight * (2 / 3); }
    else if (r === 3) { scores[primary]  += weight * 0.5; scores[opposite] += weight * 0.5; }
    else if (r === 4) { scores[opposite] += weight * (2 / 3); }
    else if (r === 5) { scores[opposite] += weight; }
  });

  const dTotal = scores.D + scores.S;
  const hTotal = scores.H + scores.M;
  const fTotal = scores.F + scores.V;

  const dense  = Math.round((scores.D / dTotal) * 100);
  const high   = Math.round((scores.H / hTotal) * 100);
  const fresh  = Math.round((scores.F / fTotal) * 100);

  return {
    density:  { dense,         sparse:  100 - dense  },
    stimulus: { high,          mild:    100 - high   },
    temporal: { fresh,         vintage: 100 - fresh  },
    type: `${dense >= 50 ? 'D' : 'S'}${high >= 50 ? 'H' : 'M'}${fresh >= 50 ? 'F' : 'V'}`,
  };
}

// ─── 컴포넌트 ─────────────────────────────────────────────

export default function SpaceDNAQuizScreen({ navigation, route }: Props) {
  const { email, password, nickname } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(QUESTIONS.length).fill(null),
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const question = QUESTIONS[currentIndex];
  const progress = (currentIndex + 1) / QUESTIONS.length;
  const sectionColor = SECTION_COLORS[question.section];

  const animateTransition = useCallback((callback: () => void) => {
    setIsTransitioning(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setIsTransitioning(false));
    });
  }, [fadeAnim]);

  const handleChoice = useCallback((value: number) => {
    if (isTransitioning) return;

    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;

    setTimeout(() => {
      if (currentIndex === QUESTIONS.length - 1) {
        const dna = calculateDNA(newAnswers as number[]);
        navigation.navigate('SpaceDNAResult', { email, password, nickname, spaceDNA: dna });
      } else {
        animateTransition(() => {
          setAnswers(newAnswers);
          setCurrentIndex((i) => i + 1);
        });
      }
    }, 300);

    setAnswers(newAnswers);
  }, [isTransitioning, answers, currentIndex, animateTransition, email, password, nickname, navigation]);

  const handleBack = useCallback(() => {
    if (currentIndex === 0) {
      navigation.goBack();
      return;
    }
    animateTransition(() => {
      setCurrentIndex((i) => i - 1);
    });
  }, [currentIndex, animateTransition, navigation]);

  const currentAnswer = answers[currentIndex];

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={THEME.colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.stepText}>{currentIndex + 1} / {QUESTIONS.length}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 진행률 바 */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: sectionColor }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* 섹션 라벨 */}
          <View style={[styles.sectionBadge, { backgroundColor: sectionColor + '22' }]}>
            <View style={[styles.sectionDot, { backgroundColor: sectionColor }]} />
            <Text style={[styles.sectionLabel, { color: sectionColor }]}>
              {question.section}
            </Text>
          </View>

          {/* 질문 카드 */}
          <View style={styles.questionCard}>
            <Text style={styles.questionNumber}>Q{question.id}</Text>
            <Text style={styles.questionText}>{question.text}</Text>
          </View>

          {/* 답변 선택지 */}
          <View style={styles.choices}>
            {CHOICES.map((choice) => {
              const selected = currentAnswer === choice.value;
              return (
                <TouchableOpacity
                  key={choice.value}
                  style={[
                    styles.choiceBtn,
                    selected && { borderColor: sectionColor, backgroundColor: sectionColor + '15' },
                  ]}
                  onPress={() => handleChoice(choice.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.choiceCircle, selected && { borderColor: sectionColor, backgroundColor: sectionColor }]}>
                    {selected && <View style={styles.choiceCircleInner} />}
                  </View>
                  <Text style={[styles.choiceLabel, selected && { color: sectionColor, fontWeight: FONTS.weight.semibold }]}>
                    {choice.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 힌트 */}
          <Text style={styles.hint}>답변을 선택하면 자동으로 다음 질문으로 이동합니다</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.bgBot,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textMuted,
  },

  // 진행률
  progressTrack: {
    height: 4,
    backgroundColor: THEME.colors.divider,
    marginHorizontal: SPACING.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // 섹션 배지
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.pill,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    gap: 6,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
  },

  // 질문 카드
  questionCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...shadowStyle('soft'),
  },
  questionNumber: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: THEME.colors.textPlaceholder,
    marginBottom: SPACING.sm,
  },
  questionText: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textMain,
    lineHeight: 28,
  },

  // 선택지
  choices: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  choiceCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.surface,
  },
  choiceLabel: {
    fontSize: FONTS.size.md,
    color: THEME.colors.textMain,
    fontWeight: FONTS.weight.medium,
  },

  hint: {
    fontSize: FONTS.size.xs,
    color: THEME.colors.textPlaceholder,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
