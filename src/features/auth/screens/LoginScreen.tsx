/**
 * src/features/auth/screens/LoginScreen.tsx
 * 토스 스타일 로그인 화면
 * - 연회색 플랫 배경 + 흰 카드
 * - 라운드 사각 인풋 + 검정 버튼
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuthStore } from '../../../store/useAuthStore';
import { RootStackParamList } from '../../../navigation/types';
import { THEME } from '../../../constants';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    clearError();
    await login({ email, password });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 로고 */}
          <View style={styles.header}>
            <Text style={styles.logo}>Picklog</Text>
            <Text style={styles.subtitle}>나만의 공간을 남겨보세요</Text>
          </View>

          {/* 폼 카드 */}
          <Card style={styles.card}>
            <Input
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.inputContainer}
            />
            <Input
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              containerStyle={{ marginBottom: 0 }}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={isLoading ? '로그인 중...' : '시작하기'}
              onPress={handleLogin}
              loading={isLoading}
              style={styles.btn}
            />
          </Card>

          {/* 회원가입 링크 */}
          <TouchableOpacity
            style={styles.signupRow}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupText}>
              처음이신가요?{' '}
              <Text style={styles.signupLink}>함께 시작해요</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.bgBot,
  },
  flex: { flex: 1 },

  // 콘텐츠
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },

  // 로고
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 36,
    fontWeight: THEME.font.weight.extrabold,
    color: THEME.colors.textMain,
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: THEME.font.size.md,
    color: THEME.colors.textMuted,
    fontWeight: THEME.font.weight.medium,
  },

  // 카드
  card: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: THEME.radius.xl,
  },
  inputContainer: {
    marginBottom: 16,
  },
  btn: {
    marginTop: 12,
  },
  error: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.error,
    textAlign: 'center',
    marginTop: 8,
  },

  // 회원가입
  signupRow: {
    marginTop: 32,
    alignItems: 'center',
  },
  signupText: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
    fontWeight: THEME.font.weight.medium,
  },
  signupLink: {
    color: THEME.colors.textMain,
    fontWeight: THEME.font.weight.semibold,
    textDecorationLine: 'underline',
  },
});
