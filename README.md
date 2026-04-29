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
- 현재가, 변동폭, 변동률 표시
- 새로고침 버튼으로 실시간 시세 재조회
- 마지막 업데이트 시각 표시

## 참고

현재 버전은 Yahoo Finance 공개 엔드포인트를 이용해 시세를 조회합니다. 서비스 운영 시에는 API 이용약관, 호출 제한, 상업적 사용 가능 여부를 반드시 검토하세요.

## GitHub Pages 배포 시 404가 나는 이유

정적 파일이 있어도, GitHub 저장소 설정에서 Pages 배포가 연결되어 있지 않으면 `404 Not Found`가 뜹니다.

이 저장소는 `.github/workflows/pages.yml` 워크플로를 추가해 `main` 브랜치 푸시 시 자동 배포하도록 구성했습니다.

체크리스트:

1. 저장소 기본 브랜치가 `main`인지 확인
2. `Settings > Pages`에서 Source가 `GitHub Actions`인지 확인
3. Actions 탭에서 `Deploy static site to GitHub Pages`가 성공했는지 확인
4. 공개 저장소가 아니라면 Pages 사용 가능 플랜/권한 확인
