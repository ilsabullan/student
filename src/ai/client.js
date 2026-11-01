import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { RUNNER_SRC } from './runner.js';

// 강의 언어 (Chrome 음성 인식은 한 번에 한 언어만 지원)
export const LANGS = [['ko-KR', '한국어'], ['en-US', 'English']];
export const langLabel = (l) => (LANGS.find(x => x[0] === l) || LANGS[0])[1];
export function savedLang() { try { const l = localStorage.getItem('visync.lang'); return LANGS.some(x => x[0] === l) ? l : 'ko-KR'; } catch (e) { return 'ko-KR'; } }
export function rememberLang(l) { try { localStorage.setItem('visync.lang', l); } catch (e) {} }

export const AIX = { on: false, vizTimes: {}, pages: null, sayAt: {} };

// ---------- 서버 호출 ----------
export async function api(path, body, timeoutMs = 90000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || ('서버 오류 ' + res.status));
    return j;
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? '응답 시간이 초과됐어요' : e.message);
  } finally { clearTimeout(t); }
}

// ---------- PDF 텍스트 추출 ----------
let pdfjs = null;
export async function loadPdfjs() {
  if (!pdfjs) {
    pdfjs = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
  }
  return pdfjs;
}
export async function extractPdfText(file, onProgress) {
  const lib = await loadPdfjs();
  const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    pages.push({ page: i, text: tc.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim() });
    onProgress && onProgress(i, doc.numPages);
  }
  const total = pages.reduce((a, p) => a + p.text.length, 0), BUDGET = 60000;
  const cap = total > BUDGET ? Math.max(200, Math.floor(BUDGET / pages.length)) : 4000;
  return { numPages: doc.numPages, pages: pages.map(p => ({ page: p.page, text: p.text.slice(0, cap) })) };
}

// ---------- 격리 실행(Web Worker) ----------
// 워커는 페이지 DOM·저장소에 접근할 수 없고, 네트워크 API도 막아 둡니다. 무한 루프는 시간 초과 후 워커를 종료합니다.
const WORKER_SRC = RUNNER_SRC + `
self.fetch=undefined;self.XMLHttpRequest=undefined;self.WebSocket=undefined;self.EventSource=undefined;self.importScripts=undefined;self.indexedDB=undefined;self.caches=undefined;
var CACHE={};
onmessage=function(ev){var d=ev.data;try{var sim=CACHE[d.code]||(CACHE[d.code]=buildSim(d.code));
  var out=d.meta?simMeta(sim):evalSim(sim,d.p,d.st);postMessage({id:d.id,ok:true,out:out});}
  catch(e){postMessage({id:d.id,ok:false,err:String(e&&e.message||e)});}};`;
let worker = null, seq = 0;
const waiting = new Map();
function getWorker() {
  if (worker) return worker;
  worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' })));
  worker.onmessage = (ev) => { const w = waiting.get(ev.data.id); if (!w) return; waiting.delete(ev.data.id); clearTimeout(w.t); ev.data.ok ? w.res(ev.data.out) : w.rej(new Error(ev.data.err)); };
  return worker;
}
function killWorker(reason) {
  if (worker) worker.terminate();
  worker = null;
  waiting.forEach(w => { clearTimeout(w.t); w.rej(new Error(reason)); });
  waiting.clear();
}
function runInWorker(msg, timeoutMs = 2500) {
  return new Promise((res, rej) => {
    const id = ++seq;
    const t = setTimeout(() => killWorker('시각화 코드 실행 시간이 너무 길어요'), timeoutMs);
    waiting.set(id, { res, rej, t });
    getWorker().postMessage({ ...msg, id });
  });
}
export const simMeta = (code) => runInWorker({ code, meta: true });
export const simEval = (code, p, st) => runInWorker({ code, p, st });

// ---------- JSON 트리 → React (허용된 SVG 태그·속성만) ----------
const TAGS = new Set(['svg', 'g', 'rect', 'text', 'tspan', 'path', 'line', 'circle', 'ellipse', 'polygon', 'polyline', 'defs', 'marker', 'title']);
const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const safe = (v) => typeof v === 'number' || (typeof v === 'string' && !/javascript:|expression\(|url\((?!#)/i.test(v));
// AI가 그린 그림의 viewBox를 실제로 그려진 범위에 딱 맞춤.
// - 밖으로 나간 글자가 잘리거나 아래 내용과 겹치지 않고, 쓸데없는 여백이 없어져 같은 칸에서 그림이 커 보임
// - 아직 안 나타난 단계(투명)도 범위에 포함되고, keep에 범위를 누적해(넓어지기만 함) 단계·슬라이더가 바뀌어도 크기가 흔들리지 않음
// 노트 파일에도 그대로 넣어 씀 (외부 변수 사용 금지)
export function fitSvgBox(svg, keep) {
  if (!svg || typeof svg.getBBox !== 'function' || !svg.querySelector('marker')) return; // '그리는 중…' 같은 안내 그림은 제외
  let bb; try { bb = svg.getBBox(); } catch (e) { return; }
  if (!bb || bb.width < 1 || bb.height < 1) return;
  let x1 = bb.x, y1 = bb.y, x2 = bb.x + bb.width, y2 = bb.y + bb.height;
  const k = keep || {};
  if (k.box) { x1 = Math.min(x1, k.box[0]); y1 = Math.min(y1, k.box[1]); x2 = Math.max(x2, k.box[2]); y2 = Math.max(y2, k.box[3]); }
  k.box = [x1, y1, x2, y2];
  const pad = Math.max(8, Math.round((x2 - x1) * 0.02));
  const vb = [x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2].map(v => Math.round(v * 10) / 10).join(' ');
  if (svg.getAttribute('viewBox') !== vb) svg.setAttribute('viewBox', vb);
}

// AI가 밝은 박스 위에 흰 글자를 쓰는 식으로 글자가 안 보이는 경우를 바로잡음.
// 글자마다 바로 아래 깔린 도형의 색을 찾아 대비가 낮으면(3:1 미만) 어두운/흰 글자로 바꿈 (data-vs-ink + CSS !important).
// 노트 파일에도 그대로 넣어 씀 (외부 변수 사용 금지)
export function fixSvgContrast(svg) {
  if (!svg || !svg.querySelector('marker')) return false;
  const box = svg.getBoundingClientRect(); if (!box.width) return false; // 화면에 안 보이는 중이면 나중에
  const cv = document.createElement('canvas').getContext('2d');
  const rgb = (c) => { if (!c || c === 'none' || /^url|transparent|currentcolor/i.test(c)) return null; cv.fillStyle = '#000'; cv.fillStyle = c; const v = cv.fillStyle;
    if (v[0] === '#') return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)).concat(1);
    const m = v.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2], m[3] == null ? 1 : +m[3]] : null; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const op = (el) => { let o = 1; for (let n = el; n && n !== svg; n = n.parentNode) { const v = parseFloat(n.style && n.style.opacity); if (!isNaN(v)) o *= v; const a = parseFloat(n.getAttribute && n.getAttribute('opacity')); if (!isNaN(a)) o *= a; } return o; };
  const shapes = [...svg.querySelectorAll('rect,circle,ellipse,polygon,path')].filter(s => !s.closest('defs'));
  svg.querySelectorAll('text').forEach(t => {
    t.removeAttribute('data-vs-ink');
    const r = t.getBoundingClientRect(); if (!r.width) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let bg = [255, 255, 255];
    for (const s of shapes) {
      if (!(s.compareDocumentPosition(t) & 4)) continue; // 글자보다 먼저(아래에) 그려진 도형만
      const c = rgb(s.getAttribute('fill') || (s.style && s.style.fill)); if (!c) continue;
      const a = c[3] * op(s) * (parseFloat(s.getAttribute('fill-opacity')) || 1); if (a < 0.35) continue;
      const b = s.getBoundingClientRect(); if (cx < b.left || cx > b.right || cy < b.top || cy > b.bottom) continue;
      bg = c.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
    }
    const fg = rgb(getComputedStyle(t).fill); if (!fg) return;
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (ratio < 3) t.setAttribute('data-vs-ink', L2 > 0.4 ? 'dark' : 'light');
  });
  return true;
}

export function toReact(n, key) {
  if (typeof n !== 'object') return String(n);
  if (!n || !TAGS.has(n.t)) return null;
  const props = { key };
  for (const k in n.a) {
    const v = n.a[k];
    if (v == null || /^on/i.test(k) || /href|class/i.test(k)) continue;
    if (k === 'style' && typeof v === 'object') { const st = {}; for (const sk in v) if (v[sk] != null && safe(v[sk])) st[camel(sk)] = v[sk]; props.style = st; continue; }
    if (safe(v)) props[camel(k)] = v;
  }
  return React.createElement(n.t, props, ...(n.c || []).map((c, i) => toReact(c, i)));
}
const MSG_SVG = (msg) => React.createElement('svg', { viewBox: '0 0 560 120', style: { width: '100%', minWidth: 0, height: 'auto', display: 'block' } },
  React.createElement('text', { x: 280, y: 64, textAnchor: 'middle', fontSize: 14, fill: '#8A8D98', fontFamily: 'inherit' }, msg));

// 기존 수업 페이지의 sim 인터페이스(sliders/defaults/run/draw)를 그대로 흉내 내는 래퍼. 결과는 비동기로 채워지고 onUpdate로 다시 그립니다.
// 시각화를 화면 밖에서 한 번 그려보고 글자끼리, 또는 글자와 박스 테두리가 겹치는지 검사.
// 문제가 있으면 AI에게 넘길 설명을, 없으면 ''를 돌려줌
export function layoutIssues(tree) {
  if (typeof document === 'undefined' || !tree) return '';
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;visibility:hidden;pointer-events:none';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(toReact(tree, 'probe')));
    const svg = host.querySelector('svg'); if (!svg) return '';
    const box = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, a: r.width * r.height }; };
    const inter = (p, q) => Math.max(0, Math.min(p.r, q.r) - Math.max(p.l, q.l)) * Math.max(0, Math.min(p.b, q.b) - Math.max(p.t, q.t));
    const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('defs'))
      .map(t => ({ s: t.textContent.trim().slice(0, 24), r: box(t) })).filter(x => x.r.a > 6);
    const rects = [...svg.querySelectorAll('rect')].filter(e => !e.closest('defs')).map(box).filter(r => r.r - r.l > 6 && r.b - r.t > 6);
    const out = [];
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const p = texts[i], q = texts[j];
      if (inter(p.r, q.r) > 0.15 * Math.min(p.r.a, q.r.a)) out.push(`글자 '${p.s}'와 '${q.s}'가 겹쳐요`);
    }
    for (const t of texts) for (const r of rects) {
      const f = inter(t.r, r) / t.r.a; // 박스 안에 반쯤만 걸친 글자
      if (f > 0.15 && f < 0.85) { out.push(`글자 '${t.s}'가 박스 테두리에 걸쳐 있어요`); break; }
    }
    return [...new Set(out)].slice(0, 4).join('; ');
  } catch (e) { return ''; }
  finally { root.unmount(); host.remove(); }
}

export function makeSim(spec, onUpdate) {
  const cache = new Map(), pending = new Map(), runs = new Map(), fms = new Map();
  let last = null;
  const key = (p, st) => JSON.stringify([p, st]);
  const store = (p, o) => { runs.set(JSON.stringify(p), o.r); for (const k in o.fm) fms.set(k + ':' + p[k], o.fm[k]); };
  function request(p, st) {
    const k = key(p, st);
    if (cache.has(k)) return Promise.resolve(cache.get(k));
    if (pending.has(k)) return pending.get(k);
    const pr = simEval(spec.code, p, st).then(o => { o.el = toReact(o.tree, 'root'); return o; }, e => ({ err: e.message }))
      .then(o => { pending.delete(k); cache.set(k, o); if (cache.size > 400) cache.delete(cache.keys().next().value); if (!o.err) { last = o; store(p, o); } onUpdate(); return o; });
    pending.set(k, pr);
    return pr;
  }
  return {
    code: spec.code, defaults: spec.defaults, steps: spec.steps,
    sliders: spec.sliders.map(sl => ({ ...sl, fmt: (v) => fms.get(sl.key + ':' + v) ?? String(v) })),
    run(p) { const r = runs.get(JSON.stringify(p)); if (!r) request(p, 99); return r || (last ? last.r : { formulaLabel: '', formula: '계산 중…', explain: '' }); },
    draw(p, st) {
      const o = cache.get(key(p, st));
      if (!o) request(p, st);
      if (o && o.err) return MSG_SVG('이 값에서는 그림을 그릴 수 없어요 · 값을 바꿔보세요');
      return (o || last) ? (o || last).el : MSG_SVG('시각화를 그리는 중…');
    },
    prefetch(p, st) { return request(p, st); }
  };
}

// ---------- 시각화 생성 (실패 시 오류를 알려주고 1번 재시도) ----------
export async function generateViz(ch, text) {
  let prev = null, error = null, fallback = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    let code;
    try { code = (await api('/api/visualize', { title: ch.title, vizTitle: ch.vizTitle, focus: ch.focus, type: ch.type, start: ch.start, end: ch.end, text, prev, error }, 240000)).code; }
    catch (e) { error = e.message; continue; }
    try {
      const meta = await simMeta(code);
      if (!meta.sliders.length || meta.sliders.some(s => !(s.max > s.min))) throw new Error('슬라이더 범위가 올바르지 않아요');
      if (!meta.steps.length) throw new Error('steps가 비어 있어요');
      const d = { ...meta.defaults };
      meta.sliders.forEach(s => { if (typeof d[s.key] !== 'number') d[s.key] = s.min; });
      await simEval(code, d, 0);
      const full = await simEval(code, d, 99);
      await simEval(code, Object.fromEntries(meta.sliders.map(s => [s.key, s.max])), 99);
      const res = { code, vizTitle: meta.vizTitle || ch.vizTitle, steps: meta.steps, sliders: meta.sliders, defaults: d };
      // 실행은 되지만 글자가 겹치면 한 번 다시 그리게 함. 다시 그린 게 실패하면 겹친 그림이라도 씀
      const lay = attempt === 0 ? layoutIssues(full.tree) : '';
      if (!lay) return res;
      fallback = res;
      throw new Error('코드는 실행되지만 그림 배치가 겹쳐요: ' + lay + '. 아무것도 겹치지 않게 좌표를 옮기고, 설명 글자는 박스 밖 별도 줄에 두고, 자리가 부족하면 viewBox 높이를 늘려 주세요.');
    } catch (e) { prev = code; error = e.message; }
  }
  if (fallback) return fallback;
  console.warn('[Visync] 시각화 생성 실패:', ch.title, error);
  return { failed: true, error: error || '알 수 없는 오류' };
}

export async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
