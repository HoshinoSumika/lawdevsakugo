import { Storage } from '/lib/storage.js';

export const Config = {
    getDev: () => Storage.get('dev', false) === true,
    setDev: (value) => Storage.set('dev', value),

    getTheme: buildReader('theme'),
    setTheme: buildWriter('theme'),
    getFontFamily: buildReader('font-family'),
    setFontFamily: buildWriter('font-family'),
    getFontSize: buildReader('font-size'),
    setFontSize: buildWriter('font-size'),
    getLineHeight: buildReader('line-height'),
    setLineHeight: buildWriter('line-height'),
    getLetterSpacing: buildReader('letter-spacing'),
    setLetterSpacing: buildWriter('letter-spacing'),
    getWidthLimit: buildReader('width-limit'),
    setWidthLimit: buildWriter('width-limit'),
    getWidthLimitSize: buildReader('width-limit-size'),
    setWidthLimitSize: buildWriter('width-limit-size'),

    getTOC: buildReader('toc'),
    setTOC: buildWriter('toc'),
    getSupplProvision: buildReader('suppl-provision'),
    setSupplProvision: buildWriter('suppl-provision'),

    getParenHighlight: buildReader('paren-highlight'),
    setParenHighlight: buildWriter('paren-highlight'),
    getParenColor: (level) => read(parenColorKey(level)),
    setParenColor: (level, value) => write(parenColorKey(level), value),
    getParenBackground: buildReader('paren-background'),
    setParenBackground: buildWriter('paren-background'),
    getParenFontSize: buildReader('paren-font-size'),
    setParenFontSize: buildWriter('paren-font-size'),

    getWordHighlight: buildReader('word-highlight'),
    setWordHighlight: buildWriter('word-highlight'),
    getStructureHighlight: buildReader('structure-highlight'),
    setStructureHighlight: buildWriter('structure-highlight'),

    subscribe,
};

const prefix = 'config-';

const defaults = {
    'theme': 'system',
    'font-family': 'sans-serif',
    'font-size': 16,
    'line-height': 1.8,
    'letter-spacing': 0,
    'width-limit': true,
    'width-limit-size': 800,

    'toc': false,
    'suppl-provision': false,

    'paren-highlight': false,
    'paren-color-1': 'mediumorchid',
    'paren-color-2': 'mediumseagreen',
    'paren-color-3': 'coral',
    'paren-color-4': 'gray',
    'paren-color-5': 'gray',
    'paren-background': 'color',
    'paren-font-size': '1.00',

    'word-highlight': [],
    'structure-highlight': {},
};

const listeners = [];

function buildReader(key) {
    return () => read(key);
}

function buildWriter(key) {
    return (value) => write(key, value);
}

function parenColorKey(level) {
    return 'paren-color-' + level;
}

function read(key) {
    return Storage.get(prefix + key, defaults[key]);
}

function write(key, value) {
    const done = Storage.set(prefix + key, value);
    for (const listener of listeners) {
        listener(key, value);
    }
    return done;
}

function subscribe(listener) {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
    };
}
