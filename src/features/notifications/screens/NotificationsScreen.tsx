/**
 * src/features/notifications/screens/NotificationsScreen.tsx
 * Variant 디자인 적용 활동 알림 화면
 * - 요약 카드 (새 기록 / 팔로워 / 스크랩)
 * - 새로운 알림 / 이전 알림 리스트
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { THEME } from '../../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// styles보다 먼저 선언해야 module 초기화 시 mock 데이터에서 참조 가능
const BOLD: { fontWeight: '700' } = { fontWeight: '700' };

// ── 알림 아이템 타입 ──────────────────────────────────
interface NotificationItem {
  id: string;
  type: 'follow' | 'bookmark' | 'star' | 'heart' | 'user';
  message: React.ReactNode;
  time: string;
  isUnread?: boolean;
  avatarUrl?: string;
}

// ── 개별 알림 행 ──────────────────────────────────────
interface NotiRowProps {
  item: NotificationItem;
}

function NotiRow({ item }: NotiRowProps) {
  const iconConfig: Record<
    NotificationItem['type'],
    { bg: string; color: string; name: IoniconsName }
  > = {
    follow:   { bg: THEME.colors.userBlueBg,   color: THEME.colors.userBlue,  name: 'person-add' },
    bookmark: { bg: THEME.colors.bookmarkBg,   color: THEME.colors.bookmark,  name: 'bookmark'   },
    star:     { bg: THEME.colors.starBg,       color: THEME.colors.star,      name: 'star'       },
    heart:    { bg: THEME.colors.heartBg,      color: THEME.colors.heart,     name: 'heart'      },
    user:     { bg: THEME.colors.userBlueBg,   color: THEME.colors.userBlue,  name: 'person'     },
  };

  const ic = iconConfig[item.type];

  return (
    <TouchableOpacity style={[styles.notiItem, item.isUnread && styles.unread]} activeOpacity={0.8}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.notiAvatar} />
      ) : (
        <View style={[styles.notiIcon, { backgroundColor: ic.bg }]}>
          <Ionicons name={ic.name} size={20} color={ic.color} />
        </View>
      )}

      <View style={styles.notiContent}>
        <Text style={styles.notiText}>{item.message}</Text>
        <Text style={styles.notiTime}>{item.time}</Text>
      </View>

      {item.isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ── 목 데이터 ─────────────────────────────────────────
const NEW_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'follow',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    message: (
      <Text>
        <Text style={BOLD}>김지우</Text>님이 회원님을 팔로우하기 시작했습니다.
      </Text>
    ),
    time: '방금 전',
    isUnread: true,
  },
  {
    id: '2',
    type: 'bookmark',
    message: (
      <Text>
        <Text style={BOLD}>박민수</Text>님이 회원님의{' '}
        <Text style={BOLD}>오브젝트 성수</Text> 기록을 담아갔습니다.
      </Text>
    ),
    time: '12분 전',
    isUnread: true,
  },
];

const PAST_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '3',
    type: 'star',
    message: (
      <Text>
        이번 주 가장 인기 있는 <Text style={BOLD}>마포구 공간 Top 5</Text>를 확인해보세요!
      </Text>
    ),
    time: '2시간 전',
  },
  {
    id: '4',
    type: 'user',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    message: (
      <Text>
        <Text style={BOLD}>이현우</Text>님이 새로운 장소{' '}
        <Text style={BOLD}>카페 진정성</Text>을 등록했습니다.
      </Text>
    ),
    time: '어제',
  },
  {
    id: '5',
    type: 'heart',
    message: (
      <Text>
        <Text style={BOLD}>정수진</Text>님 외 5명이 회원님의 활동을 좋아합니다.
      </Text>
    ),
    time: '2일 전',
  },
];

// ── 메인 화면 ─────────────────────────────────────────
export default function NotificationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.headerArea}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={THEME.colors.textMain} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>활동 알림</Text>
            <Text style={styles.subtitle}>최근 소식과 새로운 반응을 확인하세요</Text>
          </View>
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>12</Text>
            <Text style={styles.summaryLabel}>새 기록</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>4</Text>
            <Text style={styles.summaryLabel}>새 팔로워</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>8</Text>
            <Text style={styles.summaryLabel}>스크랩</Text>
          </View>
        </View>

        {/* 새로운 알림 */}
        <Text style={styles.sectionLabel}>새로운 알림</Text>
        {NEW_NOTIFICATIONS.map((item) => (
          <NotiRow key={item.id} item={item} />
        ))}

        {/* 이전 알림 */}
        <Text style={styles.sectionLabel}>이전 알림</Text>
        {PAST_NOTIFICATIONS.map((item) => (
          <NotiRow key={item.id} item={item} />
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
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: 48,
  },

  // 헤더
  headerArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  title: {
    fontSize: THEME.font.size.xxl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
    fontWeight: THEME.font.weight.medium,
  },

  // 요약 카드
  summaryCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: THEME.font.weight.medium,
  },
  divider: {
    width: 1,
    backgroundColor: THEME.colors.divider,
  },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 13,
    fontWeight: THEME.font.weight.semibold,
    color: THEME.colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // 알림 아이템
  notiItem: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
    shadowOpacity: 0.02,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.heart,
  },
  notiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.tagBg,
    flexShrink: 0,
  },
  notiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notiContent: { flex: 1 },
  notiText: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMain,
    lineHeight: 20,
    marginBottom: 4,
  },
  notiTime: {
    fontSize: 12,
    color: THEME.colors.textPlaceholder,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.heart,
  },
});
