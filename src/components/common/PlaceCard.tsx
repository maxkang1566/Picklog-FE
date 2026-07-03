/**
 * src/components/common/PlaceCard.tsx
 * 장소 목록 세로형 카드 (Variant 디자인 적용)
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../../types';
import { THEME, TAG_LABELS } from '../../constants';
import { usePlaceStore } from '../../store/usePlaceStore';
import { TagList } from '../ui/Tag';

interface Props {
  place: Place;
  onPress: () => void;
}

export default function PlaceCard({ place, onPress }: Props) {
  const { isSaved, savePlace, unsavePlace } = usePlaceStore();
  const saved = isSaved(place.id);

  const handleSaveToggle = () => {
    saved ? unsavePlace(place.id) : savePlace(place.id);
  };

  const tagLabels = place.tags.slice(0, 3).map((t) => TAG_LABELS[t] ?? t);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* 썸네일 */}
      <Image source={{ uri: place.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />

      {/* 비공개 배지 */}
      {place.isPrivate && (
        <View style={styles.privateBadge}>
          <Ionicons name="lock-closed" size={10} color="#fff" />
        </View>
      )}

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToggle}>
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={saved ? THEME.colors.textMain : '#fff'}
        />
      </TouchableOpacity>

      {/* 정보 */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{place.title}</Text>
        <Text style={styles.address} numberOfLines={1}>{place.address}</Text>
        <TagList tags={tagLabels} color={THEME.colors.tagBg} />
        <View style={styles.saveCount}>
          <Ionicons name="bookmark" size={12} color={THEME.colors.textMuted} />
          <Text style={styles.saveCountText}>{place.saveCount.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: THEME.colors.tagBg,
  },
  privateBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 6,
  },
  info: {
    padding: THEME.spacing.md,
    gap: 8,
  },
  title: {
    fontSize: THEME.font.size.lg,
    fontWeight: THEME.font.weight.semibold,
    color: THEME.colors.textMain,
  },
  address: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
  },
  saveCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveCountText: {
    fontSize: THEME.font.size.xs,
    color: THEME.colors.textMuted,
  },
});
