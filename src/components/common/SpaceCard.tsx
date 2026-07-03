/**
 * src/components/common/SpaceCard.tsx
 * 홈 화면 "요즘 뜨는 공간" 수평 스크롤용 카드
 *
 * 사용 예:
 *   <SpaceCard place={place} onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })} />
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Place } from '../../types';
import { THEME, TAG_LABELS } from '../../constants';

interface Props {
  place: Place;
  onPress: () => void;
}

export default function SpaceCard({ place, onPress }: Props) {
  const categoryLabel = place.tags[0] ? (TAG_LABELS[place.tags[0]] ?? place.tags[0]) : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{ uri: place.thumbnailUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{place.title}</Text>
        <Text style={styles.location} numberOfLines={1}>
          {place.address.split(' ').slice(1, 3).join(' ')}
          {categoryLabel ? ` · ${categoryLabel}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
    marginRight: 16,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.tagBg,
    marginBottom: 12,
  },
  info: {
    gap: 4,
  },
  title: {
    fontSize: THEME.font.size.md,
    fontWeight: THEME.font.weight.semibold,
    color: THEME.colors.textMain,
  },
  location: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
});
