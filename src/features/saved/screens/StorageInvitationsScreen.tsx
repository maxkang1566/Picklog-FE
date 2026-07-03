/**
 * src/features/saved/screens/StorageInvitationsScreen.tsx
 * 저장소 초대 관리 화면 (owner 전용)
 *
 * - 초대 토큰 생성 (role / 만료일 선택)
 * - 활성 초대 목록 조회 / 취소
 * - 생성된 링크 복사 + 공유
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { THEME, COLORS, FONTS, SPACING } from '../../../constants';
import invitationService from '../../../services/invitationService';
import { ApiInvitation } from '../../../types/invitation';

type Props = NativeStackScreenProps<RootStackParamList, 'StorageInvitations'>;

const ROLE_OPTIONS = [
  { value: 'editor' as const, label: '편집자', desc: '장소 추가·수정 가능' },
  { value: 'viewer' as const, label: '뷰어', desc: '조회만 가능' },
];

const EXPIRE_OPTIONS = [
  { value: 3, label: '3일' },
  { value: 7, label: '7일' },
  { value: 14, label: '14일' },
  { value: 30, label: '30일' },
];

function makeInviteLink(token: string) {
  return `picklog://invitations/${token}`;
}

function formatExpiry(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} 만료`;
}

export default function StorageInvitationsScreen({ route, navigation }: Props) {
  const { storageId, storageTitle } = route.params;

  const [invitations, setInvitations] = useState<ApiInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 초대 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('editor');
  const [selectedDays, setSelectedDays] = useState(7);
  const [isCreating, setIsCreating] = useState(false);

  // 생성된 링크 표시 모달
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invitationService.getInvitations(storageId);
      setInvitations(data);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 403) {
        Alert.alert('권한 없음', '초대 권한이 없습니다.');
        navigation.goBack();
      } else {
        Alert.alert('오류', '초대 목록을 불러오지 못했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [storageId, navigation]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const inv = await invitationService.createInvitation(storageId, {
        role: selectedRole,
        expires_in_days: selectedDays,
      });
      setShowCreateModal(false);
      setCreatedToken(inv.token);
      await loadInvitations();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 403) {
        Alert.alert('권한 없음', '초대 권한이 없습니다.');
      } else {
        Alert.alert('오류', '초대 링크 생성에 실패했습니다.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = (inv: ApiInvitation) => {
    Alert.alert(
      '초대 취소',
      `${inv.role} 초대를 취소할까요?\n취소 후 해당 링크로 가입할 수 없습니다.`,
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: async () => {
            try {
              await invitationService.revokeInvitation(storageId, inv.id);
              setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
            } catch {
              Alert.alert('오류', '초대 취소에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  const handleCopy = (token: string) => {
    Clipboard.setString(makeInviteLink(token));
    Alert.alert('복사됨', '초대 링크가 클립보드에 복사되었습니다.');
  };

  const handleShare = async (token: string) => {
    try {
      await Share.share({
        message: `"${storageTitle}" 저장소에 초대합니다!\n\n${makeInviteLink(token)}`,
        title: `${storageTitle} 초대`,
      });
    } catch {
      // 공유 취소 시 무시
    }
  };

  const renderInvitation = ({ item }: { item: ApiInvitation }) => (
    <View style={styles.invCard}>
      <View style={styles.invInfo}>
        <View style={styles.invRow}>
          <View style={[styles.roleBadge, item.role === 'owner' ? styles.roleBadgeOwner : styles.roleBadgeEditor]}>
            <Text style={styles.roleText}>{item.role === 'editor' ? '편집자' : '뷰어'}</Text>
          </View>
          <Text style={styles.invExpiry}>{formatExpiry(item.expires_at)}</Text>
        </View>
        <Text style={styles.invBy}>초대자: {item.invited_by_nickname}</Text>
        <Text style={styles.invToken} numberOfLines={1}>{makeInviteLink(item.token)}</Text>
      </View>
      <View style={styles.invActions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => handleCopy(item.token)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => handleShare(item.token)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => handleRevoke(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={THEME.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ── 초대 생성 버튼 ── */}
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
        <Text style={styles.createBtnText}>새 초대 링크 생성</Text>
      </TouchableOpacity>

      {/* ── 활성 초대 목록 ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={renderInvitation}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>활성 초대 목록 ({invitations.length})</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="mail-open-outline" size={48} color={THEME.colors.textPlaceholder} />
              <Text style={styles.emptyText}>활성 초대가 없습니다</Text>
            </View>
          }
        />
      )}

      {/* ── 초대 생성 모달 ── */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <TouchableOpacity
            style={modalStyles.backdrop}
            activeOpacity={1}
            onPress={() => setShowCreateModal(false)}
          />
          <View style={modalStyles.sheet}>
            <Text style={modalStyles.title}>초대 링크 만들기</Text>

            <Text style={modalStyles.label}>권한 선택</Text>
            <View style={modalStyles.optionRow}>
              {ROLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[modalStyles.option, selectedRole === opt.value && modalStyles.optionSelected]}
                  onPress={() => setSelectedRole(opt.value)}
                >
                  <Text style={[modalStyles.optionLabel, selectedRole === opt.value && modalStyles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={[modalStyles.optionDesc, selectedRole === opt.value && modalStyles.optionDescSelected]}>
                    {opt.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={modalStyles.label}>만료 기간</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.chipScroll}>
              <View style={modalStyles.chipRow}>
                {EXPIRE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[modalStyles.chip, selectedDays === opt.value && modalStyles.chipSelected]}
                    onPress={() => setSelectedDays(opt.value)}
                  >
                    <Text style={[modalStyles.chipText, selectedDays === opt.value && modalStyles.chipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[modalStyles.confirmBtn, isCreating && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={isCreating}
            >
              {isCreating
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={modalStyles.confirmText}>링크 생성</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 생성된 링크 표시 모달 ── */}
      <Modal visible={!!createdToken} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <TouchableOpacity
            style={modalStyles.backdrop}
            activeOpacity={1}
            onPress={() => setCreatedToken(null)}
          />
          <View style={[modalStyles.sheet, { gap: SPACING.md }]}>
            <Text style={modalStyles.title}>초대 링크 생성 완료!</Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} selectable numberOfLines={2}>
                {createdToken ? makeInviteLink(createdToken) : ''}
              </Text>
            </View>
            <View style={styles.linkButtons}>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => createdToken && handleCopy(createdToken)}
              >
                <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
                <Text style={styles.linkBtnText}>복사</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => createdToken && handleShare(createdToken)}
              >
                <Ionicons name="share-social-outline" size={18} color={COLORS.white} />
                <Text style={[styles.linkBtnText, { color: COLORS.white }]}>공유</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setCreatedToken(null)}>
              <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: THEME.radius.button,
    justifyContent: 'center',
  },
  createBtnText: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },

  sectionTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textSub,
    marginBottom: SPACING.sm,
  },

  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },

  invCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: THEME.radius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: SPACING.sm,
  },
  invInfo: { flex: 1, gap: 4 },
  invRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
  },
  roleBadgeOwner: { backgroundColor: THEME.colors.accentSoft },
  roleBadgeEditor: { backgroundColor: THEME.colors.accentSoft },
  roleText: { fontSize: FONTS.size.xs, fontWeight: FONTS.weight.semibold, color: THEME.colors.textSub },
  invExpiry: { fontSize: FONTS.size.xs, color: THEME.colors.textMuted },
  invBy: { fontSize: FONTS.size.xs, color: THEME.colors.textMuted },
  invToken: { fontSize: FONTS.size.xs, color: COLORS.primary, marginTop: 2 },

  invActions: { justifyContent: 'center', gap: SPACING.sm },
  iconBtn: { padding: 4 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: SPACING.md },
  emptyText: { fontSize: FONTS.size.md, color: THEME.colors.textMuted },

  linkBox: {
    backgroundColor: THEME.colors.accentSoft,
    borderRadius: THEME.radius.sm,
    padding: SPACING.md,
  },
  linkText: { fontSize: FONTS.size.sm, color: COLORS.primary, lineHeight: 20 },
  linkButtons: { flexDirection: 'row', gap: SPACING.sm },
  linkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  linkBtnText: { fontSize: FONTS.size.md, color: COLORS.primary, fontWeight: FONTS.weight.medium },
  closeText: { textAlign: 'center', color: THEME.colors.textMuted, fontSize: FONTS.size.md, paddingVertical: 4 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
    gap: SPACING.sm,
    zIndex: 1,
  },
  title: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textSub,
    marginTop: SPACING.sm,
  },
  optionRow: { flexDirection: 'row', gap: SPACING.sm },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: SPACING.md,
    gap: 4,
  },
  optionSelected: { borderColor: THEME.colors.accentDark, backgroundColor: THEME.colors.accentSoft },
  optionLabel: { fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold, color: THEME.colors.textSub },
  optionLabelSelected: { color: THEME.colors.textMain },
  optionDesc: { fontSize: FONTS.size.xs, color: THEME.colors.textMuted },
  optionDescSelected: { color: THEME.colors.textSub },

  chipScroll: { marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  chipSelected: { borderColor: THEME.colors.accentDark, backgroundColor: THEME.colors.accentSoft },
  chipText: { fontSize: FONTS.size.sm, color: THEME.colors.textSub },
  chipTextSelected: { color: THEME.colors.textMain, fontWeight: FONTS.weight.semibold },

  confirmBtn: {
    marginTop: SPACING.md,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: THEME.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: { color: COLORS.white, fontSize: FONTS.size.md, fontWeight: FONTS.weight.semibold },
});
