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
const modalShadowMargin = 96;
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
    scroll.style.flex = '1 1 auto';
    scroll.style.minHeight = '0px';
    scroll.appendChild(content);

    const body = document.createElement('div');
    body.className = 'dialog-body';
    body.style.position = 'relative';
    body.style.overflow = 'hidden';
    body.style.flex = '1 1 auto';
    body.style.minHeight = '0px';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.appendChild(scroll);

    const topCard = buildModalCard();
    topCard.style.top = modalShadowMargin + 'px';

    const topClip = buildModalClip('dialog-top-clip', topCard);
    topClip.style.top = -modalShadowMargin + 'px';
    topClip.style.bottom = '50%';

    const bottomCard = buildModalCard();

    const bottomClip = buildModalClip('dialog-bottom-clip', bottomCard);
    bottomClip.style.top = '50%';
    bottomClip.style.bottom = -modalShadowMargin + 'px';

    const frame = Frame.createModal(body);
    frame.setOverlayBackground(overlayColor);
    frame.setTransition(buildTransition(['opacity']));
    frame.setModalTransition(buildTransition(['transform']));
    frame.setModalBackground(backgroundColor);
    frame.setModalBorder('none');
    frame.setModalShadow(modalShadow);

    const modal = frame.getModal();
    modal.className = 'dialog-modal';
    modal.style.position = 'relative';
    modal.style.overflow = 'hidden';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.color = textColor;

    modal.insertBefore(topClip, body);
    modal.insertBefore(bottomClip, body);
    modal.insertBefore(titleNav, body);
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
    let actionNavVisible = false;
    let staleCount = 0;
    let heightAnimationList = null;
    let heightTarget = 0;
    let navAnimation = null;

    const getVisibleHeight = () => {
        if (!heightAnimationList) {
            return modal.offsetHeight;
        }
        const shift = new DOMMatrix(getComputedStyle(topCard).transform).m42;
        return modal.offsetHeight - shift * 2;
    };

    const stopHeight = () => {
        if (!heightAnimationList) {
            return;
        }
        heightAnimationList.forEach(animation => {
            animation.cancel();
        });
        heightAnimationList = null;

        topClip.style.display = 'none';
        bottomClip.style.display = 'none';
        modal.style.height = fixed;
        modal.style.overflow = 'hidden';
        frame.setModalBackground(backgroundColor);
        frame.setModalShadow(modalShadow);
        scroll.style.overflowY = 'auto';
        body.style.borderBottomLeftRadius = '';
        body.style.borderBottomRightRadius = '';
        actionNav.style.borderBottomLeftRadius = '';
        actionNav.style.borderBottomRightRadius = '';
    };

    const finishHeight = () => {
        const target = heightTarget;
        stopHeight();
        if (navAnimation) {
            modal.style.height = target + 'px';
        }
        refreshShade();
    };

    const startHeight = (from, to) => {
        const height = Math.max(from, to);
        const fromShift = (height - from) / 2;
        const toShift = (height - to) / 2;
        const cornerRadius = modal.style.borderRadius;

        heightTarget = to;
        modal.style.height = height + 'px';
        modal.style.overflow = 'visible';
        frame.setModalBackground('transparent');
        frame.setModalShadow('none');
        scroll.style.overflowY = 'hidden';
        body.style.borderBottomLeftRadius = cornerRadius;
        body.style.borderBottomRightRadius = cornerRadius;
        actionNav.style.borderBottomLeftRadius = cornerRadius;
        actionNav.style.borderBottomRightRadius = cornerRadius;

        topCard.style.height = height + 'px';
        topCard.style.borderRadius = cornerRadius;
        bottomCard.style.top = -(height / 2) + 'px';
        bottomCard.style.height = height + 'px';
        bottomCard.style.borderRadius = cornerRadius;
        topClip.style.display = '';
        bottomClip.style.display = '';

        heightAnimationList = [
            animateShift(topCard, fromShift, toShift),
            animateShift(bottomCard, -fromShift, -toShift),
            animateShift(titleNav, fromShift, toShift),
            animateShift(body, -fromShift, -toShift),
            animateShift(scroll, fromShift * 2, toShift * 2),
            animateShift(actionArea, -fromShift, -toShift),
        ];
        heightAnimationList[0].onfinish = finishHeight;
    };

    const measureHeight = () => {
        const marginTop = actionArea.style.marginTop;
        const height = actionArea.style.height;
        actionArea.style.marginTop = '';
        actionArea.style.height = actionNavVisible ? navActionHeight + 'px' : '0px';
        const result = modal.offsetHeight;
        actionArea.style.marginTop = marginTop;
        actionArea.style.height = height;
        return result;
    };

    const api = {};

    api.getContent = () => content;

    api.resetScroll = () => {
        scroll.scrollTop = 0;
    };

    api.fitHeight = (change) => {
        const from = getVisibleHeight();
        stopHeight();

        change();
        refreshShade();

        if (!shown || fixed) {
            return false;
        }

        modal.style.height = '';
        const to = measureHeight();

        if (Math.abs(from - to) < 1) {
            if (navAnimation) {
                modal.style.height = to + 'px';
            }
            return false;
        }

        startHeight(from, to);
        return true;
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
        stopHeight();
        finishNav();
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
        stopHeight();
        fixed = value;
        modal.style.height = value;
        modal.style.maxHeight = 'none';
    };

    api.setMaxHeight = (value) => {
        stopHeight();
        fixed = '';
        modal.style.height = '';
        modal.style.maxHeight = value;
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

    const removeStaleButton = () => {
        while (staleCount > 0) {
            actionNav.firstChild.remove();
            staleCount = staleCount - 1;
        }
    };

    const settleActionNav = () => {
        actionArea.style.marginTop = '';
        actionArea.style.height = actionNavVisible ? navActionHeight + 'px' : '0px';
        actionNav.style.opacity = actionNavVisible ? '1' : '0';
        if (!actionNavVisible) {
            actionNav.style.visibility = 'hidden';
            removeStaleButton();
        }
    };

    const finishNav = () => {
        if (!navAnimation) {
            return;
        }
        navAnimation.cancel();
        navAnimation = null;
        settleActionNav();
        if (!heightAnimationList) {
            modal.style.height = fixed;
        }
        refreshShade();
    };

    const overlayActionNav = () => {
        actionArea.style.height = navActionHeight + 'px';
        actionArea.style.marginTop = -navActionHeight + 'px';
    };

    const toggleActionNav = (visible) => {
        if (actionNavVisible === visible) {
            return;
        }

        const opacity = getComputedStyle(actionNav).opacity;
        if (navAnimation) {
            navAnimation.cancel();
            navAnimation = null;
        }

        actionNavVisible = visible;
        if (visible) {
            actionNav.style.visibility = 'visible';
        }

        if (!shown) {
            settleActionNav();
            refreshShade();
            return;
        }

        if (fixed) {
            overlayActionNav();
        } else {
            api.fitHeight(overlayActionNav);
        }

        actionNav.style.opacity = visible ? '1' : '0';
        navAnimation = actionNav.animate([
            { opacity },
            { opacity: visible ? 1 : 0 },
        ], { duration, easing: 'ease' });
        navAnimation.onfinish = finishNav;
    };

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

function animateShift(element, from, to) {
    return element.animate([
        { transform: 'translateY(' + from + 'px)' },
        { transform: 'translateY(' + to + 'px)' },
    ], { duration, easing: 'ease', fill: 'forwards' });
}

function buildModalCard() {
    const card = document.createElement('div');
    card.className = 'dialog-card';
    card.style.position = 'absolute';
    card.style.left = modalShadowMargin + 'px';
    card.style.right = modalShadowMargin + 'px';
    card.style.boxSizing = 'border-box';
    card.style.background = backgroundColor;
    card.style.boxShadow = modalShadow;
    return card;
}

function buildModalClip(className, card) {
    const clip = document.createElement('div');
    clip.className = className;
    clip.style.position = 'absolute';
    clip.style.left = -modalShadowMargin + 'px';
    clip.style.right = -modalShadowMargin + 'px';
    clip.style.display = 'none';
    clip.style.overflow = 'hidden';
    clip.style.pointerEvents = 'none';
    clip.appendChild(card);
    return clip;
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
    nav.style.top = '0px';
    nav.style.right = '0px';
    nav.style.left = '0px';
    nav.style.visibility = 'hidden';
    nav.style.gap = '4px';
    nav.style.opacity = '0';
    return nav;
}

function buildActionArea(nav) {
    const area = document.createElement('div');
    area.className = 'dialog-action-area';
    area.style.position = 'relative';
    area.style.flex = 'none';
    area.style.height = '0px';
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
