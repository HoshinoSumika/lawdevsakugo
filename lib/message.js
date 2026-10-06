import { Design } from './design.js';
import { Frame } from './frame.js';

export const Message = {
    setColor,
    hint,
    info,
    warn,
    error,
    alert,
    wait,
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
const PANEL_SHADOW = '0 8px 32px rgba(0,0,0,0.24)';

const WAIT_SIZE = 128;

const LOADER_SIZE = 56;
const LOADER_RADIUS = 22;
const LOADER_STROKE = 4;
const LOADER_TRACK_COLOR = 'color-mix(in srgb, currentColor 16%, transparent)';
const LOADER_STEP_DURATION = 1000;

const LOADER_SPIN_ANGLE_LIST = [0, 180, 360];
const LOADER_ARC_ANGLE_LIST = [0, 135, 270, 405, 540, 675, 810, 945, 1080];
const LOADER_HEAD_ANGLE_LIST = [0, 135, 0];
const LOADER_TAIL_ANGLE_LIST = [0, -135, 0];

const BUTTON_SIZE = 20;
const BUTTON_ICON = 16;

const GAUGE_LENGTH = 1000;
const GAUGE_WIDTH = 2;
const GAUGE_INSET = GAUGE_WIDTH / 2;

let textColor = '#000000';
let backgroundColor = '#ffffff';
let overlayColor = 'rgba(0,0,0,0.32)';

let stack = null;

function setColor(text, background, overlay) {
    textColor = text;
    backgroundColor = background;
    overlayColor = overlay;
}

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

function wait(text) {
    const loader = text === undefined ? buildLoader() : null;
    const content = loader ? loader.getElement() : buildWaitLabel(text);

    const frame = Frame.createModal(content);
    frame.setTransition('opacity ' + PANEL_FADE + 'ms');
    frame.setOverlayBackground(overlayColor);
    frame.setModalBackground(backgroundColor);
    frame.setModalRadius(PANEL_RADIUS_MULTI + 'px');
    frame.setModalShadow(PANEL_SHADOW);
    frame.setDismiss(() => {});

    const modal = frame.getModal();
    modal.style.overflow = 'hidden';
    modal.style.width = WAIT_SIZE + 'px';
    modal.style.height = WAIT_SIZE + 'px';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    return {
        show: () => {
            frame.show();
            if (loader) {
                loader.play();
            }
        },
        hide: () => {
            frame.hide();
            if (loader) {
                loader.pause();
            }
        },
    };
}

function buildWaitLabel(text) {
    const label = document.createElement('div');
    label.textContent = text;
    label.style.userSelect = 'none';
    label.style.webkitUserSelect = 'none';
    label.style.color = textColor;
    return label;
}

function buildLoader() {
    const head = buildLoaderRing();
    head.appendChild(buildLoaderArc('currentColor', -150, 0));
    head.appendChild(buildLoaderArc(LOADER_TRACK_COLOR, 20, 190));

    const tail = buildLoaderRing();
    tail.appendChild(buildLoaderArc('currentColor', 0, 150));
    tail.appendChild(buildLoaderArc(LOADER_TRACK_COLOR, -190, -20));

    const clip = document.createElement('div');
    clip.style.position = 'absolute';
    clip.style.top = '0px';
    clip.style.left = '0px';
    clip.style.width = '50%';
    clip.style.height = '100%';
    clip.style.overflow = 'hidden';
    clip.appendChild(tail);

    const arc = document.createElement('div');
    arc.style.position = 'absolute';
    arc.style.top = '0px';
    arc.style.left = '0px';
    arc.style.width = '100%';
    arc.style.height = '100%';
    arc.appendChild(head);
    arc.appendChild(clip);

    const loader = document.createElement('div');
    loader.style.position = 'relative';
    loader.style.width = LOADER_SIZE + 'px';
    loader.style.height = LOADER_SIZE + 'px';
    loader.style.color = textColor;
    loader.appendChild(arc);

    const animationList = [
        animateTurn(loader, LOADER_SPIN_ANGLE_LIST, 'linear'),
        animateTurn(arc, LOADER_ARC_ANGLE_LIST, 'ease-in-out'),
        animateTurn(head, LOADER_HEAD_ANGLE_LIST, 'ease-in-out'),
        animateTurn(tail, LOADER_TAIL_ANGLE_LIST, 'ease-in-out'),
    ];

    const api = {};

    api.getElement = () => loader;

    api.play = () => {
        animationList.forEach(animation => animation.play());
    };

    api.pause = () => {
        animationList.forEach(animation => animation.pause());
    };

    api.pause();

    return api;
}

function buildLoaderRing() {
    const disk = document.createElementNS(SVG_NS, 'circle');
    disk.setAttribute('r', LOADER_RADIUS + LOADER_STROKE);
    disk.style.fill = backgroundColor;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', (-LOADER_SIZE / 2) + ' ' + (-LOADER_SIZE / 2) + ' ' + LOADER_SIZE + ' ' + LOADER_SIZE);
    svg.style.position = 'absolute';
    svg.style.top = '0px';
    svg.style.left = '0px';
    svg.style.width = LOADER_SIZE + 'px';
    svg.style.height = LOADER_SIZE + 'px';
    svg.appendChild(disk);
    return svg;
}

function buildLoaderArc(color, from, to) {
    const circumference = 2 * Math.PI * LOADER_RADIUS;

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', LOADER_RADIUS);
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke-width', LOADER_STROKE);
    circle.setAttribute('transform', 'rotate(' + (from - 90) + ')');
    circle.style.stroke = color;
    circle.style.strokeLinecap = 'round';
    circle.style.strokeDasharray = (circumference * (to - from) / 360) + ' ' + circumference;
    return circle;
}

function animateTurn(element, angleList, easing) {
    const keyframeList = angleList.map(angle => ({ transform: 'rotate(' + angle + 'deg)', easing }));
    return element.animate(keyframeList, { duration: LOADER_STEP_DURATION * (angleList.length - 1), iterations: Infinity });
}

function buildPanel(text, color, duration) {
    const box = document.createElement('div');
    box.style.padding = PANEL_PADDING + 'px';
    box.style.boxSizing = 'border-box';
    box.style.minHeight = (BUTTON_SIZE + PANEL_PADDING * 2) + 'px';
    box.style.userSelect = 'none';
    box.style.webkitUserSelect = 'none';
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.gap = PANEL_PADDING + 'px';
    box.style.fontSize = '0.75em';
    box.style.lineHeight = '1.5';
    box.style.color = COLOR_TEXT;
    box.style.backgroundColor = color;
    box.style.boxShadow = PANEL_SHADOW;

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

    let lines = 1;
    let ringRadius = 0;
    let gauge = null;
    let timer = null;
    let removeTimer = null;
    let shown = false;
    let closable = true;

    const layout = () => {
        box.style.paddingLeft = PANEL_LEFT_SINGLE + 'px';
        box.style.paddingRight = (closable ? PANEL_PADDING : PANEL_LEFT_SINGLE) + 'px';

        const line = parseFloat(getComputedStyle(label).lineHeight);

        lines = Math.max(1, Math.round(label.offsetHeight / line));

        const radius = lines > 1 ? PANEL_RADIUS_MULTI : PANEL_RADIUS_SINGLE;

        ringRadius = radius + GAUGE_WIDTH;

        const side = lines > 1 ? PANEL_LEFT_MULTI : PANEL_LEFT_SINGLE;

        box.style.paddingLeft = side + 'px';
        box.style.paddingRight = (closable ? PANEL_PADDING : side) + 'px';
        box.style.borderRadius = radius + 'px';
        button.style.borderRadius = Math.max(0, Math.min(radius - PANEL_PADDING, BUTTON_SIZE / 2)) + 'px';
        ring.style.borderRadius = ringRadius + 'px';

        if (gauge) {
            gauge.resize(ringRadius);
        }
    };

    const observer = new ResizeObserver(layout);

    const start = () => {
        if (!shown || !gauge) {
            return;
        }
        const time = duration * (lines + 1);
        clearTimeout(timer);
        timer = setTimeout(api.hide, time);
        gauge.start(time);
    };

    const stop = () => {
        if (!gauge) {
            return;
        }
        clearTimeout(timer);
        gauge.stop();
    };

    const api = {};

    api.show = () => {
        if (shown) {
            return;
        }
        shown = true;

        if (!stack) {
            stack = buildStack();
        }

        clearTimeout(removeTimer);
        stack.show();
        stack.getPanel().style.pointerEvents = 'none';
        stack.getContent().appendChild(ring);

        layout();
        if (duration && !gauge) {
            gauge = buildGauge(ring, color, ringRadius);
        }

        observer.observe(ring);
        window.addEventListener('resize', layout);

        ring.getBoundingClientRect();
        ring.style.opacity = '1';

        start();
    };

    api.hide = () => {
        if (!shown) {
            return;
        }
        shown = false;

        observer.disconnect();
        window.removeEventListener('resize', layout);
        stop();

        ring.style.opacity = '0';
        clearTimeout(removeTimer);
        removeTimer = setTimeout(() => {
            ring.remove();
        }, PANEL_FADE);
    };

    api.disableClose = () => {
        closable = false;
        button.style.display = 'none';
        layout();
    };

    api.enableClose = () => {
        closable = true;
        button.style.display = 'flex';
        layout();
    };

    button.addEventListener('click', api.hide);

    ring.addEventListener('pointerenter', stop);
    ring.addEventListener('pointerleave', start);
    ring.addEventListener('pointercancel', start);

    return api;
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

function buildGauge(ring, color, ringRadius) {
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

    api.start = (duration) => {
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
