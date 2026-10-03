export const Library = {
    showTOC,
    hideTOC,
    showSupplProvision,
    hideSupplProvision,
    showParenColor,
    hideParenColor,
    showParenBackground,
    hideParenBackground,
    showParenFontSize,
    hideParenFontSize,
    getWords,
    isDefaultWord,
    showWordColor,
    hideWordColor,
    getStructures,
    showStructureStyle,
    hideStructureStyle,
    disableWidthLimit,
    enableWidthLimit,
    setFontFamily,
};

import { Storage } from '/lib/storage.js';

function showTOC() {
    const style = document.getElementById('style-toc');
    if (style) style.remove();
}

function hideTOC() {
    if (document.getElementById('style-toc')) return;
    const style = document.createElement('style');
    style.id = 'style-toc';
    style.textContent = '.LawBody > .TOC { display: none; }';
    document.head.appendChild(style);
}

function showSupplProvision() {
    const style = document.getElementById('style-suppl-provision');
    if (style) style.remove();
}

function hideSupplProvision() {
    if (document.getElementById('style-suppl-provision')) return;
    const style = document.createElement('style');
    style.id = 'style-suppl-provision';
    style.textContent = '.LawBody > .SupplProvision { display: none; }';
    document.head.appendChild(style);
}

const PAREN_COLOR_DEFAULTS = [
    'mediumorchid',
    'mediumseagreen',
    'coral',
    'gray',
    'gray',
];

function getParenColor(level) {
    return Storage.get('paren-color-' + level, PAREN_COLOR_DEFAULTS[level - 1]);
}

function showParenColor() {
    if (document.getElementById('style-paren-color')) return;

    const c1 = getParenColor(1);
    const c2 = getParenColor(2);
    const c3 = getParenColor(3);
    const c4 = getParenColor(4);
    const c5 = getParenColor(5);

    const style = document.createElement('style');
    style.id = 'style-paren-color';
    style.textContent = '.Sentence .tag-paren { color: ' + c5 + '; }';
    style.textContent += '.Sentence .tag-paren[data-depth="1"] { color: ' + c1 + '; }';
    style.textContent += '.Sentence .tag-paren[data-depth="2"] { color: ' + c2 + '; }';
    style.textContent += '.Sentence .tag-paren[data-depth="3"] { color: ' + c3 + '; }';
    style.textContent += '.Sentence .tag-paren[data-depth="4"] { color: ' + c4 + '; }';
    style.textContent += '.Sentence .tag-paren[data-depth="5"] { color: ' + c5 + '; }';
    document.head.appendChild(style);
}

function hideParenColor() {
    const style = document.getElementById('style-paren-color');
    if (style) style.remove();
}

function getParenBackground() {
    const key = Storage.get('paren-background', 'color');
    if (key === 'color') {
        return 'rgba(128, 128, 128, 0.2)';
    }
    if (key === 'amikake') {
        let str;
        str = 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(128,128,128,0.2) 1px, rgba(128,128,128,0.2) 2px), ';
        str += 'repeating-linear-gradient(-45deg, transparent, transparent 1px, rgba(128,128,128,0.2) 1px, rgba(128,128,128,0.2) 2px)';
        return str;
    }
    if (key === 'none') {
        return 'none';
    }
    return 'rgba(128, 128, 128, 0.2)';
}

function showParenBackground() {
    if (document.getElementById('style-paren-background')) return;

    const background = getParenBackground();

    const style = document.createElement('style');
    style.id = 'style-paren-background';
    style.textContent = '.Sentence .tag-paren { background: ' + background + '; }';
    document.head.appendChild(style);
}

function hideParenBackground() {
    const style = document.getElementById('style-paren-background');
    if (style) style.remove();
}

function getParenFontSize() {
    return Storage.get('paren-font-size', '1.00');
}

function showParenFontSize() {
    if (document.getElementById('style-paren-font-size')) return;

    const size = getParenFontSize();

    const style = document.createElement('style');
    style.id = 'style-paren-font-size';
    style.textContent = '.Sentence .tag-paren { font-size: ' + size + 'em; }';
    document.head.appendChild(style);
}

function hideParenFontSize() {
    const style = document.getElementById('style-paren-font-size');
    if (style) style.remove();
}

const DEFAULT_WORDS = [
    { word: '又は', color: 'deepskyblue', enabled: false },
    { word: '若しくは', color: 'deepskyblue', enabled: false },
    { word: '及び', color: 'deepskyblue', enabled: false },
    { word: '並びに', color: 'deepskyblue', enabled: false },
    { word: 'とき', color: 'deeppink', enabled: false },
    { word: '場合', color: 'deeppink', enabled: false },
];

function getWords() {
    const stored = Storage.get('highlight-words', null);
    const words = Array.isArray(stored) ? stored : [];

    const defaults = DEFAULT_WORDS.map((entry) => {
        return words.find(word => word.word === entry.word) || Object.assign({}, entry);
    });
    const others = words.filter(word => !isDefaultWord(word.word));

    return defaults.concat(others);
}

function isDefaultWord(word) {
    return DEFAULT_WORDS.some(entry => entry.word === word);
}

function showWordColor() {
    if (document.getElementById('style-word-color')) return;

    const style = document.createElement('style');
    style.id = 'style-word-color';
    style.textContent = getWords().map((entry, index) => {
        if (entry.enabled === false) {
            return '';
        }
        return '.Sentence .tag-word-' + index + ' { color: ' + entry.color + '; }';
    }).join('');
    document.head.appendChild(style);
}

function hideWordColor() {
    const style = document.getElementById('style-word-color');
    if (style) style.remove();
}

const STRUCTURES = [
    { key: 'part', label: '編', group: '編・章・節・款・目', selector: '.PartTitle', color: 'deeppink' },
    { key: 'chapter', label: '章', group: '編・章・節・款・目', selector: '.ChapterTitle', color: 'deepskyblue' },
    { key: 'section', label: '節', group: '編・章・節・款・目', selector: '.SectionTitle', color: 'mediumorchid' },
    { key: 'subsection', label: '款', group: '編・章・節・款・目', selector: '.SubsectionTitle', color: 'mediumseagreen' },
    { key: 'division', label: '目', group: '編・章・節・款・目', selector: '.DivisionTitle', color: 'coral' },
    { key: 'caption', label: '条見出し', group: '条・項・号', selector: '.ArticleCaption, .ParagraphCaption', color: 'gray' },
    { key: 'article', label: '条番号', group: '条・項・号', selector: '.ArticleTitle', color: 'deepskyblue' },
    { key: 'paragraph', label: '項番号', group: '条・項・号', selector: '.ParagraphNum', color: 'mediumseagreen' },
    { key: 'item', label: '号番号', group: '条・項・号', selector: '.ItemTitle', color: 'coral' },
    { key: 'subitem', label: '号の細分の番号', group: '条・項・号', selector: '.Subitem1Title, .Subitem2Title, .Subitem3Title, .Subitem4Title, .Subitem5Title', color: 'goldenrod' },
    { key: 'suppl-provision', label: '附則', group: 'その他', selector: '.SupplProvisionLabel', color: 'deeppink' },
];

function getStructures() {
    const stored = Storage.get('highlight-structures', null);
    const settings = (stored && typeof stored === 'object') ? stored : {};

    return STRUCTURES.map((structure) => {
        return Object.assign({ enabled: false, bold: true, italic: false, underline: false, emphasis: false }, structure, settings[structure.key]);
    });
}

function showStructureStyle() {
    if (document.getElementById('style-structure')) return;

    const style = document.createElement('style');
    style.id = 'style-structure';
    style.textContent = getStructures().map((structure) => {
        if (!structure.enabled) {
            return '';
        }
        let rule = 'color: ' + structure.color + ';';
        rule += ' font-weight: ' + (structure.bold ? 'bold' : 'normal') + ';';
        rule += ' font-style: ' + (structure.italic ? 'italic' : 'normal') + ';';
        rule += ' text-decoration: ' + (structure.underline ? 'underline' : 'none') + ';';
        rule += ' text-emphasis: ' + (structure.emphasis ? 'filled sesame' : 'none') + ';';
        rule += ' -webkit-text-emphasis: ' + (structure.emphasis ? 'filled sesame' : 'none') + ';';
        return structure.selector + ' { ' + rule + ' }';
    }).join('');
    document.head.appendChild(style);
}

function hideStructureStyle() {
    const style = document.getElementById('style-structure');
    if (style) style.remove();
}

function getWidthLimitSize() {
    const size = Storage.get('width-limit-size', 800);
    return typeof size === 'number' ? size : 800;
}

function setWidthLimit(value) {
    let style = document.getElementById('style-width-limit');
    if (!style) {
        style = document.createElement('style');
        style.id = 'style-width-limit';
        document.head.appendChild(style);
    }
    style.textContent = ':root { --width-limit: ' + value + '; }';
}

function disableWidthLimit() {
    setWidthLimit('9999px');
}

function enableWidthLimit(size) {
    setWidthLimit((typeof size === 'number' ? size : getWidthLimitSize()) + 'px');
}

function setFontFamily(key) {
    let style = document.getElementById('style-font-family');

    if (key === 'sans-serif') {
        if (style) style.remove();
        return;
    }

    if (!style) {
        style = document.createElement('style');
        style.id = 'style-font-family';
        document.head.appendChild(style);
    }

    style.textContent = 'body { font-family: ' + key + '; }';
}
