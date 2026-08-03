export const Scroll = {
    smooth,
};

const active = new WeakMap();

function smooth(container, toY, duration) {
    const token = {};
    active.set(container, token);

    const fromY = container.scrollTop;
    const distance = toY - fromY;
    const start = performance.now();

    function step(time) {
        if (active.get(container) !== token) {
            return;
        }
        const progress = Math.min((time - start) / duration, 1);
        container.scrollTop = fromY + distance * ease(progress);
        if (progress < 1) {
            requestAnimationFrame(step);
            return;
        }
        active.delete(container);
    }

    requestAnimationFrame(step);
}

function ease(progress) {
    if (progress < 0.5) {
        return 8 * progress ** 4;
    }
    return 1 - ((-2 * progress + 2) ** 4) / 2;
}
