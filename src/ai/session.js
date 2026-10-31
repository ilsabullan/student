// 새로고침해도 수업이 이어지도록 이 기기(IndexedDB)에 수업 자료와 진행 상황을 보관.
// 'session' = PDF·분석 결과(수업 시작 때 한 번), 'progress' = 받아쓰기·요약·위치(수업 중 계속 갱신)
const DB = 'visync', STORE = 'kv';

function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function run(mode, fn) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); res(req ? req.result : undefined); };
    t.onerror = t.onabort = () => { db.close(); rej(t.error); };
  });
}

const get = (key) => run('readonly', s => s.get(key)).catch(() => null);
const put = (key, value) => run('readwrite', s => s.put(value, key)).catch(e => console.warn('[Visync] 수업 상태 저장 실패:', e));

// 수업 시작: 자료를 보관하고 지난 수업의 진행 상황은 지움
export function startSession(file, name, analysis) {
  return run('readwrite', s => { s.put({ file, name, analysis: JSON.parse(JSON.stringify(analysis)) }, 'session'); s.delete('progress'); })
    .catch(e => console.warn('[Visync] 수업 자료 저장 실패:', e));
}

export const saveProgress = (progress) => put('progress', progress);

export function clearSession() {
  return run('readwrite', s => { s.delete('session'); s.delete('progress'); }).catch(() => {});
}

// 새로고침 후: 보관해 둔 수업이 있으면 window.__visync를 되살림
export async function restoreSession() {
  const s = await get('session');
  if (!s || !s.file || !s.analysis) return false;
  window.__visync = { file: s.file, name: s.name, analysis: s.analysis, progress: (await get('progress')) || null };
  return true;
}
