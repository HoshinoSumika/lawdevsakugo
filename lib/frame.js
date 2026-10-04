export const Frame = {
    getIndex,
    createPanel,
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
    panel.style.overflow = 'hidden';
    panel.style.position = 'fixed';

    panel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    panel.addEventListener('touchmove', (e) => {
        let node = e.target;
        while (node !== panel) {
            if (node.scrollHeight > node.clientHeight) {
                return;
            }
            node = node.parentNode;
        }
        e.preventDefault();
    });

    panel.appendChild(content);
    document.body.appendChild(panel);

    api.getPanel = () => panel;
    api.getContent = () => content;

    api.setBackground = (value) => {
        panel.style.background = value;
    };

    api.setShadow = (value) => {
        panel.style.boxShadow = value;
    };

    api.setBorder = (value) => {
        panel.style.border = value;
    };

    api.setRadius = (value) => {
        panel.style.borderRadius = value;
    };

    api.setTransition = (value) => {
        panel.style.transition = value;
    };

    api.show = () => {
        panel.style.zIndex = getIndex();
        panel.style.pointerEvents = 'auto';
        panel.getBoundingClientRect();
        panel.style.opacity = '1';
    };

    api.hide = () => {
        panel.style.pointerEvents = 'none';
        panel.style.opacity = '0';
    };

    api.anchor = (el, placement = 'top', offset = 0) => {
        panel.style.position = 'absolute';
        panel.style.left = '0px';
        panel.style.top = '0px';

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
        } else if (placement === 'center') {
            top = rect.top + (rect.height - ph) / 2;
            left = rect.left + (rect.width - pw) / 2;
        }
        const view = window.visualViewport;
        const maxLeft = view.offsetLeft + view.width - pw;
        const maxTop = view.offsetTop + view.height - ph;
        if (maxLeft >= view.offsetLeft) {
            left = Math.max(view.offsetLeft, Math.min(maxLeft, left));
        }
        if (maxTop >= view.offsetTop) {
            top = Math.max(view.offsetTop, Math.min(maxTop, top));
        }
        const host = panel.offsetParent || document.body;
        const base = host.getBoundingClientRect();
        panel.style.left = (left - base.left - host.clientLeft) + 'px';
        panel.style.top = (top - base.top - host.clientTop) + 'px';
    };

    api.destroy = () => {
        panel.remove();
    };

    return api;
}

function createModal(content) {
    if (!content) {
        return null;
    }

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    const modal = document.createElement('div');
    modal.style.overflow = 'auto';
    modal.style.overscrollBehavior = 'contain';

    modal.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    modal.appendChild(content);
    container.appendChild(modal);

    const api = createPanel(container);

    api.getPanel().style.top = '0';
    api.getPanel().style.left = '0';
    api.getPanel().style.width = '100vw';
    api.getPanel().style.height = '100vh';
    api.getPanel().style.height = '100dvh';

    let pressTarget = null;
    let dismiss = api.hide;

    container.addEventListener('pointerdown', (e) => {
        pressTarget = e.target;
    });

    container.addEventListener('click', (e) => {
        if (e.target === container && pressTarget === container) {
            dismiss();
        }
    });

    api.getModal = () => modal;
    api.getContent = () => content;

    api.setDismiss = (fn) => {
        dismiss = fn;
    };

    api.setOverlayBackground = (value) => {
        api.getPanel().style.background = value;
    };

    api.setModalBackground = (value) => {
        modal.style.background = value;
    };

    api.setModalShadow = (value) => {
        modal.style.boxShadow = value;
    };

    api.setModalBorder = (value) => {
        modal.style.border = value;
    };

    api.setModalRadius = (value) => {
        modal.style.borderRadius = value;
    };

    api.setModalTransition = (value) => {
        modal.style.transition = value;
    };

    return api;
}
