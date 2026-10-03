import { Frame } from '/lib/frame.js';
import { Icon } from '/lib/icon.js';

export const Shell = {
    createPanel,
    createModal,
};

const motion = 'transform var(--transition-duration) ease';
const motionHeight = motion + ', height var(--transition-duration) ease';

const placements = ['left', 'right', 'top', 'bottom'];

const grips = ['top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'];

const gripEdges = {
    'top-left': ['top', 'left'],
    'top': ['top'],
    'top-right': ['top', 'right'],
    'left': ['left'],
    'right': ['right'],
    'bottom-left': ['bottom', 'left'],
    'bottom': ['bottom'],
    'bottom-right': ['bottom', 'right'],
};

const minWidth = 256;
const minHeight = 128;

const closedTransforms = {
    left: 'translateX(-100%)',
    right: 'translateX(100%)',
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
};

let cascadeOffset = 0;

function createPanel(content) {
    const titleNav = buildTitle();
    const titleText = titleNav.firstChild;

    content.style.flex = '1';

    const frame = Frame.createPanel(content);
    frame.setTransition('opacity var(--transition-duration)');

    const panel = frame.getPanel();
    panel.className = 'shell-panel';
    panel.style.top = 'calc(25vh + ' + cascadeOffset + 'px)';
    panel.style.left = 'calc(25vw + ' + cascadeOffset + 'px)';
    cascadeOffset = (cascadeOffset + 24) % 120;

    panel.insertBefore(titleNav, content);

    const shade = buildShade(titleNav, content);

    for (const name of grips) {
        const resize = buildResize(panel, name);
        panel.appendChild(resize);
    }

    panel.addEventListener('pointerdown', () => {
        panel.style.zIndex = Frame.getIndex();
    });

    titleText.classList.add('is-grab');

    buildDrag(titleText, (e) => {
        titleText.classList.add('is-held');
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = panel.offsetLeft;
        const startTop = panel.offsetTop;
        return (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            const maxLeft = window.innerWidth - panel.offsetWidth;
            const maxTop = window.innerHeight - panel.offsetHeight;
            panel.style.left = Math.max(0, Math.min(maxLeft, startLeft + dx)) + 'px';
            panel.style.top = Math.max(0, Math.min(maxTop, startTop + dy)) + 'px';
        };
    }, () => {
        titleText.classList.remove('is-held');
    });

    const update = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (panel.offsetWidth > vw) {
            panel.style.width = vw + 'px';
        }
        if (panel.offsetHeight > vh) {
            panel.style.height = vh + 'px';
        }
        if (panel.offsetLeft + panel.offsetWidth > vw) {
            panel.style.left = Math.max(0, vw - panel.offsetWidth) + 'px';
        }
        if (panel.offsetTop + panel.offsetHeight > vh) {
            panel.style.top = Math.max(0, vh - panel.offsetHeight) + 'px';
        }
    };

    window.addEventListener('resize', update);
    update();

    let back = null;
    let close = null;

    const api = {};

    api.getContent = () => content;

    api.show = frame.show;

    api.hide = frame.hide;

    api.destroy = () => {
        window.removeEventListener('resize', update);
        frame.destroy();
    };

    api.setTitle = (text) => {
        titleText.textContent = text;
    };

    api.enableShade = shade.enable;

    api.disableShade = shade.disable;

    api.updateShade = shade.update;

    api.disableBackButton = () => {
        if (back) {
            back.remove();
            back = null;
        }
    };

    api.enableBackButton = (onClick) => {
        api.disableBackButton();
        back = buildIconButton(Icon.get('back'), onClick);
        titleNav.insertBefore(back, titleText);
    };

    api.disableCloseButton = () => {
        if (close) {
            close.remove();
            close = null;
        }
    };

    api.enableCloseButton = (onClick) => {
        api.disableCloseButton();
        close = buildIconButton(Icon.get('close'), onClick);
        titleNav.appendChild(close);
    };

    return api;
}

function createModal(content) {
    const titleNav = buildTitle();
    const titleText = titleNav.firstChild;

    const actionNav = buildNav('shell-nav shell-nav-action');

    const scroll = document.createElement('div');
    scroll.className = 'shell-scroll';

    const frame = Frame.createModal(content);
    frame.setOverlayBackground('rgba(0,0,0,0.32)');
    frame.setTransition('opacity var(--transition-duration)');
    frame.setModalTransition(motion);

    const modal = frame.getModal();
    modal.className = 'shell-modal';
    modal.style.overflow = 'hidden';

    modal.insertBefore(scroll, content);
    scroll.appendChild(content);
    modal.insertBefore(titleNav, scroll);
    modal.appendChild(actionNav);

    const shade = buildShade(titleNav, scroll);

    let closedTransform = '';
    let back = null;
    let close = null;
    let fixed = '';
    let shown = false;

    const resetHeight = () => {
        modal.style.transition = motion;
        modal.style.height = fixed;
        scroll.style.flex = fixed ? '1' : '';
    };

    modal.addEventListener('transitionend', (e) => {
        if (e.target === modal && e.propertyName === 'height') {
            resetHeight();
        }
    });

    const api = {};

    api.getContent = () => content;

    api.resetScroll = () => {
        scroll.scrollTop = 0;
    };

    api.fitHeight = (change) => {
        const from = modal.offsetHeight;

        change();

        if (!shown || fixed) {
            return;
        }

        resetHeight();

        const to = modal.offsetHeight;

        if (from === to) {
            return;
        }

        modal.style.transition = 'none';
        modal.style.height = from + 'px';
        modal.getBoundingClientRect();

        modal.style.transition = motionHeight;
        modal.style.height = to + 'px';
        scroll.style.flex = '1';
    };

    api.show = () => {
        shown = true;
        frame.show();
        requestAnimationFrame(() => {
            modal.style.transform = '';
        });
    };

    api.hide = () => {
        shown = false;
        resetHeight();
        modal.style.transform = closedTransform;
        frame.hide();
    };

    frame.setDismiss(api.hide);

    api.setDismiss = (onDismiss) => {
        frame.setDismiss(onDismiss || api.hide);
    };

    api.destroy = () => {
        frame.destroy();
    };

    api.dismiss = () => {
        api.hide();

        const panel = frame.getPanel();

        const onEnd = (e) => {
            if (e.target === panel && e.propertyName === 'opacity') {
                panel.removeEventListener('transitionend', onEnd);
                api.destroy();
            }
        };

        panel.addEventListener('transitionend', onEnd);
    };

    api.setTitle = (text) => {
        titleText.textContent = text;
    };

    api.enableShade = shade.enable;

    api.disableShade = shade.disable;

    api.updateShade = shade.update;

    api.setWidth = (value) => {
        modal.style.width = value;
    };

    api.setHeight = (value) => {
        fixed = value;
        modal.style.height = value;
        modal.style.maxHeight = 'none';
        scroll.style.flex = '1';
    };

    api.setMaxHeight = (value) => {
        fixed = '';
        modal.style.height = '';
        modal.style.maxHeight = value;
        scroll.style.flex = '';
    };

    api.setPlacement = (placement) => {
        for (const name of placements) {
            modal.classList.remove('is-' + name);
        }

        closedTransform = closedTransforms[placement] || '';

        if (placements.includes(placement)) {
            modal.classList.add('is-' + placement);
        }

        if (placement === 'left' || placement === 'right') {
            api.setWidth('min(80%, 320px)');
            api.setHeight('100%');
        } else if (placement === 'top' || placement === 'bottom') {
            api.setWidth('100%');
            api.setHeight('90%');
        }

        modal.style.transform = closedTransform;
    };

    api.disableBackButton = () => {
        if (back) {
            back.remove();
            back = null;
        }
    };

    api.enableBackButton = (onClick) => {
        api.disableBackButton();
        back = buildIconButton(Icon.get('back'), onClick);
        titleNav.insertBefore(back, titleText);
    };

    api.disableCloseButton = () => {
        if (close) {
            close.remove();
            close = null;
        }
    };

    api.enableCloseButton = (onClick) => {
        api.disableCloseButton();
        close = buildIconButton(Icon.get('close'), onClick);
        titleNav.appendChild(close);
    };

    api.addLeftButton = (label, onClick) => {
        const button = buildTextButton(label, onClick);
        button.classList.add('is-left');
        actionNav.appendChild(button);
        actionNav.classList.add('is-on');
        return button;
    };

    api.addRightButton = (label, onClick) => {
        const button = buildTextButton(label, onClick);
        actionNav.appendChild(button);
        actionNav.classList.add('is-on');
        return button;
    };

    api.clearNav = () => {
        while (actionNav.firstChild) {
            actionNav.removeChild(actionNav.firstChild);
        }
        actionNav.classList.remove('is-on');
    };

    return api;
}

function buildNav(className) {
    const nav = document.createElement('div');
    nav.className = className;
    return nav;
}

function buildTitle() {
    const nav = buildNav('shell-nav shell-nav-title');
    const title = document.createElement('div');
    title.className = 'shell-title';
    nav.appendChild(title);
    return nav;
}

function buildShade(titleNav, area) {
    let enabled = true;

    const update = (target) => {
        if (!enabled) {
            return;
        }
        titleNav.classList.toggle('is-raised', target.scrollTop > 0);
    };

    area.addEventListener('scroll', (e) => {
        update(e.target);
    }, true);

    const api = {};

    api.update = update;

    api.enable = () => {
        enabled = true;
    };

    api.disable = () => {
        enabled = false;
        titleNav.classList.remove('is-raised');
    };

    return api;
}

function buildDrag(target, onStart, onEnd) {
    target.addEventListener('pointerdown', (e) => {
        if (!e.isPrimary || e.button !== 0) {
            return;
        }

        e.preventDefault();
        target.setPointerCapture(e.pointerId);

        const pointer = e.pointerId;
        const onDrag = onStart(e);

        const onMove = (ev) => {
            if (ev.pointerId !== pointer) {
                return;
            }

            onDrag(ev);
        };

        const onUp = (ev) => {
            if (ev.pointerId !== pointer) {
                return;
            }

            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onUp);

            if (target.hasPointerCapture(pointer)) {
                target.releasePointerCapture(pointer);
            }

            if (onEnd) {
                onEnd();
            }
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
    });
}

function buildResize(panel, name) {
    const resize = document.createElement('div');
    resize.className = 'shell-resize is-' + name;

    const edges = gripEdges[name];

    buildDrag(resize, (e) => {
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = panel.offsetWidth;
        const startHeight = panel.offsetHeight;
        const startLeft = panel.offsetLeft;
        const startTop = panel.offsetTop;
        const startRight = startLeft + startWidth;
        const startBottom = startTop + startHeight;
        return (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (edges.includes('top')) {
                const height = Math.max(minHeight, Math.min(startBottom, startHeight - dy));
                panel.style.height = height + 'px';
                panel.style.top = (startBottom - height) + 'px';
            }
            if (edges.includes('bottom')) {
                const maxHeight = window.innerHeight - startTop;
                panel.style.height = Math.max(minHeight, Math.min(maxHeight, startHeight + dy)) + 'px';
            }
            if (edges.includes('left')) {
                const width = Math.max(minWidth, Math.min(startRight, startWidth - dx));
                panel.style.width = width + 'px';
                panel.style.left = (startRight - width) + 'px';
            }
            if (edges.includes('right')) {
                const maxWidth = window.innerWidth - startLeft;
                panel.style.width = Math.max(minWidth, Math.min(maxWidth, startWidth + dx)) + 'px';
            }
        };
    });

    return resize;
}

function buildIconButton(icon, onClick) {
    const button = document.createElement('div');
    button.className = 'shell-button shell-button-icon';
    button.innerHTML = icon;
    button.addEventListener('click', () => onClick());
    return button;
}

function buildTextButton(text, onClick) {
    const button = document.createElement('div');
    button.className = 'shell-button shell-button-text';
    button.textContent = text;
    button.addEventListener('click', () => onClick());
    return button;
}
