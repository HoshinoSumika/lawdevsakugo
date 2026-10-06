export const Search = {
    init,
    show,
};

import { Design } from '/lib/design.js';
import { Device } from '/lib/device.js';
import { Flex } from '/lib/flex.js';
import { Frame } from '/lib/frame.js';

import { Text } from '/global/text.js';
import { Util } from '/global/util.js';

const TEXT_SELECTOR = [
    '.ArticleCaption',
    '.ParagraphCaption',
    '.ArticleTitle',
    '.ParagraphNum',
    '.ItemTitle',
    '.Subitem1Title',
    '.Subitem2Title',
    '.Subitem3Title',
    '.Subitem4Title',
    '.Subitem5Title',
    '.Remarks > .RemarksLabel',
    '.ParagraphSentence',
    '.ItemSentence',
    '.Subitem1Sentence',
    '.Subitem2Sentence',
    '.Subitem3Sentence',
    '.Subitem4Sentence',
    '.Subitem5Sentence',
    '.TableColumn .Sentence',
    '.Remarks > .Sentence',
].join(', ');

const HIGHLIGHT_CLASS = 'highlight';
const SCROLL_DURATION = 500;
const FADE_DURATION = 180;

const highlightTimerMap = new WeakMap();

let lawContent;
let lawContainer;
let frame;
let flex;
let searchContent;
let searchContainer;
let searchInput;
let searchClear;
let searchResult;
let isShown = false;
let selectedIndex = -1;

function init(api) {
    lawContent = api.getContent();
    lawContainer = api.getContainer();

    buildContent();
    buildFrame();

    searchInput.addEventListener('keydown', event => {
        if (event.isComposing) {
            return;
        }
        const itemList = getSelectableItems();
        if (event.key === 'ArrowDown' && itemList.length > 0) {
            event.preventDefault();
            select(Math.min(selectedIndex + 1, itemList.length - 1), true);
        }
        if (event.key === 'ArrowUp' && itemList.length > 0) {
            event.preventDefault();
            select(Math.max(selectedIndex - 1, 0), true);
        }
        if (event.key === 'Enter') {
            const item = itemList[selectedIndex] || itemList[0];
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
        updateResult(false);
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        searchClear.style.display = 'none';
        updateResult(false);
    });

    searchResult.addEventListener('touchstart', () => {
        if (document.activeElement === searchInput) {
            searchInput.blur();
        }
    });
}

function show() {
    const style = window.getComputedStyle(lawContent);
    searchResult.style.fontSize = (parseFloat(style.fontSize) - 1.5) + 'px';
    searchResult.style.lineHeight = (parseFloat(style.lineHeight) / parseFloat(style.fontSize) - 0.2) + '';
    searchResult.style.letterSpacing = style.letterSpacing;

    searchContent.inert = false;
    resetSearch();

    isShown = true;
    frame.show();
    requestAnimationFrame(() => {
        searchContainer.classList.add('show');
    });

    searchInput.style.caretColor = 'transparent';
    searchInput.focus();
    setTimeout(() => {
        searchInput.style.caretColor = '';
    }, 200);
}

function hide() {
    if (!isShown) {
        return;
    }
    isShown = false;
    searchContainer.classList.remove('show');
    frame.hide();
    searchInput.blur();
    searchContent.inert = true;
}

function resetSearch() {
    flex.stop();
    searchInput.value = '';
    searchClear.style.display = 'none';
    updateResult(false);
}

function buildContent() {
    searchInput = document.createElement('input');
    searchInput.classList.add('search-input');
    searchInput.type = 'text';
    searchInput.placeholder = '';

    const searchIcon = document.createElement('div');
    searchIcon.classList.add('search-icon');
    searchIcon.innerHTML = Design.getIcon('search', 'var(--color-black)');

    searchClear = document.createElement('div');
    searchClear.classList.add('search-clear');
    searchClear.innerHTML = Design.getIcon('close', 'var(--color-black)', 16);

    const searchBar = document.createElement('div');
    searchBar.classList.add('search-bar');
    searchBar.appendChild(searchInput);
    searchBar.appendChild(searchIcon);
    searchBar.appendChild(searchClear);

    searchResult = document.createElement('div');
    searchResult.classList.add('search-result');
    searchResult.style.display = 'none';

    searchContent = document.createElement('div');
    searchContent.classList.add('search-content');
    searchContent.appendChild(searchBar);
    searchContent.appendChild(searchResult);
    searchContent.inert = true;
}

function buildFrame() {
    flex = Flex.create(searchContent);
    searchContainer = flex.getElement();
    searchContainer.classList.add('search-container');
    searchContainer.addEventListener('click', event => {
        event.stopPropagation();
    });

    const overlay = document.createElement('div');
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'start';
    overlay.appendChild(searchContainer);

    frame = Frame.createPanel(overlay);

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

function updateResult(isUnlimited) {
    const query = searchInput.value.trim();
    const result = searchLaw(query, isUnlimited);
    const wasHidden = searchResult.style.display === 'none';

    resize(() => renderResult(result, query, isUnlimited));

    if (isShown && wasHidden && searchResult.style.display !== 'none') {
        fadeIn(searchResult);
    }
}

function searchLaw(value, isUnlimited) {
    if (!value) {
        return {
            itemList: [],
            hasMore: false,
            limit: 0,
        };
    }

    const limit = getLimit(value, isUnlimited);
    const itemList = [];
    const exactMatch = searchByNum(value);

    if (exactMatch) {
        itemList.push(exactMatch);
    }

    const textResult = searchByText(value, limit);
    itemList.push(...textResult.itemList);

    return {
        itemList,
        hasMore: textResult.hasMore,
        limit,
    };
}

function getLimit(value, isUnlimited) {
    if (isUnlimited) {
        return 10000;
    }
    if (value.length === 1) {
        return 10;
    }
    if (value.length === 2 || value.length === 3) {
        return 20;
    }
    return 100;
}

function searchByNum(value) {
    const articleNum = convertNum(value);
    if (!articleNum) {
        return null;
    }

    const mainProvision = lawContent.querySelector('.MainProvision');
    if (!mainProvision) {
        return null;
    }

    const exactMatch = mainProvision.querySelector('.Article[data-num="' + articleNum + '"]');
    if (exactMatch) {
        return exactMatch;
    }

    const rangeArticleList = mainProvision.querySelectorAll('.Article[data-num*=":"]');
    for (const element of rangeArticleList) {
        const dataNum = element.getAttribute('data-num');
        const [start, end] = dataNum.split(':');
        const searchBase = articleNum.replace(/_.*$/, '');
        const searchInt = parseInt(searchBase, 10);
        const startBase = start.replace(/_.*$/, '');
        const startInt = parseInt(startBase, 10);
        const endBase = end.replace(/_.*$/, '');
        const endInt = parseInt(endBase, 10);

        if (!isNaN(searchInt) && !isNaN(startInt) && !isNaN(endInt)) {
            if (searchInt >= startInt && searchInt <= endInt) {
                return element;
            }
        }
    }

    return null;
}

function searchByText(value, limit) {
    const itemList = [];
    const lawBody = lawContent.querySelector('.LawBody');
    if (!lawBody) {
        return {
            itemList,
            hasMore: false,
        };
    }

    const elementList = lawBody.querySelectorAll(TEXT_SELECTOR);
    const seen = new Set();
    for (const element of elementList) {
        if (!element.offsetParent) {
            continue;
        }

        const clone = element.cloneNode(true);
        clone.querySelectorAll('rt').forEach(rt => rt.remove());
        if (!clone.textContent.includes(value)) {
            continue;
        }

        const resultElement = getResultElement(element);
        if (seen.has(resultElement)) {
            continue;
        }

        itemList.push(resultElement);
        seen.add(resultElement);
        if (itemList.length >= limit) {
            return {
                itemList,
                hasMore: true,
            };
        }
    }

    return {
        itemList,
        hasMore: false,
    };
}

function getResultElement(element) {
    return element.closest('.Article')
        || element.closest('.ParagraphContainer')
        || element.closest('.Preamble')
        || element.closest('.SupplProvisionAppdxTable')
        || element.closest('.AppdxTable')
        || element.closest('.AppdxNote')
        || element.closest('.AppdxFig')
        || element.closest('.AppdxStyle')
        || element;
}

function convertNum(value) {
    if (!value) {
        return '';
    }

    value = value.replace(/０/g, '0').replace(/１/g, '1').replace(/２/g, '2').replace(/３/g, '3').replace(/４/g, '4');
    value = value.replace(/５/g, '5').replace(/６/g, '6').replace(/７/g, '7').replace(/８/g, '8').replace(/９/g, '9');
    value = value.replace(/の/g, '_').replace(/ /g, '_').replace(/　/g, '_');
    value = value.replace(/-/g, '_').replace(/－/g, '_').replace(/ー/g, '_').replace(/＿/g, '_');
    return value;
}

function resize(change) {
    if (!isShown) {
        change();
        return;
    }
    flex.resize(change);
}

function fadeIn(element) {
    element.animate([
        { opacity: 0, transform: 'translateY(-4px)' },
        { opacity: 1, transform: 'none' },
    ], { duration: FADE_DURATION, easing: 'ease-out' });
}

function getSelectableItems() {
    return Array.from(searchResult.querySelectorAll(':scope > .search-result-item'));
}

function select(index, isKeyboard) {
    const itemList = getSelectableItems();
    selectedIndex = itemList.length > 0 ? Math.max(0, Math.min(index, itemList.length - 1)) : -1;
    itemList.forEach((item, position) => {
        item.classList.toggle('selected', !Device.isTouch() && position === selectedIndex);
    });
    if (isKeyboard && itemList[selectedIndex]) {
        itemList[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

function renderResult(result, query, isUnlimited) {
    if (!query) {
        searchResult.innerHTML = '';
        searchResult.style.display = 'none';
        selectedIndex = -1;
        return;
    }

    const restore = isUnlimited ? searchResult.scrollTop : 0;
    searchResult.style.display = 'none';
    searchResult.innerHTML = '';

    if (result.itemList.length === 0) {
        const message = document.createElement('div');
        message.textContent = Text.getSearchEmpty();
        searchResult.appendChild(message);
    } else {
        const fragment = document.createDocumentFragment();
        result.itemList.forEach(element => {
            fragment.appendChild(buildResultItem(element, query));
        });
        if (result.hasMore) {
            fragment.appendChild(buildExpandItem(result.limit));
        }
        searchResult.appendChild(fragment);
    }

    searchResult.style.display = '';
    searchResult.scrollTop = restore;
    select(isUnlimited ? selectedIndex : 0, false);
}

function buildResultItem(element, query) {
    const item = document.createElement('div');
    const contentClone = element.cloneNode(true);

    Util.unwrap(contentClone, HIGHLIGHT_CLASS);
    Util.mark(contentClone, query, HIGHLIGHT_CLASS, 'rt');
    if (element.matches('.Article, .ParagraphContainer')) {
        const supplProvision = element.closest('.SupplProvision');
        const label = supplProvision?.querySelector('.SupplProvisionLabel');
        if (label) {
            item.appendChild(label.cloneNode(true));
        }
    }

    item.appendChild(contentClone);
    item.className = 'search-result-item';
    item.addEventListener('click', () => {
        hide();
        move(element, query);
    });
    bindSelection(item);
    return item;
}

function buildExpandItem(limit) {
    const item = document.createElement('div');
    item.className = 'limit search-result-item';
    item.textContent = Text.getSearchShowAll() + Text.getSearchLimit(limit);
    item.addEventListener('click', () => updateResult(true));
    bindSelection(item);
    return item;
}

function bindSelection(item) {
    const selectItem = () => select(getSelectableItems().indexOf(item), false);
    item.addEventListener('mouseenter', selectItem);
    item.addEventListener('pointerdown', selectItem);
}

function move(element, value) {
    const elementTop = element.offsetTop;
    const offset = -16;
    Util.scroll(lawContainer, elementTop + offset, SCROLL_DURATION);
    Util.unwrap(element, HIGHLIGHT_CLASS);
    Util.mark(element, value, HIGHLIGHT_CLASS, 'rt');

    const oldTimer = highlightTimerMap.get(element);
    if (oldTimer) {
        clearTimeout(oldTimer);
    }

    const timer = setTimeout(() => {
        Util.unwrap(element, HIGHLIGHT_CLASS);
        highlightTimerMap.delete(element);
    }, 2000);
    highlightTimerMap.set(element, timer);
}
