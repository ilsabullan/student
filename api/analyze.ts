import { handle, llmJson } from './_lib.js';

const SYSTEM = `너는 대학 강의 자료를 분석해 학생용 수업 노트의 뼈대를 만드는 조교야.
입력: PDF 각 쪽에서 추출한 텍스트(쪽 번호 포함).
출력(JSON 문법을 정확히 지킬 것: 문자열 안에 큰따옴표 금지, 끝 쉼표 금지): 아래 형식의 JSON만. 다른 말은 쓰지 마.
{"title":"강의 제목","chapters":[{"title":"챕터 제목","start":3,"end":4,"type":"flow","page":4,"vizTitle":"시각화 제목","focus":"무엇을, 어떤 값을 조절하며 보여줄지 한 문장"}]}
규칙:
- 챕터는 자료의 목차·섹션 제목 기준. 너무 잘게 나누지 말 것(3~8개). 표지·목차 쪽은 제외하고, 범위는 겹치지 않게 순서대로.
- type: "flow" = 시간·단계에 따라 변하거나 수치 관계·메커니즘이 있어 움직이는 그림과 값 조절로 이해가 쉬워지는 내용.
        "image" = 자료에 이미 그림·도식이 핵심인 내용(그 그림을 움직이는 도식으로 다시 그림).
        "text" = 정의 나열 등 시각화가 필요 없는 내용.
- 대부분의 이공계 강의는 절반 이상의 챕터가 flow 또는 image야. 프로토콜·알고리즘·메시지 교환·상태 변화·구조(필드/계층)·수식은 모두 flow나 image로 분류해. 순수한 역사·정의 나열만 text.
- page: 시각화와 가장 관련 깊은 쪽 번호. vizTitle·focus는 type이 text면 빈 문자열.
- focus에는 조절할 변수(1~3개)와 기본값으로 쓸 자료 속 예시 값을 구체적으로 적어.
- 제목은 한국어, 원문 전문 용어(영어)는 그대로 유지.`;

export const config = { maxDuration: 60 };

export function POST(req: Request) {
  return handle(req, async (b) => {
    const pages: { page: number; text: string }[] = Array.isArray(b.pages) ? b.pages : [];
    if (!pages.length) throw new Error('PDF 텍스트가 비어 있어요');
    const doc = pages.map(p => `[p.${p.page}] ${String(p.text || '').slice(0, 4000)}`).join('\n');
    const out = await llmJson([{ role: 'system', content: SYSTEM }, { role: 'user', content: `파일명: ${b.fileName || ''}\n총 ${b.numPages || pages.length}쪽\n\n${doc}` }], { maxTokens: 3000, temperature: 0.2 });
    const n = Number(b.numPages) || pages.length;
    const chapters = (Array.isArray(out.chapters) ? out.chapters : []).slice(0, 10).map((c: any) => {
      const start = Math.min(n, Math.max(1, Math.round(c.start) || 1)), end = Math.min(n, Math.max(start, Math.round(c.end) || start));
      const type = ['flow', 'image', 'text'].includes(c.type) ? c.type : 'text';
      return { title: String(c.title || '챕터'), start, end, type, page: Math.min(end, Math.max(start, Math.round(c.page) || start)),
        vizTitle: type === 'text' ? '' : String(c.vizTitle || c.title || ''), focus: type === 'text' ? '' : String(c.focus || '') };
    });
    if (!chapters.length) throw new Error('챕터를 찾지 못했어요');
    return { title: String(out.title || ''), chapters };
  });
}
