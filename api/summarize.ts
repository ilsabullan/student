import { handle, llmJson } from './_lib.js';

const SYSTEM = `너는 강의를 듣는 학생의 필기 노트를 정리해 주는 조교야.
입력: 챕터 제목, 강의 자료 쪽 범위, 교수님 발화 받아쓰기(각 줄에 그때 보던 쪽 번호).
출력(JSON 문법을 정확히 지킬 것: 문자열 안에 큰따옴표 금지, 끝 쉼표 금지): 아래 JSON만.
{"items":[{"pre":"앞부분 ","key":"핵심 표현","post":" 뒷부분","star":false,"page":12}]}
규칙:
- 3~6개 항목. 한 항목 = 노트 한 줄(40자 안팎). pre+key+post를 이으면 자연스러운 문장이 되게.
- key는 시험에 나올 핵심 개념·수치(한 줄에 하나).
- 교수님이 "중요", "시험", "꼭" 등으로 강조한 내용은 star:true.
- page는 그 내용을 말할 때 보던 쪽 번호.
- 받아쓰기 오류는 문맥으로 바로잡고, 잡담은 버려.`;

export const config = { maxDuration: 60 };

export function POST(req: Request) {
  return handle(req, async (b) => {
    const lines: { text: string; page: number }[] = Array.isArray(b.lines) ? b.lines.slice(-200) : [];
    if (!lines.length) return { items: [] };
    const body = lines.map(l => `[p.${l.page}] ${String(l.text).slice(0, 400)}`).join('\n');
    const out = await llmJson([{ role: 'system', content: SYSTEM }, { role: 'user', content: `챕터: ${b.title || ''} (p.${b.range || ''})\n\n${body}` }], { maxTokens: 1500, temperature: 0.2 });
    const items = (Array.isArray(out.items) ? out.items : []).slice(0, 8).map((it: any) => ({
      pre: String(it.pre || ''), key: String(it.key || ''), post: String(it.post || ''), star: !!it.star, page: Math.round(Number(it.page)) || null
    })).filter((it: any) => it.key || it.pre);
    return { items };
  });
}
