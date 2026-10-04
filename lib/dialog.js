import { Design } from './design.js';
import { Frame } from './frame.js';

export const Dialog = {
    setColor,
    createPanel,
    createModal,
};

let textColor = '#000000';
let backgroundColor = '#ffffff';
let overlayColor = 'rgba(0,0,0,0.32)';

const borderColor = 'color-mix(in srgb, currentColor 16%, transparent)';
const hoverColor = 'color-mix(in srgb, currentColor 8%, transparent)';
const activeColor = 'color-mix(in srgb, currentColor 12%, transparent)';

const radius = 24;
const dockedRadius = radius / 2;

const panelShadow = '0 8px 32px rgba(0,0,0,0.18)';
const modalShadow = '0 24px 64px rgba(0,0,0,0.32)';
const titleShadow = '0 2px 8px rgba(0,0,0,0.12)';
const actionShadow = '0 -2px 8px rgba(0,0,0,0.12)';

const duration = 200;

const navTitleHeight = 56;
const navTitlePadding = 12;
const navActionHeight = 52;
const navActionPadding = 8;

const minWidth = 256;
const minHeight = 128;

const placementMap = {
    center: {
        closedTransform: '',
        margin: '',
        borderRadius: radius + 'px',
        paddingBottom: '',
        width: 'min(480px, 90vw)',
        maxHeight: '55dvh',
    },
    left: {
        closedTransform: 'translateX(-100%)',
        margin: '0px auto 0px 0px',
        borderRadius: '0px ' + dockedRadius + 'px ' + dockedRadius + 'px 0px',
        paddingBottom: '',
        width: 'min(80%, 320px)',
        height: '100%',
    },
    right: {
        closedTransform: 'translateX(100%)',
        margin: '0px 0px 0px auto',
        borderRadius: dockedRadius + 'px 0px 0px ' + dockedRadius + 'px',
        paddingBottom: '',
        width: 'min(80%, 320px)',
        height: '100%',
    },
    top: {
        closedTransform: 'translateY(-100%)',
        margin: '0px 0px auto 0px',
        borderRadius: '0px 0px ' + dockedRadius + 'px ' + dockedRadius + 'px',
        paddingBottom: '',
        width: '100%',
        height: '90%',
    },
    bottom: {
        closedTransform: 'translateY(100%)',
        margin: 'auto 0px 0px 0px',
        borderRadius: dockedRadius + 'px ' + dockedRadius + 'px 0px 0px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        width: '100%',
        height: '90%',
    },
};

const gripMap = {
    'top-left': {
        edgeList: ['top', 'left'],
        style: { top: '0px', left: '0px', width: '12px', height: '12px', cursor: 'nwse-resize' },
    },
    'top': {
        edgeList: ['top'],
        style: { top: '0px', right: '12px', left: '12px', height: '6px', cursor: 'ns-resize' },
    },
    'top-right': {
        edgeList: ['top', 'right'],
        style: { top: '0px', right: '0px', width: '12px', height: '12px', cursor: 'nesw-resize' },
    },
    'left': {
        edgeList: ['left'],
        style: { top: '12px', bottom: '12px', left: '0px', width: '6px', cursor: 'ew-resize' },
    },
    'right': {
        edgeList: ['right'],
        style: { top: '12px', right: '0px', bottom: '12px', width: '6px', cursor: 'ew-resize' },
    },
    'bottom-left': {
        edgeList: ['bottom', 'left'],
        style: { bottom: '0px', left: '0px', width: '12px', height: '12px', cursor: 'nesw-resize' },
    },
    'bottom': {
        edgeList: ['bottom'],
        style: { right: '12px', bottom: '0px', left: '12px', height: '6px', cursor: 'ns-resize' },
    },
    'bottom-right': {
        edgeList: ['bottom', 'right'],
        style: { right: '0px', bottom: '0px', width: '12px', height: '12px', cursor: 'nwse-resize' },
    },
};

let cascadeOffset = 0;

function setColor(text, background, overlay) {
    textColor = text;
    backgroundColor = background;
    overlayColor = overlay;
}

function createPanel(content) {
    const titleNav = buildTitleNav();
    const titleText = titleNav.firstChild;

    content.style.flex = '1';

    const frame = Frame.createPanel(content);
    frame.setTransition(buildTransition(['opacity']));
    frame.setBackground(backgroundColor);
    frame.setBorder('1px solid ' + borderColor);
    frame.setRadius(radius + 'px');
    frame.setShadow(panelShadow);

    const panel = frame.getPanel();
    panel.className = 'dialog-panel';
    panel.style.top = 'calc(25vh + ' + cascadeOffset + 'px)';
    panel.style.left = 'calc(25vw + ' + cascadeOffset + 'px)';
    panel.style.width = '256px';
    panel.style.height = '160px';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.color = textColor;
    cascadeOffset = (cascadeOffset + 24) % 120;

    panel.insertBefore(titleNav, content);

    const titleShade = buildShade(titleNav, content, isScrolledFromTop, titleShadow);
    const titleButton = buildTitleButton(titleNav, titleText);

    for (const name of Object.keys(gripMap)) {
        const resize = buildResize(panel, gripMap[name]);
        panel.appendChild(resize);
    }

    panel.addEventListener('pointerdown', () => {
        panel.style.zIndex = Frame.getIndex();
    });

    titleText.style.cursor = 'grab';
    titleText.style.touchAction = 'none';

    buildDrag(titleText, (e) => {
        titleText.style.cursor = 'grabbing';
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
        titleText.style.cursor = 'grab';
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

    api.enableTitleShade = titleShade.enable;

    api.disableTitleShade = titleShade.disable;

    api.updateShade = titleShade.update;

    api.enableBackButton = titleButton.enableBackButton;

    api.disableBackButton = titleButton.disableBackButton;

    api.enableCloseButton = titleButton.enableCloseButton;

    api.disableCloseButton = titleButton.disableCloseButton;

    return api;
}

function createModal(content) {
    const titleNav = buildTitleNav();
    const titleText = titleNav.firstChild;

    const actionNav = buildActionNav();
    actionNav.style.background = backgroundColor;
    const actionArea = buildActionArea(actionNav);

    const scroll = document.createElement('div');
    scroll.className = 'dialog-scroll';
    scroll.style.overflowX = 'hidden';
    scroll.style.overflowY = 'auto';
    scroll.style.overscrollBehavior = 'contain';
    scroll.style.scrollbarGutter = 'stable';
    scroll.style.minHeight = '0px';
    scroll.appendChild(content);

    const frame = Frame.createModal(scroll);
    frame.setOverlayBackground(overlayColor);
    frame.setTransition(buildTransition(['opacity']));
    frame.setModalTransition(buildTransition(['transform']));
    frame.setModalBackground(backgroundColor);
    frame.setModalBorder('none');
    frame.setModalShadow(modalShadow);

    const modal = frame.getModal();
    modal.className = 'dialog-modal';
    modal.style.overflow = 'hidden';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.color = textColor;

    modal.insertBefore(titleNav, scroll);
    modal.appendChild(actionArea);

    const titleShade = buildShade(titleNav, scroll, isScrolledFromTop, titleShadow);
    const actionShade = buildShade(actionNav, scroll, isScrolledFromBottom, actionShadow);
    const titleButton = buildTitleButton(titleNav, titleText);

    const refreshShade = () => {
        titleShade.refresh();
        actionShade.refresh();
    };

    let closedTransform = '';
    let fixed = '';
    let shown = false;

    const resetHeight = () => {
        modal.style.transition = buildTransition(['transform']);
        modal.style.height = fixed;
        scroll.style.flex = fixed ? '1' : '';
        scroll.style.overflowY = 'auto';
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
            refreshShade();
            return;
        }

        resetHeight();
        refreshShade();

        const to = modal.offsetHeight;

        if (from === to) {
            return;
        }

        scroll.style.overflowY = 'hidden';
        modal.style.transition = 'none';
        modal.style.height = from + 'px';
        modal.getBoundingClientRect();

        modal.style.transition = buildTransition(['transform', 'height']);
        modal.style.height = to + 'px';
        scroll.style.flex = '1';
    };

    api.show = () => {
        shown = true;
        frame.show();
        requestAnimationFrame(() => {
            modal.style.transform = '';
            refreshShade();
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

    api.enableTitleShade = titleShade.enable;

    api.disableTitleShade = titleShade.disable;

    api.updateShade = (target) => {
        titleShade.update(target);
        actionShade.update(target);
    };

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
        const layout = placementMap[placement] || placementMap.center;

        closedTransform = layout.closedTransform;
        modal.style.margin = layout.margin;
        modal.style.paddingBottom = layout.paddingBottom;
        frame.setModalRadius(layout.borderRadius);
        api.setWidth(layout.width);

        if (layout.height) {
            api.setHeight(layout.height);
        } else {
            api.setMaxHeight(layout.maxHeight);
        }

        modal.style.transform = shown ? '' : closedTransform;
    };

    api.enableBackButton = titleButton.enableBackButton;

    api.disableBackButton = titleButton.disableBackButton;

    api.enableCloseButton = titleButton.enableCloseButton;

    api.disableCloseButton = titleButton.disableCloseButton;

    let actionNavVisible = false;
    let staleCount = 0;

    const removeStaleButton = () => {
        while (staleCount > 0) {
            actionNav.firstChild.remove();
            staleCount = staleCount - 1;
        }
    };

    const hideActionNav = () => {
        actionNav.style.visibility = 'hidden';
        removeStaleButton();
    };

    const toggleActionNav = (visible) => {
        if (actionNavVisible === visible) {
            return;
        }
        actionNavVisible = visible;

        actionArea.style.transition = shown ? buildTransition(['height']) : 'none';
        actionNav.style.transition = shown ? buildTransition(['box-shadow', 'opacity']) : 'none';

        if (visible) {
            actionNav.style.visibility = 'visible';
        }
        actionArea.style.height = visible ? navActionHeight + 'px' : '0px';
        actionNav.style.opacity = visible ? '1' : '0';

        if (!shown) {
            if (!visible) {
                hideActionNav();
            }
            refreshShade();
        }
    };

    actionArea.addEventListener('transitionend', (e) => {
        if (e.target !== actionArea || e.propertyName !== 'height') {
            return;
        }
        if (!actionNavVisible) {
            hideActionNav();
        }
        refreshShade();
    });

    api.addLeftButton = (label, onClick) => {
        removeStaleButton();
        const button = buildTextButton(label, onClick);
        button.style.marginRight = 'auto';
        actionNav.appendChild(button);
        toggleActionNav(true);
        return button;
    };

    api.addRightButton = (label, onClick) => {
        removeStaleButton();
        const button = buildTextButton(label, onClick);
        actionNav.appendChild(button);
        toggleActionNav(true);
        return button;
    };

    api.clearNav = () => {
        staleCount = actionNav.children.length;
        toggleActionNav(false);
    };

    api.setPlacement('center');

    return api;
}

function buildTransition(propertyList) {
    return propertyList.map(property => property + ' ' + duration + 'ms ease').join(', ');
}

function buildNav(className, height, padding) {
    const nav = document.createElement('div');
    nav.className = className;
    nav.style.position = 'relative';
    nav.style.zIndex = '1';
    nav.style.flex = 'none';
    nav.style.boxSizing = 'border-box';
    nav.style.width = '100%';
    nav.style.height = height + 'px';
    nav.style.padding = padding + 'px';
    nav.style.userSelect = 'none';
    nav.style.webkitUserSelect = 'none';
    nav.style.display = 'flex';
    nav.style.justifyContent = 'flex-end';
    nav.style.alignItems = 'center';
    nav.style.transition = buildTransition(['box-shadow']);
    return nav;
}

function buildTitleNav() {
    const nav = buildNav('dialog-nav-title', navTitleHeight, navTitlePadding);

    const title = document.createElement('div');
    title.className = 'dialog-title';
    title.style.overflow = 'hidden';
    title.style.flex = '1';
    title.style.padding = '0px 16px';
    title.style.fontWeight = 'bold';
    title.style.whiteSpace = 'nowrap';
    title.style.textOverflow = 'ellipsis';

    nav.appendChild(title);
    return nav;
}

function buildActionNav() {
    const nav = buildNav('dialog-nav-action', navActionHeight, navActionPadding);
    nav.style.position = 'absolute';
    nav.style.right = '0px';
    nav.style.bottom = '0px';
    nav.style.left = '0px';
    nav.style.visibility = 'hidden';
    nav.style.gap = '4px';
    nav.style.opacity = '0';
    nav.style.transition = buildTransition(['box-shadow', 'opacity']);
    return nav;
}

function buildActionArea(nav) {
    const area = document.createElement('div');
    area.className = 'dialog-action-area';
    area.style.position = 'relative';
    area.style.flex = 'none';
    area.style.height = '0px';
    area.style.transition = buildTransition(['height']);
    area.appendChild(nav);
    return area;
}

function buildTitleButton(titleNav, titleText) {
    let back = null;
    let close = null;

    const api = {};

    api.disableBackButton = () => {
        if (back) {
            back.remove();
            back = null;
        }
    };

    api.enableBackButton = (onClick) => {
        api.disableBackButton();
        back = buildIconButton('back', onClick);
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
        close = buildIconButton('close', onClick);
        titleNav.appendChild(close);
    };

    return api;
}

function isScrolledFromTop(target) {
    return target.scrollTop > 0;
}

function isScrolledFromBottom(target) {
    return target.scrollHeight - target.clientHeight - target.scrollTop > 1;
}

function buildShade(nav, area, isRaised, shadow) {
    let enabled = true;
    let current = area;

    const update = (target) => {
        current = target;
        if (!enabled) {
            return;
        }
        nav.style.boxShadow = isRaised(target) ? shadow : '';
    };

    area.addEventListener('scroll', (e) => {
        update(e.target);
    }, true);

    const api = {};

    api.update = update;

    api.refresh = () => {
        update(current);
    };

    api.enable = () => {
        enabled = true;
        update(current);
    };

    api.disable = () => {
        enabled = false;
        nav.style.boxShadow = '';
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

function buildResize(panel, grip) {
    const resize = document.createElement('div');
    resize.className = 'dialog-resize';
    resize.style.position = 'absolute';
    resize.style.touchAction = 'none';
    Object.assign(resize.style, grip.style);

    const edgeList = grip.edgeList;

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
            if (edgeList.includes('top')) {
                const height = Math.max(minHeight, Math.min(startBottom, startHeight - dy));
                panel.style.height = height + 'px';
                panel.style.top = (startBottom - height) + 'px';
            }
            if (edgeList.includes('bottom')) {
                const maxHeight = window.innerHeight - startTop;
                panel.style.height = Math.max(minHeight, Math.min(maxHeight, startHeight + dy)) + 'px';
            }
            if (edgeList.includes('left')) {
                const width = Math.max(minWidth, Math.min(startRight, startWidth - dx));
                panel.style.width = width + 'px';
                panel.style.left = (startRight - width) + 'px';
            }
            if (edgeList.includes('right')) {
                const maxWidth = window.innerWidth - startLeft;
                panel.style.width = Math.max(minWidth, Math.min(maxWidth, startWidth + dx)) + 'px';
            }
        };
    });

    return resize;
}

function buildButton(onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.style.height = '100%';
    button.style.padding = '0px';
    button.style.cursor = 'pointer';
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.font = 'inherit';
    button.style.color = 'inherit';
    button.style.backgroundColor = 'transparent';
    button.style.border = 'none';
    button.style.borderRadius = '999px';

    button.addEventListener('pointerenter', () => {
        button.style.backgroundColor = hoverColor;
    });

    button.addEventListener('pointerleave', () => {
        button.style.backgroundColor = 'transparent';
    });

    button.addEventListener('pointerdown', () => {
        button.style.backgroundColor = activeColor;
    });

    button.addEventListener('pointerup', () => {
        button.style.backgroundColor = hoverColor;
    });

    button.addEventListener('click', () => onClick());
    return button;
}

function buildIconButton(name, onClick) {
    const button = buildButton(onClick);
    button.className = 'dialog-button-icon';
    button.style.aspectRatio = '1 / 1';
    button.innerHTML = Design.getIcon(name);
    return button;
}

function buildTextButton(text, onClick) {
    const button = buildButton(onClick);
    button.className = 'dialog-button-text';
    button.style.padding = '0px 16px';
    button.style.fontSize = '0.8125em';
    button.style.whiteSpace = 'nowrap';
    button.textContent = text;
    return button;
}
