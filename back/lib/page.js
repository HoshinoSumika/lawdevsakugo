export const Page = {
    createManager,
};

function createManager(container) {
    if (!container) {
        return null;
    }

    const position = container.style.position;
    const overflow = container.style.overflow;
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }
    container.style.overflow = 'hidden';

    const stack = [];
    let duration = 200;
    let distance = '100%';
    let easing = 'ease';
    let moving = false;

    const api = {};

    api.getCurrent = () => stack.length ? stack[stack.length - 1].content : null;

    api.getDepth = () => stack.length;

    api.isRoot = () => stack.length === 1;

    api.setDuration = (value) => {
        duration = value;
    };

    api.setDistance = (value) => {
        distance = value;
    };

    api.setEasing = (value) => {
        easing = value;
    };

    api.open = (content) => {
        if (!content || moving) {
            return;
        }

        const layer = document.createElement('div');
        layer.style.position = 'absolute';
        layer.style.inset = '0';
        layer.appendChild(content);
        container.appendChild(layer);

        const current = stack[stack.length - 1];
        stack.push({ content, layer });
        if (!current) {
            return;
        }

        moving = true;
        current.layer.style.display = '';
        const outgoing = current.layer.animate([
            { transform: 'translateX(0)', opacity: 1 },
            { transform: 'translateX(calc(0px - ' + distance + '))', opacity: 0 },
        ], { duration, easing, fill: 'forwards' });
        const incoming = layer.animate([
            { transform: 'translateX(' + distance + ')', opacity: 0 },
            { transform: 'translateX(0)', opacity: 1 },
        ], { duration, easing, fill: 'forwards' });
        incoming.onfinish = () => {
            current.layer.style.display = 'none';
            outgoing.cancel();
            incoming.cancel();
            moving = false;
        };
    };

    api.close = () => {
        if (stack.length < 2 || moving) {
            return;
        }

        moving = true;
        const current = stack.pop();
        const previous = stack[stack.length - 1];
        previous.layer.style.display = '';
        const incoming = previous.layer.animate([
            { transform: 'translateX(calc(0px - ' + distance + '))', opacity: 0 },
            { transform: 'translateX(0)', opacity: 1 },
        ], { duration, easing, fill: 'forwards' });
        const outgoing = current.layer.animate([
            { transform: 'translateX(0)', opacity: 1 },
            { transform: 'translateX(' + distance + ')', opacity: 0 },
        ], { duration, easing, fill: 'forwards' });
        outgoing.onfinish = () => {
            current.layer.remove();
            incoming.cancel();
            outgoing.cancel();
            moving = false;
        };
    };

    api.clear = () => {
        if (moving) {
            return;
        }
        for (const page of stack) {
            page.layer.remove();
        }
        stack.length = 0;
    };

    api.destroy = () => {
        if (moving) {
            return;
        }
        api.clear();
        container.style.position = position;
        container.style.overflow = overflow;
    };

    return api;
}
