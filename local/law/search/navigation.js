export const Navigation = {
    moveTo,
};

const highlightTimers = new WeakMap();

function moveTo(container, element, value, { highlight, clearHighlight }) {
    const elementTop = element.offsetTop;
    const offset = -16;
    smoothScroll(container, elementTop + offset, 500);
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

function smoothScroll(container, toY, duration) {
    const fromY = container.scrollTop;
    const distance = toY - fromY;
    const start = performance.now();

    function ease(progress) {
        if (progress < 0.5) {
            return 8 * progress ** 4;
        }
        return 1 - ((-2 * progress + 2) ** 4) / 2;
    }

    function scrollStep(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = ease(progress);
        container.scrollTop = fromY + distance * eased;
        if (progress < 1) {
            requestAnimationFrame(scrollStep);
        }
    }

    requestAnimationFrame(scrollStep);
}
