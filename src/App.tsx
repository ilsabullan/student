import { useEffect, useState } from 'react';
import OnboardingPage from './pages/onboardingLogic.js';
import LecturePage from './pages/lectureLogic.js';

const Onboarding = OnboardingPage as any;
const Lecture = LecturePage as any;

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const hasPdf = !!window.__visync?.file;
  if (route.startsWith('#/lecture') && !hasPdf) { window.location.hash = '#/'; }
  return route.startsWith('#/lecture') && hasPdf ? <Lecture key="lecture" /> : <Onboarding key="onboarding" />;
}
