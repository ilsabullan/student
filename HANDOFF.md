# Visync 학생용 — 개발 인계

## 현재 구현 (MVP, 서버 없음)
| 화면 | 파일 | 상태 |
|---|---|---|
| 온보딩 `#/` | `src/pages/OnboardingView.jsx`, `onboardingLogic.js` | PDF 업로드 → 분석 연출 → 수업 시작 |
| 수업 `#/lecture` | `src/pages/LectureView.jsx`, `lectureLogic.js` | 강의 자료(pdf.js) · 필기 노트 · 시각화 + 직접 조절 · 챕터 · 녹음 · 노트 HTML 저장 |

- 업로드한 PDF는 메모리(`window.__visync.file`)에만 있습니다. 새로고침하거나 PDF 없이 `#/lecture`로 들어오면 온보딩으로 이동합니다.
- 강의 자료 PDF는 저작권 때문에 저장소에 넣지 않습니다(`.gitignore`에 `*.pdf`).
- 받아쓰기: '데모 대본'(`SCRIPT`)과 '실제 음성'(Web Speech API, `ko-KR`, Chrome·Edge)을 전환할 수 있습니다.

## 데모 데이터 → 실제 데이터로 바꿀 곳 (`lectureLogic.js`)
| 상수 | 의미 | 대체 방향 |
|---|---|---|
| `CH` | 챕터(PDF 목차 기준), 쪽 범위, 시각화 정의(`sim.sliders/defaults/run/draw`) | 서버: PDF 목차 추출 + 시각화가 필요한 쪽 판별 |
| `SUMMARY` | 챕터별 구조화 요약 | 서버: 전문 → LLM 요약 |
| `SCRIPT` | 데모 대본 `[시간, 문장, 쪽]` | 실제 STT 결과로 대체 (쪽은 현재 슬라이드로 기록) |
| `TOTAL` | 기본 쪽수 | PDF `numPages`를 쓰므로 거의 쓰이지 않음 |

## 구조 메모
- `src/dc.js`: 디자인 단계의 로직 클래스(`renderVals()`)를 그대로 쓰는 래퍼입니다. View는 `v` 객체만 읽습니다.
- 스타일은 모두 인라인입니다. 색: 잉크 `#1C1D22`, 보조 `#4B4E58`/`#8A8D98`, 포인트 `#5B5FE8`, 배경 `#ECEEF3`, 카드 `#FFFFFF`. 글꼴: Pretendard.
- 카드 배치(이동·크기 조절)는 `localStorage`에 저장됩니다.
- 노트 저장(`exportScript`)은 `lectureLogic.js` 소스 일부(`?raw` import)를 HTML에 넣어, 내보낸 파일 안에서도 시각화와 슬라이더가 동작합니다. `CH` 정의를 옮기거나 이름을 바꾸면 이 부분도 같이 고쳐야 합니다.

## 다음 단계 제안
1. 서버 연결 버전: 로그인, 노트 기록 저장, 왼쪽 카테고리 창(디자인은 서버 연결 버전으로 보존돼 있음)
2. PDF 목차 추출과 시각화 대상 판별 API
3. STT 결과 → 요약 API
4. 결정적이지 않은 부분을 TypeScript로 점진 이관 (`*.jsx` → `*.tsx`)

## 배포 (Vercel)
Add New Project → `ilsabullan/student` → Framework: Vite → Deploy. 해시 라우팅이라 rewrite 설정은 필요 없습니다.
