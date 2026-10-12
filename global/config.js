import { Storage } from '/lib/storage.js';

export const Config = {
    getDev,
    setDev,
    getToc,
    setToc,
    getSupplProvision,
    setSupplProvision,
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
