# 글로벌 투자 지수 대시보드 (MVP)

NASDAQ, KOSPI, WTI 지수를 한 화면에서 확인할 수 있는 간단한 정적 웹페이지입니다.

## 실행 방법

브라우저에서 `index.html` 을 직접 열거나, 간단한 정적 서버로 실행하세요.

```bash
python3 -m http.server 8000
```

그 후 `http://localhost:8000` 접속.

## 포함 기능

- NASDAQ / KOSPI / WTI 카드 표시
- Yahoo Finance Quote API 실시간 지수 조회 (직접 호출 실패 시 CORS 우회 프록시 재시도)
- 현재가, 변동폭, 변동률 표시
- 새로고침 버튼으로 실시간 데이터 재조회
- 마지막 업데이트 시각, 조회 상태 메시지 표시
- API 호출 실패 시 데모 데이터로 자동 폴백

## 참고

- 본 프로젝트는 학습용 예시입니다. 실제 투자 판단에는 공식 데이터 제공처와 라이선스를 반드시 확인하세요.
- 네트워크 또는 CORS 정책으로 직접 호출이 차단될 수 있어, 현재 버전은 AllOrigins / corsproxy.io / codetabs 프록시를 순차 재시도합니다.
