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

    const frame = Frame.createPanel(list);
    const panel = frame.getPanel();
    panel.style.width = 'auto';
    panel.style.height = 'auto';
    panel.style.inset = 'auto';
    panel.style.backgroundColor = 'white';
    panel.style.border = '1px solid #c3c3c3';
    panel.style.borderRadius = '4px';
    panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    panel.style.overflow = 'visible';

    let cleanup = null;

    const dismiss = () => {
        if (cleanup) {
            cleanup();
            cleanup = null;
        }
    };

    const attachDismiss = (anchorEl) => {
        const onPointerDown = (e) => {
            if (panel.contains(e.target)) {
                return;
            }
            if (anchorEl && anchorEl.contains(e.target)) {
                return;
            }
            dismiss();
        };

        const onScroll = (e) => {
            if (panel.contains(e.target)) {
                return;
            }
            dismiss();
        };

        cleanup = () => {
            frame.hide();
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
        frame.show();
        attachDismiss(anchorEl);
    };

    api.hide = () => {
        dismiss();
        if (!cleanup) {
            frame.hide();
        }
    };

    api.anchor = (el, placement, offset) => {
        frame.anchor(el, placement, offset);
    };

    api.destroy = () => {
        dismiss();
        frame.destroy();
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
