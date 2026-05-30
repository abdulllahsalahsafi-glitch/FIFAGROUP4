// FIFA GROUP - V4 splash hold + smart visual progress
// UI-only. Progress moves slowly while the app loads, then completes to 100% only when App.jsx releases the splash.

const SPLASH_MIN_VISIBLE_MS = 3400;
const splashStartedAt = Date.now();
let visualProgress = 0;
let progressTimer = null;
let progressInstalled = false;

function remainingSplashTime() {
  return Math.max(0, SPLASH_MIN_VISIBLE_MS - (Date.now() - splashStartedAt));
}

function getSplash() {
  if (typeof document === 'undefined') return null;
  return document.getElementById('fifa-splash');
}

function setSplashProgress(value) {
  const splash = getSplash();
  if (!splash) return;
  const next = Math.max(0, Math.min(100, value));
  visualProgress = Math.max(visualProgress, next);
  splash.style.setProperty('--fifa-splash-progress', `${visualProgress.toFixed(1)}%`);
}

function installSmartProgress() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const splash = getSplash();
  if (!splash || progressInstalled) return;
  progressInstalled = true;

  setSplashProgress(4);

  progressTimer = window.setInterval(() => {
    const current = getSplash();
    if (!current || current.dataset.v4SplashReleased === 'true') {
      if (progressTimer) window.clearInterval(progressTimer);
      progressTimer = null;
      return;
    }

    const elapsed = Date.now() - splashStartedAt;
    let target;

    if (elapsed < 550) target = 18;
    else if (elapsed < 1400) target = 38;
    else if (elapsed < 2400) target = 62;
    else if (elapsed < 3600) target = 78;
    else if (elapsed < 5200) target = 88;
    else target = 94;

    const distance = target - visualProgress;
    if (distance > 0) {
      const step = Math.max(0.45, Math.min(3.2, distance * 0.16));
      setSplashProgress(visualProgress + step);
    }
  }, 140);
}

function finishSplashProgressThenHide(splash) {
  if (!splash || splash.dataset.v4SplashReleased === 'true') return;
  splash.dataset.v4SplashReleased = 'true';

  if (progressTimer) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }

  setSplashProgress(100);

  window.setTimeout(() => {
    splash.classList.add('fifa-splash-hide');
    window.setTimeout(() => {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 520);
  }, 460);
}

function delayReleaseIfNeeded(splash) {
  if (!splash || splash.dataset.v4SplashReleased === 'true') return false;

  const remaining = remainingSplashTime();
  if (remaining > 0) {
    splash.classList.remove('fifa-splash-hide');
    window.setTimeout(() => finishSplashProgressThenHide(splash), remaining);
    return true;
  }

  return false;
}

function installSplashHold() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const splash = getSplash();
  if (!splash) return;

  installSmartProgress();

  if (splash.dataset.v4SplashHoldInstalled === 'true') return;
  splash.dataset.v4SplashHoldInstalled = 'true';

  const observer = new MutationObserver(() => {
    const current = getSplash();
    if (!current || current.dataset.v4SplashReleased === 'true') return;

    if (current.classList.contains('fifa-splash-hide')) {
      if (delayReleaseIfNeeded(current)) return;
      finishSplashProgressThenHide(current);
    }
  });

  observer.observe(splash, { attributes: true, attributeFilter: ['class'] });

  const nativeRemove = splash.remove?.bind(splash);
  splash.remove = function removeSplashWithHold() {
    if (delayReleaseIfNeeded(splash)) return;

    finishSplashProgressThenHide(splash);

    // Keep nativeRemove referenced so browsers do not drop the binding in older engines.
    void nativeRemove;
  };
}

if (typeof window !== 'undefined') {
  installSplashHold();
  window.requestAnimationFrame(installSplashHold);
  window.setTimeout(installSplashHold, 120);
}
