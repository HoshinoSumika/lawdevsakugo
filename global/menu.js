export const Menu = {
    createContextMenu,
};

import { Frame } from '/global/frame.js?v=20260101';

function createContextMenu() {
    const api = {};

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.padding = '4px 0';
    list.style.minWidth = '160px';

    const panel = Frame.createPanel(list);
    const panelEl = panel.getPanel();
    panelEl.style.width = 'auto';
    panelEl.style.height = 'auto';
    panelEl.style.inset = 'auto';
    panelEl.style.backgroundColor = 'white';
    panelEl.style.border = '1px solid #c3c3c3';
    panelEl.style.borderRadius = '4px';
    panelEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    panelEl.style.overflow = 'visible';

    let cleanup = null;

    const dismiss = () => {
        if (cleanup) {
            cleanup();
            cleanup = null;
        }
    };

    const attachDismiss = (anchorEl) => {
        const onPointerDown = (e) => {
            if (panelEl.contains(e.target)) {
                return;
            }
            if (anchorEl && anchorEl.contains(e.target)) {
                return;
            }
            dismiss();
        };

        const onScroll = (e) => {
            if (panelEl.contains(e.target)) {
                return;
            }
            dismiss();
        };

        cleanup = () => {
            panel.hide();
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('scroll', onScroll, { capture: true });
            cleanup = null;
        };

        requestAnimationFrame(() => {
            window.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('scroll', onScroll, { capture: true });
        });
    };

    api.show = (anchorEl) => {
        dismiss();
        panel.show();
        attachDismiss(anchorEl);
    };

    api.hide = () => {
        dismiss();
        if (!cleanup) {
            panel.hide();
        }
    };

    api.anchor = (el, placement, offset) => {
        panel.anchor(el, placement, offset);
    };

    api.destroy = () => {
        dismiss();
        panel.destroy();
    };

    api.addItem = (label, onClick) => {
        const item = document.createElement('div');
        item.textContent = label;
        item.style.padding = '6px 16px';
        item.style.cursor = 'pointer';
        item.style.fontSize = '0.875em';
        item.style.whiteSpace = 'nowrap';
        item.style.userSelect = 'none';
        item.style.webkitUserSelect = 'none';

        item.addEventListener('pointerenter', () => {
            item.style.backgroundColor = '#f0f0f0';
        });

        item.addEventListener('pointerleave', () => {
            item.style.backgroundColor = 'transparent';
        });

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onClick) {
                onClick();
            }
            dismiss();
        });

        list.appendChild(item);
        return item;
    };

    api.addSeparator = () => {
        const sep = document.createElement('div');
        sep.style.height = '1px';
        sep.style.backgroundColor = '#e0e0e0';
        sep.style.margin = '4px 0';
        list.appendChild(sep);
        return sep;
    };

    api.clearItems = () => {
        list.innerHTML = '';
    };

    return api;
}
