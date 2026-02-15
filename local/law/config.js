export const Config = {
    init,
    register,
    show,
};

import { Control } from '/global/control.js?v=20260213';
import { Interface } from '/global/interface.js?v=20260213';
import { Theme } from '/global/theme.js?v=20260213';

import {
    createCategory, createDivider,
    createLabelItem, createNavigationItem,
    createCheckboxItem, toggleCheckboxItem,
    createSeekbarItem, initSeekbar,
    createRadioItem,
} from './component.js?v=20260213';
import {
    showTOC, hideTOC,
    showSupplProvision, hideSupplProvision,
    showParenColor, hideParenColor,
    showParenBackground, hideParenBackground,
    showParenFontSize, hideParenFontSize,
    showConjColor, hideConjColor,
    showConditionColor, hideConditionColor,
    showTitleColor, hideTitleColor,
    disableWidthLimit, enableWidthLimit,
    setFontFamily,
} from './library.js?v=20260213';
import { Mokuji } from './mokuji.js?v=20260213';

let controlView;
let interfaceView;
let lawContent;

function init(el) {
    lawContent = el;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(createCategory('内容'));
    fragment.appendChild(createDivider());

    const configItemTOC = createCheckboxItem('本文中の目次を表示');
    fragment.appendChild(configItemTOC);
    fragment.appendChild(createDivider());

    const configItemSupplProvision = createCheckboxItem('附則を表示');
    fragment.appendChild(configItemSupplProvision);
    fragment.appendChild(createDivider());

    fragment.appendChild(createCategory('強調表示'));
    fragment.appendChild(createDivider());

    const configItemParen = createCheckboxItem('括弧を強調表示');
    fragment.appendChild(configItemParen);
    fragment.appendChild(createDivider());

    const configItemParenNav = createNavigationItem('括弧の強調表示の詳細設定');
    fragment.appendChild(configItemParenNav);
    fragment.appendChild(createDivider());

    const configItemConj = createCheckboxItem('接続詞を強調表示');
    fragment.appendChild(configItemConj);
    fragment.appendChild(createDivider());

    const configItemConjNav = createNavigationItem('接続詞の強調表示の詳細設定');
    fragment.appendChild(configItemConjNav);
    fragment.appendChild(createDivider());

    const configItemTitle = createCheckboxItem('編・章・節・款・目を強調表示');
    fragment.appendChild(configItemTitle);
    fragment.appendChild(createDivider());

    const configItemTitleNav = createNavigationItem('編・章・節・款・目の強調表示の詳細設定');
    fragment.appendChild(configItemTitleNav);
    fragment.appendChild(createDivider());

    fragment.appendChild(createCategory('機能'));
    fragment.appendChild(createDivider());

    const configItemWidthLimit = createCheckboxItem('横幅制限');
    fragment.appendChild(configItemWidthLimit);
    fragment.appendChild(createDivider());

    fragment.appendChild(createCategory('外観'));
    fragment.appendChild(createDivider());

    const configItemTheme = createNavigationItem('テーマ');
    fragment.appendChild(configItemTheme);
    fragment.appendChild(createDivider());

    const configItemFontFamily = createNavigationItem('書体');
    fragment.appendChild(configItemFontFamily);
    fragment.appendChild(createDivider());

    const configItemFontSize = createSeekbarItem('文字サイズ', '14', '18', '0.5');
    fragment.appendChild(configItemFontSize);
    fragment.appendChild(createDivider());

    const configItemLineHeight = createSeekbarItem('行間', '1.6', '2.0', '0.05');
    fragment.appendChild(configItemLineHeight);
    fragment.appendChild(createDivider());

    const configItemLetterSpacing = createSeekbarItem('字間', '0.00', '0.20', '0.01');
    fragment.appendChild(configItemLetterSpacing);
    fragment.appendChild(createDivider());

    const configContent = document.createElement('div');

    const page = document.createElement('div');
    page.appendChild(fragment);

    controlView = Control.createInstance(configContent);
    controlView.open(page);

    interfaceView = Interface.createModal(configContent);
    interfaceView.enableTitleBar();
    interfaceView.enableExpandButton();
    interfaceView.setTitle('設定');
    interfaceView.getOverlay().classList.add('law-overlay');
    interfaceView.getOverlay().classList.add('config-overlay');
    interfaceView.getContainer().classList.add('law-container');
    interfaceView.getContainer().classList.add('config-container');
    interfaceView.getContent().classList.add('config-content');

    interfaceView.onShow(() => {
        requestAnimationFrame(() => {
            interfaceView.getContainer().classList.add('show');
        });
    });
    interfaceView.onHide(() => {
        interfaceView.getContainer().classList.remove('show');
    });

    toggleCheckboxItem(configItemTOC, 'toc', false, showTOC, hideTOC);
    configItemTOC.addEventListener('click', () => {
        toggleCheckboxItem(configItemTOC, 'toc', false, showTOC, hideTOC);
        Mokuji.update();
    });

    toggleCheckboxItem(configItemSupplProvision, 'suppl-provision', false, showSupplProvision, hideSupplProvision);
    configItemSupplProvision.addEventListener('click', () => {
        toggleCheckboxItem(configItemSupplProvision, 'suppl-provision', false, showSupplProvision, hideSupplProvision);
        Mokuji.update();
    });

    const showParenAll = () => {
        showParenColor();
        showParenBackground();
        showParenFontSize();
    };

    const hideParenAll = () => {
        hideParenColor();
        hideParenBackground();
        hideParenFontSize();
    };

    initToggleWithNav(configItemParen, configItemParenNav, 'paren-highlight', false, showParenAll, hideParenAll);
    initParenDetailPage(configItemParenNav);

    const showConjAll = () => {
        showConjColor();
        showConditionColor();
    };

    const hideConjAll = () => {
        hideConjColor();
        hideConditionColor();
    };

    initToggleWithNav(configItemConj, configItemConjNav, 'conj-highlight', false, showConjAll, hideConjAll);
    initConjDetailPage(configItemConjNav);

    initToggleWithNav(configItemTitle, configItemTitleNav, 'title-highlight', false, showTitleColor, hideTitleColor);
    initTitleDetailPage(configItemTitleNav);

    toggleCheckboxItem(configItemWidthLimit, 'width-limit', true, enableWidthLimit, disableWidthLimit);
    configItemWidthLimit.addEventListener('click', () => {
        toggleCheckboxItem(configItemWidthLimit, 'width-limit', true, enableWidthLimit, disableWidthLimit);
        restoreScrollPosition();
    });

    initThemePage(configItemTheme);

    initFontFamilyPage(configItemFontFamily);

    initSeekbar(configItemFontSize, 'font-size', 16, (value) => {
        lawContent.style.fontSize = value + 'px';
    });

    initSeekbar(configItemLineHeight, 'line-height', 1.8, (value) => {
        lawContent.style.lineHeight = value + '';
    });

    initSeekbar(configItemLetterSpacing, 'letter-spacing', 0, (value) => {
        lawContent.style.letterSpacing = value + 'em';
    });
}

let restoreScrollPosition = () => {};

function register(name, func) {
    if (name === 'restoreScrollPosition') {
        restoreScrollPosition = func;
    }
}

function show() {
    interfaceView.show();
}

function initToggleWithNav(checkbox, nav, storageKey, defaultValue, showFn, hideFn) {
    const updateNavVisibility = () => {
        const isOn = checkbox.getAttribute('data-value') === 'enable';
        nav.style.display = isOn ? '' : 'none';
        nav.nextElementSibling.style.display = isOn ? '' : 'none';
    };

    toggleCheckboxItem(checkbox, storageKey, defaultValue, showFn, hideFn);
    updateNavVisibility();

    checkbox.addEventListener('click', () => {
        toggleCheckboxItem(checkbox, storageKey, defaultValue, showFn, hideFn);
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

const refreshParenColor = createRefresher('style-paren-color', hideParenColor, showParenColor);
const refreshParenBackground = createRefresher('style-paren-background', hideParenBackground, showParenBackground);
const refreshParenFontSize = createRefresher('style-paren-font-size', hideParenFontSize, showParenFontSize);
const refreshConjColor = createRefresher('style-conj-color', hideConjColor, showConjColor);
const refreshConditionColor = createRefresher('style-condition-color', hideConditionColor, showConditionColor);
const refreshTitleColor = createRefresher('style-title-color', hideTitleColor, showTitleColor);

function openPage() {
    const page = document.createElement('div');

    interfaceView.enableBackButton();
    interfaceView.setTitle('');

    interfaceView.onBack(() => {
        controlView.back();
        if (controlView.isRoot()) {
            interfaceView.disableBackButton();
            interfaceView.setTitle('設定');
        }
    });

    controlView.open(page);

    return page;
}

function initPage(item, { title, options, defaultKey, storageKey, onSelect }) {
    const valueEl = item.querySelector('.config-value');
    const stored = localStorage.getItem(storageKey);
    const key = (stored && options[stored]) ? stored : defaultKey;

    onSelect(key);
    valueEl.textContent = options[key].label;

    item.addEventListener('click', () => {
        const page = openPage();

        page.appendChild(createCategory(title));
        page.appendChild(createDivider());

        const raw = localStorage.getItem(storageKey);
        const currentKey = (raw && options[raw]) ? raw : defaultKey;
        const items = {};

        for (const k of Object.keys(options)) {
            const option = createRadioItem(options[k].label);
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
                    localStorage.removeItem(storageKey);
                } else {
                    localStorage.setItem(storageKey, k);
                }
            });

            items[k] = option;
            page.appendChild(option);
            page.appendChild(createDivider());
        }
    });
}

function initRadioSelectPage(navItem, title, storageKey, defaultKey, onChanged, options) {
    const page = openPage();

    page.appendChild(createCategory(title));
    page.appendChild(createDivider());

    const valueEl = navItem.querySelector('.config-value');
    const raw = localStorage.getItem(storageKey);
    const currentKey = (raw && options[raw]) ? raw : defaultKey;
    const items = {};

    for (const k of Object.keys(options)) {
        const option = createRadioItem(options[k].label);
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
                localStorage.removeItem(storageKey);
            } else {
                localStorage.setItem(storageKey, k);
            }

            onChanged();
        });

        items[k] = option;
        page.appendChild(option);
        page.appendChild(createDivider());
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
        const navItem = createNavigationItem(level.title);
        const valueEl = navItem.querySelector('.config-value');

        const stored = localStorage.getItem(level.storageKey);
        const currentKey = (stored && COLOR_OPTIONS[stored]) ? stored : level.defaultKey;
        valueEl.textContent = COLOR_OPTIONS[currentKey].label;

        navItem.addEventListener('click', () => {
            initRadioSelectPage(navItem, level.title, level.storageKey, level.defaultKey, level.onChanged, COLOR_OPTIONS);
        });

        page.appendChild(navItem);
        page.appendChild(createDivider());
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

        page.appendChild(createCategory('括弧階層'));
        page.appendChild(createDivider());

        appendColorNavItems(page, PAREN_COLOR_LEVELS);

        page.appendChild(createCategory('括弧全体'));
        page.appendChild(createDivider());

        const bgNavItem = createNavigationItem('背景');
        const bgValueEl = bgNavItem.querySelector('.config-value');

        const bgStored = localStorage.getItem('paren-background');
        const bgCurrentKey = (bgStored && PAREN_BACKGROUND_OPTIONS[bgStored]) ? bgStored : 'color';
        bgValueEl.textContent = PAREN_BACKGROUND_OPTIONS[bgCurrentKey].label;

        bgNavItem.addEventListener('click', () => {
            initRadioSelectPage(bgNavItem, '背景', 'paren-background', 'color', refreshParenBackground, PAREN_BACKGROUND_OPTIONS);
        });

        page.appendChild(bgNavItem);
        page.appendChild(createDivider());

        const fsNavItem = createNavigationItem('文字サイズ');
        const fsValueEl = fsNavItem.querySelector('.config-value');

        const fsStored = localStorage.getItem('paren-font-size');
        const fsCurrentKey = (fsStored && PAREN_FONT_SIZE_OPTIONS[fsStored]) ? fsStored : '1.00';
        fsValueEl.textContent = PAREN_FONT_SIZE_OPTIONS[fsCurrentKey].label;

        fsNavItem.addEventListener('click', () => {
            initRadioSelectPage(fsNavItem, '文字サイズ', 'paren-font-size', '1.00', refreshParenFontSize, PAREN_FONT_SIZE_OPTIONS);
        });

        page.appendChild(fsNavItem);
        page.appendChild(createDivider());
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

        page.appendChild(createCategory('接続詞の強調表示'));
        page.appendChild(createDivider());

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

        page.appendChild(createCategory('編・章・節・款・目の強調表示'));
        page.appendChild(createDivider());

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
        onSelect: setFontFamily,
    });
}
