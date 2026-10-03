export const Config = {
    init,
    show,
    getWords,
};

import { Message } from '/lib/message.js';
import { Page } from '/lib/page.js';
import { Shell } from '/lib/shell.js';
import { Storage } from '/lib/storage.js';

import { Theme } from '/global/theme.js';

import { Component } from './config/component.js';
import { Library } from './config/library.js';

let pageManager;
let centerModal;
let centerModalContent;
let bottomModal;
let bottomModalContent;
let current;
let configContent;
let lawContent;
let isOpen = false;

const pageActions = new WeakMap();

function init(api) {
    lawContent = api.getContent();

    const fragment = document.createDocumentFragment();
    fragment.appendChild(Component.createCategory('内容'));
    fragment.appendChild(Component.createDivider());

    const configItemTOC = Component.createCheckboxItem('本文中の目次を表示');
    fragment.appendChild(configItemTOC);
    fragment.appendChild(Component.createDivider());

    const configItemSupplProvision = Component.createCheckboxItem('附則を表示');
    fragment.appendChild(configItemSupplProvision);
    fragment.appendChild(Component.createDivider());

    fragment.appendChild(Component.createCategory('強調表示'));
    fragment.appendChild(Component.createDivider());

    const configItemParen = Component.createNavigationItem('括弧の強調表示');
    fragment.appendChild(configItemParen);
    fragment.appendChild(Component.createDivider());

    const configItemWord = Component.createNavigationItem('語句の強調表示');
    fragment.appendChild(configItemWord);
    fragment.appendChild(Component.createDivider());

    const configItemStructure = Component.createNavigationItem('構成の強調表示');
    fragment.appendChild(configItemStructure);
    fragment.appendChild(Component.createDivider());

    fragment.appendChild(Component.createCategory('外観'));
    fragment.appendChild(Component.createDivider());

    const configItemTheme = Component.createNavigationItem('テーマ');
    fragment.appendChild(configItemTheme);
    fragment.appendChild(Component.createDivider());

    const configItemFontFamily = Component.createNavigationItem('書体');
    fragment.appendChild(configItemFontFamily);
    fragment.appendChild(Component.createDivider());

    const configItemFontSize = Component.createSeekbarItem('文字サイズ', '14', '18', '0.5');
    fragment.appendChild(configItemFontSize);
    fragment.appendChild(Component.createDivider());

    const configItemLineHeight = Component.createSeekbarItem('行間', '1.6', '2.0', '0.05');
    fragment.appendChild(configItemLineHeight);
    fragment.appendChild(Component.createDivider());

    const configItemLetterSpacing = Component.createSeekbarItem('字間', '0.00', '0.20', '0.01');
    fragment.appendChild(configItemLetterSpacing);
    fragment.appendChild(Component.createDivider());

    const configItemWidthLimit = Component.createNavigationItem('横幅制限');
    fragment.appendChild(configItemWidthLimit);
    fragment.appendChild(Component.createDivider());

    configContent = document.createElement('div');
    configContent.classList.add('config-content');

    centerModalContent = document.createElement('div');
    centerModalContent.classList.add('config-modal-content');

    centerModal = Shell.createModal(centerModalContent);
    centerModal.setWidth('min(90vw, 640px)');
    centerModal.setHeight('min(64vh, 640px)');
    centerModal.enableCloseButton(hide);
    centerModalContent.closest('.shell-modal').classList.add('config-modal');

    bottomModalContent = document.createElement('div');
    bottomModalContent.classList.add('config-modal-content');

    bottomModal = Shell.createModal(bottomModalContent);
    bottomModal.setPlacement('bottom');
    bottomModal.setHeight('90%');
    bottomModal.enableCloseButton(hide);
    bottomModalContent.closest('.shell-modal').classList.add('config-modal');

    current = isNarrow() ? bottomModal : centerModal;
    (isNarrow() ? bottomModalContent : centerModalContent).appendChild(configContent);

    pageManager = Page.createManager(configContent);

    const page = document.createElement('div');
    page.appendChild(fragment);
    pageManager.open(page);

    updateNav();

    window.addEventListener('resize', () => {
        place();
    });

    Component.toggleCheckboxItem(configItemTOC, 'toc', false, Library.showTOC, Library.hideTOC);
    configItemTOC.addEventListener('click', () => {
        Component.toggleCheckboxItem(configItemTOC, 'toc', false, Library.showTOC, Library.hideTOC);
        api.onDisplayChange();
    });

    Component.toggleCheckboxItem(configItemSupplProvision, 'suppl-provision', false, Library.showSupplProvision, Library.hideSupplProvision);
    configItemSupplProvision.addEventListener('click', () => {
        Component.toggleCheckboxItem(configItemSupplProvision, 'suppl-provision', false, Library.showSupplProvision, Library.hideSupplProvision);
        api.onDisplayChange();
    });

    const showParenAll = () => {
        Library.showParenColor();
        Library.showParenBackground();
        Library.showParenFontSize();
    };

    const hideParenAll = () => {
        Library.hideParenColor();
        Library.hideParenBackground();
        Library.hideParenFontSize();
    };

    initTogglePage(configItemParen, {
        title: '括弧の強調表示',
        label: '強調表示',
        storageKey: 'paren-highlight',
        defaultEnabled: false,
        onEnable: showParenAll,
        onDisable: hideParenAll,
        appendDetail: appendParenDetail,
    });

    Library.showWordColor();
    configItemWord.addEventListener('click', () => {
        openWordListPage(api.onWordsChange);
    });

    Library.showStructureStyle();
    configItemStructure.addEventListener('click', () => {
        openStructureListPage();
    });

    const applyWidthLimitSize = (value) => {
        if (Storage.get('width-limit', null) !== 'disable') {
            Library.enableWidthLimit(value);
        }
        api.restoreScroll();
    };

    initTogglePage(configItemWidthLimit, {
        title: '横幅制限',
        label: '横幅制限',
        storageKey: 'width-limit',
        defaultEnabled: true,
        onEnable: Library.enableWidthLimit,
        onDisable: Library.disableWidthLimit,
        onToggle: api.restoreScroll,
        appendDetail: (page) => {
            appendWidthLimitDetail(page, applyWidthLimitSize);
        },
    });

    initThemePage(configItemTheme);

    initFontFamilyPage(configItemFontFamily);

    Component.initSeekbar(configItemFontSize, 'font-size', 16, (value) => {
        lawContent.style.fontSize = value + 'px';
    });

    Component.initSeekbar(configItemLineHeight, 'line-height', 1.8, (value) => {
        lawContent.style.lineHeight = value + '';
    });

    Component.initSeekbar(configItemLetterSpacing, 'letter-spacing', 0, (value) => {
        lawContent.style.letterSpacing = value + 'em';
    });
}

function show() {
    isOpen = true;
    place();
    current.show();
}

function hide() {
    isOpen = false;
    current.hide();
}

function isNarrow() {
    return window.innerWidth <= 640;
}

function place() {
    const next = isNarrow() ? bottomModal : centerModal;
    if (next === current) {
        return;
    }

    current.hide();
    current = next;
    (isNarrow() ? bottomModalContent : centerModalContent).appendChild(configContent);
    updateNav();

    if (isOpen) {
        current.show();
    }
}

function updateNav() {
    if (pageManager.isRoot()) {
        current.disableBackButton();
        current.setTitle('設定');
    } else {
        current.enableBackButton(closePage);
        current.setTitle('');
    }

    current.clearNav();
    for (const action of pageActions.get(pageManager.getCurrent()) || []) {
        current.addRightButton(action.label, action.onClick);
    }

    current.updateShade(pageManager.getCurrent());
}

function closePage() {
    pageManager.close();
    updateNav();
}

function initTogglePage(item, { title, label, storageKey, defaultEnabled, onEnable, onDisable, onToggle, appendDetail }) {
    const stored = Storage.get(storageKey, null);
    const enabled = defaultEnabled ? stored !== 'disable' : stored === 'enable';

    if (enabled) {
        onEnable();
    } else {
        onDisable();
    }

    item.addEventListener('click', () => {
        const page = openPage();

        page.appendChild(Component.createCategory(title));
        page.appendChild(Component.createDivider());

        const toggle = Component.createCheckboxItem(label);
        Component.toggleCheckboxItem(toggle, storageKey, defaultEnabled, onEnable, onDisable);
        toggle.addEventListener('click', () => {
            Component.toggleCheckboxItem(toggle, storageKey, defaultEnabled, onEnable, onDisable);
            if (onToggle) {
                onToggle();
            }
        });

        page.appendChild(toggle);
        page.appendChild(Component.createDivider());

        appendDetail(page);
    });
}

function createRefresher(styleId, hideFn, showFn) {
    return () => {
        if (document.getElementById(styleId)) {
            hideFn();
            showFn();
        }
    };
}

const refreshParenColor = createRefresher('style-paren-color', Library.hideParenColor, Library.showParenColor);
const refreshParenBackground = createRefresher('style-paren-background', Library.hideParenBackground, Library.showParenBackground);
const refreshParenFontSize = createRefresher('style-paren-font-size', Library.hideParenFontSize, Library.showParenFontSize);
const refreshStructureStyle = createRefresher('style-structure', Library.hideStructureStyle, Library.showStructureStyle);
const refreshWordColor = createRefresher('style-word-color', Library.hideWordColor, Library.showWordColor);

function openPage(actions) {
    const page = document.createElement('div');

    if (actions) {
        pageActions.set(page, actions);
    }

    pageManager.open(page);
    updateNav();

    return page;
}

function initPage(item, { title, options, defaultKey, storageKey, onSelect }) {
    const valueEl = item.querySelector('.config-value');
    const stored = Storage.get(storageKey, null);
    const key = (stored && options[stored]) ? stored : defaultKey;

    onSelect(key);
    valueEl.textContent = options[key].label;

    item.addEventListener('click', () => {
        const page = openPage();

        page.appendChild(Component.createCategory(title));
        page.appendChild(Component.createDivider());

        appendRadioItems(page, storageKey, defaultKey, options, (k) => {
            onSelect(k);
            valueEl.textContent = options[k].label;
        });
    });
}

function initRadioSelectPage(navItem, title, storageKey, defaultKey, onChanged, options) {
    const page = openPage();

    page.appendChild(Component.createCategory(title));
    page.appendChild(Component.createDivider());

    const valueEl = navItem.querySelector('.config-value');

    appendRadioItems(page, storageKey, defaultKey, options, (k) => {
        valueEl.textContent = options[k].label;
        onChanged();
    });
}

function appendRadioItems(page, storageKey, defaultKey, options, onChanged) {
    const raw = Storage.get(storageKey, null);
    const currentKey = (raw && options[raw]) ? raw : defaultKey;

    appendRadioOptions(page, options, currentKey, (k) => {
        if (k === defaultKey) {
            Storage.remove(storageKey);
        } else {
            Storage.set(storageKey, k);
        }

        onChanged(k);
    });
}

function appendRadioOptions(page, options, currentKey, onSelect) {
    const items = {};

    for (const k of Object.keys(options)) {
        const option = Component.createRadioItem(options[k].label);
        const checkmark = option.querySelector('.config-checkmark');

        if (k === currentKey) {
            checkmark.style.visibility = 'visible';
        }

        option.addEventListener('click', () => {
            for (const x of Object.keys(items)) {
                items[x].querySelector('.config-checkmark').style.visibility = 'hidden';
            }

            checkmark.style.visibility = 'visible';
            onSelect(k);
        });

        items[k] = option;
        page.appendChild(option);
        page.appendChild(Component.createDivider());
    }
}

const COLOR_OPTIONS = {
    'mediumorchid': { label: '紫' },
    'mediumseagreen': { label: '緑' },
    'coral': { label: '橙' },
    'deepskyblue': { label: '青' },
    'deeppink': { label: '桃' },
    'goldenrod': { label: '黄' },
    'gray': { label: '灰' },
    'inherit': { label: 'なし' },
};

const CUSTOM_COLOR_DEFAULT = '#808080';

function getColorLabel(color) {
    return COLOR_OPTIONS[color] ? COLOR_OPTIONS[color].label : color;
}

function appendColorOptions(page, currentColor, onSelect) {
    const checkmarks = [];

    const check = (checkmark) => {
        for (const x of checkmarks) {
            x.style.visibility = 'hidden';
        }
        checkmark.style.visibility = 'visible';
    };

    for (const color of Object.keys(COLOR_OPTIONS)) {
        const option = Component.createRadioItem(COLOR_OPTIONS[color].label);
        const checkmark = option.querySelector('.config-checkmark');
        checkmarks.push(checkmark);

        if (color === currentColor) {
            checkmark.style.visibility = 'visible';
        }

        option.addEventListener('click', () => {
            check(checkmark);
            onSelect(color);
        });

        page.appendChild(option);
        page.appendChild(Component.createDivider());
    }

    const customItem = Component.createColorItem('カスタム');
    const picker = customItem.querySelector('.config-color');
    const customCheckmark = customItem.querySelector('.config-checkmark');
    checkmarks.push(customCheckmark);

    if (COLOR_OPTIONS[currentColor]) {
        picker.value = CUSTOM_COLOR_DEFAULT;
    } else {
        picker.value = currentColor;
        customCheckmark.style.visibility = 'visible';
    }

    picker.addEventListener('input', () => {
        check(customCheckmark);
        onSelect(picker.value);
    });

    customItem.addEventListener('click', (e) => {
        if (e.target === picker) {
            return;
        }
        check(customCheckmark);
        onSelect(picker.value);
    });

    page.appendChild(customItem);
    page.appendChild(Component.createDivider());
}

function appendColorNavItems(page, levels) {
    for (const level of levels) {
        const navItem = Component.createNavigationItem(level.title);
        const valueEl = navItem.querySelector('.config-value');
        valueEl.textContent = getColorLabel(Storage.get(level.storageKey, level.defaultKey));

        navItem.addEventListener('click', () => {
            const colorPage = openPage();

            colorPage.appendChild(Component.createCategory(level.title));
            colorPage.appendChild(Component.createDivider());

            appendColorOptions(colorPage, Storage.get(level.storageKey, level.defaultKey), (color) => {
                if (color === level.defaultKey) {
                    Storage.remove(level.storageKey);
                } else {
                    Storage.set(level.storageKey, color);
                }
                valueEl.textContent = getColorLabel(color);
                level.onChanged();
            });
        });

        page.appendChild(navItem);
        page.appendChild(Component.createDivider());
    }
}

const PAREN_COLOR_LEVELS = [
    { title: '第一階層の色', storageKey: 'paren-color-1', defaultKey: 'mediumorchid', onChanged: refreshParenColor },
    { title: '第二階層の色', storageKey: 'paren-color-2', defaultKey: 'mediumseagreen', onChanged: refreshParenColor },
    { title: '第三階層の色', storageKey: 'paren-color-3', defaultKey: 'coral', onChanged: refreshParenColor },
    { title: '第四階層の色', storageKey: 'paren-color-4', defaultKey: 'gray', onChanged: refreshParenColor },
    { title: '第五階層の色', storageKey: 'paren-color-5', defaultKey: 'gray', onChanged: refreshParenColor },
];

const PAREN_BACKGROUND_OPTIONS = {
    'color': { label: '標準' },
    'amikake': { label: '網掛け' },
    'none': { label: 'なし' },
};

const PAREN_FONT_SIZE_OPTIONS = {
    '1.00': { label: '標準' },
    '0.95': { label: '95%' },
    '0.90': { label: '90%' },
    '0.85': { label: '85%' },
    '0.80': { label: '80%' },
};

function appendParenDetail(page) {
    page.appendChild(Component.createCategory('括弧階層'));
    page.appendChild(Component.createDivider());

    appendColorNavItems(page, PAREN_COLOR_LEVELS);

    page.appendChild(Component.createCategory('括弧全体'));
    page.appendChild(Component.createDivider());

    const bgNavItem = Component.createNavigationItem('背景');
    const bgValueEl = bgNavItem.querySelector('.config-value');

    const bgStored = Storage.get('paren-background', null);
    const bgCurrentKey = (bgStored && PAREN_BACKGROUND_OPTIONS[bgStored]) ? bgStored : 'color';
    bgValueEl.textContent = PAREN_BACKGROUND_OPTIONS[bgCurrentKey].label;

    bgNavItem.addEventListener('click', () => {
        initRadioSelectPage(bgNavItem, '背景', 'paren-background', 'color', refreshParenBackground, PAREN_BACKGROUND_OPTIONS);
    });

    page.appendChild(bgNavItem);
    page.appendChild(Component.createDivider());

    const fsNavItem = Component.createNavigationItem('文字サイズ');
    const fsValueEl = fsNavItem.querySelector('.config-value');

    const fsStored = Storage.get('paren-font-size', null);
    const fsCurrentKey = (fsStored && PAREN_FONT_SIZE_OPTIONS[fsStored]) ? fsStored : '1.00';
    fsValueEl.textContent = PAREN_FONT_SIZE_OPTIONS[fsCurrentKey].label;

    fsNavItem.addEventListener('click', () => {
        initRadioSelectPage(fsNavItem, '文字サイズ', 'paren-font-size', '1.00', refreshParenFontSize, PAREN_FONT_SIZE_OPTIONS);
    });

    page.appendChild(fsNavItem);
    page.appendChild(Component.createDivider());
}

const WORD_DEFAULT_COLOR = 'coral';

function getWords() {
    return Library.getWords().map(entry => entry.word);
}

function saveWords(words) {
    Storage.set('highlight-words', words);
    refreshWordColor();
}

function getWordValue(entry) {
    return entry.enabled === false ? 'オフ' : getColorLabel(entry.color);
}

function openWordListPage(onWordsChange) {
    const page = openPage();

    page.appendChild(Component.createCategory('語句の強調表示'));
    page.appendChild(Component.createDivider());

    const group = document.createElement('div');
    group.className = 'config-group';
    page.appendChild(group);

    const inputItem = Component.createInputItem('語句を入力', '追加');
    const field = inputItem.querySelector('.config-input');
    const button = inputItem.querySelector('.config-button');
    page.appendChild(inputItem);
    page.appendChild(Component.createDivider());

    const renderWords = () => {
        group.replaceChildren();

        Library.getWords().forEach((entry, index) => {
            const navItem = Component.createNavigationItem(entry.word);
            const valueEl = navItem.querySelector('.config-value');
            valueEl.textContent = getWordValue(entry);

            navItem.addEventListener('click', () => {
                openWordPage(index, valueEl, () => {
                    renderWords();
                    onWordsChange();
                });
            });

            group.appendChild(navItem);
            group.appendChild(Component.createDivider());
        });
    };

    const addWord = () => {
        const word = field.value.trim();
        if (!word) {
            return;
        }

        const words = Library.getWords();
        if (words.some(entry => entry.word === word)) {
            Message.warn('「' + word + '」は追加済みです。');
            return;
        }

        words.push({ word: word, color: WORD_DEFAULT_COLOR, enabled: true });
        saveWords(words);
        field.value = '';
        renderWords();
        onWordsChange();
    };

    button.addEventListener('click', addWord);
    field.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) {
            addWord();
        }
    });

    renderWords();
}

function openWordPage(index, valueEl, onRemove) {
    const entry = Library.getWords()[index];

    const remove = () => {
        const words = Library.getWords();
        words.splice(index, 1);
        saveWords(words);
        closePage();
        onRemove();
    };

    const page = openPage(Library.isDefaultWord(entry.word) ? null : [{ label: '削除', onClick: remove }]);

    const updateEntry = (change) => {
        const words = Library.getWords();
        change(words[index]);
        saveWords(words);
        valueEl.textContent = getWordValue(words[index]);
    };

    page.appendChild(Component.createCategory('「' + entry.word + '」'));
    page.appendChild(Component.createDivider());

    appendSwitch(page, '強調表示', entry.enabled !== false, (enabled) => {
        updateEntry((target) => {
            target.enabled = enabled;
        });
    });

    page.appendChild(Component.createCategory('色'));
    page.appendChild(Component.createDivider());

    appendColorOptions(page, entry.color, (color) => {
        updateEntry((target) => {
            target.color = color;
        });
    });
}

function appendSwitch(page, label, checked, onChange) {
    const item = Component.createCheckboxItem(label);
    const checkbox = item.querySelector('.config-checkbox');
    checkbox.classList.toggle('checked', checked);

    item.addEventListener('click', () => {
        const next = !checkbox.classList.contains('checked');
        checkbox.classList.toggle('checked', next);
        onChange(next);
    });

    page.appendChild(item);
    page.appendChild(Component.createDivider());
}

function getStructureValue(structure) {
    return structure.enabled ? getColorLabel(structure.color) : 'オフ';
}

function saveStructure(structure) {
    const stored = Storage.get('highlight-structures', null);
    const settings = (stored && typeof stored === 'object') ? stored : {};

    settings[structure.key] = {
        enabled: structure.enabled,
        color: structure.color,
        bold: structure.bold,
        italic: structure.italic,
        underline: structure.underline,
        emphasis: structure.emphasis,
    };

    Storage.set('highlight-structures', settings);
    refreshStructureStyle();
}

function openStructureListPage() {
    const page = openPage();

    let group = '';

    for (const structure of Library.getStructures()) {
        if (structure.group !== group) {
            group = structure.group;
            page.appendChild(Component.createCategory(group));
            page.appendChild(Component.createDivider());
        }

        const navItem = Component.createNavigationItem(structure.label);
        const valueEl = navItem.querySelector('.config-value');
        valueEl.textContent = getStructureValue(structure);

        navItem.addEventListener('click', () => {
            openStructurePage(structure.key, valueEl);
        });

        page.appendChild(navItem);
        page.appendChild(Component.createDivider());
    }
}

function openStructurePage(key, valueEl) {
    const page = openPage();
    const structure = Library.getStructures().find(x => x.key === key);

    const update = (change) => {
        change(structure);
        saveStructure(structure);
        valueEl.textContent = getStructureValue(structure);
    };

    page.appendChild(Component.createCategory(structure.label));
    page.appendChild(Component.createDivider());

    appendSwitch(page, '強調表示', structure.enabled, (enabled) => {
        update((target) => {
            target.enabled = enabled;
        });
    });

    page.appendChild(Component.createCategory('書式'));
    page.appendChild(Component.createDivider());

    appendSwitch(page, '太字', structure.bold, (bold) => {
        update((target) => {
            target.bold = bold;
        });
    });

    appendSwitch(page, '斜体', structure.italic, (italic) => {
        update((target) => {
            target.italic = italic;
        });
    });

    appendSwitch(page, '下線', structure.underline, (underline) => {
        update((target) => {
            target.underline = underline;
        });
    });

    appendSwitch(page, '傍点', structure.emphasis, (emphasis) => {
        update((target) => {
            target.emphasis = emphasis;
        });
    });

    page.appendChild(Component.createCategory('色'));
    page.appendChild(Component.createDivider());

    appendColorOptions(page, structure.color, (color) => {
        update((target) => {
            target.color = color;
        });
    });
}

function appendWidthLimitDetail(page, applyValue) {
    const sizeItem = Component.createSeekbarItem('幅', '640', '1040', '20');
    Component.initSeekbar(sizeItem, 'width-limit-size', 800, applyValue);

    page.appendChild(sizeItem);
    page.appendChild(Component.createDivider());
}

function initThemePage(item) {
    initPage(item, {
        title: 'テーマ',
        options: {
            'system': { label: '自動' },
            'light': { label: 'ライト' },
            'dark': { label: 'ダーク' },
            'paper': { label: '和紙' },
            'sepia': { label: 'セピア' },
            'nord': { label: '青灰' },
            'chocolate': { label: 'チョコレート' },
        },
        defaultKey: 'system',
        storageKey: 'theme',
        onSelect: Theme.set,
    });
}

function initFontFamilyPage(item) {
    initPage(item, {
        title: '書体',
        options: {
            'sans-serif': { label: 'ゴシック' },
            'serif': { label: '明朝' },
        },
        defaultKey: 'sans-serif',
        storageKey: 'font-family',
        onSelect: Library.setFontFamily,
    });
}
