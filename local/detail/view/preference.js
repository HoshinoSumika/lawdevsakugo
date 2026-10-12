export const Preference = {
    init,
    show,
};

import { Design } from '/lib/design.js';
import { Dialog } from '/lib/dialog.js';
import { Message } from '/lib/message.js';

import { Cache } from '/global/cache.js';
import { Component } from '/global/component.js';
import { Config } from '/global/config.js';
import { Text } from '/global/text.js';

const INSET_SIZE = 'calc(100% - var(--size-offset) * 4)';
const MODAL_MAX_WIDTH = 480;
const MODAL_WIDTH = 'min(' + MODAL_MAX_WIDTH + 'px, ' + INSET_SIZE + ')';
const SLIDE_DURATION = 200;
const EXPAND_DURATION = 200;
const PAREN_COLOR_LIST = ['#ba55d3', '#3cb371', '#ff7f50', '#808080'];
const WORD_COLOR = '#4169e1';
const HIGHLIGHT_SIZE_MIN = 0.5;
const HIGHLIGHT_SIZE_MAX = 1.5;
const HIGHLIGHT_SIZE_STEP = 0.05;
const HATCH_COLOR = 'rgba(128,128,128,0.2)';
const BACKGROUND_MAP = {
    none: 'none',
    fill: 'color-mix(in srgb, currentColor 15%, transparent)',
    hatch: 'repeating-linear-gradient(45deg, transparent 0px 1px, ' + HATCH_COLOR + ' 1px 2px), repeating-linear-gradient(-45deg, transparent 0px 1px, ' + HATCH_COLOR + ' 1px 2px)',
};

const styleMap = {};
const style = document.createElement('style');
const refreshList = [];

let modal;
let api;
let content;
let mainPage;
let advancedPage;
let parenPage;
let wordPage;
let parenEntryList;
let pageList = [];

const wordEntryPageMap = new Map();

let messagePreferenceCleared;
let messageCacheDeleted;
let messageCacheDeleteFailed;

function init(value) {
    api = value;

    parenEntryList = PAREN_COLOR_LIST.map((color, index) => {
        const depth = index + 1;
        const isDeepest = depth === PAREN_COLOR_LIST.length;
        return {
            key: String(depth),
            label: Text.getParenDepth(depth),
            selector: isDeepest ? '.content .paren' : '.content .paren[data-depth="' + depth + '"]',
            color,
        };
    });
    document.head.appendChild(style);
    applyAll();

    messagePreferenceCleared = Message.info(Text.getPreferenceCleared());
    messageCacheDeleted = Message.info(Text.getCacheDeleted());
    messageCacheDeleteFailed = Message.error(Text.getCacheDeleteFailed());

    mainPage = document.createElement('div');
    mainPage.classList.add('preference-page');
    mainPage.appendChild(buildSwitchItem(Text.getShowToc(), Config.getToc, (value) => {
        Config.setToc(value);
        applyToc(value);
    }));
    mainPage.appendChild(buildSwitchItem(Text.getShowSupplProvision(), Config.getSupplProvision, (value) => {
        Config.setSupplProvision(value);
        applySupplProvision(value);
    }));
    mainPage.appendChild(buildDivider());
    const parenNavigationItem = buildNavigationItem(Text.getParenHighlightPreference(), () => {
        showNextPage(Text.getParenHighlightPreference(), parenPage);
    });
    const wordNavigationItem = buildNavigationItem(Text.getWordHighlightPreference(), () => {
        showNextPage(Text.getWordHighlightPreference(), wordPage);
    });
    mainPage.appendChild(buildSwitchItem(Text.getParenHighlight(), Config.getParenHighlight, (value) => {
        Config.setParenHighlight(value);
        applyParenHighlight();
        toggleItem(parenNavigationItem, value);
    }));
    mainPage.appendChild(parenNavigationItem);
    mainPage.appendChild(buildSwitchItem(Text.getWordHighlight(), Config.getWordHighlight, (value) => {
        Config.setWordHighlight(value);
        applyWordHighlight();
        toggleItem(wordNavigationItem, value);
    }));
    mainPage.appendChild(wordNavigationItem);
    showItem(parenNavigationItem, Config.getParenHighlight);
    showItem(wordNavigationItem, Config.getWordHighlight);
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildRadioItem(Text.getFontFamily(), [
        { value: 'sans-serif', label: Text.getSansSerif() },
        { value: 'serif', label: Text.getSerif() },
    ], Config.getFontFamily, (value) => {
        Config.setFontFamily(value);
        applyFontFamily(value);
    }));
    mainPage.appendChild(buildSeekbarItem(Text.getFontSize(), 14, 18, 0.5, Config.getFontSize, formatFontSize, (value) => {
        Config.setFontSize(value);
        applyFontSize(value);
    }));
    mainPage.appendChild(buildSeekbarItem(Text.getLineHeight(), 1.6, 2.0, 0.05, Config.getLineHeight, formatLineHeight, (value) => {
        Config.setLineHeight(value);
        applyLineHeight(value);
    }));
    mainPage.appendChild(buildSeekbarItem(Text.getLetterSpacing(), 0, 0.2, 0.01, Config.getLetterSpacing, formatLetterSpacing, (value) => {
        Config.setLetterSpacing(value);
        applyLetterSpacing(value);
    }));
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildNavigationItem(Text.getAdvancedPreference(), () => {
        showNextPage(Text.getAdvancedPreference(), advancedPage);
    }));
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildActionItem(Text.getCacheDelete(), () => {
        showConfirmPage(Text.getCacheDelete(), Text.getCacheDeleteConfirm(), Text.getDelete(), deleteCache);
    }));
    mainPage.appendChild(buildActionItem(Text.getPreferenceClear(), () => {
        showConfirmPage(Text.getPreferenceClear(), Text.getPreferenceClearConfirm(), Text.getClear(), clearPreference);
    }));

    advancedPage = document.createElement('div');
    advancedPage.classList.add('preference-page');
    advancedPage.appendChild(buildSwitchItem(Text.getWidthLimit(), Config.getWidthLimit, (value) => {
        Config.setWidthLimit(value);
        applyWidthLimit(value, Config.getWidthLimitSize());
    }));
    advancedPage.appendChild(buildSeekbarItem(Text.getWidthLimitSize(), 640, 1040, 20, Config.getWidthLimitSize, formatWidthLimitSize, (value) => {
        Config.setWidthLimitSize(value);
        applyWidthLimit(Config.getWidthLimit(), value);
    }));

    parenPage = buildHighlightPage(parenEntryList, Config.getParenStyleMap, Config.setParenStyleMap, applyParenHighlight);
    wordPage = document.createElement('div');
    wordPage.classList.add('preference-page');
    renderWordPage();

    content = document.createElement('div');
    content.classList.add('preference-content');
    content.appendChild(mainPage);

    modal = Dialog.createModal(content);
    modal.setTitle(Text.getPreference());
    modal.enableCloseButton(hide);
    modal.setDismiss(hide);

    window.addEventListener('resize', () => {
        applySize();
    });
}

function show() {
    applySize();
    pageList = [{ title: Text.getPreference(), page: mainPage, scrollTop: 0 }];
    renderTitle();
    modal.clearNav();
    modal.fitHeight(() => {
        content.replaceChildren(mainPage);
    });
    modal.resetScroll();
    modal.show();
}

function hide() {
    modal.hide();
}

function applySize() {
    modal.setPlacement('center');
    modal.setWidth(MODAL_WIDTH);
    if (content.closest('.dialog-modal').getBoundingClientRect().width < MODAL_MAX_WIDTH) {
        modal.setHeight(INSET_SIZE);
    }
}

function renderTitle() {
    modal.setTitle(pageList[pageList.length - 1].title);
    if (pageList.length > 1) {
        modal.enableBackButton(showPreviousPage);
    } else {
        modal.disableBackButton();
    }
}

function showNextPage(title, page) {
    pageList[pageList.length - 1].scrollTop = content.closest('.dialog-scroll').scrollTop;
    pageList.push({ title, page, scrollTop: 0 });

    renderTitle();
    switchPage(page, 0, -100);
}

function showPreviousPage() {
    pageList.pop();
    const current = pageList[pageList.length - 1];

    renderTitle();
    modal.clearNav();
    switchPage(current.page, current.scrollTop, 100);
}

function switchPage(page, scrollTop, shift) {
    const scroll = content.closest('.dialog-scroll');
    const previous = content.firstChild;
    const previousScrollTop = scroll.scrollTop;
    const height = scroll.clientHeight;

    previous.getAnimations().forEach(animation => animation.cancel());
    page.getAnimations().forEach(animation => animation.cancel());

    const isResized = modal.fitHeight(() => {
        content.replaceChildren(page);
    });
    scroll.scrollTop = scrollTop;

    if (isResized || previous === page) {
        return;
    }

    const ghost = document.createElement('div');
    ghost.classList.add('preference-ghost');
    ghost.style.top = (scroll.scrollTop - previousScrollTop) + 'px';
    ghost.style.height = (height + previousScrollTop) + 'px';
    ghost.appendChild(previous);
    content.appendChild(ghost);

    const option = { duration: SLIDE_DURATION, easing: 'linear' };
    ghost.animate([{ transform: 'translateX(0%)' }, { transform: 'translateX(' + shift + '%)' }], option).onfinish = () => {
        ghost.remove();
    };
    page.animate([{ transform: 'translateX(' + -shift + '%)' }, { transform: 'translateX(0%)' }], option);
}

function showConfirmPage(title, text, actionLabel, onConfirm) {
    const page = document.createElement('div');
    page.classList.add('preference-page', 'confirm');
    page.textContent = text;

    modal.addRightButton(actionLabel, onConfirm);
    showNextPage(title, page);
}

function clearPreference() {
    Config.clear();
    applyAll();
    refreshList.forEach(refresh => refresh());
    wordEntryPageMap.clear();
    renderWordPage();
    api.onWordChange();
    pageList[0].scrollTop = 0;
    showPreviousPage();
    messagePreferenceCleared.show();
}

async function deleteCache() {
    try {
        await Cache.deleteAll();
        showPreviousPage();
        messageCacheDeleted.show();
    } catch (e) {
        console.error(e);
        messageCacheDeleteFailed.show();
    }
}

function setStyle(name, text) {
    styleMap[name] = text;
    style.textContent = Object.values(styleMap).join('\n');
}

function applyAll() {
    applyToc(Config.getToc());
    applySupplProvision(Config.getSupplProvision());
    applyParenHighlight();
    applyWordHighlight();
    applyFontFamily(Config.getFontFamily());
    applyFontSize(Config.getFontSize());
    applyLineHeight(Config.getLineHeight());
    applyLetterSpacing(Config.getLetterSpacing());
    applyWidthLimit(Config.getWidthLimit(), Config.getWidthLimitSize());
}

function applyToc(isShown) {
    setStyle('toc', isShown ? '' : '.content .LawBody > .TOC { display: none; }');
}

function applySupplProvision(isShown) {
    setStyle('suppl-provision', isShown ? '' : '.content .LawBody > .SupplProvision { display: none; }');
}

function applyParenHighlight() {
    const isEnabled = Config.getParenHighlight();
    setStyle('paren-highlight', isEnabled ? buildHighlightRule(parenEntryList, Config.getParenStyleMap()) : '');
}

function applyWordHighlight() {
    const isEnabled = Config.getWordHighlight();
    setStyle('word-highlight', isEnabled ? buildHighlightRule(buildWordEntryList(), Config.getWordStyleMap()) : '');
}

function buildHighlightRule(entryList, styleMap) {
    return entryList.map(entry => {
        const entryStyle = readEntryStyle(styleMap, entry);
        return entry.selector + ' { '
            + 'color: ' + (entryStyle.color || entry.color) + '; '
            + 'font-size: ' + entryStyle.size + 'em; '
            + 'background: ' + BACKGROUND_MAP[entryStyle.background] + '; }';
    }).join(' ');
}

function readEntryStyle(styleMap, entry) {
    return Object.assign({ size: 1, color: '', background: 'none' }, styleMap[entry.key]);
}

function applyFontFamily(value) {
    setStyle('font-family', '.content { font-family: ' + value + '; }');
}

function applyFontSize(value) {
    setStyle('font-size', '.content { font-size: ' + value + 'px; }');
}

function applyLineHeight(value) {
    setStyle('line-height', '.content { line-height: ' + value + '; }');
}

function applyLetterSpacing(value) {
    setStyle('letter-spacing', '.content { letter-spacing: ' + value + 'em; }');
}

function applyWidthLimit(isEnabled, size) {
    setStyle('width-limit', isEnabled ? '.content { max-width: ' + size + 'px; }' : '');
}

function formatFontSize(value) {
    return value.toFixed(1) + 'px';
}

function formatLineHeight(value) {
    return value.toFixed(2);
}

function formatLetterSpacing(value) {
    return value.toFixed(2) + 'em';
}

function formatWidthLimitSize(value) {
    return value + 'px';
}

function formatHighlightSize(value) {
    return value.toFixed(2) + 'em';
}

function showItem(item, get) {
    item.style.display = get() ? '' : 'none';
    refreshList.push(() => {
        item.style.display = get() ? '' : 'none';
    });
}

function toggleItem(item, isShown) {
    item.getAnimations().forEach(animation => animation.cancel());
    modal.fitHeight(() => {
        item.style.display = isShown ? '' : 'none';
    });

    item.style.display = '';
    item.style.overflow = 'hidden';
    const keyframeList = [
        { height: '0px', minHeight: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 },
        { height: item.offsetHeight + 'px', minHeight: '0px', opacity: 1 },
    ];
    const animation = item.animate(isShown ? keyframeList : keyframeList.reverse(), { duration: EXPAND_DURATION, easing: 'ease' });
    animation.onfinish = () => {
        item.style.overflow = '';
        item.style.display = isShown ? '' : 'none';
    };
}

function buildHighlightPage(entryList, getMap, setMap, apply) {
    const page = document.createElement('div');
    page.classList.add('preference-page');

    entryList.forEach(entry => {
        const entryPage = buildHighlightEntryPage(entry, getMap, setMap, apply);
        page.appendChild(buildNavigationItem(entry.label, () => {
            showNextPage(entry.label, entryPage);
        }));
    });
    return page;
}

function buildHighlightEntryPage(entry, getMap, setMap, apply) {
    const page = document.createElement('div');
    page.classList.add('preference-page');

    const get = () => readEntryStyle(getMap(), entry);
    const update = (change) => {
        const styleMap = Object.assign({}, getMap());
        styleMap[entry.key] = Object.assign(get(), change);
        setMap(styleMap);
        apply();
    };

    page.appendChild(buildSeekbarItem(Text.getFontSize(), HIGHLIGHT_SIZE_MIN, HIGHLIGHT_SIZE_MAX, HIGHLIGHT_SIZE_STEP, () => get().size, formatHighlightSize, (value) => {
        update({ size: value });
    }));
    page.appendChild(buildColorItem(Text.getHighlightColor(), entry.color, () => get().color, (value) => {
        update({ color: value });
    }));
    page.appendChild(buildRadioItem(Text.getHighlightBackground(), [
        { value: 'none', label: Text.getBackgroundNone() },
        { value: 'fill', label: Text.getBackgroundFill() },
        { value: 'hatch', label: Text.getBackgroundHatch() },
    ], () => get().background, (value) => {
        update({ background: value });
    }));
    return page;
}

function buildWordEntryList() {
    return Config.getWordList().map((word, index) => ({
        key: word.value,
        selector: '.content .word-' + index,
        color: WORD_COLOR,
    }));
}

function findWord(value) {
    return Config.getWordList().find(word => word.value === value);
}

function addWord(value) {
    if (findWord(value)) {
        return;
    }
    Config.setWordList(Config.getWordList().concat({ value, exclusionList: [] }));
    changeWord();
}

function updateWord(value, change) {
    Config.setWordList(Config.getWordList().map(word => word.value === value ? Object.assign({}, word, change) : word));
    changeWord();
}

function removeWord(value) {
    Config.setWordList(Config.getWordList().filter(word => word.value !== value));
    const wordStyleMap = Object.assign({}, Config.getWordStyleMap());
    delete wordStyleMap[value];
    Config.setWordStyleMap(wordStyleMap);
    wordEntryPageMap.delete(value);
    changeWord();
}

function changeWord() {
    renderWordPage();
    applyWordHighlight();
    api.onWordChange();
}

function renderWordPage() {
    wordPage.replaceChildren();
    Config.getWordList().forEach(word => {
        wordPage.appendChild(buildNavigationItem(word.value, () => {
            showWordEntryPage(word.value);
        }));
    });
    wordPage.appendChild(buildDivider());
    wordPage.appendChild(buildNavigationItem(Text.getWordAdd(), () => {
        showInputPage(Text.getWordAdd(), addWord);
    }));
}

function showWordEntryPage(value) {
    if (!wordEntryPageMap.has(value)) {
        wordEntryPageMap.set(value, buildWordEntryPage(value));
    }
    showNextPage(value, wordEntryPageMap.get(value));
}

function buildWordEntryPage(value) {
    const page = buildHighlightEntryPage({ key: value, color: WORD_COLOR }, Config.getWordStyleMap, Config.setWordStyleMap, applyWordHighlight);

    const exclusionSection = document.createElement('div');
    const renderExclusion = () => {
        exclusionSection.replaceChildren(buildCaption(Text.getExclusion()));
        findWord(value).exclusionList.forEach(exclusion => {
            exclusionSection.appendChild(buildRemovableItem(exclusion, () => {
                updateWord(value, { exclusionList: findWord(value).exclusionList.filter(item => item !== exclusion) });
                modal.fitHeight(renderExclusion);
            }));
        });
        exclusionSection.appendChild(buildNavigationItem(Text.getExclusionAdd(), () => {
            showInputPage(Text.getExclusionAdd(), (exclusion) => {
                const exclusionList = findWord(value).exclusionList;
                if (exclusionList.includes(exclusion)) {
                    return;
                }
                updateWord(value, { exclusionList: exclusionList.concat(exclusion) });
                renderExclusion();
            });
        }));
    };
    renderExclusion();

    page.appendChild(buildDivider());
    page.appendChild(exclusionSection);
    if (!findWord(value).isDefault) {
        page.appendChild(buildDivider());
        page.appendChild(buildActionItem(Text.getWordRemove(), () => {
            removeWord(value);
            showPreviousPage();
        }));
    }
    return page;
}

function showInputPage(title, onSubmit) {
    const input = document.createElement('input');
    input.classList.add('preference-input');
    input.type = 'text';

    const page = document.createElement('div');
    page.classList.add('preference-page', 'input');
    page.appendChild(input);

    let isSubmitted = false;
    const submit = () => {
        const value = input.value.trim();
        if (isSubmitted || !value) {
            return;
        }
        isSubmitted = true;
        onSubmit(value);
        showPreviousPage();
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            submit();
        }
    });

    modal.addRightButton(Text.getAdd(), submit);
    showNextPage(title, page);
    input.focus({ preventScroll: true });
}

function buildColorItem(labelText, defaultColor, get, onChange) {
    const picker = Component.createColorPicker(get() || defaultColor, (next) => {
        radio.setValue('custom');
        onChange(next);
    });

    const radio = Component.createRadio([
        { value: 'default', label: Text.getDefaultColor() },
        { value: 'custom', label: Text.getCustomColor() },
    ], get() ? 'custom' : 'default', (next) => {
        if (next === 'default') {
            picker.setValue(defaultColor);
            onChange('');
        } else {
            onChange(picker.getValue());
        }
    });

    refreshList.push(() => {
        radio.setValue(get() ? 'custom' : 'default');
        picker.setValue(get() || defaultColor);
    });

    const control = document.createElement('div');
    control.classList.add('preference-color');
    control.appendChild(radio.getElement());
    control.appendChild(picker.getElement());

    const item = document.createElement('div');
    item.classList.add('preference-item');
    item.appendChild(buildLabel(labelText));
    item.appendChild(control);
    return item;
}

function buildSwitchItem(labelText, get, onChange) {
    const toggle = Component.createSwitch(get(), onChange);
    refreshList.push(() => toggle.setValue(get()));

    const item = document.createElement('div');
    item.classList.add('preference-item', 'clickable');
    item.appendChild(buildLabel(labelText));
    item.appendChild(toggle.getElement());
    item.addEventListener('click', (e) => {
        if (!toggle.getElement().contains(e.target)) {
            toggle.toggle();
        }
    });
    return item;
}

function buildRadioItem(labelText, optionList, get, onChange) {
    const radio = Component.createRadio(optionList, get(), onChange);
    refreshList.push(() => radio.setValue(get()));

    const item = document.createElement('div');
    item.classList.add('preference-item');
    item.appendChild(buildLabel(labelText));
    item.appendChild(radio.getElement());
    return item;
}

function buildSeekbarItem(labelText, min, max, step, get, format, onChange) {
    const value = document.createElement('div');
    value.classList.add('preference-value');
    value.textContent = format(get());

    const seekbar = Component.createSeekbar(min, max, step, get(), (next) => {
        value.textContent = format(next);
        onChange(next);
    });
    refreshList.push(() => {
        seekbar.setValue(get());
        value.textContent = format(get());
    });

    const header = document.createElement('div');
    header.classList.add('preference-seekbar-header');
    header.appendChild(buildLabel(labelText));
    header.appendChild(value);

    const item = document.createElement('div');
    item.classList.add('preference-item', 'seekbar');
    item.appendChild(header);
    item.appendChild(seekbar.getElement());
    return item;
}

function buildNavigationItem(labelText, onClick) {
    const icon = document.createElement('div');
    icon.classList.add('preference-icon');
    icon.innerHTML = Design.getIcon('right', 'var(--color-gray)');

    const item = document.createElement('div');
    item.classList.add('preference-item', 'clickable');
    item.appendChild(buildLabel(labelText));
    item.appendChild(icon);
    item.addEventListener('click', onClick);
    return item;
}

function buildActionItem(labelText, onClick) {
    const item = document.createElement('div');
    item.classList.add('preference-item', 'clickable', 'danger');
    item.appendChild(buildLabel(labelText));
    item.addEventListener('click', onClick);
    return item;
}

function buildLabel(text) {
    const label = document.createElement('div');
    label.classList.add('preference-label');
    label.textContent = text;
    return label;
}

function buildRemovableItem(labelText, onRemove) {
    const button = document.createElement('button');
    button.classList.add('preference-remove');
    button.type = 'button';
    button.innerHTML = Design.getIcon('close', 'var(--color-gray)');
    button.addEventListener('click', onRemove);

    const item = document.createElement('div');
    item.classList.add('preference-item');
    item.appendChild(buildLabel(labelText));
    item.appendChild(button);
    return item;
}

function buildCaption(text) {
    const caption = document.createElement('div');
    caption.classList.add('preference-caption');
    caption.textContent = text;
    return caption;
}

function buildDivider() {
    const divider = document.createElement('div');
    divider.classList.add('preference-divider');
    return divider;
}
