/**
 * src/services/authService.ts
 * 인증 관련 API 함수 모음
 */

import { ApiUser, SignupInput } from '../types';
import api from './api';
import { API_CONFIG } from '../constants';

const authService = {
  /**
   * 로그인
   * POST /auth/login (application/x-www-form-urlencoded)
   * username 필드에 email을 넣어야 함
   *
   * ⚠️ Axios 인스턴스의 기본 Content-Type(application/json) 간섭을 피하기 위해
   *    fetch()를 직접 사용합니다.
   */
  async login(email: string, password: string): Promise<string> {
    // fetch는 기본 타임아웃이 없어, 서버가 응답을 안 주면 무한 대기함.
    // AbortController로 상한을 두어 무한 스피너 대신 에러로 처리되게 함.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    let response: Response;
    try {
      response = await fetch(`${API_CONFIG.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
        signal: controller.signal,
      });
    } catch (e) {
      // abort 또는 네트워크 실패 — useAuthStore가 메시지를 보여주도록 message를 채워 throw
      const aborted = (e as { name?: string })?.name === 'AbortError';
      throw {
        message: aborted
          ? `서버 응답이 ${API_CONFIG.timeout / 1000}초 내에 오지 않았어요. 백엔드/DB 상태를 확인해주세요.`
          : (e as { message?: string })?.message ?? '네트워크 오류',
      };
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json() as { access_token?: string; detail?: string };
    if (!response.ok) {
      // Axios 에러 모양과 동일하게 throw 해서 useAuthStore가 그대로 처리 가능
      throw { response: { status: response.status, data } };
    }
    return data.access_token!;
  },

  /**
   * 회원가입
   * POST /auth/register
   */
  async signup(input: SignupInput): Promise<ApiUser> {
    // 백엔드 UserCreate: email, password, nickname만 허용
    const body = {
      email: input.email,
      password: input.password,
      nickname: input.nickname,
    };
    const res = await api.post<ApiUser>('/auth/register', body);
    return res.data;
  },

  /**
   * 공간 DNA 최초 저장 (온보딩 퀴즈 결과)
   * POST /users/me/space-dna
   * - 이미 저장된 경우 409 반환 (무시)
   */
  async createSpaceDNA(dna: import('../types/dna').SpaceDNAResult): Promise<void> {
    const body = {
      mbti_axes: {
        density: dna.density,   // { dense, sparse }
        color:   dna.stimulus,  // { high, mild }   ← 백엔드 키명
        form:    dna.temporal,  // { fresh, vintage } ← 백엔드 키명
      },
    };
    console.log('\n[createSpaceDNA] 요청 body:', JSON.stringify(body));
    try {
      const res = await api.post('/users/me/space-dna', body);
      console.log('[createSpaceDNA] 성공 status:', res.status);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: unknown }; message?: string };
      if (err?.response?.status === 409) {
        console.log('[createSpaceDNA] 이미 저장됨 (409) — 무시');
        return;
      }
      console.error('[createSpaceDNA] 실패 status:', err?.response?.status);
      console.error('[createSpaceDNA] data:', JSON.stringify(err?.response?.data));
      throw e;
    }
  },

  /**
   * 내 정보 조회
   * GET /users/me (Authorization 필요)
   */
  async getMe(): Promise<ApiUser> {
    const res = await api.get<ApiUser>('/users/me');
    return res.data;
  },

  /**
   * 내 프로필 수정
   * PUT /users/me (Authorization 필요)
   */
  async updateMe(nickname: string, profileImage?: string): Promise<ApiUser> {
    const res = await api.put<ApiUser>('/users/me', {
      nickname,
      profile_image: profileImage ?? null,
    });
    return res.data;
  },
};

export default authService;
