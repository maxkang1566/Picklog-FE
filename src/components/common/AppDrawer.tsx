/**
 * src/components/common/AppDrawer.tsx
 * 왼쪽에서 슬라이드되는 Drawer 메뉴
 *
 * 열기: 홈 화면 우측 스와이프 or 아바타 탭
 * 닫기: 오버레이 탭 or 왼쪽 스와이프
 *
 * 포함 항목: 프로필, 친구관리, 설정, 알림, 로그아웃
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  PanResponder,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDrawerStore } from '../../store/useDrawerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { navigate } from '../../navigation/navigationRef';
import { THEME } from '../../constants';

const DRAWER_WIDTH = 300;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  icon: IoniconsName;
  label: string;
  onPress: () => void;
  color?: string;
}

export default function AppDrawer() {
  const { isOpen, close } = useDrawerStore();
  const { user, logout } = useAuthStore();

  // 마운트 여부 (닫힘 애니메이션 완료 후 언마운트)
  const [visible, setVisible] = useState(false);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // ── 열기/닫기 애니메이션 ──────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 22,
          mass: 1,
          stiffness: 160,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [isOpen]);

  // ── Drawer 안에서 스와이프 왼쪽 → 닫기 ──────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dx < -20 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -40) close();
      },
    })
  ).current;

  if (!visible) return null;

  const menuItems: MenuItem[] = [
    {
      icon: 'analytics-outline',
      label: '내 공간 DNA',
      onPress: () => {
        close();
        navigate('Profile');
      },
    },
    {
      icon: 'library-outline',
      label: '공간 DNA 소개',
      onPress: () => {
        close();
        navigate('DNAGuide');
      },
    },
    {
      icon: 'people-outline',
      label: '친구 관리',
      onPress: () => {
        close();
        // navigate('Friends'); // 추후 화면 추가 시 연결
      },
    },
    {
      icon: 'notifications-outline',
      label: '활동 알림',
      onPress: () => {
        close();
        navigate('Notifications');
      },
    },
    {
      icon: 'settings-outline',
      label: '설정',
      onPress: () => {
        close();
        navigate('Settings');
      },
    },
  ];

  const displayName = user?.nickname ?? '사용자';
  const displayEmail = user?.email ?? '';
  const displayInitial = displayName[0] ?? '사';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* 딤 오버레이 */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Drawer 패널 */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <SafeAreaView style={styles.inner} edges={['top', 'bottom']}>

          {/* 닫기 버튼 */}
          <TouchableOpacity style={styles.closeBtn} onPress={close}>
            <Ionicons name="close" size={22} color={THEME.colors.textMuted} />
          </TouchableOpacity>

          {/* 프로필 카드 */}
          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.8}
            onPress={() => {
              close();
              navigate('Settings');
            }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{displayInitial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              {displayEmail ? (
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {displayEmail}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.textPlaceholder} />
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* 메뉴 리스트 */}
          <View style={styles.menu}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.color ?? THEME.colors.textMain}
                  />
                </View>
                <Text style={[styles.menuLabel, item.color ? { color: item.color } : undefined]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 하단 로그아웃 */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                close();
                logout();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="log-out-outline" size={20} color={THEME.colors.error} />
              </View>
              <Text style={[styles.menuLabel, { color: THEME.colors.error }]}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: THEME.colors.bgBot,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // 닫기 버튼
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    marginTop: 8,
    marginRight: -8,
  },

  // 프로필
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: THEME.font.size.lg,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
  },

  // 구분선
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.colors.border,
    marginVertical: 8,
  },

  // 메뉴
  menu: {
    marginTop: 8,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: THEME.font.size.md,
    fontWeight: THEME.font.weight.medium,
    color: THEME.colors.textMain,
  },

  // 하단
  footer: {
    paddingBottom: 8,
  },
});
