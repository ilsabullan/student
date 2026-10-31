import { handle, llm, extractCode } from './_lib.js';

const SYSTEM = `You write ONE interactive, step-animated SVG visualization that helps a university student understand a lecture topic.
Output ONLY a single \`\`\`js code block containing one JavaScript object expression wrapped in parentheses. No imports, no DOM APIs, no network, no Math.random, no Date, no loops over 2000 iterations.

Shape:
({
  vizTitle: '짧은 한국어 제목',
  steps: ['1단계 해설 한 문장', '2단계 …'],      // 3–6 short Korean sentences, friendly explanatory tone
  sliders: [{ key: 'a', label: '한국어 라벨', min: 0, max: 100, step: 1, fmt: v => v + '%' }],   // 1–3 numeric sliders
  defaults: { a: 50 },                           // use the example values from the lecture text
  run: (p) => ({ formulaLabel: '공식 이름', formula: '현재 값을 넣은 계산식 = 결과', explain: '지금 값에서 일어나는 일 1–2문장', warn: false }),
  draw: (p, st) => {
    const { R, T, A, L, C, P, G, SVG, h } = kit(st);
    return SVG('0 0 560 220', G(0, ...), G(1, ...), G(2, ...));
  }
})

Drawing kit (already in scope via kit(st)):
- R(kind, x, y, w, h, rx)  rectangle. kind: 'box' (white), 'blue' (accent), 'hi' (yellow highlight), 'green' (result), 'red' (warning)
- T(x, y, text, size, extra)  text. size: 's' small grey 12.5px, undefined 14px, 'b' bold 17px, 'xl' bold 23px. extra e.g. { fill: ACC, textAnchor: 'middle' }
- A(d, { flow, red, op })  arrow along SVG path d with arrowhead; flow:true = animated moving dashes
- L(x1, y1, x2, y2, color, width)  line;  C(cx, cy, r, kind) circle;  P(d, fill, stroke) path
- G(s, ...children)  group that fades in when the current step st >= s. Use G(0) … G(steps.length-1) so each step reveals its part.
- SVG(viewBox, ...children)  root element. Width is always 560; height 160–320.
- h(tag, attrs, ...children)  any other SVG element (svg tags only, camelCase attrs).
Constants: INK, MUTE, ACC, GRN, RED. Helpers: sup(n) superscript string, nf(x) number format, fmtBytes(bytes).

Rules:
- Every shape position, size, count and label must be recomputed from the slider values p, so moving a slider visibly changes the picture.
- Clamp and guard values (no NaN, no negative sizes, max ~40 repeated shapes).
- Korean text is about 14px wide per character at size 14: keep labels short and inside their boxes, stay within x 0–560.
- The number of G stages must equal steps.length. draw must return SVG(...).

Example:
\`\`\`js
({
  vizTitle: '주소 버스와 주소 공간 크기',
  steps: ['CPU가 한 번에 보낼 수 있는 주소 비트 수부터 볼게요.', '비트가 n개면 서로 다른 주소를 2의 n승 개 만들 수 있어요.', '주소 하나당 크기를 곱하면 주소 공간 크기예요.'],
  sliders: [{ key: 'b', label: '주소 버스', min: 8, max: 64, step: 1, fmt: v => v + 'bit' }, { key: 'w', label: '주소 1개당', min: 1, max: 8, step: 1, fmt: v => v + 'Byte' }],
  defaults: { b: 32, w: 1 },
  run: ({ b, w }) => ({ formulaLabel: '주소 공간 = 2^(주소 비트) × 주소당 Byte', formula: '2' + sup(b) + ' × ' + w + 'B = ' + fmtBytes(Math.pow(2, b) * w), explain: '주소 비트가 1개 늘 때마다 주소 공간은 2배가 돼요.' }),
  draw: ({ b, w }, st) => {
    const { R, T, A, L, G, SVG } = kit(st);
    const nl = Math.min(b, 16);
    return SVG('0 0 560 214',
      G(0, T(10, 52, '주소 버스', 's'), R('box', 10, 62, 80, 56, 8), T(34, 96, 'CPU', 'b'),
        Array.from({ length: nl }, (_, i) => L(90, 70 + i * (40 / nl), 190, 70 + i * (40 / nl), '#C9C8F7', 1)), T(104, 132, b + ' lines', 's')),
      G(1, A('M192,90 L218,90', { flow: true }), R('blue', 220, 50, 150, 80, 8), T(234, 74, '만들 수 있는 주소', 's'), T(234, 108, '2' + sup(b) + '개', 'xl', { fill: ACC })),
      G(2, R('green', 10, 170, 410, 40, 8), T(22, 196, '주소 공간 = ' + fmtBytes(Math.pow(2, b) * w), 'b', { fill: GRN })));
  }
})
\`\`\``;

export const config = { maxDuration: 300 };

export function POST(req: Request) {
  return handle(req, async (b) => {
    const user = [
      `챕터: ${b.title || ''} (강의 자료 p.${b.start}–${b.end})`,
      `시각화 제목 후보: ${b.vizTitle || ''}`,
      `보여줄 것: ${b.focus || ''}`,
      b.type === 'image' ? '이 내용은 자료에 이미 그림이 있어요. 그 그림의 구조를 움직이는 도식으로 다시 그려 주세요.' : '',
      `\n강의 자료 텍스트:\n${String(b.text || '').slice(0, 8000)}`
    ].filter(Boolean).join('\n');
    const messages: any[] = [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }];
    if (b.prev && b.error) {
      messages.push({ role: 'assistant', content: '```js\n' + String(b.prev).slice(0, 12000) + '\n```' });
      messages.push({ role: 'user', content: `위 코드를 실행하니 오류가 났어요: ${String(b.error).slice(0, 500)}\n오류를 고친 전체 코드를 같은 형식으로 다시 주세요.` });
    }
    const code = extractCode(await llm(messages, { maxTokens: 8000, temperature: 0.4 }));
    if (code.length < 40) throw new Error('시각화 코드가 너무 짧아요: ' + code.slice(0, 80));
    return { code };
  });
}
