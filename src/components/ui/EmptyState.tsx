/**
 * src/components/ui/EmptyState.tsx
 * 데이터가 없을 때 표시하는 빈 상태 컴포넌트
 *
 * 사용 예:
 *   <EmptyState
 *     icon={<Ionicons name="bookmark-outline" size={24} />}
 *     message="아직 기록된 공간이 없어요"
 *     actionLabel="첫 공간을 남겨볼까요?"
 *     onAction={() => {}}
 *   />
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { THEME } from '../../constants';

interface Props {
  icon?: React.ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconCircle}>{icon}</View>}
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="soft"
          style={styles.btn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: THEME.font.size.md,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  btn: {
    width: undefined,
  },
});
