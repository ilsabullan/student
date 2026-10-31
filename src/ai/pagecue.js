// 교수님이 강의 자료 쪽을 직접 말했는지 찾기. 예: "39페이지로 넘어갈게요", "다음 장 보시면", "turn to page 12".
// 운영체제 같은 과목의 '페이지'(메모리 page)와 헷갈리지 않도록, 이동·안내 표현이 함께 있을 때만 인정한다.
// 반환: 이동할 쪽 번호 (없으면 0)

// 쪽 번호 바로 뒤에 오는 이동 표현 ("39페이지로", "16쪽 보시면", "12페이지부터")
const DIRECT = /^\s*(으로|로|부터|(를|을|에서)?\s*(보시|보면|보세요|봅시다|볼게|볼까|펴|펼|열어)|에\s*(있는\s*(그림|표|예|내용|식|코드)|나와|나오))/;
// 문장 어딘가의 넘김 표현
const MOVE = /(넘어|넘기|넘길|넘깁|펴\s*(보|주)|펼쳐|열어\s*(보|주)|보시면|보면|봅시다|볼게요|볼까요|보세요|가\s*볼|가겠습니다|갈게요)/;
// 슬라이드가 아니라 메모리 page를 말하는 경우
const NOT_SLIDE = /^\s*(테이블|table|크기|사이즈|size|번호|넘버|프레임|frame|폴트|fault|교체|단위|안에|내에|들|의\s*(크기|수|개수)|가\s*(있|없|꽉|비|필요|들어))/;

export function pageCue(text, cur, total) {
  const t = String(text || '').toLowerCase();
  const ok = (n) => Number.isInteger(n) && n >= 1 && n <= total ? n : 0;
  let page = 0;

  // 절대 위치 (한국어): "39페이지로", "16쪽 보시면", "12번 슬라이드" — "2번 페이지"는 메모리 page라서 제외
  for (const m of t.matchAll(/(^|[^\d번])\s*(\d{1,3})\s*(페이지|쪽|슬라이드)(.{0,16})/g)) {
    const rest = m[4];
    if (NOT_SLIDE.test(rest)) continue;
    if (DIRECT.test(rest) || MOVE.test(t)) page = ok(Number(m[2])) || page;
  }
  for (const m of t.matchAll(/(\d{1,3})\s*번\s*슬라이드/g)) page = ok(Number(m[1])) || page;

  // 절대 위치 (영어): "turn to page 12", "slide 5" — "page 3 is mapped to frame 7" 같은 문장은 제외
  for (const m of t.matchAll(/(turn to|go to|look at|see|open|back to|skip to|jump to|move to|flip to)\s+(the\s+)?(page|slide)\s*(number\s*)?(\d{1,3})\b/g)) page = ok(Number(m[5])) || page;
  for (const m of t.matchAll(/\bslide\s*(number\s*)?(\d{1,3})\b/g)) page = ok(Number(m[2])) || page;

  // 상대 위치: "다음 장 보시면", "다음 페이지로 넘어가서", "앞 페이지 다시 보면", "next slide"
  const base = page || cur;
  for (const m of t.matchAll(/(다음|이전|앞)\s*(페이지|쪽|슬라이드|장)(.{0,16})/g)) {
    const rest = m[3], d = m[1] === '다음' ? 1 : -1;
    if (NOT_SLIDE.test(rest)) continue;
    // '장'은 교재의 장(chapter)일 수 있어 바로 뒤에 넘김 표현이 있을 때만
    const yes = m[2] === '장' ? /^\s*(으로|로|넘|보시|보면|펴|펼)/.test(rest) : (DIRECT.test(rest) || MOVE.test(t));
    if (yes) page = ok(base + d) || page;
  }
  if (/\b(next|following) slide\b/.test(t) || /\b(turn|go|move|flip)\s+to\s+the\s+next\s+page\b/.test(t)) page = ok(base + 1) || page;
  if (/\b(previous|last) slide\b/.test(t) || /\b(go|move|flip)\s+back\s+(a|one)\s+(page|slide)\b/.test(t)) page = ok(base - 1) || page;

  return page && page !== cur ? page : 0;
}
