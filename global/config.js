import { Storage } from '/lib/storage.js';

export const Config = {
    getDev,
    setDev,
    getToc,
    setToc,
    getSupplProvision,
    setSupplProvision,
    getParenHighlight,
    setParenHighlight,
    getWordHighlight,
    setWordHighlight,
    getParenStyleMap,
    setParenStyleMap,
    getWordStyleMap,
    setWordStyleMap,
    getWordList,
    setWordList,
    getFontFamily,
    setFontFamily,
    getFontSize,
    setFontSize,
    getLineHeight,
    setLineHeight,
    getLetterSpacing,
    setLetterSpacing,
    getWidthLimit,
    setWidthLimit,
    getWidthLimitSize,
    setWidthLimitSize,
    clear,
};

const prefix = 'config-';

const defaults = {
    'toc': false,
    'suppl-provision': false,
    'paren-highlight': false,
    'word-highlight': false,
    'paren-style': {},
    'word-style': {},
    'word-list': [
        { value: '及び', exclusionList: [], isDefault: true },
        { value: '並びに', exclusionList: [], isDefault: true },
        { value: '又は', exclusionList: [], isDefault: true },
        { value: '若しくは', exclusionList: [], isDefault: true },
    ],
    'font-family': 'sans-serif',
    'font-size': 16,
    'line-height': 1.8,
    'letter-spacing': 0,
    'width-limit': true,
    'width-limit-size': 800,
};

function getDev() {
    return Storage.get('dev', false) === true;
}

function setDev(value) {
    Storage.set('dev', value);
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

function getLetterSpacing() {
    return read('letter-spacing');
}

function setLetterSpacing(value) {
    write('letter-spacing', value);
}

function getWidthLimit() {
    return read('width-limit');
}

function setWidthLimit(value) {
    write('width-limit', value);
}

function getWidthLimitSize() {
    return read('width-limit-size');
}

function setWidthLimitSize(value) {
    write('width-limit-size', value);
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
