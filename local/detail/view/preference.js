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
import { Util } from '/global/util.js';

const INSET_WIDTH = 'calc(100% - var(--size-offset) * 4)';
const INSET_HEIGHT = 'calc(100dvh - var(--size-offset) * 4)';
const MODAL_MAX_WIDTH = 480;
const MODAL_WIDTH = 'min(' + MODAL_MAX_WIDTH + 'px, ' + INSET_WIDTH + ')';
const SLIDE_DURATION = 200;
const SLIDE_EASING = 'ease-out';
const FADE_DURATION = 50;
const CONTENT_WIDTH_STANDARD = 800;
const CONTENT_WIDTH_WIDE = 1000;
const EXPAND_DURATION = 200;
const PARAGRAPH_SPACING_WIDE = 8;
const PAREN_PAIR = ['（', '）'];
const QUOTE_PAIR = ['「', '」'];
const PAREN_COLOR_LIST = ['#ba55d3', '#3cb371', '#ff7f50', '#808080'];
const WORD_COLOR = '#4169e1';
const WORD_DEFAULT_STYLE = { isBold: false };
const HIGHLIGHT_SIZE_MIN = 0.5;
const PAREN_SIZE_MAX = 1;
const VERTICAL_ALIGN_MIDDLE = 0.5;
const VERTICAL_ALIGN_DIRECTION_MAP = { bottom: -1, middle: 0, top: 1 };
const EM_BOX_BOTTOM = -0.15;
const WORD_SIZE_MAX = 1.5;
const HIGHLIGHT_SIZE_STEP = 0.05;
const BACKGROUND_DEFAULT = 'rgba(128, 128, 128, 0.2)';
const BACKGROUND_CUSTOM_COLOR = '#e6e6e6';
const HATCH_COLOR = 'rgba(128,128,128,0.2)';
const HATCH_BACKGROUND = 'repeating-linear-gradient(45deg, transparent 0px 1px, ' + HATCH_COLOR + ' 1px 2px), repeating-linear-gradient(-45deg, transparent 0px 1px, ' + HATCH_COLOR + ' 1px 2px)';
const HEADING_COLOR = '#4169e1';
const HEADING_SIZE_MIN = 1;
const HEADING_SIZE_MAX = 1.5;
const STRUCTURE_HEADING_LIST = [
    { key: 'part', label: Text.getPartHeading(), selector: '.content .PartTitle:not(.TOC *)', containerSelector: '.content .PartTitleContainer' },
    { key: 'chapter', label: Text.getChapterHeading(), selector: '.content .ChapterTitle:not(.TOC *)', containerSelector: '.content .ChapterTitleContainer' },
    { key: 'section', label: Text.getSectionHeading(), selector: '.content .SectionTitle:not(.TOC *)', containerSelector: '.content .SectionTitleContainer' },
    { key: 'subsection', label: Text.getSubsectionHeading(), selector: '.content .SubsectionTitle:not(.TOC *)', containerSelector: '.content .SubsectionTitleContainer' },
    { key: 'division', label: Text.getDivisionHeading(), selector: '.content .DivisionTitle:not(.TOC *)', containerSelector: '.content .DivisionTitleContainer' },
];
const ARTICLE_CAPTION_ENTRY = { key: 'article-caption', selector: '.content .ArticleCaption' };
const ARTICLE_TITLE_ENTRY = { key: 'article-title', selector: '.content .ArticleTitle' };
const COMPARE_DEFAULT_STYLE = { colorMode: 'default' };
const COMPARE_ENTRY_LIST = [
    { key: 'old', label: Text.getCompareOldColor(), type: 'deletion', color: '#ff6b6b', defaultStyle: COMPARE_DEFAULT_STYLE },
    { key: 'new', label: Text.getCompareNewColor(), type: 'addition', color: '#51cf66', defaultStyle: COMPARE_DEFAULT_STYLE },
];
const CHARACTER_PLACEMENT_PREVIEW_LIST = [
    { selector: '.preference-preview.character-placement .paren', size: 0.75 },
    { selector: '.preference-preview.character-placement .word', size: 1.5 },
];

const styleMap = {};
const style = document.createElement('style');
const refreshList = [];

let modal;
let api;
let content;
let mainPage;
let storagePage;
let typesettingPage;
let comparePage;
let parenPage;
let wordPage;
let parenEntryList;
let pageList = [];

const wordEntryPageMap = new Map();

let messagePreferenceCleared;
let messageCacheCleared;
let messageCacheClearFailed;

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
    messageCacheCleared = Message.info(Text.getCacheCleared());
    messageCacheClearFailed = Message.error(Text.getCacheClearFailed());

    parenPage = buildParenPage();
    wordPage = document.createElement('div');
    wordPage.classList.add('preference-page');
    renderWordPage();

    mainPage = document.createElement('div');
    mainPage.classList.add('preference-page');
    mainPage.appendChild(buildSwitchItem(Text.getShowToc(), Config.getToc, (value) => {
        Config.setToc(value);
        applyToc(value);
    }));
    mainPage.appendChild(buildSwitchItem(Text.getShowSupplProvision(), Config.getSupplProvision, (value) => {
        Config.setSupplProvision(value);
        applySupplProvision(value);
        api.onSupplProvisionChange();
    }));
    mainPage.appendChild(buildDivider());
    appendHighlightItem(Text.getParenHighlight(), Text.getParenHighlightPreference(), parenPage, Config.getParenHighlight, Config.setParenHighlight, applyParenHighlight);
    appendHighlightItem(Text.getWordHighlight(), Text.getWordHighlightPreference(), wordPage, Config.getWordHighlight, Config.setWordHighlight, applyWordHighlight);
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
    mainPage.appendChild(buildNavigationItem(Text.getTypesettingPreference(), () => {
        showNextPage(Text.getTypesettingPreference(), typesettingPage);
    }));
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildNavigationItem(Text.getComparePreference(), () => {
        showNextPage(Text.getComparePreference(), comparePage);
    }));
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildNavigationItem(Text.getStoragePreference(), () => {
        showNextPage(Text.getStoragePreference(), storagePage);
    }));

    typesettingPage = document.createElement('div');
    typesettingPage.classList.add('preference-page');
    typesettingPage.appendChild(buildRadioItem(Text.getContentWidth(), [
        { value: CONTENT_WIDTH_STANDARD, label: Text.getContentWidthStandard() },
        { value: CONTENT_WIDTH_WIDE, label: Text.getContentWidthWide() },
        { value: 0, label: Text.getContentWidthNone() },
    ], Config.getContentWidth, (value) => {
        Config.setContentWidth(value);
        applyContentWidth(value);
    }));
    typesettingPage.appendChild(buildDivider());
    typesettingPage.appendChild(buildSeekbarItem(Text.getLineHeight(), 1.6, 2.0, 0.05, Config.getLineHeight, formatLineHeight, (value) => {
        Config.setLineHeight(value);
        applyLineHeight(value);
    }));
    typesettingPage.appendChild(buildSeekbarItem(Text.getLetterSpacing(), 0, 0.2, 0.01, Config.getLetterSpacing, formatLetterSpacing, (value) => {
        Config.setLetterSpacing(value);
        applyLetterSpacing(value);
    }));
    typesettingPage.appendChild(buildRadioItem(Text.getParagraphSpacing(), [
        { value: 'standard', label: Text.getParagraphSpacingStandard() },
        { value: 'wide', label: Text.getParagraphSpacingWide() },
    ], Config.getParagraphSpacing, (value) => {
        Config.setParagraphSpacing(value);
        applyParagraphSpacing(value);
    }));
    typesettingPage.appendChild(buildDivider());
    appendHeadingNavigationItem(typesettingPage, Text.getCharacterPlacement(), buildCharacterPlacementPage());
    appendHeadingNavigationItem(typesettingPage, Text.getArticlePlacement(), buildArticlePlacementPage());
    typesettingPage.appendChild(buildDivider());
    appendHeadingNavigationItem(typesettingPage, Text.getArticleCaptionDisplay(), buildArticleHeadingPage(ARTICLE_CAPTION_ENTRY));
    appendHeadingNavigationItem(typesettingPage, Text.getArticleTitleDisplay(), buildArticleHeadingPage(ARTICLE_TITLE_ENTRY));
    appendHeadingNavigationItem(typesettingPage, Text.getStructureHeadingDisplay(), buildStructureHeadingPage());

    comparePage = document.createElement('div');
    comparePage.classList.add('preference-page');
    COMPARE_ENTRY_LIST.forEach(entry => {
        const { get, update } = bindEntryStyle(entry, Config.getCompareColorMap, Config.setCompareColorMap, applyCompareColor);
        appendColorChoiceItem(comparePage, entry.label, [
            { value: 'default', label: Text.getDefaultColor() },
            { value: 'custom', label: Text.getCustomColor() },
        ], 'colorMode', 'color', entry.color, get, update);
    });
    comparePage.appendChild(buildDivider());
    comparePage.appendChild(buildSeekbarItem(Text.getCompareReplaceRatio(), 0.5, 1, 0.05, Config.getCompareReplaceRatio, formatRatio, Config.setCompareReplaceRatio));

    storagePage = document.createElement('div');
    storagePage.classList.add('preference-page');
    storagePage.appendChild(buildActionItem(Text.getCacheClear(), () => {
        showConfirmPage(Text.getCacheClear(), Text.getCacheClearConfirm(), Text.getClear(), clearCache);
    }));
    storagePage.appendChild(buildActionItem(Text.getPreferenceClear(), () => {
        showConfirmPage(Text.getPreferenceClear(), Text.getPreferenceClearConfirm(), Text.getClear(), clearPreference);
    }));

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
    modal.fit(() => {
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
        modal.setHeight(INSET_HEIGHT);
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

    const isResized = modal.fit(() => {
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

    const option = { duration: SLIDE_DURATION, easing: SLIDE_EASING };
    ghost.animate([
        { transform: 'translateX(0%)' },
        { transform: 'translateX(' + shift + '%)' },
    ], option).onfinish = () => {
        ghost.remove();
    };
    ghost.animate([
        { opacity: 1 },
        { opacity: 0 },
    ], { duration: FADE_DURATION, easing: 'ease', fill: 'forwards' });
    page.animate([
        { transform: 'translateX(' + -shift + '%)' },
        { transform: 'translateX(0%)' },
    ], option);
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
    api.onArticlePlacementChange();
    api.onSupplProvisionChange();
    pageList[0].scrollTop = 0;
    showPreviousPage();
    messagePreferenceCleared.show();
}

async function clearCache() {
    try {
        await Cache.deleteAll();
        showPreviousPage();
        messageCacheCleared.show();
    } catch (e) {
        console.error(e);
        messageCacheClearFailed.show();
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
    applyCharacterPlacementPreview();
    applyHeadingStyle();
    applyCompareColor();
    applyFontFamily(Config.getFontFamily());
    applyFontSize(Config.getFontSize());
    applyLineHeight(Config.getLineHeight());
    applyParagraphSpacing(Config.getParagraphSpacing());
    applyLetterSpacing(Config.getLetterSpacing());
    applyContentWidth(Config.getContentWidth());
    applyArticlePlacement();
}

function applyToc(isShown) {
    setStyle('toc', isShown ? '' : '.content .LawBody > .TOC { display: none; }');
}

function applySupplProvision(isShown) {
    setStyle('suppl-provision', isShown ? '' : '.content .LawBody > .SupplProvision { display: none; }');
}

function applyParenHighlight() {
    if (!Config.getParenHighlight()) {
        setStyle('paren-highlight', '');
        return;
    }
    const styleMap = Config.getParenStyleMap();
    const size = Math.min(Config.getParenSize(), PAREN_SIZE_MAX);
    const ruleList = ['.content .paren { '
        + 'font-size: ' + size + 'em; '
        + 'vertical-align: ' + buildVerticalAlign(size) + '; '
        + 'background: ' + buildHighlightBackground(Config.getParenBackground()) + '; }'];
    parenEntryList.forEach(entry => {
        ruleList.push(entry.selector + ' { color: ' + buildHighlightColor(entry, readEntryStyle(styleMap, entry)) + '; }');
    });
    setStyle('paren-highlight', ruleList.join(' '));
}

function applyVerticalAlign() {
    applyParenHighlight();
    applyWordHighlight();
    applyCharacterPlacementPreview();
}

function buildVerticalAlign(size) {
    const ratio = VERTICAL_ALIGN_MIDDLE + (VERTICAL_ALIGN_DIRECTION_MAP[Config.getVerticalAlign()] || 0) * Config.getVerticalAlignOffset();
    return ((EM_BOX_BOTTOM + ratio) * (1 - size) / size).toFixed(4) + 'em';
}

function applyWordHighlight() {
    const isEnabled = Config.getWordHighlight();
    setStyle('word-highlight', isEnabled ? buildWordRule(buildWordEntryList(), Config.getWordStyleMap()) : '');
}

function buildWordRule(entryList, styleMap) {
    return entryList.map(entry => {
        const entryStyle = readEntryStyle(styleMap, entry);
        const size = Math.min(entryStyle.size, WORD_SIZE_MAX);
        return entry.selector + ' { '
            + buildFontDeclaration(entryStyle)
            + 'color: ' + buildHighlightColor(entry, entryStyle) + '; '
            + 'font-size: ' + size + 'em; '
            + 'vertical-align: ' + buildVerticalAlign(size) + '; '
            + 'background: ' + buildEntryBackground(entryStyle) + '; }';
    }).join(' ');
}

function applyCharacterPlacementPreview() {
    setStyle('character-placement-preview', CHARACTER_PLACEMENT_PREVIEW_LIST.map(entry => {
        return entry.selector + ' { '
            + 'font-size: ' + entry.size + 'em; '
            + 'vertical-align: ' + buildVerticalAlign(entry.size) + '; }';
    }).join(' '));
}

function applyHeadingStyle() {
    const styleMap = Config.getHeadingStyleMap();
    const ruleList = STRUCTURE_HEADING_LIST.map(entry => {
        const entryStyle = readEntryStyle(styleMap, entry);
        return entry.selector + ' { '
            + buildHeadingDeclaration(entryStyle)
            + 'font-size: ' + entryStyle.size + 'em; } '
            + entry.containerSelector + ' { background: ' + buildEntryBackground(entryStyle) + '; }';
    });
    [ARTICLE_CAPTION_ENTRY, ARTICLE_TITLE_ENTRY].forEach(entry => {
        ruleList.push(entry.selector + ' { ' + buildHeadingDeclaration(readEntryStyle(styleMap, entry)) + '}');
    });
    setStyle('heading-style', ruleList.join(' '));
}

function buildHeadingDeclaration(entryStyle) {
    const color = entryStyle.colorMode === 'custom' ? entryStyle.color || HEADING_COLOR : 'inherit';
    return buildFontDeclaration(entryStyle) + 'color: ' + color + '; ';
}

function buildFontDeclaration(entryStyle) {
    return 'font-family: ' + entryStyle.fontFamily + '; '
        + 'font-weight: ' + (entryStyle.isBold ? 'bold' : 'normal') + '; '
        + 'font-style: ' + (entryStyle.isItalic ? 'italic' : 'normal') + '; ';
}

function buildEntryBackground(entryStyle) {
    if (entryStyle.background === 'custom') {
        return entryStyle.backgroundColor || BACKGROUND_CUSTOM_COLOR;
    }
    return buildHighlightBackground(entryStyle.background);
}

function buildHighlightColor(entry, entryStyle) {
    if (entryStyle.colorMode === 'custom') {
        return entryStyle.color || entry.color;
    }
    return 'inherit';
}

function buildHighlightBackground(background) {
    if (background === 'default') {
        return BACKGROUND_DEFAULT;
    }
    if (background === 'hatch') {
        return HATCH_BACKGROUND;
    }
    return 'none';
}

function readEntryStyle(styleMap, entry) {
    const colorMode = entry.color ? 'custom' : 'default';
    return Object.assign({ fontFamily: 'inherit', isBold: true, isItalic: false, size: 1, colorMode, color: entry.color || '', background: 'none', backgroundColor: '' }, entry.defaultStyle, styleMap[entry.key]);
}

function applyCompareColor() {
    const colorMap = Config.getCompareColorMap();
    setStyle('compare-color', COMPARE_ENTRY_LIST.map(entry => {
        const entryStyle = readEntryStyle(colorMap, entry);
        if (entryStyle.colorMode !== 'custom') {
            return '';
        }
        const color = entryStyle.color || entry.color;
        return '.compare-result { '
            + '--compare-' + entry.type + '-color: ' + color + '; '
            + '--compare-' + entry.type + '-background: color-mix(in srgb, ' + color + ' 12%, transparent); }';
    }).join(' '));
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

function applyParagraphSpacing(value) {
    if (value !== 'wide') {
        setStyle('paragraph-spacing', '');
        return;
    }
    const lawMargin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--law-margin'));
    setStyle('paragraph-spacing', '.content { --law-margin: ' + (lawMargin + PARAGRAPH_SPACING_WIDE) + 'px; } '
        + '.content .Paragraph + .Paragraph, .content .ArticleCaption + .Paragraph, .content .ArticleHeading + .Paragraph, .content .ParagraphCaption + .Paragraph, '
        + '.content .Item, .content .Subitem1, .content .Subitem2, .content .Subitem3, .content .Subitem4, .content .Subitem5 { '
        + 'margin-top: ' + PARAGRAPH_SPACING_WIDE + 'px; }');
}

function applyLetterSpacing(value) {
    setStyle('letter-spacing', '.content { letter-spacing: ' + value + 'em; }');
}

function applyContentWidth(value) {
    setStyle('content-width', value ? '.content { max-width: ' + value + 'px; }' : '');
}

function applyArticlePlacement() {
    setStyle('article-placement', isArticleReversed() ? '.content .ArticleHeading > .ArticleCaption { display: inline; margin-left: 0em; }' : '');
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

function formatRatio(value) {
    return Math.round(value * 100) + '%';
}

function formatVerticalAlignOffset(value) {
    return value.toFixed(2);
}

function formatHighlightSize(value) {
    return value.toFixed(2) + 'em';
}

function appendHighlightItem(labelText, preferenceText, page, get, set, apply) {
    const navigationItem = buildNavigationItem(preferenceText, () => {
        showNextPage(preferenceText, page);
    });
    mainPage.appendChild(buildSwitchItem(labelText, get, (value) => {
        set(value);
        apply();
        toggleItem(navigationItem, value);
    }));
    mainPage.appendChild(navigationItem);
    showItem(navigationItem, get);
}

function showItem(item, get) {
    item.style.display = get() ? '' : 'none';
    refreshList.push(() => {
        item.style.display = get() ? '' : 'none';
    });
}

function toggleItem(item, isShown) {
    const childList = Array.from(item.children);
    const followingList = [];
    for (let next = item.nextElementSibling; next; next = next.nextElementSibling) {
        followingList.push(next);
    }
    [item].concat(childList, followingList).forEach(element => {
        element.getAnimations().forEach(animation => animation.cancel());
    });

    modal.fit(() => {
        item.style.display = isShown ? '' : 'none';
    });

    item.style.display = '';
    item.style.overflow = 'hidden';
    const hidden = { transform: 'translateY(' + -item.offsetHeight + 'px)' };
    const shown = { transform: 'translateY(0px)' };
    const keyframeList = isShown ? [hidden, shown] : [shown, hidden];
    const fadeKeyframeList = isShown ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
    const option = { duration: EXPAND_DURATION, easing: 'ease', fill: 'forwards' };
    const animationList = childList.concat(followingList).map(element => element.animate(keyframeList, option));
    animationList.push(item.animate(fadeKeyframeList, { duration: EXPAND_DURATION, easing: isShown ? 'ease-in' : 'ease-out', fill: 'forwards' }));
    animationList[0].onfinish = () => {
        item.style.overflow = '';
        item.style.display = isShown ? '' : 'none';
        animationList.forEach(animation => animation.cancel());
    };
}

function buildParenPage() {
    const page = document.createElement('div');
    page.classList.add('preference-page');
    page.appendChild(buildParenPreview());
    page.appendChild(buildCaption(Text.getParenOverallPreference()));
    page.appendChild(buildSeekbarItem(Text.getFontSize(), HIGHLIGHT_SIZE_MIN, PAREN_SIZE_MAX, HIGHLIGHT_SIZE_STEP, Config.getParenSize, formatHighlightSize, (value) => {
        Config.setParenSize(value);
        applyParenHighlight();
    }));
    page.appendChild(buildBackgroundItem(Config.getParenBackground, (value) => {
        Config.setParenBackground(value);
        applyParenHighlight();
    }));
    page.appendChild(buildDivider());
    page.appendChild(buildCaption(Text.getParenDepthPreference()));

    parenEntryList.forEach(entry => {
        const entryPage = document.createElement('div');
        entryPage.classList.add('preference-page');
        const { get, update } = bindEntryStyle(entry, Config.getParenStyleMap, Config.setParenStyleMap, applyParenHighlight);
        appendTextColorItem(entryPage, entry, get, update);
        page.appendChild(buildNavigationItem(entry.label, () => {
            showNextPage(entry.label, entryPage);
        }));
    });
    return page;
}

function buildParenPreview() {
    const paragraph = buildPreviewParagraph(Text.getParenPreviewTitle(), Text.getParenPreviewSentence());
    Util.nest(paragraph.querySelector('.Sentence'), PAREN_PAIR, QUOTE_PAIR, 'paren');

    const preview = document.createElement('div');
    preview.classList.add('preference-preview', 'content');
    preview.appendChild(paragraph);
    return preview;
}

function buildPreviewParagraph(titleText, sentenceText) {
    const title = document.createElement('span');
    title.classList.add('ArticleTitle');
    title.textContent = titleText;

    const sentence = document.createElement('span');
    sentence.classList.add('Sentence');
    sentence.textContent = sentenceText;

    const paragraph = document.createElement('div');
    paragraph.classList.add('Paragraph');
    paragraph.append(title, '　', sentence);
    return paragraph;
}

function buildCharacterPlacementPage() {
    const page = document.createElement('div');
    page.classList.add('preference-page');

    page.appendChild(buildCharacterPlacementPreview());
    page.appendChild(buildRadioItem(Text.getVerticalAlign(), [
        { value: 'top', label: Text.getVerticalAlignTop() },
        { value: 'middle', label: Text.getVerticalAlignMiddle() },
        { value: 'bottom', label: Text.getVerticalAlignBottom() },
    ], Config.getVerticalAlign, (value) => {
        Config.setVerticalAlign(value);
        applyVerticalAlign();
    }));
    page.appendChild(buildSeekbarItem(Text.getVerticalAlignOffset(), 0.25, VERTICAL_ALIGN_MIDDLE, 0.01, Config.getVerticalAlignOffset, formatVerticalAlignOffset, (value) => {
        Config.setVerticalAlignOffset(value);
        applyVerticalAlign();
    }));
    return page;
}

function buildCharacterPlacementPreview() {
    const paragraph = buildPreviewParagraph(Text.getCharacterPlacementPreviewTitle(), Text.getCharacterPlacementPreviewSentence());
    const sentence = paragraph.querySelector('.Sentence');
    Util.nest(sentence, PAREN_PAIR, QUOTE_PAIR, 'paren');
    Text.getCharacterPlacementPreviewWordList().forEach(word => {
        Util.mark(sentence, word, 'word');
    });

    const preview = document.createElement('div');
    preview.classList.add('preference-preview', 'content', 'character-placement');
    preview.appendChild(paragraph);
    return preview;
}

function buildArticlePlacementPage() {
    const page = document.createElement('div');
    page.classList.add('preference-page');

    const preview = buildArticlePlacementPreview();
    page.appendChild(preview);
    refreshList.push(() => api.arrangeArticle(preview));

    const singleParagraphNumItem = buildRadioItem(Text.getSingleParagraphNum(), [
        { value: 'shown', label: Text.getShown() },
        { value: 'hidden', label: Text.getHidden() },
    ], Config.getSingleParagraphNum, (value) => {
        Config.setSingleParagraphNum(value);
        changeArticlePlacement(preview);
    });
    page.appendChild(buildRadioItem(Text.getCaptionPlacement(), [
        { value: 'default', label: Text.getPlacementDefault() },
        { value: 'reverse', label: Text.getPlacementReverse() },
    ], Config.getArticlePlacement, (value) => {
        Config.setArticlePlacement(value);
        changeArticlePlacement(preview);
        toggleItem(singleParagraphNumItem, isArticleReversed());
    }));
    page.appendChild(singleParagraphNumItem);
    showItem(singleParagraphNumItem, isArticleReversed);
    return page;
}

function isArticleReversed() {
    return Config.getArticlePlacement() === 'reverse';
}

function changeArticlePlacement(preview) {
    applyArticlePlacement();
    api.arrangeArticle(preview);
    api.onArticlePlacementChange();
}

function buildArticlePlacementPreview() {
    const preview = document.createElement('div');
    preview.classList.add('preference-preview', 'content');
    preview.appendChild(buildPreviewArticle(Text.getArticlePlacementPreviewTitle(), [
        { numText: '', sentenceText: Text.getArticlePlacementPreviewSentence() },
        { numText: Text.getArticlePlacementPreviewParagraphNum(), sentenceText: Text.getArticlePlacementPreviewSecondSentence() },
    ]));
    preview.appendChild(buildPreviewArticle(Text.getArticlePlacementPreviewSingleTitle(), [
        { numText: '', sentenceText: Text.getArticlePlacementPreviewSingleSentence() },
    ]));
    api.arrangeArticle(preview);
    return preview;
}

function buildPreviewArticle(titleText, paragraphList) {
    const caption = document.createElement('div');
    caption.classList.add('ArticleCaption');
    caption.textContent = Text.getArticlePlacementPreviewCaption();

    const article = document.createElement('section');
    article.classList.add('Article');
    article.appendChild(caption);

    paragraphList.forEach(({ numText, sentenceText }, index) => {
        const paragraph = document.createElement('div');
        paragraph.classList.add('Paragraph');
        if (index === 0) {
            const title = document.createElement('span');
            title.classList.add('ArticleTitle');
            title.textContent = titleText;
            paragraph.append(title, '　');
        }

        const num = document.createElement('span');
        num.classList.add('ParagraphNum');
        num.textContent = numText;
        paragraph.appendChild(num);
        if (numText) {
            paragraph.append('　');
        }

        const sentence = document.createElement('span');
        sentence.classList.add('ParagraphSentence');
        sentence.textContent = sentenceText;
        paragraph.appendChild(sentence);
        article.appendChild(paragraph);
    });
    return article;
}

function buildStructureHeadingPage() {
    const page = document.createElement('div');
    page.classList.add('preference-page');
    STRUCTURE_HEADING_LIST.forEach(entry => {
        appendHeadingNavigationItem(page, entry.label, buildStructureHeadingEntryPage(entry));
    });
    return page;
}

function appendHeadingNavigationItem(page, labelText, entryPage) {
    page.appendChild(buildNavigationItem(labelText, () => {
        showNextPage(labelText, entryPage);
    }));
}

function buildStructureHeadingEntryPage(entry) {
    const page = document.createElement('div');
    page.classList.add('preference-page');

    const { get, update } = bindEntryStyle(entry, Config.getHeadingStyleMap, Config.setHeadingStyleMap, applyHeadingStyle);

    page.appendChild(buildFontFamilyItem(get, update));
    page.appendChild(buildSeekbarItem(Text.getFontSize(), HEADING_SIZE_MIN, HEADING_SIZE_MAX, HIGHLIGHT_SIZE_STEP, () => get().size, formatHighlightSize, (value) => {
        update({ size: value });
    }));
    appendDecorationItem(page, get, update);
    appendHeadingColorItem(page, get, update);
    page.appendChild(buildDivider());
    appendColorChoiceItem(page, Text.getBackgroundColor(), [
        { value: 'none', label: Text.getBackgroundNone() },
        { value: 'custom', label: Text.getCustomColor() },
    ], 'background', 'backgroundColor', BACKGROUND_CUSTOM_COLOR, get, update);
    return page;
}

function buildArticleHeadingPage(entry) {
    const page = document.createElement('div');
    page.classList.add('preference-page');

    const { get, update } = bindEntryStyle(entry, Config.getHeadingStyleMap, Config.setHeadingStyleMap, applyHeadingStyle);

    page.appendChild(buildFontFamilyItem(get, update));
    appendDecorationItem(page, get, update);
    appendHeadingColorItem(page, get, update);
    return page;
}

function appendDecorationItem(page, get, update) {
    page.appendChild(buildSwitchItem(Text.getBold(), () => get().isBold, (value) => {
        update({ isBold: value });
    }));
    page.appendChild(buildSwitchItem(Text.getItalic(), () => get().isItalic, (value) => {
        update({ isItalic: value });
    }));
}

function buildFontFamilyItem(get, update) {
    return buildRadioItem(Text.getFontFamily(), [
        { value: 'inherit', label: Text.getFontFamilyDefault() },
        { value: 'sans-serif', label: Text.getSansSerif() },
        { value: 'serif', label: Text.getSerif() },
    ], () => get().fontFamily, (value) => {
        update({ fontFamily: value });
    });
}

function appendHeadingColorItem(page, get, update) {
    appendColorChoiceItem(page, Text.getHighlightColor(), [
        { value: 'default', label: Text.getDefaultColor() },
        { value: 'custom', label: Text.getCustomColor() },
    ], 'colorMode', 'color', HEADING_COLOR, get, update);
}

function buildWordStylePage(entry) {
    const page = document.createElement('div');
    page.classList.add('preference-page');

    const { get, update } = bindEntryStyle(entry, Config.getWordStyleMap, Config.setWordStyleMap, applyWordHighlight);

    page.appendChild(buildFontFamilyItem(get, update));
    page.appendChild(buildSeekbarItem(Text.getFontSize(), HIGHLIGHT_SIZE_MIN, WORD_SIZE_MAX, HIGHLIGHT_SIZE_STEP, () => get().size, formatHighlightSize, (value) => {
        update({ size: value });
    }));
    appendDecorationItem(page, get, update);
    appendTextColorItem(page, entry, get, update);
    page.appendChild(buildDivider());
    appendColorChoiceItem(page, Text.getBackgroundColor(), [
        { value: 'none', label: Text.getBackgroundNone() },
        { value: 'custom', label: Text.getCustomColor() },
    ], 'background', 'backgroundColor', BACKGROUND_CUSTOM_COLOR, get, update);
    return page;
}

function bindEntryStyle(entry, getMap, setMap, apply) {
    const get = () => readEntryStyle(getMap(), entry);
    const update = (change) => {
        const styleMap = Object.assign({}, getMap());
        styleMap[entry.key] = Object.assign(get(), change);
        setMap(styleMap);
        apply();
    };
    return { get, update };
}

function appendTextColorItem(page, entry, get, update) {
    appendColorChoiceItem(page, Text.getHighlightColor(), [
        { value: 'default', label: Text.getDefaultColor() },
        { value: 'custom', label: Text.getCustomColor() },
    ], 'colorMode', 'color', entry.color, get, update);
}

function appendColorChoiceItem(page, labelText, optionList, modeKey, colorKey, defaultColor, get, update) {
    const customColorItem = buildColorPickerItem(Text.getHighlightCustomColor(), () => get()[colorKey] || defaultColor, (value) => {
        update({ [colorKey]: value });
    });
    page.appendChild(buildRadioItem(labelText, optionList, () => get()[modeKey], (value) => {
        const isCustom = get()[modeKey] === 'custom';
        update(value === 'custom' ? { [modeKey]: value, [colorKey]: get()[colorKey] || defaultColor } : { [modeKey]: value });
        if (isCustom !== (value === 'custom')) {
            toggleItem(customColorItem, value === 'custom');
        }
    }));
    page.appendChild(customColorItem);
    showItem(customColorItem, () => get()[modeKey] === 'custom');
}

function buildBackgroundItem(get, onChange) {
    return buildRadioItem(Text.getHighlightBackground(), [
        { value: 'none', label: Text.getBackgroundNone() },
        { value: 'default', label: Text.getBackgroundDefault() },
        { value: 'hatch', label: Text.getBackgroundHatch() },
    ], get, onChange);
}

function buildWordEntryList() {
    return Config.getWordList().map((word, index) => ({
        key: word.value,
        selector: '.content .word-' + index,
        color: WORD_COLOR,
        defaultStyle: WORD_DEFAULT_STYLE,
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
    const wordList = Config.getWordList();
    const customWordList = wordList.filter(word => !word.isDefault);
    wordPage.replaceChildren();
    appendWordItem(wordList.filter(word => word.isDefault));
    if (customWordList.length > 0) {
        wordPage.appendChild(buildDivider());
        appendWordItem(customWordList);
    }
    wordPage.appendChild(buildDivider());
    wordPage.appendChild(buildNavigationItem(Text.getWordAdd(), () => {
        showInputPage(Text.getWordAdd(), addWord);
    }));
}

function appendWordItem(wordList) {
    wordList.forEach(word => {
        wordPage.appendChild(buildNavigationItem(word.value, () => {
            showWordEntryPage(word.value);
        }));
    });
}

function showWordEntryPage(value) {
    if (!wordEntryPageMap.has(value)) {
        wordEntryPageMap.set(value, buildWordEntryPage(value));
    }
    showNextPage(value, wordEntryPageMap.get(value));
}

function buildWordEntryPage(value) {
    const page = buildWordStylePage({ key: value, color: WORD_COLOR, defaultStyle: WORD_DEFAULT_STYLE });
    if (findWord(value).isDefault) {
        return page;
    }

    const exclusionSection = document.createElement('div');
    const renderExclusion = () => {
        exclusionSection.replaceChildren(buildCaption(Text.getExclusion()));
        findWord(value).exclusionList.forEach(exclusion => {
            exclusionSection.appendChild(buildRemovableItem(exclusion, () => {
                updateWord(value, { exclusionList: findWord(value).exclusionList.filter(item => item !== exclusion) });
                modal.fit(renderExclusion);
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
    page.appendChild(buildDivider());
    page.appendChild(buildActionItem(Text.getWordRemove(), () => {
        removeWord(value);
        showPreviousPage();
    }));
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

function buildColorPickerItem(labelText, get, onChange) {
    const picker = Component.createColorPicker(get(), onChange);
    refreshList.push(() => picker.setValue(get()));

    const item = document.createElement('div');
    item.classList.add('preference-item');
    item.appendChild(buildLabel(labelText));
    item.appendChild(picker.getElement());
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
    item.classList.add('preference-item', 'choice');
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
