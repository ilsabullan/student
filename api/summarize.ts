import { handle, llmJson } from './_lib.js';

const SYSTEM = `너는 강의를 듣는 학생의 필기 노트를 정리해 주는 조교야.
입력: 챕터 제목, 강의 자료 쪽 범위, 교수님 발화 받아쓰기(각 줄에 그때 보던 쪽 번호).
출력(JSON 문법을 정확히 지킬 것: 문자열 안에 큰따옴표 금지, 끝 쉼표 금지): 아래 JSON만.
{"items":[{"pre":"앞부분 ","key":"핵심 표현","post":" 뒷부분","star":false,"quote":"","page":12}]}
규칙:
- 3~6개 항목. 한 항목 = 노트 한 줄(40자 안팎). pre+key+post를 이으면 자연스러운 문장이 되게.
- key는 시험에 나올 핵심 개념·수치(한 줄에 하나).
- star:true는 교수님이 그 내용을 말로 직접 강조했을 때만(예: 중요해요, 시험에 나와요, 꼭·반드시, 기억해 두세요, 자주 틀려요. 표현이 달라도 문맥상 강조면 해당). 내용이 중요해 보인다는 이유만으로는 star를 붙이지 마.
- star:true면 quote에 그 강조 말씀이 담긴 받아쓰기 문장을 고치지 말고 그대로 옮겨 적어. star:false면 quote는 빈 문자열.
- page는 그 내용을 말할 때 보던 쪽 번호.
- 받아쓰기 오류는 문맥으로 바로잡고, 잡담은 버려.`;

// '교수님 강조'는 AI가 문맥으로 판단하되, 근거로 든 문장이 실제 받아쓰기에 있을 때만 인정 (지어낸 근거 차단)
const norm = (s: string) => String(s || '').replace(/[\s.,!?~…·'"“”‘’()\[\]-]/g, '');
function verifyStar(quote: unknown, transcript: string) {
  const q = norm(String(quote || ''));
  return q.length >= 4 && transcript.includes(q);
}

export const config = { maxDuration: 60 };

export function POST(req: Request) {
  return handle(req, async (b) => {
    const lines: { text: string; page: number }[] = Array.isArray(b.lines) ? b.lines.slice(-200) : [];
    if (!lines.length) return { items: [] };
    const body = lines.map(l => `[p.${l.page}] ${String(l.text).slice(0, 400)}`).join('\n');
    const out = await llmJson([{ role: 'system', content: SYSTEM }, { role: 'user', content: `챕터: ${b.title || ''} (p.${b.range || ''})\n\n${body}` }], { maxTokens: 1500, temperature: 0.2 });
    const all = norm(lines.map(l => String(l.text)).join(' '));
    const items = (Array.isArray(out.items) ? out.items : []).slice(0, 8).map((it: any) => {
      const star = !!it.star && verifyStar(it.quote, all);
      return { pre: String(it.pre || ''), key: String(it.key || ''), post: String(it.post || ''), star, quote: star ? String(it.quote).trim().slice(0, 160) : '', page: Math.round(Number(it.page)) || null };
    }).filter((it: any) => it.key || it.pre);
    return { items };
  });
}
