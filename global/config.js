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

    getHighlightParen: buildReader('highlight-paren'),
    setHighlightParen: buildWriter('highlight-paren'),
    getHighlightParenColor: (level) => read(highlightParenColorKey(level)),
    setHighlightParenColor: (level, value) => write(highlightParenColorKey(level), value),
    getHighlightParenBackground: buildReader('highlight-paren-background'),
    setHighlightParenBackground: buildWriter('highlight-paren-background'),
    getHighlightParenFontSize: buildReader('highlight-paren-font-size'),
    setHighlightParenFontSize: buildWriter('highlight-paren-font-size'),

    getHighlightWords: buildReader('highlight-words'),
    setHighlightWords: buildWriter('highlight-words'),
    getHighlightStructures: buildReader('highlight-structures'),
    setHighlightStructures: buildWriter('highlight-structures'),

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

    'highlight-paren': false,
    'highlight-paren-color-1': 'mediumorchid',
    'highlight-paren-color-2': 'mediumseagreen',
    'highlight-paren-color-3': 'coral',
    'highlight-paren-color-4': 'gray',
    'highlight-paren-color-5': 'gray',
    'highlight-paren-background': 'color',
    'highlight-paren-font-size': '1.00',

    'highlight-words': [],
    'highlight-structures': {},
};

const listeners = [];

function buildReader(key) {
    return () => read(key);
}

function buildWriter(key) {
    return (value) => write(key, value);
}

function highlightParenColorKey(level) {
    return 'highlight-paren-color-' + level;
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
