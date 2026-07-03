/**
 * src/features/auth/screens/SignupScreen.tsx
 * Variant 디자인 적용 회원가입 화면
 * - 프로필 사진 업로드
 * - 이름 / 이메일 / 비밀번호 입력
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
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../../store/useAuthStore';
import { RootStackParamList } from '../../../navigation/types';
import { THEME } from '../../../constants';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    if (!nickname || !email || !password) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('비밀번호 오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    clearError();
    // 공간 DNA 퀴즈로 이동 (실제 회원가입은 결과 화면에서 처리)
    navigation.navigate('SpaceDNAQuiz', { email, password, nickname });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 뒤로가기 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={THEME.colors.textMain} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>
              당신만의 소중한 공간을{'\n'}기록할 준비가 되었나요? ✨
            </Text>
            <Text style={styles.desc}>Picklog와 함께 일상의 영감을 채워보세요.</Text>
          </View>

          {/* 프로필 사진 */}
          <TouchableOpacity style={styles.profileContainer} activeOpacity={0.8}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={40} color={THEME.colors.textPlaceholder} />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
            <Text style={styles.profileLabel}>프로필 사진 설정</Text>
          </TouchableOpacity>

          {/* 폼 */}
          <View style={styles.form}>
            <Input
              label="이름"
              placeholder="어떻게 불러드릴까요?"
              value={nickname}
              onChangeText={setNickname}
              autoCorrect={false}
            />
            <Input
              label="이메일"
              placeholder="example@space.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="비밀번호"
              placeholder="8자 이상 입력해주세요"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label="공간 DNA 설정하기 →"
              onPress={handleSignup}
              style={styles.btn}
            />
          </View>

          {/* 로그인 링크 */}
          <TouchableOpacity style={styles.loginRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              이미 계정이 있으신가요?{' '}
              <Text style={styles.loginLink}>로그인</Text>
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
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 48,
  },

  // 헤더
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: THEME.font.size.xxl,
    fontWeight: THEME.font.weight.bold,
    color: THEME.colors.textMain,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  desc: {
    fontSize: THEME.font.size.md,
    color: THEME.colors.textMuted,
    lineHeight: 22,
  },

  // 프로필
  profileContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...THEME.shadow.soft,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    backgroundColor: THEME.colors.textMain,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: THEME.colors.surface,
  },
  profileLabel: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textMuted,
    marginTop: 12,
    fontWeight: THEME.font.weight.medium,
  },

  // 폼
  form: {
    gap: 0,
  },
  btn: {
    marginTop: 32,
  },
  error: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.error,
    textAlign: 'center',
  },

  // 로그인 링크
  loginRow: {
    marginTop: 32,
    alignItems: 'center',
  },
  loginText: {
    fontSize: THEME.font.size.sm,
    color: THEME.colors.textPlaceholder,
    textAlign: 'center',
  },
  loginLink: {
    color: THEME.colors.textMuted,
    fontWeight: THEME.font.weight.semibold,
    textDecorationLine: 'underline',
  },
});
