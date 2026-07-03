/**
 * src/components/ui/Button.tsx
 * 재사용 버튼 컴포넌트
 *
 * variant:
 *   - 'primary'  : 검정 배경 + 흰 텍스트 (기본 액션)
 *   - 'soft'     : 아이보리 배경 + 검정 텍스트 (보조 액션)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { THEME } from '../../constants';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'soft';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: Props) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.soft,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : THEME.colors.textMain} size="small" />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSoft, textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: THEME.radius.button,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primary: {
    backgroundColor: THEME.colors.accentDark,
  },
  soft: {
    backgroundColor: THEME.colors.accentSoft,
    width: undefined,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: THEME.font.size.lg,
    fontWeight: THEME.font.weight.bold,
    letterSpacing: -0.3,
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelSoft: {
    color: THEME.colors.textMain,
    fontSize: THEME.font.size.sm,
    fontWeight: THEME.font.weight.semibold,
  },
});
