# PickLog

> AI 기반 공간 아카이빙 플랫폼 — 당신이 방문한 공간을 기록하고, AI가 취향을 분석합니다.

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org)

---


## 주요 기능

| 기능 | 설명 |
|------|------|
|  **공간 지도** | 저장한 장소를 네이버 지도 위에 마커로 표시, 보관함별 필터 |
|  **인스타 가져오기** | 인스타그램 URL 입력 → AI가 장소 자동 추출·저장 |
|  **백그라운드 크롤링** | 크롤링 중에도 앱 자유 이용, 완료 시 홈 배너 알림 |
|  **Space DNA** | 공간 취향 퀴즈로 나만의 공간 DNA 분석 |
|  **보관함** | 공간을 주제별 보관함에 분류 저장, 다중 보관함 지원 |
|  **홈 피드** | 트렌드 공간(Top 5), 최근 저장 공간 목록 | 
|  **커뮤니티 피드** | 다른 사용자의 공간 기록 탐색 |    
|  **프로필 & 추천** | Space DNA 기반 공간 추천 |     

---

## 기술 스택

### Frontend
| 분류 | 기술 |
|------|------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 (strict mode) |
| Navigation | React Navigation 6 (NativeStack + BottomTab) |
| State | Zustand 3.7 |
| HTTP | Axios |
| Map | Naver Web Dynamic Map (react-native-webview) |
| Icons | @expo/vector-icons (Ionicons) |

### External
| 분류 | 기술 |
|------|------|
| 크롤링 | Apify (인스타그램 스크래핑) |
| 지도 검색 | 네이버 지도 API |
| AI 분석 | 연동 예정 |

---

## 실행 방법

### 사전 요구사항
- Node.js 18+
- Expo Go 앱 (iOS / Android) 또는 에뮬레이터

```bash
# 1. 저장소 클론
git clone https://github.com/<your-org>/space-archive.git
cd space-archive

# 2. 의존성 설치
npm install --legacy-peer-deps

# 3. 환경변수 설정
cp .env.example .env
# .env 파일에 실제 키 값 입력

# 4. 앱 실행
npx expo start
```

### 플랫폼별 실행
```bash
npx expo start --android   # Android 에뮬레이터
npx expo start --ios       # iOS 시뮬레이터
npx expo start --clear     # 캐시 초기화 후 시작 (오류 시)
```

---

## 환경변수

`.env.example`을 복사해 `.env`를 만들고 아래 값을 채워주세요.  
`.env`는 절대 커밋하지 마세요.

| 변수 | 설명 |
|------|------|
| `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` | 네이버 클라우드 > Web Dynamic Map 클라이언트 ID |
| `EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID` | 네이버 검색 API 클라이언트 ID |
| `EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET` | 네이버 검색 API 시크릿 |
| `EXPO_PUBLIC_API_BASE_URL` | 백엔드 서버 주소 (기본: `http://localhost:8080`) |

---

## 폴더 구조

```
src/
├── features/          # 화면 단위 기능 (팀원별 작업 구역)
│   ├── auth/          # 로그인, 회원가입, SpaceDNA 퀴즈/결과
│   ├── home/          # 홈 피드 + 인스타그램 가져오기
│   ├── map/           # 지도 화면 (네이버 지도 WebView)
│   ├── place/         # 장소 상세, 추가
│   ├── saved/         # 보관함 목록
│   ├── feed/          # 커뮤니티 피드
│   ├── notifications/ # 알림
│   ├── settings/      # 설정
│   ├── profile/       # 프로필, 추천, DNA 가이드
│   └── social/        # 협업 지도
├── services/          # API 함수 (axios는 여기서만 사용)
│   ├── api.ts                # Axios 인스턴스 + 인터셉터
│   ├── authService.ts
│   ├── instagramService.ts   # 인스타 크롤링 API
│   ├── spotService.ts
│   ├── storageService.ts
│   ├── aiService.ts          # AI 연동 (TODO)
│   └── mock/                 # Mock 데이터 (백엔드 연결 후 삭제)
├── store/             # Zustand 전역 상태
│   ├── useAuthStore.ts
│   ├── usePlaceStore.ts
│   ├── useStorageStore.ts
│   ├── useDrawerStore.ts
│   └── useCrawlingStore.ts   # 인스타 백그라운드 크롤링 상태
├── navigation/        # 네비게이터 + 타입
│   ├── RootNavigator.tsx
│   ├── TabNavigator.tsx
│   └── types.ts
├── components/        # 공통/UI 컴포넌트
│   ├── common/        # 앱 전역 컴포넌트 (AppDrawer, CrawlingPoller 등)
│   └── ui/            # 재사용 UI 원자 컴포넌트
├── types/             # TypeScript 타입 정의
├── constants/         # 디자인 토큰 (THEME, COLORS, SPACING)
└── hooks/             # 커스텀 훅
```

---

## 네비게이션 구조

```
RootNavigator (NativeStack)
├── [로그인 상태]
│   ├── MainTabs (BottomTab)
│   │   ├── Home
│   │   ├── Map
│   │   ├── Saved
│   │   └── Feed
│   ├── PlaceDetail
│   ├── AddPlace (modal)
│   ├── InstagramImport
│   ├── Notifications
│   ├── Settings
│   ├── Profile
│   ├── Recommendation
│   ├── DNAGuide
│   └── CollaborativeMap
└── [비로그인 상태]
    ├── Login
    ├── Signup
    ├── SpaceDNAQuiz
    └── SpaceDNAResult
```

---

## API 연동 현황

| 서비스 | 상태 |
|--------|------|
| 인증 (로그인/회원가입) | ✅ 연동 완료 |
| 보관함 CRUD | ✅ 연동 완료 |
| Spot CRUD | ✅ 연동 완료 |
| 인스타그램 크롤링 | ✅ 연동 완료 |
| 장소 목록 | ✅ 연동 완료) |
| AI 분석 | ✅ 연동 완료 | //수정중
| 알림 | ⚠️ Mock |

---

## 팀 역할

| 역할 | 담당 |
|------|------|
| Frontend | React Native 앱 개발 |
| Backend | API 서버 개발 |
| AI | 공간 분석 · 태그 자동화 |

