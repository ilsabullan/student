import { useEffect, useState } from 'react';
import OnboardingPage from './pages/onboardingLogic.js';
import LecturePage from './pages/lectureLogic.js';
import { restoreSession } from './ai/session.js';

const Onboarding = OnboardingPage as any;
const Lecture = LecturePage as any;

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const [restoring, setRestoring] = useState(false);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const isLecture = route.startsWith('#/lecture');
  const hasPdf = !!window.__visync?.file;
  // 수업 화면에서 새로고침하면 메모리의 자료가 사라지므로, 이 기기에 보관해 둔 수업을 되살림. 없으면 온보딩으로
  useEffect(() => {
    if (!isLecture || window.__visync?.file) return;
    let alive = true;
    setRestoring(true);
    restoreSession().then(ok => {
      if (!alive) return;
      setRestoring(false);
      if (!ok) window.location.hash = '#/';
    });
    return () => { alive = false; };
  }, [isLecture]);
  if (isLecture && !hasPdf) {
    return restoring ? <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A9DA8', fontSize: '13px' }}>수업 불러오는 중…</div> : null;
  }
  return isLecture ? <Lecture key="lecture" /> : <Onboarding key="onboarding" />;
}
