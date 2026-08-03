export const Navigation = {
    moveTo,
};

import { Scroll } from '/lib/scroll.js?v=20260101';

const SCROLL_DURATION = 500;
const highlightTimers = new WeakMap();

function moveTo(container, element, value, { highlight, clearHighlight }) {
    const elementTop = element.offsetTop;
    const offset = -16;
    Scroll.smooth(container, elementTop + offset, SCROLL_DURATION);
    highlight(element, value);

    const oldTimer = highlightTimers.get(element);
    if (oldTimer) {
        clearTimeout(oldTimer);
    }

    const timer = setTimeout(() => {
        clearHighlight(element);
        highlightTimers.delete(element);
    }, 2000);
    highlightTimers.set(element, timer);
}
