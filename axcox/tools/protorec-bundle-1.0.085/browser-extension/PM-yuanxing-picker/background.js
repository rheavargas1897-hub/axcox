const STORAGE_KEY = 'protoSyncState';
const SERVER_PORT_CANDIDATES = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 4100, 4101, 4102, 4103, 4104, 4105];
const MIN_SUPPORTED_PROTOCOL_VERSION = 2;
const CAPTURE_VISIBLE_TAB_MIN_INTERVAL_MS = 700;
const CAPTURE_VISIBLE_TAB_MAX_RETRIES = 5;
const CAPTURE_VISIBLE_TAB_BACKOFF_BASE_MS = 450;
const RUNTIME_GENERATED_CLASS_PATTERNS = [
  /^(?:css|r|store)-[a-z0-9_-]{4,}$/i,
  /^go\d{6,}$/i,
  /^(?:jsx|emotion|chakra|mantine|sc)-[a-z0-9_-]{4,}$/i
];

let syncState = {
  isRunning: false,
  phase: 'idle',
  message: '准备就绪，点击开始抓取',
  currentItemTitle: '',
  progressText: '',
  tip: '抓取过程中会在当前页面保持不跳转，完成后可手动预览还原页面。',
  serverPort: '',
  serverBaseUrl: '',
  serverStatus: 'disconnected',
  previewUrl: '',
  restoreTargetPath: '',
  capturePath: '',
  steps: {
    health: 'pending',
    capture: 'pending',
    save: 'pending',
    restore: 'pending'
  },
  updatedAt: Date.now()
};
let currentRunController = null;
let currentProgressPoller = null;
let currentPopupPort = null;
let captureVisibleTabQueue = Promise.resolve();
let captureVisibleTabLastCallAt = 0;

function isRuntimeGeneratedClassName(className = '') {
  const normalized = String(className || '').trim();
  if (!normalized) {
    return false;
  }

  return RUNTIME_GENERATED_CLASS_PATTERNS.some((pattern) => pattern.test(normalized));
}

async function initializeState() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (stored?.[STORAGE_KEY]) {
    syncState = stored[STORAGE_KEY];
  }
}

function createIdleState() {
  return {
    isRunning: false,
    phase: 'idle',
    message: '准备就绪，点击开始抓取',
    currentItemTitle: '',
    progressText: '',
    tip: '抓取过程中会在当前页面保持不跳转，完成后可手动预览还原页面。',
    serverPort: syncState.serverPort || '',
    serverBaseUrl: syncState.serverBaseUrl || '',
    serverStatus: syncState.serverStatus || 'disconnected',
    previewUrl: '',
    restoreTargetPath: '',
    capturePath: '',
    steps: {
      health: 'pending',
      capture: 'pending',
      save: 'pending',
      restore: 'pending'
    }
  };
}

function createRunId() {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clearCurrentRunArtifacts(options = {}) {
  const { preserveController = false } = options;

  if (!preserveController) {
    currentRunController = null;
  }
  if (currentProgressPoller) {
    clearInterval(currentProgressPoller);
    currentProgressPoller = null;
  }
}

function buildCanceledState(reason = 'manual') {
  const nextMessage = reason === 'popup_closed'
    ? '已因关闭弹窗取消当前同步'
    : '已取消当前同步';

  return {
    isRunning: false,
    phase: 'canceled',
    message: nextMessage,
    currentItemTitle: '',
    progressText: '',
    tip: '可重新打开弹窗并再次发起抓取。',
    previewUrl: '',
    restoreTargetPath: '',
    capturePath: '',
    steps: syncState.steps || createStepState()
  };
}

async function cancelCurrentRun(reason = 'manual') {
  if (!syncState.isRunning) {
    return syncState;
  }

  const serverBaseUrl = syncState.serverBaseUrl;
  const runId = syncState.runId;

  if (currentRunController) {
    currentRunController.abort(new Error('用户已取消当前同步'));
  }

  clearCurrentRunArtifacts();

  if (serverBaseUrl && runId) {
    fetch(`${serverBaseUrl}/save-cancel/${encodeURIComponent(runId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    }).catch(() => undefined);
  }

  await setSyncState({
    ...buildCanceledState(reason),
    serverPort: syncState.serverPort,
    serverBaseUrl: syncState.serverBaseUrl,
    serverStatus: syncState.serverStatus,
    runId: ''
  });

  return syncState;
}

async function startProgressPolling(serverBaseUrl, runId, fallbackTitle = '') {
  if (!serverBaseUrl || !runId) {
    return;
  }

  if (currentProgressPoller) {
    clearInterval(currentProgressPoller);
  }

  const poll = async () => {
    if (!syncState.isRunning || syncState.runId !== runId) {
      return;
    }

    try {
      const progress = await requestJson(`${serverBaseUrl}/save-progress/${encodeURIComponent(runId)}`, {}, 3000);
      if (!syncState.isRunning || syncState.runId !== runId) {
        return;
      }

      const progressText = progress.progressText || '';
      const currentItemTitle = progress.currentItemTitle || fallbackTitle || syncState.currentItemTitle || '';
      const phase = progress.phase || syncState.phase;
      const taskMessage = progress.message || syncState.message;
      const nextTip = [
        progress.detail || '',
        progressText ? `当前进度：${progressText}` : '',
        '关闭弹窗会自动取消当前同步。'
      ].filter(Boolean).join(' ');

      await setSyncState({
        phase,
        message: taskMessage,
        currentItemTitle,
        progressText,
        tip: nextTip || syncState.tip
      });
    } catch (_error) {
      return undefined;
    }
  };

  await poll();
  currentProgressPoller = setInterval(() => {
    poll().catch(() => undefined);
  }, 350);
}

async function resetPopupStateToIdle(serverInfo = null) {
  const nextState = {
    ...createIdleState(),
    serverPort: serverInfo ? String(serverInfo.port) : (syncState.serverPort || ''),
    serverBaseUrl: serverInfo ? serverInfo.baseUrl : (syncState.serverBaseUrl || ''),
    serverStatus: serverInfo ? 'connected' : (syncState.serverPort ? syncState.serverStatus : 'disconnected')
  };

  await setSyncState(nextState);
  return syncState;
}

function createServerBaseUrl(port) {
  return `http://localhost:${port}`;
}

async function setSyncState(patch) {
  syncState = {
    ...syncState,
    ...patch,
    steps: patch.steps ? patch.steps : syncState.steps,
    updatedAt: Date.now()
  };

  await chrome.storage.local.set({ [STORAGE_KEY]: syncState });

  try {
    await chrome.runtime.sendMessage({ type: 'SYNC_STATE_UPDATED', state: syncState });
  } catch (error) {
    return undefined;
  }

  return syncState;
}

function createStepState(overrides = {}) {
  return {
    health: 'pending',
    capture: 'pending',
    save: 'pending',
    restore: 'pending',
    ...overrides
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 1200) {
  const externalSignal = options?.signal;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`请求超时（>${timeoutMs}ms）`)), timeoutMs);
  let abortHandler = null;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      abortHandler = () => controller.abort(externalSignal.reason);
      externalSignal.addEventListener('abort', abortHandler, { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal && abortHandler) {
      externalSignal.removeEventListener('abort', abortHandler);
    }
  }
}

function captureVisibleTabRaw(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        reject(new Error(chrome.runtime.lastError?.message || '截图失败'));
        return;
      }

      resolve(dataUrl);
    });
  });
}

function isCaptureVisibleTabQuotaError(error) {
  const text = String(error?.message || error || '').trim();
  if (!text) {
    return false;
  }

  return /MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND|captureVisibleTab|calls per second|quota/i.test(text);
}

async function captureVisibleTabWithRetry(windowId) {
  let lastError = null;

  for (let attempt = 0; attempt < CAPTURE_VISIBLE_TAB_MAX_RETRIES; attempt += 1) {
    const elapsedMs = Date.now() - captureVisibleTabLastCallAt;
    const waitForIntervalMs = CAPTURE_VISIBLE_TAB_MIN_INTERVAL_MS - elapsedMs;
    if (waitForIntervalMs > 0) {
      await delay(waitForIntervalMs);
    }

    try {
      const screenshotDataUrl = await captureVisibleTabRaw(windowId);
      captureVisibleTabLastCallAt = Date.now();
      return screenshotDataUrl;
    } catch (error) {
      lastError = error;
      captureVisibleTabLastCallAt = Date.now();

      if (!isCaptureVisibleTabQuotaError(error) || attempt >= CAPTURE_VISIBLE_TAB_MAX_RETRIES - 1) {
        break;
      }

      const backoffMs = CAPTURE_VISIBLE_TAB_BACKOFF_BASE_MS * (attempt + 1);
      await delay(backoffMs);
    }
  }

  if (isCaptureVisibleTabQuotaError(lastError)) {
    throw new Error(`截图触发浏览器频率限制，已自动重试 ${CAPTURE_VISIBLE_TAB_MAX_RETRIES} 次仍失败，请等待 2-3 秒后重试。`);
  }

  throw lastError || new Error('截图失败');
}

function captureVisibleTab(windowId) {
  const runCaptureTask = async () => captureVisibleTabWithRetry(windowId);
  const queuedTask = captureVisibleTabQueue.then(runCaptureTask, runCaptureTask);
  captureVisibleTabQueue = queuedTask.catch(() => undefined);
  return queuedTask;
}

async function backfillCriticalImageSnapshotsFromViewport(tabId, screenshotDataUrl, existingSnapshotIds = []) {
  if (!tabId || !screenshotDataUrl) {
    return [];
  }

  const results = await executePageScript(tabId, async (capturedViewportDataUrl, knownSnapshotIds) => {
    const existingIds = new Set(Array.isArray(knownSnapshotIds) ? knownSnapshotIds.map((value) => String(value || '').trim()).filter(Boolean) : []);
    const loadImage = (src) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('截图加载失败'));
      image.src = src;
    });
    const normalizeRect = (rect, viewportWidth, viewportHeight) => {
      const left = Math.max(0, Math.min(viewportWidth, rect.left));
      const top = Math.max(0, Math.min(viewportHeight, rect.top));
      const right = Math.max(left, Math.min(viewportWidth, rect.right));
      const bottom = Math.max(top, Math.min(viewportHeight, rect.bottom));
      return {
        left,
        top,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top)
      };
    };
    const captureRectSnapshot = (screenshotImage, clippedRect, scaleX, scaleY) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(clippedRect.width * scaleX));
      canvas.height = Math.max(1, Math.round(clippedRect.height * scaleY));
      const context = canvas.getContext('2d');
      if (!context) {
        return '';
      }

      context.drawImage(
        screenshotImage,
        clippedRect.left * scaleX,
        clippedRect.top * scaleY,
        clippedRect.width * scaleX,
        clippedRect.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl && dataUrl !== 'data:,' ? dataUrl : '';
    };
    const shouldBackfillViewportImage = (element, rect) => {
      if (!(element instanceof HTMLImageElement)) {
        return false;
      }

      const src = String(element.currentSrc || element.getAttribute('src') || '').trim().toLowerCase();
      const alt = String(element.getAttribute('alt') || '').trim().toLowerCase();
      const className = typeof element.className === 'string' ? element.className.toLowerCase() : '';
      const role = String(element.getAttribute('role') || '').trim().toLowerCase();
      const ariaLabel = String(element.getAttribute('aria-label') || '').trim().toLowerCase();
      const title = String(element.getAttribute('title') || '').trim().toLowerCase();
      const testId = String(element.getAttribute('data-testid') || '').trim().toLowerCase();
      const parent = element.parentElement;
      const parentRole = String(parent?.getAttribute?.('role') || '').trim().toLowerCase();
      const parentClassName = typeof parent?.className === 'string' ? parent.className.toLowerCase() : '';
      const labelText = [src, alt, className, role, ariaLabel, title, testId, parentRole, parentClassName].join(' ');
      const isCritical = /(logo|avatar|supplier|company|店铺|商家|供应商)/.test(labelText)
        || src.includes('fss-css.yzw.cn');
      const isSmallVisual = rect.width > 0 && rect.height > 0 && rect.width <= 320 && rect.height <= 320;

      return isCritical || isSmallVisual;
    };
    const shouldBackfillViewportBackground = (element, rect) => {
      if (!(element instanceof Element) || element instanceof HTMLImageElement) {
        return false;
      }

      if (!(rect.width > 0 && rect.height > 0)) {
        return false;
      }

      const computedStyle = window.getComputedStyle(element);
      const backgroundImage = String(computedStyle.backgroundImage || '').trim();
      if (!backgroundImage || backgroundImage === 'none' || !/url\(/i.test(backgroundImage)) {
        return false;
      }

      if (computedStyle.visibility === 'hidden' || computedStyle.display === 'none' || Number(computedStyle.opacity) === 0) {
        return false;
      }

      const area = rect.width * rect.height;
      const maxArea = Math.max((window.innerWidth || 1) * (window.innerHeight || 1) * 0.38, 180000);
      if (area <= 0 || area > maxArea) {
        return false;
      }

      const className = typeof element.className === 'string' ? element.className.toLowerCase() : '';
      const role = String(element.getAttribute('role') || '').trim().toLowerCase();
      const ariaLabel = String(element.getAttribute('aria-label') || '').trim().toLowerCase();
      const testId = String(element.getAttribute('data-testid') || '').trim().toLowerCase();
      const semanticText = [className, role, ariaLabel, testId].join(' ');
      const isCritical = /(logo|avatar|icon|thumb|thumbnail|banner|cover|hero|supplier|company|shop|store|店铺|商家|供应商)/.test(semanticText);
      const isSmallVisual = rect.width <= 360 && rect.height <= 360;
      const isCardLike = rect.width >= 80 && rect.width <= 720 && rect.height >= 48 && rect.height <= 420;

      return isCritical || isSmallVisual || isCardLike;
    };

    try {
      const screenshotImage = await loadImage(capturedViewportDataUrl);
      const viewportWidth = Math.max(window.innerWidth || document.documentElement.clientWidth || 0, 1);
      const viewportHeight = Math.max(window.innerHeight || document.documentElement.clientHeight || 0, 1);
      const scaleX = screenshotImage.naturalWidth / viewportWidth;
      const scaleY = screenshotImage.naturalHeight / viewportHeight;
      const snapshots = [];
      const pushSnapshot = (restoreNodeId, attr, dataUrl) => {
        const normalizedId = String(restoreNodeId || '').trim();
        if (!normalizedId || existingIds.has(normalizedId) || !dataUrl || dataUrl === 'data:,') {
          return;
        }

        existingIds.add(normalizedId);
        snapshots.push({
          id: normalizedId,
          attr,
          dataUrl
        });
      };

      Array.from(document.images || []).forEach((element, index) => {
        if (!(element instanceof HTMLImageElement)) {
          return;
        }

        const rect = element.getBoundingClientRect();
        if (!(rect.width > 0 && rect.height > 0)) {
          return;
        }

        const restoreNodeId = String(element.getAttribute('data-restore-node-id') || '').trim() || `restore-node-image-${index}`;
        element.setAttribute('data-restore-node-id', restoreNodeId);
        if (existingIds.has(restoreNodeId) || !shouldBackfillViewportImage(element, rect)) {
          return;
        }

        const clippedRect = normalizeRect(rect, viewportWidth, viewportHeight);
        if (!(clippedRect.width >= 8 && clippedRect.height >= 8)) {
          return;
        }

        try {
          const dataUrl = captureRectSnapshot(screenshotImage, clippedRect, scaleX, scaleY);
          pushSnapshot(restoreNodeId, 'src', dataUrl);
        } catch (_error) {
        }
      });

      const backgroundCandidates = Array.from(document.querySelectorAll('*'))
        .map((element, index) => {
          if (!(element instanceof Element) || element instanceof HTMLImageElement) {
            return null;
          }

          const rect = element.getBoundingClientRect();
          if (!shouldBackfillViewportBackground(element, rect)) {
            return null;
          }

          const className = typeof element.className === 'string' ? element.className.toLowerCase() : '';
          const role = String(element.getAttribute('role') || '').trim().toLowerCase();
          const ariaLabel = String(element.getAttribute('aria-label') || '').trim().toLowerCase();
          const semanticText = [className, role, ariaLabel].join(' ');
          const critical = /(logo|avatar|icon|thumb|thumbnail|banner|cover|hero|supplier|company|shop|store|店铺|商家|供应商)/.test(semanticText);
          return { element, rect, index, critical, area: rect.width * rect.height };
        })
        .filter(Boolean)
        .sort((left, right) => {
          if (left.critical !== right.critical) {
            return left.critical ? -1 : 1;
          }
          return left.area - right.area;
        })
        .slice(0, 80);

      backgroundCandidates.forEach((entry) => {
        const { element, rect, index } = entry;
        const restoreNodeId = String(element.getAttribute('data-restore-node-id') || '').trim() || `restore-node-bg-${index}`;
        element.setAttribute('data-restore-node-id', restoreNodeId);
        if (existingIds.has(restoreNodeId)) {
          return;
        }

        const clippedRect = normalizeRect(rect, viewportWidth, viewportHeight);
        if (!(clippedRect.width >= 8 && clippedRect.height >= 8)) {
          return;
        }

        try {
          const dataUrl = captureRectSnapshot(screenshotImage, clippedRect, scaleX, scaleY);
          if (!dataUrl) {
            return;
          }

          pushSnapshot(restoreNodeId, 'style.background-image', `url("${dataUrl}")`);
        } catch (_error) {
        }
      });

      return snapshots;
    } catch (_error) {
      return [];
    }
  }, [screenshotDataUrl, existingSnapshotIds]);

  return Array.isArray(results) ? results : [];
}

async function backfillCriticalImageSnapshotsAcrossPage(tabId, windowId, existingSnapshotIds = []) {
  if (!tabId || !windowId) {
    return [];
  }

  const scrollPlan = await executePageScript(tabId, async () => {
    const buildScrollStops = (maxOffset, viewportExtent, maxStops = 5) => {
      const safeMaxOffset = Math.max(0, Math.round(Number(maxOffset) || 0));
      if (safeMaxOffset <= 0) {
        return [0];
      }

      const safeViewportExtent = Math.max(1, Math.round(Number(viewportExtent) || 0));
      const desiredStep = Math.max(280, Math.round(safeViewportExtent * 0.85));
      const stepCount = Math.max(1, Math.min(maxStops - 1, Math.ceil(safeMaxOffset / desiredStep)));
      const stops = [];

      for (let step = 0; step <= stepCount; step += 1) {
        const nextOffset = step === stepCount
          ? safeMaxOffset
          : Math.min(safeMaxOffset, step * desiredStep);
        stops.push(nextOffset);
      }

      return Array.from(new Set(stops));
    };

    const scrollingElement = document.scrollingElement || document.documentElement || document.body;
    const viewportHeight = Math.max(window.innerHeight || 0, 1);
    const maxScrollTop = Math.max(0, scrollingElement.scrollHeight - viewportHeight);
    const originalScrollTop = Math.max(
      0,
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    );
    const scrollStops = buildScrollStops(maxScrollTop, viewportHeight, 8);

    const containerPlans = Array.from(document.querySelectorAll('*'))
      .map((element, index) => {
        if (!(element instanceof HTMLElement)) {
          return null;
        }

        const rect = element.getBoundingClientRect();
        if (!(rect.width >= 120 && rect.height >= 48)) {
          return null;
        }

        if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
          return null;
        }

        const verticalRange = Math.max(0, element.scrollHeight - element.clientHeight);
        const horizontalRange = Math.max(0, element.scrollWidth - element.clientWidth);
        if (!(verticalRange >= 160 || horizontalRange >= 160)) {
          return null;
        }

        const computedStyle = window.getComputedStyle(element);
        const semanticMarker = [
          element.id,
          element.className,
          element.getAttribute('role'),
          element.getAttribute('aria-label'),
          element.getAttribute('data-testid'),
          element.getAttribute('data-name')
        ].filter(Boolean).join(' ');
        const hasExplicitScroll = /(auto|scroll)/.test(`${computedStyle.overflowX} ${computedStyle.overflowY}`);
        const isLikelyScrollableShell = /(container|content|body|main|panel|table|list|grid|result|search|filter|broadcast|carousel|slick|swiper|viewport)/i.test(semanticMarker);
        if (!hasExplicitScroll && !isLikelyScrollableShell) {
          return null;
        }

        const axis = verticalRange >= horizontalRange ? 'y' : 'x';
        const clientExtent = axis === 'y' ? element.clientHeight : element.clientWidth;
        const maxOffset = axis === 'y' ? verticalRange : horizontalRange;
        const scrollStops = buildScrollStops(maxOffset, clientExtent, axis === 'y' ? 5 : 4);
        if (scrollStops.length <= 1) {
          return null;
        }

        const scrollContainerId = element.getAttribute('data-proto-backfill-scroll-id') || `proto-backfill-scroll-${index}`;
        element.setAttribute('data-proto-backfill-scroll-id', scrollContainerId);

        return {
          id: scrollContainerId,
          axis,
          originalOffset: Math.round(axis === 'y' ? (element.scrollTop || 0) : (element.scrollLeft || 0)),
          scrollStops,
          score: Math.round(rect.width * rect.height) + Math.round(maxOffset * clientExtent) + (axis === 'y' ? 50000 : 0) + (hasExplicitScroll ? 75000 : 0)
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map(({ score, ...plan }) => plan);

    return {
      originalScrollTop,
      scrollStops: Array.from(new Set(scrollStops)),
      containerPlans
    };
  });

  const collectedSnapshots = [];
  const knownIds = new Set(Array.isArray(existingSnapshotIds) ? existingSnapshotIds.map((value) => String(value || '').trim()).filter(Boolean) : []);

  for (const scrollTop of Array.isArray(scrollPlan?.scrollStops) ? scrollPlan.scrollStops : []) {
    await executePageScript(tabId, async (nextScrollTop) => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const scrollingElement = document.scrollingElement || document.documentElement || document.body;
      const settleImage = async (image) => {
        if (!(image instanceof HTMLImageElement)) {
          return;
        }

        image.loading = 'eager';
        image.decoding = 'sync';
        image.fetchPriority = 'high';

        try {
          if (typeof image.decode === 'function') {
            await image.decode();
            return;
          }
        } catch (_error) {
        }

        if (!image.complete) {
          await new Promise((resolve) => {
            const done = () => resolve();
            image.addEventListener('load', done, { once: true });
            image.addEventListener('error', done, { once: true });
            setTimeout(done, 600);
          });
        }
      };

      window.scrollTo({ top: Math.max(0, Number(nextScrollTop) || 0), left: 0, behavior: 'auto' });
      window.dispatchEvent(new Event('scroll'));
      await wait(140);
      await Promise.all(Array.from(document.images || []).map((image) => settleImage(image)));
      await wait(80);
      if (scrollingElement) {
        scrollingElement.scrollTop = Math.max(0, Number(nextScrollTop) || 0);
      }
      return true;
    }, [scrollTop]);

    const screenshotDataUrl = await captureVisibleTab(windowId);
    const snapshots = await backfillCriticalImageSnapshotsFromViewport(tabId, screenshotDataUrl, Array.from(knownIds));
    snapshots.forEach((snapshot) => {
      const snapshotId = String(snapshot?.id || '').trim();
      if (!snapshotId || knownIds.has(snapshotId)) {
        return;
      }
      knownIds.add(snapshotId);
      collectedSnapshots.push(snapshot);
    });
  }

  await executePageScript(tabId, async (restoreScrollTop) => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    window.scrollTo({ top: Math.max(0, Number(restoreScrollTop) || 0), left: 0, behavior: 'auto' });
    window.dispatchEvent(new Event('scroll'));
    await wait(80);
    return true;
  }, [scrollPlan?.originalScrollTop || 0]);

  for (const containerPlan of Array.isArray(scrollPlan?.containerPlans) ? scrollPlan.containerPlans : []) {
    for (const scrollOffset of Array.isArray(containerPlan?.scrollStops) ? containerPlan.scrollStops : []) {
      await executePageScript(tabId, async (scrollContainerId, axis, nextOffset) => {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const settleImage = async (image) => {
          if (!(image instanceof HTMLImageElement)) {
            return;
          }

          image.loading = 'eager';
          image.decoding = 'sync';
          image.fetchPriority = 'high';

          try {
            if (typeof image.decode === 'function') {
              await image.decode();
              return;
            }
          } catch (_error) {
          }

          if (!image.complete) {
            await new Promise((resolve) => {
              const done = () => resolve();
              image.addEventListener('load', done, { once: true });
              image.addEventListener('error', done, { once: true });
              setTimeout(done, 600);
            });
          }
        };

        const container = document.querySelector(`[data-proto-backfill-scroll-id="${String(scrollContainerId || '').trim()}"]`);
        if (!(container instanceof HTMLElement)) {
          return false;
        }

        if (axis === 'x') {
          container.scrollLeft = Math.max(0, Number(nextOffset) || 0);
        } else {
          container.scrollTop = Math.max(0, Number(nextOffset) || 0);
        }
        container.dispatchEvent(new Event('scroll', { bubbles: true }));
        await wait(140);
        await Promise.all(Array.from(document.images || []).map((image) => settleImage(image)));
        await wait(80);
        return true;
      }, [containerPlan.id, containerPlan.axis, scrollOffset]);

      const screenshotDataUrl = await captureVisibleTab(windowId);
      const snapshots = await backfillCriticalImageSnapshotsFromViewport(tabId, screenshotDataUrl, Array.from(knownIds));
      snapshots.forEach((snapshot) => {
        const snapshotId = String(snapshot?.id || '').trim();
        if (!snapshotId || knownIds.has(snapshotId)) {
          return;
        }
        knownIds.add(snapshotId);
        collectedSnapshots.push(snapshot);
      });
    }
  }

  await executePageScript(tabId, async (containerPlans) => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    (Array.isArray(containerPlans) ? containerPlans : []).forEach((plan) => {
      const container = document.querySelector(`[data-proto-backfill-scroll-id="${String(plan?.id || '').trim()}"]`);
      if (!(container instanceof HTMLElement)) {
        return;
      }

      const restoreOffset = Math.max(0, Number(plan?.originalOffset) || 0);
      if (plan?.axis === 'x') {
        container.scrollLeft = restoreOffset;
      } else {
        container.scrollTop = restoreOffset;
      }
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await wait(80);
    return true;
  }, [Array.isArray(scrollPlan?.containerPlans) ? scrollPlan.containerPlans : []]);

  return collectedSnapshots;
}

function mergeBrowserAssetSnapshots(...snapshotGroups) {
  const mergedSnapshots = [];
  const seenSnapshotKeys = new Set();

  snapshotGroups.forEach((group) => {
    if (!Array.isArray(group)) {
      return;
    }

    group.forEach((snapshot) => {
      const id = String(snapshot?.id || '').trim();
      const attr = String(snapshot?.attr || '').trim();
      const dataUrl = String(snapshot?.dataUrl || '').trim();
      if (!id || !attr || !dataUrl) {
        return;
      }

      const snapshotKey = `${id}::${attr}`;
      if (seenSnapshotKeys.has(snapshotKey)) {
        return;
      }

      seenSnapshotKeys.add(snapshotKey);
      mergedSnapshots.push({
        ...snapshot,
        id,
        attr,
        dataUrl
      });
    });
  });

  return mergedSnapshots;
}

async function requestJson(url, options = {}, timeoutMs = 15000) {
  let response;

  try {
    response = await fetchWithTimeout(url, options, timeoutMs);
  } catch (error) {
    const isAbortError = error?.name === 'AbortError' || /aborted|timeout/i.test(String(error?.message || ''));
    if (isAbortError) {
      if (options?.signal?.aborted) {
        throw new Error('当前同步已取消');
      }
      throw new Error(`请求超时，服务处理时间超过 ${Math.round(timeoutMs / 1000)} 秒`);
    }

    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

function buildCaptureStashElementId(cacheType, cacheKey) {
  return `__proto-capture-stash-${String(cacheType || 'payload')}-${String(cacheKey || '')}`;
}

function stashCapturePayload(cacheType, cacheKey, payload) {
  const root = document.documentElement || document.body;
  if (!root) {
    return 0;
  }

  const elementId = `__proto-capture-stash-${String(cacheType || 'payload')}-${String(cacheKey || '')}`;
  let element = document.getElementById(elementId);
  if (!(element instanceof HTMLScriptElement)) {
    element = document.createElement('script');
    element.id = elementId;
    element.type = 'application/json';
    element.setAttribute('data-proto-capture-stash', String(cacheType || 'payload'));
    element.style.display = 'none';
    root.appendChild(element);
  }

  element.textContent = String(payload || '');
  return element.textContent.length;
}

function readStashedCapturePayload(cacheType, cacheKey, start = 0, end = Number.MAX_SAFE_INTEGER) {
  const elementId = `__proto-capture-stash-${String(cacheType || 'payload')}-${String(cacheKey || '')}`;
  const element = document.getElementById(elementId);
  const payload = String(element?.textContent || '');
  const sliceStart = Math.max(0, Number(start) || 0);
  const sliceEnd = Math.max(sliceStart, Number.isFinite(Number(end)) ? Number(end) : payload.length);

  return {
    payloadChunk: payload.slice(sliceStart, sliceEnd),
    payloadLength: payload.length
  };
}

function readStashedHtmlChunk(cacheKey, start = 0, end = Number.MAX_SAFE_INTEGER) {
  const elementId = `__proto-capture-stash-html-${String(cacheKey || '')}`;
  const element = document.getElementById(elementId);
  const payload = String(element?.textContent || '');
  const sliceStart = Math.max(0, Number(start) || 0);
  const sliceEnd = Math.max(sliceStart, Number.isFinite(Number(end)) ? Number(end) : payload.length);

  return {
    payloadChunk: payload.slice(sliceStart, sliceEnd),
    payloadLength: payload.length
  };
}

function clearStashedCapturePayload(cacheType, cacheKey) {
  const elementId = `__proto-capture-stash-${String(cacheType || 'payload')}-${String(cacheKey || '')}`;
  const element = document.getElementById(elementId);
  if (!element) {
    return false;
  }

  element.remove();
  return true;
}

function readPageHtmlChunk(start = 0, end = Number.MAX_SAFE_INTEGER) {
  const html = document.documentElement?.outerHTML || '';
  const sliceStart = Math.max(0, Number(start) || 0);
  const sliceEnd = Math.max(sliceStart, Number.isFinite(Number(end)) ? Number(end) : html.length);

  return {
    payloadChunk: html.slice(sliceStart, sliceEnd),
    payloadLength: html.length
  };
}

async function clearCapturePayloadStash(tabId, stashKeys = {}) {
  await executePageScript(tabId, (keys) => {
    ['html', 'metadata', 'stylesheets'].forEach((cacheType) => {
      const cacheKey = String(keys?.[cacheType] || '').trim();
      if (!cacheKey) {
        return;
      }

      const element = document.getElementById(`__proto-capture-stash-${cacheType}-${cacheKey}`);
      if (element) {
        element.remove();
      }
    });
  }, [stashKeys]);
}

async function readLargeJsonPayloadFromPage(tabId, cacheType, cacheKey, payloadLength) {
  if (!payloadLength) {
    return cacheType === 'stylesheets' ? [] : {};
  }

  const MIN_CHUNK_SIZE = 120000;
  const MAX_CHUNK_COUNT = 200;
  const payloadChunkSize = Math.max(MIN_CHUNK_SIZE, Math.ceil(payloadLength / MAX_CHUNK_COUNT));
  const payloadChunkCount = Math.ceil(payloadLength / payloadChunkSize);
  const payloadChunks = [];

  for (let index = 0; index < payloadChunkCount; index += 1) {
    const chunkResult = await executePageScript(
      tabId,
      readStashedCapturePayload,
      [cacheType, cacheKey, index * payloadChunkSize, (index + 1) * payloadChunkSize]
    );
    payloadChunks.push(String(chunkResult?.payloadChunk || ''));
  }

  const payloadText = payloadChunks.join('');
  return payloadText ? JSON.parse(payloadText) : (cacheType === 'stylesheets' ? [] : {});
}

async function rehydrateChunkedCaptureMetadata(tabId, currentPageData = {}) {
  const stashKeys = {
    metadata: `metadata-enrich-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    stylesheets: `stylesheets-enrich-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  };

  try {
    const payloadSummary = await executePageScript(tabId, async (stashKeysArg) => {
      const runtimeGeneratedClassPatterns = [
        /^(?:css|r|store)-[a-z0-9_-]{4,}$/i,
        /^go\d{6,}$/i,
        /^(?:jsx|emotion|chakra|mantine|sc)-[a-z0-9_-]{4,}$/i
      ];
      const isRuntimeGeneratedClassNameLocal = (className = '') => {
        const normalized = String(className || '').trim();
        if (!normalized) {
          return false;
        }

        return runtimeGeneratedClassPatterns.some((pattern) => pattern.test(normalized));
      };
      const stashPayload = (cacheType, cacheKey, payload) => {
        const root = document.documentElement || document.body;
        if (!root || !cacheKey) {
          return 0;
        }

        const elementId = `__proto-capture-stash-${cacheType}-${cacheKey}`;
        let element = document.getElementById(elementId);
        if (!(element instanceof HTMLScriptElement)) {
          element = document.createElement('script');
          element.id = elementId;
          element.type = 'application/json';
          element.setAttribute('data-proto-capture-stash', cacheType);
          element.style.display = 'none';
          root.appendChild(element);
        }

        element.textContent = String(payload || '');
        return element.textContent.length;
      };

      const stylesheetLinks = Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).map((node) => ({
        href: node.href,
        media: node.media || 'all'
      }));
      const runtimeClassNames = new Set();
      const collectFromElement = (element) => {
        String(element?.getAttribute?.('class') || '').split(/\s+/).forEach((className) => {
          if (isRuntimeGeneratedClassNameLocal(className)) {
            runtimeClassNames.add(className);
          }
        });
      };
      collectFromElement(document.documentElement);
      Array.from(document.querySelectorAll('[class]')).forEach(collectFromElement);

      const runtimeStyleTexts = [];
      const seenCssTexts = new Set();
      let totalCssLength = 0;
      const pushCssText = (cssText) => {
        const normalizedCssText = String(cssText || '').trim();
        if (!normalizedCssText || seenCssTexts.has(normalizedCssText)) {
          return;
        }
        if (runtimeStyleTexts.length >= 80 || totalCssLength + normalizedCssText.length > 10000000) {
          return;
        }
        seenCssTexts.add(normalizedCssText);
        runtimeStyleTexts.push(normalizedCssText);
        totalCssLength += normalizedCssText.length;
      };
      const serializeStylesheetRules = (stylesheet) => {
        try {
          return Array.from(stylesheet?.cssRules || [])
            .map((rule) => rule.cssText || '')
            .filter(Boolean)
            .join('\n');
        } catch (_error) {
          return '';
        }
      };
      const collectMatchingCssRules = (rules) => {
        if (!rules?.length || !runtimeClassNames.size) {
          return '';
        }

        const collectedRules = [];
        Array.from(rules).forEach((rule) => {
          const cssText = rule?.cssText || '';
          if (!cssText) {
            return;
          }

          if (rule.cssRules?.length) {
            const nestedCssText = collectMatchingCssRules(rule.cssRules);
            if (!nestedCssText) {
              return;
            }

            if (rule.conditionText) {
              collectedRules.push(`@${rule.constructor?.name === 'CSSSupportsRule' ? 'supports' : 'media'} ${rule.conditionText}{${nestedCssText}}`);
              return;
            }

            collectedRules.push(nestedCssText);
            return;
          }

          if (Array.from(runtimeClassNames).some((className) => cssText.includes(`.${className}`))) {
            collectedRules.push(cssText);
          }
        });

        return collectedRules.join('\n');
      };

      Array.from(document.styleSheets || []).forEach((stylesheet) => {
        const ownerNode = stylesheet?.ownerNode || null;
        const tagName = ownerNode?.tagName?.toLowerCase() || '';
        const href = String(stylesheet?.href || ownerNode?.href || '').trim();
        const serializedCssText = serializeStylesheetRules(stylesheet);
        let stylesheetRules = null;
        try {
          stylesheetRules = stylesheet?.cssRules || null;
        } catch (_error) {
          stylesheetRules = null;
        }
        const matchingCssText = collectMatchingCssRules(stylesheetRules);

        if (tagName === 'style') {
          if (matchingCssText.trim()) {
            pushCssText(matchingCssText);
          }
          return;
        }

        if (href) {
          if (matchingCssText.trim()) {
            pushCssText(matchingCssText);
          }
          return;
        }

        pushCssText(serializedCssText);
        if (matchingCssText.trim()) {
          pushCssText(matchingCssText);
        }
      });

      try {
        Array.from(document.adoptedStyleSheets || []).forEach((stylesheet) => {
          let stylesheetRules = null;
          try {
            stylesheetRules = stylesheet?.cssRules || null;
          } catch (_error) {
            stylesheetRules = null;
          }
          const matchingCssText = collectMatchingCssRules(stylesheetRules);
          if (matchingCssText.trim()) {
            pushCssText(matchingCssText);
            return;
          }

          pushCssText(serializeStylesheetRules(stylesheet));
        });
      } catch (_error) {
        // ignore adopted stylesheets access failures
      }

      const originalNodes = Array.from(document.querySelectorAll('*'));
      const layoutNodeSnapshots = [];
      const scrollContainerSnapshots = [];
      const regionKeywordPattern = /(filter|search|condition|screen|toolbar|aside|sidebar|sider|float|floating|dock|suspend|suspension|anchor|helper|guide|nav|menu|tag|chip|selector|facet|panel|recommend|recommendation|combo|bundle|product|goods|item|sku|card|carousel|swiper|gallery|detail|buy|cart|price)/i;
      const parsePixelValue = (value) => {
        const parsed = Number.parseFloat(String(value || '').trim());
        return Number.isFinite(parsed) ? parsed : 0;
      };
      const getSemanticMarker = (element) => [
        element.className,
        element.id,
        element.getAttribute('role'),
        element.getAttribute('aria-label'),
        element.getAttribute('data-testid'),
        element.getAttribute('data-role'),
        element.getAttribute('data-name')
      ].filter(Boolean).join(' ');
      const isInteractiveCandidate = (element) => {
        if (!(element instanceof Element)) return false;
        if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') return false;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.pointerEvents === 'none' || computedStyle.visibility === 'hidden' || computedStyle.display === 'none') return false;
        if (
          element.matches('a[href], button, summary, label, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="link"], [data-hover-trigger], [data-clickable="true"]')
          || element.getAttribute('tabindex') !== null
        ) {
          return true;
        }
        const className = typeof element.className === 'string' ? element.className : '';
        return /btn|button|tab|menu|item|link|card|option|trigger|switch|checkbox|radio|select|dropdown/i.test(className)
          && computedStyle.cursor === 'pointer';
      };
      const measureTextLineCount = (element, computedStyle, rect) => {
        if (!(element instanceof Element)) return 0;
        const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) return 0;
        const explicitClamp = Number.parseInt(computedStyle.webkitLineClamp || '', 10);
        if (Number.isFinite(explicitClamp) && explicitClamp > 0) return explicitClamp;
        const lineHeight = parsePixelValue(computedStyle.lineHeight);
        if (lineHeight > 0 && rect.height > 0) return Math.max(1, Math.round(rect.height / lineHeight));
        const fontSize = parsePixelValue(computedStyle.fontSize);
        if (fontSize > 0 && rect.height > 0) return Math.max(1, Math.round(rect.height / (fontSize * 1.2)));
        return 1;
      };
      const isRegionRoot = (element, computedStyle) => {
        if (!(element instanceof Element)) return false;
        const semanticMarker = getSemanticMarker(element);
        if (regionKeywordPattern.test(semanticMarker)) return true;
        const rect = element.getBoundingClientRect();
        const role = element.getAttribute('role') || '';
        const className = typeof element.className === 'string' ? element.className : '';
        const semanticText = `${semanticMarker} ${className}`;
        const isFloatingRail = ['fixed', 'sticky'].includes(computedStyle.position)
          && rect.height >= 80
          && rect.width <= Math.max(window.innerWidth * 0.22, 320)
          && (rect.left <= 40 || window.innerWidth - rect.right <= 40);
        const isSearchOrSidebarRole = /search|navigation|complementary|toolbar|menu/.test(role);
        const isWideFilterBand = rect.width >= window.innerWidth * 0.55
          && rect.height >= 56
          && rect.height <= Math.max(window.innerHeight * 0.45, 220)
          && /(filter|search|condition|screen|toolbar|selector|facet|tag|chip|nav)/i.test(semanticText);
        const isSplitShell = rect.width >= window.innerWidth * 0.6
          && rect.height >= 120
          && /(layout|container|content|main|aside|sidebar|sider|panel|body|section|wrap|column|row|list|table)/i.test(semanticText);
        return isFloatingRail || isSearchOrSidebarRole || isWideFilterBand || isSplitShell;
      };
      const shouldCaptureLayoutSnapshot = (element, computedStyle, rect, options = {}) => {
        if (!(element instanceof Element) || rect.width <= 0 || rect.height <= 0) return false;
        const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
        const className = typeof element.className === 'string' ? element.className : '';
        const semanticMarker = `${getSemanticMarker(element)} ${className}`;
        const hasMeaningfulText = text.length >= 2;
        const isInteractive = isInteractiveCandidate(element);
        const isMediaNode = ['IMG', 'SVG', 'CANVAS', 'VIDEO'].includes(element.tagName);
        const isForcedRegionNode = options.forceSubtreeCapture === true;
        const hasClamp = computedStyle.webkitLineClamp && computedStyle.webkitLineClamp !== 'none';
        const parent = element.parentElement;
        const parentStyle = parent instanceof Element ? window.getComputedStyle(parent) : null;
        const display = computedStyle.display || '';
        const isFlexOrGridContainer = display.includes('flex') || display.includes('grid') || display === '-webkit-box';
        const isFlexOrGridItem = !!(parentStyle && (parentStyle.display.includes('flex') || parentStyle.display.includes('grid') || parentStyle.display === '-webkit-box'));
        const isTableLike = /table|row|cell|thead|tbody|tr|td|th|col|grid|list/.test(display)
          || /table|list|row|cell|column|thead|tbody|header|body/.test(semanticMarker);
        const hasScrollLayout = computedStyle.overflowX !== 'visible'
          || computedStyle.overflowY !== 'visible'
          || element.scrollWidth > element.clientWidth + 1
          || element.scrollHeight > element.clientHeight + 1;
        const isSplitLayoutCandidate = rect.width >= Math.max(window.innerWidth * 0.18, 220)
          && rect.height >= 40
          && /(aside|sidebar|sider|panel|main|content|body|layout|wrap|container|section|rail|column|filter|toolbar|search|result|list)/i.test(semanticMarker);
        const isTextLayoutCandidate = hasMeaningfulText && (
          rect.height >= parsePixelValue(computedStyle.fontSize) * 1.4
          || computedStyle.whiteSpace !== 'nowrap'
          || computedStyle.textOverflow !== 'clip'
          || display === '-webkit-box'
          || hasClamp
        );
        const isSemanticContainer = /(table|list|row|cell|column|header|body|wrapper|wrap|layout|container|content|main|aside|sidebar|sider|panel|toolbar|filter|search|result|card|rail|shell|section)/i.test(semanticMarker);
        const childCount = element.childElementCount || 0;
        const hasMultipleChildren = childCount >= 2;
        const hasMeaningfulArea = rect.width >= 120 || rect.height >= 32;
        const hasMeasuredColumnWidths = childCount >= 3 && rect.width >= Math.max(window.innerWidth * 0.28, 280);
        const isContainerSkeleton = hasMeaningfulArea && ((hasMultipleChildren && (isSemanticContainer || isFlexOrGridContainer || isTableLike || hasScrollLayout)) || hasMeasuredColumnWidths);
        return isForcedRegionNode || isInteractive || isMediaNode || isTextLayoutCandidate || isFlexOrGridContainer || isFlexOrGridItem || isTableLike || hasScrollLayout || isSplitLayoutCandidate || isContainerSkeleton;
      };
      const buildLayoutSnapshot = (element, computedStyle, rect) => {
        const parentRect = element.parentElement instanceof Element ? element.parentElement.getBoundingClientRect() : null;
        const parentComputedStyle = element.parentElement instanceof Element ? window.getComputedStyle(element.parentElement) : null;
        const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
        const className = typeof element.className === 'string' ? element.className : '';
        const semanticMarker = `${getSemanticMarker(element)} ${className}`;
        const lineCount = measureTextLineCount(element, computedStyle, rect);
        const hasMeaningfulText = text.length >= 2;
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        const parentWidth = parentRect ? Math.round(parentRect.width) : 0;
        const widthRatio = parentWidth > 0 ? Number((width / parentWidth).toFixed(4)) : 0;
        const isButtonLike = isInteractiveCandidate(element) || element.matches('button, [role="button"], a[href], [role="link"]');
        const explicitClamp = Number.parseInt(computedStyle.webkitLineClamp || '', 10);
        const display = computedStyle.display || '';
        const isContainerLike = display.includes('flex') || display.includes('grid') || display === '-webkit-box'
          || /(wrap|layout|container|content|panel|toolbar|filter|search|list|grid|table|body|main|aside|sidebar|sider|section|column|row)/i.test(semanticMarker);
        const isTableLike = /table|row|cell|thead|tbody|tr|td|th|col/.test(display)
          || /(table|thead|tbody|row|cell|column|header|body|list)/i.test(semanticMarker);
        return {
          width,
          height,
          parentWidth,
          widthRatio,
          lineCount,
          isText: hasMeaningfulText,
          isMultilineText: hasMeaningfulText && lineCount >= 2,
          isButtonLike,
          isContainerLike,
          isTableLike,
          whiteSpace: computedStyle.whiteSpace || '',
          textOverflow: computedStyle.textOverflow || '',
          clamp: Number.isFinite(explicitClamp) && explicitClamp > 0 ? explicitClamp : 0,
          display,
          parentDisplay: parentComputedStyle?.display || '',
          flexDirection: computedStyle.flexDirection || '',
          flexWrap: computedStyle.flexWrap || '',
          justifyContent: computedStyle.justifyContent || '',
          alignItems: computedStyle.alignItems || '',
          alignContent: computedStyle.alignContent || '',
          alignSelf: computedStyle.alignSelf || '',
          flexBasis: computedStyle.flexBasis || '',
          flexGrow: computedStyle.flexGrow || '',
          flexShrink: computedStyle.flexShrink || '',
          order: computedStyle.order || '',
          gridTemplateColumns: computedStyle.gridTemplateColumns || '',
          gridTemplateRows: computedStyle.gridTemplateRows || '',
          gridAutoFlow: computedStyle.gridAutoFlow || '',
          gridColumn: computedStyle.gridColumn || '',
          gridRow: computedStyle.gridRow || '',
          gap: computedStyle.gap || '',
          rowGap: computedStyle.rowGap || '',
          columnGap: computedStyle.columnGap || '',
          minWidth: computedStyle.minWidth || '',
          maxWidth: computedStyle.maxWidth || '',
          minHeight: computedStyle.minHeight || '',
          maxHeight: computedStyle.maxHeight || '',
          overflowX: computedStyle.overflowX || '',
          overflowY: computedStyle.overflowY || '',
          tableLayout: computedStyle.tableLayout || '',
          borderCollapse: computedStyle.borderCollapse || ''
        };
      };

      const forcedRegionRoots = originalNodes.filter((node) => node instanceof Element && isRegionRoot(node, window.getComputedStyle(node)));
      const forcedRegionNodes = new WeakSet();
      forcedRegionRoots.forEach((root) => {
        forcedRegionNodes.add(root);
        root.querySelectorAll('*').forEach((child) => forcedRegionNodes.add(child));
      });

      originalNodes.forEach((node, index) => {
        if (!(node instanceof Element)) {
          return;
        }

        const rect = node.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(node);
        const forceSubtreeCapture = forcedRegionNodes.has(node);
        let restoreNodeId = node.getAttribute('data-restore-node-id') || `restore-node-enrich-${index}`;
        if (shouldCaptureLayoutSnapshot(node, computedStyle, rect, { forceSubtreeCapture })) {
          node.setAttribute('data-restore-node-id', restoreNodeId);
          layoutNodeSnapshots.push({ id: restoreNodeId, ...buildLayoutSnapshot(node, computedStyle, rect) });
        }

        const hasScrollableState = node.scrollTop > 0
          || node.scrollLeft > 0
          || node.scrollHeight > node.clientHeight + 1
          || node.scrollWidth > node.clientWidth + 1;
        if (hasScrollableState) {
          node.setAttribute('data-restore-node-id', restoreNodeId);
          scrollContainerSnapshots.push({
            id: restoreNodeId,
            scrollTop: Math.round(node.scrollTop || 0),
            scrollLeft: Math.round(node.scrollLeft || 0),
            clientWidth: Math.round(node.clientWidth || 0),
            clientHeight: Math.round(node.clientHeight || 0),
            scrollWidth: Math.round(node.scrollWidth || 0),
            scrollHeight: Math.round(node.scrollHeight || 0),
            overflowX: computedStyle.overflowX || '',
            overflowY: computedStyle.overflowY || ''
          });
        }
      });

      const metadataPack = {
        capturedAt: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          scrollTop: Math.round(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0),
          scrollLeft: Math.round(window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0)
        },
        stylesheetCount: stylesheetLinks.length,
        capturedStylesheetCount: 0,
        runtimeStyleTextCount: runtimeStyleTexts.length,
        runtimeStyleTexts,
        layoutNodeSnapshots,
        scrollContainerSnapshots,
        chunkedCapture: true,
        fallbackCapture: false
      };

      const metaJson = JSON.stringify(metadataPack);
      const sheetsJson = JSON.stringify(stylesheetLinks);
      if (stashKeysArg?.metadata) {
        stashPayload('metadata', stashKeysArg.metadata, metaJson);
      }
      if (stashKeysArg?.stylesheets) {
        stashPayload('stylesheets', stashKeysArg.stylesheets, sheetsJson);
      }

      return {
        ok: true,
        url: window.location.href,
        metadataLength: metaJson.length,
        stylesheetsLength: sheetsJson.length
      };
    }, [stashKeys]);
    if (!payloadSummary?.ok) {
      throw new Error('chunked metadata enrichment payload summary missing');
    }

    const enrichedMetadata = await readLargeJsonPayloadFromPage(
      tabId,
      'metadata',
      stashKeys.metadata,
      payloadSummary.metadataLength || 0
    );
    const enrichedStylesheets = await readLargeJsonPayloadFromPage(
      tabId,
      'stylesheets',
      stashKeys.stylesheets,
      payloadSummary.stylesheetsLength || 0
    );

    console.info('[proto-capture] chunked metadata enrichment counts', {
      layoutNodeSnapshots: Array.isArray(enrichedMetadata?.layoutNodeSnapshots) ? enrichedMetadata.layoutNodeSnapshots.length : 0,
      scrollContainerSnapshots: Array.isArray(enrichedMetadata?.scrollContainerSnapshots) ? enrichedMetadata.scrollContainerSnapshots.length : 0,
      runtimeStyleTextCount: enrichedMetadata?.runtimeStyleTextCount || 0,
      stylesheetsCount: Array.isArray(enrichedStylesheets) ? enrichedStylesheets.length : 0
    });

    return {
      ...currentPageData,
      stylesheets: Array.isArray(enrichedStylesheets) && enrichedStylesheets.length
        ? enrichedStylesheets
        : (Array.isArray(currentPageData?.stylesheets) ? currentPageData.stylesheets : []),
      metadata: {
        ...(currentPageData?.metadata || {}),
        ...(enrichedMetadata || {}),
        chunkedCapture: true,
        fallbackCapture: currentPageData?.metadata?.fallbackCapture === true
      }
    };
  } finally {
    await clearCapturePayloadStash(tabId, stashKeys);
  }
}

function buildChunkedMetadataPack() {
  const stylesheetLinks = Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).map((node) => ({
    href: node.href,
    media: node.media || 'all'
  }));

  return {
    capturedAt: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    document: {
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scrollTop: Math.round(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0),
      scrollLeft: Math.round(window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0)
    },
    stylesheetCount: stylesheetLinks.length,
    capturedStylesheetCount: 0,
    runtimeStyleTextCount: 0,
    runtimeStyleTexts: [],
    chunkedCapture: true,
    lightweightFallback: true,
    stylesheets: stylesheetLinks
  };
}

async function collectPagePayload(options = {}) {
  const runtimeGeneratedClassPatterns = [
    /^(?:css|r|store)-[a-z0-9_-]{4,}$/i,
    /^go\d{6,}$/i,
    /^(?:jsx|emotion|chakra|mantine|sc)-[a-z0-9_-]{4,}$/i
  ];
  const isRuntimeGeneratedClassNameLocal = (className = '') => {
    const normalized = String(className || '').trim();
    if (!normalized) {
      return false;
    }

    return runtimeGeneratedClassPatterns.some((pattern) => pattern.test(normalized));
  };

  function serializeStylesheetRules(stylesheet) {
    try {
      return Array.from(stylesheet?.cssRules || [])
        .map((rule) => rule.cssText || '')
        .filter(Boolean)
        .join('\n');
    } catch (error) {
      return '';
    }
  }

  function extractRuntimeGeneratedClassNames(rootElement) {
    const classNames = new Set();
    const collectFromElement = (element) => {
      String(element?.getAttribute?.('class') || '')
        .split(/\s+/)
        .map((value) => value.trim())
        .filter((value) => isRuntimeGeneratedClassNameLocal(value))
        .forEach((value) => classNames.add(value));
    };

    collectFromElement(rootElement);
    Array.from(rootElement?.querySelectorAll?.('[class]') || []).forEach(collectFromElement);
    return classNames;
  }

  function collectMatchingCssRules(rules, targetClassNames) {
    if (!rules?.length || !targetClassNames?.size) {
      return '';
    }

    const collectedRules = [];
    const matchesTargetClass = (cssText) => Array.from(targetClassNames).some((className) => cssText.includes(`.${className}`));

    Array.from(rules).forEach((rule) => {
      const cssText = rule?.cssText || '';
      if (!cssText) {
        return;
      }

      if (rule.cssRules?.length) {
        const nestedCssText = collectMatchingCssRules(rule.cssRules, targetClassNames);
        if (!nestedCssText) {
          return;
        }

        if (rule.conditionText) {
          collectedRules.push(`@${rule.constructor?.name === 'CSSSupportsRule' ? 'supports' : 'media'} ${rule.conditionText}{${nestedCssText}}`);
          return;
        }

        collectedRules.push(nestedCssText);
        return;
      }

      if (matchesTargetClass(cssText)) {
        collectedRules.push(cssText);
      }
    });

    return collectedRules.join('\n');
  }

  function collectRuntimeStyleTexts(targetClassNames = new Set()) {
    const runtimeCssBlocks = [];
    const seenCssTexts = new Set();
    let totalCssLength = 0;
    const MAX_RUNTIME_STYLE_TEXTS = 80;
    const MAX_RUNTIME_STYLE_LENGTH = 10000000; // 10MB to accommodate large stylesheets
    const normalizeCssText = (cssText) => String(cssText || '').replace(/\s+/g, ' ').trim();
    const pushCssText = (cssText) => {
      const normalizedCssText = String(cssText || '').trim();
      if (!normalizedCssText || seenCssTexts.has(normalizedCssText)) {
        return;
      }

      if (runtimeCssBlocks.length >= MAX_RUNTIME_STYLE_TEXTS) {
        return;
      }

      if (totalCssLength + normalizedCssText.length > MAX_RUNTIME_STYLE_LENGTH) {
        return;
      }

      seenCssTexts.add(normalizedCssText);
      runtimeCssBlocks.push(normalizedCssText);
      totalCssLength += normalizedCssText.length;
    };

    Array.from(document.styleSheets || []).forEach((stylesheet) => {
      const ownerNode = stylesheet?.ownerNode || null;
      const tagName = ownerNode?.tagName?.toLowerCase() || '';
      const href = String(stylesheet?.href || ownerNode?.href || '').trim();
      const inlineCssText = String(ownerNode?.textContent || '').trim();

      const serializedCssText = serializeStylesheetRules(stylesheet);
      const matchingCssText = collectMatchingCssRules(stylesheet?.cssRules, targetClassNames);
      const normalizedSerializedCssText = normalizeCssText(serializedCssText);

      if (tagName === 'style') {
        if (matchingCssText.trim()) {
          pushCssText(matchingCssText);
        }
        if (inlineCssText.trim() && inlineCssText.length <= 200000) {
          pushCssText(inlineCssText);
        } else if (serializedCssText.trim() && serializedCssText.length <= 200000) {
          pushCssText(serializedCssText);
        }
        return;
      }

      if (href) {
        if (matchingCssText.trim()) {
          pushCssText(matchingCssText);
        }
        return;
      }

      pushCssText(serializedCssText);
      if (matchingCssText.trim() && !normalizedSerializedCssText.includes(normalizeCssText(matchingCssText))) {
        pushCssText(matchingCssText);
      }
    });

    Array.from(document.adoptedStyleSheets || []).forEach((stylesheet) => {
      const matchingCssText = collectMatchingCssRules(stylesheet?.cssRules, targetClassNames);
      if (matchingCssText.trim()) {
        pushCssText(matchingCssText);
        return;
      }

      pushCssText(serializeStylesheetRules(stylesheet));
    });

    if (!runtimeCssBlocks.length) {
      Array.from(document.querySelectorAll('style')).forEach((styleNode) => {
        const cssText = String(styleNode?.textContent || '').trim();
        if (cssText.length <= 200000) {
          pushCssText(cssText);
        }
      });
    }

    if (!runtimeCssBlocks.length) {
      const inlineStyleRules = Array.from(document.querySelectorAll('[style]'))
        .slice(0, 240)
        .map((element) => {
          const inlineStyle = String(element.getAttribute('style') || '').trim();
          if (!inlineStyle) {
            return '';
          }

          const tagName = String(element.tagName || 'div').toLowerCase();
          const idSelector = element.id ? `#${element.id}` : '';
          const classSelector = String(element.className || '').trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .map((className) => `.${className}`)
            .join('');
          return `${tagName}${idSelector}${classSelector}{${inlineStyle}}`;
        })
        .filter(Boolean)
        .join('\n');
      pushCssText(inlineStyleRules);
    }

    return runtimeCssBlocks;
  }

  async function collectBrowserStylesheetPayloads(stylesheetLinks) {
    const collectedStylesheets = [];
    const seenHrefs = new Set();

    for (const stylesheet of Array.from(stylesheetLinks || [])) {
      const href = String(stylesheet?.href || '').trim();
      if (!href || seenHrefs.has(href)) {
        continue;
      }

      seenHrefs.add(href);

      try {
        const response = await fetch(href, {
          credentials: 'include',
          cache: 'force-cache'
        });

        if (!response.ok) {
          continue;
        }

        const cssText = await response.text();
        if (!String(cssText || '').trim()) {
          continue;
        }

        collectedStylesheets.push({
          href,
          media: stylesheet?.media || 'all',
          cssText
        });
      } catch (error) {
      }
    }

    return collectedStylesheets;
  }

  const stylesheetLinks = Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).map((node) => ({
    href: node.href,
    media: node.media || 'all'
  }));
  const capturedStylesheets = await collectBrowserStylesheetPayloads(stylesheetLinks);
  const ROOT_STYLE_PROPERTIES = [
    'color',
    'background',
    'background-color',
    'background-image',
    'background-position',
    'background-repeat',
    'background-size',
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
    'text-rendering',
    '-webkit-font-smoothing',
    'cursor',
    'user-select',
    'pointer-events',
    'transition',
    'transition-property',
    'transition-duration',
    'transition-delay',
    'transition-timing-function',
    'animation',
    'animation-name',
    'animation-duration',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
    'animation-timing-function',
    'will-change',
    'min-width',
    'width',
    'height',
    'margin',
    'padding',
    'overflow',
    'overflow-x',
    'overflow-y'
  ];
  const FALLBACK_STYLE_PROPERTIES = [
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'z-index',
    'box-sizing',
    'order',
    'width',
    'min-width',
    'max-width',
    'height',
    'min-height',
    'max-height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'flex',
    'flex-direction',
    'flex-wrap',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'justify-content',
    'justify-items',
    'justify-self',
    'align-items',
    'align-content',
    'align-self',
    'place-content',
    'place-items',
    'place-self',
    'gap',
    'row-gap',
    'column-gap',
    'grid',
    'grid-template',
    'grid-template-columns',
    'grid-template-rows',
    'grid-column',
    'grid-row',
    'grid-auto-flow',
    'grid-auto-columns',
    'grid-auto-rows',
    'overflow',
    'overflow-x',
    'overflow-y',
    'overflow-wrap',
    'white-space',
    'text-overflow',
    'word-break',
    'word-spacing',
    'hyphens',
    'text-align',
    'text-transform',
    'text-decoration',
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-color',
    'text-indent',
    'vertical-align',
    'writing-mode',
    '-webkit-line-clamp',
    '-webkit-box-orient',
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
    'text-rendering',
    '-webkit-font-smoothing',
    'color',
    '-webkit-text-fill-color',
    '-webkit-text-stroke-color',
    '-webkit-text-stroke-width',
    'background',
    'background-color',
    'background-image',
    'background-position',
    'background-repeat',
    'background-size',
    'background-clip',
    'object-fit',
    'object-position',
    'aspect-ratio',
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-width',
    'border-style',
    'border-color',
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
    'border-top-style',
    'border-right-style',
    'border-bottom-style',
    'border-left-style',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'border-radius',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
    'outline',
    'outline-offset',
    'box-shadow',
    'opacity',
    'visibility',
    'cursor',
    'appearance',
    'pointer-events',
    'user-select',
    'transform',
    'transform-origin',
    'transform-style',
    'perspective',
    'perspective-origin',
    'filter',
    'backdrop-filter',
    'clip-path',
    'mask-image',
    'mask-size',
    'mask-repeat',
    'mask-position',
    'transition',
    'transition-property',
    'transition-duration',
    'transition-delay',
    'transition-timing-function',
    'animation',
    'animation-name',
    'animation-duration',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
    'animation-timing-function',
    'will-change'
  ];
  const INTERACTIVE_VISUAL_STYLE_PROPERTIES = new Set([
    'color',
    '-webkit-text-fill-color',
    '-webkit-text-stroke-color',
    '-webkit-text-stroke-width',
    'background',
    'background-color',
    'background-image',
    'background-position',
    'background-repeat',
    'background-size',
    'background-clip',
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-radius',
    'outline',
    'outline-offset',
    'box-shadow',
    'opacity',
    'transform',
    'transform-origin',
    'transform-style',
    'perspective',
    'perspective-origin',
    'filter',
    'backdrop-filter',
    'clip-path',
    'mask-image',
    'mask-size',
    'mask-repeat',
    'mask-position',
    'cursor',
    'pointer-events',
    'user-select',
    'transition',
    'transition-property',
    'transition-duration',
    'transition-delay',
    'transition-timing-function',
    'animation',
    'animation-name',
    'animation-duration',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
    'animation-timing-function',
    'will-change'
  ]);
  const INTERACTIVE_FALLBACK_STYLE_PROPERTIES = FALLBACK_STYLE_PROPERTIES.filter((property) => !INTERACTIVE_VISUAL_STYLE_PROPERTIES.has(property));
  const PSEUDO_STYLE_PROPERTIES = [
    'content',
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'z-index',
    'width',
    'min-width',
    'max-width',
    'height',
    'min-height',
    'max-height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-radius',
    'box-shadow',
    'background',
    'background-color',
    'background-image',
    'background-position',
    'background-repeat',
    'background-size',
    'opacity',
    'visibility',
    'transform',
    'transform-origin',
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
    'color',
    '-webkit-text-fill-color',
    '-webkit-text-stroke-color',
    '-webkit-text-stroke-width',
    'white-space',
    'text-align',
    'opacity',
    'filter',
    'backdrop-filter',
    'clip-path',
    'mask-image',
    'mask-size',
    'mask-repeat',
    'mask-position',
    'transition',
    'transition-property',
    'transition-duration',
    'transition-delay',
    'transition-timing-function',
    'animation',
    'animation-name',
    'animation-duration',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
    'animation-timing-function'
  ];
  const REGION_KEYWORD_PATTERN = /(filter|search|condition|screen|toolbar|aside|sidebar|sider|float|floating|dock|suspend|suspension|anchor|helper|guide|nav|menu|tag|chip|selector|facet|panel|recommend|recommendation|combo|bundle|product|goods|item|sku|card|carousel|swiper|gallery|detail|buy|cart|price)/i;
  const HTML_BOOLEAN_ATTRIBUTES = new Set(['hidden', 'disabled', 'checked', 'selected', 'readonly', 'multiple', 'open']);
  const originalRoot = document.documentElement;
  const clonedRoot = originalRoot.cloneNode(true);
  const runtimeGeneratedClassNames = extractRuntimeGeneratedClassNames(clonedRoot);
  const runtimeStyleTexts = collectRuntimeStyleTexts(runtimeGeneratedClassNames);
  const originalNodes = [originalRoot, ...originalRoot.querySelectorAll('*')];
  const clonedNodes = [clonedRoot, ...clonedRoot.querySelectorAll('*')];
  const originalNodeIndexMap = new Map(originalNodes.map((node, index) => [node, index]));

  const copyAttributes = (element) => {
    const attributes = {};
    Array.from(element.attributes || []).forEach((attribute) => {
      if (/^on/i.test(attribute.name)) {
        return;
      }

      if (HTML_BOOLEAN_ATTRIBUTES.has(attribute.name)) {
        attributes[attribute.name] = true;
        return;
      }

      attributes[attribute.name] = attribute.value;
    });
    return attributes;
  };
  const serializeStyleProperties = (computedStyle, properties) => {
    const declarations = [];

    properties.forEach((property) => {
      const value = computedStyle.getPropertyValue(property);
      if (!value || !String(value).trim()) {
        return;
      }

      declarations.push(`${property}:${String(value).trim()}`);
    });

    Array.from(computedStyle).forEach((property) => {
      if (!property.startsWith('--')) {
        return;
      }

      const value = computedStyle.getPropertyValue(property);
      if (!value || !String(value).trim()) {
        return;
      }

      declarations.push(`${property}:${String(value).trim()}`);
    });

    return declarations.join(';');
  };
  const parsePixelValue = (value) => {
    const parsed = Number.parseFloat(String(value || '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const measureTextLineCount = (element, computedStyle, rect) => {
    if (!(element instanceof Element)) {
      return 0;
    }

    const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return 0;
    }

    const explicitClamp = Number.parseInt(computedStyle.webkitLineClamp || '', 10);
    if (Number.isFinite(explicitClamp) && explicitClamp > 0) {
      return explicitClamp;
    }

    const lineHeight = parsePixelValue(computedStyle.lineHeight);
    if (lineHeight > 0 && rect.height > 0) {
      return Math.max(1, Math.round(rect.height / lineHeight));
    }

    const fontSize = parsePixelValue(computedStyle.fontSize);
    if (fontSize > 0 && rect.height > 0) {
      return Math.max(1, Math.round(rect.height / (fontSize * 1.2)));
    }

    return 1;
  };
  const shouldCaptureLayoutSnapshot = (element, computedStyle, rect, options = {}) => {
    if (!(element instanceof Element) || rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
    const className = typeof element.className === 'string' ? element.className : '';
    const semanticMarker = `${getSemanticMarker(element)} ${className}`;
    const hasMeaningfulText = text.length >= 2;
    const isInteractive = isInteractiveCandidate(element);
    const isMediaNode = ['IMG', 'SVG', 'CANVAS', 'VIDEO'].includes(element.tagName);
    const isForcedRegionNode = options.forceSubtreeCapture === true;
    const hasClamp = computedStyle.webkitLineClamp && computedStyle.webkitLineClamp !== 'none';
    const parent = element.parentElement;
    const parentStyle = parent instanceof Element ? window.getComputedStyle(parent) : null;
    const display = computedStyle.display || '';
    const isFlexOrGridContainer = display.includes('flex') || display.includes('grid') || display === '-webkit-box';
    const isFlexOrGridItem = !!(parentStyle && (parentStyle.display.includes('flex') || parentStyle.display.includes('grid') || parentStyle.display === '-webkit-box'));
    const isTableLike = /table|row|cell|thead|tbody|tr|td|th|col|grid|list/.test(display)
      || /table|list|row|cell|column|thead|tbody|header|body/.test(semanticMarker);
    const hasScrollLayout = computedStyle.overflowX !== 'visible'
      || computedStyle.overflowY !== 'visible'
      || element.scrollWidth > element.clientWidth + 1
      || element.scrollHeight > element.clientHeight + 1;
    const isSplitLayoutCandidate = rect.width >= Math.max(window.innerWidth * 0.18, 220)
      && rect.height >= 40
      && /(aside|sidebar|sider|panel|main|content|body|layout|wrap|container|section|rail|column|filter|toolbar|search|result|list)/i.test(semanticMarker);
    const isTextLayoutCandidate = hasMeaningfulText && (
      rect.height >= parsePixelValue(computedStyle.fontSize) * 1.4
      || computedStyle.whiteSpace !== 'nowrap'
      || computedStyle.textOverflow !== 'clip'
      || display === '-webkit-box'
      || hasClamp
    );
    const isSemanticContainer = /(table|list|row|cell|column|header|body|wrapper|wrap|layout|container|content|main|aside|sidebar|sider|panel|toolbar|filter|search|result|card|rail|shell|section)/i.test(semanticMarker);
    const childCount = element.childElementCount || 0;
    const hasMultipleChildren = childCount >= 2;
    const hasMeaningfulArea = rect.width >= 120 || rect.height >= 32;
    const hasMeasuredColumnWidths = childCount >= 3 && rect.width >= Math.max(window.innerWidth * 0.28, 280);
    const isContainerSkeleton = hasMeaningfulArea && (
      (hasMultipleChildren && (isSemanticContainer || isFlexOrGridContainer || isTableLike || hasScrollLayout))
      || hasMeasuredColumnWidths
    );

    return isForcedRegionNode
      || isInteractive
      || isMediaNode
      || isTextLayoutCandidate
      || isFlexOrGridContainer
      || isFlexOrGridItem
      || isTableLike
      || hasScrollLayout
      || isSplitLayoutCandidate
      || isContainerSkeleton;
  };
  const buildLayoutSnapshot = (element, computedStyle, rect) => {
    const parentRect = element.parentElement instanceof Element
      ? element.parentElement.getBoundingClientRect()
      : null;
    const parentComputedStyle = element.parentElement instanceof Element
      ? window.getComputedStyle(element.parentElement)
      : null;
    const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
    const className = typeof element.className === 'string' ? element.className : '';
    const semanticMarker = `${getSemanticMarker(element)} ${className}`;
    const lineCount = measureTextLineCount(element, computedStyle, rect);
    const hasMeaningfulText = text.length >= 2;
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    const parentWidth = parentRect ? Math.round(parentRect.width) : 0;
    const widthRatio = parentWidth > 0 ? Number((width / parentWidth).toFixed(4)) : 0;
    const isButtonLike = isInteractiveCandidate(element) || element.matches('button, [role="button"], a[href], [role="link"]');
    const explicitClamp = Number.parseInt(computedStyle.webkitLineClamp || '', 10);
    const display = computedStyle.display || '';
    const isContainerLike = display.includes('flex')
      || display.includes('grid')
      || display === '-webkit-box'
      || /(wrap|layout|container|content|panel|toolbar|filter|search|list|grid|table|body|main|aside|sidebar|sider|section|column|row)/i.test(semanticMarker);
    const isTableLike = /table|row|cell|thead|tbody|tr|td|th|col/.test(display)
      || /(table|thead|tbody|row|cell|column|header|body|list)/i.test(semanticMarker);

    return {
      width,
      height,
      parentWidth,
      widthRatio,
      lineCount,
      isText: hasMeaningfulText,
      isMultilineText: hasMeaningfulText && lineCount >= 2,
      isButtonLike,
      isContainerLike,
      isTableLike,
      whiteSpace: computedStyle.whiteSpace || '',
      textOverflow: computedStyle.textOverflow || '',
      clamp: Number.isFinite(explicitClamp) && explicitClamp > 0 ? explicitClamp : 0,
      display,
      parentDisplay: parentComputedStyle?.display || '',
      flexDirection: computedStyle.flexDirection || '',
      flexWrap: computedStyle.flexWrap || '',
      justifyContent: computedStyle.justifyContent || '',
      alignItems: computedStyle.alignItems || '',
      alignContent: computedStyle.alignContent || '',
      alignSelf: computedStyle.alignSelf || '',
      flexBasis: computedStyle.flexBasis || '',
      flexGrow: computedStyle.flexGrow || '',
      flexShrink: computedStyle.flexShrink || '',
      order: computedStyle.order || '',
      gridTemplateColumns: computedStyle.gridTemplateColumns || '',
      gridTemplateRows: computedStyle.gridTemplateRows || '',
      gridAutoFlow: computedStyle.gridAutoFlow || '',
      gridColumn: computedStyle.gridColumn || '',
      gridRow: computedStyle.gridRow || '',
      gap: computedStyle.gap || '',
      rowGap: computedStyle.rowGap || '',
      columnGap: computedStyle.columnGap || '',
      minWidth: computedStyle.minWidth || '',
      maxWidth: computedStyle.maxWidth || '',
      minHeight: computedStyle.minHeight || '',
      maxHeight: computedStyle.maxHeight || '',
      overflowX: computedStyle.overflowX || '',
      overflowY: computedStyle.overflowY || '',
      tableLayout: computedStyle.tableLayout || '',
      borderCollapse: computedStyle.borderCollapse || ''
    };
  };
  const getSemanticMarker = (element) => [
    element.className,
    element.id,
    element.getAttribute('role'),
    element.getAttribute('aria-label'),
    element.getAttribute('data-testid'),
    element.getAttribute('data-role'),
    element.getAttribute('data-name')
  ]
    .filter(Boolean)
    .join(' ');
  const isRegionRoot = (element, computedStyle) => {
    if (!(element instanceof Element)) {
      return false;
    }

    const semanticMarker = getSemanticMarker(element);
    if (REGION_KEYWORD_PATTERN.test(semanticMarker)) {
      return true;
    }

    const rect = element.getBoundingClientRect();
    const role = element.getAttribute('role') || '';
    const className = typeof element.className === 'string' ? element.className : '';
    const semanticText = `${semanticMarker} ${className}`;
    const isFloatingRail = ['fixed', 'sticky'].includes(computedStyle.position)
      && rect.height >= 80
      && rect.width <= Math.max(window.innerWidth * 0.22, 320)
      && (rect.left <= 40 || window.innerWidth - rect.right <= 40);
    const isSearchOrSidebarRole = /search|navigation|complementary|toolbar|menu/.test(role);
    const isWideFilterBand = rect.width >= window.innerWidth * 0.55
      && rect.height >= 56
      && rect.height <= Math.max(window.innerHeight * 0.45, 220)
      && /(filter|search|condition|screen|toolbar|selector|facet|tag|chip|nav)/i.test(semanticText);
    const isSplitShell = rect.width >= window.innerWidth * 0.6
      && rect.height >= 120
      && /(layout|container|content|main|aside|sidebar|sider|panel|body|section|wrap|column|row|list|table)/i.test(semanticText);

    return isFloatingRail || isSearchOrSidebarRole || isWideFilterBand || isSplitShell;
  };
  const hasRuntimeGeneratedClass = (element) => {
    const className = typeof element?.className === 'string' ? element.className : '';
    return String(className)
      .split(/\s+/)
      .some((value) => isRuntimeGeneratedClassNameLocal(value));
  };
  const shouldCaptureFallback = (element, computedStyle, options = {}) => {
    if (!element || element.tagName === 'SCRIPT' || element.tagName === 'NOSCRIPT' || element.tagName === 'STYLE') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const className = typeof element.className === 'string' ? element.className : '';
    const textContent = (element.textContent || '').trim();
    const hasSemanticText = textContent.length > 0;
    const isButtonLikeNode = ['BUTTON', 'A'].includes(element.tagName)
      || element.getAttribute('role') === 'button'
      || /(btn|button|cta|buy|cart|submit|action)/i.test(className);
    const isCommerceTextNode = hasSemanticText
      && /(title|heading|subtitle|price|amount|product|goods|sku|item|recommend|combo|bundle|buy|cart)/i.test(className);
    const hasComplexLayout = computedStyle.display.includes('flex')
      || computedStyle.display.includes('grid')
      || computedStyle.display === '-webkit-box'
      || ['fixed', 'sticky', 'absolute'].includes(computedStyle.position)
      || computedStyle.transform !== 'none'
      || computedStyle.filter !== 'none'
      || computedStyle.backdropFilter !== 'none'
      || computedStyle.backgroundImage !== 'none'
      || computedStyle.boxShadow !== 'none'
      || computedStyle.borderRadius !== '0px'
      || computedStyle.overflowX !== 'visible'
      || computedStyle.overflowY !== 'visible'
      || computedStyle.webkitLineClamp !== 'none'
      || computedStyle.textOverflow !== 'clip'
      || /(header|footer|sidebar|content|layout|wrap|panel|card|table|list|grid|tabs|modal|drawer|dialog|form|search|filter|banner|nav|recommend|combo|bundle|product|goods|sku|item|carousel|swiper|buy|cart|price)/i.test(className);
    const isMediaNode = ['IMG', 'SVG', 'CANVAS', 'VIDEO'].includes(element.tagName);
    const hasVisualDecoration = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
      || computedStyle.borderTopWidth !== '0px'
      || computedStyle.borderRightWidth !== '0px'
      || computedStyle.borderBottomWidth !== '0px'
      || computedStyle.borderLeftWidth !== '0px'
      || computedStyle.color !== 'rgb(0, 0, 0)';
    const hasTextStyling = hasSemanticText && (
      computedStyle.fontWeight !== '400'
      || computedStyle.fontSize !== '16px'
      || computedStyle.lineHeight !== 'normal'
      || computedStyle.letterSpacing !== 'normal'
      || computedStyle.color !== 'rgb(0, 0, 0)'
      || computedStyle.textTransform !== 'none'
      || computedStyle.textDecorationLine !== 'none'
      || computedStyle.whiteSpace !== 'normal'
    );
    const isRuntimeGeneratedNode = hasRuntimeGeneratedClass(element);

    if (options.forceSubtreeCapture) {
      return hasComplexLayout
        || isMediaNode
        || hasSemanticText
        || hasVisualDecoration
        || hasTextStyling
        || isButtonLikeNode
        || isCommerceTextNode
        || isRuntimeGeneratedNode;
    }

    return hasComplexLayout
      || isMediaNode
      || isButtonLikeNode
      || isCommerceTextNode
      || (hasSemanticText && (hasVisualDecoration || hasTextStyling))
      || (isRuntimeGeneratedNode && (hasSemanticText || hasVisualDecoration));
  };
  const shouldCapturePseudo = (element, pseudoStyle, pseudo) => {
    if (!pseudoStyle) {
      return false;
    }

    if (pseudo === '::placeholder') {
      const placeholderText = element.getAttribute('placeholder') || '';
      if (!placeholderText) {
        return false;
      }
      return true;
    }

    const content = String(pseudoStyle.getPropertyValue('content') || '').trim();
    const display = pseudoStyle.getPropertyValue('display');
    const visibility = pseudoStyle.getPropertyValue('visibility');
    const opacity = Number.parseFloat(pseudoStyle.getPropertyValue('opacity') || '1');
    const width = Number.parseFloat(pseudoStyle.getPropertyValue('width') || '0');
    const height = Number.parseFloat(pseudoStyle.getPropertyValue('height') || '0');
    const hasDecorativeVisual = pseudoStyle.getPropertyValue('background-image') !== 'none'
      || pseudoStyle.getPropertyValue('background-color') !== 'rgba(0, 0, 0, 0)'
      || pseudoStyle.getPropertyValue('border-top-width') !== '0px'
      || pseudoStyle.getPropertyValue('border-right-width') !== '0px'
      || pseudoStyle.getPropertyValue('border-bottom-width') !== '0px'
      || pseudoStyle.getPropertyValue('border-left-width') !== '0px';
    const hasTextualContent = !!content && content !== 'none' && content !== 'normal' && content !== '""' && content !== "''";

    return display !== 'none'
      && visibility !== 'hidden'
      && opacity !== 0
      && (width > 0 || height > 0 || hasTextualContent || hasDecorativeVisual);
  };
  const fallbackNodeSnapshots = [];
  const layoutNodeSnapshots = [];
  const pseudoElementSnapshots = [];
  const browserAssetSnapshots = [];
  const scrollContainerSnapshots = [];
  const interactionStateSnapshots = [];
  const sampledContentSnapshots = [];
  const sampledContentSnapshotSignatures = new Set();
  const appendedPortalSnapshotSignatures = new Set();
  let appendedPortalSnapshotCount = 0;
  const dropdownSemanticPairs = [];
  const collapseSemanticPairs = [];
  const tabSemanticGroups = [];
  const modalSemanticPairs = [];
  const INTERACTION_STATE_CLASS_NAMES = new Set([
    'active',
    'is-active',
    'selected',
    'is-selected',
    'current',
    'is-current',
    'checked',
    'is-checked',
    'open',
    'is-open',
    'expanded',
    'is-expanded',
    'focused',
    'is-focused'
  ]);
  const forcedRegionRoots = originalNodes.filter((node) => {
    if (!(node instanceof Element)) {
      return false;
    }

    return isRegionRoot(node, window.getComputedStyle(node));
  });
  const forcedRegionNodes = new WeakSet();

  forcedRegionRoots.forEach((root) => {
    forcedRegionNodes.add(root);
    root.querySelectorAll('*').forEach((child) => {
      forcedRegionNodes.add(child);
    });
  });

  const hasInteractionStateClass = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    return Array.from(element.classList || []).some((className) => INTERACTION_STATE_CLASS_NAMES.has(String(className || '').toLowerCase()));
  };

  const ensureRestoreNodeId = (element) => {
    if (!(element instanceof Element)) {
      return '';
    }

    const index = originalNodeIndexMap.get(element);
    if (!Number.isInteger(index)) {
      return '';
    }

    const clonedNode = clonedNodes[index];
    if (!(clonedNode instanceof Element)) {
      return '';
    }

    let restoreNodeId = clonedNode.getAttribute('data-restore-node-id');
    if (!restoreNodeId) {
      restoreNodeId = `restore-node-${index}`;
      clonedNode.setAttribute('data-restore-node-id', restoreNodeId);
    }

    return restoreNodeId;
  };

  const getClonedElement = (element) => {
    if (!(element instanceof Element)) {
      return null;
    }

    const index = originalNodeIndexMap.get(element);
    if (!Number.isInteger(index)) {
      return null;
    }

    return clonedNodes[index] instanceof Element ? clonedNodes[index] : null;
  };

  const setCloneAttribute = (element, name, value = 'true') => {
    const clonedElement = getClonedElement(element);
    if (!(clonedElement instanceof Element) || !name) {
      return;
    }

    clonedElement.setAttribute(name, String(value));
  };

  const ensureDetachedCloneRestoreIds = (sourceElement, clonedElement) => {
    if (!(sourceElement instanceof Element) || !(clonedElement instanceof Element)) {
      return;
    }

    const sourceDescendants = [sourceElement, ...sourceElement.querySelectorAll('*')];
    const clonedDescendants = [clonedElement, ...clonedElement.querySelectorAll('*')];
    sourceDescendants.forEach((sourceNode, index) => {
      const clonedNode = clonedDescendants[index];
      if (!(sourceNode instanceof Element) || !(clonedNode instanceof Element)) {
        return;
      }

      const existingRestoreNodeId = ensureRestoreNodeId(sourceNode);
      if (existingRestoreNodeId) {
        clonedNode.setAttribute('data-restore-node-id', existingRestoreNodeId);
        return;
      }

      appendedPortalSnapshotCount += 1;
      clonedNode.setAttribute('data-restore-node-id', `restore-portal-node-${appendedPortalSnapshotCount}`);
    });
  };

  const appendPortalSnapshotToClone = (sourceElement, options = {}) => {
    if (!(sourceElement instanceof Element)) {
      return null;
    }

    const existingClone = getClonedElement(sourceElement);
    if (existingClone instanceof Element) {
      return existingClone;
    }

    const bodyClone = clonedRoot.querySelector('body') || clonedRoot;
    if (!(bodyClone instanceof Element)) {
      return null;
    }

    const signatureParts = [
      options.kind || 'portal',
      sourceElement.id || '',
      sourceElement.getAttribute('role') || '',
      sourceElement.getAttribute('aria-controls') || '',
      sourceElement.getAttribute('aria-labelledby') || '',
      typeof sourceElement.className === 'string' ? sourceElement.className : '',
      getNormalizedText(sourceElement).slice(0, 80)
    ];
    const signature = signatureParts.join('::');
    if (appendedPortalSnapshotSignatures.has(signature)) {
      return Array.from(bodyClone.querySelectorAll('[data-restore-portal-signature]'))
        .find((candidate) => candidate instanceof Element && candidate.getAttribute('data-restore-portal-signature') === signature) || null;
    }

    const portalClone = sourceElement.cloneNode(true);
    if (!(portalClone instanceof Element)) {
      return null;
    }

    ensureDetachedCloneRestoreIds(sourceElement, portalClone);
    appendedPortalSnapshotSignatures.add(signature);
    portalClone.setAttribute('data-restore-portal-signature', signature);
    portalClone.setAttribute('data-restore-portal-kind', options.kind || 'portal');

    Object.entries(options.attributes || {}).forEach(([name, value]) => {
      if (!name || value === null || value === undefined || value === false) {
        return;
      }

      if (value === true) {
        portalClone.setAttribute(name, name);
        return;
      }

      portalClone.setAttribute(name, String(value));
    });

    const hiddenClassNames = Array.isArray(options.hiddenClassNames) ? options.hiddenClassNames.filter(Boolean) : [];
    hiddenClassNames.forEach((className) => portalClone.classList.add(String(className)));
    portalClone.hidden = true;
    portalClone.setAttribute('aria-hidden', 'true');
    portalClone.style.display = 'none';

    bodyClone.appendChild(portalClone);
    return portalClone;
  };

  const isVisibleElement = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  };

  const getControlledElement = (element) => {
    if (!(element instanceof Element)) {
      return null;
    }

    const controlledId = element.getAttribute('aria-controls')
      || element.getAttribute('data-target')
      || element.getAttribute('data-controls');
    if (controlledId) {
      const normalizedId = String(controlledId).replace(/^#/, '').trim();
      if (normalizedId) {
        const target = document.getElementById(normalizedId);
        if (target instanceof Element) {
          return target;
        }
      }
    }

    const href = element.getAttribute('href');
    if (href && href.startsWith('#')) {
      const target = document.getElementById(href.slice(1));
      if (target instanceof Element) {
        return target;
      }
    }

    return null;
  };

  const ensurePortalTargetId = (trigger, overlay, prefix = 'restore-portal') => {
    if (!(overlay instanceof Element)) {
      return '';
    }

    const explicitId = overlay.id || trigger?.getAttribute('aria-controls') || trigger?.getAttribute('data-target') || trigger?.getAttribute('data-controls');
    const normalizedId = String(explicitId || '').replace(/^#/, '').trim();
    if (normalizedId) {
      overlay.id = normalizedId;
      return normalizedId;
    }

    appendedPortalSnapshotCount += 1;
    const nextId = `${prefix}-${appendedPortalSnapshotCount}`;
    overlay.id = nextId;
    return nextId;
  };

  const isDisabledInteractiveElement = (element) => {
    if (!(element instanceof Element)) {
      return true;
    }

    return element.hasAttribute('disabled')
      || element.getAttribute('aria-disabled') === 'true'
      || element.getAttribute('data-disabled') === 'true';
  };

  const collectSelectLikeTriggers = (scope = document) => unique(Array.from(scope.querySelectorAll([
    '.ant-select-selector',
    '.el-select__wrapper',
    '.hammer-select-selector',
    '[data-select-trigger]',
    '[role="combobox"]',
    'input[aria-haspopup="listbox"]',
    'input[aria-controls]'
  ].join(', ')))
    .filter((element) => element instanceof Element && isVisibleElement(element))
    .map((element) => {
      if (!(element instanceof Element)) {
        return null;
      }

      const selectRoot = element.closest('.ant-select, .el-select, .hammer-select, [data-select-root]');
      const trigger = matchesLikeSelectTrigger(element) ? element : null;
      if (selectRoot instanceof Element) {
        return {
          selectRoot,
          trigger: trigger || selectRoot.querySelector('.ant-select-selector, .el-select__wrapper, .hammer-select-selector, [data-select-trigger]') || selectRoot,
          controller: selectRoot.querySelector('[role="combobox"], input[aria-haspopup="listbox"], input[aria-controls]') || trigger || selectRoot
        };
      }

      return {
        selectRoot: null,
        trigger: trigger || element,
        controller: element
      };
    })
    .filter(Boolean));

  function matchesLikeSelectTrigger(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const className = typeof element.className === 'string' ? element.className : '';
    return /(select|combobox|picker)/i.test(className)
      || element.getAttribute('role') === 'combobox'
      || /^(listbox|true)$/i.test(element.getAttribute('aria-haspopup') || '');
  }

  const collectImplicitModalTriggers = (scope = document) => unique(Array.from(scope.querySelectorAll('button, a[href], [role="button"], [role="link"]'))
    .filter((element) => element instanceof Element && isVisibleElement(element) && !isDisabledInteractiveElement(element))
    .filter((element) => {
      const className = typeof element.className === 'string' ? element.className : '';
      const text = getNormalizedText(element);
      return /btn|button|link|action|operate|trigger/i.test(className)
        || /(新建|新增|添加|编辑|选择|配置|详情|查看|规则|属性|规格|设置|创建|create|edit|add|detail|config|select)/i.test(text);
    }));

  const getNormalizedText = (element) => String(element?.textContent || '').replace(/\s+/g, ' ').trim();

  const looksLikeMenu = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    if (element.matches('[role="menu"], [role="listbox"], [role="dialog"], [data-dropdown-menu], .dropdown-menu, .menu, .popover, .tooltip, .select-dropdown')) {
      return true;
    }

    const className = typeof element.className === 'string' ? element.className : '';
    return /(dropdown|popover|tooltip|menu|listbox|select)/i.test(className);
  };

  const looksLikeModal = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    if (element.matches('[role="dialog"], [aria-modal="true"], [data-modal-root], .modal, .dialog, .drawer, .ant-modal-root, .ant-drawer, .el-dialog__wrapper, .hammer-modal')) {
      return true;
    }

    const className = typeof element.className === 'string' ? element.className : '';
    return /(modal|dialog|drawer|popup)/i.test(className);
  };

  const collectModalCandidates = () => Array.from(document.querySelectorAll([
    '[role="dialog"]',
    '[aria-modal="true"]',
    '[data-modal-root]',
    '.modal',
    '.dialog',
    '.drawer',
    '.ant-modal-root',
    '.ant-drawer',
    '.el-dialog__wrapper',
    '.hammer-modal'
  ].join(', ')))
    .filter((element) => element instanceof Element && looksLikeModal(element));

  const getModalCandidateScore = (trigger, modal) => {
    if (!(trigger instanceof Element) || !(modal instanceof Element)) {
      return Number.NEGATIVE_INFINITY;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    const modalStyle = window.getComputedStyle(modal);
    const triggerText = getNormalizedText(trigger).toLowerCase();
    const modalText = getNormalizedText(modal).toLowerCase();
    const modalClass = (modal.getAttribute('class') || '').toLowerCase();
    const triggerClass = (trigger.getAttribute('class') || '').toLowerCase();
    let score = 0;

    if (modal.getAttribute('aria-labelledby') && modalText) {
      score += 8;
    }
    if (modal.getAttribute('aria-modal') === 'true' || modal.getAttribute('role') === 'dialog') {
      score += 6;
    }
    if (modalStyle.position === 'fixed' || modalStyle.position === 'absolute') {
      score += 4;
    }
    if (modalRect.width >= Math.min(window.innerWidth * 0.3, 420) && modalRect.height >= 120) {
      score += 4;
    }
    if (modalRect.width >= window.innerWidth * 0.45) {
      score += 3;
    }
    if (modalRect.height >= window.innerHeight * 0.2) {
      score += 2;
    }
    if (triggerText && modalText && modalText.includes(triggerText)) {
      score += 10;
    }
    if (triggerText && modalClass.includes(triggerText)) {
      score += 6;
    }
    if (triggerClass && modalClass && /(modal|dialog|drawer|popup)/.test(triggerClass) && /(modal|dialog|drawer|popup)/.test(modalClass)) {
      score += 5;
    }

    const triggerCenterX = triggerRect.left + (triggerRect.width / 2);
    const triggerCenterY = triggerRect.top + (triggerRect.height / 2);
    const modalCenterX = modalRect.left + (modalRect.width / 2);
    const modalCenterY = modalRect.top + (modalRect.height / 2);
    const distance = Math.hypot(triggerCenterX - modalCenterX, triggerCenterY - modalCenterY);
    score -= Math.min(40, distance / 24);

    if (modalRect.width <= 0 || modalRect.height <= 0) {
      score -= 12;
    }

    return score;
  };

  const isOverlayLikeElement = (element, kind = 'generic') => {
    if (!(element instanceof Element) || !isVisibleElement(element) || element === document.body || element === document.documentElement) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 20) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const className = typeof element.className === 'string' ? element.className : '';
    const role = element.getAttribute('role') || '';
    const text = getNormalizedText(element);
    const zIndex = Number.parseFloat(style.zIndex || '0');
    const isPositioned = ['fixed', 'absolute', 'sticky'].includes(style.position);
    const isBodyChild = element.parentElement === document.body;
    const keywordPattern = kind === 'modal'
      ? /(modal|dialog|drawer|popup|overlay|mask)/i
      : /(dropdown|menu|listbox|select|popover|tooltip|popup|overlay)/i;
    const rolePattern = kind === 'modal' ? /^(dialog|alertdialog)$/i : /^(menu|listbox|tree|dialog)$/i;

    if (keywordPattern.test(className) || rolePattern.test(role)) {
      return true;
    }

    if (kind === 'modal') {
      return (isPositioned || isBodyChild || zIndex >= 10)
        && rect.width >= Math.min(window.innerWidth * 0.28, 360)
        && rect.height >= 96;
    }

    return (isPositioned || isBodyChild || zIndex >= 6)
      && rect.width >= 80
      && rect.height >= 24
      && text.length < 1200;
  };

  const collectVisibleOverlayCandidates = (kind = 'generic') => Array.from(document.body?.querySelectorAll('*') || [])
    .filter((element) => element instanceof Element && isOverlayLikeElement(element, kind));

  const getOverlayCandidateScore = (trigger, overlay, kind = 'generic') => {
    if (!(trigger instanceof Element) || !(overlay instanceof Element)) {
      return Number.NEGATIVE_INFINITY;
    }

    if (overlay.contains(trigger) || trigger.contains(overlay)) {
      return Number.NEGATIVE_INFINITY;
    }

    const overlayRect = overlay.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const overlayStyle = window.getComputedStyle(overlay);
    const className = typeof overlay.className === 'string' ? overlay.className : '';
    const role = overlay.getAttribute('role') || '';
    let score = 0;

    if (kind === 'modal') {
      score += getModalCandidateScore(trigger, overlay);
      if (/(modal|dialog|drawer|popup|overlay|mask)/i.test(className)) {
        score += 20;
      }
      if (/^(dialog|alertdialog)$/i.test(role)) {
        score += 18;
      }
      if (overlayRect.width >= Math.min(window.innerWidth * 0.32, 420)) {
        score += 10;
      }
      if (overlayRect.height >= 120) {
        score += 8;
      }
      return score;
    }

    if (/(dropdown|menu|listbox|select|popover|tooltip|popup|overlay)/i.test(className)) {
      score += 18;
    }
    if (/^(menu|listbox|tree|dialog)$/i.test(role)) {
      score += 16;
    }
    if (overlay.parentElement === document.body) {
      score += 8;
    }
    if (['fixed', 'absolute'].includes(overlayStyle.position)) {
      score += 8;
    }
    if (Math.abs(overlayRect.width - triggerRect.width) <= Math.max(80, triggerRect.width * 0.8)) {
      score += 6;
    }
    if (overlayRect.top >= triggerRect.top - 12 && overlayRect.top <= triggerRect.bottom + 240) {
      score += 10;
    }
    if (overlayRect.left <= triggerRect.right + 240 && overlayRect.right >= triggerRect.left - 240) {
      score += 8;
    }

    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;
    const overlayCenterX = overlayRect.left + overlayRect.width / 2;
    const overlayCenterY = overlayRect.top + overlayRect.height / 2;
    const distance = Math.hypot(triggerCenterX - overlayCenterX, triggerCenterY - overlayCenterY);
    score -= Math.min(40, distance / 20);

    return score;
  };

  const resolveAppearedOverlayAfterInteraction = (trigger, previousVisibleOverlays = new Set(), kind = 'generic') => {
    const candidates = collectVisibleOverlayCandidates(kind)
      .filter((overlay) => !previousVisibleOverlays.has(overlay))
      .map((overlay) => ({ overlay, score: getOverlayCandidateScore(trigger, overlay, kind) }))
      .filter(({ score }) => Number.isFinite(score))
      .sort((left, right) => right.score - left.score);

    return candidates[0]?.overlay || null;
  };

  const waitForAppearedOverlay = async ({
    trigger,
    previousVisibleOverlays = new Set(),
    kind = 'generic',
    controlledElementResolver = null,
    waitDurations = [0, 120, 260, 420, 620]
  }) => {
    for (const waitDuration of waitDurations) {
      if (waitDuration > 0) {
        await waitForInteractionFlush(waitDuration);
      }

      const controlledElement = typeof controlledElementResolver === 'function'
        ? controlledElementResolver()
        : null;
      if (controlledElement instanceof Element && (isVisibleElement(controlledElement) || window.getComputedStyle(controlledElement).display !== 'none')) {
        return controlledElement;
      }

      const appearedOverlay = resolveAppearedOverlayAfterInteraction(trigger, previousVisibleOverlays, kind);
      if (appearedOverlay instanceof Element) {
        return appearedOverlay;
      }
    }

    return null;
  };

  const markDropdownSemantics = () => {
    Array.from(document.querySelectorAll('[aria-haspopup], [aria-controls], [data-target], [data-controls], button, a[href], [role="button"], [role="menuitem"]'))
      .filter((element) => element instanceof Element && isVisibleElement(element))
      .slice(0, 240)
      .forEach((trigger) => {
        if (!(trigger instanceof Element)) {
          return;
        }

        const hasPopup = /^(menu|listbox|dialog|true)$/i.test(trigger.getAttribute('aria-haspopup') || '');
        const className = typeof trigger.className === 'string' ? trigger.className : '';
        if (!hasPopup && !/(dropdown|popover|menu|select)/i.test(className)) {
          return;
        }

        let menu = getControlledElement(trigger);
        if (!(menu instanceof Element) || !looksLikeMenu(menu)) {
          const nearbyCandidates = Array.from(document.querySelectorAll('[role="menu"], [role="listbox"], [role="dialog"], .dropdown-menu, .menu, .popover, .tooltip, .select-dropdown'))
            .filter((candidate) => candidate instanceof Element && candidate !== trigger && (isVisibleElement(candidate) || candidate.hidden || window.getComputedStyle(candidate).display === 'none'))
            .sort((left, right) => {
              const triggerRect = trigger.getBoundingClientRect();
              const leftRect = left.getBoundingClientRect();
              const rightRect = right.getBoundingClientRect();
              const leftDistance = Math.abs(leftRect.top - triggerRect.bottom) + Math.abs(leftRect.left - triggerRect.left);
              const rightDistance = Math.abs(rightRect.top - triggerRect.bottom) + Math.abs(rightRect.left - triggerRect.left);
              return leftDistance - rightDistance;
            });
          menu = nearbyCandidates[0] || null;
        }

        if (!(menu instanceof Element)) {
          return;
        }

        setCloneAttribute(trigger, 'data-dropdown-trigger', 'true');
        setCloneAttribute(menu, 'data-dropdown-menu', 'true');
        dropdownSemanticPairs.push({ trigger, menu });
      });
  };

  const markCollapseSemantics = () => {
    Array.from(document.querySelectorAll('[aria-expanded], summary, [data-collapse-trigger], .collapse-header, .accordion-header'))
      .filter((element) => element instanceof Element && isVisibleElement(element))
      .slice(0, 240)
      .forEach((trigger) => {
        if (!(trigger instanceof Element)) {
          return;
        }

        let content = getControlledElement(trigger);
        if (!(content instanceof Element)) {
          const sibling = trigger.nextElementSibling;
          if (sibling instanceof Element) {
            content = sibling;
          }
        }

        if (!(content instanceof Element)) {
          return;
        }

        const contentRect = content.getBoundingClientRect();
        if (contentRect.width <= 0 || contentRect.height <= 0) {
          const style = window.getComputedStyle(content);
          if (style.display !== 'none' && !content.hidden) {
            return;
          }
        }

        const item = trigger.closest('[data-collapse-item], .collapse-item, .accordion-item') || trigger.parentElement || content.parentElement;
        if (item instanceof Element) {
          setCloneAttribute(item, 'data-collapse-item', 'true');
        }

        setCloneAttribute(trigger, 'data-collapse-trigger', 'true');
        setCloneAttribute(content, 'data-collapse-content', 'true');
        collapseSemanticPairs.push({ trigger, content, item: item instanceof Element ? item : null });
      });
  };

  const markTabSemantics = () => {
    const tabCandidates = Array.from(document.querySelectorAll('[role="tab"], [aria-selected], [aria-controls], a[href^="#"], button'))
      .filter((element) => element instanceof Element && isVisibleElement(element))
      .filter((element) => {
        if (!(element instanceof Element)) {
          return false;
        }

        if (element.getAttribute('role') === 'tab') {
          return true;
        }

        const className = typeof element.className === 'string' ? element.className : '';
        if (/(tab|tabs|segmented|nav-item)/i.test(className)) {
          return true;
        }

        return element.getAttribute('aria-selected') !== null && getControlledElement(element) instanceof Element;
      });

    const groupedTabs = new Map();
    tabCandidates.forEach((tab) => {
      const container = tab.closest('[role="tablist"], .tabs, .tab-list, .tab-nav, .segmented, .ant-tabs, .el-tabs, .hammer-tabs') || tab.parentElement;
      if (!(container instanceof Element)) {
        return;
      }

      const groupKey = ensureRestoreNodeId(container) || String(originalNodeIndexMap.get(container));
      if (!groupedTabs.has(groupKey)) {
        groupedTabs.set(groupKey, { container, tabs: [] });
      }

      groupedTabs.get(groupKey).tabs.push(tab);
    });

    Array.from(groupedTabs.values()).forEach(({ container, tabs }) => {
      const uniqueTabs = Array.from(new Set(tabs));
      if (uniqueTabs.length < 2) {
        return;
      }

      const panels = uniqueTabs.map((tab) => getControlledElement(tab)).filter((panel) => panel instanceof Element);
      if (!panels.length) {
        return;
      }

      setCloneAttribute(container, 'data-tab-container', 'true');
      uniqueTabs.forEach((tab, index) => {
        setCloneAttribute(tab, 'data-tab', 'true');
        setCloneAttribute(tab, 'data-tab-index', String(index));
      });
      panels.forEach((panel, index) => {
        setCloneAttribute(panel, 'data-tab-panel', 'true');
        setCloneAttribute(panel, 'data-tab-panel-index', String(index));
      });
      tabSemanticGroups.push({ container, tabs: uniqueTabs, panels });
    });
  };

  const markCarouselSemantics = () => {
    const carouselRoots = Array.from(document.querySelectorAll('[class*="swiper"], [class*="slick"], [class*="carousel"], [class*="slider"], [data-carousel], [data-swiper]'))
      .filter((element) => element instanceof Element && isVisibleElement(element))
      .slice(0, 40);

    carouselRoots.forEach((root) => {
      if (!(root instanceof Element)) {
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const slideCandidates = Array.from(root.querySelectorAll('*')).filter((element) => {
        if (!(element instanceof Element) || !isVisibleElement(element)) {
          return false;
        }

        const className = typeof element.className === 'string' ? element.className : '';
        if (!/(slide|swiper-slide|slick-slide|carousel-item|slider-item|banner-item)/i.test(className)) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width >= rootRect.width * 0.45 && rect.height >= rootRect.height * 0.35;
      });

      if (slideCandidates.length < 2) {
        return;
      }

      const controlCandidates = Array.from(root.querySelectorAll('button, [role="button"], [role="tab"], li, span, a')).filter((element) => {
        if (!(element instanceof Element) || !isVisibleElement(element) || slideCandidates.includes(element)) {
          return false;
        }

        const className = typeof element.className === 'string' ? element.className : '';
        const text = getNormalizedText(element);
        const rect = element.getBoundingClientRect();
        return /(dot|indicator|pagination|bullet|thumb|nav)/i.test(className)
          || (rect.width <= 80 && rect.height <= 32 && (!text || /^\d+$/.test(text)));
      });

      setCloneAttribute(root, 'data-carousel-root', 'true');
      slideCandidates.forEach((slide, index) => {
        setCloneAttribute(slide, 'data-carousel-slide', 'true');
        setCloneAttribute(slide, 'data-carousel-slide-index', String(index));
      });
      controlCandidates.forEach((control, index) => {
        setCloneAttribute(control, 'data-carousel-control', 'true');
        setCloneAttribute(control, 'data-carousel-control-index', String(index));
      });
    });
  };

  const resolveModalFromTrigger = (trigger) => {
    if (!(trigger instanceof Element)) {
      return null;
    }

    const controlledElement = getControlledElement(trigger);
    if (controlledElement instanceof Element && looksLikeModal(controlledElement)) {
      return controlledElement;
    }

    const selectorHints = [
      trigger.getAttribute('data-target'),
      trigger.getAttribute('data-modal-target'),
      trigger.getAttribute('href'),
      trigger.getAttribute('data-controls')
    ].filter(Boolean).map((value) => String(value).trim()).filter(Boolean);
    for (const selectorHint of selectorHints) {
      if (!selectorHint.startsWith('#') && !selectorHint.startsWith('.')) {
        continue;
      }
      const candidate = document.querySelector(selectorHint);
      if (candidate instanceof Element && looksLikeModal(candidate)) {
        return candidate;
      }
    }

    const nearbyModal = unique([
      trigger.parentElement?.querySelector('[role="dialog"], [aria-modal="true"], .modal, .dialog, .drawer, .ant-modal-root, .ant-drawer, .el-dialog__wrapper, .hammer-modal'),
      trigger.closest('[data-modal-scope]')?.querySelector('[role="dialog"], [aria-modal="true"], .modal, .dialog, .drawer, .ant-modal-root, .ant-drawer, .el-dialog__wrapper, .hammer-modal')
    ].filter(Boolean))[0];
    if (nearbyModal instanceof Element) {
      return nearbyModal;
    }

    const hiddenModals = collectModalCandidates()
      .filter((modal) => !isVisibleElement(modal))
      .sort((left, right) => getModalCandidateScore(trigger, right) - getModalCandidateScore(trigger, left));

    return hiddenModals[0] || null;
  };

  const markModalSemantics = () => {
    Array.from(document.querySelectorAll('[data-target], [data-modal-trigger], [aria-controls][aria-haspopup="dialog"], [aria-haspopup="dialog"], button, a[href], [role="button"]'))
      .filter((element) => element instanceof Element && isVisibleElement(element))
      .slice(0, 200)
      .forEach((trigger) => {
        if (!(trigger instanceof Element)) {
          return;
        }

        const className = typeof trigger.className === 'string' ? trigger.className : '';
        const hasDialogPopup = /^(dialog|true)$/i.test(trigger.getAttribute('aria-haspopup') || '');
        const target = resolveModalFromTrigger(trigger);
        if (!(target instanceof Element)) {
          if (!hasDialogPopup && !/(modal|dialog|drawer|popup|details|filter|login)/i.test(className)) {
            return;
          }
        }

        setCloneAttribute(trigger, 'data-modal-trigger', 'true');
        if (target instanceof Element) {
          setCloneAttribute(target, 'data-modal-root', 'true');
        }
        modalSemanticPairs.push({ trigger, modal: target instanceof Element ? target : null });
      });
  };

  const waitForInteractionFlush = (duration = 90) => new Promise((resolve) => {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    }, duration);
  });

  const dispatchSyntheticClick = (element) => {
    if (!(element instanceof Element)) {
      return;
    }

    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((eventName) => {
      element.dispatchEvent(new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    });
  };

  const serializeTargetSubtreeWithRestoreIds = (target) => {
    if (!(target instanceof Element)) {
      return '';
    }

    const targetClone = target.cloneNode(true);
    if (!(targetClone instanceof Element)) {
      return '';
    }

    const originalDescendants = [target, ...target.querySelectorAll('*')];
    const clonedDescendants = [targetClone, ...targetClone.querySelectorAll('*')];
    originalDescendants.forEach((originalNode, index) => {
      const clonedNode = clonedDescendants[index];
      if (!(originalNode instanceof Element) || !(clonedNode instanceof Element)) {
        return;
      }

      const restoreNodeId = ensureRestoreNodeId(originalNode);
      if (restoreNodeId) {
        clonedNode.setAttribute('data-restore-node-id', restoreNodeId);
      }
    });

    return targetClone.innerHTML;
  };

  const pushSampledContentSnapshot = (target, stateType, sampleKey) => {
    if (!(target instanceof Element)) {
      return;
    }

    const restoreNodeId = ensureRestoreNodeId(target);
    if (!restoreNodeId) {
      return;
    }

    const attributes = copyAttributes(target);
    const html = serializeTargetSubtreeWithRestoreIds(target);
    const signature = JSON.stringify({
      id: restoreNodeId,
      stateType,
      sampleKey,
      attributes,
      html
    });
    if (sampledContentSnapshotSignatures.has(signature)) {
      return false;
    }
    sampledContentSnapshotSignatures.add(signature);

    sampledContentSnapshots.push({
      id: restoreNodeId,
      stateType,
      sampleKey,
      attributes,
      html
    });
    return true;
  };

  const pushDelayedSampledSnapshots = async (target, stateType, sampleKey, waitDurations = [0]) => {
    if (!(target instanceof Element)) {
      return;
    }

    for (const waitDuration of waitDurations) {
      if (waitDuration > 0) {
        await waitForInteractionFlush(waitDuration);
      }

      pushSampledContentSnapshot(target, stateType, sampleKey);
    }
  };

  const pollSampledContentSnapshots = async (target, stateType, sampleKey, waitDurations = [0, 160, 320, 520]) => {
    if (!(target instanceof Element)) {
      return;
    }

    let stableRounds = 0;
    let lastHtml = null;

    for (const waitDuration of waitDurations) {
      if (waitDuration > 0) {
        await waitForInteractionFlush(waitDuration);
      }

      const currentHtml = serializeTargetSubtreeWithRestoreIds(target);
      pushSampledContentSnapshot(target, stateType, sampleKey);
      if (currentHtml === lastHtml) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
        lastHtml = currentHtml;
      }

      if (stableRounds >= 1) {
        break;
      }
    }
  };

  const resolveOpenedModalFromTrigger = (trigger, previousVisibleModals = new Set()) => {
    const candidates = collectModalCandidates()
      .filter((modal) => isVisibleElement(modal) || window.getComputedStyle(modal).display !== 'none')
      .filter((modal) => !previousVisibleModals.has(modal))
      .sort((left, right) => getModalCandidateScore(trigger, right) - getModalCandidateScore(trigger, left));

    if (candidates.length) {
      return candidates[0];
    }

    return collectModalCandidates()
      .filter((modal) => isVisibleElement(modal) || window.getComputedStyle(modal).display !== 'none')
      .sort((left, right) => getModalCandidateScore(trigger, right) - getModalCandidateScore(trigger, left))[0] || null;
  };

  const ensureOverlaySnapshotBinding = (trigger, overlay, options = {}) => {
    if (!(trigger instanceof Element) || !(overlay instanceof Element)) {
      return null;
    }

    const overlayClone = getClonedElement(overlay);
    const targetId = ensurePortalTargetId(trigger, overlay, options.idPrefix || 'restore-overlay');
    const targetSelector = targetId ? `#${targetId}` : '';
    const overlayAttributes = {
      ...(options.overlayAttributes || {}),
      id: targetId || undefined
    };

    if (overlayClone instanceof Element) {
      Object.entries(overlayAttributes).forEach(([name, value]) => {
        if (!name || value === undefined || value === null) {
          return;
        }
        setCloneAttribute(overlay, name, value);
      });
    } else {
      appendPortalSnapshotToClone(overlay, {
        kind: options.kind || 'overlay',
        attributes: overlayAttributes,
        hiddenClassNames: options.hiddenClassNames || []
      });
    }

    if (options.triggerAttributes) {
      Object.entries(options.triggerAttributes).forEach(([name, value]) => {
        if (!name || value === undefined || value === null) {
          return;
        }

        setCloneAttribute(trigger, name, value);
      });
    }

    if (options.targetAttribute && targetSelector) {
      setCloneAttribute(trigger, options.targetAttribute, targetSelector);
    }

    return {
      targetId,
      targetSelector
    };
  };

  const sampleSelectLikeStates = async () => {
    const sampledMenus = new Set();
    const selectEntries = collectSelectLikeTriggers(document).slice(0, 16);

    for (const entry of selectEntries) {
      const trigger = entry?.trigger instanceof Element ? entry.trigger : null;
      const controller = entry?.controller instanceof Element ? entry.controller : trigger;
      const selectRoot = entry?.selectRoot instanceof Element ? entry.selectRoot : trigger?.closest('.ant-select, .el-select, .hammer-select, [data-select-root]') || null;
      if (!(trigger instanceof Element) || !(controller instanceof Element) || isDisabledInteractiveElement(trigger) || isDisabledInteractiveElement(controller)) {
        continue;
      }

      const previousVisibleMenus = new Set(Array.from(document.querySelectorAll('[role="listbox"], .ant-select-dropdown, .el-select-dropdown, .hammer-select-dropdown, .select-dropdown'))
        .filter((element) => element instanceof Element && (isVisibleElement(element) || window.getComputedStyle(element).display !== 'none')));
      const previousVisibleOverlays = new Set(collectVisibleOverlayCandidates('select'));

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window }));
      dispatchSyntheticClick(trigger);
      if (controller instanceof HTMLElement) {
        controller.focus({ preventScroll: true });
      }
      controller.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true, cancelable: true }));
      await waitForInteractionFlush(80);

      const menu = await waitForAppearedOverlay({
        trigger,
        previousVisibleOverlays,
        kind: 'select',
        controlledElementResolver: () => getControlledElement(controller)
          || Array.from(document.querySelectorAll('[role="listbox"], .ant-select-dropdown, .el-select-dropdown, .hammer-select-dropdown, .select-dropdown'))
            .filter((candidate) => candidate instanceof Element && !previousVisibleMenus.has(candidate) && (isVisibleElement(candidate) || window.getComputedStyle(candidate).display !== 'none'))
            .sort((left, right) => getModalCandidateScore(trigger, right) - getModalCandidateScore(trigger, left))[0]
          || null
      });

      if (!(menu instanceof Element) || sampledMenus.has(menu) || (!isVisibleElement(menu) && window.getComputedStyle(menu).display === 'none')) {
        continue;
      }

      sampledMenus.add(menu);
      if (selectRoot instanceof Element) {
        setCloneAttribute(selectRoot, 'data-select-root', 'true');
      }
      setCloneAttribute(trigger, 'data-select-trigger', 'true');
      ensureOverlaySnapshotBinding(controller, menu, {
        kind: 'select-menu',
        idPrefix: 'restore-select-menu',
        hiddenClassNames: ['hidden', 'ant-select-dropdown-hidden', 'hammer-dropdown-hidden'],
        overlayAttributes: {
          'data-select-menu': 'true',
          'data-dropdown-menu': 'true'
        }
      });
      await pollSampledContentSnapshots(menu, 'select-open', getNormalizedText(trigger).slice(0, 40), [0, 160, 320, 520]);
      captureInteractionSnapshot(trigger, ['open', 'sampled', 'select']);
      captureInteractionSnapshot(menu, ['open', 'sampled', 'select']);
      dispatchSyntheticClick(trigger);
      await waitForInteractionFlush(60);
    }
  };

  const sampleScopedDropdownStates = async (scope, samplePrefix = 'modal') => {
    if (!(scope instanceof Element)) {
      return;
    }

    const triggers = Array.from(scope.querySelectorAll('[aria-haspopup], [aria-controls], [data-target], [data-controls], button, [role="button"], [role="menuitem"]'))
      .filter((element) => element instanceof Element && isVisibleElement(element))
      .filter((element) => {
        const className = typeof element.className === 'string' ? element.className : '';
        return /^(menu|listbox|dialog|true)$/i.test(element.getAttribute('aria-haspopup') || '') || /(dropdown|popover|menu|select|submenu)/i.test(className);
      })
      .slice(0, 6);

    for (const trigger of triggers) {
      const previousVisibleMenus = new Set(Array.from(document.querySelectorAll('[role="menu"], [role="listbox"], .dropdown-menu, .menu, .popover, .tooltip, .select-dropdown'))
        .filter((element) => element instanceof Element && isVisibleElement(element)));
      const previousVisibleOverlays = new Set(collectVisibleOverlayCandidates('dropdown'));
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window }));
      dispatchSyntheticClick(trigger);
      await waitForInteractionFlush(70);

      const menu = await waitForAppearedOverlay({
        trigger,
        previousVisibleOverlays,
        kind: 'dropdown',
        controlledElementResolver: () => getControlledElement(trigger)
          || Array.from(document.querySelectorAll('[role="menu"], [role="listbox"], .dropdown-menu, .menu, .popover, .tooltip, .select-dropdown'))
            .filter((candidate) => candidate instanceof Element && !previousVisibleMenus.has(candidate) && (isVisibleElement(candidate) || window.getComputedStyle(candidate).display !== 'none'))
            .sort((left, right) => getModalCandidateScore(trigger, right) - getModalCandidateScore(trigger, left))[0]
          || null
      });

      if (menu instanceof Element && (isVisibleElement(menu) || window.getComputedStyle(menu).display !== 'none')) {
        setCloneAttribute(trigger, 'data-dropdown-trigger', 'true');
        ensureOverlaySnapshotBinding(trigger, menu, {
          kind: 'dropdown-menu',
          idPrefix: 'restore-dropdown-menu',
          hiddenClassNames: ['hidden', 'ant-dropdown-hidden', 'hammer-dropdown-hidden'],
          overlayAttributes: {
            'data-dropdown-menu': 'true'
          },
          targetAttribute: 'data-target'
        });
        await pollSampledContentSnapshots(menu, `${samplePrefix}-dropdown-open`, getNormalizedText(trigger).slice(0, 40));
        captureInteractionSnapshot(trigger, ['open', 'sampled', samplePrefix, 'dropdown']);
        captureInteractionSnapshot(menu, ['open', 'sampled', samplePrefix, 'dropdown']);
      }
    }
  };

  const sampleScopedCollapseStates = async (scope, samplePrefix = 'modal') => {
    if (!(scope instanceof Element)) {
      return;
    }

    const triggers = Array.from(scope.querySelectorAll('[aria-expanded], summary, [data-collapse-trigger], .collapse-header, .accordion-header'))
      .filter((element) => element instanceof Element && isVisibleElement(element))
      .slice(0, 6);

    for (const trigger of triggers) {
      let content = getControlledElement(trigger);
      if (!(content instanceof Element) && trigger.nextElementSibling instanceof Element) {
        content = trigger.nextElementSibling;
      }
      if (!(content instanceof Element)) {
        continue;
      }

      const wasOpen = isVisibleElement(content) || window.getComputedStyle(content).display !== 'none';
      if (!wasOpen) {
        dispatchSyntheticClick(trigger);
        await waitForInteractionFlush(90);
      }

      if (isVisibleElement(content) || window.getComputedStyle(content).display !== 'none') {
        await pollSampledContentSnapshots(content, `${samplePrefix}-collapse-open`, getNormalizedText(trigger).slice(0, 40));
        captureInteractionSnapshot(trigger, ['open', 'sampled', samplePrefix, 'collapse']);
        captureInteractionSnapshot(content, ['open', 'sampled', samplePrefix, 'collapse']);
      }
    }
  };

  const sampleScopedTabStates = async (scope, samplePrefix = 'modal') => {
    if (!(scope instanceof Element)) {
      return;
    }

    const tabs = Array.from(scope.querySelectorAll('[role="tab"], [aria-selected], [aria-controls], a[href^="#"], button'))
      .filter((element) => element instanceof Element && isVisibleElement(element))
      .filter((element) => {
        if (element.getAttribute('role') === 'tab') {
          return true;
        }
        const className = typeof element.className === 'string' ? element.className : '';
        return /(tab|tabs|segmented|nav-item)/i.test(className) || element.getAttribute('aria-selected') !== null;
      })
      .slice(0, 6);

    for (let index = 0; index < tabs.length; index += 1) {
      const tab = tabs[index];
      const panel = getControlledElement(tab);
      if (!(panel instanceof Element)) {
        continue;
      }
      dispatchSyntheticClick(tab);
      await waitForInteractionFlush(90);
      await pollSampledContentSnapshots(panel, `${samplePrefix}-tab-panel`, String(index));
      captureInteractionSnapshot(tab, ['selected', 'sampled', samplePrefix, 'tab']);
      captureInteractionSnapshot(panel, ['open', 'sampled', samplePrefix, 'tab']);
    }
  };

  const sampleNestedModalStates = async (modal) => {
    if (!(modal instanceof Element)) {
      return;
    }

    await sampleScopedDropdownStates(modal, 'modal');
    await sampleScopedCollapseStates(modal, 'modal');
    await sampleScopedTabStates(modal, 'modal');
  };

  const sampleDropdownStates = async () => {
    const sampledMenus = new Set();

    for (const { trigger, menu } of dropdownSemanticPairs.slice(0, 12)) {
      if (!(trigger instanceof Element) || !(menu instanceof Element)) {
        continue;
      }

      const triggerStateBefore = {
        expanded: trigger.getAttribute('aria-expanded'),
        className: trigger.getAttribute('class') || ''
      };
      const menuStateBefore = {
        hidden: menu.hidden,
        display: menu.style.display || '',
        className: menu.getAttribute('class') || '',
        ariaHidden: menu.getAttribute('aria-hidden')
      };
      const wasOpen = isVisibleElement(menu) && !menu.hidden && window.getComputedStyle(menu).display !== 'none';
      const previousVisibleOverlays = new Set(collectVisibleOverlayCandidates('dropdown'));

      if (!wasOpen) {
        trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window }));
        dispatchSyntheticClick(trigger);
        await waitForInteractionFlush();
      }

      const activeMenu = (isVisibleElement(menu) || window.getComputedStyle(menu).display !== 'none')
        ? menu
        : resolveAppearedOverlayAfterInteraction(trigger, previousVisibleOverlays, 'dropdown');
      if ((activeMenu instanceof Element) && (isVisibleElement(activeMenu) || window.getComputedStyle(activeMenu).display !== 'none') && !sampledMenus.has(activeMenu)) {
        sampledMenus.add(activeMenu);
        setCloneAttribute(trigger, 'data-dropdown-trigger', 'true');
        ensureOverlaySnapshotBinding(trigger, activeMenu, {
          kind: 'dropdown-menu',
          idPrefix: 'restore-dropdown-menu',
          hiddenClassNames: ['hidden', 'ant-dropdown-hidden', 'hammer-dropdown-hidden'],
          overlayAttributes: {
            'data-dropdown-menu': 'true'
          },
          targetAttribute: 'data-target'
        });
        pushSampledContentSnapshot(activeMenu, 'dropdown-open', getNormalizedText(trigger).slice(0, 40));
        captureInteractionSnapshot(trigger, ['open', 'sampled', 'dropdown']);
        captureInteractionSnapshot(activeMenu, ['open', 'sampled', 'dropdown']);
      }

      if (!wasOpen) {
        dispatchSyntheticClick(trigger);
        await waitForInteractionFlush(50);
        trigger.setAttribute('class', triggerStateBefore.className);
        if (triggerStateBefore.expanded === null) {
          trigger.removeAttribute('aria-expanded');
        } else {
          trigger.setAttribute('aria-expanded', triggerStateBefore.expanded);
        }
        menu.hidden = menuStateBefore.hidden;
        menu.setAttribute('class', menuStateBefore.className);
        menu.style.display = menuStateBefore.display;
        if (menuStateBefore.ariaHidden === null) {
          menu.removeAttribute('aria-hidden');
        } else {
          menu.setAttribute('aria-hidden', menuStateBefore.ariaHidden);
        }
      }
    }
  };

  const sampleCollapseStates = async () => {
    const sampledContents = new Set();

    for (const { trigger, content } of collapseSemanticPairs.slice(0, 16)) {
      if (!(trigger instanceof Element) || !(content instanceof Element)) {
        continue;
      }

      const styleBefore = content.style.display || '';
      const classBefore = content.getAttribute('class') || '';
      const triggerExpandedBefore = trigger.getAttribute('aria-expanded');
      const wasOpen = isVisibleElement(content) && !content.hidden && window.getComputedStyle(content).display !== 'none';

      if (!wasOpen) {
        dispatchSyntheticClick(trigger);
        await waitForInteractionFlush();
      }

      if ((isVisibleElement(content) || window.getComputedStyle(content).display !== 'none') && !sampledContents.has(content)) {
        sampledContents.add(content);
        pushSampledContentSnapshot(content, 'collapse-open', getNormalizedText(trigger).slice(0, 40));
        captureInteractionSnapshot(trigger, ['open', 'sampled', 'collapse']);
        captureInteractionSnapshot(content, ['open', 'sampled', 'collapse']);
      }

      if (!wasOpen) {
        dispatchSyntheticClick(trigger);
        await waitForInteractionFlush(50);
        content.style.display = styleBefore;
        content.setAttribute('class', classBefore);
        if (triggerExpandedBefore === null) {
          trigger.removeAttribute('aria-expanded');
        } else {
          trigger.setAttribute('aria-expanded', triggerExpandedBefore);
        }
      }
    }
  };

  const sampleTabStates = async () => {
    for (const group of tabSemanticGroups.slice(0, 12)) {
      if (!group || !Array.isArray(group.tabs) || group.tabs.length < 2) {
        continue;
      }

      const initialIndex = group.tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true' || /(?:^|\s)(?:active|is-active|selected|current)(?:\s|$)/.test(tab.getAttribute('class') || ''));
      const restoreIndex = initialIndex >= 0 ? initialIndex : 0;

      for (let index = 0; index < group.tabs.length; index += 1) {
        const tab = group.tabs[index];
        const panel = group.panels[index];
        if (!(tab instanceof Element) || !(panel instanceof Element)) {
          continue;
        }

        dispatchSyntheticClick(tab);
        await waitForInteractionFlush();
        pushSampledContentSnapshot(panel, 'tab-panel', String(index));
        captureInteractionSnapshot(tab, ['selected', 'sampled', 'tab']);
        captureInteractionSnapshot(panel, ['open', 'sampled', 'tab']);
      }

      const restoreTab = group.tabs[restoreIndex];
      if (restoreTab instanceof Element) {
        dispatchSyntheticClick(restoreTab);
        await waitForInteractionFlush(50);
      }
    }
  };

  const sampleModalStates = async () => {
    const sampledModals = new Set();
    const modalEntries = [];
    const seenTriggerIds = new Set();
    const pushModalEntry = (trigger, modal = null) => {
      if (!(trigger instanceof Element) || isDisabledInteractiveElement(trigger)) {
        return;
      }

      const triggerKey = ensureRestoreNodeId(trigger) || String(originalNodeIndexMap.get(trigger)) || getNormalizedText(trigger).slice(0, 60);
      if (!triggerKey || seenTriggerIds.has(triggerKey)) {
        return;
      }

      seenTriggerIds.add(triggerKey);
      modalEntries.push({ trigger, modal: modal instanceof Element ? modal : null });
    };

    modalSemanticPairs.forEach(({ trigger, modal }) => pushModalEntry(trigger, modal));
    collectImplicitModalTriggers(document).slice(0, 18).forEach((trigger) => pushModalEntry(trigger, null));

    for (const { trigger, modal } of modalEntries.slice(0, 20)) {
      if (!(trigger instanceof Element)) {
        continue;
      }

      const previousVisibleModals = new Set(collectModalCandidates()
        .filter((candidate) => isVisibleElement(candidate) || window.getComputedStyle(candidate).display !== 'none'));
      const previousVisibleOverlays = new Set(collectVisibleOverlayCandidates('modal'));
      const resolvedModal = modal instanceof Element ? modal : resolveModalFromTrigger(trigger);
      const activeModal = resolvedModal instanceof Element ? resolvedModal : null;
      const modalBeforeOpen = activeModal instanceof Element ? activeModal : null;
      const modalTarget = modalBeforeOpen || resolvedModal;
      if (modalTarget && !(modalTarget instanceof Element)) {
        continue;
      }

      const modalStateBefore = modalTarget instanceof Element ? {
        hidden: modalTarget.hidden,
        display: modalTarget.style.display || '',
        className: modalTarget.getAttribute('class') || '',
        ariaHidden: modalTarget.getAttribute('aria-hidden'),
        bodyOverflow: document.body.style.overflow || ''
      } : null;
      const triggerExpandedBefore = trigger.getAttribute('aria-expanded');
      const wasOpen = modalTarget instanceof Element && isVisibleElement(modalTarget) && !modalTarget.hidden && window.getComputedStyle(modalTarget).display !== 'none';

      if (!wasOpen) {
        dispatchSyntheticClick(trigger);
        await waitForInteractionFlush(80);
      }

      const openedModal = await waitForAppearedOverlay({
        trigger,
        previousVisibleOverlays,
        kind: 'modal',
        controlledElementResolver: () => resolveOpenedModalFromTrigger(trigger, previousVisibleModals) || modalTarget || null,
        waitDurations: [0, 120, 260, 420, 680]
      });
      if ((openedModal instanceof Element) && (isVisibleElement(openedModal) || window.getComputedStyle(openedModal).display !== 'none') && !sampledModals.has(openedModal)) {
        sampledModals.add(openedModal);
        ensureOverlaySnapshotBinding(trigger, openedModal, {
          kind: 'modal',
          idPrefix: 'restore-modal',
          hiddenClassNames: ['hidden', 'hide', 'is-hidden', 'hidden-modal', 'modal-hidden', 'drawer-hidden', 'popup-hidden', 'ant-modal-hidden', 'ant-drawer-hidden'],
          overlayAttributes: {
            'data-modal-root': 'true',
            role: openedModal.getAttribute('role') || 'dialog'
          },
          triggerAttributes: {
            'data-modal-trigger': 'true'
          },
          targetAttribute: 'data-modal-target'
        });
        await pollSampledContentSnapshots(openedModal, 'modal-open', getNormalizedText(trigger).slice(0, 40), [0, 160, 320, 520]);
        await sampleNestedModalStates(openedModal);
        captureInteractionSnapshot(trigger, ['open', 'sampled', 'modal']);
        captureInteractionSnapshot(openedModal, ['open', 'sampled', 'modal']);
      }

      if (!wasOpen && openedModal instanceof Element && modalStateBefore) {
        const closeTarget = openedModal.querySelector('.ant-modal-close, .ant-drawer-close, .el-dialog__headerbtn, .modal-close, [data-modal-close]')
          || openedModal.querySelector('.ant-modal-mask, .ant-drawer-mask')
          || openedModal;
        dispatchSyntheticClick(closeTarget);
        await waitForInteractionFlush(60);
        openedModal.hidden = modalStateBefore.hidden;
        openedModal.style.display = modalStateBefore.display;
        openedModal.setAttribute('class', modalStateBefore.className);
        if (modalStateBefore.ariaHidden === null) {
          openedModal.removeAttribute('aria-hidden');
        } else {
          openedModal.setAttribute('aria-hidden', modalStateBefore.ariaHidden);
        }
        document.body.style.overflow = modalStateBefore.bodyOverflow;
        if (triggerExpandedBefore === null) {
          trigger.removeAttribute('aria-expanded');
        } else {
          trigger.setAttribute('aria-expanded', triggerExpandedBefore);
        }
      }
    }
  };

  const sampleInteractiveComponentStates = async () => {
    await sampleSelectLikeStates();
    await sampleDropdownStates();
    await sampleCollapseStates();
    await sampleTabStates();
    await sampleModalStates();
  };

  const getInteractionStates = (element) => {
    if (!(element instanceof Element)) {
      return [];
    }

    const states = [];

    if (element.matches(':hover')) {
      states.push('hover');
    }

    if (element.matches(':focus')) {
      states.push('focus');
    }

    if (element.matches(':focus-within')) {
      states.push('focus-within');
    }

    if (element.matches(':active')) {
      states.push('active');
    }

    if (element.getAttribute('aria-expanded') === 'true' || element.hasAttribute('open')) {
      states.push('open');
    }

    if (element.matches(':checked') || element.getAttribute('aria-checked') === 'true') {
      states.push('checked');
    }

    if (element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true') {
      states.push('disabled');
    }

    if (
      element.matches(':selected')
      || element.getAttribute('aria-selected') === 'true'
      || element.getAttribute('aria-current')
      || hasInteractionStateClass(element)
    ) {
      states.push('selected');
    }

    return Array.from(new Set(states));
  };

  const shouldCaptureInteractionState = (element, computedStyle, states) => {
    if (!(element instanceof Element) || !states.length) {
      return false;
    }

    if (element === document.documentElement || element === document.body) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const nearlyFullPage = rect.width >= window.innerWidth * 0.98 && rect.height >= window.innerHeight * 0.7;
    if (nearlyFullPage && !states.includes('focus')) {
      return false;
    }

    const hasSemanticText = (element.textContent || '').trim().length > 0;
    const isMediaNode = ['IMG', 'SVG', 'CANVAS', 'VIDEO'].includes(element.tagName);
    const hasVisualDecoration = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
      || computedStyle.borderTopWidth !== '0px'
      || computedStyle.borderRightWidth !== '0px'
      || computedStyle.borderBottomWidth !== '0px'
      || computedStyle.borderLeftWidth !== '0px'
      || computedStyle.boxShadow !== 'none'
      || computedStyle.outlineStyle !== 'none'
      || computedStyle.transform !== 'none'
      || computedStyle.filter !== 'none'
      || computedStyle.backdropFilter !== 'none';

    return hasSemanticText || isMediaNode || hasVisualDecoration || states.includes('focus') || states.includes('active');
  };

  const isInteractiveCandidate = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }

    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.pointerEvents === 'none' || computedStyle.visibility === 'hidden' || computedStyle.display === 'none') {
      return false;
    }

    if (
      element.matches('a[href], button, summary, label, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="link"], [data-hover-trigger], [data-clickable="true"]')
      || element.getAttribute('tabindex') !== null
    ) {
      return true;
    }

    const className = typeof element.className === 'string' ? element.className : '';
    return /btn|button|tab|menu|item|link|card|option|trigger|switch|checkbox|radio|select|dropdown/i.test(className)
      && computedStyle.cursor === 'pointer';
  };

  const captureInteractionSnapshot = (element, states) => {
    if (!(element instanceof Element) || !states.length) {
      return;
    }

    const restoreNodeId = ensureRestoreNodeId(element);
    if (!restoreNodeId) {
      return;
    }

    const computedStyle = window.getComputedStyle(element);
    if (!shouldCaptureInteractionState(element, computedStyle, states)) {
      return;
    }

    interactionStateSnapshots.push({
      id: restoreNodeId,
      states: Array.from(new Set(states)),
      style: serializeStyleProperties(computedStyle, FALLBACK_STYLE_PROPERTIES)
    });
  };

  const isFocusableCandidate = (element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.visibility === 'hidden' || computedStyle.display === 'none' || computedStyle.pointerEvents === 'none') {
      return false;
    }

    if (typeof element.tabIndex === 'number' && element.tabIndex >= 0) {
      return true;
    }

    return element.matches('input, textarea, select, button, a[href], [role="button"], [role="tab"], [role="option"], [role="menuitem"], [contenteditable="true"], summary');
  };

  originalNodes.forEach((node, index) => {
    const clonedNode = clonedNodes[index];
    if (!(node instanceof Element) || !(clonedNode instanceof Element)) {
      return;
    }

    let restoreNodeId = clonedNode.getAttribute('data-restore-node-id');
    const rect = node.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(node);
    const forceSubtreeCapture = forcedRegionNodes.has(node);
    if (shouldCaptureFallback(node, computedStyle, { forceSubtreeCapture })) {
      restoreNodeId = restoreNodeId || `restore-node-${index}`;
      clonedNode.setAttribute('data-restore-node-id', restoreNodeId);
      const fallbackStyleProperties = forceSubtreeCapture
        ? FALLBACK_STYLE_PROPERTIES
        : (isInteractiveCandidate(node) && !hasRuntimeGeneratedClass(node)
          ? INTERACTIVE_FALLBACK_STYLE_PROPERTIES
          : FALLBACK_STYLE_PROPERTIES);
      fallbackNodeSnapshots.push({
        id: restoreNodeId,
        style: serializeStyleProperties(computedStyle, fallbackStyleProperties)
      });
    }

    if (shouldCaptureLayoutSnapshot(node, computedStyle, rect, { forceSubtreeCapture })) {
      restoreNodeId = restoreNodeId || `restore-node-${index}`;
      clonedNode.setAttribute('data-restore-node-id', restoreNodeId);
      layoutNodeSnapshots.push({
        id: restoreNodeId,
        ...buildLayoutSnapshot(node, computedStyle, rect)
      });
    }

    const hasScrollableState = node.scrollTop > 0
      || node.scrollLeft > 0
      || node.scrollHeight > node.clientHeight + 1
      || node.scrollWidth > node.clientWidth + 1;
    if (hasScrollableState) {
      restoreNodeId = restoreNodeId || `restore-node-${index}`;
      clonedNode.setAttribute('data-restore-node-id', restoreNodeId);
      scrollContainerSnapshots.push({
        id: restoreNodeId,
        scrollTop: Math.round(node.scrollTop || 0),
        scrollLeft: Math.round(node.scrollLeft || 0),
        clientWidth: Math.round(node.clientWidth || 0),
        clientHeight: Math.round(node.clientHeight || 0),
        scrollWidth: Math.round(node.scrollWidth || 0),
        scrollHeight: Math.round(node.scrollHeight || 0),
        overflowX: computedStyle.overflowX || '',
        overflowY: computedStyle.overflowY || ''
      });
    }

    const interactionStates = getInteractionStates(node);
    if (shouldCaptureInteractionState(node, computedStyle, interactionStates)) {
      captureInteractionSnapshot(node, interactionStates);
    }

    ['::before', '::after', '::placeholder'].forEach((pseudo) => {
      const pseudoStyle = window.getComputedStyle(node, pseudo);
      if (!shouldCapturePseudo(node, pseudoStyle, pseudo)) {
        return;
      }

      restoreNodeId = restoreNodeId || `restore-node-${index}`;
      clonedNode.setAttribute('data-restore-node-id', restoreNodeId);
      const serializedPseudoStyle = serializeStyleProperties(pseudoStyle, PSEUDO_STYLE_PROPERTIES);
      pseudoElementSnapshots.push({
        id: restoreNodeId,
        pseudo,
        style: pseudo === '::placeholder' && !serializedPseudoStyle.trim()
          ? 'color:#bfbfbf;opacity:1'
          : serializedPseudoStyle
      });
    });
  });

  const originalActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const sampledFocusElements = new WeakSet();
  Array.from(document.querySelectorAll('input, textarea, select, button, a[href], [tabindex], [role="button"], [role="tab"], [role="option"], [role="menuitem"], [contenteditable="true"], summary'))
    .filter(isFocusableCandidate)
    .slice(0, 40)
    .forEach((element) => {
      if (!(element instanceof HTMLElement) || sampledFocusElements.has(element)) {
        return;
      }

      sampledFocusElements.add(element);

      const viewportScrollTop = Math.round(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0);
      const viewportScrollLeft = Math.round(window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0);

      try {
        element.focus({ preventScroll: true });
      } catch (error) {
        try {
          element.focus();
        } catch (nestedError) {
          return;
        }
      }

      if (document.activeElement === element || element.matches(':focus')) {
        captureInteractionSnapshot(element, ['focus', 'sampled']);

        let parent = element.parentElement;
        let depth = 0;
        while (parent && depth < 3) {
          if (parent.matches(':focus-within')) {
            captureInteractionSnapshot(parent, ['focus-within', 'sampled']);
          }
          parent = parent.parentElement;
          depth += 1;
        }
      }

      window.scrollTo({ top: viewportScrollTop, left: viewportScrollLeft, behavior: 'auto' });
    });

  if (originalActiveElement && typeof originalActiveElement.focus === 'function') {
    try {
      originalActiveElement.focus({ preventScroll: true });
    } catch (error) {
      try {
        originalActiveElement.focus();
      } catch (nestedError) {
      }
    }
  } else if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }

  markDropdownSemantics();
  markCollapseSemantics();
  markTabSemantics();
  markCarouselSemantics();
  markModalSemantics();
  await sampleInteractiveComponentStates();

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => reject(reader.error || new Error('blob 转 data url 失败'));
    reader.readAsDataURL(blob);
  });
  const isCriticalImageElement = (element) => {
    if (!(element instanceof HTMLImageElement)) {
      return false;
    }

    const src = String(element.currentSrc || element.getAttribute('src') || '').trim().toLowerCase();
    const alt = String(element.getAttribute('alt') || '').trim().toLowerCase();
    const className = typeof element.className === 'string' ? element.className.toLowerCase() : '';
    const role = String(element.getAttribute('role') || '').trim().toLowerCase();
    const ariaLabel = String(element.getAttribute('aria-label') || '').trim().toLowerCase();
    const title = String(element.getAttribute('title') || '').trim().toLowerCase();
    const testId = String(element.getAttribute('data-testid') || '').trim().toLowerCase();
    const parent = element.parentElement;
    const parentRole = String(parent?.getAttribute?.('role') || '').trim().toLowerCase();
    const parentClassName = typeof parent?.className === 'string' ? parent.className.toLowerCase() : '';
    const labelText = [src, alt, className, role, ariaLabel, title, testId, parentRole, parentClassName].join(' ');

    return /(logo|avatar|supplier|company|店铺|商家|供应商)/.test(labelText)
      || src.includes('fss-css.yzw.cn');
  };
  const shouldSnapshotImageElement = (element, rect, forceSnapshot = false) => {
    if (!(element instanceof HTMLImageElement)) {
      return false;
    }

    const hasImageData = element.complete
      && element.currentSrc
      && element.naturalWidth > 0
      && element.naturalHeight > 0;
    if (!hasImageData) {
      return false;
    }

    const visibleInLayout = rect.width > 0 && rect.height > 0;
    if (!visibleInLayout) {
      return false;
    }

    return forceSnapshot
      || isCriticalImageElement(element)
      || (rect.width <= 256 && rect.height <= 256);
  };
  const captureElementAssetDataUrl = async (element) => {
    if (!(element instanceof HTMLImageElement)) {
      return null;
    }

    if (!element.currentSrc || !element.naturalWidth || !element.naturalHeight) {
      return null;
    }

    try {
      const response = await fetch(element.currentSrc, { credentials: 'include' });
      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        if (dataUrl) {
          return dataUrl;
        }
      }
    } catch (error) {
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = element.naturalWidth;
      canvas.height = element.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.drawImage(element, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      return null;
    }
  };
  const imageCandidates = originalNodes.filter((node) => node instanceof HTMLImageElement);
  for (let index = 0; index < imageCandidates.length; index += 1) {
    const element = imageCandidates[index];
    const clonedElement = clonedNodes[originalNodeIndexMap.get(element)];
    if (!(element instanceof HTMLImageElement) || !(clonedElement instanceof HTMLImageElement)) {
      continue;
    }

    const rect = element.getBoundingClientRect();
    const shouldSnapshotImage = shouldSnapshotImageElement(element, rect, forcedRegionNodes.has(element));
    if (!shouldSnapshotImage) {
      continue;
    }

    const dataUrl = await captureElementAssetDataUrl(element);
    if (!dataUrl) {
      continue;
    }

    const restoreNodeId = clonedElement.getAttribute('data-restore-node-id') || `restore-node-image-${index}`;
    clonedElement.setAttribute('data-restore-node-id', restoreNodeId);
    browserAssetSnapshots.push({
      id: restoreNodeId,
      attr: 'src',
      dataUrl
    });
  }

  const htmlComputedStyle = window.getComputedStyle(document.documentElement);
  const bodyComputedStyle = window.getComputedStyle(document.body);

  const clonedHtml = clonedRoot.outerHTML;
  const stylesheetsPayload = capturedStylesheets.length ? capturedStylesheets : stylesheetLinks;
  const stashHtmlKey = String(options.stashHtmlKey || '').trim();
  const stashMetadataKey = String(options.stashMetadataKey || '').trim();
  const stashStylesheetsKey = String(options.stashStylesheetsKey || '').trim();
  const buildLocalStashElementId = (cacheType, cacheKey) => `__proto-capture-stash-${String(cacheType || 'payload')}-${String(cacheKey || '')}`;
  const stashLocalPayload = (cacheType, cacheKey, payload) => {
    const root = document.documentElement || document.body;
    if (!root || !cacheKey) {
      return 0;
    }

    const elementId = buildLocalStashElementId(cacheType, cacheKey);
    let element = document.getElementById(elementId);
    if (!(element instanceof HTMLScriptElement)) {
      element = document.createElement('script');
      element.id = elementId;
      element.type = 'application/json';
      element.setAttribute('data-proto-capture-stash', String(cacheType || 'payload'));
      element.style.display = 'none';
      root.appendChild(element);
    }

    element.textContent = String(payload || '');
    return element.textContent.length;
  };
  if (stashHtmlKey) {
    stashLocalPayload('html', stashHtmlKey, clonedHtml);
  }
  const basicMetadata = {
    capturedAt: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    document: {
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scrollTop: Math.round(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0),
      scrollLeft: Math.round(window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0)
    },
    styleTagCount: document.querySelectorAll('style').length,
    stylesheetCount: stylesheetLinks.length,
    capturedStylesheetCount: capturedStylesheets.length
  };
  const payloadMetadata = options.lightweightMetadata
    ? {
      ...basicMetadata,
      runtimeStyleTextCount: 0,
      runtimeStyleTexts: []
    }
    : {
      ...basicMetadata,
      runtimeStyleTextCount: runtimeStyleTexts.length,
      rootSnapshot: {
        html: {
          attributes: copyAttributes(document.documentElement),
          computedStyle: serializeStyleProperties(htmlComputedStyle, ROOT_STYLE_PROPERTIES)
        },
        body: {
          attributes: copyAttributes(document.body),
          computedStyle: serializeStyleProperties(bodyComputedStyle, ROOT_STYLE_PROPERTIES)
        }
      },
      fallbackNodeSnapshots,
      layoutNodeSnapshots,
      scrollContainerSnapshots,
      interactionStateSnapshots,
      sampledContentSnapshots,
      pseudoElementSnapshots,
      browserAssetSnapshots,
      runtimeStyleTexts
    };
  const payloadMetadataJson = JSON.stringify(payloadMetadata);
  if (stashMetadataKey) {
    stashLocalPayload('metadata', stashMetadataKey, payloadMetadataJson);
  }
  const stylesheetsPayloadJson = JSON.stringify(stylesheetsPayload);
  if (stashStylesheetsKey) {
    stashLocalPayload('stylesheets', stashStylesheetsKey, stylesheetsPayloadJson);
  }
  const basePayload = {
    url: window.location.href,
    title: document.title,
    htmlLength: clonedHtml.length,
    metadataLength: payloadMetadataJson.length,
    stylesheetsLength: stylesheetsPayloadJson.length,
    ...(stashStylesheetsKey ? {} : { stylesheets: stylesheetsPayload }),
    ...(stashMetadataKey ? {} : { metadata: payloadMetadata })
  };

  if (typeof options.htmlSliceStart === 'number' || typeof options.htmlSliceEnd === 'number') {
    const sliceStart = Math.max(0, Number(options.htmlSliceStart) || 0);
    const sliceEnd = Math.max(sliceStart, Number(options.htmlSliceEnd) || clonedHtml.length);
    return options.omitMetadata
      ? { htmlChunk: clonedHtml.slice(sliceStart, sliceEnd), htmlLength: clonedHtml.length }
      : { ...basePayload, htmlChunk: clonedHtml.slice(sliceStart, sliceEnd) };
  }

  if (options.omitHtml) {
    return basePayload;
  }

  return {
    ...basePayload,
    html: clonedHtml
  };
}

async function collectBasicPagePayload(options = {}) {
  const runtimeGeneratedClassPatterns = [
    /^(?:css|r|store)-[a-z0-9_-]{4,}$/i,
    /^go\d{6,}$/i,
    /^(?:jsx|emotion|chakra|mantine|sc)-[a-z0-9_-]{4,}$/i
  ];
  const isRuntimeGeneratedClassNameLocal = (className = '') => {
    const normalized = String(className || '').trim();
    if (!normalized) {
      return false;
    }

    return runtimeGeneratedClassPatterns.some((pattern) => pattern.test(normalized));
  };

  function serializeStylesheetRules(stylesheet) {
    try {
      return Array.from(stylesheet?.cssRules || [])
        .map((rule) => rule.cssText || '')
        .filter(Boolean)
        .join('\n');
    } catch (error) {
      return '';
    }
  }

  function collectMatchingCssRules(rules, targetClassNames) {
    if (!rules?.length || !targetClassNames?.size) {
      return '';
    }

    const collectedRules = [];
    const matchesTargetClass = (cssText) => Array.from(targetClassNames).some((className) => cssText.includes(`.${className}`));

    Array.from(rules).forEach((rule) => {
      const cssText = rule?.cssText || '';
      if (!cssText) {
        return;
      }

      if (rule.cssRules?.length) {
        const nestedCssText = collectMatchingCssRules(rule.cssRules, targetClassNames);
        if (!nestedCssText) {
          return;
        }

        if (rule.conditionText) {
          collectedRules.push(`@${rule.constructor?.name === 'CSSSupportsRule' ? 'supports' : 'media'} ${rule.conditionText}{${nestedCssText}}`);
          return;
        }

        collectedRules.push(nestedCssText);
        return;
      }

      if (matchesTargetClass(cssText)) {
        collectedRules.push(cssText);
      }
    });

    return collectedRules.join('\n');
  }

  function extractRuntimeGeneratedClassNames(root) {
    const classNames = new Set();
    const collectFromElement = (element) => {
      const rawClassName = typeof element?.className === 'string' ? element.className : '';
      rawClassName.split(/\s+/).forEach((className) => {
        if (isRuntimeGeneratedClassNameLocal(className)) {
          classNames.add(className);
        }
      });
    };

    if (root instanceof Element) {
      collectFromElement(root);
      root.querySelectorAll('*').forEach((element) => collectFromElement(element));
    }

    return classNames;
  }

  function collectRuntimeStyleTexts(targetClassNames = new Set()) {
    const runtimeCssBlocks = [];
    const seenCssTexts = new Set();
    let totalCssLength = 0;
    const MAX_RUNTIME_STYLE_TEXTS = 80;
    const MAX_RUNTIME_STYLE_LENGTH = 10000000;
    const normalizeCssText = (cssText) => String(cssText || '').replace(/\s+/g, ' ').trim();
    const pushCssText = (cssText) => {
      const normalizedCssText = String(cssText || '').trim();
      if (!normalizedCssText || seenCssTexts.has(normalizedCssText)) {
        return;
      }

      if (runtimeCssBlocks.length >= MAX_RUNTIME_STYLE_TEXTS) {
        return;
      }

      if (totalCssLength + normalizedCssText.length > MAX_RUNTIME_STYLE_LENGTH) {
        return;
      }

      seenCssTexts.add(normalizedCssText);
      runtimeCssBlocks.push(normalizedCssText);
      totalCssLength += normalizedCssText.length;
    };

    Array.from(document.styleSheets || []).forEach((stylesheet) => {
      const ownerNode = stylesheet?.ownerNode || null;
      const tagName = ownerNode?.tagName?.toLowerCase() || '';
      const href = String(stylesheet?.href || ownerNode?.href || '').trim();
      const inlineCssText = String(ownerNode?.textContent || '').trim();
      const serializedCssText = serializeStylesheetRules(stylesheet);
      const matchingCssText = collectMatchingCssRules(stylesheet?.cssRules, targetClassNames);
      const normalizedInlineCssText = normalizeCssText(inlineCssText);
      const normalizedSerializedCssText = normalizeCssText(serializedCssText);

      if (tagName === 'style') {
        if (matchingCssText.trim() && !normalizedSerializedCssText.includes(normalizeCssText(matchingCssText))) {
          pushCssText(matchingCssText);
        }
        if (inlineCssText.trim() && inlineCssText.length <= 200000) {
          pushCssText(inlineCssText);
        }

        if (normalizedSerializedCssText
          && normalizedSerializedCssText !== normalizedInlineCssText
          && serializedCssText.length <= 200000) {
          pushCssText(serializedCssText);
        } else if (!normalizedInlineCssText && serializedCssText.trim() && serializedCssText.length <= 200000) {
          pushCssText(serializedCssText);
        }
        return;
      }

      if (href) {
        if (matchingCssText.trim()) {
          pushCssText(matchingCssText);
        }
        return;
      }

      pushCssText(serializedCssText);
      if (matchingCssText.trim() && !normalizedSerializedCssText.includes(normalizeCssText(matchingCssText))) {
        pushCssText(matchingCssText);
      }
    });

    Array.from(document.adoptedStyleSheets || []).forEach((stylesheet) => {
      pushCssText(serializeStylesheetRules(stylesheet));
      pushCssText(collectMatchingCssRules(stylesheet?.cssRules, targetClassNames));
    });

    if (!runtimeCssBlocks.length) {
      Array.from(document.querySelectorAll('style')).forEach((styleNode) => {
        const cssText = String(styleNode?.textContent || '').trim();
        if (cssText.length <= 200000) {
          pushCssText(cssText);
        }
      });
    }

    if (!runtimeCssBlocks.length) {
      const inlineStyleRules = Array.from(document.querySelectorAll('[style]'))
        .slice(0, 240)
        .map((element) => {
          const inlineStyle = String(element.getAttribute('style') || '').trim();
          if (!inlineStyle) {
            return '';
          }

          const tagName = String(element.tagName || 'div').toLowerCase();
          const idSelector = element.id ? `#${element.id}` : '';
          const classSelector = String(element.className || '').trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .map((className) => `.${className}`)
            .join('');
          return `${tagName}${idSelector}${classSelector}{${inlineStyle}}`;
        })
        .filter(Boolean)
        .join('\n');
      pushCssText(inlineStyleRules);
    }

    return runtimeCssBlocks;
  }

  async function collectBrowserStylesheetPayloads(stylesheetLinks) {
    const collectedStylesheets = [];
    const seenHrefs = new Set();

    for (const stylesheet of Array.from(stylesheetLinks || [])) {
      const href = String(stylesheet?.href || '').trim();
      if (!href || seenHrefs.has(href)) {
        continue;
      }

      seenHrefs.add(href);

      try {
        const response = await fetch(href, {
          credentials: 'include',
          cache: 'force-cache'
        });

        if (!response.ok) {
          continue;
        }

        const cssText = await response.text();
        if (!String(cssText || '').trim()) {
          continue;
        }

        collectedStylesheets.push({
          href,
          media: stylesheet?.media || 'all',
          cssText
        });
      } catch (error) {
      }
    }

    return collectedStylesheets;
  }

  const html = document.documentElement?.outerHTML || '';
  const runtimeGeneratedClassNames = extractRuntimeGeneratedClassNames(document.documentElement);
  const stylesheetLinks = Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).map((node) => ({
    href: node.href,
    media: node.media || 'all'
  }));
  const capturedStylesheets = await collectBrowserStylesheetPayloads(stylesheetLinks);
  const runtimeStyleTexts = collectRuntimeStyleTexts(runtimeGeneratedClassNames);

  const payloadMetadata = {
    capturedAt: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    document: {
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scrollTop: Math.round(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0),
      scrollLeft: Math.round(window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0)
    },
    stylesheetCount: stylesheetLinks.length,
    capturedStylesheetCount: capturedStylesheets.length,
    runtimeStyleTextCount: runtimeStyleTexts.length,
    runtimeStyleTexts,
    fallbackCapture: true
  };
  const stylesheetsPayload = capturedStylesheets.length ? capturedStylesheets : stylesheetLinks;
  const stashMetadataKey = String(options.stashMetadataKey || '').trim();
  const stashStylesheetsKey = String(options.stashStylesheetsKey || '').trim();
  const stashLocalPayload = (cacheType, cacheKey, payload) => {
    const root = document.documentElement || document.body;
    if (!root || !cacheKey) {
      return 0;
    }

    const elementId = `__proto-capture-stash-${String(cacheType || 'payload')}-${String(cacheKey || '')}`;
    let element = document.getElementById(elementId);
    if (!(element instanceof HTMLScriptElement)) {
      element = document.createElement('script');
      element.id = elementId;
      element.type = 'application/json';
      element.setAttribute('data-proto-capture-stash', String(cacheType || 'payload'));
      element.style.display = 'none';
      root.appendChild(element);
    }

    element.textContent = String(payload || '');
    return element.textContent.length;
  };
  const payloadMetadataJson = JSON.stringify(payloadMetadata);
  const stylesheetsPayloadJson = JSON.stringify(stylesheetsPayload);

  if (stashMetadataKey) {
    stashLocalPayload('metadata', stashMetadataKey, payloadMetadataJson);
  }

  if (stashStylesheetsKey) {
    stashLocalPayload('stylesheets', stashStylesheetsKey, stylesheetsPayloadJson);
  }

  const basePayload = {
    url: window.location.href,
    title: document.title,
    htmlLength: html.length,
    metadataLength: payloadMetadataJson.length,
    stylesheetsLength: stylesheetsPayloadJson.length,
    ...(stashStylesheetsKey ? {} : { stylesheets: stylesheetsPayload }),
    ...(stashMetadataKey ? {} : { metadata: payloadMetadata })
  };

  if (options.omitHtml) {
    return basePayload;
  }

  return {
    ...basePayload,
    html
  };
}

function discoverPageTabs() {
  const normalizeLabel = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const buildSlug = (value, index) => {
    const normalized = normalizeLabel(value)
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || `tab-${index + 1}`;
  };
  const isVisible = (element) => {
    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const isDisabled = (element) => element.hasAttribute('disabled')
    || element.getAttribute('aria-disabled') === 'true'
    || element.classList.contains('disabled')
    || element.classList.contains('is-disabled');
  const getContainer = (element) => element.closest('[role="tablist"], .ant-tabs-nav, .ant-tabs-nav-list, .el-tabs__nav, .ivu-tabs-nav, .MuiTabs-flexContainer, .tabs-header, .tab-header, .tab-list')
    || element.parentElement;
  const getContainerKey = (element, index) => {
    const container = getContainer(element);
    const containerText = normalizeLabel(container?.className || container?.id || `container-${index}`);
    return `${containerText}-${Math.round(container?.getBoundingClientRect().top || 0)}`;
  };
  const isActiveTab = (element) => element.getAttribute('aria-selected') === 'true'
    || element.classList.contains('ant-tabs-tab-active')
    || element.classList.contains('is-active')
    || element.classList.contains('active')
    || element.classList.contains('Mui-selected');
  const selectors = [
    '[role="tab"]',
    '.ant-tabs-tab',
    '.el-tabs__item',
    '.ivu-tabs-tab',
    '.MuiTab-root',
    '.tabs-header .tab',
    '.tab-header .tab',
    '.tab-item'
  ];

  const candidates = Array.from(document.querySelectorAll(selectors.join(',')))
    .filter((element) => isVisible(element) && !isDisabled(element))
    .map((element, index) => {
      const label = normalizeLabel(element.getAttribute('aria-label') || element.textContent);
      return {
        index,
        label,
        containerKey: getContainerKey(element, index),
        active: isActiveTab(element)
      };
    })
    .filter((item) => item.label && item.label.length <= 40);

  const groupedCandidates = new Map();
  candidates.forEach((candidate) => {
    const existing = groupedCandidates.get(candidate.containerKey) || [];
    existing.push(candidate);
    groupedCandidates.set(candidate.containerKey, existing);
  });

  const selectedGroup = Array.from(groupedCandidates.values())
    .filter((group) => group.length > 1)
    .sort((left, right) => right.length - left.length)[0];

  if (!selectedGroup) {
    return {
      hasMultipleTabs: false,
      total: 1,
      tabs: []
    };
  }

  return {
    hasMultipleTabs: true,
    total: selectedGroup.length,
    tabs: selectedGroup.map((candidate, index) => ({
      order: index,
      label: candidate.label,
      slug: buildSlug(candidate.label, index),
      active: candidate.active
    }))
  };
}

async function activatePageTab(targetOrder) {
  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
  const normalizeLabel = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const buildSlug = (value, index) => {
    const normalized = normalizeLabel(value)
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || `tab-${index + 1}`;
  };
  const isVisible = (element) => {
    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const isDisabled = (element) => element.hasAttribute('disabled')
    || element.getAttribute('aria-disabled') === 'true'
    || element.classList.contains('disabled')
    || element.classList.contains('is-disabled');
  const getContainer = (element) => element.closest('[role="tablist"], .ant-tabs-nav, .ant-tabs-nav-list, .el-tabs__nav, .ivu-tabs-nav, .MuiTabs-flexContainer, .tabs-header, .tab-header, .tab-list')
    || element.parentElement;
  const getContainerKey = (element, index) => {
    const container = getContainer(element);
    const containerText = normalizeLabel(container?.className || container?.id || `container-${index}`);
    return `${containerText}-${Math.round(container?.getBoundingClientRect().top || 0)}`;
  };
  const isActiveTab = (element) => element.getAttribute('aria-selected') === 'true'
    || element.classList.contains('ant-tabs-tab-active')
    || element.classList.contains('is-active')
    || element.classList.contains('active')
    || element.classList.contains('Mui-selected');
  const selectors = [
    '[role="tab"]',
    '.ant-tabs-tab',
    '.el-tabs__item',
    '.ivu-tabs-tab',
    '.MuiTab-root',
    '.tabs-header .tab',
    '.tab-header .tab',
    '.tab-item'
  ];
  const candidates = Array.from(document.querySelectorAll(selectors.join(',')))
    .filter((element) => isVisible(element) && !isDisabled(element))
    .map((element, index) => ({
      index,
      label: normalizeLabel(element.getAttribute('aria-label') || element.textContent),
      containerKey: getContainerKey(element, index),
      active: isActiveTab(element),
      element
    }))
    .filter((item) => item.label && item.label.length <= 40);

  const groupedCandidates = new Map();
  candidates.forEach((candidate) => {
    const existing = groupedCandidates.get(candidate.containerKey) || [];
    existing.push(candidate);
    groupedCandidates.set(candidate.containerKey, existing);
  });

  const selectedGroup = Array.from(groupedCandidates.values())
    .filter((group) => group.length > 1)
    .sort((left, right) => right.length - left.length)[0];

  if (!selectedGroup) {
    return { ok: false, message: '页面中未检测到可切换的多标签结构' };
  }

  const tabInfo = selectedGroup[targetOrder];

  if (!tabInfo) {
    return { ok: false, message: '未找到目标标签页' };
  }

  if (tabInfo.active) {
    return {
      ok: true,
      label: tabInfo.label,
      slug: buildSlug(tabInfo.label, targetOrder),
      order: targetOrder,
      total: selectedGroup.length
    };
  }

  const targetElement = tabInfo.element;

  if (!targetElement) {
    return { ok: false, message: '未找到可点击的标签页元素' };
  }

  targetElement.scrollIntoView({ block: 'center', inline: 'center' });
  targetElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  targetElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  targetElement.click();
  await wait(450);

  return {
    ok: true,
    label: tabInfo.label,
    slug: buildSlug(tabInfo.label, targetOrder),
    order: targetOrder,
    total: selectedGroup.length
  };
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('未找到当前激活标签页');
  }

  return tab;
}

async function executePageScript(tabId, func, args = []) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args
  });

  return results[0]?.result;
}

async function warmupPageForCapture(tabId) {
  return executePageScript(tabId, async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const scrollingElement = document.scrollingElement || document.documentElement || document.body;
    const viewportHeight = Math.max(window.innerHeight || 0, 1);
    const maxScrollTop = Math.max(0, scrollingElement.scrollHeight - viewportHeight);
    const originalScrollTop = Math.max(
      0,
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    );
    const originalScrollLeft = Math.max(
      0,
      window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0
    );
    const metrics = {
      promotedImageSrc: 0,
      promotedImageSrcset: 0,
      promotedBackground: 0,
      promotedIframe: 0,
      promotedGenericSrc: 0
    };
    const isMeaningfulUrl = (value) => {
      const normalized = String(value || '').trim();
      return Boolean(normalized)
        && !normalized.startsWith('data:')
        && !normalized.startsWith('blob:')
        && !normalized.startsWith('javascript:')
        && !normalized.startsWith('#');
    };
    const pickFirstAttrValue = (element, attributeNames = []) => {
      for (const attributeName of attributeNames) {
        const value = String(element.getAttribute(attributeName) || '').trim();
        if (isMeaningfulUrl(value)) {
          return value;
        }
      }
      return '';
    };
    const markEager = (element) => {
      if (!(element instanceof Element)) {
        return;
      }

      if (element.hasAttribute('loading')) {
        element.setAttribute('loading', 'eager');
      }

      if (element.hasAttribute('fetchpriority')) {
        element.setAttribute('fetchpriority', 'high');
      } else {
        try {
          element.fetchPriority = 'high';
        } catch (_error) {
        }
      }
    };
    const applyLazyImageAttributes = (image) => {
      if (!(image instanceof HTMLImageElement)) {
        return false;
      }

      markEager(image);
      image.decoding = 'sync';
      let changed = false;
      const srcCandidate = pickFirstAttrValue(image, [
        'data-src',
        'data-original',
        'data-lazy-src',
        'data-lazyload',
        'data-echo',
        'data-url',
        'data-image',
        'data-background-image',
        'data-srcset-candidate'
      ]);
      const currentSrc = String(image.getAttribute('src') || '').trim();
      if (srcCandidate && (!isMeaningfulUrl(currentSrc) || currentSrc !== srcCandidate)) {
        image.setAttribute('src', srcCandidate);
        changed = true;
        metrics.promotedImageSrc += 1;
      }

      const srcsetCandidate = pickFirstAttrValue(image, ['data-srcset', 'data-lazy-srcset', 'data-original-srcset']);
      if (srcsetCandidate && srcsetCandidate !== String(image.getAttribute('srcset') || '').trim()) {
        image.setAttribute('srcset', srcsetCandidate);
        changed = true;
        metrics.promotedImageSrcset += 1;
      }

      const posterCandidate = pickFirstAttrValue(image, ['data-poster']);
      if (posterCandidate && posterCandidate !== String(image.getAttribute('poster') || '').trim()) {
        image.setAttribute('poster', posterCandidate);
        changed = true;
      }

      return changed;
    };
    const applyLazySourceAttributes = (source) => {
      if (!(source instanceof HTMLSourceElement)) {
        return false;
      }

      let changed = false;
      const srcsetCandidate = pickFirstAttrValue(source, ['data-srcset', 'data-lazy-srcset', 'data-original-srcset']);
      if (srcsetCandidate && srcsetCandidate !== String(source.getAttribute('srcset') || '').trim()) {
        source.setAttribute('srcset', srcsetCandidate);
        changed = true;
        metrics.promotedImageSrcset += 1;
      }

      const srcCandidate = pickFirstAttrValue(source, ['data-src', 'data-original', 'data-lazy-src']);
      if (srcCandidate && srcCandidate !== String(source.getAttribute('src') || '').trim()) {
        source.setAttribute('src', srcCandidate);
        changed = true;
        metrics.promotedImageSrc += 1;
      }

      return changed;
    };
    const applyLazyIframeAttributes = (iframe) => {
      if (!(iframe instanceof HTMLIFrameElement)) {
        return false;
      }

      markEager(iframe);
      const srcCandidate = pickFirstAttrValue(iframe, ['data-src', 'data-lazy-src', 'data-original']);
      const currentSrc = String(iframe.getAttribute('src') || '').trim();
      if (!srcCandidate || (isMeaningfulUrl(currentSrc) && currentSrc === srcCandidate)) {
        return false;
      }

      iframe.setAttribute('src', srcCandidate);
      metrics.promotedIframe += 1;
      return true;
    };
    const applyLazyBackgroundAttributes = (element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const backgroundCandidate = pickFirstAttrValue(element, [
        'data-bg',
        'data-background',
        'data-background-image',
        'data-lazy-bg',
        'data-lazy-background',
        'data-image',
        'data-cover',
        'data-thumb',
        'data-poster'
      ]);
      if (!backgroundCandidate) {
        return false;
      }

      const computedStyle = window.getComputedStyle(element);
      const currentBackgroundImage = String(element.style.backgroundImage || computedStyle.backgroundImage || '').trim();
      if (currentBackgroundImage && currentBackgroundImage !== 'none' && /url\(/i.test(currentBackgroundImage)) {
        return false;
      }

      element.style.backgroundImage = `url("${backgroundCandidate}")`;
      metrics.promotedBackground += 1;
      return true;
    };
    const applyGenericSourceAttributes = (element) => {
      if (!(element instanceof Element)) {
        return false;
      }

      if (element instanceof HTMLImageElement || element instanceof HTMLSourceElement || element instanceof HTMLIFrameElement) {
        return false;
      }

      const currentSrc = String(element.getAttribute('src') || '').trim();
      if (isMeaningfulUrl(currentSrc)) {
        return false;
      }

      const srcCandidate = pickFirstAttrValue(element, ['data-src', 'data-original', 'data-lazy-src', 'data-url']);
      if (!srcCandidate) {
        return false;
      }

      if (element.hasAttribute('src')) {
        element.setAttribute('src', srcCandidate);
      } else if (element.hasAttribute('href')) {
        element.setAttribute('href', srcCandidate);
      } else {
        return false;
      }

      metrics.promotedGenericSrc += 1;
      return true;
    };
    const upgradeLazyNodes = (scope = document) => {
      let changedCount = 0;
      const root = scope instanceof Document || scope instanceof Element ? scope : document;

      root.querySelectorAll('img').forEach((image) => {
        if (applyLazyImageAttributes(image)) {
          changedCount += 1;
        }
      });
      root.querySelectorAll('picture source, source').forEach((source) => {
        if (applyLazySourceAttributes(source)) {
          changedCount += 1;
        }
      });
      root.querySelectorAll('iframe').forEach((iframe) => {
        if (applyLazyIframeAttributes(iframe)) {
          changedCount += 1;
        }
      });
      root.querySelectorAll('[data-bg], [data-background], [data-background-image], [data-lazy-bg], [data-lazy-background], [data-image], [data-cover], [data-thumb], [data-poster]').forEach((element) => {
        if (applyLazyBackgroundAttributes(element)) {
          changedCount += 1;
        }
      });
      root.querySelectorAll('[data-src], [data-original], [data-lazy-src], [data-url]').forEach((element) => {
        if (applyGenericSourceAttributes(element)) {
          changedCount += 1;
        }
      });
      return changedCount;
    };
    const settleImage = async (image) => {
      if (!(image instanceof HTMLImageElement)) {
        return;
      }

      applyLazyImageAttributes(image);
      try {
        if (typeof image.decode === 'function') {
          await image.decode();
          return;
        }
      } catch (_error) {
      }

      if (!image.complete) {
        await new Promise((resolve) => {
          const done = () => resolve();
          image.addEventListener('load', done, { once: true });
          image.addEventListener('error', done, { once: true });
          setTimeout(done, 1200);
        });
      }
    };
    const settleMediaElement = async (element) => {
      if (!(element instanceof HTMLVideoElement || element instanceof HTMLAudioElement)) {
        return;
      }

      markEager(element);
      if (element.preload !== 'auto') {
        element.preload = 'auto';
      }
      try {
        element.load?.();
      } catch (_error) {
      }
    };
    const waitForDomQuiet = async (maxWaitMs = 900, quietWindowMs = 220) => {
      const MutationObserverCtor = window.MutationObserver || window.WebKitMutationObserver;
      if (!MutationObserverCtor) {
        await wait(Math.min(maxWaitMs, quietWindowMs));
        return;
      }

      await new Promise((resolve) => {
        let quietTimer = null;
        let done = false;
        const cleanup = () => {
          if (done) {
            return;
          }
          done = true;
          if (quietTimer) {
            clearTimeout(quietTimer);
            quietTimer = null;
          }
          observer.disconnect();
          resolve();
        };
        const resetQuietTimer = () => {
          if (quietTimer) {
            clearTimeout(quietTimer);
          }
          quietTimer = setTimeout(() => cleanup(), quietWindowMs);
        };
        const observer = new MutationObserverCtor(() => {
          resetQuietTimer();
        });

        observer.observe(document.documentElement || document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: false
        });

        resetQuietTimer();
        setTimeout(() => cleanup(), maxWaitMs);
      });
    };
    const dispatchWarmupEvents = () => {
      try {
        window.dispatchEvent(new Event('scroll'));
      } catch (_error) {
      }
      try {
        window.dispatchEvent(new Event('resize'));
      } catch (_error) {
      }
      try {
        window.dispatchEvent(new Event('mousemove'));
      } catch (_error) {
      }
      try {
        window.dispatchEvent(new Event('touchstart'));
      } catch (_error) {
      }
    };
    const settleRound = async () => {
      upgradeLazyNodes(document);
      dispatchWarmupEvents();
      await waitForDomQuiet(1000, 220);
      await Promise.all(Array.from(document.images || []).map((image) => settleImage(image)));
      await Promise.all(Array.from(document.querySelectorAll('video, audio')).map((media) => settleMediaElement(media)));
      await wait(120);
      upgradeLazyNodes(document);
      dispatchWarmupEvents();
      await waitForDomQuiet(700, 180);
      await Promise.all(Array.from(document.images || []).map((image) => settleImage(image)));
    };

    const scrollStops = [];
    const desiredStep = Math.max(280, Math.round(viewportHeight * 0.75));
    const maxSteps = Math.max(1, Math.min(24, Math.ceil(maxScrollTop / desiredStep) + 1));

    for (let step = 0; step < maxSteps; step += 1) {
      const nextTop = step === maxSteps - 1
        ? maxScrollTop
        : Math.min(maxScrollTop, step * desiredStep);
      scrollStops.push(nextTop);
    }

    const uniqueScrollStops = Array.from(new Set(scrollStops));
    await settleRound();

    for (const scrollTop of uniqueScrollStops) {
      window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
      dispatchWarmupEvents();
      await wait(180);
      await settleRound();
      await wait(120);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    dispatchWarmupEvents();
    await settleRound();
    await wait(120);
    window.scrollTo({ top: Math.min(originalScrollTop, maxScrollTop), left: Math.max(0, originalScrollLeft), behavior: 'auto' });
    dispatchWarmupEvents();
    await wait(100);

    return {
      warmed: true,
      maxScrollTop,
      stepCount: uniqueScrollStops.length,
      lazyWarmupMetrics: metrics
    };
  });
}

async function collectLargePagePayloadInChunks(tabId) {
  const stashKeys = {
    html: `html-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    metadata: `metadata-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    stylesheets: `stylesheets-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  };

  let pageMetaPayload = await executePageScript(tabId, collectPagePayload, [{
    omitHtml: true,
    lightweightMetadata: false,
    stashHtmlKey: stashKeys.html,
    stashMetadataKey: stashKeys.metadata,
    stashStylesheetsKey: stashKeys.stylesheets
  }]);
  let pageMeta = pageMetaPayload ? {
    ok: true,
    url: pageMetaPayload.url,
    title: pageMetaPayload.title,
    htmlLength: pageMetaPayload.htmlLength,
    metadataLength: pageMetaPayload.metadataLength || 0,
    stylesheetsLength: pageMetaPayload.stylesheetsLength || 0
  } : null;
  let useDirectHtmlRead = false;
  let fallbackMetadata = null;
  let fallbackStylesheets = null;

  if (!pageMeta?.ok || !pageMeta?.htmlLength) {
    console.warn('[proto-capture] chunked preflight returned empty htmlLength', { tabId, pageMeta, pageMetaPayload });

    try {
      pageMetaPayload = await executePageScript(tabId, collectBasicPagePayload, [{
        omitHtml: true,
        stashMetadataKey: stashKeys.metadata,
        stashStylesheetsKey: stashKeys.stylesheets
      }]);
    } catch (basicError) {
      console.warn('[proto-capture] collectBasicPagePayload fallback threw', { message: basicError?.message });
      pageMetaPayload = null;
    }

    if (pageMetaPayload?.htmlLength) {
      pageMeta = {
        ok: true,
        url: pageMetaPayload.url,
        title: pageMetaPayload.title,
        htmlLength: pageMetaPayload.htmlLength,
        metadataLength: pageMetaPayload.metadataLength || 0,
        stylesheetsLength: pageMetaPayload.stylesheetsLength || 0
      };
      useDirectHtmlRead = true;
      console.info('[proto-capture] chunked fallback metadata preflight succeeded', {
        tabId,
        htmlLength: pageMeta.htmlLength,
        metadataLength: pageMeta.metadataLength || 0,
        stylesheetsLength: pageMeta.stylesheetsLength || 0
      });
    } else {
      pageMeta = await executePageScript(tabId, async (stashKeysArg) => {
        try {
          const runtimeGeneratedClassPatterns = [
            /^(?:css|r|store)-[a-z0-9_-]{4,}$/i,
            /^go\d{6,}$/i,
            /^(?:jsx|emotion|chakra|mantine|sc)-[a-z0-9_-]{4,}$/i
          ];
          const isRuntimeGeneratedClassNameLocal = (className = '') => {
            const normalized = String(className || '').trim();
            if (!normalized) {
              return false;
            }

            return runtimeGeneratedClassPatterns.some((pattern) => pattern.test(normalized));
          };
          const stylesheetLinks = Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).map((node) => ({
            href: node.href,
            media: node.media || 'all'
          }));

          let runtimeCssBlocks = [];
          try {
            const runtimeClassNames = new Set();
            const collectFromEl = (el) => {
              String(el?.getAttribute?.('class') || '').split(/\s+/).forEach((c) => {
                if (isRuntimeGeneratedClassNameLocal(c)) runtimeClassNames.add(c);
              });
            };
            collectFromEl(document.documentElement);
            Array.from(document.querySelectorAll('[class]')).forEach(collectFromEl);

            const originalNodes = Array.from(document.querySelectorAll('*'));
            const browserAssetSnapshots = [];
            const seenCss = new Set();
            let totalLen = 0;
            const pushCss = (text) => {
              const t = String(text || '').trim();
              if (!t || seenCss.has(t) || runtimeCssBlocks.length >= 80 || totalLen + t.length > 10000000) return;
              seenCss.add(t);
              runtimeCssBlocks.push(t);
              totalLen += t.length;
            };
            const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
              reader.onerror = () => reject(reader.error || new Error('blob 转 data url 失败'));
              reader.readAsDataURL(blob);
            });
            const isCriticalImageElement = (element) => {
              if (!(element instanceof HTMLImageElement)) return false;

              const src = String(element.currentSrc || element.getAttribute('src') || '').trim().toLowerCase();
              const alt = String(element.getAttribute('alt') || '').trim().toLowerCase();
              const className = typeof element.className === 'string' ? element.className.toLowerCase() : '';
              const role = String(element.getAttribute('role') || '').trim().toLowerCase();
              const ariaLabel = String(element.getAttribute('aria-label') || '').trim().toLowerCase();
              const title = String(element.getAttribute('title') || '').trim().toLowerCase();
              const testId = String(element.getAttribute('data-testid') || '').trim().toLowerCase();
              const parent = element.parentElement;
              const parentRole = String(parent?.getAttribute?.('role') || '').trim().toLowerCase();
              const parentClassName = typeof parent?.className === 'string' ? parent.className.toLowerCase() : '';
              const labelText = [src, alt, className, role, ariaLabel, title, testId, parentRole, parentClassName].join(' ');

              return /(logo|avatar|supplier|company|店铺|商家|供应商)/.test(labelText)
                || src.includes('fss-css.yzw.cn');
            };
            const shouldSnapshotImageElement = (element, rect) => {
              if (!(element instanceof HTMLImageElement)) return false;
              if (!element.complete || !element.currentSrc || !element.naturalWidth || !element.naturalHeight) return false;
              if (!(rect.width > 0 && rect.height > 0)) return false;

              return isCriticalImageElement(element)
                || (rect.width <= 256 && rect.height <= 256);
            };
            const captureElementAssetDataUrl = async (element) => {
              if (!(element instanceof HTMLImageElement)) return null;
              if (!element.currentSrc || !element.naturalWidth || !element.naturalHeight) return null;

              try {
                const response = await fetch(element.currentSrc, { credentials: 'include' });
                if (response.ok) {
                  const blob = await response.blob();
                  const dataUrl = await blobToDataUrl(blob);
                  if (dataUrl) return dataUrl;
                }
              } catch (e) { /* ignore */ }

              try {
                const canvas = document.createElement('canvas');
                canvas.width = element.naturalWidth;
                canvas.height = element.naturalHeight;
                const context = canvas.getContext('2d');
                if (!context) return null;
                context.drawImage(element, 0, 0);
                return canvas.toDataURL('image/png');
              } catch (e) {
                return null;
              }
            };

            for (let index = 0; index < originalNodes.length; index += 1) {
              const element = originalNodes[index];
              if (!(element instanceof HTMLImageElement)) {
                continue;
              }

              const rect = element.getBoundingClientRect();
              const shouldSnapshotImage = shouldSnapshotImageElement(element, rect);
              if (!shouldSnapshotImage) {
                continue;
              }

              const restoreNodeId = element.getAttribute('data-restore-node-id') || ('restore-node-fallback-image-' + index);
              element.setAttribute('data-restore-node-id', restoreNodeId);

              const dataUrl = await captureElementAssetDataUrl(element);
              if (!dataUrl) {
                continue;
              }

              browserAssetSnapshots.push({
                id: restoreNodeId,
                attr: 'src',
                dataUrl
              });
            }

            const clonedRoot = document.documentElement.cloneNode(true);
            const clonedNodes = Array.from(clonedRoot.querySelectorAll('*'));
            const layoutNodeSnapshots = [];
            const scrollContainerSnapshots = [];
            const regionKeywordPattern = /(filter|search|condition|screen|toolbar|aside|sidebar|sider|float|floating|dock|suspend|suspension|anchor|helper|guide|nav|menu|tag|chip|selector|facet|panel|recommend|recommendation|combo|bundle|product|goods|item|sku|card|carousel|swiper|gallery|detail|buy|cart|price)/i;
            const parsePixelValue = (value) => {
              const parsed = Number.parseFloat(String(value || '').trim());
              return Number.isFinite(parsed) ? parsed : 0;
            };
            const getSemanticMarker = (element) => [
              element.className,
              element.id,
              element.getAttribute('role'),
              element.getAttribute('aria-label'),
              element.getAttribute('data-testid'),
              element.getAttribute('data-role'),
              element.getAttribute('data-name')
            ].filter(Boolean).join(' ');
            const isInteractiveCandidate = (element) => {
              if (!(element instanceof Element)) return false;
              if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') return false;
              const rect = element.getBoundingClientRect();
              if (rect.width <= 0 || rect.height <= 0) return false;
              const computedStyle = window.getComputedStyle(element);
              if (computedStyle.pointerEvents === 'none' || computedStyle.visibility === 'hidden' || computedStyle.display === 'none') return false;
              if (
                element.matches('a[href], button, summary, label, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="link"], [data-hover-trigger], [data-clickable="true"]')
                || element.getAttribute('tabindex') !== null
              ) {
                return true;
              }
              const className = typeof element.className === 'string' ? element.className : '';
              return /btn|button|tab|menu|item|link|card|option|trigger|switch|checkbox|radio|select|dropdown/i.test(className)
                && computedStyle.cursor === 'pointer';
            };
            const measureTextLineCount = (element, computedStyle, rect) => {
              if (!(element instanceof Element)) return 0;
              const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
              if (!text) return 0;
              const explicitClamp = Number.parseInt(computedStyle.webkitLineClamp || '', 10);
              if (Number.isFinite(explicitClamp) && explicitClamp > 0) return explicitClamp;
              const lineHeight = parsePixelValue(computedStyle.lineHeight);
              if (lineHeight > 0 && rect.height > 0) return Math.max(1, Math.round(rect.height / lineHeight));
              const fontSize = parsePixelValue(computedStyle.fontSize);
              if (fontSize > 0 && rect.height > 0) return Math.max(1, Math.round(rect.height / (fontSize * 1.2)));
              return 1;
            };
            const isRegionRoot = (element, computedStyle) => {
              if (!(element instanceof Element)) return false;
              const semanticMarker = getSemanticMarker(element);
              if (regionKeywordPattern.test(semanticMarker)) return true;
              const rect = element.getBoundingClientRect();
              const role = element.getAttribute('role') || '';
              const className = typeof element.className === 'string' ? element.className : '';
              const semanticText = `${semanticMarker} ${className}`;
              const isFloatingRail = ['fixed', 'sticky'].includes(computedStyle.position)
                && rect.height >= 80
                && rect.width <= Math.max(window.innerWidth * 0.22, 320)
                && (rect.left <= 40 || window.innerWidth - rect.right <= 40);
              const isSearchOrSidebarRole = /search|navigation|complementary|toolbar|menu/.test(role);
              const isWideFilterBand = rect.width >= window.innerWidth * 0.55
                && rect.height >= 56
                && rect.height <= Math.max(window.innerHeight * 0.45, 220)
                && /(filter|search|condition|screen|toolbar|selector|facet|tag|chip|nav)/i.test(semanticText);
              const isSplitShell = rect.width >= window.innerWidth * 0.6
                && rect.height >= 120
                && /(layout|container|content|main|aside|sidebar|sider|panel|body|section|wrap|column|row|list|table)/i.test(semanticText);
              return isFloatingRail || isSearchOrSidebarRole || isWideFilterBand || isSplitShell;
            };
            const shouldCaptureLayoutSnapshot = (element, computedStyle, rect, options = {}) => {
              if (!(element instanceof Element) || rect.width <= 0 || rect.height <= 0) return false;
              const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
              const className = typeof element.className === 'string' ? element.className : '';
              const semanticMarker = `${getSemanticMarker(element)} ${className}`;
              const hasMeaningfulText = text.length >= 2;
              const isInteractive = isInteractiveCandidate(element);
              const isMediaNode = ['IMG', 'SVG', 'CANVAS', 'VIDEO'].includes(element.tagName);
              const isForcedRegionNode = options.forceSubtreeCapture === true;
              const hasClamp = computedStyle.webkitLineClamp && computedStyle.webkitLineClamp !== 'none';
              const parent = element.parentElement;
              const parentStyle = parent instanceof Element ? window.getComputedStyle(parent) : null;
              const display = computedStyle.display || '';
              const isFlexOrGridContainer = display.includes('flex') || display.includes('grid') || display === '-webkit-box';
              const isFlexOrGridItem = !!(parentStyle && (parentStyle.display.includes('flex') || parentStyle.display.includes('grid') || parentStyle.display === '-webkit-box'));
              const isTableLike = /table|row|cell|thead|tbody|tr|td|th|col|grid|list/.test(display)
                || /table|list|row|cell|column|thead|tbody|header|body/.test(semanticMarker);
              const hasScrollLayout = computedStyle.overflowX !== 'visible'
                || computedStyle.overflowY !== 'visible'
                || element.scrollWidth > element.clientWidth + 1
                || element.scrollHeight > element.clientHeight + 1;
              const isSplitLayoutCandidate = rect.width >= Math.max(window.innerWidth * 0.18, 220)
                && rect.height >= 40
                && /(aside|sidebar|sider|panel|main|content|body|layout|wrap|container|section|rail|column|filter|toolbar|search|result|list)/i.test(semanticMarker);
              const isTextLayoutCandidate = hasMeaningfulText && (
                rect.height >= parsePixelValue(computedStyle.fontSize) * 1.4
                || computedStyle.whiteSpace !== 'nowrap'
                || computedStyle.textOverflow !== 'clip'
                || display === '-webkit-box'
                || hasClamp
              );
              const isSemanticContainer = /(table|list|row|cell|column|header|body|wrapper|wrap|layout|container|content|main|aside|sidebar|sider|panel|toolbar|filter|search|result|card|rail|shell|section)/i.test(semanticMarker);
              const childCount = element.childElementCount || 0;
              const hasMultipleChildren = childCount >= 2;
              const hasMeaningfulArea = rect.width >= 120 || rect.height >= 32;
              const hasMeasuredColumnWidths = childCount >= 3 && rect.width >= Math.max(window.innerWidth * 0.28, 280);
              const isContainerSkeleton = hasMeaningfulArea && ((hasMultipleChildren && (isSemanticContainer || isFlexOrGridContainer || isTableLike || hasScrollLayout)) || hasMeasuredColumnWidths);
              return isForcedRegionNode || isInteractive || isMediaNode || isTextLayoutCandidate || isFlexOrGridContainer || isFlexOrGridItem || isTableLike || hasScrollLayout || isSplitLayoutCandidate || isContainerSkeleton;
            };
            const buildLayoutSnapshot = (element, computedStyle, rect) => {
              const parentRect = element.parentElement instanceof Element ? element.parentElement.getBoundingClientRect() : null;
              const parentComputedStyle = element.parentElement instanceof Element ? window.getComputedStyle(element.parentElement) : null;
              const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
              const className = typeof element.className === 'string' ? element.className : '';
              const semanticMarker = `${getSemanticMarker(element)} ${className}`;
              const lineCount = measureTextLineCount(element, computedStyle, rect);
              const hasMeaningfulText = text.length >= 2;
              const width = Math.round(rect.width);
              const height = Math.round(rect.height);
              const parentWidth = parentRect ? Math.round(parentRect.width) : 0;
              const widthRatio = parentWidth > 0 ? Number((width / parentWidth).toFixed(4)) : 0;
              const isButtonLike = isInteractiveCandidate(element) || element.matches('button, [role="button"], a[href], [role="link"]');
              const explicitClamp = Number.parseInt(computedStyle.webkitLineClamp || '', 10);
              const display = computedStyle.display || '';
              const isContainerLike = display.includes('flex') || display.includes('grid') || display === '-webkit-box'
                || /(wrap|layout|container|content|panel|toolbar|filter|search|list|grid|table|body|main|aside|sidebar|sider|section|column|row)/i.test(semanticMarker);
              const isTableLike = /table|row|cell|thead|tbody|tr|td|th|col/.test(display)
                || /(table|thead|tbody|row|cell|column|header|body|list)/i.test(semanticMarker);
              return {
                width,
                height,
                parentWidth,
                widthRatio,
                lineCount,
                isText: hasMeaningfulText,
                isMultilineText: hasMeaningfulText && lineCount >= 2,
                isButtonLike,
                isContainerLike,
                isTableLike,
                whiteSpace: computedStyle.whiteSpace || '',
                textOverflow: computedStyle.textOverflow || '',
                clamp: Number.isFinite(explicitClamp) && explicitClamp > 0 ? explicitClamp : 0,
                display,
                parentDisplay: parentComputedStyle?.display || '',
                flexDirection: computedStyle.flexDirection || '',
                flexWrap: computedStyle.flexWrap || '',
                justifyContent: computedStyle.justifyContent || '',
                alignItems: computedStyle.alignItems || '',
                alignContent: computedStyle.alignContent || '',
                alignSelf: computedStyle.alignSelf || '',
                flexBasis: computedStyle.flexBasis || '',
                flexGrow: computedStyle.flexGrow || '',
                flexShrink: computedStyle.flexShrink || '',
                order: computedStyle.order || '',
                gridTemplateColumns: computedStyle.gridTemplateColumns || '',
                gridTemplateRows: computedStyle.gridTemplateRows || '',
                gridAutoFlow: computedStyle.gridAutoFlow || '',
                gridColumn: computedStyle.gridColumn || '',
                gridRow: computedStyle.gridRow || '',
                gap: computedStyle.gap || '',
                rowGap: computedStyle.rowGap || '',
                columnGap: computedStyle.columnGap || '',
                minWidth: computedStyle.minWidth || '',
                maxWidth: computedStyle.maxWidth || '',
                minHeight: computedStyle.minHeight || '',
                maxHeight: computedStyle.maxHeight || '',
                overflowX: computedStyle.overflowX || '',
                overflowY: computedStyle.overflowY || '',
                tableLayout: computedStyle.tableLayout || '',
                borderCollapse: computedStyle.borderCollapse || ''
              };
            };
            const forcedRegionRoots = originalNodes.filter((node) => node instanceof Element && isRegionRoot(node, window.getComputedStyle(node)));
            const forcedRegionNodes = new WeakSet();
            forcedRegionRoots.forEach((root) => {
              forcedRegionNodes.add(root);
              root.querySelectorAll('*').forEach((child) => forcedRegionNodes.add(child));
            });

            for (let index = 0; index < originalNodes.length; index += 1) {
              const node = originalNodes[index];
              const clonedNode = clonedNodes[index];
              if (!(node instanceof Element) || !(clonedNode instanceof Element)) {
                continue;
              }
              const rect = node.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(node);
              const forceSubtreeCapture = forcedRegionNodes.has(node);
              let restoreNodeId = clonedNode.getAttribute('data-restore-node-id') || node.getAttribute('data-restore-node-id') || `restore-node-fallback-${index}`;
              if (shouldCaptureLayoutSnapshot(node, computedStyle, rect, { forceSubtreeCapture })) {
                clonedNode.setAttribute('data-restore-node-id', restoreNodeId);
                layoutNodeSnapshots.push({ id: restoreNodeId, ...buildLayoutSnapshot(node, computedStyle, rect) });
              }
              const hasScrollableState = node.scrollTop > 0
                || node.scrollLeft > 0
                || node.scrollHeight > node.clientHeight + 1
                || node.scrollWidth > node.clientWidth + 1;
              if (hasScrollableState) {
                clonedNode.setAttribute('data-restore-node-id', restoreNodeId);
                scrollContainerSnapshots.push({
                  id: restoreNodeId,
                  scrollTop: Math.round(node.scrollTop || 0),
                  scrollLeft: Math.round(node.scrollLeft || 0),
                  clientWidth: Math.round(node.clientWidth || 0),
                  clientHeight: Math.round(node.clientHeight || 0),
                  scrollWidth: Math.round(node.scrollWidth || 0),
                  scrollHeight: Math.round(node.scrollHeight || 0),
                  overflowX: computedStyle.overflowX || '',
                  overflowY: computedStyle.overflowY || ''
                });
              }
            }

            const matchesTarget = (cssText) => {
              for (const cn of runtimeClassNames) {
                if (cssText.includes('.' + cn)) return true;
              }
              return false;
            };
            const collectMatching = (rules) => {
              if (!rules?.length || !runtimeClassNames.size) return '';
              const out = [];
              for (const rule of Array.from(rules)) {
                const ct = rule?.cssText || '';
                if (!ct) continue;
                if (rule.cssRules?.length) {
                  const nested = collectMatching(rule.cssRules);
                  if (nested && rule.conditionText) {
                    out.push('@media ' + rule.conditionText + '{' + nested + '}');
                  } else if (nested) {
                    out.push(nested);
                  }
                  continue;
                }
                if (matchesTarget(ct)) out.push(ct);
              }
              return out.join('\n');
            };

            Array.from(document.styleSheets || []).forEach((ss) => {
              try {
                const owner = ss?.ownerNode;
                const tag = owner?.tagName?.toLowerCase() || '';
                const href = String(ss?.href || owner?.href || '').trim();
                const inlineCssText = String(owner?.textContent || '').trim();
                let rules;
                try { rules = ss?.cssRules; } catch (e) { rules = null; }
                const matching = collectMatching(rules);
                const serializeRules = () => {
                  try { return Array.from(ss?.cssRules || []).map(r => r.cssText || '').filter(Boolean).join('\n'); }
                  catch (e) { return ''; }
                };
                if (tag === 'style') {
                  if (matching.trim()) pushCss(matching);
                  if (inlineCssText.trim() && inlineCssText.length <= 200000) {
                    pushCss(inlineCssText);
                  } else {
                    const serialized = serializeRules();
                    if (serialized.trim() && serialized.length <= 200000) {
                      pushCss(serialized);
                    }
                  }
                  return;
                }
                if (href) {
                  if (matching.trim()) pushCss(matching);
                  return;
                }
                pushCss(serializeRules());
                if (matching.trim()) pushCss(matching);
              } catch (ssErr) { /* skip this stylesheet */ }
            });
            try {
              Array.from(document.adoptedStyleSheets || []).forEach((ss) => {
                try {
                  let rules;
                  try { rules = ss?.cssRules; } catch (e) { rules = null; }
                  const matching = collectMatching(rules);
                  if (matching.trim()) { pushCss(matching); return; }
                  try { pushCss(Array.from(ss?.cssRules || []).map(r => r.cssText || '').filter(Boolean).join('\n')); }
                  catch (e) { /* skip */ }
                } catch (e) { /* skip */ }
              });
            } catch (e) { /* skip adopted */ }

            if (!runtimeCssBlocks.length) {
              Array.from(document.querySelectorAll('style')).forEach((styleNode) => {
                const cssText = String(styleNode?.textContent || '').trim();
                if (cssText.length <= 200000) {
                  pushCss(cssText);
                }
              });
            }

            if (!runtimeCssBlocks.length) {
              const inlineStyleRules = Array.from(document.querySelectorAll('[style]'))
                .slice(0, 240)
                .map((element) => {
                  const inlineStyle = String(element.getAttribute('style') || '').trim();
                  if (!inlineStyle) {
                    return '';
                  }
                  const tagName = String(element.tagName || 'div').toLowerCase();
                  const idSelector = element.id ? '#' + element.id : '';
                  const classSelector = String(element.className || '').trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((className) => '.' + className)
                    .join('');
                  return tagName + idSelector + classSelector + '{' + inlineStyle + '}';
                })
                .filter(Boolean)
                .join('\n');
              pushCss(inlineStyleRules);
            }

            window.__protoFallbackCaptureHtml = clonedRoot.outerHTML || document.documentElement?.outerHTML || '';
            window.__protoFallbackBrowserAssetSnapshots = browserAssetSnapshots;
          } catch (cssErr) {
            runtimeCssBlocks = [];
            window.__protoFallbackCaptureHtml = document.documentElement?.outerHTML || '';
            window.__protoFallbackBrowserAssetSnapshots = [];
          }

          const metadataPack = {
            capturedAt: new Date().toISOString(),
            viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
            document: {
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight,
              scrollTop: Math.round(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0),
              scrollLeft: Math.round(window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0)
            },
            stylesheetCount: stylesheetLinks.length,
            capturedStylesheetCount: 0,
            runtimeStyleTextCount: runtimeCssBlocks.length,
            runtimeStyleTexts: runtimeCssBlocks,
            fallbackNodeSnapshots: [],
            layoutNodeSnapshots,
            scrollContainerSnapshots,
            interactionStateSnapshots: [],
            sampledContentSnapshots: [],
            pseudoElementSnapshots: [],
            browserAssetSnapshots: Array.isArray(window.__protoFallbackBrowserAssetSnapshots) ? window.__protoFallbackBrowserAssetSnapshots : [],
            chunkedCapture: true,
            fallbackCapture: true
          };

          const html = String(window.__protoFallbackCaptureHtml || document.documentElement?.outerHTML || '');
          const stashPayload = (cacheType, cacheKey, payload) => {
            const root = document.documentElement || document.body;
            if (!root || !cacheKey) return 0;
            const elId = '__proto-capture-stash-' + cacheType + '-' + cacheKey;
            let el = document.getElementById(elId);
            if (!(el instanceof HTMLScriptElement)) {
              el = document.createElement('script');
              el.id = elId;
              el.type = 'application/json';
              el.setAttribute('data-proto-capture-stash', cacheType);
              el.style.display = 'none';
              root.appendChild(el);
            }
            el.textContent = String(payload || '');
            return el.textContent.length;
          };

          const metaJson = JSON.stringify(metadataPack);
          const sheetsJson = JSON.stringify(stylesheetLinks);
          if (stashKeysArg?.metadata) stashPayload('metadata', stashKeysArg.metadata, metaJson);
          if (stashKeysArg?.stylesheets) stashPayload('stylesheets', stashKeysArg.stylesheets, sheetsJson);

          return {
            ok: true,
            url: window.location.href,
            title: document.title,
            htmlLength: html.length,
            metadataLength: metaJson.length,
            stylesheetsLength: sheetsJson.length
          };
        } catch (topErr) {
          const html = document.documentElement?.outerHTML || '';
          return {
            ok: true,
            url: window.location.href,
            title: document.title,
            htmlLength: html.length,
            metadataLength: 0,
            stylesheetsLength: 0
          };
        }
      }, [{ metadata: stashKeys.metadata, stylesheets: stashKeys.stylesheets }]);
      useDirectHtmlRead = true;
    }
  }

  if (!pageMeta?.htmlLength) {
    console.warn('[proto-capture] chunked preflight failed after lightweight fallback', { tabId, pageMeta });
    throw new Error('大页面分片预抓取失败：未获得页面长度');
  }

  const MIN_CHUNK_SIZE = 120000;
  const MAX_CHUNK_COUNT = 200;
  const chunkSize = Math.max(MIN_CHUNK_SIZE, Math.ceil(pageMeta.htmlLength / MAX_CHUNK_COUNT));
  const chunkCount = Math.ceil(pageMeta.htmlLength / chunkSize);
  console.info('[proto-capture] chunked capture preflight', {
    tabId,
    htmlLength: pageMeta.htmlLength,
    chunkCount,
    metadataLength: pageMeta.metadataLength || 0,
    stylesheetsLength: pageMeta.stylesheetsLength || 0,
    useDirectHtmlRead
  });
  if (chunkCount > MAX_CHUNK_COUNT) {
    throw new Error(`页面体积过大，超出分片抓取上限（${chunkCount} 段）`);
  }

  const htmlChunks = [];
  for (let index = 0; index < chunkCount; index += 1) {
    const chunkResult = useDirectHtmlRead
      ? await executePageScript(tabId, readPageHtmlChunk, [index * chunkSize, (index + 1) * chunkSize])
      : await executePageScript(tabId, readStashedCapturePayload, ['html', stashKeys.html, index * chunkSize, (index + 1) * chunkSize]);
    const chunkText = String(chunkResult?.payloadChunk || '');

    console.info('[proto-capture] chunked capture slice', {
      tabId,
      index,
      chunkLength: chunkText.length
    });

    htmlChunks.push(chunkText);
  }

  const readJsonPayload = async (cacheType, cacheKey, payloadLength) => {
    if (!payloadLength) {
      return cacheType === 'stylesheets' ? [] : {};
    }

    const payloadChunkSize = Math.max(MIN_CHUNK_SIZE, Math.ceil(payloadLength / MAX_CHUNK_COUNT));
    const payloadChunkCount = Math.ceil(payloadLength / payloadChunkSize);
    const payloadChunks = [];

    for (let index = 0; index < payloadChunkCount; index += 1) {
      const chunkResult = await executePageScript(tabId, readStashedCapturePayload, [cacheType, cacheKey, index * payloadChunkSize, (index + 1) * payloadChunkSize]);
      payloadChunks.push(String(chunkResult?.payloadChunk || ''));
    }

    const payloadText = payloadChunks.join('');
    return payloadText ? JSON.parse(payloadText) : (cacheType === 'stylesheets' ? [] : {});
  };

  const html = htmlChunks.join('');
  const metadata = useDirectHtmlRead
    ? (fallbackMetadata || await readJsonPayload('metadata', stashKeys.metadata, pageMeta.metadataLength || 0))
    : await readJsonPayload('metadata', stashKeys.metadata, pageMeta.metadataLength || 0);
  const stylesheets = useDirectHtmlRead
    ? (fallbackStylesheets || await readJsonPayload('stylesheets', stashKeys.stylesheets, pageMeta.stylesheetsLength || 0))
    : await readJsonPayload('stylesheets', stashKeys.stylesheets, pageMeta.stylesheetsLength || 0);

  await executePageScript(tabId, (keys) => {
    clearStashedCapturePayload('html', keys?.html || '');
    clearStashedCapturePayload('metadata', keys?.metadata || '');
    clearStashedCapturePayload('stylesheets', keys?.stylesheets || '');
  }, [stashKeys]);

  console.info('[proto-capture] chunked capture assembled', {
    tabId,
    htmlLength: html.length,
    expectedLength: pageMeta.htmlLength,
    runtimeStyleTextCount: metadata?.runtimeStyleTextCount || 0,
    fallbackNodeSnapshotCount: Array.isArray(metadata?.fallbackNodeSnapshots) ? metadata.fallbackNodeSnapshots.length : 0,
    stylesheetCount: Array.isArray(stylesheets) ? stylesheets.length : 0
  });

  return {
    html,
    url: pageMeta.url,
    title: pageMeta.title,
    stylesheets,
    metadata: {
      ...metadata,
      chunkedCapture: true
    }
  };
}

function createMultiTabSessionId() {
  return `tabs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function detectAvailableServer(updateState = true) {
  const availableServers = [];

  for (const port of SERVER_PORT_CANDIDATES) {
    const baseUrl = createServerBaseUrl(port);

    try {
      const healthData = await requestJson(`${baseUrl}/health`, {}, 1500);
      const resolvedPort = healthData.port || port;
      availableServers.push({
        port: resolvedPort,
        baseUrl: createServerBaseUrl(resolvedPort),
        protocolVersion: Number(healthData.protocolVersion || 0),
        startedAt: Number(healthData.startedAt || 0)
      });
    } catch (error) {
      continue;
    }
  }

  const selectedServer = availableServers
    .sort((left, right) => {
      const leftSupportsProtocol = left.protocolVersion >= MIN_SUPPORTED_PROTOCOL_VERSION ? 1 : 0;
      const rightSupportsProtocol = right.protocolVersion >= MIN_SUPPORTED_PROTOCOL_VERSION ? 1 : 0;

      if (leftSupportsProtocol !== rightSupportsProtocol) {
        return rightSupportsProtocol - leftSupportsProtocol;
      }

      if (left.startedAt !== right.startedAt) {
        return right.startedAt - left.startedAt;
      }

      return right.port - left.port;
    })[0];

  if (selectedServer) {
    if (updateState) {
      await setSyncState({
        serverPort: String(selectedServer.port),
        serverBaseUrl: selectedServer.baseUrl,
        serverStatus: 'connected'
      });
    }

    return {
      port: selectedServer.port,
      baseUrl: selectedServer.baseUrl
    };
  }

  if (updateState) {
    await setSyncState({
      serverPort: '',
      serverBaseUrl: '',
      serverStatus: 'disconnected'
    });
  }

  return null;
}

function delay(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function startSyncFlow() {
  if (syncState.isRunning) {
    return syncState;
  }

  let serverInfo = null;
  const runId = createRunId();
  clearCurrentRunArtifacts();
  currentRunController = new AbortController();

  await setSyncState({
    ...createIdleState(),
    isRunning: true,
    phase: 'health',
    runId,
    message: '正在检查本地服务...',
    currentItemTitle: '检查本地服务',
    progressText: '',
    tip: '关闭弹窗会自动取消当前同步。',
    steps: createStepState({ health: 'running' })
  });

  try {
    serverInfo = await detectAvailableServer(false);
    if (!serverInfo) {
      throw new Error('未找到可用的本地服务端口');
    }

    await setSyncState({
      phase: 'capture',
      message: `本地服务正常，当前端口 ${serverInfo.port}，正在抓取当前页面...`,
      currentItemTitle: '准备抓取当前页面',
      serverPort: String(serverInfo.port),
      serverBaseUrl: serverInfo.baseUrl,
      serverStatus: 'connected',
      steps: createStepState({ health: 'done', capture: 'running' })
    });

    const tab = await getActiveTab();
    const pageTabs = await executePageScript(tab.id, discoverPageTabs);
    const captureTargets = pageTabs?.hasMultipleTabs
      ? pageTabs.tabs
      : [{ order: 0, label: '默认页面', slug: 'default', active: true }];
    const multiTabSessionId = captureTargets.length > 1 ? createMultiTabSessionId() : '';

    const restoreResults = [];

    await setSyncState({
      phase: 'save',
      message: captureTargets.length > 1
        ? `检测到 ${captureTargets.length} 个标签页，准备逐个抓取...`
        : '正在同步资源与代码...',
      currentItemTitle: captureTargets.length > 1 ? '准备逐个处理标签页' : '准备同步当前页面',
      progressText: captureTargets.length > 1 ? `0/${captureTargets.length}` : '',
      steps: createStepState({ health: 'done', capture: 'done', save: 'running' })
    });

    for (let index = 0; index < captureTargets.length; index += 1) {
      const target = captureTargets[index];
      const tabProgressText = `${index + 1}/${captureTargets.length}`;

      if (currentRunController.signal.aborted) {
        throw new Error('当前同步已取消');
      }

      await setSyncState({
        phase: 'capture',
        message: captureTargets.length > 1
          ? `正在抓取第 ${index + 1}/${captureTargets.length} 个标签页：${target.label}`
          : '正在抓取当前页面...',
        currentItemTitle: target.label || '当前页面',
        progressText: tabProgressText,
        steps: createStepState({ health: 'done', capture: 'running', save: 'pending', restore: 'pending' })
      });

      if (pageTabs?.hasMultipleTabs) {
        const activationResult = await executePageScript(tab.id, activatePageTab, [target.order]);
        if (!activationResult?.ok) {
          throw new Error(activationResult?.message
            ? `切换标签页失败：${target.label}（${activationResult.message}）`
            : `切换标签页失败：${target.label}`);
        }
        await delay(700);
      }

      const warmupResult = await warmupPageForCapture(tab.id);
      const preCaptureBackfilledSnapshots = await backfillCriticalImageSnapshotsAcrossPage(tab.id, tab.windowId, []);

      let pageData = null;
      let lastCaptureErrorMessage = '';
      let basicPageData = null;
      const collectors = [
        { func: collectPagePayload, delayAfterFailure: 400 },
        { func: collectPagePayload, delayAfterFailure: 900 },
        { func: collectBasicPagePayload, delayAfterFailure: 0 }
      ];

      for (let attempt = 0; attempt < collectors.length; attempt += 1) {
        if (currentRunController.signal.aborted) {
          throw new Error('当前同步已取消');
        }

        try {
          pageData = await executePageScript(tab.id, collectors[attempt].func);
        } catch (error) {
          lastCaptureErrorMessage = error?.message || '页面注入执行失败';
          console.warn('[proto-capture] primary collector failed', {
            attempt,
            collector: collectors[attempt].func.name || 'anonymous',
            message: lastCaptureErrorMessage
          });
        }

        if (pageData?.html && String(pageData.html).trim()) {
          if (collectors[attempt].func === collectBasicPagePayload) {
            basicPageData = pageData;
            pageData = null;
          } else {
            console.info('[proto-capture] primary collector succeeded', {
              attempt,
              collector: collectors[attempt].func.name || 'anonymous',
              htmlLength: String(pageData.html).length,
              runtimeStyleTextCount: pageData?.metadata?.runtimeStyleTextCount || 0,
              chunkedCapture: Boolean(pageData?.metadata?.chunkedCapture)
            });
            break;
          }
        }

        pageData = null;
        if (collectors[attempt].delayAfterFailure > 0) {
          await delay(collectors[attempt].delayAfterFailure);
        }
      }

      if (!pageData) {
        if (basicPageData?.html && String(basicPageData.html).trim()) {
          pageData = basicPageData;
          console.info('[proto-capture] using basic capture before chunked fallback', {
            htmlLength: String(pageData.html).length,
            runtimeStyleTextCount: pageData?.metadata?.runtimeStyleTextCount || 0,
            fallbackCapture: Boolean(pageData?.metadata?.fallbackCapture)
          });
        } else {
          try {
            pageData = await collectLargePagePayloadInChunks(tab.id);
            if (pageData?.html && String(pageData.html).trim()) {
              console.info('[proto-capture] chunked collector succeeded', {
                htmlLength: String(pageData.html).length,
                runtimeStyleTextCount: pageData?.metadata?.runtimeStyleTextCount || 0,
                chunkedCapture: Boolean(pageData?.metadata?.chunkedCapture)
              });
            }
          } catch (error) {
            lastCaptureErrorMessage = error?.message || lastCaptureErrorMessage;
            console.warn('[proto-capture] chunked collector failed', {
              message: lastCaptureErrorMessage
            });
          }
        }
      }

      if (!pageData && basicPageData?.html && String(basicPageData.html).trim()) {
        pageData = basicPageData;
        console.info('[proto-capture] using basic capture as chunked metadata fallback', {
          htmlLength: String(pageData.html).length,
          runtimeStyleTextCount: pageData?.metadata?.runtimeStyleTextCount || 0,
          chunkedCapture: Boolean(pageData?.metadata?.chunkedCapture)
        });
      }

      if (!pageData) {
        throw new Error(lastCaptureErrorMessage
          ? `页面抓取结果为空：${target.label}（${lastCaptureErrorMessage}）`
          : `页面抓取结果为空：${target.label}（页面内容可能过大，建议重试）`);
      }

      if (
        pageData?.metadata?.chunkedCapture
        && (
          !Array.isArray(pageData?.metadata?.layoutNodeSnapshots)
          || !pageData.metadata.layoutNodeSnapshots.length
          || !Array.isArray(pageData?.metadata?.scrollContainerSnapshots)
          || !pageData.metadata.scrollContainerSnapshots.length
        )
      ) {
        try {
          pageData = await rehydrateChunkedCaptureMetadata(tab.id, pageData);
        } catch (error) {
          console.warn('[proto-capture] failed to enrich chunked metadata', {
            message: error?.message || 'unknown'
          });
        }
      }

      if (preCaptureBackfilledSnapshots.length) {
        pageData.metadata = {
          ...pageData.metadata,
          browserAssetSnapshots: mergeBrowserAssetSnapshots(
            Array.isArray(pageData?.metadata?.browserAssetSnapshots) ? pageData.metadata.browserAssetSnapshots : [],
            preCaptureBackfilledSnapshots
          )
        };
      }

      pageData.screenshot = await captureVisibleTab(tab.windowId);
      const viewportBackfilledSnapshots = await backfillCriticalImageSnapshotsAcrossPage(
        tab.id,
        tab.windowId,
        pageData?.metadata?.browserAssetSnapshots?.map((snapshot) => snapshot?.id)
      );
      if (preCaptureBackfilledSnapshots.length || viewportBackfilledSnapshots.length) {
        pageData.metadata = {
          ...pageData.metadata,
          browserAssetSnapshots: mergeBrowserAssetSnapshots(
            Array.isArray(pageData?.metadata?.browserAssetSnapshots) ? pageData.metadata.browserAssetSnapshots : [],
            viewportBackfilledSnapshots
          )
        };
      }

      console.info('[proto-capture] final metadata snapshot counts', {
        layoutNodeSnapshots: Array.isArray(pageData?.metadata?.layoutNodeSnapshots) ? pageData.metadata.layoutNodeSnapshots.length : 0,
        scrollContainerSnapshots: Array.isArray(pageData?.metadata?.scrollContainerSnapshots) ? pageData.metadata.scrollContainerSnapshots.length : 0,
        browserAssetSnapshots: Array.isArray(pageData?.metadata?.browserAssetSnapshots) ? pageData.metadata.browserAssetSnapshots.length : 0,
        chunkedCapture: Boolean(pageData?.metadata?.chunkedCapture),
        fallbackCapture: Boolean(pageData?.metadata?.fallbackCapture),
        warmup: warmupResult?.lazyWarmupMetrics || {}
      });
      pageData.captureVariant = captureTargets.length > 1 ? {
        label: target.label,
        slug: target.slug,
        index,
        total: captureTargets.length
      } : null;
      pageData.metadata = {
        ...pageData.metadata,
        multiTabCapture: captureTargets.length > 1,
        multiTabSessionId: captureTargets.length > 1 ? multiTabSessionId : '',
        syncRunId: runId,
        warmup: warmupResult || {},
        activeTab: captureTargets.length > 1 ? {
          label: target.label,
          slug: target.slug,
          index,
          total: captureTargets.length
        } : null
      };

      if (!pageData?.html || !pageData?.url) {
        console.error('[proto-capture] refusing to send invalid save payload', {
          hasHtml: Boolean(pageData?.html),
          htmlLength: String(pageData?.html || '').length,
          hasUrl: Boolean(pageData?.url),
          url: pageData?.url || '',
          hasTitle: Boolean(pageData?.title),
          runtimeStyleTextCount: pageData?.metadata?.runtimeStyleTextCount || 0,
          chunkedCapture: Boolean(pageData?.metadata?.chunkedCapture)
        });
        throw new Error('抓取结果未生成有效的 html/url，请查看后台日志');
      }

      await setSyncState({
        phase: 'save',
        message: captureTargets.length > 1
          ? `正在同步第 ${index + 1}/${captureTargets.length} 个标签页：${target.label}`
          : '正在同步资源与代码...',
        currentItemTitle: target.label || '当前页面',
        progressText: tabProgressText,
        steps: createStepState({ health: 'done', capture: 'done', save: 'running', restore: 'pending' })
      });

      await startProgressPolling(serverInfo.baseUrl, runId, target.label || '当前页面');
      const response = await requestJson(`${serverInfo.baseUrl}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pageData, runId }),
        signal: currentRunController.signal
      }, 10 * 60 * 1000);
      clearCurrentRunArtifacts({ preserveController: true });

      restoreResults.push(response);
    }

    const primaryResult = restoreResults[0] || {};

    await setSyncState({
      phase: 'restore',
      message: captureTargets.length > 1
        ? `多标签抓取完成，正在整合为 1 个页面（共 ${restoreResults.length} 个 Tab）...`
        : '抓取完成，正在整理还原页面...',
      currentItemTitle: primaryResult.progressTitle || '生成还原页面',
      progressText: captureTargets.length > 1 ? `${restoreResults.length}/${captureTargets.length}` : '',
      previewUrl: primaryResult.restorePreviewUrl || '',
      restoreTargetPath: primaryResult.restoreTargetPath || '',
      capturePath: primaryResult.capturePath || '',
      steps: createStepState({ health: 'done', capture: 'done', save: 'done', restore: 'running' })
    });

    await new Promise((resolve) => setTimeout(resolve, 400));

    clearCurrentRunArtifacts();
    await setSyncState({
      isRunning: false,
      phase: 'success',
      runId: '',
      message: captureTargets.length > 1
        ? `已完成多标签抓取与还原，已整合为 1 个页面（含 ${restoreResults.length} 个 Tab）。`
        : '已完成抓取与还原，可预览还原页面。',
      currentItemTitle: '',
      progressText: '',
      tip: captureTargets.length > 1
        ? `还原目录：${primaryResult.restoreTargetPath || '已生成整合页面'}`
        : (primaryResult.restoreTargetPath
          ? `还原目录：${primaryResult.restoreTargetPath}`
          : '还原页面已生成，可点击按钮预览。'),
      serverPort: String(serverInfo.port),
      serverBaseUrl: serverInfo.baseUrl,
      serverStatus: 'connected',
      previewUrl: primaryResult.restorePreviewUrl || '',
      restoreTargetPath: primaryResult.restoreTargetPath || '',
      capturePath: primaryResult.capturePath || '',
      steps: createStepState({ health: 'done', capture: 'done', save: 'done', restore: 'done' })
    });

    return syncState;
  } catch (error) {
    clearCurrentRunArtifacts();
    if (/已取消/.test(String(error?.message || ''))) {
      await setSyncState({
        ...buildCanceledState(currentPopupPort ? 'manual' : 'popup_closed'),
        serverPort: serverInfo ? String(serverInfo.port) : syncState.serverPort,
        serverBaseUrl: serverInfo ? serverInfo.baseUrl : syncState.serverBaseUrl,
        serverStatus: serverInfo ? 'connected' : syncState.serverStatus,
        runId: ''
      });
      return syncState;
    }

    const isServiceUnavailableError = !serverInfo || /服务|端口|health|fetch|network/i.test(String(error?.message || ''));
    await setSyncState({
      isRunning: false,
      phase: 'error',
      runId: '',
      message: error.message || '抓取失败，请稍后重试',
      currentItemTitle: '',
      progressText: '',
      tip: isServiceUnavailableError
        ? '请确认本地服务已启动，并重新加载插件后再试。'
        : '本地服务已连接，当前失败更可能是页面标签识别或页面切换问题。',
      serverPort: serverInfo ? String(serverInfo.port) : syncState.serverPort,
      serverBaseUrl: serverInfo ? serverInfo.baseUrl : syncState.serverBaseUrl,
      serverStatus: serverInfo ? 'connected' : 'disconnected',
      previewUrl: '',
      steps: {
        ...syncState.steps
      }
    });

    throw error;
  }
}

initializeState().then(() => detectAvailableServer(true));

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sync-popup-session') {
    return;
  }

  currentPopupPort = port;
  port.onDisconnect.addListener(() => {
    if (currentPopupPort === port) {
      currentPopupPort = null;
    }

    if (syncState.isRunning) {
      cancelCurrentRun('popup_closed').catch(() => undefined);
    }
  });
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'GET_SYNC_STATE') {
    detectAvailableServer(false)
      .then(async (serverInfo) => {
        if (!syncState.isRunning) {
          await resetPopupStateToIdle(serverInfo);
        } else if (serverInfo) {
          await setSyncState({
            serverPort: String(serverInfo.port),
            serverBaseUrl: serverInfo.baseUrl,
            serverStatus: 'connected'
          });
        }

        sendResponse(syncState);
      })
      .catch(async () => {
        if (!syncState.isRunning) {
          await resetPopupStateToIdle(null);
        }
        sendResponse(syncState);
      });
    return true;
  }

  if (request.type === 'REFRESH_SERVER_CONNECTION') {
    detectAvailableServer(true)
      .then((serverInfo) => sendResponse({ ok: Boolean(serverInfo), state: syncState }))
      .catch((error) => sendResponse({ ok: false, message: error.message, state: syncState }));
    return true;
  }

  if (request.type === 'START_SYNC') {
    startSyncFlow()
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) => sendResponse({ ok: false, message: error.message }));
    return true;
  }

  return undefined;
});
