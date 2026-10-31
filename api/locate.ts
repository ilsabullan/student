import { handle, llmJson } from './_lib.js';

// 수업 중 교수님 말씀(받아쓰기)으로 지금 설명 중인 강의 자료 쪽과 시각화 단계를 고름
const SYSTEM = `너는 대학 강의를 실시간으로 따라가는 조교야. 교수님 말씀(음성 인식 결과)을 보고 지금 강의 자료의 몇 쪽을 설명 중인지, 그 챕터 시각화의 몇 번째 단계를 설명 중인지 골라.
출력: JSON만. 다른 말은 쓰지 마. 형식: {"page":17,"confidence":0.8,"step":2}
규칙:
- page는 반드시 후보 쪽 중 하나. 판단이 어려우면 현재 쪽을 고르고 confidence를 낮게 줘.
- 현재 쪽 근처는 본문 전체, 나머지 쪽은 앞부분(제목)만 줬어. 멀리 떨어진 쪽으로 옮기는 건 말씀에 그 쪽 번호가 나오거나 그 쪽 제목·내용과 분명히 일치할 때만.
- 강의는 한국어 또는 영어야. 한국어 강의의 음성 인식은 영어 전문 용어를 한글 발음으로 적거나 틀리게 적어(예: TLB→티엘비, page table→페이지 테이블, offset→오프셋). 발음이 비슷하면 같은 말로 봐.
- "16페이지 보시면", "다음 장 넘기면"처럼 강의 자료 쪽을 직접 가리키는 말은 강한 근거야. 단 운영체제 같은 과목에서 '페이지'는 메모리의 page를 뜻할 때가 많으니 문맥으로 구분해.
- 마지막 몇 문장이 가장 중요해. 앞 문장은 맥락으로만 써.
- 쪽에 글자가 거의 없으면(그림 위주) 앞뒤 쪽과 챕터 제목으로 추정해.
- confidence(0~1): 말씀이 그 쪽 내용과 분명히 맞으면 0.8 이상, 비슷한 쪽이 여럿이거나 잡담·공지면 0.4 이하.
- step: page가 속한 챕터의 시각화 단계 목록에서 지금 말씀에 해당하는 번호(0부터). 목록이 없거나 판단이 안 되면 -1.`;

export const config = { maxDuration: 60 };

export function POST(req: Request) {
  return handle(req, async (b) => {
    const lines: string[] = (Array.isArray(b.lines) ? b.lines : []).slice(-10).map((l: unknown) => String(l || '').slice(0, 300)).filter(Boolean);
    const pages: { page: number; text: string }[] = (Array.isArray(b.pages) ? b.pages : []).slice(0, 160);
    if (!lines.length || !pages.length) throw new Error('받아쓰기나 후보 쪽이 비어 있어요');
    const cur = Math.round(Number(b.cur)) || Number(pages[0].page);
    const chapters: { title: string; start: number; end: number; steps: string[] }[] = (Array.isArray(b.chapters) ? b.chapters : []).slice(0, 4);
    const user = [
      `현재 쪽: p.${cur}`,
      '후보 쪽:\n' + pages.map(p => `[p.${p.page}] ${String(p.text || '').slice(0, 700) || '(글자 없음 · 그림 위주)'}`).join('\n'),
      chapters.length ? '챕터별 시각화 단계:\n' + chapters.map(c => `- ${c.title} (p.${c.start}–${c.end}): ` + ((c.steps || []).length ? c.steps.map((s, i) => `${i}) ${s}`).join(' / ') : '(시각화 없음)')).join('\n') : '',
      '최근 받아쓰기 (위가 오래된 것, 아래가 최근):\n' + lines.join('\n')
    ].filter(Boolean).join('\n\n');
    const out = await llmJson([{ role: 'system', content: SYSTEM }, { role: 'user', content: user }], { maxTokens: 200, temperature: 0 });
    const want = Math.round(Number(out.page));
    const valid = pages.some(p => Number(p.page) === want);
    return {
      page: valid ? want : cur,
      confidence: valid ? Math.max(0, Math.min(1, Number(out.confidence) || 0)) : 0,
      step: valid && Number.isInteger(out.step) ? out.step : -1
    };
  });
}
