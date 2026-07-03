/**
 * src/features/settings/screens/SettingsScreen.tsx
 * Variant 디자인 적용 설정 화면(그 초반에 디자인 만들어주던 ai)
 * - 프로필 카드
 * - 일반 / 스타일 섹션
 * - iOS 스타일 토글
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { THEME } from '../../../constants';
import { useAuthStore } from '../../../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsItemProps {
  iconName: IoniconsName;
  iconBg: string;
  label: string;
  value?: string;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  isLast?: boolean;
}

function SettingsItem({
  iconName,
  iconBg,
  label,
  value,
  isToggle,
  toggleValue,
  onToggle,
  isLast,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.item, !isLast && styles.itemBorder]}
      activeOpacity={isToggle ? 1 : 0.7}
    >
      {/* 아이콘 */}
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={18} color="#fff" />
      </View>

      {/* 라벨 */}
      <Text style={styles.itemLabel}>{label}</Text>

      {/* 우측: 토글 or 값 + 화살표 */}
      {isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: THEME.colors.iosGray, true: THEME.colors.iosGreen }}
          thumbColor="#fff"
          ios_backgroundColor={THEME.colors.iosGray}
        />
      ) : (
        <View style={styles.itemRight}>
          {value ? <Text style={styles.itemValue}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={18} color={THEME.colors.textPlaceholder} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const { user } = useAuthStore();
  const displayName = user?.nickname ?? '사용자';
  const displayEmail = user?.email ?? '';
  const displayInitial = displayName[0] ?? '사';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={THEME.colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>설정</Text>
        </View>

        {/* 프로필 카드 */}
        <TouchableOpacity style={styles.profileCard} activeOpacity={0.8}>
          <View style={styles.profileImg}>
            <Text style={styles.profileInitial}>{displayInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            {displayEmail ? <Text style={styles.profileEmail}>{displayEmail}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={THEME.colors.textPlaceholder} />
        </TouchableOpacity>

        {/* 일반 섹션 */}
        <Text style={styles.sectionLabel}>일반</Text>
        <View style={styles.group}>
          <SettingsItem
            iconName="person"
            iconBg={THEME.colors.iconBlue}
            label="계정 관리"
          />
          <SettingsItem
            iconName="notifications"
            iconBg={THEME.colors.iconRed}
            label="알림 설정"
            isToggle
            toggleValue={notificationsOn}
            onToggle={setNotificationsOn}
          />
          <SettingsItem
            iconName="lock-closed"
            iconBg={THEME.colors.iconPurple}
            label="개인정보 및 보안"
            isLast
          />
        </View>

        {/* 스타일 섹션 */}
        <Text style={styles.sectionLabel}>스타일</Text>
        <View style={styles.group}>
          <SettingsItem
            iconName="sunny"
            iconBg={THEME.colors.iconOrange}
            label="화면 테마"
            value="라이트 모드"
          />
          <SettingsItem
            iconName="search"
            iconBg={THEME.colors.iconGray}
            label="글자 크기"
            value="보통"
            isLast
          />
        </View>

        {/* 버전 */}
        <Text style={styles.version}>버전 2.4.0 (Build 82)</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // 프로필 카드
  profileCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
  profileImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: THEME.font.size.xxl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: THEME.font.size.xl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
  },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: THEME.font.weight.medium,
  },

  // 그룹 컨테이너
  group: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },

  // 아이템
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.divider,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: THEME.font.size.md,
    fontWeight: THEME.font.weight.medium,
    color: THEME.colors.textMain,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemValue: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
  },

  // 버전
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: THEME.colors.textPlaceholder,
    marginTop: 8,
  },
});
