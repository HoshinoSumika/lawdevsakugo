import { Frame } from './frame.js?v=20260101';
import { Icon } from './icon.js?v=20260101';

export const Shell = {
    createPanel,
    createModal,
};

let cascadeOffset = 0;

function createPanel(content) {
    if (!content) {
        return null;
    }

    const titleNav = createNav();
    titleNav.style.height = '36px';
    titleNav.style.padding = '0px';
    const titleText = createTitle();
    titleText.style.fontSize = '0.8125em';
    titleNav.appendChild(titleText);

    content.style.flex = '1';
    content.style.borderTop = '1px solid var(--color-border)';

    const frame = Frame.createPanel(content);
    frame.setBackground('var(--color-white)');
    frame.setBorder('1px solid var(--color-border)');
    frame.setRadius('var(--radius-normal)');
    frame.setShadow('0 8px 32px rgba(0,0,0,0.18)');
    frame.setTransition('opacity var(--transition-duration)');

    const panel = frame.getPanel();
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.top = 'calc(25vh + ' + cascadeOffset + 'px)';
    panel.style.left = 'calc(25vw + ' + cascadeOffset + 'px)';
    panel.style.width = '256px';
    panel.style.height = '160px';
    cascadeOffset = (cascadeOffset + 24) % 120;

    panel.insertBefore(titleNav, content);

    const resize = document.createElement('div');
    resize.style.position = 'absolute';
    resize.style.right = '0';
    resize.style.bottom = '0';
    resize.style.width = '12px';
    resize.style.height = '12px';
    resize.style.cursor = 'nwse-resize';
    resize.style.touchAction = 'none';
    for (const [position, length] of [[6, 9.5], [8, 4]]) {
        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.left = position + 'px';
        line.style.top = position + 'px';
        line.style.width = length + 'px';
        line.style.height = '1px';
        line.style.background = 'var(--color-border)';
        line.style.transform = 'translate(-50%,-50%) rotate(-45deg)';
        resize.appendChild(line);
    }
    panel.appendChild(resize);

    panel.addEventListener('pointerdown', () => {
        panel.style.zIndex = Frame.getIndex();
    });

    titleText.style.cursor = 'grab';
    titleText.style.touchAction = 'none';

    titleText.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        titleText.style.cursor = 'grabbing';
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = panel.offsetLeft;
        const startTop = panel.offsetTop;
        const onMove = (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            const maxLeft = window.innerWidth - panel.offsetWidth;
            const maxTop = window.innerHeight - panel.offsetHeight;
            panel.style.left = Math.max(0, Math.min(maxLeft, startLeft + dx)) + 'px';
            panel.style.top = Math.max(0, Math.min(maxTop, startTop + dy)) + 'px';
        };
        const onUp = () => {
            titleText.style.cursor = 'grab';
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });

    resize.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = panel.offsetWidth;
        const startHeight = panel.offsetHeight;
        const onMove = (ev) => {
            const maxWidth = window.innerWidth - panel.offsetLeft;
            const maxHeight = window.innerHeight - panel.offsetTop;
            const width = Math.max(128, Math.min(maxWidth, startWidth + (ev.clientX - startX)));
            const height = Math.max(80, Math.min(maxHeight, startHeight + (ev.clientY - startY)));
            panel.style.width = width + 'px';
            panel.style.height = height + 'px';
        };
        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
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

    api.disableBackButton = () => {
        if (back) {
            back.remove();
            back = null;
        }
    };

    api.enableBackButton = (onClick) => {
        api.disableBackButton();
        back = createIconButton(Icon.get('back'), onClick);
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
        close = createIconButton(Icon.get('close'), onClick);
        titleNav.appendChild(close);
    };

    return api;
}

function createModal(content) {
    if (!content) {
        return null;
    }

    const titleNav = createNav();
    titleNav.style.height = '48px';
    titleNav.style.padding = '0px';
    titleNav.style.borderBottom = '1px solid var(--color-border)';
    const titleText = createTitle();
    titleText.style.fontSize = '1em';
    titleNav.appendChild(titleText);

    const actionNav = createNav();
    actionNav.style.height = '52px';
    actionNav.style.padding = '8px 8px 8px 8px';
    actionNav.style.display = 'none';
    actionNav.style.gap = '4px';
    actionNav.style.borderTop = '1px solid var(--color-border)';

    const frame = Frame.createModal(content);
    frame.setOverlayBackground('rgba(0,0,0,0.4)');
    frame.setTransition('opacity var(--transition-duration)');
    frame.setModalBackground('var(--color-white)');
    frame.setModalBorder('1px solid var(--color-border)');
    frame.setModalRadius('var(--radius-normal)');
    frame.setModalShadow('0 8px 32px rgba(0,0,0,0.18)');
    frame.setModalTransition('transform var(--transition-duration) ease');

    const modal = frame.getModal();
    modal.style.overflow = 'hidden';
    modal.style.width = 'min(480px, 90vw)';
    modal.style.maxHeight = '55dvh';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';

    modal.insertBefore(titleNav, content);
    modal.appendChild(actionNav);

    let closedTransform = '';
    let back = null;
    let close = null;

    const api = {};

    api.getContent = () => content;

    api.show = () => {
        frame.show();
        requestAnimationFrame(() => {
            modal.style.transform = '';
        });
    };

    api.hide = () => {
        modal.style.transform = closedTransform;
        frame.hide();
    };

    frame.setDismiss(api.hide);

    api.destroy = () => {
        frame.destroy();
    };

    api.setTitle = (text) => {
        titleText.textContent = text;
    };

    api.setWidth = (value) => {
        modal.style.width = value;
    };

    api.setHeight = (value) => {
        modal.style.height = value;
        modal.style.maxHeight = '';
        content.style.flex = '1';
        content.style.minHeight = '0px';
    };

    api.setPlacement = (placement) => {
        const isEdge = placement === 'left' || placement === 'right' || placement === 'top' || placement === 'bottom';

        modal.style.marginLeft = '';
        modal.style.marginRight = '';
        modal.style.marginTop = '';
        modal.style.marginBottom = '';

        if (placement === 'left') {
            modal.style.marginRight = 'auto';
            closedTransform = 'translateX(-100%)';
        } else if (placement === 'right') {
            modal.style.marginLeft = 'auto';
            closedTransform = 'translateX(100%)';
        } else if (placement === 'top') {
            modal.style.marginBottom = 'auto';
            closedTransform = 'translateY(-100%)';
        } else if (placement === 'bottom') {
            modal.style.marginTop = 'auto';
            closedTransform = 'translateY(100%)';
        } else {
            closedTransform = '';
        }

        if (placement === 'left' || placement === 'right') {
            api.setWidth('min(320px, 100%)');
            api.setHeight('100%');
        } else if (placement === 'top' || placement === 'bottom') {
            api.setWidth('100%');
            api.setHeight('min(50%, 640px)');
        }

        if (isEdge) {
            modal.style.border = 'none';
            modal.style.borderRadius = '0px';
        } else {
            modal.style.border = '1px solid var(--color-border)';
            modal.style.borderRadius = 'var(--radius-normal)';
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
        back = createIconButton(Icon.get('back'), onClick);
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
        close = createIconButton(Icon.get('close'), onClick);
        titleNav.appendChild(close);
    };

    api.addLeftButton = (label, onClick) => {
        const button = createTextButton(label, onClick);
        button.style.marginRight = 'auto';
        actionNav.appendChild(button);
        actionNav.style.display = 'flex';
        return button;
    };

    api.addRightButton = (label, onClick) => {
        const button = createTextButton(label, onClick);
        actionNav.appendChild(button);
        actionNav.style.display = 'flex';
        return button;
    };

    api.clearNav = () => {
        while (actionNav.firstChild) {
            actionNav.removeChild(actionNav.firstChild);
        }
        actionNav.style.display = 'none';
    };

    return api;
}

function createNav() {
    const nav = document.createElement('div');
    nav.style.width = '100%';
    nav.style.flex = 'none';
    nav.style.userSelect = 'none';
    nav.style.webkitUserSelect = 'none';
    nav.style.display = 'flex';
    nav.style.justifyContent = 'flex-end';
    nav.style.alignItems = 'center';
    return nav;
}

function createTitle() {
    const title = document.createElement('div');
    title.style.flex = '1';
    title.style.overflow = 'hidden';
    title.style.padding = '0 8px 0 12px';
    title.style.fontWeight = 'bold';
    title.style.whiteSpace = 'nowrap';
    title.style.textOverflow = 'ellipsis';
    return title;
}

function createIconButton(icon, onClick) {
    const button = document.createElement('div');
    button.style.aspectRatio = '1 / 1';
    button.style.height = '100%';
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.innerHTML = icon;
    initButton(button, onClick);
    return button;
}

function createTextButton(text, onClick) {
    const button = document.createElement('div');
    button.style.height = '100%';
    button.style.padding = '0px 16px 0px 16px';
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.fontSize = '0.8125em';
    button.style.whiteSpace = 'nowrap';
    button.style.borderRadius = '4px';
    button.textContent = text;
    initButton(button, onClick);
    return button;
}

function initButton(button, onClick) {
    button.addEventListener('pointerenter', () => {
        button.style.backgroundColor = 'var(--color-hover)';
    });

    button.addEventListener('pointerleave', () => {
        button.style.backgroundColor = '';
    });

    button.addEventListener('pointerdown', () => {
        button.style.backgroundColor = 'var(--color-active)';
    });

    button.addEventListener('pointerup', () => {
        button.style.backgroundColor = 'var(--color-hover)';
    });

    button.addEventListener('click', () => {
        if (onClick) {
            onClick();
        }
    });
}
