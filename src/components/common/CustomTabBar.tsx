/**
 * src/components/common/CustomTabBar.tsx
 * 토스 스타일 플랫 하단 탭바
 *
 * TabNavigator의 tabBar prop에 전달하는 커스텀 컴포넌트입니다.
 * - 하단 고정 플랫 바 (in-flow, position:absolute 아님 → 화면이 자동으로 바 위에 배치됨)
 * - 흰 배경 + 상단 헤어라인 보더로 경계 정의
 * - 활성 탭: 아이콘 채워짐 + 블랙 라벨
 * - 비활성 탭: 아이콘 외곽선 + 그레이 라벨 (라벨 항상 표시)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { active: IoniconsName; inactive: IoniconsName; label: string }> = {
  Home:  { active: 'home',          inactive: 'home-outline',          label: '홈'   },
  Map:   { active: 'location',      inactive: 'location-outline',      label: '지도' },
  Saved: { active: 'bookmark',      inactive: 'bookmark-outline',      label: '저장' },
  Feed:  { active: 'chatbubble',    inactive: 'chatbubble-outline',    label: '피드' },
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? {
            active: 'ellipse',
            inactive: 'ellipse-outline',
            label: route.name,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.item}
              onPress={onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            >
              <Ionicons
                name={isFocused ? config.active : config.inactive}
                size={24}
                color={isFocused ? THEME.colors.textMain : THEME.colors.textMuted}
              />
              <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: THEME.font.weight.semibold,
  },
  labelActive: {
    color: THEME.colors.textMain,
  },
  labelInactive: {
    color: THEME.colors.textMuted,
  },
});
