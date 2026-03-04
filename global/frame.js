export const Frame = {
    createPanel,
    createExPanel,
    createModal,
};

let index = 1000;

function getIndex() {
    index = index + 1;
    return index;
}

function createPanel(content) {
    if (!content) {
        return null;
    }

    const api = {};

    const panel = document.createElement('div');
    panel.style.pointerEvents = 'none';
    panel.style.opacity = '0';
    panel.style.zIndex = getIndex();
    panel.style.overflow = 'hidden';
    panel.style.touchAction = 'none';
    panel.style.position = 'fixed';

    panel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    panel.appendChild(content);
    document.body.appendChild(panel);

    api.getPanel = () => panel;
    api.getContent = () => content;

    api.show = () => {
        panel.style.zIndex = getIndex();
        panel.style.pointerEvents = 'auto';
        requestAnimationFrame(() => {
            panel.style.opacity = '1';
        });
    };

    api.hide = () => {
        panel.style.pointerEvents = 'none';
        panel.style.opacity = '0';
    };

    api.anchor = (el, placement = 'top', offset = 0) => {
        const rect = el.getBoundingClientRect();
        const pw = panel.offsetWidth;
        const ph = panel.offsetHeight;
        let top, left;
        if (placement === 'top') {
            top = rect.top - ph - offset;
            left = rect.left + (rect.width - pw) / 2;
        } else if (placement === 'bottom') {
            top = rect.bottom + offset;
            left = rect.left + (rect.width - pw) / 2;
        } else if (placement === 'left') {
            top = rect.top + (rect.height - ph) / 2;
            left = rect.left - pw - offset;
        } else if (placement === 'right') {
            top = rect.top + (rect.height - ph) / 2;
            left = rect.right + offset;
        }
        left = Math.max(0, Math.min(window.innerWidth - pw, left));
        top = Math.max(0, Math.min(window.innerHeight - ph, top));
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
    };

    api.destroy = () => {
        panel.remove();
    };

    return api;
}

function createExPanel(content) {
    if (!content) {
        return null;
    }

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    const bar = document.createElement('div');
    bar.style.width = '100%';
    bar.style.height = '36px';
    bar.style.maxHeight = '36px';
    bar.style.minHeight = '36px';
    bar.style.padding = '0 4px 0 4px';
    bar.style.cursor = 'grab';
    bar.style.userSelect = 'none';
    bar.style.webkitUserSelect = 'none';
    bar.style.display = 'flex';
    bar.style.justifyContent = 'center';
    bar.style.alignItems = 'center';
    bar.style.borderBottom = '1px solid #c3c3c3';
    bar.style.backgroundColor = '#f0f0f0';

    const title = document.createElement('div');
    title.style.flex = '1';
    title.style.overflow = 'hidden';
    title.style.padding = '0 8px 0 12px';
    title.style.fontSize = '0.8125em';
    title.style.whiteSpace = 'nowrap';
    title.style.textOverflow = 'ellipsis';

    const close = document.createElement('div');
    close.textContent = '×';
    close.style.width = '28px';
    close.style.height = '28px';
    close.style.cursor = 'pointer';
    close.style.display = 'flex';
    close.style.justifyContent = 'center';
    close.style.alignItems = 'center';
    close.style.fontSize = '1em';
    close.style.borderRadius = '4px';

    bar.appendChild(title);
    bar.appendChild(close);

    content.style.flex = '1';
    content.style.overflow = 'auto';

    container.appendChild(bar);
    container.appendChild(content);

    const api = createPanel(container);
    const panel = api.getPanel();

    panel.style.top = '25vh';
    panel.style.left = '25vw';
    panel.style.width = '256px';
    panel.style.height = '160px';
    panel.style.border = '1px solid #c3c3c3';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
    panel.style.backgroundColor = 'white';

    const resize = document.createElement('div');
    resize.style.position = 'absolute';
    resize.style.right = '0';
    resize.style.bottom = '0';
    resize.style.width = '12px';
    resize.style.height = '12px';
    resize.style.cursor = 'nwse-resize';
    panel.appendChild(resize);

    container.addEventListener('pointerdown', () => {
        panel.style.zIndex = getIndex();
    });

    bar.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        panel.style.zIndex = getIndex();
        bar.style.cursor = 'grabbing';
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
            bar.style.cursor = 'grab';
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });

    close.addEventListener('pointerenter', () => {
        close.style.backgroundColor = '#e0e0e0';
    });

    close.addEventListener('pointerleave', () => {
        close.style.backgroundColor = 'transparent';
    });

    close.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        panel.style.zIndex = getIndex();
        close.style.backgroundColor = '#e0e0e0';
        const onUp = (ev) => {
            document.removeEventListener('pointerup', onUp);
            close.style.backgroundColor = 'transparent';
            if (e.pointerId === ev.pointerId && close.contains(document.elementFromPoint(ev.clientX, ev.clientY))) {
                api.hide();
            }
        };
        document.addEventListener('pointerup', onUp);
    });

    resize.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        panel.style.zIndex = getIndex();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = panel.offsetWidth;
        const startH = panel.offsetHeight;
        const onMove = (ev) => {
            const maxW = window.innerWidth - panel.offsetLeft;
            const maxH = window.innerHeight - panel.offsetTop;
            const w = Math.max(128, Math.min(maxW, startW + (ev.clientX - startX)));
            const h = Math.max(80, Math.min(maxH, startH + (ev.clientY - startY)));
            panel.style.width = w + 'px';
            panel.style.height = h + 'px';
        };
        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });

    const onWindowResize = () => {
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

    window.addEventListener('resize', onWindowResize);

    api.getContent = () => content;

    api.setTitle = (text) => {
        title.textContent = text;
    };

    const destroy = api.destroy;
    api.destroy = () => {
        window.removeEventListener('resize', onWindowResize);
        destroy();
    };

    return api;
}

function createModal(content) {
}
