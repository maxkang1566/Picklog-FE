/**
 * src/components/ui/Card.tsx
 * 기본 카드 컨테이너 (흰 배경 + 둥근 모서리 + 그림자)
 *
 * 사용 예:
 *   <Card>…children…</Card>
 *   <Card style={{ padding: 32 }}>…</Card>
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../../constants';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadow.soft,
  },
});
