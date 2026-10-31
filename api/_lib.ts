declare const process: { env: Record<string, string | undefined> };

const BASE = process.env.LLM_BASE_URL || 'https://api.console.lablup.ai/v1';
const MODEL = process.env.LLM_MODEL || 'DeepSeek-V4.1-Flash-B300';
const MAX_BODY = 300_000;
const hits = new Map<string, number[]>();

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

// 우리 사이트에서 온 요청만, IP당 10분에 150회까지(인스턴스 단위 best-effort) · 수업 중 위치 추적이 8초마다 호출됨
export async function guard(req: Request): Promise<{ body?: any; error?: Response }> {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  let ok = false;
  try { const o = new URL(origin || ''); ok = o.host === host || allowed.includes(o.origin) || o.hostname === 'localhost'; } catch { ok = false; }
  if (!ok) return { error: json({ error: '허용되지 않은 요청이에요' }, 403) };
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 600_000);
  if (list.length >= 150) return { error: json({ error: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요' }, 429) };
  list.push(now); hits.set(ip, list);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return { error: json({ error: '요청이 너무 커요' }, 413) };
  try { return { body: JSON.parse(raw) }; } catch { return { error: json({ error: '잘못된 요청 형식이에요' }, 400) }; }
}

let thinkingOff = (process.env.LLM_DISABLE_THINKING ?? '1') !== '0';

async function call(messages: Msg[], opts: { maxTokens?: number; temperature?: number }, extra: Record<string, unknown>) {
  const key = process.env.LLM_API_KEY;
  if (!key) throw new Error('서버에 LLM_API_KEY가 설정되지 않았어요');
  return fetch(BASE.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature: opts.temperature ?? 0.3, max_tokens: opts.maxTokens ?? 4000, ...extra })
  });
}

// 추론(thinking) 모델은 토큰을 생각에 다 써서 본문이 비는 경우가 있어 기본으로 끕니다. 서버가 옵션을 거부하면 끄지 않고 다시 요청.
export async function llm(messages: Msg[], opts: { maxTokens?: number; temperature?: number } = {}) {
  let res = await call(messages, opts, thinkingOff ? { chat_template_kwargs: { thinking: false, enable_thinking: false } } : {});
  if (res.status === 400 && thinkingOff) { thinkingOff = false; res = await call(messages, opts, {}); }
  if (!res.ok) throw new Error('AI 서버 오류 ' + res.status + ': ' + (await res.text()).slice(0, 200));
  const j: any = await res.json();
  const ch = j?.choices?.[0] || {};
  let text = String(ch.message?.content || '');
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '').trim();
  if (!text) throw new Error('AI 응답 본문이 비어 있어요 (finish_reason=' + (ch.finish_reason || '?') + (ch.message?.reasoning_content ? ', 생각 과정만 있음' : '') + ')');
  return text;
}

export function extractJson(s: string) {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  const t = fence ? fence[1] : s;
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('AI 응답에서 JSON을 찾지 못했어요');
  const raw = t.slice(a, b + 1);
  try { return JSON.parse(raw); } catch {}
  // 흔한 오류 보정: 끝 쉼표, 스마트 따옴표, 문자열 안 줄바꿈
  const fixed = raw.replace(/,\s*([}\]])/g, '$1').replace(/[\u201C\u201D]/g, '\\"').replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m) => m.replace(/\n/g, '\\n'));
  return JSON.parse(fixed);
}

// JSON 응답을 받아 파싱하고, 실패하면 오류를 알려주고 한 번 더 요청
export async function llmJson(messages: Msg[], opts: { maxTokens?: number; temperature?: number } = {}) {
  let out = await llm(messages, opts);
  try { return extractJson(out); } catch (e: any) {
    out = await llm([...messages, { role: 'assistant', content: out }, { role: 'user', content: '위 응답은 올바른 JSON이 아니에요(' + String(e?.message || e).slice(0, 160) + '). 문자열 안에서는 큰따옴표 대신 작은따옴표를 쓰고, 같은 내용을 올바른 JSON만으로 다시 주세요.' }], { ...opts, temperature: 0 });
    return extractJson(out);
  }
}

export function extractCode(s: string) {
  const fence = s.match(/```(?:js|javascript)?\s*([\s\S]*?)```/);
  let t = (fence ? fence[1] : s).trim().replace(/;\s*$/, '');
  if (!t.startsWith('(')) { const a = t.indexOf('{'); if (a >= 0) t = '(' + t.slice(a) + ')'; }
  return t;
}

export async function handle(req: Request, fn: (body: any) => Promise<unknown>) {
  const g = await guard(req);
  if (g.error) return g.error;
  try { return json(await fn(g.body)); }
  catch (e: any) { return json({ error: String(e?.message || e) }, 502); }
}
