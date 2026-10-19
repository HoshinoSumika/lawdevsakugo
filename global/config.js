export const Config = {
    getDev,
    setDev,
    getBookmarkList,
    setBookmarkList,
    getRecentList,
    setRecentList,
    getShortcutBookmark,
    setShortcutBookmark,
    getShortcutRecent,
    setShortcutRecent,
    getShortcutMajor,
    setShortcutMajor,
    getOutline,
    setOutline,
    getToc,
    setToc,
    getSupplProvision,
    setSupplProvision,
    getParenHighlight,
    setParenHighlight,
    getWordHighlight,
    setWordHighlight,
    getParenSize,
    setParenSize,
    getParenBackground,
    setParenBackground,
    getVerticalAlign,
    setVerticalAlign,
    getVerticalAlignOffset,
    setVerticalAlignOffset,
    getParenStyleMap,
    setParenStyleMap,
    getWordStyleMap,
    setWordStyleMap,
    getHeadingStyleMap,
    setHeadingStyleMap,
    getWordList,
    setWordList,
    getFontFamily,
    setFontFamily,
    getFontSize,
    setFontSize,
    getLineHeight,
    setLineHeight,
    getParagraphSpacing,
    setParagraphSpacing,
    getLetterSpacing,
    setLetterSpacing,
    getContentWidth,
    setContentWidth,
    getArticlePlacement,
    setArticlePlacement,
    getSingleParagraphNum,
    setSingleParagraphNum,
    getCompareReplaceRatio,
    setCompareReplaceRatio,
    getCompareColorMap,
    setCompareColorMap,
    clear,
};

import { Storage } from '/lib/storage.js';

const prefix = 'config-';

const defaults = {
    'shortcut-bookmark': true,
    'shortcut-recent': true,
    'shortcut-major': true,
    'outline': true,
    'toc': false,
    'suppl-provision': false,
    'paren-highlight': false,
    'word-highlight': false,
    'paren-size': 1,
    'paren-background': 'default',
    'vertical-align': 'middle',
    'vertical-align-offset': 0.25,
    'paren-style': {},
    'word-style': {},
    'heading-style': {},
    'word-list': [
        { value: '及び', exclusionList: [], isDefault: true },
        { value: '並びに', exclusionList: [], isDefault: true },
        { value: '又は', exclusionList: [], isDefault: true },
        { value: '若しくは', exclusionList: [], isDefault: true },
    ],
    'font-family': 'sans-serif',
    'font-size': 16,
    'line-height': 1.8,
    'paragraph-spacing': 'standard',
    'letter-spacing': 0,
    'content-width': 800,
    'article-placement': 'default',
    'single-paragraph-num': 'shown',
    'compare-replace-ratio': 0.8,
    'compare-color': {},
};

function getDev() {
    return Storage.get('dev', false) === true;
}

function setDev(value) {
    Storage.set('dev', value);
}

function getBookmarkList() {
    return Storage.get('bookmark-list', []);
}

function setBookmarkList(value) {
    Storage.set('bookmark-list', value);
}

function getRecentList() {
    return Storage.get('recent-list', []);
}

function setRecentList(value) {
    Storage.set('recent-list', value);
}

function getShortcutBookmark() {
    return read('shortcut-bookmark');
}

function setShortcutBookmark(value) {
    write('shortcut-bookmark', value);
}

function getShortcutRecent() {
    return read('shortcut-recent');
}

function setShortcutRecent(value) {
    write('shortcut-recent', value);
}

function getShortcutMajor() {
    return read('shortcut-major');
}

function setShortcutMajor(value) {
    write('shortcut-major', value);
}

function getOutline() {
    return read('outline');
}

function setOutline(value) {
    write('outline', value);
}

function getToc() {
    return read('toc');
}

function setToc(value) {
    write('toc', value);
}

function getSupplProvision() {
    return read('suppl-provision');
}

function setSupplProvision(value) {
    write('suppl-provision', value);
}

function getParenHighlight() {
    return read('paren-highlight');
}

function setParenHighlight(value) {
    write('paren-highlight', value);
}

function getWordHighlight() {
    return read('word-highlight');
}

function setWordHighlight(value) {
    write('word-highlight', value);
}

function getParenSize() {
    return read('paren-size');
}

function setParenSize(value) {
    write('paren-size', value);
}

function getParenBackground() {
    return read('paren-background');
}

function setParenBackground(value) {
    write('paren-background', value);
}

function getVerticalAlign() {
    return read('vertical-align');
}

function setVerticalAlign(value) {
    write('vertical-align', value);
}

function getVerticalAlignOffset() {
    return read('vertical-align-offset');
}

function setVerticalAlignOffset(value) {
    write('vertical-align-offset', value);
}

function getParenStyleMap() {
    return read('paren-style');
}

function setParenStyleMap(value) {
    write('paren-style', value);
}

function getWordStyleMap() {
    return read('word-style');
}

function setWordStyleMap(value) {
    write('word-style', value);
}

function getHeadingStyleMap() {
    return read('heading-style');
}

function setHeadingStyleMap(value) {
    write('heading-style', value);
}

function getWordList() {
    return read('word-list');
}

function setWordList(value) {
    write('word-list', value);
}

function getFontFamily() {
    return read('font-family');
}

function setFontFamily(value) {
    write('font-family', value);
}

function getFontSize() {
    return read('font-size');
}

function setFontSize(value) {
    write('font-size', value);
}

function getLineHeight() {
    return read('line-height');
}

function setLineHeight(value) {
    write('line-height', value);
}

function getParagraphSpacing() {
    return read('paragraph-spacing');
}

function setParagraphSpacing(value) {
    write('paragraph-spacing', value);
}

function getLetterSpacing() {
    return read('letter-spacing');
}

function setLetterSpacing(value) {
    write('letter-spacing', value);
}

function getContentWidth() {
    return read('content-width');
}

function setContentWidth(value) {
    write('content-width', value);
}

function getArticlePlacement() {
    return read('article-placement');
}

function setArticlePlacement(value) {
    write('article-placement', value);
}

function getSingleParagraphNum() {
    return read('single-paragraph-num');
}

function setSingleParagraphNum(value) {
    write('single-paragraph-num', value);
}

function getCompareReplaceRatio() {
    return read('compare-replace-ratio');
}

function setCompareReplaceRatio(value) {
    write('compare-replace-ratio', value);
}

function getCompareColorMap() {
    return read('compare-color');
}

function setCompareColorMap(value) {
    write('compare-color', value);
}

function clear() {
    Object.keys(defaults).forEach(key => {
        Storage.remove(prefix + key);
    });
}

function read(key) {
    return Storage.get(prefix + key, defaults[key]);
}

function write(key, value) {
    Storage.set(prefix + key, value);
}
