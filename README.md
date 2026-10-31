# Visync · 학생용 (Vite + React + TypeScript)

## 실행
```bash
npm install
cp .env.example .env.local   # LLM_API_KEY 채우기 (커밋 금지)
npm run dev                  # http://localhost:5173  (/api/* 함께 동작)
npm run build
```

## 흐름
1. 온보딩 `#/`: PDF 업로드 → 브라우저에서 텍스트 추출 → `/api/analyze`(챕터·시각화 대상) → 챕터별 `/api/visualize`(시각화 코드 생성, 실패 시 1회 자동 수정)
2. 수업 `#/lecture`: 업로드한 PDF + AI가 만든 챕터·시각화. 녹음 시작 시 실제 음성 받아쓰기(Chrome·Edge)
   - 녹음 중 8초마다 받아쓰기를 `/api/locate`에 보내 교수님이 설명 중인 쪽·시각화 단계를 찾고, 강의 자료·진행 챕터·시각화가 따라감 (확신이 낮으면 두 번 연속 같은 결과일 때만 이동)
   - 실시간 따라가기 중 화살표·쪽 번호 입력은 강의 위치 보정, 챕터 목록·쪽 칩을 누르면 복습 모드(`실시간 ↗`으로 복귀)
   - 챕터가 넘어갈 때·45초마다 `/api/summarize`로 요약
3. 노트 저장: 요약·시각화(슬라이더 동작)·전문이 담긴 HTML

## 서버 함수 (`api/`, DB 없음)
| 경로 | 역할 |
|---|---|
| `/api/analyze` | PDF 텍스트 → 챕터(목차 기준)·시각화 대상 |
| `/api/visualize` | 챕터 → 시각화 코드 |
| `/api/summarize` | 받아쓰기 → 구조화 요약 |
| `/api/locate` | 최근 받아쓰기 + 주변 쪽 → 지금 설명 중인 쪽·시각화 단계 |

- API 키는 서버 환경 변수에만 있습니다. 브라우저·응답에 노출되지 않습니다.
- POST만 허용, 같은 사이트에서 온 요청만 허용, IP당 10분 150회 제한(수업 중 위치 추적 포함).
- AI가 만든 시각화 코드는 Web Worker에서 격리 실행(페이지·저장소·네트워크 접근 차단, 2.5초 초과 시 종료)하고, 허용된 SVG 태그·속성만 화면에 그립니다.

## 배포 (Vercel)
Settings → Environment Variables: `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` (값은 `.env.example` 참고) → Redeploy.
