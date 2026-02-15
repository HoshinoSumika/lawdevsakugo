export const Interface = {
    createModal,
    createPanel,
};

function createModal(content) {
    if (!content) {
        return null;
    }
    content.classList.add('interface-content');

    const api = {};

    const overlay = document.createElement('div');
    overlay.className = 'interface-overlay';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.addEventListener('click', () => {
        api.hide();
    });

    let isExpanded = false;
    let originalWidth = '';
    let originalHeight = '';

    let onShowBefore;
    let onShowAfter;
    let onHideBefore;
    let onHideAfter;
    let onBack;

    const container = document.createElement('div');
    container.className = 'interface-container';
    const bar = document.createElement('div');
    bar.className = 'interface-bar';
    bar.style.display = 'none';
    const back = document.createElement('div');
    back.className = 'interface-back';
    back.classList.add('interface-button');
    back.style.display = 'none';
    back.innerHTML = '<div></div><div></div><div></div>';
    const title = document.createElement('div');
    title.className = 'interface-title';
    const expand = document.createElement('div');
    expand.className = 'interface-expand';
    expand.classList.add('interface-button');
    expand.style.display = 'none';
    expand.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>';
    const close = document.createElement('div');
    close.className = 'interface-close';
    close.classList.add('interface-button');

    container.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    back.addEventListener('click', () => {
        onBack?.();
    });

    expand.addEventListener('click', () => {
        if (!isExpanded) {
            isExpanded = true;
            originalWidth = container.style.width;
            originalHeight = container.style.height;
            expand.classList.add('isExpanded');
            container.style.width = '100%';
            container.style.height = '100%';
        } else {
            isExpanded = false;
            expand.classList.remove('isExpanded');
            container.style.width = originalWidth;
            container.style.height = originalHeight;
        }
    });

    close.addEventListener('click', () => {
        api.hide();
    });

    bar.appendChild(back);
    bar.appendChild(title);
    bar.appendChild(expand);
    bar.appendChild(close);
    container.appendChild(bar);
    container.appendChild(content);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    api.onShow = (before, after) => {
        onShowBefore = before;
        onShowAfter = after;
    };
    api.onHide = (before, after) => {
        onHideBefore = before;
        onHideAfter = after;
    };
    api.onBack = (f) => {
        onBack = f;
    };
    api.getOverlay = () => overlay;
    api.getTitleBar = () => bar;
    api.getContainer = () => container;
    api.getContent = () => content;
    api.show = () => {
        onShowBefore?.();
        overlay.style.pointerEvents = 'auto';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        onShowAfter?.();
    };
    api.hide = () => {
        onHideBefore?.();
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        onHideAfter?.();
    };
    api.enableBackButton = () => {
        back.style.display = '';
    };
    api.disableBackButton = () => {
        back.style.display = 'none';
    };
    api.enableTitleBar = () => {
        bar.style.display = '';
    };
    api.disableTitleBar = () => {
        bar.style.display = 'none';
    };
    api.enableExpandButton = () => {
        expand.style.display = '';
    };
    api.disableExpandButton = () => {
        expand.style.display = 'none';
    };
    api.setTitle = (text) => {
        title.textContent = text;
    };
    api.enableMove = () => {
    };
    api.enableResize = () => {
    };

    return api;
}

function createPanel(content) {
}
