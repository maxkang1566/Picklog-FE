/**
 * src/features/feed/screens/FeedScreen.tsx
 * 친구 활동 피드 화면
 *
 * 표시 내용:
 * - 친구가 장소를 저장함
 * - 친구가 태그를 추가함
 * - 친구가 새 장소를 등록함
 * - 공동 컬렉션 업데이트
 * - 아직은 거의 다 더미데이터.
 * - 후에 핵심 기능 위주로 구현하면 feed부분 거의 안건들일듯(개선사항정도로 남겨두기??)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, FONTS, SPACING, TAG_LABELS, THEME } from '../../../constants';
import { FeedItem, FeedActivityType } from '../../../types';
import { RootStackParamList } from '../../../navigation/types';
import { useSwipeTabNavigation } from '../../../hooks/useSwipeTabNavigation';
import { MOCK_GROUPS } from '../../../services/mock/mockGroups';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Mock 데이터 ──────────────────────────────────────────

const MOCK_FEED: FeedItem[] = [
  {
    id: 'f1',
    activityType: 'place_saved',
    actor: { id: 'u2', nickname: '지민', profileImageUrl: undefined },
    place: {
      id: 'p1',
      title: '북촌 한옥 카페',
      address: '서울 종로구 계동길 37',
      thumbnailUrl: '',
      tags: ['cafe', 'historic'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
  },
  {
    id: 'f2',
    activityType: 'tag_added',
    actor: { id: 'u3', nickname: '수현', profileImageUrl: undefined },
    place: {
      id: 'p2',
      title: '성수 갤러리 카페',
      address: '서울 성동구 성수일로 77',
      thumbnailUrl: '',
      tags: ['cafe', 'gallery'],
    },
    addedTag: 'hidden_gem',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
  },
  {
    id: 'f3',
    activityType: 'place_created',
    actor: { id: 'u4', nickname: '태양', profileImageUrl: undefined },
    place: {
      id: 'p3',
      title: '망원 한강 뷰 카페',
      address: '서울 마포구 망원동 123',
      thumbnailUrl: '',
      tags: ['cafe', 'nature'],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5시간 전
  },
  {
    id: 'f4',
    activityType: 'collection_updated',
    actor: { id: 'u2', nickname: '지민', profileImageUrl: undefined },
    collection: { id: 'c1', title: '서울 카페 투어' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
  },
  {
    id: 'f5',
    activityType: 'friend_joined',
    actor: { id: 'u5', nickname: '하윤', profileImageUrl: undefined },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2일 전
  },
];

// ─── 유틸 ─────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function activityLabel(item: FeedItem): string {
  switch (item.activityType) {
    case 'place_saved':
      return `${item.place?.title}을(를) 저장했어요`;
    case 'tag_added':
      return `${item.place?.title}에 '${TAG_LABELS[item.addedTag ?? ''] ?? item.addedTag}' 태그를 추가했어요`;
    case 'place_created':
      return `새 장소 ${item.place?.title}을(를) 등록했어요`;
    case 'collection_updated':
      return `'${item.collection?.title}' 컬렉션을 업데이트했어요`;
    case 'friend_joined':
      return 'Picklog에 가입했어요! 👋';
    default:
      return '';
  }
}

function activityIcon(type: FeedActivityType): { name: React.ComponentProps<typeof Ionicons>['name']; color: string } {
  switch (type) {
    case 'place_saved':     return { name: 'bookmark',        color: COLORS.primary };
    case 'tag_added':       return { name: 'pricetag',        color: COLORS.secondary };
    case 'place_created':   return { name: 'add-circle',      color: COLORS.success };
    case 'collection_updated': return { name: 'albums',       color: '#FF9F43' };
    case 'friend_joined':   return { name: 'person-add',      color: COLORS.primary };
  }
}

// ─── 컴포넌트 ─────────────────────────────────────────────

function Avatar({ uri, nickname }: { uri?: string; nickname: string }) {
  return (
    <View style={styles.avatar}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarInitial}>{nickname[0]}</Text>
      )}
    </View>
  );
}

function FeedCard({ item, onPlacePress }: { item: FeedItem; onPlacePress: (id: string) => void }) {
  const icon = activityIcon(item.activityType);

  return (
    <View style={styles.card}>
      {/* 유저 정보 */}
      <View style={styles.cardHeader}>
        <Avatar uri={item.actor.profileImageUrl} nickname={item.actor.nickname} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.actorName}>{item.actor.nickname}</Text>
          <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
        </View>
        <View style={[styles.activityBadge, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={14} color={icon.color} />
        </View>
      </View>

      {/* 활동 설명 */}
      <Text style={styles.activityText}>{activityLabel(item)}</Text>

      {/* 관련 장소 카드 */}
      {item.place && (
        <TouchableOpacity
          style={styles.placePreview}
          onPress={() => onPlacePress(item.place!.id)}
          activeOpacity={0.8}
        >
          <View style={styles.placePreviewInfo}>
            <Text style={styles.placeTitle} numberOfLines={1}>{item.place.title}</Text>
            <Text style={styles.placeAddress} numberOfLines={1}>{item.place.address}</Text>
            <View style={styles.tagRow}>
              {item.place.tags.slice(0, 3).map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{TAG_LABELS[tag] ?? tag}</Text>
                </View>
              ))}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={THEME.colors.textPlaceholder} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────

export default function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);
  const { panHandlers, animatedStyle } = useSwipeTabNavigation();

  const handleRefresh = () => {
    setRefreshing(true);
    // TODO: 실제 피드 API 호출
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.flex, animatedStyle]} {...panHandlers}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>피드</Text>
        <TouchableOpacity
          style={styles.friendsButton}
          onPress={() => navigation.navigate('CollaborativeMap')}
        >
          <Ionicons name="people-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 그룹 협업 배너 */}
      <View style={styles.groupBannerWrap}>
        <TouchableOpacity
          style={styles.groupBanner}
          onPress={() => navigation.navigate('CollaborativeMap')}
          activeOpacity={0.85}
        >
          <View style={styles.groupBannerLeft}>
            <Text style={styles.groupBannerEmoji}>🤝</Text>
            <View>
              <Text style={styles.groupBannerTitle}>함께하는 공간</Text>
              <Text style={styles.groupBannerSub}>친구와 공동 지도를 만들어 보세요</Text>
            </View>
          </View>
          <View style={styles.groupCountBadge}>
            <Text style={styles.groupCountText}>{MOCK_GROUPS.length}개 그룹</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={THEME.colors.textPlaceholder} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_FEED}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FeedCard
            item={item}
            onPlacePress={id => navigation.navigate('PlaceDetail', { placeId: id })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={THEME.colors.textPlaceholder} />
            <Text style={styles.emptyTitle}>아직 친구 활동이 없어요</Text>
            <Text style={styles.emptyDesc}>친구를 추가하면 친구의 공간 기록을{'\n'}여기서 볼 수 있어요</Text>
          </View>
        }
      />
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── 스타일 ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.black,
  },
  friendsButton: {
    padding: SPACING.xs,
  },
  groupBannerWrap: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  groupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    gap: 8,
  },
  groupBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupBannerEmoji: { fontSize: 22 },
  groupBannerTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.black,
    marginBottom: 1,
  },
  groupBannerSub: {
    fontSize: FONTS.size.xs,
    color: THEME.colors.textMuted,
  },
  groupCountBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groupCountText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textSub,
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: THEME.radius.sm,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarInitial: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
  },
  cardHeaderText: {
    flex: 1,
  },
  actorName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.black,
  },
  timeText: {
    fontSize: FONTS.size.xs,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  activityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textSub,
    lineHeight: 20,
  },
  placePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  placePreviewInfo: {
    flex: 1,
    gap: 2,
  },
  placeTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.black,
  },
  placeAddress: {
    fontSize: FONTS.size.xs,
    color: THEME.colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: FONTS.size.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weight.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textSub,
  },
  emptyDesc: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textPlaceholder,
    textAlign: 'center',
    lineHeight: 20,
  },
});
