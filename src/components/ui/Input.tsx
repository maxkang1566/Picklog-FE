/**
 * src/components/ui/Input.tsx
 * 스타일 통일 인풋 컴포넌트 (pill 모양)
 *
 * variant:
 *   - 'default'  : 흰 배경 + 부드러운 그림자 (로그인/회원가입)
 *   - 'filled'   : tagBg 배경 (공간 기록 모달)
 */

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { THEME } from '../../constants';

interface Props extends TextInputProps {
  label?: string;
  variant?: 'default' | 'filled';
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  variant = 'default',
  containerStyle,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.base,
          variant === 'filled' ? styles.filled : styles.default,
          focused && styles.focused,
          style,
        ]}
        placeholderTextColor={THEME.colors.textPlaceholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: THEME.font.size.sm,
    fontWeight: THEME.font.weight.semibold,
    color: THEME.colors.textSub,
    marginLeft: 4,
    marginBottom: 8,
  },
  base: {
    borderRadius: THEME.radius.button,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: THEME.font.size.md,
    color: THEME.colors.textMain,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  default: {
    backgroundColor: '#F7F8FA',
    borderColor: THEME.colors.border,
  },
  filled: {
    backgroundColor: THEME.colors.tagBg,
    shadowColor: 'transparent',
    elevation: 0,
  },
  focused: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.accentDark,
    ...THEME.shadow.float,
    shadowOpacity: 0.04,
  },
});
