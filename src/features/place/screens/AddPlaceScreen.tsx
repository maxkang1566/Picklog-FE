/**
 * src/features/place/screens/AddPlaceScreen.tsx
 * 장소 찾기 화면 (모달)
 *
 * 흐름:
 *   1. 네이버 로컬 검색 API로 장소 검색
 *   2. 결과 선택 → POST /places/from-naver (우리 DB에 Place 등록/재사용)
 *   3. place_id + place 데이터를 가지고 PlaceDetailScreen 으로 이동
 *   4. PlaceDetailScreen에서 보관함 선택 후 Spot 생성
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../navigation/types';
import { THEME, COLORS, FONTS, SPACING } from '../../../constants';
import { NaverSearchPlace } from '../../../types/naver';
import naverSearchService from '../../../services/naverSearchService';
import placeService from '../../../services/placeService';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPlace'>;

export default function AddPlaceScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NaverSearchPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null); // 선택 처리 중인 place ID

  const hasCredentials = naverSearchService.isConfigured();

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    if (!hasCredentials) {
      Alert.alert(
        '검색 API 키 필요',
        '.env 파일에 EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID 와 EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET 를 추가해주세요.\n\n발급: https://developers.naver.com',
      );
      return;
    }
    setIsSearching(true);
    setResults([]);
    try {
      const items = await naverSearchService.searchPlaces(q);
      if (items.length === 0) {
        Alert.alert('검색 결과 없음', `"${q}"에 대한 결과가 없습니다.`);
      }
      setResults(items);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('검색 오류', err?.message ?? '네이버 검색에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: NaverSearchPlace) => {
    if (selectingId) return;                       // 중복 탭 방지
    setSelectingId(place.naver_place_id);
    try {
      const res = await placeService.createFromNaver({
        naver_place_id: place.naver_place_id,
        name: place.name,
        address: place.road_address || place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        category_group: place.category || undefined,
        phone: place.phone || undefined,
        raw_payload: { source: 'naver', original_category: place.category },
      });

      // PlaceDetailScreen 으로 이동 (apiPlace를 param으로 전달)
      navigation.replace('PlaceDetail', {
        placeId: `api-${res.place_id}`,
        apiPlace: res.place,
      });
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('[AddPlace] from-naver error:', err?.response?.status, err?.response?.data);
      Alert.alert('오류', '장소 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSelectingId(null);
    }
  };

  const renderItem = ({ item }: { item: NaverSearchPlace }) => {
    const isLoading = selectingId === item.naver_place_id;
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelectPlace(item)}
        disabled={selectingId !== null}
        activeOpacity={0.7}
      >
        <View style={styles.resultIconWrap}>
          <Ionicons name="location" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.resultAddr} numberOfLines={1}>
            {item.road_address || item.address}
          </Text>
          {item.category ? (
            <Text style={styles.resultCategory} numberOfLines={1}>{item.category}</Text>
          ) : null}
        </View>
        {isLoading
          ? <ActivityIndicator size="small" color={COLORS.primary} />
          : <Ionicons name="chevron-forward" size={16} color={THEME.colors.textPlaceholder} />
        }
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={THEME.colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>장소 찾기</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 검색 바 */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={THEME.colors.textPlaceholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="장소명으로 검색 (예: 성수 카페)"
            placeholderTextColor={THEME.colors.textPlaceholder}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textPlaceholder} />
            </TouchableOpacity>
          )}
        </View>

        {/* 검색 버튼 */}
        <TouchableOpacity
          style={[styles.searchBtn, (!query.trim() || isSearching) && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={!query.trim() || isSearching}
        >
          {isSearching
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={styles.searchBtnText}>검색</Text>
          }
        </TouchableOpacity>

        {/* API 키 안내 (미설정 시) */}
        {!hasCredentials && (
          <View style={styles.credentialBanner}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.credentialText}>
              검색 기능을 사용하려면 네이버 검색 API 키가 필요합니다.{'\n'}
              .env 파일에 EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID 와{'\n'}
              EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET 를 추가해주세요.
            </Text>
          </View>
        )}

        {/* 결과 목록 */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.naver_place_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            results.length > 0
              ? <Text style={styles.resultCount}>검색 결과 {results.length}개</Text>
              : null
          }
          ListEmptyComponent={
            !isSearching && query.trim() && results.length === 0 ? null : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={THEME.colors.textPlaceholder} />
                <Text style={styles.emptyText}>
                  장소명을 입력하고 검색해보세요{'\n'}예: "연남동 카페", "경복궁", "성수 맛집"
                </Text>
              </View>
            )
          }
        />
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: THEME.colors.textMain,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: THEME.radius.button,
    margin: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: SPACING.sm,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: THEME.colors.textMain,
    padding: 0,
  },

  searchBtn: {
    backgroundColor: THEME.colors.accentDark,
    borderRadius: THEME.radius.button,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },

  credentialBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  credentialText: {
    flex: 1,
    fontSize: FONTS.size.sm,
    color: COLORS.primary,
    lineHeight: 20,
  },

  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40,
  },
  resultCount: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textMuted,
    marginBottom: SPACING.sm,
    fontWeight: FONTS.weight.medium,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: SPACING.sm,
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: THEME.colors.textMain,
    marginBottom: 2,
  },
  resultAddr: {
    fontSize: FONTS.size.sm,
    color: THEME.colors.textMuted,
    marginBottom: 2,
  },
  resultCategory: {
    fontSize: FONTS.size.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weight.medium,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.size.md,
    color: THEME.colors.textPlaceholder,
    textAlign: 'center',
    lineHeight: 24,
  },
});
