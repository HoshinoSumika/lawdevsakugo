export const Page = {
    createManager,
};

function createManager(container) {
    const api = {};
    const stack = [];
    let isAnimating = false;
    let duration = 200;
    let offset = '32%';

    container.style.position = 'relative';

    api.open = (next) => {
        if (isAnimating) {
            return;
        }
        isAnimating = true;

        const current = stack[stack.length - 1];
        if (current) {
            hideOnOpen(current, duration, offset);
        }

        showOnOpen(next, duration, offset).then(() => {
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

        hideOnBack(current, duration, offset);
        showOnBack(prev, duration, offset).then(() => {
            isAnimating = false;
        });
    };

    api.navigate = (next) => {
        if (isAnimating) {
            return;
        }
        isAnimating = true;

        const current = stack[stack.length - 1];
        if (current) {
            hideOnNavigate(current, duration);
        }

        container.appendChild(next);
        showOnNavigate(next, duration).then(() => {
            for (const page of stack) {
                page.remove();
            }
            stack.length = 0;
            stack.push(next);
            isAnimating = false;
        });
    };

    api.isAnimating = () => {
        return isAnimating;
    };

    api.isRoot = () => {
        return stack.length <= 1;
    };

    api.setDuration = (value) => {
        duration = value;
    };

    api.setOffset = (value) => {
        offset = value;
    };

    return api;
}

function showOnOpen(el, duration, offset) {
    el.style.visibility = 'visible';
    el.style.position = '';
    el.style.top = '';
    el.style.left = '';
    const SHOW_FRAMES = [{ opacity: 0, transform: 'translateX(' + offset + ')' }, { opacity: 1, transform: 'translateX(0)' }];
    const ANIM_OPTIONS = { duration, easing: 'ease', fill: 'forwards' };
    return el.animate(SHOW_FRAMES, ANIM_OPTIONS).finished;
}

function hideOnOpen(el, duration, offset) {
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    const HIDE_FRAMES = [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-' + offset + ')' }];
    const ANIM_OPTIONS = { duration, easing: 'ease', fill: 'forwards' };
    return el.animate(HIDE_FRAMES, ANIM_OPTIONS).finished.then(() => {
        el.style.visibility = 'hidden';
    });
}

function showOnBack(el, duration, offset) {
    el.style.visibility = 'visible';
    el.style.position = '';
    el.style.top = '';
    el.style.left = '';
    const SHOW_FRAMES = [{ opacity: 0, transform: 'translateX(-' + offset + ')' }, { opacity: 1, transform: 'translateX(0)' }];
    const ANIM_OPTIONS = { duration, easing: 'ease', fill: 'forwards' };
    return el.animate(SHOW_FRAMES, ANIM_OPTIONS).finished;
}

function hideOnBack(el, duration, offset) {
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    const HIDE_FRAMES = [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(' + offset + ')' }];
    const ANIM_OPTIONS = { duration, easing: 'ease', fill: 'forwards' };
    return el.animate(HIDE_FRAMES, ANIM_OPTIONS).finished.then(() => {
        el.remove();
    });
}

function showOnNavigate(el, duration) {
    el.style.visibility = 'visible';
    el.style.position = '';
    el.style.top = '';
    el.style.left = '';
    const SHOW_FRAMES = [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }];
    const ANIM_OPTIONS = { duration, easing: 'ease', fill: 'forwards' };
    return el.animate(SHOW_FRAMES, ANIM_OPTIONS).finished;
}

function hideOnNavigate(el, duration) {
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    const HIDE_FRAMES = [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.9)' }];
    const ANIM_OPTIONS = { duration, easing: 'ease', fill: 'forwards' };
    return el.animate(HIDE_FRAMES, ANIM_OPTIONS).finished.then(() => {
        el.style.visibility = 'hidden';
    });
}
