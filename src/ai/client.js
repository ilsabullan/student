import React from 'react';
import { RUNNER_SRC } from './runner.js';

export const AIX = { on: false, vizTimes: {} };

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
  let prev = null, error = null;
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
      await simEval(code, d, 99);
      await simEval(code, Object.fromEntries(meta.sliders.map(s => [s.key, s.max])), 99);
      return { code, vizTitle: meta.vizTitle || ch.vizTitle, steps: meta.steps, sliders: meta.sliders, defaults: d };
    } catch (e) { prev = code; error = e.message; }
  }
  console.warn('[Visync] 시각화 생성 실패:', ch.title, error);
  return { failed: true, error: error || '알 수 없는 오류' };
}

export async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
