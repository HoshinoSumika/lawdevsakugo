export const Preference = {
    init,
    show,
    getWords,
};

import { Message } from '/lib/message.js';
import { Page } from '/lib/page.js';
import { Shell } from '/lib/shell.js';

import { Config } from '/global/config.js';
import { Theme } from '/global/theme.js';

import { Component } from './preference/component.js';
import { Library } from './preference/library.js';

let pageManager;
let centerModal;
let centerModalContent;
let bottomModal;
let bottomModalContent;
let current;
let preferenceContent;
let lawContent;
let isOpen = false;

const pageActions = new WeakMap();

function init(api) {
    lawContent = api.getContent();

    const fragment = document.createDocumentFragment();
    fragment.appendChild(Component.createCategory('内容'));
    fragment.appendChild(Component.createDivider());

    const preferenceItemTOC = Component.createCheckboxItem('本文中の目次を表示');
    fragment.appendChild(preferenceItemTOC);
    fragment.appendChild(Component.createDivider());

    const preferenceItemSupplProvision = Component.createCheckboxItem('附則を表示');
    fragment.appendChild(preferenceItemSupplProvision);
    fragment.appendChild(Component.createDivider());

    fragment.appendChild(Component.createCategory('強調表示'));
    fragment.appendChild(Component.createDivider());

    const preferenceItemParen = Component.createNavigationItem('括弧の強調表示');
    fragment.appendChild(preferenceItemParen);
    fragment.appendChild(Component.createDivider());

    const preferenceItemWord = Component.createNavigationItem('語句の強調表示');
    fragment.appendChild(preferenceItemWord);
    fragment.appendChild(Component.createDivider());

    const preferenceItemStructure = Component.createNavigationItem('構成の強調表示');
    fragment.appendChild(preferenceItemStructure);
    fragment.appendChild(Component.createDivider());

    fragment.appendChild(Component.createCategory('条文比較'));
    fragment.appendChild(Component.createDivider());

    const preferenceItemDiffDeletion = Component.createNavigationItem('削除部分');
    fragment.appendChild(preferenceItemDiffDeletion);
    fragment.appendChild(Component.createDivider());

    const preferenceItemDiffAddition = Component.createNavigationItem('追加部分');
    fragment.appendChild(preferenceItemDiffAddition);
    fragment.appendChild(Component.createDivider());

    fragment.appendChild(Component.createCategory('外観'));
    fragment.appendChild(Component.createDivider());

    const preferenceItemTheme = Component.createNavigationItem('テーマ');
    fragment.appendChild(preferenceItemTheme);
    fragment.appendChild(Component.createDivider());

    const preferenceItemFontFamily = Component.createNavigationItem('書体');
    fragment.appendChild(preferenceItemFontFamily);
    fragment.appendChild(Component.createDivider());

    const preferenceItemFontSize = Component.createSeekbarItem('文字サイズ', '14', '18', '0.5');
    fragment.appendChild(preferenceItemFontSize);
    fragment.appendChild(Component.createDivider());

    const preferenceItemLineHeight = Component.createSeekbarItem('行間', '1.6', '2.0', '0.05');
    fragment.appendChild(preferenceItemLineHeight);
    fragment.appendChild(Component.createDivider());

    const preferenceItemLetterSpacing = Component.createSeekbarItem('字間', '0.00', '0.20', '0.01');
    fragment.appendChild(preferenceItemLetterSpacing);
    fragment.appendChild(Component.createDivider());

    const preferenceItemWidthLimit = Component.createNavigationItem('横幅制限');
    fragment.appendChild(preferenceItemWidthLimit);
    fragment.appendChild(Component.createDivider());

    preferenceContent = document.createElement('div');
    preferenceContent.classList.add('preference-content');

    centerModalContent = document.createElement('div');
    centerModalContent.classList.add('preference-modal-content');

    centerModal = Shell.createModal(centerModalContent);
    centerModal.setWidth('min(90vw, 640px)');
    centerModal.setHeight('min(64vh, 640px)');
    centerModal.enableCloseButton(hide);
    centerModal.setDismiss(hide);
    centerModalContent.closest('.shell-modal').classList.add('preference-modal');

    bottomModalContent = document.createElement('div');
    bottomModalContent.classList.add('preference-modal-content');

    bottomModal = Shell.createModal(bottomModalContent);
    bottomModal.setPlacement('bottom');
    bottomModal.setHeight('90%');
    bottomModal.enableCloseButton(hide);
    bottomModal.setDismiss(hide);
    bottomModalContent.closest('.shell-modal').classList.add('preference-modal');

    current = isNarrow() ? bottomModal : centerModal;
    (isNarrow() ? bottomModalContent : centerModalContent).appendChild(preferenceContent);

    pageManager = Page.createManager(preferenceContent);

    const page = document.createElement('div');
    page.appendChild(fragment);
    pageManager.open(page);

    updateNav();

    window.addEventListener('resize', () => {
        place();
    });

    const applyTOC = (enabled) => {
        if (enabled) {
            Library.showTOC();
        } else {
            Library.hideTOC();
        }
    };

    applyTOC(Config.getTOC());
    Component.initSwitch(preferenceItemTOC, Config.getTOC(), (enabled) => {
        Config.setTOC(enabled);
        applyTOC(enabled);
        api.onDisplayChange();
    });

    const applySupplProvision = (enabled) => {
        if (enabled) {
            Library.showSupplProvision();
        } else {
            Library.hideSupplProvision();
        }
    };

    applySupplProvision(Config.getSupplProvision());
    Component.initSwitch(preferenceItemSupplProvision, Config.getSupplProvision(), (enabled) => {
        Config.setSupplProvision(enabled);
        applySupplProvision(enabled);
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

    initTogglePage(preferenceItemParen, {
        title: '括弧の強調表示',
        label: '強調表示',
        get: Config.getHighlightParen,
        set: Config.setHighlightParen,
        onEnable: showParenAll,
        onDisable: hideParenAll,
        appendDetail: appendParenDetail,
    });

    Library.showWordColor();
    preferenceItemWord.addEventListener('click', () => {
        openWordListPage(api.onWordsChange);
    });

    Library.showStructureStyle();
    preferenceItemStructure.addEventListener('click', () => {
        openStructureListPage();
    });

    Library.showDiffStyle();
    initDiffPage(preferenceItemDiffDeletion, 'deletion', '削除部分');
    initDiffPage(preferenceItemDiffAddition, 'addition', '追加部分');

    const applyWidthLimitSize = (value) => {
        Config.setWidthLimitSize(value);
        if (Config.getWidthLimit()) {
            Library.enableWidthLimit(value);
        }
        api.restoreScroll();
    };

    initTogglePage(preferenceItemWidthLimit, {
        title: '横幅制限',
        label: '横幅制限',
        get: Config.getWidthLimit,
        set: Config.setWidthLimit,
        onEnable: Library.enableWidthLimit,
        onDisable: Library.disableWidthLimit,
        onToggle: api.restoreScroll,
        appendDetail: (page) => {
            appendWidthLimitDetail(page, applyWidthLimitSize);
        },
    });

    initThemePage(preferenceItemTheme);

    initFontFamilyPage(preferenceItemFontFamily);

    initSeekbar(preferenceItemFontSize, Config.getFontSize, Config.setFontSize, (value) => {
        lawContent.style.fontSize = value + 'px';
    });

    initSeekbar(preferenceItemLineHeight, Config.getLineHeight, Config.setLineHeight, (value) => {
        lawContent.style.lineHeight = value + '';
    });

    initSeekbar(preferenceItemLetterSpacing, Config.getLetterSpacing, Config.setLetterSpacing, (value) => {
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
    (isNarrow() ? bottomModalContent : centerModalContent).appendChild(preferenceContent);
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

function initSeekbar(item, get, set, apply) {
    apply(get());
    Component.initSeekbar(item, get(), (value) => {
        set(value);
        apply(value);
    });
}

function initTogglePage(item, { title, label, get, set, onEnable, onDisable, onToggle, appendDetail }) {
    const apply = (enabled) => {
        if (enabled) {
            onEnable();
        } else {
            onDisable();
        }
    };

    apply(get());

    item.addEventListener('click', () => {
        const page = openPage();

        page.appendChild(Component.createCategory(title));
        page.appendChild(Component.createDivider());

        appendSwitch(page, label, get(), (enabled) => {
            set(enabled);
            apply(enabled);
            if (onToggle) {
                onToggle();
            }
        });

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
const refreshDiffStyle = createRefresher('style-diff', Library.hideDiffStyle, Library.showDiffStyle);

function openPage(actions) {
    const page = document.createElement('div');

    if (actions) {
        pageActions.set(page, actions);
    }

    pageManager.open(page);
    updateNav();

    return page;
}

function initPage(item, { title, options, defaultKey, get, set }) {
    const valueEl = item.querySelector('.preference-value');
    const getKey = () => options[get()] ? get() : defaultKey;

    valueEl.textContent = options[getKey()].label;

    item.addEventListener('click', () => {
        const page = openPage();

        page.appendChild(Component.createCategory(title));
        page.appendChild(Component.createDivider());

        appendRadioOptions(page, options, getKey(), (k) => {
            set(k);
            valueEl.textContent = options[k].label;
        });
    });
}

function appendRadioNavItem(page, { title, options, defaultKey, get, set, onChanged }) {
    const navItem = Component.createNavigationItem(title);
    const valueEl = navItem.querySelector('.preference-value');
    const getKey = () => options[get()] ? get() : defaultKey;

    valueEl.textContent = options[getKey()].label;

    navItem.addEventListener('click', () => {
        const radioPage = openPage();

        radioPage.appendChild(Component.createCategory(title));
        radioPage.appendChild(Component.createDivider());

        appendRadioOptions(radioPage, options, getKey(), (k) => {
            set(k);
            valueEl.textContent = options[k].label;
            onChanged();
        });
    });

    page.appendChild(navItem);
    page.appendChild(Component.createDivider());
}

function appendRadioOptions(page, options, currentKey, onSelect) {
    const items = {};

    for (const k of Object.keys(options)) {
        const option = Component.createRadioItem(options[k].label);
        const checkmark = option.querySelector('.preference-checkmark');

        if (k === currentKey) {
            checkmark.style.visibility = 'visible';
        }

        option.addEventListener('click', () => {
            for (const x of Object.keys(items)) {
                items[x].querySelector('.preference-checkmark').style.visibility = 'hidden';
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

function getColorLabel(color, options = COLOR_OPTIONS) {
    return options[color] ? options[color].label : color;
}

function appendColorOptions(page, currentColor, onSelect, options = COLOR_OPTIONS) {
    const checkmarks = [];

    const check = (checkmark) => {
        for (const x of checkmarks) {
            x.style.visibility = 'hidden';
        }
        checkmark.style.visibility = 'visible';
    };

    for (const color of Object.keys(options)) {
        const option = Component.createRadioItem(options[color].label);
        const checkmark = option.querySelector('.preference-checkmark');
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
    const picker = customItem.querySelector('.preference-color');
    const customCheckmark = customItem.querySelector('.preference-checkmark');
    checkmarks.push(customCheckmark);

    if (options[currentColor]) {
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
        const valueEl = navItem.querySelector('.preference-value');
        valueEl.textContent = getColorLabel(level.get(), level.options);

        navItem.addEventListener('click', () => {
            const colorPage = openPage();

            colorPage.appendChild(Component.createCategory(level.title));
            colorPage.appendChild(Component.createDivider());

            appendColorOptions(colorPage, level.get(), (color) => {
                level.set(color);
                valueEl.textContent = getColorLabel(color, level.options);
                level.onChanged();
            }, level.options);
        });

        page.appendChild(navItem);
        page.appendChild(Component.createDivider());
    }
}

const PAREN_COLOR_LEVELS = ['第一', '第二', '第三', '第四', '第五'].map((name, index) => {
    return {
        title: name + '階層の色',
        get: () => Config.getHighlightParenColor(index + 1),
        set: (color) => Config.setHighlightParenColor(index + 1, color),
        onChanged: refreshParenColor,
    };
});

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

    appendRadioNavItem(page, {
        title: '背景',
        options: PAREN_BACKGROUND_OPTIONS,
        defaultKey: 'color',
        get: Config.getHighlightParenBackground,
        set: Config.setHighlightParenBackground,
        onChanged: refreshParenBackground,
    });

    appendRadioNavItem(page, {
        title: '文字サイズ',
        options: PAREN_FONT_SIZE_OPTIONS,
        defaultKey: '1.00',
        get: Config.getHighlightParenFontSize,
        set: Config.setHighlightParenFontSize,
        onChanged: refreshParenFontSize,
    });
}

const DIFF_STYLE_OPTIONS = {
    'background': { label: '背景' },
    'underline': { label: '下線' },
    'color': { label: '文字色' },
    'strike': { label: '取消線' },
    'none': { label: 'なし' },
};

const DIFF_COLOR_OPTIONS = Object.keys(COLOR_OPTIONS).reduce((options, color) => {
    if (color !== 'inherit') {
        options[color] = COLOR_OPTIONS[color];
    }
    return options;
}, { 'standard': { label: '標準' } });

function initDiffPage(item, type, title) {
    item.addEventListener('click', () => {
        const page = openPage();

        page.appendChild(Component.createCategory(title));
        page.appendChild(Component.createDivider());

        appendRadioNavItem(page, {
            title: '表示',
            options: DIFF_STYLE_OPTIONS,
            defaultKey: type === 'deletion' ? 'strike' : 'color',
            get: () => Config.getDiffStyle(type),
            set: (value) => Config.setDiffStyle(type, value),
            onChanged: refreshDiffStyle,
        });

        appendColorNavItems(page, [{
            title: '色',
            options: DIFF_COLOR_OPTIONS,
            get: () => Config.getDiffColor(type),
            set: (color) => Config.setDiffColor(type, color),
            onChanged: refreshDiffStyle,
        }]);
    });
}

const WORD_DEFAULT_COLOR = 'coral';

function getWords() {
    return Library.getWords().map(entry => entry.word);
}

function saveWords(words) {
    Config.setHighlightWords(words);
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
    group.className = 'preference-group';
    page.appendChild(group);

    const inputItem = Component.createInputItem('語句を入力', '追加');
    const field = inputItem.querySelector('.preference-input');
    const button = inputItem.querySelector('.preference-button');
    page.appendChild(inputItem);
    page.appendChild(Component.createDivider());

    const renderWords = () => {
        group.replaceChildren();

        Library.getWords().forEach((entry, index) => {
            const navItem = Component.createNavigationItem(entry.word);
            const valueEl = navItem.querySelector('.preference-value');
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
    Component.initSwitch(item, checked, onChange);

    page.appendChild(item);
    page.appendChild(Component.createDivider());
}

function getStructureValue(structure) {
    return structure.enabled ? getColorLabel(structure.color) : 'オフ';
}

function saveStructure(structure) {
    const settings = Object.assign({}, Config.getHighlightStructures());

    settings[structure.key] = {
        enabled: structure.enabled,
        color: structure.color,
        bold: structure.bold,
        italic: structure.italic,
        underline: structure.underline,
        emphasis: structure.emphasis,
    };

    Config.setHighlightStructures(settings);
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
        const valueEl = navItem.querySelector('.preference-value');
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
    Component.initSeekbar(sizeItem, Config.getWidthLimitSize(), applyValue);

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
        get: Theme.get,
        set: Theme.set,
    });
}

function initFontFamilyPage(item) {
    Library.applyFontFamily(Config.getFontFamily());

    initPage(item, {
        title: '書体',
        options: {
            'sans-serif': { label: 'ゴシック' },
            'serif': { label: '明朝' },
        },
        defaultKey: 'sans-serif',
        get: Config.getFontFamily,
        set: (key) => {
            Config.setFontFamily(key);
            Library.applyFontFamily(key);
        },
    });
}
