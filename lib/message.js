import { Design } from './design.js';
import { Frame } from './frame.js';

export const Message = {
    hint,
    info,
    warn,
    error,
    alert,
};

const COLOR_TEXT = '#ffffff';
const COLOR_INFO = '#323232';
const COLOR_WARN = '#8a5d00';
const COLOR_ERROR = '#b3261e';
const COLOR_ALERT = '#1c4e80';
const COLOR_HOVER = 'rgba(255,255,255,0.16)';
const COLOR_ACTIVE = 'rgba(255,255,255,0.32)';
const COLOR_GAUGE_ALPHA = '99';

const SVG_NS = 'http://www.w3.org/2000/svg';

const HINT_ARROW = 5;
const HINT_OFFSET = 2;

const PANEL_RADIUS_SINGLE = 999;
const PANEL_RADIUS_MULTI = 12;
const PANEL_PADDING = 8;
const PANEL_LEFT_SINGLE = 16;
const PANEL_LEFT_MULTI = 12;
const PANEL_OFFSET = 24;
const PANEL_GAP = 8;
const PANEL_DURATION = 2400;
const PANEL_FADE = 200;

const BUTTON_SIZE = 20;
const BUTTON_ICON = 16;

const GAUGE_LENGTH = 1000;
const GAUGE_WIDTH = 2;
const GAUGE_INSET = GAUGE_WIDTH / 2;

let stack = null;

function hint(target, text) {
    const read = typeof text === 'function' ? text : () => text;

    let box = null;

    const hide = () => {
        if (!box) {
            return;
        }
        box.destroy();
        box = null;
    };

    target.addEventListener('pointerenter', () => {
        hide();

        const content = document.createElement('div');

        const label = document.createElement('div');
        label.textContent = read();
        label.style.margin = '0px 8px';
        label.style.padding = '2px 6px';
        label.style.userSelect = 'none';
        label.style.webkitUserSelect = 'none';
        label.style.whiteSpace = 'nowrap';
        label.style.fontSize = '0.75em';
        label.style.color = COLOR_TEXT;
        label.style.backgroundColor = COLOR_INFO;

        const triangle = document.createElement('div');
        triangle.style.width = '0';
        triangle.style.height = '0';
        triangle.style.margin = '0px auto';
        triangle.style.borderLeft = HINT_ARROW + 'px solid transparent';
        triangle.style.borderRight = HINT_ARROW + 'px solid transparent';
        triangle.style.borderBottom = HINT_ARROW + 'px solid ' + COLOR_INFO;

        content.appendChild(triangle);
        content.appendChild(label);

        box = Frame.createPanel(content);

        const rect = target.getBoundingClientRect();
        const view = window.visualViewport;
        const space = view.offsetTop + view.height - rect.bottom;
        const placement = space >= box.getPanel().offsetHeight + HINT_OFFSET ? 'bottom' : 'top';

        if (placement === 'top') {
            triangle.style.borderBottom = '';
            triangle.style.borderTop = HINT_ARROW + 'px solid ' + COLOR_INFO;
            content.appendChild(triangle);
        }

        box.anchor(target, placement, HINT_OFFSET);
        box.show();
    });

    target.addEventListener('pointerleave', hide);
    target.addEventListener('pointerup', hide);
    target.addEventListener('pointercancel', hide);
}

function info(text) {
    return buildPanel(text, COLOR_INFO, PANEL_DURATION);
}

function warn(text) {
    return buildPanel(text, COLOR_WARN, PANEL_DURATION);
}

function error(text) {
    return buildPanel(text, COLOR_ERROR, 0);
}

function alert(text) {
    return buildPanel(text, COLOR_ALERT, 0);
}

function buildPanel(text, color, duration) {
    const box = document.createElement('div');
    box.style.padding = PANEL_PADDING + 'px';
    box.style.userSelect = 'none';
    box.style.webkitUserSelect = 'none';
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.gap = PANEL_PADDING + 'px';
    box.style.fontSize = '0.75em';
    box.style.lineHeight = '1.5';
    box.style.color = COLOR_TEXT;
    box.style.backgroundColor = color;
    box.style.boxShadow = '0 8px 32px rgba(0,0,0,0.24)';

    const label = document.createElement('div');
    label.textContent = text;
    label.style.minWidth = '0px';
    label.style.overflowWrap = 'break-word';

    const button = document.createElement('div');
    button.innerHTML = Design.getIcon('close', COLOR_TEXT, BUTTON_ICON);
    button.style.flex = '0 0 auto';
    button.style.width = BUTTON_SIZE + 'px';
    button.style.height = BUTTON_SIZE + 'px';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.backgroundColor = 'transparent';

    button.addEventListener('pointerenter', () => {
        button.style.backgroundColor = COLOR_HOVER;
    });

    button.addEventListener('pointerleave', () => {
        button.style.backgroundColor = 'transparent';
    });

    button.addEventListener('pointerdown', () => {
        button.style.backgroundColor = COLOR_ACTIVE;
    });

    button.addEventListener('pointerup', () => {
        button.style.backgroundColor = COLOR_HOVER;
    });

    box.appendChild(label);
    box.appendChild(button);

    const ring = document.createElement('div');
    ring.style.position = 'relative';
    ring.style.padding = GAUGE_WIDTH + 'px';
    ring.style.maxWidth = '100%';
    ring.style.pointerEvents = 'auto';
    ring.style.opacity = '0';
    ring.style.transition = 'opacity ' + PANEL_FADE + 'ms';
    ring.appendChild(box);

    if (!stack) {
        stack = buildStack();
    }

    stack.show();
    stack.getPanel().style.pointerEvents = 'none';
    stack.getContent().appendChild(ring);

    let lines;
    let ringRadius;
    let gauge = null;

    const layout = () => {
        box.style.paddingLeft = PANEL_LEFT_SINGLE + 'px';

        const line = parseFloat(getComputedStyle(label).lineHeight);

        lines = Math.max(1, Math.round(label.offsetHeight / line));

        const radius = lines > 1 ? PANEL_RADIUS_MULTI : PANEL_RADIUS_SINGLE;

        ringRadius = radius + GAUGE_WIDTH;

        box.style.paddingLeft = (lines > 1 ? PANEL_LEFT_MULTI : PANEL_LEFT_SINGLE) + 'px';
        box.style.borderRadius = radius + 'px';
        button.style.borderRadius = Math.max(0, Math.min(radius - PANEL_PADDING, BUTTON_SIZE / 2)) + 'px';
        ring.style.borderRadius = ringRadius + 'px';

        if (gauge) {
            gauge.resize(ringRadius);
        }
    };

    layout();

    ring.style.opacity = '1';

    const time = duration * (lines + 1);
    const observer = new ResizeObserver(layout);

    observer.observe(ring);
    window.addEventListener('resize', layout);

    if (duration) {
        gauge = buildGauge(ring, color, time, ringRadius);
    }

    let timer = null;

    const close = () => {
        observer.disconnect();
        window.removeEventListener('resize', layout);
        clearTimeout(timer);
        ring.style.opacity = '0';
        setTimeout(() => {
            ring.remove();
        }, PANEL_FADE);
    };

    const start = () => {
        timer = setTimeout(close, time);
        gauge.start();
    };

    const stop = () => {
        clearTimeout(timer);
        gauge.stop();
    };

    button.addEventListener('click', close);

    if (gauge) {
        ring.addEventListener('pointerenter', stop);
        ring.addEventListener('pointerleave', start);
        ring.addEventListener('pointercancel', start);
        start();
    }

    return { close };
}

function buildStack() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = PANEL_GAP + 'px';

    const frame = Frame.createPanel(container);
    const panel = frame.getPanel();

    panel.style.overflow = 'visible';
    panel.style.left = '50%';
    panel.style.bottom = 'calc(' + PANEL_OFFSET + 'px + env(safe-area-inset-bottom, 0px))';
    panel.style.transform = 'translateX(-50%)';
    panel.style.width = 'min(512px, calc(100dvw - 32px))';

    return frame;
}

function buildGauge(ring, color, duration, ringRadius) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0px';
    svg.style.left = '0px';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color + COLOR_GAUGE_ALPHA);
    path.setAttribute('stroke-width', GAUGE_WIDTH);
    path.setAttribute('pathLength', GAUGE_LENGTH);
    path.setAttribute('stroke-dasharray', GAUGE_LENGTH + ' ' + GAUGE_LENGTH);

    svg.appendChild(path);
    ring.appendChild(svg);

    const api = {};

    api.resize = (value) => {
        path.setAttribute('d', buildGaugePath(ring.offsetWidth, ring.offsetHeight, value));
    };

    api.start = () => {
        api.stop();
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset ' + duration + 'ms linear';
        path.style.strokeDashoffset = GAUGE_LENGTH;
    };

    api.stop = () => {
        path.style.transition = 'none';
        path.style.strokeDashoffset = 0;
    };

    api.resize(ringRadius);

    return api;
}

function buildGaugePath(width, height, ringRadius) {
    const left = GAUGE_INSET;
    const top = GAUGE_INSET;
    const right = width - GAUGE_INSET;
    const bottom = height - GAUGE_INSET;
    const center = (left + right) / 2;
    const radius = Math.max(0, Math.min(ringRadius - GAUGE_INSET, (right - left) / 2, (bottom - top) / 2));
    const arc = ' A ' + radius + ' ' + radius + ' 0 0 0 ';

    return 'M ' + center + ' ' + top
        + ' H ' + (left + radius)
        + arc + left + ' ' + (top + radius)
        + ' V ' + (bottom - radius)
        + arc + (left + radius) + ' ' + bottom
        + ' H ' + (right - radius)
        + arc + right + ' ' + (bottom - radius)
        + ' V ' + (top + radius)
        + arc + (right - radius) + ' ' + top
        + ' Z';
}
