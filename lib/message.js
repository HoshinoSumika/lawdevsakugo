export const Message = {
    tip,
    toast,
    warning,
    error,
    progress,
};

import { Frame } from '/lib/frame.js?v=20260101';
import { Icon } from '/lib/icon.js?v=20260101';

const COLOR_TEXT = '#ffffff';

const COLOR_BACKGROUND_TIP = '#323232';
const COLOR_BACKGROUND_TOAST = '#323232';
const COLOR_BACKGROUND_WARNING = '#8a5300';
const COLOR_BACKGROUND_ERROR = '#b3261e';
const COLOR_BACKGROUND_PROGRESS = '#323232';

const COLOR_BUTTON_HOVER = 'rgba(255, 255, 255, 0.16)';
const COLOR_BUTTON_ACTIVE = 'rgba(255, 255, 255, 0.28)';

const DURATION_NOTIFICATION = 4800;
const DURATION_FADE = 200;

const OFFSET_BOTTOM = 16;
const OFFSET_GAP = 8;
const RADIUS = 8;

function tip(target, text) {
    const content = document.createElement('div');
    content.textContent = text;
    content.style.margin = '0px 8px 0px 8px';
    content.style.padding = '2px 6px 2px 6px';
    content.style.userSelect = 'none';
    content.style.webkitUserSelect = 'none';
    content.style.whiteSpace = 'nowrap';
    content.style.fontSize = '0.75em';
    content.style.color = COLOR_TEXT;
    content.style.backgroundColor = COLOR_BACKGROUND_TIP;

    const triangle = document.createElement('div');
    triangle.style.width = '0';
    triangle.style.height = '0';
    triangle.style.borderLeft = '5px solid transparent';
    triangle.style.borderRight = '5px solid transparent';
    triangle.style.borderBottom = '5px solid ' + COLOR_BACKGROUND_TIP;

    const tip = Frame.createPanel(content);

    const arrow = Frame.createPanel(triangle);

    target.addEventListener('pointerenter', () => {
        arrow.anchor(target, 'bottom', 2);
        tip.anchor(target, 'bottom', 7);
        arrow.show();
        tip.show();
    });

    target.addEventListener('pointerleave', () => {
        arrow.hide();
        tip.hide();
    });
}

function toast(text, time = DURATION_NOTIFICATION) {
    return notify(text, COLOR_BACKGROUND_TOAST, time);
}

function warning(text, time = DURATION_NOTIFICATION) {
    return notify(text, COLOR_BACKGROUND_WARNING, time);
}

function error(text, time = DURATION_NOTIFICATION) {
    return notify(text, COLOR_BACKGROUND_ERROR, time);
}

function progress(text, time = 0) {
    return notify(text, COLOR_BACKGROUND_PROGRESS, time);
}

const items = [];

function notify(text, background, time) {
    const content = document.createElement('div');
    content.style.padding = '6px 6px 6px 12px';
    content.style.userSelect = 'none';
    content.style.webkitUserSelect = 'none';
    content.style.display = 'flex';
    content.style.justifyContent = 'center';
    content.style.alignItems = 'center';
    content.style.gap = '8px';
    content.style.fontSize = '0.75em';
    content.style.lineHeight = '1.6';
    content.style.color = COLOR_TEXT;
    content.style.backgroundColor = background;
    content.style.borderRadius = RADIUS + 'px';

    const label = document.createElement('div');
    label.style.flex = '1';
    label.style.minWidth = '0px';
    label.textContent = text;
    content.appendChild(label);

    const panel = Frame.createPanel(content);
    panel.setRadius(RADIUS + 'px');
    panel.setShadow('0 8px 32px rgba(0, 0, 0, 0.18)');
    panel.setTransition('opacity ' + DURATION_FADE + 'ms, bottom ' + DURATION_FADE + 'ms');
    panel.getPanel().style.left = '0';
    panel.getPanel().style.right = '0';
    panel.getPanel().style.margin = '0px auto';
    panel.getPanel().style.width = 'max-content';
    panel.getPanel().style.maxWidth = 'calc(100vw - 32px)';

    const item = { panel, timer: null };

    const close = () => {
        const index = items.indexOf(item);
        if (index < 0) {
            return;
        }
        items.splice(index, 1);
        clearTimeout(item.timer);
        panel.hide();
        setTimeout(() => panel.destroy(), DURATION_FADE);
        place();
    };

    content.appendChild(createCloseButton(close));

    items.push(item);
    place();
    panel.show();

    if (time > 0) {
        item.timer = setTimeout(close, time);
    }

    return { close };
}

function place() {
    let bottom = OFFSET_BOTTOM;
    for (let i = items.length - 1; i >= 0; i--) {
        const panel = items[i].panel.getPanel();
        panel.style.bottom = bottom + 'px';
        bottom = bottom + panel.offsetHeight + OFFSET_GAP;
    }
}

function createCloseButton(onClick) {
    const button = document.createElement('div');
    button.style.flex = 'none';
    button.style.width = '20px';
    button.style.height = '20px';
    button.style.cursor = 'pointer';
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.borderRadius = '4px';
    button.innerHTML = Icon.get('close', COLOR_TEXT);

    const svg = button.querySelector('svg');
    svg.setAttribute('width', '14px');
    svg.setAttribute('height', '14px');

    button.addEventListener('pointerenter', () => {
        button.style.backgroundColor = COLOR_BUTTON_HOVER;
    });

    button.addEventListener('pointerleave', () => {
        button.style.backgroundColor = '';
    });

    button.addEventListener('pointerdown', () => {
        button.style.backgroundColor = COLOR_BUTTON_ACTIVE;
    });

    button.addEventListener('pointerup', () => {
        button.style.backgroundColor = COLOR_BUTTON_HOVER;
    });

    button.addEventListener('click', () => {
        onClick();
    });

    return button;
}
