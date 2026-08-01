export const UI = {
    getQuery,
    hide,
    init,
    render,
    show,
};

let frame;
let searchContainer;
let searchInput;
let searchClear;
let searchResult;

function init({ createPanel, onInput, onClear }) {
    searchInput = document.querySelector('#search-input');
    searchClear = document.querySelector('#search-clear');
    searchResult = document.querySelector('#search-result');

    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && document.activeElement === searchInput) {
            searchInput.blur();
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

    const searchContent = document.querySelector('#search-content');
    searchContent.classList.add('search-content');

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

    frame = createPanel(overlay);

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
    searchContainer.classList.remove('show');
    frame.hide();
    searchInput.value = '';
    searchInput.style.display = 'none';
}

function getQuery() {
    return searchInput.value;
}

function render(result, { query, isUnlimited, highlight, onExpand, onSelect }) {
    if (!query) {
        searchResult.innerHTML = '';
        searchResult.style.display = 'none';
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
    item.addEventListener('click', () => onSelect(element));
    return item;
}

function createExpandItem(limit, onExpand) {
    const item = document.createElement('div');
    item.className = 'limit';
    item.textContent = 'すべての検索結果を表示';
    item.textContent += '（現在は' + limit + '件のみ表示）';
    item.addEventListener('click', onExpand);
    return item;
}
