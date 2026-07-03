/**
 * src/features/saved/screens/InvitationPreviewScreen.tsx
 * 초대 미리보기 화면 — 수락 / 거절
 *
 * 진입 경로:
 *   딥링크 picklog://invitations/{token}  →  RootNavigator가 라우팅
 *   또는 앱 내부에서 직접 navigate('InvitationPreview', { token })
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { THEME, COLORS, FONTS, SPACING } from '../../../constants';
import invitationService from '../../../services/invitationService';
import { useStorageStore } from '../../../store/useStorageStore';
import { InvitationPreview } from '../../../types/invitation';

type Props = NativeStackScreenProps<RootStackParamList, 'InvitationPreview'>;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function InvitationPreviewScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const { fetchStorages } = useStorageStore();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    invitationService
      .previewInvitation(token)
      .then(setPreview)
      .catch((e: unknown) => {
        const err = e as { response?: { status?: number } };
        const status = err?.response?.status;
        if (status === 404) setError('유효하지 않은 초대 링크입니다.');
        else if (status === 410) setError('만료되었거나 취소된 초대입니다.');
        else setError('초대 정보를 불러오지 못했습니다.');
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!preview) return;
    setIsAccepting(true);
    try {
      const result = await invitationService.acceptInvitation(token);
      await fetchStorages(); // 새로 가입한 저장소가 목록에 반영
      Alert.alert(
        '참여 완료!',
        `"${preview.storage_title}" 저장소에 참여했습니다.`,
        [
          {
            text: '확인',
            onPress: () => {
              // 저장한 공간 탭으로 이동
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            },
          },
        ],
      );
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 409) {
        Alert.alert('이미 참여 중', '이미 참여 중인 저장소입니다.');
      } else if (err?.response?.status === 410) {
        setError('만료되었거나 취소된 초대입니다.');
      } else if (err?.response?.status === 404) {
        setError('유효하지 않은 초대 링크입니다.');
      } else {
        Alert.alert('오류', '초대 수락에 실패했습니다.');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await invitationService.declineInvitation(token);
      Alert.alert('거절 완료', '초대를 거절했습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      const status = err?.response?.status;
      if (status === 404) {
        Alert.alert('알림', '유효하지 않은 초대 링크입니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      } else if (status === 410) {
        Alert.alert('알림', '만료되었거나 취소된 초대입니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('오류', '거절 처리에 실패했습니다.');
      }
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>저장소 초대</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>초대 정보를 불러오는 중...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={64} color={THEME.colors.textPlaceholder} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>돌아가기</Text>
            </TouchableOpacity>
          </View>
        ) : preview ? (
          <>
            <View style={styles.inviteCard}>
              <View style={styles.inviteIcon}>
                <Ionicons name="people" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.inviteTitle}>
                <Text style={styles.inviteHighlight}>{preview.inviter_nickname}</Text>
                {`님이\n'${preview.storage_title}' 저장소에\n초대했습니다`}
              </Text>

              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={THEME.colors.textMuted} />
                  <Text style={styles.infoLabel}>권한</Text>
                  <Text style={styles.infoValue}>
                    {preview.role === 'editor' ? '편집자 (장소 추가·수정 가능)' : '뷰어 (조회만 가능)'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={THEME.colors.textMuted} />
                  <Text style={styles.infoLabel}>만료일</Text>
                  <Text style={styles.infoValue}>{formatDate(preview.expires_at)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.declineBtn, isDeclining && { opacity: 0.6 }]}
                onPress={handleDecline}
                disabled={isDeclining || isAccepting}
              >
                {isDeclining
                  ? <ActivityIndicator size="small" color={THEME.colors.textSub} />
                  : <Text style={styles.declineBtnText}>거절</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptBtn, isAccepting && { opacity: 0.6 }]}
                onPress={handleAccept}
                disabled={isAccepting || isDeclining}
              >
                {isAccepting
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={styles.acceptBtnText}>수락하기</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  headerTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.black,
  },

  content: { flex: 1, padding: SPACING.lg },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONTS.size.md, color: THEME.colors.textMuted },
  errorText: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textSub,
    textAlign: 'center',
    lineHeight: 26,
  },

  inviteCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  inviteIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 32,
  },
  inviteHighlight: { color: COLORS.primary },

  infoBox: {
    width: '100%',
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: THEME.radius.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: FONTS.size.sm, color: THEME.colors.textMuted, width: 40 },
  infoValue: { flex: 1, fontSize: FONTS.size.sm, color: COLORS.black, fontWeight: FONTS.weight.medium },

  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: THEME.radius.button,
    backgroundColor: THEME.colors.accentSoft,
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textSub,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: THEME.radius.button,
    backgroundColor: THEME.colors.accentDark,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.white,
  },

  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: THEME.radius.button,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  backBtnText: { fontSize: FONTS.size.md, color: THEME.colors.textSub },
});
