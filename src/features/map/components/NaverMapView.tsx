/**
 * src/features/map/components/NaverMapView.tsx
 * WebView 기반 네이버 지도 컴포넌트
 *
 * ──────────────────────────────────────────
 * ▶ NCP 인증 방식 (2가지 중 하나 선택)
 * ──────────────────────────────────────────
 *
 * [방식 A] 서비스 계정 키 (ncpKeyId) — 신규 권장
 *   - NCP 콘솔 → Sub Account → 액세스 키 발급
 *   - .env: EXPO_PUBLIC_NAVER_MAP_KEY_ID=<액세스키ID>
 *   - URL 파라미터: ?ncpKeyId=<키>
 *   - 별도 도메인 등록 불필요
 *
 * [방식 B] 앱 등록 방식 (ncpClientId) — 구버전 호환
 *   - NCP 콘솔 → AI·NAVER API → Maps → Application 등록
 *   - 허용 도메인에 개발 서버 URL 등록 필요 (예: http://localhost:8081)
 *   - .env: EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=<앱클라이언트ID>
 *   - URL 파라미터: ?ncpClientId=<클라이언트ID>
 *
 * 현재 코드는 [방식 A] (ncpKeyId) 를 사용합니다.
 * 방식 B를 쓰려면 아래 buildMapHTML의 파라미터명을 ncpClientId로 바꾸고
 * 환경변수도 EXPO_PUBLIC_NAVER_MAP_CLIENT_ID로 변경하세요.
 * ──────────────────────────────────────────
 */

import React, { useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { MapMarker } from '../../../types';
import { MAP_DEFAULTS, COLORS, FONTS } from '../../../constants';

interface Props {
  markers?: MapMarker[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  onMarkerPress?: (markerId: string) => void;
}

function buildMapHTML(params: {
  authParam: string; // "ncpKeyId=xxx" 또는 "ncpClientId=xxx" 형태로 전달
  centerLat: number;
  centerLng: number;
  zoom: number;
  markers: MapMarker[];
}): string {
  const { authParam, centerLat, centerLng, zoom, markers } = params;

  // 신규 발급 키(ncpKeyId)는 oapi.map.naver.com, 구발급 키(ncpClientId)는 openapi.map.naver.com 사용
  // (2025년 개편 이후 공식 문서 기준: https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...)
  const scriptDomain = authParam.startsWith('ncpKeyId=')
    ? 'https://oapi.map.naver.com'
    : 'https://openapi.map.naver.com';

  const markersCode = markers
    .map(
      (m) => `
      (function() {
        var marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(${m.latitude}, ${m.longitude}),
          map: map,
          title: ${JSON.stringify(m.title)},
          icon: {
            content: '<div style="background:#111;border-radius:20px;padding:6px 10px;color:#fff;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${m.title}</div>',
            anchor: new naver.maps.Point(0, 0)
          }
        });
        naver.maps.Event.addListener(marker, 'click', function() {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'markerPress', id: ${JSON.stringify(m.id)} })
          );
        });
      })();
    `
    )
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="unsafe-url">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    #auth-error {
      display: none;
      position: fixed; inset: 0;
      background: #F7F8FA;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 24px;
      text-align: center;
      font-family: sans-serif;
    }
    #auth-error.show { display: flex; }
    #auth-error h3 { font-size: 16px; color: #191F28; margin-bottom: 8px; }
    #auth-error p  { font-size: 13px; color: #8B95A1; line-height: 1.5; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="auth-error">
    <h3>🗺 지도 인증 오류</h3>
    <p id="auth-reason">인증에 실패했습니다.</p>
    <p id="auth-debug" style="margin-top:12px;font-size:11px;color:#B0B0B5;word-break:break-all;"></p>
  </div>

  <script>
    // 진단용: 현재 WebView가 네이버에 보내는 Referer/URL 컨텍스트와 사용된 인증 파라미터
    window.__AUTH_PARAM = ${JSON.stringify(authParam.split('=')[0] + '=' + (authParam.split('=')[1] ?? '').slice(0, 6) + '...')};
    function showAuthError(reason) {
      var el = document.getElementById('auth-error');
      document.getElementById('auth-reason').innerText = reason;
      document.getElementById('auth-debug').innerText =
        'param: ' + window.__AUTH_PARAM +
        '\\nreferrer: ' + (document.referrer || '(empty)') +
        '\\nlocation: ' + location.href;
      el.classList.add('show');
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'authFail', reason: reason, referrer: document.referrer, location: location.href, param: window.__AUTH_PARAM })
      );
    }
    // 네이버 지도 v3는 인증 실패 시 이 전역 함수를 호출함(정의 안 하면 기본 alert만 뜸)
    window.navermap_authFailure = function() {
      showAuthError('네이버 인증 거부: Client ID 또는 콘솔의 웹 서비스 URL(Referer) 불일치');
    };
  </script>

  <script
    type="text/javascript"
    src="${scriptDomain}/openapi/v3/maps.js?${authParam}"
    onerror="showAuthError('maps.js 로드 실패: 네트워크 또는 잘못된 엔드포인트')"
  ></script>
  <script>
    try {
      if (typeof naver === 'undefined' || !naver.maps) {
        throw new Error('naver.maps 미로드');
      }
      var map = new naver.maps.Map('map', {
        center: new naver.maps.LatLng(${centerLat}, ${centerLng}),
        zoom: ${zoom},
        mapTypeId: naver.maps.MapTypeId.NORMAL,
        scaleControl: false,
        mapDataControl: false,
        logoControl: false,
        tileSpare: 5,
        maxBounds: new naver.maps.LatLngBounds(
          new naver.maps.LatLng(33.0, 124.5),
          new naver.maps.LatLng(38.9, 132.0)
        ),
        minZoom: 6,
        maxZoom: 21,
      });
      ${markersCode}
    } catch(e) {
      showAuthError('지도 초기화 실패: ' + e.message);
    }
  </script>
</body>
</html>
  `.trim();
}

export default function NaverMapView({
  markers = [],
  centerLat = MAP_DEFAULTS.center.latitude,
  centerLng = MAP_DEFAULTS.center.longitude,
  zoom = MAP_DEFAULTS.zoom,
  onMarkerPress,
}: Props) {
  const webViewRef = useRef(null);

  // ──────────────────────────────────────────────────
  // NCP 인증 파라미터 결정 (원인 분석 포함)
  //
  // EXPO_PUBLIC_NAVER_MAP_KEY_ID   → 신규 서비스 계정 키 방식 → ncpKeyId=<값>
  // EXPO_PUBLIC_NAVER_MAP_CLIENT_ID → 구버전 앱 등록 방식    → ncpClientId=<값>
  //
  // ⚠️ 이전에 되다가 안 되게 된 원인:
  //   .env에 EXPO_PUBLIC_NAVER_MAP_CLIENT_ID(앱 클라이언트 ID)만 있는데,
  //   코드가 그 값을 ncpKeyId 파라미터로 넘기면 인증 실패함.
  //   클라이언트 ID와 서비스 계정 키는 NCP에서 발급 경로와 파라미터명이 다름.
  //   → 아래 로직으로 환경변수 종류에 맞는 파라미터명을 자동 선택.
  // ──────────────────────────────────────────────────
  const ncpKeyId = process.env.EXPO_PUBLIC_NAVER_MAP_KEY_ID;
  const ncpClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;

  const authParam = ncpKeyId
    ? `ncpKeyId=${ncpKeyId}`
    : ncpClientId
    ? `ncpClientId=${ncpClientId}`
    : null;

  if (!authParam) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>🗺 네이버 지도 키 미설정</Text>
        <Text style={styles.errorText}>
          .env 파일에 아래 중 하나를 추가하세요:{'\n\n'}
          {'[신규] EXPO_PUBLIC_NAVER_MAP_KEY_ID=서비스계정키\n'}
          {'[구버전] EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=앱클라이언트ID'}
        </Text>
      </View>
    );
  }

  // baseUrl을 localhost로 고정 (포트 없이!)
  // ncpClientId 방식은 NCP 콘솔에 등록된 웹 서비스 URL과 Referer가 일치해야 인증됨.
  // Android WebView는 loadDataWithBaseURL의 baseUrl을 maps.js 요청 Referer로 실어 보냄.
  // NCP는 Referer를 "호스트까지만" 검증하므로 콘솔에도 포트 없이 http://localhost 로 등록해야 함
  //   (포트가 붙으면 매칭 실패 → 인증 실패). 동적 IP(192.168.x.x)를 쓰면 등록값과 불일치 → 실패.
  const baseUrl = 'http://localhost';
  const html = buildMapHTML({ authParam, centerLat, centerLng, zoom, markers });

  // 에러 화면에 사용된 파라미터 정보 로그 (개발 디버깅용)
  if (__DEV__) {
    console.log('[NaverMap] 인증 방식:', authParam.split('=')[0], '| 값 앞 6자:', (authParam.split('=')[1] ?? '').slice(0, 6) + '...');
  }

  if (Platform.OS === 'web') {
    return (
      <iframe
        srcDoc={html}
        style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        title="naver-map"
      />
    );
  }

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'authFail') {
        console.warn(
          '[NaverMap] 인증 실패:', data.reason,
          '\n  사용 파라미터:', data.param,
          '\n  referrer:', data.referrer || '(empty)',
          '\n  location:', data.location
        );
      }
      if (data.type === 'markerPress' && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch {
      // 파싱 에러 무시
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const WebView = require('react-native-webview').WebView;

  return (
    <WebView
      ref={webViewRef}
      source={{ html, baseUrl }}
      style={styles.webView}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
      onMessage={handleMessage}
      mixedContentMode="always"
      scalesPageToFit={false}
    />
  );
}

const styles = StyleSheet.create({
  webView: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
    gap: 12,
  },
  errorTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONTS.size.sm,
    color: COLORS.error,
    textAlign: 'center',
    lineHeight: 22,
  },
});
