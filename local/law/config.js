export const Config = {
    init,
    show,
};

import { Page } from '/lib/page.js?v=20260101';
import { Shell } from '/lib/shell.js?v=20260101';
import { Storage } from '/lib/storage.js?v=20260101';

import { Theme } from '/global/theme.js?v=20260101';

import { Component } from './config/component.js?v=20260101';
import { Library } from './config/library.js?v=20260101';

let pageManager;
let centerModal;
let centerModalContent;
let bottomModal;
let bottomModalContent;
let current;
let configContent;
let lawContent;
let isOpen = false;

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

    const configItemParen = Component.createCheckboxItem('括弧を強調表示');
    fragment.appendChild(configItemParen);
    fragment.appendChild(Component.createDivider());

    const configItemParenNav = Component.createNavigationItem('括弧の強調表示の詳細設定');
    fragment.appendChild(configItemParenNav);
    fragment.appendChild(Component.createDivider());

    const configItemConj = Component.createCheckboxItem('接続詞を強調表示');
    fragment.appendChild(configItemConj);
    fragment.appendChild(Component.createDivider());

    const configItemConjNav = Component.createNavigationItem('接続詞の強調表示の詳細設定');
    fragment.appendChild(configItemConjNav);
    fragment.appendChild(Component.createDivider());

    const configItemTitle = Component.createCheckboxItem('編・章・節・款・目を強調表示');
    fragment.appendChild(configItemTitle);
    fragment.appendChild(Component.createDivider());

    const configItemTitleNav = Component.createNavigationItem('編・章・節・款・目の強調表示の詳細設定');
    fragment.appendChild(configItemTitleNav);
    fragment.appendChild(Component.createDivider());

    fragment.appendChild(Component.createCategory('機能'));
    fragment.appendChild(Component.createDivider());

    const configItemWidthLimit = Component.createCheckboxItem('横幅制限');
    fragment.appendChild(configItemWidthLimit);
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

    configContent = document.createElement('div');
    configContent.classList.add('config-content');

    centerModalContent = document.createElement('div');

    centerModal = Shell.createModal(centerModalContent);
    centerModal.setWidth('min(90vw, 640px)');
    centerModal.setHeight('min(64vh, 640px)');
    centerModal.enableCloseButton(hide);

    bottomModalContent = document.createElement('div');

    bottomModal = Shell.createModal(bottomModalContent);
    bottomModal.setPlacement('bottom');
    bottomModal.setHeight('50%');
    bottomModal.enableCloseButton(hide);

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

    initToggleWithNav(configItemParen, configItemParenNav, 'paren-highlight', false, showParenAll, hideParenAll);
    initParenDetailPage(configItemParenNav);

    const showConjAll = () => {
        Library.showConjColor();
        Library.showConditionColor();
    };

    const hideConjAll = () => {
        Library.hideConjColor();
        Library.hideConditionColor();
    };

    initToggleWithNav(configItemConj, configItemConjNav, 'conj-highlight', false, showConjAll, hideConjAll);
    initConjDetailPage(configItemConjNav);

    initToggleWithNav(configItemTitle, configItemTitleNav, 'title-highlight', false, Library.showTitleColor, Library.hideTitleColor);
    initTitleDetailPage(configItemTitleNav);

    Component.toggleCheckboxItem(configItemWidthLimit, 'width-limit', true, Library.enableWidthLimit, Library.disableWidthLimit);
    configItemWidthLimit.addEventListener('click', () => {
        Component.toggleCheckboxItem(configItemWidthLimit, 'width-limit', true, Library.enableWidthLimit, Library.disableWidthLimit);
        api.restoreScroll();
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
}

function closePage() {
    pageManager.close();
    updateNav();
}

function initToggleWithNav(checkbox, nav, storageKey, defaultValue, showFn, hideFn) {
    const updateNavVisibility = () => {
        const isOn = checkbox.getAttribute('data-value') === 'enable';
        nav.style.display = isOn ? '' : 'none';
        nav.nextElementSibling.style.display = isOn ? '' : 'none';
    };

    Component.toggleCheckboxItem(checkbox, storageKey, defaultValue, showFn, hideFn);
    updateNavVisibility();

    checkbox.addEventListener('click', () => {
        Component.toggleCheckboxItem(checkbox, storageKey, defaultValue, showFn, hideFn);
        updateNavVisibility();
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
const refreshConjColor = createRefresher('style-conj-color', Library.hideConjColor, Library.showConjColor);
const refreshConditionColor = createRefresher('style-condition-color', Library.hideConditionColor, Library.showConditionColor);
const refreshTitleColor = createRefresher('style-title-color', Library.hideTitleColor, Library.showTitleColor);

function openPage() {
    const page = document.createElement('div');

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

        const raw = Storage.get(storageKey, null);
        const currentKey = (raw && options[raw]) ? raw : defaultKey;
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
                valueEl.textContent = options[k].label;

                if (k === defaultKey) {
                    Storage.remove(storageKey);
                } else {
                    Storage.set(storageKey, k);
                }
            });

            items[k] = option;
            page.appendChild(option);
            page.appendChild(Component.createDivider());
        }
    });
}

function initRadioSelectPage(navItem, title, storageKey, defaultKey, onChanged, options) {
    const page = openPage();

    page.appendChild(Component.createCategory(title));
    page.appendChild(Component.createDivider());

    const valueEl = navItem.querySelector('.config-value');
    const raw = Storage.get(storageKey, null);
    const currentKey = (raw && options[raw]) ? raw : defaultKey;
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
            valueEl.textContent = options[k].label;

            if (k === defaultKey) {
                Storage.remove(storageKey);
            } else {
                Storage.set(storageKey, k);
            }

            onChanged();
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

function appendColorNavItems(page, levels) {
    for (const level of levels) {
        const navItem = Component.createNavigationItem(level.title);
        const valueEl = navItem.querySelector('.config-value');

        const stored = Storage.get(level.storageKey, null);
        const currentKey = (stored && COLOR_OPTIONS[stored]) ? stored : level.defaultKey;
        valueEl.textContent = COLOR_OPTIONS[currentKey].label;

        navItem.addEventListener('click', () => {
            initRadioSelectPage(navItem, level.title, level.storageKey, level.defaultKey, level.onChanged, COLOR_OPTIONS);
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

function initParenDetailPage(item) {
    item.addEventListener('click', () => {
        const page = openPage();

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
    });
}

const CONJ_COLOR_LEVELS = [
    { title: '選択的接続詞の色', storageKey: 'conj-color-s', defaultKey: 'deepskyblue', onChanged: refreshConjColor },
    { title: '併合的接続詞の色', storageKey: 'conj-color-h', defaultKey: 'deepskyblue', onChanged: refreshConjColor },
    { title: '条件を表す接続助詞の色', storageKey: 'conj-color-c', defaultKey: 'deeppink', onChanged: refreshConditionColor },
];

function initConjDetailPage(item) {
    item.addEventListener('click', () => {
        const page = openPage();

        page.appendChild(Component.createCategory('接続詞の強調表示'));
        page.appendChild(Component.createDivider());

        appendColorNavItems(page, CONJ_COLOR_LEVELS);
    });
}

const TITLE_COLOR_LEVELS = [
    { title: '編の色', storageKey: 'title-color-part', defaultKey: 'deeppink', onChanged: refreshTitleColor },
    { title: '章の色', storageKey: 'title-color-chapter', defaultKey: 'deepskyblue', onChanged: refreshTitleColor },
    { title: '節の色', storageKey: 'title-color-section', defaultKey: 'mediumorchid', onChanged: refreshTitleColor },
    { title: '款の色', storageKey: 'title-color-subsection', defaultKey: 'mediumseagreen', onChanged: refreshTitleColor },
    { title: '目の色', storageKey: 'title-color-division', defaultKey: 'coral', onChanged: refreshTitleColor },
];

function initTitleDetailPage(item) {
    item.addEventListener('click', () => {
        const page = openPage();

        page.appendChild(Component.createCategory('編・章・節・款・目の強調表示'));
        page.appendChild(Component.createDivider());

        appendColorNavItems(page, TITLE_COLOR_LEVELS);
    });
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
