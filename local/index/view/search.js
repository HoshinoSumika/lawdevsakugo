export const Search = {
    init,
    showCandidate,
    showLoading,
    showInternetResult,
    showError,
    hideList,
    isListShown,
    reset,
};

import { Design } from '/lib/design.js';
import { Device } from '/lib/device.js';
import { Flex } from '/lib/flex.js';

import { Route } from '/global/route.js';
import { Text } from '/global/text.js';

const IME_KEY_CODE = 229;
const LOADING_COUNT = 3;
const FADE_DURATION = 180;

let api;
let flex;
let searchContent;
let searchInput;
let searchClear;
let searchList;
let selectedIndex = 0;
let queryFrame = 0;

function init(value) {
    api = value;

    buildContent();

    flex = Flex.create(searchContent);
    const searchContainer = flex.getElement();
    searchContainer.classList.add('search-container');

    const searchLayer = document.createElement('div');
    searchLayer.className = 'search-layer';
    searchLayer.appendChild(searchContainer);

    const searchHolder = document.createElement('div');
    searchHolder.className = 'search-holder';
    searchHolder.appendChild(searchLayer);

    const title = document.createElement('h1');
    title.className = 'search-title';
    title.textContent = Text.getSiteName();

    const search = document.createElement('div');
    search.className = 'search';
    search.setAttribute('role', 'search');
    search.appendChild(title);
    search.appendChild(searchHolder);
    api.getContent().before(search);
    searchHolder.style.height = searchContainer.offsetHeight + 'px';

    searchInput.addEventListener('keydown', event => {
        if (event.isComposing || event.keyCode === IME_KEY_CODE) {
            return;
        }
        flushQueryChange();
        if (Device.isTouch()) {
            if (event.key === 'Enter') {
                event.preventDefault();
                blur();
            }
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            select(selectedIndex + 1, true);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            select(selectedIndex - 1, true);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            openSelection();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            clearValue();
        }
    });
    searchInput.addEventListener('input', () => {
        renderClear();
        scheduleQueryChange();
    });

    searchClear.addEventListener('click', () => {
        clearValue();
        searchInput.focus();
    });

    searchList.addEventListener('pointermove', event => {
        if (event.pointerType === 'mouse') {
            selectTarget(event.target);
        }
    });
    searchList.addEventListener('pointerdown', event => {
        selectTarget(event.target);
    });
    searchList.addEventListener('touchstart', () => {
        if (document.activeElement === searchInput) {
            blur();
        }
    }, { passive: true });

    searchContent.addEventListener('focusin', () => {
        toggleList(true);
    });
    searchContent.addEventListener('focusout', event => {
        if (!searchContent.contains(event.relatedTarget)) {
            toggleList(false);
        }
    });
    document.addEventListener('pointerdown', event => {
        if (!searchContent.contains(event.target) && searchContent.contains(document.activeElement)) {
            document.activeElement.blur();
        }
    });

    if (!Device.isTouch()) {
        searchInput.focus();
    }
}

function setValue(value) {
    searchInput.value = value;
    renderClear();
}

function blur() {
    searchContent.focus({ preventScroll: true });
}

function showCandidate(query, lawList) {
    const fragment = document.createDocumentFragment();
    lawList.forEach(law => {
        fragment.appendChild(buildLawItem(law));
    });
    fragment.appendChild(buildInternetItem('search-internet', Text.getInternetSearch(query), () => api.onInternetSelect()));
    render(fragment, false, true);
}

function showLoading() {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(buildHeading(Text.getInternetSearching()));
    for (let index = 0; index < LOADING_COUNT; index++) {
        fragment.appendChild(buildSkeleton());
    }
    render(fragment, false);
}

function showInternetResult(query, result) {
    if (result.totalCount === 0) {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(buildMessage(Text.getInternetEmpty(query)));
        render(fragment, true);
        return;
    }
    render(buildInternetResult(result), true);
}

function showError() {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(buildMessage(Text.getInternetFailed()));
    render(fragment, true);
}

function hideList() {
    if (searchList.style.display === 'none') {
        return;
    }
    flex.resize(() => {
        searchList.replaceChildren();
        searchList.style.display = 'none';
    });
}

function isListShown() {
    return !searchList.classList.contains('search-list-hidden');
}

function reset() {
    flex.stop();
    setValue('');
    searchList.replaceChildren();
    searchList.style.display = 'none';
}

function render(fragment, isFade, isFitted) {
    const wasHidden = searchList.style.display === 'none';
    flex.resize(() => {
        searchList.replaceChildren(fragment);
        searchList.style.display = '';
        searchList.scrollTop = 0;
        if (isFitted) {
            fitList();
        }
        select(0, false);
    });
    if (wasHidden || isFade) {
        fadeIn(searchList);
    }
}

function fitList() {
    const lawItemList = Array.from(searchList.querySelectorAll(':scope > a.search-item'));
    const internetHeight = searchList.lastElementChild.offsetHeight;
    const countFit = (bottom) => lawItemList.filter(item => item.getBoundingClientRect().bottom + internetHeight <= bottom).length;

    const container = flex.getElement();
    const maxBottom = searchList.getBoundingClientRect().bottom + parseFloat(getComputedStyle(container).maxHeight) - container.getBoundingClientRect().height;
    let count = countFit(maxBottom);
    if (Device.isTouch()) {
        const visibleCount = countFit(window.visualViewport.offsetTop + window.visualViewport.height);
        if (visibleCount > 0) {
            count = Math.min(count, visibleCount);
        }
    }
    lawItemList.slice(count).forEach(item => item.remove());
}

function toggleList(isShown) {
    if (searchList.classList.contains('search-list-hidden') !== isShown) {
        return;
    }
    flex.resize(() => {
        searchList.classList.toggle('search-list-hidden', !isShown);
    });
    if (searchList.style.display === 'none') {
        return;
    }
    if (isShown) {
        fadeIn(searchList);
    }
    api.onListToggle();
}

function fadeIn(element) {
    element.animate([
        { opacity: 0, transform: 'translateY(-4px)' },
        { opacity: 1, transform: 'none' },
    ], { duration: FADE_DURATION, easing: 'ease-out' });
}

function clearValue() {
    if (!searchInput.value) {
        return;
    }
    setValue('');
    api.onQueryChange('');
}

function scheduleQueryChange() {
    if (queryFrame) {
        return;
    }
    queryFrame = requestAnimationFrame(flushQueryChange);
}

function flushQueryChange() {
    if (!queryFrame) {
        return;
    }
    cancelAnimationFrame(queryFrame);
    queryFrame = 0;
    api.onQueryChange(searchInput.value);
}

function renderClear() {
    searchClear.style.display = searchInput.value ? '' : 'none';
}

function getItemList() {
    return Array.from(searchList.querySelectorAll(':scope > .search-item'));
}

function select(index, isKeyboard) {
    const itemList = getItemList();
    if (itemList.length === 0) {
        selectedIndex = 0;
        return;
    }

    selectedIndex = Math.max(0, Math.min(index, itemList.length - 1));
    itemList.forEach((item, position) => {
        item.classList.toggle('selected', !Device.isTouch() && position === selectedIndex);
    });

    if (isKeyboard) {
        itemList[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

function selectTarget(target) {
    const item = target.closest('.search-item');
    if (item) {
        select(getItemList().indexOf(item), false);
    }
}

function openSelection() {
    const item = getItemList()[selectedIndex];
    if (item) {
        item.click();
    }
}

function buildContent() {
    searchInput = document.createElement('input');
    searchInput.className = 'search-input';
    searchInput.type = 'text';
    searchInput.enterKeyHint = 'search';
    searchInput.autocomplete = 'off';
    searchInput.spellcheck = false;
    searchInput.placeholder = Text.getSearchPlaceholder();
    searchInput.setAttribute('autocapitalize', 'off');
    searchInput.setAttribute('aria-label', Text.getSearchPlaceholder());

    const searchIcon = document.createElement('div');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = Design.getIcon('search', 'var(--color-black)');

    searchClear = document.createElement('div');
    searchClear.className = 'search-clear';
    searchClear.innerHTML = Design.getIcon('close', 'var(--color-black)', 16);
    searchClear.style.display = 'none';

    const searchBar = document.createElement('div');
    searchBar.className = 'search-bar';
    searchBar.appendChild(searchInput);
    searchBar.appendChild(searchIcon);
    searchBar.appendChild(searchClear);

    searchList = document.createElement('div');
    searchList.className = 'search-list search-list-hidden';
    searchList.style.display = 'none';

    searchContent = document.createElement('div');
    searchContent.className = 'search-content';
    searchContent.tabIndex = -1;
    searchContent.appendChild(searchBar);
    searchContent.appendChild(searchList);
}

function buildLawItem(law) {
    const status = getStatusTag(law);

    const title = document.createElement('div');
    title.className = 'search-item-title';
    title.textContent = law.title;
    title.appendChild(buildTag(Text.getLawType(law.type.split(',')[0])));
    if (status) {
        title.appendChild(buildTag(status));
    }

    const main = document.createElement('div');
    main.className = 'search-item-main';
    main.appendChild(title);
    if (law.num) {
        const num = document.createElement('div');
        num.className = 'search-item-num';
        num.textContent = law.num;
        main.appendChild(num);
    }

    const item = document.createElement('a');
    item.className = 'search-item';
    if (law.isRepealed) {
        item.classList.add('search-item-repealed');
    }
    item.href = Route.getLawHref(law.id);
    item.draggable = false;
    item.appendChild(main);
    return item;
}

function buildTag(text) {
    const tag = document.createElement('span');
    tag.className = 'search-item-tag';
    tag.textContent = text;
    return tag;
}

function getStatusTag(law) {
    if (law.isRepealed) {
        return Text.getRepealStatus(law.repealStatus);
    }
    if (law.isUnenforced) {
        return Text.getUnenforcedLaw();
    }
    return '';
}

function buildInternetResult(result) {
    const count = result.lawList.length;
    const hasMore = result.totalCount > count;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(buildHeading(hasMore ? Text.getInternetResultLimit(result.totalCount, count) : Text.getInternetResult(count)));
    result.lawList.forEach(law => {
        fragment.appendChild(buildLawItem(law));
    });
    if (hasMore) {
        fragment.appendChild(buildInternetItem('search-internet-all', Text.getSearchShowAll(), () => api.onInternetAllSelect(result.totalCount)));
    }
    return fragment;
}

function buildInternetItem(className, label, onClick) {
    const text = document.createElement('div');
    text.className = 'search-item-main';
    text.textContent = label;

    const item = document.createElement('div');
    item.className = 'search-item ' + className;
    item.setAttribute('role', 'button');
    item.appendChild(text);
    item.addEventListener('click', onClick);
    return item;
}

function buildHeading(text) {
    const heading = document.createElement('div');
    heading.className = 'search-heading';
    heading.textContent = text;
    return heading;
}

function buildMessage(text) {
    const message = document.createElement('div');
    message.className = 'search-message';
    message.textContent = text;
    return message;
}

function buildSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'search-skeleton';
    skeleton.appendChild(document.createElement('div'));
    skeleton.appendChild(document.createElement('div'));
    return skeleton;
}
