const btn = document.getElementById('go');
const loader = document.getElementById('loader');
const successView = document.getElementById('success-view');
const pulse = document.getElementById('pulse');
const status = document.getElementById('status');
const tip = document.getElementById('tip');
const previewBtn = document.getElementById('preview');
const badge = document.getElementById('phase-badge');
const lockText = document.getElementById('lock-text');
const endpointValue = document.getElementById('endpoint-value');
const endpointStatus = document.getElementById('endpoint-status');
const versionLink = document.getElementById('version-link');
const serviceGuide = document.getElementById('service-guide');
const refreshServerBtn = document.getElementById('refresh-server');
const copyDevCommandBtn = document.getElementById('copy-dev-command');
const downloadServicePackageBtn = document.getElementById('download-service-package');
const serviceGuideTip = document.getElementById('service-guide-tip');
const closeServiceGuideBtn = document.getElementById('close-service-guide');
const stepNodes = {
    health: document.querySelector('[data-step="health"]'),
    capture: document.querySelector('[data-step="capture"]'),
    save: document.querySelector('[data-step="save"]'),
    restore: document.querySelector('[data-step="restore"]')
};

let currentState = null;
let popupSessionPort = null;
const manifest = chrome.runtime.getManifest();

if (versionLink) {
    versionLink.innerText = `v${manifest.version_name || manifest.version || ''}`;
}

const phaseMap = {
    idle: '待开始',
    health: '检查中',
    capture: '抓取中',
    save: '同步中',
    restore: '还原中',
    success: '已完成',
    error: '异常',
    canceled: '已取消'
};

function resolveBadgeState(phase) {
    if (phase === 'success') {
        return 'is-success';
    }

    if (phase === 'error' || phase === 'canceled') {
        return 'is-error';
    }

    if (['health', 'capture', 'save', 'restore'].includes(phase)) {
        return 'is-running';
    }

    return 'is-idle';
}

function resolveEndpointStatusClass({ isConnected, hasKnownPort }) {
    if (isConnected) {
        return 'is-connected';
    }

    if (hasKnownPort) {
        return 'is-pending';
    }

    return 'is-offline';
}

function setStepClass(node, stepState) {
    if (!node) {
        return;
    }

    node.classList.remove('running', 'done');

    if (stepState === 'running') {
        node.classList.add('running');
    }

    if (stepState === 'done') {
        node.classList.add('done');
    }
}

function shouldGuideStartService(state = currentState) {
    return !state?.isRunning && !state?.serverPort && state?.serverStatus !== 'connected';
}

function setServiceGuideTip(message = '', tone = 'info') {
    serviceGuideTip.innerText = message;
    serviceGuideTip.classList.remove('visible', 'is-info', 'is-success', 'is-error');

    if (!message) {
        return;
    }

    serviceGuideTip.classList.add('visible', `is-${tone}`);
}

function openServiceGuide() {
    setServiceGuideTip('');
    serviceGuide.classList.add('visible');
}

function ensurePopupSessionPort() {
    if (popupSessionPort) {
        return popupSessionPort;
    }

    popupSessionPort = chrome.runtime.connect({ name: 'sync-popup-session' });
    popupSessionPort.onDisconnect.addListener(() => {
        popupSessionPort = null;
    });
    return popupSessionPort;
}

function formatMainStatus(state = {}) {
    const title = state?.currentItemTitle?.trim();

    if (state?.phase === 'capture' && title) {
        return `正在抓取 ${title}`;
    }

    if (state?.phase === 'save' && title) {
        return `正在同步 ${title}`;
    }

    if (state?.phase === 'restore' && title) {
        return `正在还原 ${title}`;
    }

    return state?.message || '准备就绪，点击开始抓取';
}

function buildTipText(state = {}) {
    if (state?.detail) {
        return state.detail;
    }

    if (state?.progressText) {
        return `当前进度 ${state.progressText}`;
    }

    if (state?.isRunning) {
        return '关闭弹窗会自动取消当前同步。';
    }

    return state?.tip || '执行过程中会动态展示当前处理对象。';
}

function renderState(state) {
    currentState = state;

    const isRunning = Boolean(state?.isRunning);
    const isSuccess = state?.phase === 'success';
    const isError = state?.phase === 'error';
    const isCanceled = state?.phase === 'canceled';
    const hasKnownPort = Boolean(state?.serverPort);
    const isConnected = state?.serverStatus === 'connected' && hasKnownPort;
    const shouldShowServiceGuide = !isRunning && !isConnected && !hasKnownPort;
    const dynamicStatusText = formatMainStatus(state);

    badge.innerText = phaseMap[state?.phase] || '待开始';
    badge.classList.remove('is-idle', 'is-running', 'is-success', 'is-error');
    badge.classList.add(resolveBadgeState(state?.phase));
    status.innerText = dynamicStatusText;
    status.classList.toggle('is-dynamic', isRunning && ['capture', 'save', 'restore'].includes(state?.phase));
    tip.innerText = buildTipText(state);
    endpointValue.innerText = hasKnownPort ? String(state.serverPort) : '未连接';
    endpointValue.classList.toggle('is-offline', shouldShowServiceGuide);
    endpointStatus.innerText = isConnected ? '已连接' : (hasKnownPort ? '待确认' : '连接服务');
    endpointStatus.classList.remove('is-connected', 'is-pending', 'is-offline', 'is-actionable');
    endpointStatus.classList.add(resolveEndpointStatusClass({ isConnected, hasKnownPort }));
    endpointStatus.classList.toggle('is-actionable', shouldShowServiceGuide);
    endpointStatus.disabled = isRunning;
    btn.disabled = isRunning;
    loader.classList.toggle('active', isRunning);
    pulse.classList.toggle('active', isRunning);
    successView.classList.toggle('visible', isSuccess);
    previewBtn.classList.toggle('visible', Boolean(state?.previewUrl) && !isRunning);
    previewBtn.disabled = !state?.previewUrl || isRunning;
    if (!shouldShowServiceGuide) {
        setServiceGuideTip('');
        serviceGuide.classList.remove('visible');
    }
    refreshServerBtn.disabled = isRunning;
    copyDevCommandBtn.disabled = isRunning;
    downloadServicePackageBtn.disabled = isRunning;
    closeServiceGuideBtn.disabled = isRunning;

    Object.entries(stepNodes).forEach(([key, node]) => {
        setStepClass(node, state?.steps?.[key]);
    });

    if (isRunning) {
        lockText.innerText = '执行中，关闭弹窗会自动取消当前同步。';
    } else if (isSuccess) {
        lockText.innerText = state?.restoreTargetPath ? `已完成，可预览：${state.restoreTargetPath}` : '已完成，可点击按钮预览还原页面。';
    } else if (isCanceled) {
        lockText.innerText = '本次同步已取消，可重新发起抓取。';
    } else if (shouldShowServiceGuide) {
        lockText.innerText = '服务未连接，点击“连接服务”查看启动引导。';
    } else if (isError) {
        lockText.innerText = '执行失败，请重新点击开始同步。';
    } else {
        lockText.innerText = '';
    }
}

async function loadSyncState() {
    const state = await chrome.runtime.sendMessage({ type: 'GET_SYNC_STATE' });
    renderState(state);
}

endpointStatus.addEventListener('click', () => {
    if (shouldGuideStartService()) {
        openServiceGuide();
        lockText.innerText = '请先根据引导连接本地服务。';
    }
});

btn.addEventListener('click', async () => {
    if (shouldGuideStartService()) {
        openServiceGuide();
        lockText.innerText = '请先根据引导连接本地服务。';
        return;
    }

    btn.disabled = true;
    lockText.innerText = '正在发起抓取任务...';

    try {
        const response = await chrome.runtime.sendMessage({ type: 'START_SYNC' });
        if (!response?.ok) {
            throw new Error(response?.message || '抓取任务启动失败');
        }
    } catch (error) {
        renderState({
            ...(currentState || {}),
            isRunning: false,
            phase: 'error',
            message: error.message || '抓取任务启动失败',
            currentItemTitle: '',
            progressText: '',
            tip: currentState?.serverPort
                ? '本地服务已连接，本次失败更可能是页面结构或标签切换问题。'
                : '请确认服务与插件状态正常后重试。',
            previewUrl: '',
            restoreTargetPath: '',
            steps: currentState?.steps || {
                health: 'pending',
                capture: 'pending',
                save: 'pending',
                restore: 'pending'
            }
        });
    }
});

previewBtn.addEventListener('click', async () => {
    if (!currentState?.previewUrl) {
        return;
    }

    await chrome.tabs.create({ url: currentState.previewUrl });
});

closeServiceGuideBtn.addEventListener('click', () => {
    setServiceGuideTip('');
    serviceGuide.classList.remove('visible');
});

serviceGuide.addEventListener('click', (event) => {
    if (event.target === serviceGuide) {
        setServiceGuideTip('');
        serviceGuide.classList.remove('visible');
    }
});

refreshServerBtn.addEventListener('click', async () => {
    refreshServerBtn.disabled = true;
    setServiceGuideTip('正在重新检测本地服务...', 'info');

    try {
        const response = await chrome.runtime.sendMessage({ type: 'REFRESH_SERVER_CONNECTION' });
        if (!response?.ok) {
            throw new Error(response?.message || '服务检测失败');
        }

        renderState(response.state);
        if (!response.state?.serverPort) {
            openServiceGuide();
            setServiceGuideTip('仍未检测到本地服务，请先启动服务后再重新检测。', 'error');
        }
    } catch (error) {
        setServiceGuideTip(error.message || '服务检测失败，请稍后重试。', 'error');
    } finally {
        refreshServerBtn.disabled = false;
    }
});

copyDevCommandBtn.addEventListener('click', async () => {
    const command = 'npm run dev';

    try {
        await navigator.clipboard.writeText(command);
        setServiceGuideTip('命令已复制，可回到 AI 工具发送给 AI 启动服务。', 'success');
    } catch (error) {
        setServiceGuideTip('复制失败，请手动使用 npm run dev 启动服务。', 'error');
    }
});

downloadServicePackageBtn.addEventListener('click', async () => {
    await chrome.tabs.create({ url: 'https://lurenyi.me' });
    setServiceGuideTip('已打开官网，可获取完整本地服务包。', 'success');
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SYNC_STATE_UPDATED' && message.state) {
        renderState(message.state);
    }
});

ensurePopupSessionPort();
loadSyncState();
