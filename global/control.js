export const Control = {
    createInstance,
};

function createInstance(container) {
    const api = {};
    const stack = [];
    let isAnimating = false;
    let offset = '32%';

    container.style.overflow = 'hidden';
    container.style.position = 'relative';

    api.open = (next) => {
        if (isAnimating) {
            return;
        }
        isAnimating = true;

        next.style.position = 'absolute';
        next.style.top = '0';
        next.style.left = '0';
        next.style.width = '100%';
        next.style.height = '100%';

        const current = stack[stack.length - 1];
        if (current) {
            hideOnOpen(current, offset);
        }
        showOnOpen(next, offset).then(() => {
            isAnimating = false;
        });
        container.appendChild(next);
        stack.push(next);
    };

    api.back = () => {
        if (stack.length <= 1) {
            return;
        }
        if (isAnimating) {
            return;
        }
        isAnimating = true;

        const current = stack.pop();
        const prev = stack[stack.length - 1];
        hideOnBack(current, offset);
        showOnBack(prev, offset).then(() => {
            isAnimating = false;
        });
    };

    api.isRoot = () => {
        if (stack.length <= 1) {
            return true;
        } else {
            return false;
        }
    };

    api.setOffset = (value) => {
        offset = value;
    };

    return api;
}

function showOnOpen(el, offset) {
    el.style.visibility = 'visible';
    const SHOW_FRAMES = [{ opacity: 0, transform: 'translateX(' + offset + ')' }, { opacity: 1, transform: 'translateX(0)' }];
    const ANIM_OPTIONS = { duration: 200, easing: 'ease', fill: 'forwards' };
    return el.animate(SHOW_FRAMES, ANIM_OPTIONS).finished;
}

function hideOnOpen(el, offset) {
    const HIDE_FRAMES = [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-' + offset + ')' }];
    const ANIM_OPTIONS = { duration: 200, easing: 'ease', fill: 'forwards' };
    return el.animate(HIDE_FRAMES, ANIM_OPTIONS).finished.then(() => {
        el.style.visibility = 'hidden';
    });
}

function showOnBack(el, offset) {
    el.style.visibility = 'visible';
    const SHOW_FRAMES = [{ opacity: 0, transform: 'translateX(-' + offset + ')' }, { opacity: 1, transform: 'translateX(0)' }];
    const ANIM_OPTIONS = { duration: 200, easing: 'ease', fill: 'forwards' };
    return el.animate(SHOW_FRAMES, ANIM_OPTIONS).finished;
}

function hideOnBack(el, offset) {
    const HIDE_FRAMES = [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(' + offset + ')' }];
    const ANIM_OPTIONS = { duration: 200, easing: 'ease', fill: 'forwards' };
    return el.animate(HIDE_FRAMES, ANIM_OPTIONS).finished.then(() => {
        el.remove();
    });
}
