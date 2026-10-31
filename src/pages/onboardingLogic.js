import React from 'react';
import { DCLogic } from '../dc';
import View from './OnboardingView.jsx';
import { api, extractPdfText, generateViz, pool } from '../ai/client.js';

class Component extends DCLogic {
  state = { mic: 'checking', phase: 'idle', progress: 0, file: null, drag: false, transcript: true, visual: true, stage: '', err: '', analysis: null };
  fileRef = React.createRef();
  componentDidMount() {
    this.micInit();
    if (this.props.initialState === 'ready') this.setState({ phase: 'ready', progress: 100, file: { name: 'OS_11-Memory-management-1.pdf', size: 798734 } });
  }
  componentWillUnmount() { this.micStop(); clearInterval(this.timer); this.run = null; }
  micInit() {
    const md = navigator.mediaDevices;
    const upd = async () => {
      let perm = 'prompt', has = !!(md && md.getUserMedia);
      try { if (navigator.permissions) perm = (await navigator.permissions.query({ name: 'microphone' })).state; } catch (x) {}
      try { if (has && md.enumerateDevices) has = (await md.enumerateDevices()).some(d => d.kind === 'audioinput'); } catch (x) {}
      if (!this.micGone) this.setState({ mic: has ? perm : 'none' });
    };
    this.micUpd = upd; upd();
    if (md && md.addEventListener) md.addEventListener('devicechange', upd);
    if (navigator.permissions) navigator.permissions.query({ name: 'microphone' }).then(p => { p.onchange = upd; this.micPerm = p; }).catch(() => {});
  }
  micStop() { this.micGone = true; const md = navigator.mediaDevices; if (md && md.removeEventListener && this.micUpd) md.removeEventListener('devicechange', this.micUpd); if (this.micPerm) this.micPerm.onchange = null; }
  async askMic() {
    if (this.state.mic !== 'prompt') return;
    try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); st.getTracks().forEach(t => t.stop()); } catch (x) {}
    this.micUpd && this.micUpd();
  }
  async begin(file) {
    clearInterval(this.timer);
    const bad = !/\.pdf$/i.test(file.name || '') && file.type !== 'application/pdf' ? 'PDF 파일만 올릴 수 있어요' : file.size > 100 * 1048576 ? '100MB 이하의 PDF만 올릴 수 있어요 (' + (file.size / 1048576).toFixed(0) + 'MB)' : '';
    if (bad) { this.run = null; this.setState({ file, phase: 'error', progress: 0, stage: bad + ' · 파일을 지우고 다시 올려 주세요', analysis: null }); return; }
    const run = this.run = {};
    const alive = () => this.run === run;
    const set = (o) => alive() && this.setState(o);
    this.setState({ file, phase: 'loading', progress: 2, stage: '자료 읽는 중…', err: '', analysis: null });
    try {
      const { numPages, pages } = await extractPdfText(file, (k, n) => set({ progress: 2 + Math.round(18 * k / n) }));
      if (!pages.some(p => p.text.length > 20)) throw new Error('PDF에서 글자를 읽지 못했어요 (스캔 이미지 PDF는 아직 지원하지 않아요)');
      set({ progress: 22, stage: '목차에서 챕터 추출 중…' });
      this.timer = setInterval(() => set({ progress: Math.min(40, this.state.progress + 1) }), 700);
      const a = await api('/api/analyze', { fileName: file.name, numPages, pages });
      clearInterval(this.timer);
      if (!alive()) return;
      const targets = a.chapters.filter(c => c.type !== 'text');
      let done = 0;
      set({ progress: 42, stage: '시각화 만드는 중… (0/' + targets.length + ')' });
      const textOf = (c) => pages.filter(p => p.page >= c.start && p.page <= c.end).map(p => '[p.' + p.page + '] ' + p.text).join('\n');
      const vizs = await pool(targets, 3, async (c) => {
        const v = await generateViz(c, textOf(c));
        done++; set({ progress: 42 + Math.round(58 * done / targets.length), stage: '시각화 만드는 중… (' + done + '/' + targets.length + ')' });
        return v;
      });
      if (!alive()) return;
      const chapters = a.chapters.map(c => { const k = targets.indexOf(c), v = k >= 0 ? vizs[k] : null; return { ...c, viz: v && !v.failed ? v : null, vizError: v && v.failed ? v.error : '' }; });
      const fails = chapters.filter(c => c.vizError);
      this.setState({ phase: 'ready', progress: 100, analysis: { title: a.title, numPages, chapters, vizCount: targets.length - fails.length, failCount: fails.length, failReason: fails[0] ? fails[0].vizError : '', pages } });
    } catch (e) {
      clearInterval(this.timer);
      set({ phase: 'error', stage: '분석에 실패했어요 · ' + e.message + ' · 파일을 지우고 다시 올려 주세요' });
    }
  }
  renderVals() {
    const s = this.state;
    const on = (v) => v ? { b: '#D9D8FB', bg: '#F3F2FE', c: '#4A4ED6' } : { b: '#E8EAEE', bg: '#FFFFFF', c: '#8A8D98' };
    const tr = on(s.transcript), vz = on(s.visual);
    const ready = s.phase === 'ready';
    const p = s.progress;
    const chapters = (s.analysis ? s.analysis.chapters : []).map((c, i) => {
      const kind = c.viz ? (c.type === 'image' ? 'image' : 'flow') : c.vizError ? 'fail' : 'text';
      return {
        no: String(i + 1).padStart(2, '0'), title: c.title, border: i ? '#F0F1F4' : 'transparent',
        tag: kind === 'flow' ? '원리 시각화' : kind === 'image' ? '자료 이미지' : kind === 'fail' ? '시각화 실패' : '텍스트',
        tagColor: kind === 'flow' ? '#5B5FE8' : kind === 'image' ? '#B26A12' : kind === 'fail' ? '#D2383E' : '#8A8D98',
        tagBg: kind === 'flow' ? '#F1F1FE' : kind === 'image' ? '#FDF3E3' : kind === 'fail' ? '#FDECEC' : '#F3F4F6'
      };
    });
    return {
      ...(() => { const m = { granted: ['마이크 연결됨', '#3CC48A', '#9A9DA8', '마이크를 사용할 수 있어요'], prompt: ['마이크 권한 허용하기', '#E0A526', '#B26A12', '눌러서 마이크 권한을 허용해 주세요'], denied: ['마이크 차단됨', '#E5484D', '#D2383E', '주소창 왼쪽 사이트 설정에서 마이크를 허용해 주세요'], none: ['마이크 없음', '#B4B7C0', '#9A9DA8', '연결된 마이크를 찾지 못했어요'] }[s.mic] || ['마이크 확인 중…', '#B4B7C0', '#9A9DA8', '']; return { micLabel: m[0], micDot: m[1], micColor: m[2], micTitle: m[3], micCursor: s.mic === 'prompt' ? 'pointer' : 'default' }; })(),
      askMic: () => this.askMic(),
      showSidebar: this.props.showSidebar ?? true,
      recent: [
        { title: '분자생물학 · 5강 DNA 복제', meta: '10월 29일 · 72분' },
        { title: '유기화학 · 반응 메커니즘', meta: '10월 28일 · 65분' },
        { title: '생화학 · 효소 반응속도론', meta: '10월 24일 · 80분' },
        { title: '세포생물학 · 막 수송', meta: '10월 22일 · 58분' }
      ],
      isIdle: s.phase === 'idle', hasFile: s.phase !== 'idle', isLoading: s.phase === 'loading' || s.phase === 'error', isReady: ready,
      notReady: !ready,
      fileName: s.file?.name, fileSize: s.file ? (s.file.size / 1048576).toFixed(1) + 'MB' : '',
      progressPct: p + '%',
      stepLabel: s.stage,
      pageCount: s.analysis ? s.analysis.numPages : 0, chapterCount: chapters.length + '개' + (s.analysis ? ' · 시각화 ' + s.analysis.vizCount + '개' + (s.analysis.failCount ? ' · 실패 ' + s.analysis.failCount + '개 (' + s.analysis.failReason.slice(0, 90) + ')' : '') : ''), chapters,
      dropBorder: s.drag ? '#8C8FF5' : '#DCDDE6', dropBg: s.drag ? '#F5F4FF' : '#FCFCFD',
      trBorder: tr.b, trBg: tr.bg, trColor: tr.c, vzBorder: vz.b, vzBg: vz.bg, vzColor: vz.c,
      startBg: ready ? '#1C1D22' : '#ECEDF1', startColor: ready ? '#FFFFFF' : '#A7AAB3', startCursor: ready ? 'pointer' : 'default',
      startLabel: '수업 시작하기',
      fileRef: this.fileRef,
      pick: () => this.fileRef.current?.click(),
      onFile: (e) => { const f = e.target.files?.[0]; if (f) this.begin(f); e.target.value = ''; },
      onDragOver: (e) => { e.preventDefault(); if (!s.drag) this.setState({ drag: true }); },
      onDragLeave: () => this.setState({ drag: false }),
      onDrop: (e) => { e.preventDefault(); this.setState({ drag: false }); const f = e.dataTransfer.files?.[0]; if (f) this.begin(f); },
      useSample: () => this.begin({ name: 'OS_11-Memory-management-1.pdf', size: 798734 }),
      reset: () => { clearInterval(this.timer); this.run = null; this.setState({ phase: 'idle', progress: 0, file: null, analysis: null, stage: '' }); },
      toggleTranscript: () => this.setState({ transcript: !s.transcript }),
      toggleVisual: () => this.setState({ visual: !s.visual }),
      start: () => { if (ready) window.__visync = { file: (typeof File !== 'undefined' && s.file instanceof File) ? s.file : null, name: s.file && s.file.name, analysis: s.analysis }; location.hash = '#/lecture'; }
    };
  }
}

Component.View = View;
export default Component;
