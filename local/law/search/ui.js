export const UI = {
    getQuery,
    hide,
    init,
    render,
    show,
};

const RESIZE_DURATION = 420;
const RESIZE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const FADE_DURATION = 180;
const HIDE_DELAY = 200;
const DESKTOP_QUERY = '(min-width: 801px)';

let createFrame;
let frame = null;
let searchContent;
let searchContainer = null;
let searchInput;
let searchClear;
let searchResult;
let resizeAnimation = null;
let hideTimer = null;
let isShown = false;
let selectedIndex = -1;

function init({ createPanel, onInput, onClear }) {
    createFrame = createPanel;
    searchInput = document.querySelector('#search-input');
    searchClear = document.querySelector('#search-clear');
    searchResult = document.querySelector('#search-result');

    searchInput.addEventListener('keydown', event => {
        if (event.isComposing) {
            return;
        }
        const items = getSelectableItems();
        if (event.key === 'ArrowDown' && items.length > 0) {
            event.preventDefault();
            select(Math.min(selectedIndex + 1, items.length - 1), true);
        }
        if (event.key === 'ArrowUp' && items.length > 0) {
            event.preventDefault();
            select(Math.max(selectedIndex - 1, 0), true);
        }
        if (event.key === 'Enter') {
            const item = items[selectedIndex] || items[0];
            if (item) {
                event.preventDefault();
                item.click();
            } else if (document.activeElement === searchInput) {
                searchInput.blur();
            }
        }
    });
    searchInput.addEventListener('input', () => {
        searchClear.style.display = searchInput.value === '' ? 'none' : '';
        onInput();
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        searchClear.style.display = 'none';
        onClear();
    });

    searchResult.addEventListener('touchstart', () => {
        if (document.activeElement === searchInput) {
            searchInput.blur();
        }
    });

    searchContent = document.querySelector('#search-content');
    searchContent.classList.add('search-content');
    searchContent.remove();
}

function buildFrame() {
    searchContainer = document.createElement('div');
    searchContainer.classList.add('search-container');
    searchContainer.addEventListener('click', event => {
        event.stopPropagation();
    });
    searchContainer.appendChild(searchContent);

    const overlay = document.createElement('div');
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'start';
    overlay.appendChild(searchContainer);

    frame = createFrame(overlay);

    const panel = frame.getPanel();
    panel.classList.add('search-overlay');
    panel.style.top = '0';
    panel.style.left = '0';
    panel.style.width = '100vw';
    panel.style.height = '100vh';

    let pressTarget = null;
    overlay.addEventListener('pointerdown', event => {
        pressTarget = event.target;
    });
    overlay.addEventListener('click', event => {
        if (event.target === overlay && pressTarget === overlay) {
            hide();
        }
    });
}

function show(lawContent) {
    const style = window.getComputedStyle(lawContent);
    searchResult.style.fontSize = (parseFloat(style.fontSize) - 1.5) + 'px';
    searchResult.style.lineHeight = (parseFloat(style.lineHeight) / parseFloat(style.fontSize) - 0.2) + '';
    searchResult.style.letterSpacing = style.letterSpacing;

    isShown = true;
    clearTimeout(hideTimer);
    destroyFrame();
    buildFrame();
    frame.show();
    requestAnimationFrame(() => {
        searchContainer.classList.add('show');
    });

    searchInput.value = '';
    searchInput.style.display = '';
    searchInput.style.caretColor = 'transparent';
    searchInput.focus();
    setTimeout(() => {
        searchInput.style.caretColor = '';
    }, 200);
    searchClear.style.display = 'none';
}

function hide() {
    if (!frame) {
        return;
    }
    isShown = false;
    searchContainer.classList.remove('show');
    frame.hide();
    searchInput.blur();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        searchInput.value = '';
        searchInput.style.display = 'none';
        destroyFrame();
    }, HIDE_DELAY);
}

function destroyFrame() {
    if (!frame) {
        return;
    }
    if (resizeAnimation) {
        resizeAnimation.cancel();
        resizeAnimation = null;
    }
    searchContent.remove();
    frame.destroy();
    frame = null;
    searchContainer = null;
}

function isDesktop() {
    return window.matchMedia(DESKTOP_QUERY).matches;
}

function resize(change) {
    if (!isShown || !isDesktop()) {
        change();
        return;
    }

    const from = searchContainer.offsetHeight;
    if (resizeAnimation) {
        resizeAnimation.cancel();
        resizeAnimation = null;
    }

    change();

    const to = searchContainer.offsetHeight;
    if (from === to) {
        return;
    }

    resizeAnimation = searchContainer.animate([
        { height: from + 'px' },
        { height: to + 'px' },
    ], { duration: RESIZE_DURATION, easing: RESIZE_EASING });
    resizeAnimation.onfinish = () => {
        resizeAnimation = null;
    };
}

function fadeIn(element) {
    element.animate([
        { opacity: 0, transform: 'translateY(-4px)' },
        { opacity: 1, transform: 'none' },
    ], { duration: FADE_DURATION, easing: 'ease-out' });
}

function getQuery() {
    return searchInput.value;
}

function getSelectableItems() {
    return Array.from(searchResult.querySelectorAll(':scope > .search-result-item'));
}

function select(index, isKeyboard) {
    const items = getSelectableItems();
    selectedIndex = items.length > 0 ? Math.max(0, Math.min(index, items.length - 1)) : -1;
    items.forEach((item, position) => {
        item.classList.toggle('selected', position === selectedIndex);
    });
    if (isKeyboard && items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

function render(result, options) {
    const wasHidden = searchResult.style.display === 'none';

    resize(() => renderResult(result, options));

    if (isShown && isDesktop() && wasHidden && searchResult.style.display !== 'none') {
        fadeIn(searchResult);
    }
}

function renderResult(result, { query, isUnlimited, highlight, onExpand, onSelect }) {
    if (!query) {
        searchResult.innerHTML = '';
        searchResult.style.display = 'none';
        selectedIndex = -1;
        return;
    }

    const restore = isUnlimited ? searchResult.scrollTop : 0;
    searchResult.style.display = 'none';
    searchResult.innerHTML = '';

    if (result.items.length === 0) {
        const message = document.createElement('div');
        message.textContent = '検索結果なし';
        searchResult.appendChild(message);
    } else {
        const fragment = document.createDocumentFragment();
        result.items.forEach(element => {
            fragment.appendChild(createResultItem(element, query, highlight, onSelect));
        });
        if (result.hasMore) {
            fragment.appendChild(createExpandItem(result.limit, onExpand));
        }
        searchResult.appendChild(fragment);
    }

    searchResult.style.display = '';
    searchResult.scrollTop = restore;
    select(isUnlimited ? selectedIndex : 0, false);
}

function createResultItem(element, query, highlight, onSelect) {
    const item = document.createElement('div');
    const contentClone = element.cloneNode(true);

    if (element.matches('.Article, .ParagraphContainer')) {
        highlight(contentClone, query);
        const supplProvision = element.closest('.SupplProvision');
        const label = supplProvision?.querySelector('.SupplProvisionLabel');
        if (label) {
            item.appendChild(label.cloneNode(true));
        }
    } else {
        highlight(contentClone, query);
    }

    item.appendChild(contentClone);
    item.className = 'search-result-item';
    item.addEventListener('click', () => onSelect(element));
    item.addEventListener('mouseenter', () => select(getSelectableItems().indexOf(item), false));
    return item;
}

function createExpandItem(limit, onExpand) {
    const item = document.createElement('div');
    item.className = 'limit search-result-item';
    item.textContent = 'すべての検索結果を表示';
    item.textContent += '（現在は' + limit + '件のみ表示）';
    item.addEventListener('click', onExpand);
    item.addEventListener('mouseenter', () => select(getSelectableItems().indexOf(item), false));
    return item;
}
