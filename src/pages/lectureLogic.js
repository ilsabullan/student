import React from 'react';
import { DCLogic } from '../dc';
import View from './LectureView.jsx';
import SELF_SRC from './lectureLogic.js?raw';
import { AIX, makeSim, api, LANGS, langLabel, rememberLang, fitSvgBox } from '../ai/client.js';
import { RUNNER_SRC } from '../ai/runner.js';
import { saveProgress, clearSession } from '../ai/session.js';
import { pageCue } from '../ai/pagecue.js';

const nf = (x) => Number.isInteger(x) ? String(x) : x.toFixed(1);
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const sup = (n) => String(n).split('').map(c => SUP[c] || c).join('');
const fmtBytes = (x) => { const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB']; let i = 0; while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; } return nf(x) + u[i]; };

const TOTAL = 43;
const PT = [2, 5, 8, 6, 3, 4, 0, 1, 7, 9];
const SIZES = [1, 2, 4, 8];
const TLB_IDX = 4;
const LAY_KEY = 'visync.lectureOS.layout.v5';
const DEF_LAY = { slide: { x: 0, y: 0, w: 0.44, h: 380 }, notes: { x: 0, y: 394, w: 0.44, h: 480 }, viz: { x: 0.455, y: 0, w: 0.545, h: 874 } };
const STACK_LAY = { slide: { x: 0, y: 0, w: 1, h: 320 }, notes: { x: 0, y: 334, w: 1, h: 420 }, viz: { x: 0, y: 768, w: 1, h: 900 } };
const defLay = (bw, aspect, bh) => {
  if (!bw) return JSON.parse(JSON.stringify(DEF_LAY));
  const ar = aspect || 0.75, chrome = 47 + 28 + 4;
  if (bw < 720) { const sh = Math.round(chrome + (bw - 32) * ar); return { slide: { x: 0, y: 0, w: 1, h: sh }, notes: { x: 0, y: sh + 14, w: 1, h: 420 }, viz: { x: 0, y: sh + 448, w: 1, h: 900 } }; }
  const vh = Math.max(360, bh || 874), maxSh = vh - 14 - 220;
  let sw = 0.44, sh = Math.round(chrome + (sw * bw - 32) * ar);
  if (sh > maxSh) { sw = Math.max(0.3, ((maxSh - chrome) / ar + 32) / bw); sh = Math.round(chrome + (sw * bw - 32) * ar); }
  const ny = sh + 14, vx = sw + 0.015;
  return { slide: { x: 0, y: 0, w: sw, h: sh }, notes: { x: 0, y: ny, w: sw, h: Math.max(220, vh - ny) }, viz: { x: vx, y: 0, w: 1 - vx, h: Math.max(vh, ny + 220) } };
};
const loadLay = () => { try { const v = JSON.parse(localStorage.getItem(LAY_KEY)); if (v && v.slide && v.viz && v.notes) return v; } catch (x) {} return null; };

const e = React.createElement;
const INK = '#1C1D22', MUTE = '#8A8D98', ACC = '#5B5FE8', GRN = '#1F8A5B', RED = '#D2383E';
const BX = { box: ['#FFFFFF', '#D5D7DE', 1.2], blue: ['#F1F1FE', '#7C7FF2', 1.6], hi: ['#FFF4D6', '#E0A526', 2], green: ['#E7F6EE', '#2FA876', 1.6], red: ['#FDECEC', '#E5484D', 1.6] };
let K = 0;
const k = () => 'k' + (K++);
function kit(st) {
  K = 0;
  const R = (t, x, y, w, h, rx = 0) => { const [f, s, sw] = BX[t]; return e('rect', { key: k(), x, y, width: w, height: h, rx, fill: f, stroke: s, strokeWidth: sw, style: { transition: 'all .3s' } }); };
  const T = (x, y, str, t, ex = {}) => e('text', { key: k(), x, y, fontSize: t === 's' ? 12.5 : t === 'b' ? 17 : t === 'xl' ? 23 : 14, fontWeight: (t === 'b' || t === 'xl') ? 700 : 500, fill: t === 's' ? MUTE : INK, fontFamily: 'inherit', ...ex }, str);
  const A = (d, o = {}) => e('path', { key: k(), d, fill: 'none', stroke: o.red ? '#E5484D' : '#4B4E58', strokeWidth: 1.6, markerEnd: o.red ? 'url(#vzahr)' : 'url(#vzah)', strokeDasharray: o.flow ? '6 5' : undefined, style: { animation: o.flow ? 'vzdash 1s linear infinite' : undefined, opacity: o.op ?? 1, transition: 'opacity .3s' } });
  const G = (s, ...ch) => e('g', { key: k(), style: { opacity: st >= s ? 1 : 0, transition: 'opacity .5s ease' } }, ...ch.flat());
  const mk = (id, c) => e('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, e('path', { d: 'M0,0L10,5L0,10z', fill: c }));
  const SVG = (vb, ...ch) => e('svg', { viewBox: vb, style: { width: '100%', minWidth: 500, height: 'auto', display: 'block', overflow: 'visible' } }, e('defs', { key: 'defs' }, mk('vzah', '#4B4E58'), mk('vzahr', '#E5484D')), ...ch.flat().filter(Boolean));
  return { R, T, A, G, SVG };
}

const CH = [
  { title: '주소 공간', type: 'flow', page: 4, at: '04:30', vizTitle: '주소 버스와 주소 공간 크기',
    steps: ['CPU가 한 번에 보낼 수 있는 주소 비트 수부터 볼게요.', '비트가 n개면 서로 다른 주소를 2의 n승 개 만들 수 있죠.', '그래서 0부터 2의 n승 빼기 1까지 주소를 쓸 수 있습니다.', '주소 하나당 1바이트면 그게 곧 주소 공간 크기예요.'],
    sim: {
      sliders: [{ key: 'b', label: '주소 버스', min: 8, max: 64, step: 1, fmt: v => v + 'bit' }, { key: 'w', label: '주소 1개당', min: 1, max: 8, step: 1, fmt: v => v + 'Byte' }],
      defaults: { b: 32, w: 1 },
      run: ({ b, w }) => ({
        formulaLabel: '주소 공간 = 2^(주소 비트) × 주소당 Byte',
        formula: '2' + sup(b) + ' × ' + w + 'B = ' + fmtBytes(Math.pow(2, b) * w),
        explain: b === 32 && w === 1 ? '슬라이드 4쪽 질문의 답이에요. 32bit 주소 버스에 주소당 1Byte면 2³² Byte = 4GB입니다.' : '주소 비트가 1개 늘 때마다 주소 공간은 2배가 돼요. 64bit 시스템의 주소 공간이 상상 이상으로 큰 이유입니다.'
      }),
      draw: ({ b, w }, st) => {
        const { R, T, A, G, SVG } = kit(st);
        const size = fmtBytes(Math.pow(2, b) * w), hex = '0x' + (2n ** BigInt(b) - 1n).toString(16).toUpperCase();
        const nl = Math.min(b, 16);
        return SVG('0 0 560 214',
          G(0, T(10, 52, '주소 버스', 's'), R('box', 10, 62, 80, 56, 8), T(34, 96, 'CPU', 'b'),
            Array.from({ length: nl }, (_, i) => e('line', { key: k(), x1: 90, x2: 190, y1: 70 + i * (40 / nl), y2: 70 + i * (40 / nl), stroke: '#C9C8F7', strokeWidth: 1 })),
            T(104, 132, b + ' lines', 's')),
          G(1, A('M192,90 L218,90', { flow: true }), R('blue', 220, 50, 150, 80, 8), T(234, 74, '만들 수 있는 주소', 's'), T(234, 108, '2' + sup(b) + '개', 'xl', { fill: ACC })),
          G(2, A('M370,90 L418,90', { flow: true }), R('box', 420, 10, 130, 150, 6), T(430, 28, '0x0', 's'), T(430, 152, b <= 32 ? hex : '2' + sup(b) + '−1', 's'), T(456, 94, 'Memory')),
          G(3, R('green', 10, 170, 410, 40, 8), T(22, 196, '주소 공간 = 2' + sup(b) + ' × ' + w + 'B = ' + size, 'b', { fill: GRN })));
      }
    } },
  { title: '물리 주소와 가상 주소', type: 'flow', page: 10, at: '11:20', vizTitle: 'Relocation register 주소 변환',
    steps: ['CPU는 프로세스 기준의 가상 주소를 만들어요.', '예를 들어 346번지라고 해볼게요.', 'MMU가 relocation register 값을 더해 줍니다.', '그 결과가 실제 메모리 주소, 물리 주소예요.', '이 주소로 실제 메모리에 접근하는 거죠.'],
    sim: {
      sliders: [{ key: 'va', label: '가상 주소', min: 0, max: 2000, step: 1, fmt: v => String(v) }, { key: 'reg', label: 'Relocation register', min: 0, max: 30000, step: 1000, fmt: v => String(v) }],
      defaults: { va: 346, reg: 14000 },
      run: ({ va, reg }) => ({
        formulaLabel: 'PA = VA + relocation register',
        formula: va + ' + ' + reg + ' = ' + (va + reg),
        explain: '프로세스는 가상 주소만 만들고, MMU가 relocation register 값을 더해 물리 주소로 바꿔요. 레지스터 값만 바꾸면 다시 컴파일하지 않고도 프로그램 위치를 옮길 수 있습니다.'
      }),
      draw: ({ va, reg }, st) => {
        const { R, T, A, G, SVG } = kit(st);
        const pa = va + reg;
        return SVG('0 0 560 222',
          G(0, R('box', 10, 80, 90, 56, 8), T(38, 114, 'CPU', 'b')),
          G(1, A('M100,108 L266,108', { flow: true }), T(112, 98, 'virtual address', 's'), T(128, 132, String(va), 'b', { fill: ACC })),
          G(2, R('blue', 215, 14, 150, 46, 6), T(228, 32, 'relocation register', 's'), T(252, 52, String(reg), 'b'), A('M290,60 L290,84'),
            e('circle', { key: k(), cx: 290, cy: 108, r: 22, fill: '#FFF4D6', stroke: '#E0A526', strokeWidth: 2 }), T(284, 114, '+', 'b'), T(276, 150, 'MMU', 's')),
          G(3, A('M312,108 L438,108', { flow: true }), T(326, 98, 'physical address', 's'), T(340, 132, String(pa), 'b', { fill: GRN }), R('box', 440, 30, 110, 160, 6), T(452, 212, 'Physical memory', 's')),
          G(4, R('green', 440, 30 + Math.min(140, (pa / 32000) * 140), 110, 20)));
      }
    } },
  { title: '가상 메모리', type: 'image', page: 15, at: '19:05', vizTitle: '가상 메모리와 Swap space',
    steps: ['프로세스는 자기만의 큰 주소 공간을 본다고 생각해요.', '어디가 실제 메모리에 있는지는 페이지 테이블이 기억하고요.', '지금 실행에 필요한 부분만 물리 메모리에 올라가요.', '나머지는 디스크의 swap 공간에 있다가 필요할 때 올라옵니다.'],
    sim: {
      sliders: [{ key: 'v', label: '프로세스 페이지 수', min: 4, max: 32, step: 1, fmt: v => v + '개' }, { key: 'm', label: '할당된 프레임 수', min: 1, max: 16, step: 1, fmt: v => v + '개' }],
      defaults: { v: 16, m: 6 },
      run: ({ v, m }) => { const inMem = Math.min(v, m), pct = Math.round(inMem / v * 100); return {
        formulaLabel: '적재 비율 = 적재된 페이지 ÷ 전체 페이지',
        formula: inMem + ' ÷ ' + v + ' = ' + pct + '%',
        explain: '프로세스 전체가 메모리에 없어도 실행할 수 있어요. 지금 실행 중인 code·data·stack의 일부만 있으면 되고, 나머지는 swap space에서 기다립니다.' }; },
      draw: ({ v, m }, st) => {
        const { R, T, A, G, SVG } = kit(st);
        const inMem = Math.min(v, m), swap = v - inMem, ch = 200 / v, fh = 130 / m;
        return SVG('0 0 560 236',
          G(0, T(10, 12, '가상 주소 공간 (page ' + v + '개)', 's'), Array.from({ length: v }, (_, i) => R(i < inMem ? 'blue' : 'hi', 10, 20 + i * ch, 100, ch))),
          G(1, A('M110,120 L198,120', { flow: true }), R('blue', 200, 80, 120, 80, 8), T(222, 116, 'Page table'), T(222, 136, v + '개 항목', 's')),
          G(2, A('M320,104 L398,70', { flow: true }), T(400, 12, '물리 메모리 (frame ' + m + '개)', 's'), Array.from({ length: m }, (_, j) => R(j < inMem ? 'green' : 'box', 400, 20 + j * fh, 150, fh))),
          G(3, A('M320,140 L398,200', { flow: swap > 0, op: swap ? 1 : 0.25 }), R(swap ? 'hi' : 'box', 400, 170, 150, 60, 8), T(412, 196, 'Swap space'), T(412, 216, swap ? swap + '개 페이지 대기' : '비어 있음', 's')));
      }
    } },
  { title: 'Paging', type: 'flow', page: 17, at: '27:40', vizTitle: '가상 주소 → 물리 주소 변환',
    steps: ['가상 주소 8200을 예로 들어볼게요.', '페이지 크기로 나누면 몫이 페이지 번호, 나머지가 offset이에요.', '페이지 번호로 page table을 찾아가면', '해당 페이지가 올라간 frame 번호가 나오고요.', 'frame 시작 주소에 offset을 그대로 붙이면 물리 주소입니다.'],
    sim: {
      sliders: [{ key: 'va', label: '가상 주소', min: 0, max: 40959, step: 1, fmt: v => String(v) }, { key: 'sz', label: '페이지 크기', min: 0, max: 3, step: 1, fmt: v => SIZES[v] + 'KB' }],
      defaults: { va: 8200, sz: 2 },
      run: ({ va, sz }) => {
        const S = SIZES[sz] * 1024, page = Math.floor(va / S), off = va % S, ok = page < PT.length;
        return {
          formulaLabel: '물리 주소 = frame × 페이지 크기 + offset',
          formula: ok ? PT[page] + ' × ' + S + ' + ' + off + ' = ' + (PT[page] * S + off) : 'page ' + page + ' ≥ PTLR(' + PT.length + ') → 범위 초과',
          warn: !ok,
          explain: ok ? '주소는 페이지 번호와 offset으로 나뉘어요. 페이지 크기가 ' + SIZES[sz] + 'KB면 offset은 하위 ' + Math.log2(S) + '비트예요. 페이지 번호로 frame을 찾고, offset은 그대로 붙입니다.' : '예시 page table에는 0–9번 항목만 있어서 trap(보호 오류)이 나요. 가상 주소를 줄이거나 페이지 크기를 키워보세요.'
        };
      },
      draw: ({ va, sz }, st) => {
        const { R, T, A, G, SVG } = kit(st);
        const S = SIZES[sz] * 1024, page = Math.floor(va / S), off = va % S, bits = Math.log2(S), ok = page < PT.length;
        const fr = ok ? PT[page] : -1, pa = ok ? fr * S + off : 0, py = 27 + Math.min(page, 9) * 19;
        return SVG('0 0 560 290',
          G(0, T(10, 40, '가상 주소', 's'), T(10, 66, String(va), 'xl', { fill: ACC })),
          G(1, R('blue', 10, 80, 70, 40), R('box', 80, 80, 100, 40), T(18, 96, 'page #', 's'), T(18, 114, String(page), 'b'), T(88, 96, 'offset (' + bits + 'bit)', 's'), T(88, 114, String(off), 'b'), T(10, 140, va + ' ÷ ' + S + ' = ' + page + ' … ' + off, 's')),
          G(1, T(215, 12, 'Page table (PTBR)', 's'), PT.map((f, i) => [R(i === page ? 'hi' : 'box', 215, 18 + i * 19, 100, 19), T(223, 32 + i * 19, String(i), 's'), T(290, 32 + i * 19, String(f), i === page ? 'b' : '', i === page ? { fontSize: 13 } : {})])),
          G(1, T(440, 12, 'Physical memory', 's'), PT.map((_, i) => [R(i === fr ? 'green' : 'box', 440, 18 + i * 19, 110, 19), T(448, 32 + i * 19, 'frame ' + i, 's', i === fr ? { fill: GRN, fontWeight: 700 } : {})])),
          G(2, A('M45,80 C45,40 160,' + py + ' 213,' + py, { flow: true, red: !ok })),
          ok ? G(3, A('M315,' + py + ' C380,' + py + ' 380,' + (27 + fr * 19) + ' 438,' + (27 + fr * 19), { flow: true })) : null,
          ok ? G(4, R('green', 10, 228, 420, 56, 8), T(22, 249, '물리 주소 = frame × page 크기 + offset', 's'), T(22, 273, fr + ' × ' + S + ' + ' + off + ' = ' + pa, 'b', { fill: GRN }))
             : G(3, R('red', 10, 228, 420, 56, 8), T(22, 252, 'page ' + page + ' ≥ PTLR(' + PT.length + ')', 'b', { fill: RED }), T(22, 273, '페이지 테이블 범위 밖이라 trap(보호 오류)이 납니다', 's')));
      }
    } },
  { title: 'TLB', type: 'flow', page: 25, at: '41:10', vizTitle: 'TLB를 이용한 주소 변환',
    steps: ['CPU가 page 번호를 넘기면', '먼저 MMU 안의 TLB부터 찾아봐요.', '있으면 frame 번호를 바로 얻고요.', '없으면 메모리의 page table까지 가야 하죠.', '그다음에 실제 데이터에 접근합니다.'],
    sim: {
      sliders: [{ key: 'h', label: 'TLB hit ratio', min: 0, max: 100, step: 1, fmt: v => v + '%' }, { key: 'tt', label: 'TLB 검색', min: 5, max: 50, step: 5, fmt: v => v + 'ns' }, { key: 'mt', label: '메모리 접근', min: 50, max: 200, step: 10, fmt: v => v + 'ns' }],
      defaults: { h: 80, tt: 20, mt: 100 },
      run: ({ h, tt, mt }) => {
        const r = h / 100, eat = r * (tt + mt) + (1 - r) * (tt + 2 * mt), base = 2 * mt;
        return {
          formulaLabel: 'EAT = h × (TLB + M) + (1 − h) × (TLB + 2M)',
          formula: nf(r) + '×' + (tt + mt) + ' + ' + nf(1 - r) + '×' + (tt + 2 * mt) + ' = ' + nf(eat) + 'ns',
          warn: eat > base,
          explain: eat > base ? 'hit ratio가 너무 낮으면 TLB 검색 시간만 더해져 TLB가 없을 때(' + base + 'ns)보다 오히려 느려져요.' : '페이징만 쓰면 매번 메모리를 두 번(page table + 데이터) 접근해야 해요(' + base + 'ns). TLB에 최근 변환 결과를 두면 hit일 때 한 번에 끝납니다.'
        };
      },
      draw: ({ h }, st, tk) => {
        const { R, T, A, G, SVG } = kit(st);
        const live = tk && st >= 4, hitOp = live ? (tk.hit ? 1 : 0.15) : 1, missOp = live ? (tk.hit ? 0.15 : 1) : 1;
        return SVG('0 0 560 244',
          G(0, R('box', 10, 92, 70, 46, 8), T(28, 120, 'CPU', 'b'), A('M80,115 L138,115')),
          G(1, R('blue', 140, 72, 120, 86, 8), T(182, 96, 'TLB', 'b'), T(152, 116, 'MMU 안 레지스터', 's'), T(152, 136, 'page → frame', 's')),
          G(2, A('M260,102 L418,102', { flow: live && tk.hit, op: hitOp }), T(296, 94, 'HIT · 메모리 1회', 's', { fill: GRN, opacity: hitOp })),
          G(3, R('box', 140, 188, 120, 40, 6), T(150, 212, 'Page table (메모리)', 's'), A('M200,158 L200,186', { red: true, op: missOp }), A('M260,208 C360,208 380,146 418,140', { red: true, flow: live && !tk.hit, op: missOp }), T(296, 238, 'MISS · 메모리 2회', 's', { fill: RED, opacity: missOp })),
          G(4, R('box', 420, 72, 130, 86, 8), T(436, 120, 'Physical memory')),
          live ? [T(10, 26, 'page ' + tk.page + ' → ' + (tk.hit ? 'TLB HIT' : 'TLB MISS · page table 조회'), 'b', { fill: tk.hit ? GRN : RED }), T(10, 48, 'hit ' + tk.hits + ' · miss ' + (tk.n - tk.hits) + ' · 실측 hit ratio ' + Math.round(tk.hits / tk.n * 100) + '% (설정 ' + h + '%)', 's')] : T(10, 26, '주소 변환 대기 중…', 's'));
      }
    } },
  { title: '다양한 paging table', type: 'flow', page: 27, at: '48:30', vizTitle: '2-level page table',
    steps: ['32비트 주소를 10, 10, 12비트로 나눠요.', '앞 10비트로 바깥 테이블을 찾고', '거기서 가리키는 안쪽 테이블에서 다음 10비트로 frame을 찾죠.', '마지막에 frame에 offset을 붙이면 끝입니다.'],
    sim: {
      sliders: [{ key: 'p1', label: 'p1 (L1 index)', min: 0, max: 1023, step: 1, fmt: v => String(v) }, { key: 'p2', label: 'p2 (L2 index)', min: 0, max: 1023, step: 1, fmt: v => String(v) }, { key: 'd', label: 'offset d', min: 0, max: 4095, step: 1, fmt: v => String(v) }],
      defaults: { p1: 1, p2: 5, d: 300 },
      run: ({ p1, p2, d }) => {
        const a = p1 * 4194304 + p2 * 4096 + d;
        return {
          formulaLabel: 'VA = p1 × 2²² + p2 × 2¹² + d',
          formula: p1 + '·2²² + ' + p2 + '·2¹² + ' + d + ' = 0x' + a.toString(16).toUpperCase().padStart(8, '0'),
          explain: '단일 page table은 2²⁰ × 4B = 4MB가 항상 필요하지만, 2단계로 나누면 실제로 쓰는 영역의 L2 table만 만들면 돼요. 12KB 프로세스라면 L1 1개 + L2 3개 = 16KB면 충분합니다. 대신 변환할 때 메모리를 한 번 더 찾아가야 해요.'
        };
      },
      draw: ({ p1, p2, d }, st) => {
        const { R, T, A, G, SVG } = kit(st);
        const a = p1 * 4194304 + p2 * 4096 + d, bin = a.toString(2).padStart(32, '0'), hex = '0x' + a.toString(16).toUpperCase().padStart(8, '0');
        const mono = { fontFamily: 'ui-monospace,monospace', fontSize: 11 };
        const y1 = 104 + (p1 % 10) * 11, y2 = 104 + (p2 % 10) * 11;
        return SVG('0 0 560 252',
          G(0, T(10, 18, '32bit 가상 주소 ' + hex, 's'), R('blue', 10, 26, 160, 34), R('hi', 170, 26, 160, 34), R('green', 330, 26, 220, 34),
            T(18, 48, bin.slice(0, 10), '', mono), T(178, 48, bin.slice(10, 20), '', mono), T(338, 48, bin.slice(20), '', mono),
            T(16, 78, 'p1 (10bit) = ' + p1, 's'), T(176, 78, 'p2 (10bit) = ' + p2, 's'), T(336, 78, 'offset d (12bit) = ' + d, 's')),
          G(1, R('box', 20, 100, 120, 118), T(28, 238, 'Outer (L1) table', 's'), R('blue', 20, y1, 120, 13), T(26, y1 + 10, '[' + p1 + ']', 's', { fill: INK })),
          G(2, A('M140,' + (y1 + 6) + ' C180,' + (y1 + 6) + ' 180,160 218,160', { flow: true }), R('box', 220, 100, 120, 118), T(228, 238, 'Inner (L2) table', 's'), R('hi', 220, y2, 120, 13), T(226, y2 + 10, '[' + p2 + '] → frame', 's', { fill: INK })),
          G(3, A('M340,' + (y2 + 6) + ' C380,' + (y2 + 6) + ' 380,160 418,160', { flow: true }), R('green', 420, 115, 130, 90, 6), T(432, 155, 'frame + d(' + d + ')'), T(432, 176, '→ 물리 주소', 's')));
      }
    } }
];
const KEEP = { viewBox: 1, refX: 1, refY: 1, markerWidth: 1, markerHeight: 1 };
const kebab = (k) => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
const escX = (x) => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const toMarkup = (el) => {
  if (el == null || el === false || el === true) return '';
  if (Array.isArray(el)) return el.map(toMarkup).join('');
  if (typeof el !== 'object') return escX(el);
  const { children, style, ...props } = el.props || {};
  let attrs = '';
  Object.keys(props).forEach(k => { const v = props[k]; if (v == null) return; attrs += ' ' + (KEEP[k] ? k : kebab(k)) + '="' + escX(v) + '"'; });
  if (style) { const css = Object.keys(style).filter(k => style[k] != null && k !== 'transition').map(k => kebab(k) + ':' + (typeof style[k] === 'number' && k !== 'opacity' ? style[k] + 'px' : style[k])).join(';'); if (css) attrs += ' style="' + escX(css) + '"'; }
  return '<' + el.type + attrs + '>' + toMarkup(children) + '</' + el.type + '>';
};
const ser = (v) => typeof v === 'function' ? v.toString() : Array.isArray(v) ? '[' + v.map(ser).join(',') + ']' : (v && typeof v === 'object') ? '{' + Object.keys(v).map(k2 => JSON.stringify(k2) + ':' + ser(v[k2])).join(',') + '}' : JSON.stringify(v);
const SUM_PAGES = [[4,4,4],[5,12,10,11],[13,15],[16,18,20],[24,24,24],[26,27,35]];
const RANGES = ['3–4', '5–12', '13–15', '16–23', '24–25', '26–43'];
const SUMMARY = [
  [{ pre: '주소 공간: 프로세스가 ', key: '참조할 수 있는 주소의 범위', post: '' },
   { pre: '크기는 ', key: 'CPU 주소 버스 크기', post: '에 의존' },
   { pre: '32bit · 주소당 1Byte → ', key: '2³² Byte = 4GB', post: '', star: true }],
  [{ pre: '프로세스는 ', key: '가상 주소', post: '를 사용, 메모리 접근은 물리 주소로' },
   { pre: '', key: 'MMU', post: '가 가상 주소를 물리 주소로 번역' },
   { pre: '초기 방식: ', key: 'PA = VA + relocation register', post: '' },
   { pre: '변환 속도가 ', key: '전체 성능', post: '을 좌우', star: true }],
  [{ pre: '프로그램 전체가 아니라 ', key: '실행 중인 일부만', post: ' 물리 메모리에 있으면 실행 가능' },
   { pre: '나머지는 ', key: 'Swap space', post: '(보조기억장치)에 저장' }],
  [{ pre: '가상 메모리는 ', key: 'page', post: ', 물리 메모리는 frame. 크기는 같음 (보통 4KB)' },
   { pre: '주소 = ', key: 'page 번호 + offset', post: '', star: true },
   { pre: 'page table은 ', key: '프로세스마다 하나', post: ', PTBR이 위치를 가리킴' }],
  [{ pre: '페이징은 ', key: '메모리 접근이 2번', post: ' (page table + 데이터)' },
   { pre: 'TLB: ', key: '변환 결과를 저장하는 MMU 안의 캐시', post: '' },
   { pre: '', key: 'TLB hit ratio', post: '가 높을수록 빠름', star: true }],
  [{ pre: '32bit · 4KB 페이지면 단일 PT 크기 ', key: '4MB', post: '' },
   { pre: '2단계: ', key: 'p1(10) · p2(10) · d(12)', post: '로 분할', star: true },
   { pre: 'Inverted PT: ', key: '시스템 전체에 하나', post: ', 대신 검색 시간 증가' }]
];
const SEC0 = 1670, GAP = 6;
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
const toSec = (t) => { const [m, s] = t.split(':').map(Number); return m * 60 + s; };
const SCRIPT = [
  ['03:05', '먼저 주소 공간부터 볼게요. 주소 공간은 프로세스가 참조할 수 있는 주소의 범위예요.', 4, 0, 0],
  ['04:30', '32비트 주소 버스면 2의 32승 개, 주소당 1바이트면 4기가바이트죠.', 4, 0, 3],
  ['10:12', 'CPU가 만드는 주소는 가상 주소고요, MMU가 이걸 물리 주소로 바꿔줍니다.', 5, 1, 0],
  ['11:20', '10페이지 예시 보면, 346에 relocation register 14000을 더해서 14346이 돼요.', 10, 1, 4],
  ['18:40', '가상 메모리의 핵심은, 프로그램 전체가 메모리에 있을 필요가 없다는 거예요.', 13, 2, 0],
  ['19:05', '지금 필요한 부분만 메모리에 올리고, 나머지는 swap 공간에 둬요.', 15, 2, 3],
  ['25:10', '16페이지, Paging입니다. 가상 메모리는 page, 물리 메모리는 frame으로 나눠요.', 16, 3, -1],
  ['26:30', 'page랑 frame 크기는 같고 보통 4KB를 씁니다.', 16, 3, -1],
  ['27:40', '17페이지 표 보세요. 가상 주소 8200을 예로 들어볼게요.', 17, 3, 0],
  [null, '페이지 크기가 4096이니까 나누면 몫이 2, 나머지가 8이죠.', 17, 3, 1],
  [null, '2번 페이지를 page table에서 찾아가면', 17, 3, 2],
  [null, 'frame 번호 8이 나오고요.', 17, 3, 3],
  [null, 'frame 시작 주소에 offset 8을 그대로 붙이면 물리 주소 32776이에요.', 17, 3, 4],
  [null, 'offset은 바뀌지 않는다, 이게 포인트입니다. 시험에 나와요.', 18, 3, -1],
  [null, 'page table은 물리 메모리에 있고, PTBR이 그 위치를 가리켜요.', 20, 3, -1],
  [null, '각 항목을 PTE라고 하는데, present bit나 dirty bit 같은 플래그가 들어가요.', 23, 3, -1],
  [null, '그런데 이러면 데이터 하나 읽을 때 메모리를 두 번 가야 하죠.', 24, 4, 0],
  [null, '그래서 MMU 안에 TLB라는 캐시를 둡니다.', 24, 4, 1],
  [null, 'TLB에 있으면 frame 번호를 바로 얻고요.', 25, 4, 2],
  [null, '없으면 page table까지 가야 하니까 두 번이에요.', 25, 4, 3],
  [null, 'hit ratio가 높을수록 평균 접근 시간이 줄어듭니다.', 25, 4, 4],
  [null, '다음은 페이지 테이블 자체가 너무 커지는 문제예요. 32비트면 4MB나 필요하죠.', 26, 5, -1],
  [null, '그래서 주소를 10, 10, 12비트로 나눕니다.', 27, 5, 0],
  [null, '앞 10비트로 바깥 테이블을 찾고', 28, 5, 1],
  [null, '안쪽 테이블에서 다음 10비트로 frame을 찾죠.', 29, 5, 2],
  [null, '마지막에 offset을 붙이면 물리 주소가 됩니다.', 29, 5, 3]
];
const HEARD0 = SCRIPT.findIndex(x => x[0] === null);
SCRIPT.forEach((x, i) => { if (x[0] === null) x[0] = fmt(SEC0 + (i - HEARD0 + 1) * GAP); });
const liveOf = (n) => SCRIPT[n - 1][3];
const liveStepOf = (n, ch) => SCRIPT.slice(0, n).reduce((m, x) => x[3] === ch ? Math.max(m, x[4]) : m, 0);
const vizAt = (i) => { if (AIX.on) return AIX.vizTimes[i] || ''; const l = SCRIPT.find(x => x[3] === i && x[4] === 0); return l ? l[0] : ''; };
const initParams = () => CH.map(c => c.sim ? { ...c.sim.defaults } : {});
const DEMO = { CH: CH.slice(), SUMMARY: SUMMARY.slice(), SUM_PAGES: SUM_PAGES.slice(), RANGES: RANGES.slice() };
const swap = (arr, items) => { arr.splice(0, arr.length, ...items); };
// 온보딩에서 받은 AI 분석 결과로 챕터·요약·시각화 데이터를 교체 (없으면 데모 데이터 복원)
function applyAI(comp) {
  const a = window.__visync && window.__visync.analysis;
  AIX.on = !!a; AIX.vizTimes = {}; AIX.sayAt = {};
  AIX.pages = a && Array.isArray(a.pages) && a.pages.length ? a.pages : null; // 있으면 교수님 말씀으로 위치를 따라감
  if (!a) { swap(CH, DEMO.CH); swap(SUMMARY, DEMO.SUMMARY); swap(SUM_PAGES, DEMO.SUM_PAGES); swap(RANGES, DEMO.RANGES); return 0; }
  swap(CH, a.chapters.map(c => ({
    title: c.title, start: c.start, end: c.end, page: c.page, at: '',
    type: c.viz ? (c.type === 'image' ? 'image' : 'flow') : 'text',
    vizTitle: c.viz ? c.viz.vizTitle : c.title, steps: c.viz ? c.viz.steps : [],
    sim: c.viz ? makeSim(c.viz, () => comp.forceUpdate()) : null
  })));
  swap(SUMMARY, CH.map(() => []));
  swap(SUM_PAGES, CH.map(() => []));
  swap(RANGES, CH.map(c => c.start === c.end ? String(c.start) : c.start + '–' + c.end));
  return 1;
}
const chapterOf = (page) => { let k = 0; CH.forEach((c, i) => { if (c.start != null && page >= c.start) k = i; }); return k; };

class Component extends DCLogic {
  live() { return AIX.on ? this.state.aiLive : liveOf(this.state.heard); }
  syncFor(heard, s) {
    if (!s.follow) return {};
    const ch = liveOf(heard), n = CH[ch].steps.length;
    return { sel: ch, page: SCRIPT[heard - 1][2], step: s.explored[ch] ? n - 1 : liveStepOf(heard, ch), playing: false, tlb: ch !== s.sel ? null : s.tlb };
  }
  goLive() {
    if (AIX.on) { this.setState(s => { const ch = chapterOf(s.aiPage), n = CH[ch].steps.length; return { follow: true, sel: ch, page: s.aiPage, step: s.explored[ch] ? Math.max(0, n - 1) : Math.min(this.lastStep[ch] || 0, Math.max(0, n - 1)), playing: !s.explored[ch] && !AIX.pages }; }); return; }
    this.setState(s => ({ follow: true, ...this.syncFor(s.heard, { ...s, follow: true }) }));
  }
  _ai = applyAI(this);
  state = { heard: HEARD0, follow: true, explored: {}, sel: liveOf(HEARD0), step: liveStepOf(HEARD0, liveOf(HEARD0)), playing: false, recording: true, sec: SEC0, tab: 'summary', extra: 0, tick: 0, endOpen: false, toast: '', page: SCRIPT[HEARD0 - 1][2], params: initParams(), pdfLoading: true, pdfMsg: '강의 자료 불러오는 중…', tlb: null, mode: 'demo', micLines: [], interim: '', lay: loadLay(), fromStore: true, aspect: 0.75, vw: typeof window !== 'undefined' ? window.innerWidth : 1280, bh: 0, mtab: 'slide', bw: 0, zs: ['slide', 'notes', 'viz'], active: null };
  _aiInit = AIX.on ? Object.assign(this.state, { mode: 'mic', recording: false, heard: HEARD0, sel: 0, step: 0, playing: true, aiLive: 0, aiPage: CH[0].page, page: CH[0].page, params: initParams(), tab: 'transcript', sec: 0, lang: (window.__visync && window.__visync.lang) || 'ko-KR' }) : 0;
  sumDone = {}; sumBusy = {}; lastStep = {};
  _restored = AIX.on ? this.restore() : false;
  // 새로고침 전 진행 상황 되살리기 (마이크는 다시 켜야 하므로 녹음은 멈춘 상태로)
  restore() {
    const p = window.__visync && window.__visync.progress;
    if (!p || p.v !== 1 || p.chapters !== CH.length) return false;
    Object.assign(this.state, p.state, { recording: false, playing: false, interim: '' });
    AIX.vizTimes = p.vizTimes || {}; AIX.sayAt = p.sayAt || {};
    if (p.summary) swap(SUMMARY, p.summary);
    if (p.sumPages) swap(SUM_PAGES, p.sumPages);
    this.sumDone = p.sumDone || {}; this.lastStep = p.lastStep || {};
    this.aiStarted = !!p.aiStarted; this.savedSig = p.savedSig == null ? undefined : p.savedSig;
    this.locSent = this.state.micLines.length;
    return true;
  }
  // 진행 상황을 이 기기에 보관 (바뀐 게 있을 때만)
  persist() {
    if (!AIX.on || this.ended) return;
    const s = this.state;
    const json = JSON.stringify({ v: 1, chapters: CH.length,
      state: { micLines: s.micLines, aiLive: s.aiLive, aiPage: s.aiPage, page: s.page, sel: s.sel, step: s.step, follow: s.follow, sec: s.sec, explored: s.explored, params: s.params, tab: s.tab, lang: s.lang },
      vizTimes: AIX.vizTimes, sayAt: AIX.sayAt, summary: SUMMARY, sumPages: SUM_PAGES, sumDone: this.sumDone, lastStep: this.lastStep, aiStarted: !!this.aiStarted, savedSig: this.savedSig == null ? null : this.savedSig });
    if (json === this.lastPersist) return;
    this.lastPersist = json;
    saveProgress(JSON.parse(json));
  }
  boardRef = React.createRef();
  vizBodyRef = React.createRef();
  vizSvgRef = React.createRef();
  fitViz() {
    const b = this.vizBodyRef.current, w = this.vizSvgRef.current;
    if (w) fitSvgBox(w.querySelector('svg')); // 잘리는 그림은 화면 크기와 상관없이 먼저 바로잡기
    if (!b || !w || this.state.vw < 640) return;
    const svg = w.querySelector('svg'); if (!svg) return;
    const rest = b.scrollHeight - w.offsetHeight;
    const pad = w.offsetHeight - svg.getBoundingClientRect().height;
    const max = Math.max(110, Math.min(460, Math.floor(b.clientHeight - rest - pad - 2)));
    if (Math.abs(max - (this.state.svgMax || 0)) > 3) this.setState({ svgMax: max });
  }
  drag = { slide: this.grabber('slide', 'move'), viz: this.grabber('viz', 'move'), notes: this.grabber('notes', 'move') };
  resize = { slide: this.grabber('slide', 'size'), viz: this.grabber('viz', 'size'), notes: this.grabber('notes', 'size') };
  grabber(id, mode) {
    return (ev) => {
      if (mode === 'move' && ev.target.closest('button,input')) return;
      if (this.state.vw < 640) return;
      const board = this.boardRef.current; if (!board) return;
      ev.preventDefault(); ev.stopPropagation();
      const bw = board.clientWidth, base = (this.state.lay && this.lastEff === this.state.lay) ? this.state.lay : defLay(bw, this.state.aspect, this.state.bh), c0 = { ...base[id] }, px = ev.clientX, py = ev.clientY;
      this.setState({ lay: base, fromStore: false });
      this.setState(s => ({ active: id, zs: s.zs.filter(z => z !== id).concat(id) }));
      document.body.style.userSelect = 'none';
      const mv = (e2) => {
        const dx = (e2.clientX - px) / bw, dy = e2.clientY - py;
        const n = mode === 'move'
          ? { ...c0, x: Math.min(Math.max(0, c0.x + dx), 1 - c0.w), y: Math.max(0, Math.round(c0.y + dy)) }
          : { ...c0, w: Math.min(Math.max(240 / bw, c0.w + dx), 1 - c0.x), h: Math.max(160, Math.round(c0.h + dy)) };
        this.setState(s => ({ lay: { ...(s.lay || base), [id]: n } }));
      };
      const up = () => {
        window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
        document.body.style.userSelect = '';
        this.setState({ active: null });
        try { localStorage.setItem(LAY_KEY, JSON.stringify(this.state.lay)); } catch (x) {}
        if (id === 'slide') this.renderPage();
      };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    };
  }
  scrollRef = React.createRef();
  canvasRef = React.createRef();
  componentDidMount() {
    if (this._restored) this.flash(this.state.micLines.length ? '새로고침으로 녹음이 멈췄어요 · 녹음 시작을 누르면 이어서 기록해요' : '수업을 다시 불러왔어요', 5000);
    this.onHide = () => this.persist();
    document.addEventListener('visibilitychange', this.onHide); window.addEventListener('pagehide', this.onHide);
    this.loadPdf();
    if (window.ResizeObserver && this.boardRef.current) { this.ro = new ResizeObserver(() => { const w = this.boardRef.current ? this.boardRef.current.clientWidth : 0; if (w && w !== this.state.bw) this.setState({ bw: w }); if (this.measure) this.measure(); }); this.ro.observe(this.boardRef.current); }
    this.stepT = setInterval(() => {
      const s = this.state;
      if (!s.playing) return;
      const n = CH[s.sel].steps.length;
      if (!n || s.sel > this.live()) return;
      if (s.step < n - 1) this.setState({ step: s.step + 1 }); else this.setState({ playing: false });
    }, 1300);
    this.clockT = setInterval(() => {
      if (!this.state.recording) return;
      this.setState(s => {
        const sec = s.sec + 1;
        if (s.mode === 'mic') return { sec };
        let heard = s.heard;
        if (heard < SCRIPT.length && sec >= toSec(SCRIPT[heard][0])) heard++;
        if (heard === s.heard) return { sec };
        return { sec, heard, ...this.syncFor(heard, s) };
      });
    }, 1000);
    this.waveT = setInterval(() => { if (this.state.recording) this.setState(s => ({ tick: s.tick + 1 })); }, 140);
    this.tlbT = setInterval(() => {
      const s = this.state;
      if (AIX.on || s.sel !== TLB_IDX || s.step < 4 || s.sel > this.live()) return;
      const hit = Math.random() * 100 < s.params[TLB_IDX].h;
      this.setState(st => ({ tlb: { hit, page: Math.floor(Math.random() * 10), hits: (st.tlb ? st.tlb.hits : 0) + (hit ? 1 : 0), n: (st.tlb ? st.tlb.n : 0) + 1 } }));
    }, 900);
    this.measure = () => { const b = this.boardRef.current; const vw = window.innerWidth; const bh = b ? Math.round(window.innerHeight - b.getBoundingClientRect().top - (vw < 1024 ? 38 : 56)) : 0; if (vw !== this.state.vw || Math.abs(bh - this.state.bh) > 4) this.setState({ vw, bh }); };
    this.aiT = setInterval(() => { if (AIX.on && this.state.recording) for (let i = 0; i <= this.state.aiLive; i++) this.aiSummarize(i); }, 45000);
    this.locT = setInterval(() => this.maybeLocate(), 2000);
    this.measure();
    this.onResize = () => { this.measure(); clearTimeout(this.rzT); this.rzT = setTimeout(() => this.renderPage(), 200); };
    window.addEventListener('resize', this.onResize);
  }
  async loadPdf() {
    try {
      const lib = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
      lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
      const up = window.__visync && window.__visync.file;
      if (!up) { location.hash = '#/'; return; }
      this.pdf = await lib.getDocument({ data: new Uint8Array(await up.arrayBuffer()) }).promise;
      this.renderPage();
    } catch (err) { this.setState({ pdfMsg: '강의 자료를 불러오지 못했어요' }); }
  }
  async renderPage() {
    const cv = this.canvasRef.current;
    if (!this.pdf || !cv) return;
    if (this.rendering) { this.pending = true; return; }
    this.rendering = true;
    try {
      const n = this.state.page;
      const pg = await this.pdf.getPage(n);
      const w = cv.parentElement.clientWidth || 600;
      const base = pg.getViewport({ scale: 1 });
      const ar = base.height / base.width;
      if (Math.abs(ar - this.state.aspect) > 0.005) this.setState({ aspect: ar });
      const vp = pg.getViewport({ scale: (w / base.width) * (window.devicePixelRatio || 1) });
      const off = document.createElement('canvas');
      off.width = vp.width; off.height = vp.height;
      const task = pg.render({ canvasContext: off.getContext('2d'), viewport: vp });
      await Promise.race([task.promise, new Promise((_, rej) => setTimeout(() => { try { task.cancel(); } catch (x) {} rej(new Error('timeout')); }, 10000))]);
      cv.width = off.width; cv.height = off.height;
      cv.getContext('2d').drawImage(off, 0, 0);
      this.shown = n;
      if (this.state.pdfLoading) this.setState({ pdfLoading: false });
    } catch (err) { this.shown = this.state.page; this.setState({ pdfMsg: '슬라이드를 표시하지 못했어요 · 페이지를 넘겨 다시 시도해보세요' }); }
    this.rendering = false;
    if (this.pending || this.shown !== this.state.page) { this.pending = false; this.renderPage(); }
  }
  componentDidUpdate() {
    if (AIX.on && !this.saveT) this.saveT = setTimeout(() => { this.saveT = null; this.persist(); }, 2000);
    this.aiTrack();
    if (this._lastHeard !== this.state.heard) {
      this._lastHeard = this.state.heard;
      if (this.state.tab === 'transcript' && this.scrollRef.current) this.scrollRef.current.scrollTop = 1e6;
    }
    if (this.pdf && this.shown !== this.state.page) this.renderPage();
    cancelAnimationFrame(this.fitRaf); this.fitRaf = requestAnimationFrame(() => this.fitViz());
    if (this._lastTab !== this.state.mtab) { this._lastTab = this.state.mtab; if (this.state.mtab === 'slide') setTimeout(() => this.renderPage(), 30); }
  }
  componentWillUnmount() { this.stopMic(); [this.stepT, this.clockT, this.waveT, this.tlbT, this.aiT, this.locT].forEach(clearInterval); clearTimeout(this.toastT); clearTimeout(this.saveT); this.persist(); document.removeEventListener('visibilitychange', this.onHide); window.removeEventListener('pagehide', this.onHide); window.removeEventListener('resize', this.onResize); if (this.ro) this.ro.disconnect(); }
  // AI 모드: 강의 위치(aiPage)가 바뀌면 진행 챕터를 갱신하고 지난 챕터를 요약.
  // aiPage는 교수님 말씀(maybeLocate) 또는 실시간 따라가기 중 학생이 직접 맞춘 쪽(flip·jumpPage)으로 바뀜
  aiTrack() {
    if (!AIX.on) return;
    const s = this.state;
    if (this._pg === s.aiPage && this._rec === s.recording) return;
    this._pg = s.aiPage; this._rec = s.recording;
    // 말씀으로 단계를 맞출 수 있으면 첫 단계에서 기다리고, 아니면 예전처럼 자동 재생
    const ch = chapterOf(s.aiPage), enter = { sel: ch, step: 0, playing: !AIX.pages };
    // 첫 녹음 전: 맞춰 둔 쪽이 수업 시작 위치. 건너뛴 앞 챕터는 '지난 챕터'로 치지 않음
    if (!s.recording && !this.aiStarted) {
      if (ch !== s.aiLive) this.setState({ aiLive: ch, ...(s.follow ? enter : {}) });
      return;
    }
    if (s.recording) {
      this.aiStarted = true;
      if (!AIX.vizTimes[s.aiLive]) AIX.vizTimes[s.aiLive] = fmt(s.sec);
      if (ch > s.aiLive) {
        const prev = s.aiLive;
        AIX.vizTimes[ch] = fmt(s.sec);
        this.setState({ aiLive: ch, ...(s.follow ? enter : {}) });
        this.aiSummarize(prev);
        return;
      }
    }
    // 교수님이 앞 챕터로 돌아간 경우: 진행 상태는 그대로 두고 화면만 그 챕터로
    if (s.follow && ch !== s.sel && ch <= s.aiLive) this.setState({ sel: ch, step: s.explored[ch] ? Math.max(0, CH[ch].steps.length - 1) : Math.min(this.lastStep[ch] || 0, Math.max(0, CH[ch].steps.length - 1)), playing: !s.explored[ch] && !AIX.pages });
  }
  // 교수님 말씀으로 지금 설명 중인 쪽·시각화 단계 찾기 (새 받아쓰기가 있을 때 8초에 한 번)
  maybeLocate() {
    const s = this.state;
    if (!AIX.on || !AIX.pages || !s.recording || this.locBusy) return;
    const n = s.micLines.length, from = this.locSent || 0;
    if (n <= from || Date.now() - (this.locAt || 0) < 8000) return;
    if (s.micLines.slice(from).map(x => x[1]).join(' ').length < 12) return;
    const cur = s.aiPage, near = (p) => p.page >= cur - 2 && p.page <= cur + 6;
    // 근처 쪽은 본문, 나머지 쪽은 앞부분(제목)만 보내서 멀리 건너뛴 경우도 찾을 수 있게
    const cand = AIX.pages.slice(0, 150).map(p => ({ page: p.page, text: String(p.text || '').slice(0, near(p) ? 700 : 80) }));
    if (!cand.length) return;
    const chs = [...new Set(AIX.pages.filter(near).map(p => chapterOf(p.page)))].map(i => ({ title: CH[i].title, start: CH[i].start, end: CH[i].end, steps: CH[i].steps }));
    this.locBusy = true; this.locAt = Date.now(); this.locSent = n;
    api('/api/locate', { cur, pages: cand, chapters: chs, lines: s.micLines.slice(-8).map(x => x[1]) }, 20000)
      .then(r => this.applyLocate(r, from, cur), e => console.warn('[Visync] 위치 추적 실패:', e.message))
      .finally(() => { this.locBusy = false; });
  }
  // "39페이지로 넘어갈게요", "다음 장 보시면"처럼 쪽을 직접 말하면 AI를 기다리지 않고 바로 이동
  cueMove(lines) {
    if (!AIX.on) return;
    const total = this.pdf ? this.pdf.numPages : (AIX.pages ? AIX.pages.length : TOTAL);
    let to = 0;
    for (const t of lines) to = pageCue(t, to || this.state.aiPage, total) || to;
    if (!to || to === this.state.aiPage) return;
    this.locCand = 0;
    this.setState(st => ({ aiPage: to, ...(st.follow ? { page: to } : {}) }));
    this.flash('교수님 말씀에 따라 p.' + to + '로 넘겼어요');
  }
  applyLocate(r, from, asked) {
    const s = this.state;
    if (s.aiPage !== asked) return; // 그 사이 학생이나 쪽 번호 말씀으로 위치가 바뀌었으면 이 결과는 버림
    const page = Math.round(Number(r.page)), conf = Number(r.confidence) || 0;
    if (!page) return;
    let to = s.aiPage;
    if (page !== s.aiPage) {
      // 확신이 높으면 바로, 중간이면 두 번 연속 같은 쪽이 나올 때 이동 (잘못 넘어가는 것 방지)
      const far = Math.abs(page - s.aiPage) > 6;
      if (far ? conf >= 0.8 : (conf >= 0.75 || (conf >= 0.45 && this.locCand === page))) { to = page; this.locCand = 0; }
      else this.locCand = !far && conf >= 0.45 ? page : 0;
    } else this.locCand = 0;
    const ch = chapterOf(to), steps = CH[ch].steps.length, step = Number(r.step);
    const stepOk = to === page && conf >= 0.45 && Number.isInteger(step) && step >= 0 && step < steps;
    const upd = {};
    if (to !== s.aiPage) {
      upd.aiPage = to;
      if (s.follow) upd.page = to;
      // 이동의 근거가 된 문장은 새 쪽으로 다시 기록 (요약이 맞는 챕터에 들어가도록)
      upd.micLines = s.micLines.map((x, i) => i >= from ? [x[0], x[1], to] : x);
    }
    if (stepOk) {
      this.lastStep[ch] = step;
      const last = s.micLines[s.micLines.length - 1];
      if (last) (AIX.sayAt[ch] = AIX.sayAt[ch] || {})[step] = [last[0], last[1]];
    }
    // 단계는 챕터 진입 처리(aiTrack) 뒤에 적용되도록 함수형 업데이트로
    this.setState(upd, () => { if (stepOk) this.setState(t => t.follow && t.sel === ch && !t.explored[ch] && t.step !== step ? { step, playing: false } : null); });
  }
  aiSummarize(i) {
    if (!AIX.on || !CH[i] || this.sumBusy[i]) return Promise.resolve();
    const c = CH[i];
    const lines = this.state.micLines.filter(x => x[2] >= c.start && x[2] <= c.end).map(x => ({ text: x[1], page: x[2] }));
    if (!lines.length || this.sumDone[i] === lines.length) return Promise.resolve();
    this.sumBusy[i] = true;
    return api('/api/summarize', { title: c.title, range: RANGES[i], lines }).then(r => {
      SUMMARY[i] = r.items || [];
      SUM_PAGES[i] = SUMMARY[i].map(it => it.page || c.page);
      this.sumDone[i] = lines.length;
      this.forceUpdate();
    }, e => this.flash('요약을 만들지 못했어요 · ' + e.message)).finally(() => { this.sumBusy[i] = false; });
  }
  flash(msg, ms = 2400) { clearTimeout(this.toastT); this.setState({ toast: msg }); this.toastT = setTimeout(() => this.setState({ toast: '' }), ms); }
  transcriptLines() {
    const s = this.state;
    if (s.mode === 'mic') return s.micLines.map(x => [x[0], x[1]]).concat(s.interim ? [[fmt(s.sec), s.interim + ' …']] : []);
    return SCRIPT.slice(0, s.heard).map(x => [x[0], x[1]]);
  }
  startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { this.flash('이 브라우저는 음성 인식을 지원하지 않아요 · Chrome을 권장해요'); return false; }
    const rec = new SR();
    rec.lang = this.state.lang || 'ko-KR'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (ev) => {
      let interim = ''; const add = [];
      for (let i = ev.resultIndex; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) add.push(r[0].transcript.trim()); else interim += r[0].transcript; }
      this.setState(s => ({ micLines: s.micLines.concat(add.filter(Boolean).map(t => [fmt(s.sec), t, AIX.on ? s.aiPage : s.page])), interim }));
      if (add.length) this.cueMove(add);
    };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.flash('마이크 권한을 허용해 주세요'); this.stopMic(); this.setState({ recording: false }); } };
    rec.onend = () => { if (this.rec === rec && this.state.recording && this.state.mode === 'mic') { try { rec.start(); } catch (x) {} } };
    this.rec = rec;
    try { rec.start(); } catch (x) {}
    return true;
  }
  // 강의 언어 바꾸기: 녹음 중이면 새 언어로 음성 인식을 다시 시작
  setLang(l) {
    if (l === this.state.lang) return;
    rememberLang(l); if (window.__visync) window.__visync.lang = l;
    const restart = this.state.recording && this.rec;
    if (restart) this.stopMic();
    this.setState({ lang: l }, () => { if (restart) this.startMic(); this.flash('강의 언어를 ' + langLabel(l) + '로 바꿨어요'); });
  }
  stopMic() { const r = this.rec; this.rec = null; if (r) { try { r.stop(); } catch (x) {} } if (this.state && this.state.interim) this.setState({ interim: '' }); }
  // 노트 내용이 바뀌었는지 비교하는 값 (AI 모드: 받아쓰기 줄 수, 데모: 들은 대본 줄 수)
  noteSig() { return AIX.on ? this.state.micLines.length : this.state.heard; }
  unsaved() { return this.noteSig() !== this.savedSig && (!AIX.on || this.state.micLines.length > 0); }
  download() {
    this.savedSig = this.noteSig();
    if (!AIX.on) { this.download2(); return Promise.resolve(); }
    const L0 = this.live(), ps = this.state.params;
    return Promise.all([...CH.slice(0, L0 + 1).map((ch, i) => this.aiSummarize(i)), ...CH.slice(0, L0 + 1).map((ch, i) => ch.sim ? ch.sim.prefetch(ps[i], 99) : null)])
      .catch(() => {}).then(() => this.download2());
  }
  // 수업 종료: 저장 안 한 내용이 있을 때만 확인 창, 아니면 바로 온보딩으로
  endLecture() { this.ended = true; clearTimeout(this.saveT); clearSession(); window.__visync = undefined; this.stopMic(); this.setState({ endOpen: false, recording: false }); location.hash = '#/'; }
  download2() {
    const L = this.live();
    const esc = (x) => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const tl = this.transcriptLines();
    const now = new Date();
    const date = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0');
    const sum = SUMMARY.slice(0, L + 1).map((items, i) =>
      '<section><div class="sh"><span class="no">' + String(i + 1).padStart(2, '0') + '</span><h2>' + esc(CH[i].title) + '</h2><span class="rg">강의 자료 p.' + RANGES[i] + '</span></div><ul>' +
      items.map((it, j) => '<li>' + esc(it.pre) + '<mark>' + esc(it.key) + '</mark>' + esc(it.post) + (it.star ? ' <span class="star"' + (it.quote ? ' title="교수님: “' + esc(it.quote) + '”"' : '') + '>교수님 강조</span>' : '') + '</li>').join('') +
      '</ul></section>').join('');
    const vz = CH.slice(0, L + 1).map((ch, i) => {
      if (!ch.sim) return '';
      const p = this.state.params[i], r = ch.sim.run(p);
      const svg = toMarkup(ch.sim.draw(p, 99, null)).replace('min-width:500px', 'min-width:0');
      const params = ch.sim.sliders.map(sl => '<span class="pv">' + escX(sl.label) + ' <b>' + escX(sl.fmt(p[sl.key])) + '</b></span>').join('');
      return '<section class="vz" data-vz="' + i + '"><div class="sh"><span class="no">' + String(i + 1).padStart(2, '0') + '</span><h2>' + escX(ch.vizTitle) + '</h2><span class="rg">' + vizAt(i) + ' · 강의 자료 p.' + ch.page + '</span></div>' +
        '<div class="svg">' + svg + '</div><p class="ex">' + escX(r.explain) + '</p>' +
        '<div class="fm' + (r.warn ? ' warn' : '') + '"><span>' + escX(r.formulaLabel) + '</span><b>' + escX(r.formula) + '</b></div>' +
        '<div class="ctl"><div class="ch"><b>직접 조절해보기</b><button type="button" data-reset="' + i + '">기본값으로</button></div><div class="sls">' +
        ch.sim.sliders.map(sl => '<label class="sl"><span><em>' + escX(sl.label) + '</em><b data-v="' + i + ':' + sl.key + '">' + escX(sl.fmt(p[sl.key])) + '</b></span><input type="range" min="' + sl.min + '" max="' + sl.max + '" step="' + sl.step + '" value="' + p[sl.key] + '" data-i="' + i + '" data-k="' + sl.key + '"></label>').join('') +
        '</div></div></section>';
    }).join('');
    const tr = tl.map((t, i) => '<div class="tl"><span class="tm">' + t[0] + '</span><p>' + esc(t[1]) + '</p></div>').join('');
    const html = '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OS #11 Memory Management 1 · 필기 노트</title>' +
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">' +
      '<style>*{box-sizing:border-box}body{margin:0;background:#F6F7F9;color:#1C1D22;font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif;word-break:keep-all;-webkit-font-smoothing:antialiased}' +
      '.wrap{max-width:760px;margin:40px auto;padding:0 20px}.card{background:#fff;border:1px solid #ECEEF2;border-radius:16px;padding:28px 32px;margin-bottom:16px}' +
      'header .meta{font-size:13px;color:#8A8D98;display:flex;gap:10px;flex-wrap:wrap}header h1{margin:6px 0 0;font-size:26px;letter-spacing:-0.02em}.brand{font-size:12px;font-weight:700;color:#5B5FE8;letter-spacing:.02em}' +
      'h3{margin:0 0 18px;font-size:15px;color:#4B4E58}section{margin-bottom:22px}section:last-child{margin-bottom:0}.sh{display:flex;align-items:baseline;gap:8px;padding-bottom:8px;border-bottom:1px solid #ECEEF2;margin-bottom:10px}' +
      '.no{font-size:12px;font-weight:700;color:#7C7FF2}h2{margin:0;font-size:17px}.rg{margin-left:auto;font-size:12px;color:#6E717C;border:1px solid #E8EAEE;border-radius:6px;padding:2px 8px}' +
      'ul{margin:0;padding-left:18px}li{margin:7px 0;line-height:1.7;font-size:14px;color:#3A3C45}mark{background:linear-gradient(transparent 55%,#E4E3FB 55%);color:#1C1D22;font-weight:600}' +
      '.star{font-size:11px;font-weight:700;color:#B26A12;background:#FDF3E3;padding:2px 6px;border-radius:5px}.pg{font-size:11px;font-weight:600;color:#4A4ED6;background:#F1F1FE;border:1px solid #E0DFFB;padding:1px 6px;border-radius:5px;white-space:nowrap}' +
      '.tl{display:grid;grid-template-columns:48px 1fr;gap:10px;padding:8px 0;border-top:1px solid #F3F4F6}.tl:first-of-type{border-top:none}.tm{font-size:12px;color:#A0A3AD;font-variant-numeric:tabular-nums;padding-top:3px}.tl p{margin:0;font-size:14px;line-height:1.7;color:#3A3C45}' +
      '.ctl{margin-top:12px;padding:14px;border:1px solid #ECEEF2;border-radius:12px;background:#FCFCFD}.ctl .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:13px}.ctl button{font:inherit;font-size:11px;height:26px;padding:0 10px;border:1px solid #E8EAEE;border-radius:7px;background:#fff;color:#4B4E58;cursor:pointer}.sls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px 20px}.sl{display:flex;flex-direction:column;gap:6px}.sl span{display:flex;justify-content:space-between;align-items:baseline}.sl em{font-style:normal;font-size:12px;font-weight:600;color:#4B4E58}.sl b{font-size:14px;color:#5B5FE8;font-variant-numeric:tabular-nums}.sl input{width:100%;accent-color:#5B6CF0;margin:0;cursor:pointer}' +
      '.vz .svg{padding:12px 4px;overflow-x:auto}.vz svg{max-width:100%}.ex{font-size:14px;line-height:1.7;color:#4B4E58;margin:6px 0 12px}.fm{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:12px;background:#F7F7FD;border:1px solid #E0DFFB}.fm span{font-size:12px;color:#6E717C}.fm b{font-size:18px;font-variant-numeric:tabular-nums}.fm.warn{background:#FFF6F6;border-color:#F3D0D1}.fm.warn b{color:#D2383E}.pvs{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.pv{font-size:12px;color:#6E717C;background:#F6F7F9;border-radius:6px;padding:3px 8px}.pv b{color:#4A4ED6}@keyframes vzdash{to{stroke-dashoffset:-22}}' +
      '@media print{body{background:#fff}.card{border:none;padding:0 0 12px}}</style></head><body><div class="wrap">' +
      '<div class="card"><header><div class="brand">Visync 필기 노트</div><h1>OS #11 · Memory Management 1</h1><div class="meta"><span>' + date + '</span><span>·</span><span>녹음 ' + fmt(this.state.sec) + '</span><span>·</span><span>OS_11-Memory-management-1.pdf</span></div></header></div>' +
      '<div class="card"><h3>요약</h3>' + sum + '</div>' +
      '<div class="card"><h3>시각화</h3>' + vz + '</div>' +
      '<div class="card"><h3>전문</h3>' + tr + '</div>' +
      '</div>' + this.exportScript(L) + '</body></html>';
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    el.download = ((window.__visync && window.__visync.name) || 'OS_11-메모리관리').replace(/\.pdf$/i, '') + '_필기노트.html'; el.click();
  }
  exportScript(L) {
    if (AIX.on) return this.exportScriptAI(L);
    let lib = '';
    const src = SELF_SRC;
    const a = src.indexOf('const nf = '), b = src.indexOf('const CH = [');
    const c = src.indexOf('const KEEP = '), d = src.indexOf('const ser = ');
    if (a < 0 || b < 0 || c < 0 || d < 0) return '';
    lib = src.slice(a, d);
    const sims = CH.slice(0, L + 1).map(ch => ch.sim ? { sliders: ch.sim.sliders, defaults: ch.sim.defaults, run: ch.sim.run, draw: ch.sim.draw } : null);
    const code = 'const React={createElement:(type,props,...children)=>({type,props:Object.assign({},props||{},{children:children})})};\n' + lib +
      '\nconst SIMS=CH.slice(0,' + (L + 1) + ').map(ch => ch.sim ? { sliders: ch.sim.sliders, defaults: ch.sim.defaults, run: ch.sim.run, draw: ch.sim.draw } : null);\nconst P=' + JSON.stringify(this.state.params.slice(0, L + 1)) + ';\n' +
      'function draw(i){const sim=SIMS[i],p=P[i],r=sim.run(p),root=document.querySelector(\'[data-vz="\'+i+\'"]\');if(!root)return;' +
      'root.querySelector(".svg").innerHTML=toMarkup(sim.draw(p,99,null)).replace("min-width:500px","min-width:0");' +
      'root.querySelector(".ex").textContent=r.explain;const fm=root.querySelector(".fm");fm.className="fm"+(r.warn?" warn":"");fm.querySelector("span").textContent=r.formulaLabel;fm.querySelector("b").textContent=r.formula;' +
      'sim.sliders.forEach(sl=>{const v=root.querySelector(\'[data-v="\'+i+\':\'+sl.key+\'"]\');if(v)v.textContent=sl.fmt(p[sl.key]);const inp=root.querySelector(\'input[data-k="\'+sl.key+\'"]\');if(inp&&+inp.value!==p[sl.key])inp.value=p[sl.key];});}\n' +
      'document.addEventListener("input",ev=>{const t=ev.target;if(!t.dataset||t.dataset.i==null)return;P[+t.dataset.i][t.dataset.k]=+t.value;draw(+t.dataset.i);});\n' +
      'document.addEventListener("click",ev=>{const b=ev.target.closest("[data-reset]");if(!b)return;const i=+b.dataset.reset;P[i]=Object.assign({},SIMS[i].defaults);draw(i);});\n';
    return '<scr' + 'ipt>' + code.replace(/<\/(script)/gi, '<\\/$1') + '</scr' + 'ipt>';
  }
  exportScriptAI(L) {
    const codes = CH.slice(0, L + 1).map(ch => ch.sim ? ch.sim.code : null);
    const code = RUNNER_SRC + '\nvar fitSvg=(' + fitSvgBox.toString() + ');' + '\nvar SIMS=' + JSON.stringify(codes) + '.map(function(c){try{return c?buildSim(c):null}catch(e){return null}});\nvar P=' + JSON.stringify(this.state.params.slice(0, L + 1)) + ';\n' +
      'function draw(i){var sim=SIMS[i];if(!sim)return;var o;try{o=evalSim(sim,P[i],99)}catch(e){return}var r=o.r,root=document.querySelector(\'[data-vz="\'+i+\'"]\');if(!root)return;' +
      'root.querySelector(".svg").innerHTML=jmk(o.tree).replace("min-width:500px","min-width:0");fitSvg(root.querySelector(".svg svg"));' +
      'root.querySelector(".ex").textContent=r.explain;var fm=root.querySelector(".fm");fm.className="fm"+(r.warn?" warn":"");fm.querySelector("span").textContent=r.formulaLabel;fm.querySelector("b").textContent=r.formula;' +
      'sim.sliders.forEach(function(sl){var v=root.querySelector(\'[data-v="\'+i+\':\'+sl.key+\'"]\');if(v)v.textContent=o.fm[sl.key];var inp=root.querySelector(\'input[data-k="\'+sl.key+\'"]\');if(inp&&+inp.value!==P[i][sl.key])inp.value=P[i][sl.key];});}\n' +
      'document.addEventListener("input",function(ev){var t=ev.target;if(!t.dataset||t.dataset.i==null)return;P[+t.dataset.i][t.dataset.k]=+t.value;draw(+t.dataset.i);});\n' +
      'document.addEventListener("click",function(ev){var b=ev.target.closest("[data-reset]");if(!b)return;var i=+b.dataset.reset;P[i]=Object.assign({},SIMS[i].defaults);draw(i);});\n' +
      'document.querySelectorAll(".svg svg").forEach(function(s){fitSvg(s);});\n';
    return '<scr' + 'ipt>' + code.replace(/<\/(script)/gi, '<\\/$1') + '</scr' + 'ipt>';
  }
  setParam(ci, key, val) {
    this.setState(s => { const params = s.params.slice(); params[ci] = { ...params[ci], [key]: val }; return { params, explored: { ...s.explored, [ci]: true }, step: CH[ci].steps.length - 1, playing: false, tlb: ci === TLB_IDX ? null : s.tlb }; });
  }
  // 페이지 번호로 바로 이동. AI 모드에선 '교수님이 지금 이 쪽'이라는 뜻이라 실시간 따라가기를 켬
  jumpPage(raw) {
    const t = String(raw).trim(), n = Math.round(Number(t)), total = this.pdf ? this.pdf.numPages : TOTAL;
    if (!t || !Number.isFinite(n)) return this.state.page;
    const page = Math.min(total, Math.max(1, n));
    const s = this.state;
    // AI 모드: '교수님이 지금 이 쪽' → 강의 위치도 함께 맞추고 실시간 따라가기
    if (AIX.on) { if (page !== s.page || page !== s.aiPage || !s.follow) { this.locCand = 0; this.setState({ page, aiPage: page, follow: true }); } }
    else if (page !== s.page) this.setState({ page, follow: false });
    return page;
  }
  // 화살표: 실시간 따라가기 중이면 강의 위치 보정, 아니면 자유롭게 넘겨보기
  flip(d) {
    const s = this.state, page = Math.min(this.pdf ? this.pdf.numPages : TOTAL, Math.max(1, s.page + d));
    if (AIX.on && s.follow) { this.locCand = 0; this.setState({ page, aiPage: page }); }
    else this.setState({ page, follow: false });
  }
  open(i) { if (i === this.live()) { this.goLive(); return; } this.setState({ sel: i, step: 0, page: CH[i].page, playing: true, tlb: null, follow: false }); }
  renderVals() {
    const s = this.state, L = this.live();
    const sayLine = AIX.on ? ((AIX.sayAt[s.sel] || {})[s.step] || null) : SCRIPT.slice(0, s.heard).filter(x => x[3] === s.sel && x[4] === s.step).pop();
    const liveCount = AIX.on ? 99 : SCRIPT.slice(0, s.heard).filter(x => x[3] === L).length;
    const c = CH[s.sel];
    const n = c.steps.length;
    const future = s.sel > L;
    const hasViz = n > 0 && !future;
    const p = s.params[s.sel];
    const r = c.sim && hasViz ? c.sim.run(p) : null;
    const tagMap = { flow: ['원리 시각화', '#5B5FE8', '#F1F1FE'], image: ['자료 이미지', '#B26A12', '#FDF3E3'], text: ['텍스트', '#8A8D98', '#F3F4F6'] };
    const [tag, tagColor, tagBg] = tagMap[c.type];
    const chapters = CH.map((ch, i) => {
      // AI 모드: 녹음 중 실제로 진행된 챕터만 '완료', 교수님이 건너뛴 챕터는 '건너뜀'
      const sel = i === s.sel, skipped = AIX.on && i < L && !AIX.vizTimes[i], done = i < L && !skipped, live = i === L;
      return {
        no: String(i + 1).padStart(2, '0'), title: ch.title,
        status: live ? '진행 중' : done ? '완료' : skipped ? '건너뜀' : '예정',
        statusColor: live ? '#E5484D' : done ? '#2FA876' : '#B4B7C0',
        bg: sel ? '#F1F1FE' : 'transparent', border: sel ? '#E0DFFB' : 'transparent',
        titleColor: sel ? '#1C1D22' : (i > L ? '#8A8D98' : '#2E3038'), weight: sel ? 600 : 500,
        noColor: sel ? '#5B5FE8' : '#A0A3AD', chipBg: sel ? '#F1F1FE' : '#FFFFFF', chipBorder: sel ? '#D9D8FB' : '#ECEEF2',
        select: () => this.open(i)
      };
    });
    const history = CH.map((ch, i) => ({ ch, i })).filter(x => vizAt(x.i) && x.i <= L).map(({ ch, i }) => {
      const on = i === s.sel;
      return { time: vizAt(i), title: ch.vizTitle, liveDisplay: i === L ? 'inline-block' : 'none',
        bg: on ? '#F1F1FE' : '#FFFFFF', border: on ? '#D9D8FB' : '#ECEEF2', color: on ? '#4A4ED6' : '#2E3038',
        open: () => this.open(i) };
    });
    const sliders = r ? c.sim.sliders.map(sl => ({
      label: sl.label, min: sl.min, max: sl.max, step: sl.step, value: p[sl.key], display: sl.fmt(p[sl.key]),
      onChange: (ev) => this.setParam(s.sel, sl.key, Number(ev.target.value))
    })) : [];
    const tl = this.transcriptLines();
    const pg = (n) => { const on = n === s.page; return { page: n, go: () => this.setState({ page: n, follow: false }), pBg: on ? '#5B6CF0' : '#F1F1FE', pColor: on ? '#FFFFFF' : '#4A4ED6', pBorder: on ? '#5B6CF0' : '#E0DFFB' }; };
    const transcript = tl.map((t, i) => ({ time: t[0], text: t[1], color: i === tl.length - 1 && s.recording ? '#1C1D22' : '#4B4E58', ...pg(s.mode === 'mic' ? ((s.micLines[i] || [])[2] || s.page) : SCRIPT[i][2]) }));
    const summary = SUMMARY.slice(0, L + 1).map((items, i) => ({ no: String(i + 1).padStart(2, '0'), title: CH[i].title,
      items: items.map((it, j) => ({ ...it, starDisplay: it.star ? 'inline-block' : 'none', starTitle: it.quote ? '교수님: “' + it.quote + '”' : '교수님이 강조한 내용', ...pg(SUM_PAGES[i][j]) })).slice(0, i === L ? Math.min(items.length, Math.max(1, Math.ceil(liveCount / 2))) : items.length), live: i === L && s.recording,
      range: RANGES[i], go: () => this.setState({ page: CH[i].page, follow: false }), pBg: '#FFFFFF', pColor: '#6E717C', pBorder: '#E8EAEE' }));
    const wave = Array.from({ length: 28 }, (_, i) => {
      const v = s.recording ? 0.2 + Math.abs(Math.sin(i * 0.9 + s.tick * 0.7) * Math.cos(i * 0.35 - s.tick * 0.4)) * 0.8 : 0.12;
      return { h: Math.round(v * 22) + 'px', c: s.recording ? (i > 20 ? '#C9C8F7' : '#7C7FF2') : '#DCDDE6' };
    });
    const tab = (on) => on ? ['#FFFFFF', '#1C1D22', '0 1px 2px rgba(20,20,40,0.08)'] : ['transparent', '#8A8D98', 'none'];
    const [sumBg, sumColor, sumShadow] = tab(s.tab === 'summary'), [trBg, trColor, trShadow] = tab(s.tab === 'transcript');
    const warn = r && r.warn;
    const fits = (lz) => { if (!lz || !s.bw) return !!lz; const W = (c) => Math.max(c.w, 260 / s.bw); const ids = ['slide', 'notes', 'viz']; for (const id of ids) if (lz[id].x + W(lz[id]) > 1.001) return false; for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const a = lz[ids[i]], b = lz[ids[j]]; if (a.x < b.x + W(b) && b.x < a.x + W(a) && a.y < b.y + b.h && b.y < a.y + a.h) return false; } return true; };
    const eff = s.lay && (!s.fromStore || fits(s.lay)) ? s.lay : defLay(s.bw, s.aspect, s.bh);
    this.lastEff = eff;
    const phone = s.vw < 640, compact = s.vw < 1024;
    const lay = {}; let bottom = 0;
    ['slide', 'notes', 'viz'].forEach(id => {
      const c2 = { ...eff[id] }, on = s.active === id;
      if (s.bw && c2.w * s.bw < 260) { c2.w = Math.min(1, 260 / s.bw); c2.x = Math.min(c2.x, 1 - c2.w); }
      bottom = Math.max(bottom, c2.y + c2.h);
      lay[id] = phone ? { pos: 'relative', l: 'auto', t: 'auto', w: '100%', h: id === 'notes' ? 'calc(100dvh - 250px)' : 'auto', z: 1, disp: s.mtab === id ? 'flex' : 'none', border: '#ECEEF2', shadow: 'none' } : { pos: 'absolute', disp: 'flex', l: (c2.x * 100) + '%', w: (c2.w * 100) + '%', t: c2.y + 'px', h: c2.h + 'px', z: s.zs.indexOf(id) + 1,
        border: on ? '#C9C8F7' : '#ECEEF2', shadow: on ? '0 16px 40px -14px rgba(60,50,160,0.28)' : '0 1px 2px rgba(20,20,40,0.03)' };
    });
    return {
      boardRef: this.boardRef, lay, boardH: phone ? 'auto' : (bottom + 8) + 'px',
      ui: { minH: phone ? '0' : '640px', outerPad: phone ? '0' : compact ? '10px' : '20px', shellBorder: phone ? 'none' : '1px solid #E3E5EA', shellRadius: phone ? '0' : '22px', shellPad: phone ? '0' : compact ? '8px' : '12px', mainRadius: phone ? '0' : '16px', headPad: phone ? '10px 12px' : '12px 16px', crumbFile: phone ? 'none' : 'inline', textDisp: phone ? 'none' : 'inline', gridCols: compact ? 'minmax(0,1fr)' : 'clamp(140px,14vw,220px) minmax(0,1fr)', sideNav: compact ? 'none' : 'flex', chipNav: compact ? 'flex' : 'none', secPad: phone ? '14px 12px' : compact ? '16px' : '20px', h1: phone ? '20px' : '24px', desktopOnly: phone ? 'none' : 'flex', tabBar: phone ? 'flex' : 'none', boardDisplay: phone ? 'flex' : 'block', handle: phone ? 'none' : 'flex', grabCursor: phone ? 'default' : 'grab' },
      mtabs: [['slide', '강의 자료'], ['viz', '시각화'], ['notes', '필기 노트']].map(([id, label]) => { const on = s.mtab === id; return { label, go: () => this.setState({ mtab: id }), bg: on ? '#FFFFFF' : 'transparent', color: on ? '#1C1D22' : '#8A8D98', shadow: on ? '0 1px 2px rgba(20,20,40,0.08)' : 'none' }; }), drag: this.drag, resize: this.resize,
      resetLayout: () => { try { localStorage.removeItem(LAY_KEY); } catch (x) {} this.setState({ lay: null }, () => this.renderPage()); },
      fileName: (window.__visync && window.__visync.name) || 'OS_11-Memory-management-1.pdf',
      cur: { no: String(s.sel + 1).padStart(2, '0'), title: c.title, hasViz, tag, tagColor, tagBg, pageLabel: '강의 자료 p.' + c.page },
      noViz: !hasViz, emptyTitle: future ? '아직 진행되지 않은 챕터예요' : '시각화할 흐름이 없는 챕터예요',
      vizSvg: hasViz ? (() => { const el = c.sim.draw(p, s.step, s.tlb); return s.svgMax && s.vw >= 640 ? React.cloneElement(el, { style: { ...el.props.style, width: 'auto', minWidth: 0, maxWidth: '100%', height: s.svgMax + 'px' } }) : el; })() : null,
      vizBodyRef: this.vizBodyRef, vizSvgRef: this.vizSvgRef,
      canvasRef: this.canvasRef, pdfLoading: s.pdfLoading, pdfMsg: s.pdfMsg,
      page: s.page, totalPages: this.pdf ? this.pdf.numPages : TOTAL,
      prevPage: () => this.flip(-1),
      nextPage: () => this.flip(1),
      pageInputW: (String(this.pdf ? this.pdf.numPages : TOTAL).length + 2) + 'ch',
      pageFocus: (ev) => ev.target.select(),
      pageKey: (ev) => { if (ev.key === 'Enter') ev.target.blur(); else if (ev.key === 'Escape') { ev.target.value = s.page; ev.target.blur(); } },
      pageBlur: (ev) => { ev.target.value = this.jumpPage(ev.target.value); },
      chapters, history,
      isReplay: !s.follow, offLive: !s.follow,
      goLive: () => this.goLive(),
      hasSim: !!r, sliders,
      formulaLabel: r ? r.formulaLabel : '', formula: r ? r.formula : '', explain: r ? r.explain : '',
      formulaBg: warn ? '#FFF6F6' : '#F7F7FD', formulaBorder: warn ? '#F3D0D1' : '#E0DFFB', formulaColor: warn ? '#D2383E' : '#1C1D22',
      resetSim: () => { const params = s.params.slice(); params[s.sel] = { ...c.sim.defaults }; this.setState({ params, tlb: null }); },
      say: sayLine ? sayLine[1] : (c.steps[s.step] || ''), sayTime: sayLine ? sayLine[0] : '다시 보기',
      playing: s.playing, paused: !s.playing, pauseIcon: s.playing ? 'block' : 'none', playIcon: s.playing ? 'none' : 'block', recIconRadius: s.recording ? '2px' : '50%', recIconBg: s.recording ? '#FFFFFF' : '#E5484D', playTitle: s.playing ? '일시정지' : '재생',
      togglePlay: () => s.playing ? this.setState({ playing: false }) : this.setState({ playing: true, step: s.step >= n - 1 ? 0 : s.step }),
      replay: () => this.setState({ step: 0, playing: true, tlb: null }),
      isSummary: s.tab === 'summary', isTranscript: s.tab === 'transcript',
      tabSummary: () => this.setState({ tab: 'summary' }), tabTranscript: () => this.setState({ tab: 'transcript' }),
      sumBg, sumColor, sumShadow, trBg, trColor, trShadow,
      summary, transcript, scrollRef: this.scrollRef, wave,
      recording: s.recording, notRecording: !s.recording,
      clock: fmt(s.sec),
      recLabel: s.recording ? '녹음 중' : '일시정지',
      recPillBg: s.recording ? '#FDECEC' : '#F2F3F6', recPillColor: s.recording ? '#D2383E' : '#6E717C', recDot: s.recording ? '#E5484D' : '#B4B7C0',
      recHint: s.mode === 'mic' ? (s.recording ? '실제 음성을 받아쓰는 중' : '녹음을 시작하면 받아쓰기를 시작해요') : (s.recording ? '데모 대본을 재생 중이에요' : '녹음이 멈춰 있어요'),
      recBtnLabel: s.recording ? '녹음 중지' : '녹음 시작', recBtnTitle: s.recording ? '녹음 중지' : '녹음 시작',
      recBtnBg: s.recording ? '#1C1D22' : '#F2F3F6', recBtnColor: s.recording ? '#FFFFFF' : '#1C1D22',
      toggleRec: () => { const on = !s.recording; if (s.mode === 'mic') { if (on) { if (!this.startMic()) return; } else this.stopMic(); } this.setState({ recording: on }); },
      langs: AIX.on ? LANGS.map(([id, label]) => { const on = (s.lang || 'ko-KR') === id; return { label: id === 'ko-KR' ? '한국어' : 'EN', title: '강의 언어: ' + label, go: () => this.setLang(id), bg: on ? '#FFFFFF' : 'transparent', color: on ? '#1C1D22' : '#9A9DA8', shadow: on ? '0 1px 2px rgba(20,20,40,0.08)' : 'none' }; }) : [],
      micEmpty: s.mode === 'mic' && !s.micLines.length && !s.interim,
      save: () => { this.download(); this.flash('필기 노트를 파일로 저장했어요'); },
      toast: s.toast,
      endOpen: s.endOpen,
      openEnd: () => this.unsaved() ? this.setState({ endOpen: true }) : this.endLecture(),
      endTitle: this.savedSig == null ? '노트를 저장하지 않았어요' : '마지막 저장 이후 내용이 저장되지 않았어요',
      closeEnd: () => this.setState({ endOpen: false }),
      stop: (ev) => ev.stopPropagation(),
      saveAndEnd: () => { if (this.ending) return; this.ending = true; this.stopMic(); this.setState({ recording: false, endSaving: true }); this.download().then(() => this.endLecture()); },
      endSaveLabel: s.endSaving ? '노트 정리하는 중…' : '노트 저장하고 종료',
      endNoSave: () => this.endLecture()
    };
  }
}

Component.View = View;
export default Component;
