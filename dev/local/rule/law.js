export const Law = {
    create,
};

import { Diff } from '/global/diff.js';

const NUMERAL = '〇一二三四五六七八九十百千';
const DIGIT = '〇一二三四五六七八九';
const IROHA = 'イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス';
const UNIT_MAP = { 十: 10, 百: 100, 千: 1000 };
const ERA_MAP = {
    明治: { code: 1, name: 'Meiji', base: 1867 },
    大正: { code: 2, name: 'Taisho', base: 1911 },
    昭和: { code: 3, name: 'Showa', base: 1925 },
    平成: { code: 4, name: 'Heisei', base: 1988 },
    令和: { code: 5, name: 'Reiwa', base: 2018 },
};
const STRUCTURE_MAP = {
    編: { tag: 'Part', level: 1 },
    章: { tag: 'Chapter', level: 2 },
    節: { tag: 'Section', level: 3 },
    款: { tag: 'Subsection', level: 4 },
    目: { tag: 'Division', level: 5 },
};
const STRUCTURE_TAG_LIST = ['Part', 'Chapter', 'Section', 'Subsection', 'Division'];
const TERMINAL_LIST = ['。', '）', '」'];
const LEVEL_LIST = ['error', 'warn', 'info'];
const LAW_ID_PATTERN = /^\d{3}SC\d{10}$/;
const NUMBER = '[0-9０-９' + NUMERAL + '○元]+';
const JUMP_RATIO = 3;
const TABLE_GAP = 3;
const TITLE_LINE_LIMIT = 3;
const COLUMN_TOLERANCE = 3;
const FULL_RATIO = 0.6;
const CELL_SPACE_RATIO = 0.8;
const GUTTER_WIDTH = 3;
const GUTTER_RATIO = 0.05;

const HEADING_PATTERN = new RegExp('^第([' + NUMERAL + ']+)(編|章|節|款|目)((?:の[' + NUMERAL + ']+)*) +(.+)$');
const ARTICLE_PATTERN = new RegExp('^第([' + NUMERAL + ']+)条((?:の[' + NUMERAL + ']+)*)(?:(から|及び)第([' + NUMERAL + ']+)条((?:の[' + NUMERAL + ']+)*)(?:まで)?)?(?: +(.*))?$');
const PARAGRAPH_PATTERN = /^([０-９]+) +(.*)$/;
const ITEM_PATTERN = new RegExp('^([' + NUMERAL + ']+) +(.*)$');
const SUBITEM1_PATTERN = new RegExp('^([' + IROHA + '](?= )|（[' + IROHA + ']）) *(.*)$');
const SUBITEM2_PATTERN = /^（([0-9０-９]+)） *(.*)$/;
const SUB_NUM_PATTERN = new RegExp('の([' + NUMERAL + ']+)', 'g');
const SUPPL_PATTERN = /^附 *則(?:[（〔](.+?)[）〕])? *(抄)?$/;
const EXCERPT_PATTERN = /^〔(.+)〕$/;
const NOTE_PATTERN = /^（.*＝[^（）]*）$/;
const TABLE_ROW_PATTERN = new RegExp('^第[' + NUMERAL + ']+条');
const KINSOKU_PATTERN = /^(.[、。，）」』]|[（「『])/;
const CELL_MARK_PATTERN = new RegExp('^([' + IROHA + '](?![ァ-ヶー])|（[' + NUMERAL + '0-9０-９]+）)');
const APPDX_START_PATTERN = /^(附則)?別表(第[一二三四五六七八九十]+)?(（[^（）]+関係）|$)/;
const APPDX_PATTERN = /^(附則)?別表(第[一二三四五六七八九十]+)?(（[^（）]+関係）)?$/;
const AMEND_NOTE_PATTERN = /（(?:明治|大正|昭和|平成|令和|[明大昭平令])[元〇一二三四五六七八九十]+最裁規[^（）]*）$/;
const AMEND_NOTE_ALL_PATTERN = new RegExp(AMEND_NOTE_PATTERN.source.slice(0, -1), 'g');
const CAPTION_PATTERN = /^（[^（）]*(（[^（）]*）[^（）]*)*）$/;
const PAGE_NUMBER_PATTERN = /^[-－\s]*\d+[-－\s]*$/;
const READABLE_PATTERN = /[!-~‐-‧　-ヿ一-鿿＀-￯]/g;
const TITLE_PATTERN = new RegExp('^(.+?)（(明治|大正|昭和|平成|令和)(' + NUMBER + ')年(' + NUMBER + ')月(' + NUMBER + ')日(.+?)第(' + NUMBER + ')号）$');
const LAW_NUM_PATTERN = new RegExp('^(明治|大正|昭和|平成|令和)(' + NUMBER + ')年(' + NUMBER + ')月(' + NUMBER + ')日(.+?)第(' + NUMBER + ')号$');
const AMEND_ENTRY_PATTERN = new RegExp('(明治|大正|昭和|平成|令和|同)(' + NUMBER + ')年(' + NUMBER + ')月(' + NUMBER + ')日(?:最高裁判所規則|同)第?(' + NUMBER + ')号', 'g');
const REVISION_LABEL_PATTERN = /^改正[ 　]/;
const ENACT_PATTERN = /を次のように定める。$/;
const VERTICAL_PATTERN = /[（(]原文は縦書き[）)]$/;
const AMEND_PATTERN = new RegExp('^(明治|大正|昭和|平成|令和)([' + NUMERAL + '元]+)年([' + NUMERAL + ']+)月([' + NUMERAL + ']+)日最高裁判所規則第([' + NUMERAL + ']+)号$');

const STRONG_LIST = [
    { kind: 'heading', pattern: HEADING_PATTERN },
    { kind: 'article', pattern: ARTICLE_PATTERN },
    { kind: 'paragraph', pattern: PARAGRAPH_PATTERN },
    { kind: 'item', pattern: ITEM_PATTERN },
    { kind: 'subitem1', pattern: SUBITEM1_PATTERN },
    { kind: 'subitem2', pattern: SUBITEM2_PATTERN },
];

const CHECK_MAP = {
    '設定の不足': { level: 'error', description: '保存する XML と JSON に入る値が足りない。' },
    '題名を読めない': { level: 'error', description: '1行目が「題名（元号年月日最高裁判所規則第○号）」の形でなく、2行目も法令番号の形でないため、法令番号と公布日を作れない。' },
    '文字を正しく取り出せない': { level: 'error', description: 'PDF の文字が日本語として読めない（文字化け・画像だけの PDF）。この PDF からは変換できない。' },
    '条番号の飛び（本則）': { level: 'error', description: '条が抜けているか、行のつなぎ方を誤っている。detail で条が欠ける。' },
    '項番号の飛び': { level: 'error', description: '項が前の項や号につながっている。detail で項の番号がずれる。' },
    '号番号の飛び': { level: 'error', description: '号が前の号につながっている。detail で号が欠ける。' },
    'どの種類にも当たらない行': { level: 'error', description: '見出し・条・項・号のどれとしても読めず、XML に入っていない。' },
    '括弧の対応が取れない行': { level: 'error', description: 'PDF の誤りか、行のつなぎ方の誤り。detail の括弧の色分けがずれる。「」の中は数えない。' },
    '見出しのあとに条や項が来ない': { level: 'error', description: '条の見出しとして読んだ行が、どの条にも付いていない。' },
    '置き場所のない表': { level: 'error', description: '表の前に項がなく、XML に入っていない。' },
    'PDF にだけある文字': { level: 'warn', description: 'XML に入らなかった文字。落とした編集注や、二段組みの号・表の並べ替えなら問題ない。' },
    'XML にだけある文字': { level: 'warn', description: 'PDF にない文字。二段組みの号・表の並べ替えなら問題ない。' },
    '文字の突き合わせができない': { level: 'warn', description: 'PDF と XML の違いが多すぎて比べられない。' },
    '目次の照合（本文から作った目次と PDF の目次が違う）': { level: 'warn', description: '目次は本文の見出しから作る。PDF の目次の誤りなら問題ない。' },
    '抄録の附則の番号の飛び': { level: 'warn', description: '「抄」の附則は一部の項や号だけを載せるので、番号が飛ぶ。PDF のとおりの番号で置いた。' },
    '附則の改正規則番号の重複': { level: 'warn', description: '同じ改正規則の附則が2つある。PDF のとおりに残している。' },
    '落とした編集注': { level: 'warn', description: '「（施行の日＝…）」や「（平二四最裁規九・一部改正）」のような編集上の注で、本文に入れていない。' },
    '二段に組まれた号を Column に分けた': { level: 'warn', description: '左右二段に組まれた号を、段ごとにつなぎ直した。' },
    '表として組んだ部分': { level: 'warn', description: '字下げされ、大きなすき間で列が分かれた行から始まる部分を表（TableStruct）にした。傍線は取り込めない。' },
    '番号のない項': { level: 'warn', description: '条の中で字下げして始まる番号のない段落を、次の項（ParagraphNum は空）にした。古い規則の書き方。' },
    '号に足した続きの文': { level: 'warn', description: '号より深く字下げされた番号のない段落を、その号の文として足した。' },
    '項に足した続きの文': { level: 'warn', description: '番号のない段落を、前の項の文として足した。' },
    '改正規則の本則の抄録（附則として置いた）': { level: 'warn', description: '〔〕で始まる改正規則の本則の抜粋を、附則と同じ並びに置いた。' },
    'PDF の画像（取り込んでいない）': { level: 'warn', description: '様式や図は取り込まない。' },
    'ページ番号らしい行': { level: 'warn', description: '本文から外した。' },
    '題名のまわりの行': { level: 'info', description: '法令番号・改正の一覧・制定文として読んだ行。改正の一覧は「今の版の改正規則」の選択肢に入れ、制定文は EnactStatement にした。' },
    '号の本文を Column に分けた': { level: 'info', description: '号の本文を空白で左右の欄に分けた。' },
    '別表の後ろの文（Remarks にした）': { level: 'warn', description: '別表の表のあとに続く文を、別表の備考（Remarks）として置いた。' },
    '件数': { level: 'info', description: '' },
};

let reportMap;

function create(source, setting) {
    reportMap = new Map();
    const lineList = prepareLineList(source);
    source.imagePageList.forEach(page => {
        note('PDF の画像（取り込んでいない）', page + ' ページ');
    });
    if (!checkCharacter(lineList)) {
        return buildResult(setting.lawId, '', null, []);
    }

    const header = parseHeader(lineList);
    if (!header) {
        note('題名を読めない', lineList.slice(0, 2).map(line => line.text.trim()).join(' ／ '));
        return buildResult(setting.lawId, '', null, []);
    }
    const blockList = segment(lineList.slice(header.index), source.charWidth);

    const titleInfo = header.titleInfo;
    const lawId = setting.lawId || titleInfo.lawId;
    checkSetting(lawId, setting);

    const xmlDocument = document.implementation.createDocument(null, 'law_data_response', null);
    const state = buildLaw(xmlDocument, blockList, header, setting);
    const response = buildResponse(xmlDocument, state.law, lawId, titleInfo, setting);
    return buildResult(lawId, titleInfo.title, response, Array.from(new Set(header.amendList.concat(state.amendList))));
}

function buildResult(lawId, lawTitle, response, amendLawNumList) {
    const reportList = Array.from(reportMap, ([title, itemList]) => ({
        title,
        itemList,
        level: CHECK_MAP[title].level,
        description: CHECK_MAP[title].description,
    }));
    reportList.sort((a, b) => LEVEL_LIST.indexOf(a.level) - LEVEL_LIST.indexOf(b.level));
    return {
        lawId,
        lawTitle,
        xml: response ? response.xml : null,
        json: response ? response.json : null,
        amendLawNumList,
        reportList,
    };
}

function note(title, text) {
    if (!reportMap.has(title)) {
        reportMap.set(title, []);
    }
    reportMap.get(title).push(text);
}

function prepareLineList(source) {
    const countMap = new Map();
    source.lineList.forEach(line => {
        const key = Math.round(line.x0 * 10) / 10;
        countMap.set(key, (countMap.get(key) || 0) + 1);
    });
    let left = 0;
    let leftCount = 0;
    countMap.forEach((count, key) => {
        if (count > leftCount) {
            left = key;
            leftCount = count;
        }
    });

    const charWidth = source.charWidth;
    const lineList = [];
    source.lineList.forEach(origin => {
        if (PAGE_NUMBER_PATTERN.test(origin.text)) {
            note('ページ番号らしい行', origin.text);
            return;
        }
        lineList.push(Object.assign({}, origin, { text: normalize(origin.text), origin: origin.text }));
    });

    const right = findMode(lineList.filter(line => Math.abs(line.x0 - left) < 1).map(line => line.x1));
    lineList.forEach(line => {
        line.full = line.x1 >= right - charWidth * 2;
        const kind = findStrongKind(line.text.trim());
        line.tableHead = line.x0 > left + 3
            && ((kind === null && line.runList.some(run => run.space >= TABLE_GAP)) || (TABLE_ROW_PATTERN.test(line.text.trim()) && line.runList.length > 1));
    });
    return lineList;
}

function stripAmendNote(text) {
    const rest = removeAmendNote(text);
    if (rest !== text.trim()) {
        note('落とした編集注', text.slice(text.indexOf(rest) + rest.length).trim());
    }
    return rest;
}

function removeAmendNote(text) {
    let rest = text;
    let match = rest.match(AMEND_NOTE_PATTERN);
    while (match) {
        rest = rest.slice(0, match.index);
        match = rest.match(AMEND_NOTE_PATTERN);
    }
    return rest.trim();
}

function findMode(xList) {
    const countMap = new Map();
    xList.forEach(x => {
        const key = Math.round(x);
        countMap.set(key, (countMap.get(key) || 0) + 1);
    });
    let mode = 0;
    let modeCount = 0;
    countMap.forEach((count, key) => {
        if (count > modeCount) {
            mode = key;
            modeCount = count;
        }
    });
    return mode;
}

function checkCharacter(lineList) {
    const text = lineList.map(line => line.text).join('').replace(/\s/g, '');
    if (!text) {
        note('文字を正しく取り出せない', 'PDF に文字がない（画像だけの PDF かもしれない）');
        return false;
    }
    const ratio = (text.match(READABLE_PATTERN) || []).length / text.length;
    if (ratio < 0.95) {
        note('文字を正しく取り出せない', '日本語として読める文字が ' + Math.round(ratio * 100) + '% しかない');
        return false;
    }
    return true;
}

function checkSetting(lawId, setting) {
    if (!LAW_ID_PATTERN.test(lawId)) {
        note('設定の不足', '法令 ID が「408SC0000000005」の形でない（service.js が data/rule/ から読まない）');
    }
    if (!setting.titleKana) {
        note('設定の不足', 'よみが空');
    }
    if (!setting.amendLawNum) {
        note('設定の不足', '今の版の改正規則を選んでいない');
    } else if (!parseAmendLawNum(setting.amendLawNum)) {
        note('設定の不足', '今の版の改正規則が「令和六年九月一七日最高裁判所規則第一四号」の形でない');
    }
    if (!setting.enforcementDate) {
        note('設定の不足', '今の版の施行日が空');
    }
}

function findStrongKind(text) {
    const strong = STRONG_LIST.find(entry => entry.pattern.test(text));
    if (strong) {
        return strong.kind;
    }
    if (/^附 *則($|[ （〔抄]|別表)/.test(text) || EXCERPT_PATTERN.test(text) || REVISION_LABEL_PATTERN.test(text) || text === '目次') {
        return 'label';
    }
    return null;
}

function segment(lineList, charWidth) {
    const blockList = [];
    let prev = null;
    lineList.forEach(line => {
        const stripped = line.text.trim();
        const last = blockList[blockList.length - 1];
        if (prev && /\S {2,}\S/.test(prev.text) && line.x0 > prev.x0 + charWidth * JUMP_RATIO) {
            last.lineList.push(line);
            return;
        }
        if (last && last.kind === 'table' && isTableLine(last, line)) {
            last.lineList.push(line);
            return;
        }
        if (line.tableHead || (last && last.kind === 'text' && APPDX_PATTERN.test(removeAmendNote(joinText(last.lineList))))) {
            blockList.push({ kind: 'table', lineList: [line], charWidth });
            prev = null;
            return;
        }
        const prevText = prev ? prev.text.trim() : '';
        const terminal = TERMINAL_LIST.some(mark => prevText.endsWith(mark));
        let start = !prev
            || findStrongKind(stripped) !== null
            || findStrongKind(prevText) === 'label'
            || (Math.abs(line.x0 - prev.x0) > charWidth * JUMP_RATIO && (!prev.full || terminal))
            || (!prev.full && isClosedHeading(joinText(last.lineList)));
        if (!start) {
            const weak = stripped.startsWith('（');
            start = (!prev.full && terminal) || (weak && (!prev.full || terminal));
        }
        if (start) {
            blockList.push({ kind: 'text', lineList: [line], charWidth });
        } else {
            last.lineList.push(line);
        }
        prev = line;
    });

    blockList.forEach(block => {
        if (block.kind !== 'text') {
            return;
        }
        block.text = stripAmendNote(joinText(block.lineList));
        let bare = block.text;
        while (/「[^「」]*」/.test(bare)) {
            bare = bare.replace(/「[^「」]*」/g, '');
        }
        if (bare.split('（').length !== bare.split('）').length) {
            note('括弧の対応が取れない行', block.text.slice(0, 60));
        }
    });
    return blockList;
}

function joinText(lineList) {
    return lineList.map(line => line.text.trim()).join('');
}

function isTableLine(block, line) {
    const text = line.text.trim();
    if (SUPPL_PATTERN.test(text) || APPDX_START_PATTERN.test(text) || line.x0 < block.lineList[0].x0 - 2) {
        return false;
    }
    return line.x0 > block.lineList[0].x0 + block.charWidth * JUMP_RATIO
        || block.lineList.some(item => item.runList.some(run => Math.abs(run.x0 - line.x0) < COLUMN_TOLERANCE));
}

function isClosedHeading(text) {
    return HEADING_PATTERN.test(text) && text.split('（').length === text.split('）').length;
}

function parseHeader(lineList) {
    let titleInfo = null;
    let title = '';
    let index = 0;
    while (!titleInfo && index < Math.min(lineList.length, TITLE_LINE_LIMIT)) {
        title += lineList[index].text.trim();
        index = index + 1;
        titleInfo = parseTitle(title);
        const next = index < lineList.length ? lineList[index].text.trim() : '';
        if (!titleInfo && LAW_NUM_PATTERN.test(next)) {
            titleInfo = parseTitle(title.replace(VERTICAL_PATTERN, '') + '（' + next + '）');
            index = index + 1;
            note('題名のまわりの行', '法令番号: ' + next);
        }
    }
    if (!titleInfo) {
        return null;
    }

    const amendList = [];
    let era = findEra(titleInfo.lawNum);
    let enact = null;
    while (index < lineList.length) {
        const text = lineList[index].text.trim();
        if (REVISION_LABEL_PATTERN.test(text) || (amendList.length > 0 && isAmendLine(text))) {
            Array.from(text.matchAll(AMEND_ENTRY_PATTERN)).forEach(match => {
                era = match[1] === '同' ? era : match[1];
                amendList.push(buildAmendLawNum(match, era));
            });
            note('題名のまわりの行', '改正の一覧: ' + text);
        } else if (ENACT_PATTERN.test(text)) {
            enact = { kind: 'text', text, lineList: [lineList[index]] };
            note('題名のまわりの行', '制定文: ' + text);
        } else if (text === titleInfo.title) {
            note('題名のまわりの行', '題名の繰り返し（外した）: ' + text);
        } else {
            break;
        }
        index = index + 1;
    }
    return { titleInfo, index, enact, amendList };
}

function isAmendLine(text) {
    return text !== '' && text.replace(AMEND_ENTRY_PATTERN, '').trim() === '';
}

function findEra(lawNum) {
    return Object.keys(ERA_MAP).find(name => lawNum.startsWith(name));
}

function buildAmendLawNum(match, era) {
    const year = match[2] === '元' ? '元' : toPositionalKan(parseNumber(match[2]));
    return era + year + '年' + toPositionalKan(parseNumber(match[3])) + '月' + toPositionalKan(parseNumber(match[4])) + '日最高裁判所規則第' + toPositionalKan(parseNumber(match[5])) + '号';
}

function parseNumber(text) {
    if (/^[0-9０-９]+$/.test(text)) {
        return parseInt(toHalfWidth(text), 10);
    }
    return kan(text.replace(/○/g, '〇'));
}

function toPositionalKan(num) {
    return String(num).split('').map(digit => DIGIT[parseInt(digit, 10)]).join('');
}

function parseTitle(text) {
    const match = text.match(TITLE_PATTERN);
    if (!match) {
        return null;
    }
    const era = ERA_MAP[match[2]];
    const year = parseNumber(match[3]);
    const month = parseNumber(match[4]);
    const day = parseNumber(match[5]);
    const num = parseNumber(match[7]);
    return {
        title: match[1].replace(VERTICAL_PATTERN, '').trim(),
        eraName: era.name,
        year,
        month,
        day,
        num,
        lawId: era.code + String(year).padStart(2, '0') + 'SC' + String(num).padStart(10, '0'),
        lawNum: match[2] + toKan(year) + '年' + match[6] + '第' + toKan(num) + '号',
        date: buildDate(era.base + year, month, day),
    };
}

function parseAmendLawNum(text) {
    const match = text.match(AMEND_PATTERN);
    if (!match) {
        return null;
    }
    const era = ERA_MAP[match[1]];
    const year = kan(match[2]);
    const num = kan(match[5]);
    return {
        lawId: era.code + String(year).padStart(2, '0') + 'SC' + String(num).padStart(10, '0'),
        lawNum: match[1] + toKan(year) + '年最高裁判所規則第' + toKan(num) + '号',
        date: buildDate(era.base + year, kan(match[3]), kan(match[4])),
    };
}

function buildDate(year, month, day) {
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function toHalfWidth(text) {
    return text.replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
}

function kan(text) {
    if (text === '元') {
        return 1;
    }
    if (!/[十百千]/.test(text)) {
        return parseInt(text.split('').map(char => DIGIT.indexOf(char)).join(''), 10);
    }
    let total = 0;
    let current = 0;
    text.split('').forEach(char => {
        if (DIGIT.includes(char)) {
            current = DIGIT.indexOf(char);
            return;
        }
        total += (current || 1) * UNIT_MAP[char];
        current = 0;
    });
    return total + current;
}

function toKan(num) {
    if (num === 0) {
        return '〇';
    }
    let text = '';
    let rest = num;
    [[1000, '千'], [100, '百'], [10, '十']].forEach(([unit, mark]) => {
        const digit = Math.floor(rest / unit);
        if (digit) {
            text += (digit === 1 ? '' : DIGIT[digit]) + mark;
        }
        rest = rest % unit;
    });
    if (rest) {
        text += DIGIT[rest];
    }
    return text;
}

function buildNum(main, sub) {
    const partList = [String(kan(main))];
    Array.from((sub || '').matchAll(SUB_NUM_PATTERN)).forEach(match => {
        partList.push(String(kan(match[1])));
    });
    return partList.join('_');
}

function buildArticleTitle(num) {
    const partList = num.split('_');
    return '第' + toKan(parseInt(partList[0], 10)) + '条' + partList.slice(1).map(part => 'の' + toKan(parseInt(part, 10))).join('');
}

function buildElement(parent, tag, attributeMap, text) {
    const element = parent.ownerDocument.createElement(tag);
    Object.keys(attributeMap || {}).forEach(key => {
        element.setAttribute(key, attributeMap[key]);
    });
    if (text) {
        element.textContent = text;
    }
    parent.appendChild(element);
    return element;
}

function findChildList(element, tag) {
    return Array.from(element.children).filter(child => child.tagName === tag);
}

function buildLaw(xmlDocument, blockList, header, setting) {
    const titleInfo = header.titleInfo;
    const tocStart = blockList.findIndex(block => block.text === '目次');
    const tocEnd = tocStart === -1 ? -1 : blockList.findIndex((block, index) => index > tocStart && /^附 *則$/.test(block.text || ''));
    const tocBlockList = tocStart === -1 ? [] : blockList.slice(tocStart + 1, tocEnd);
    const bodyList = blockList.slice(tocEnd + 1);

    const law = xmlDocument.createElement('Law');
    law.setAttribute('Era', titleInfo.eraName);
    law.setAttribute('Lang', 'ja');
    law.setAttribute('LawType', 'Rule');
    law.setAttribute('Num', String(titleInfo.num));
    law.setAttribute('PromulgateDay', String(titleInfo.day).padStart(2, '0'));
    law.setAttribute('PromulgateMonth', String(titleInfo.month).padStart(2, '0'));
    law.setAttribute('Year', String(titleInfo.year).padStart(2, '0'));
    buildElement(law, 'LawNum', null, titleInfo.lawNum);
    const lawBody = buildElement(law, 'LawBody');
    buildElement(lawBody, 'LawTitle', { Kana: setting.titleKana }, titleInfo.title);
    if (header.enact) {
        buildElement(lawBody, 'EnactStatement', null, normalize(header.enact.text));
    }
    const toc = tocStart === -1 ? null : buildElement(lawBody, 'TOC');
    const main = buildElement(lawBody, 'MainProvision');

    const state = {
        law,
        lawBody,
        stack: [{ element: main, level: 0 }],
        container: main,
        article: null,
        paragraph: null,
        item: null,
        subitem1: null,
        caption: null,
        suppl: null,
        appdx: null,
        lastArticle: 0,
        mainArticleList: [],
        supplList: [],
        amendList: [],
    };
    bodyList.forEach((block, index) => {
        buildBlock(state, block, bodyList[index + 1]);
    });
    flushCaption(state, '終わり');

    if (toc) {
        buildToc(toc, main);
        checkToc(toc, tocBlockList);
    }
    const countMap = new Map();
    state.amendList.forEach(amend => {
        countMap.set(amend, (countMap.get(amend) || 0) + 1);
    });
    countMap.forEach((count, amend) => {
        if (count > 1) {
            note('附則の改正規則番号の重複', amend + ' が ' + count + ' 回');
        }
    });
    checkText(header.enact ? [header.enact].concat(bodyList) : bodyList, lawBody);
    reportMap.set('件数', [
        '本則の条: ' + state.mainArticleList.length,
        '附則: ' + state.supplList.length,
        '項: ' + law.getElementsByTagName('Paragraph').length,
        '号: ' + law.getElementsByTagName('Item').length,
        '文: ' + law.getElementsByTagName('Sentence').length,
    ]);
    return state;
}

function resetPosition(state, container) {
    state.container = container;
    state.article = null;
    state.paragraph = null;
    state.item = null;
    state.subitem1 = null;
    state.appdx = null;
}

function buildBlock(state, block, next) {
    if (block.kind === 'table') {
        const parent = state.appdx || state.paragraph;
        if (!parent) {
            note('置き場所のない表', block.lineList[0].text.trim());
            return;
        }
        parent.appendChild(buildTable(parent.ownerDocument, block));
        return;
    }
    const text = block.text;

    let match = text.match(SUPPL_PATTERN);
    if (match) {
        flushCaption(state, '附則');
        const attributeMap = {};
        if (match[1]) {
            attributeMap.AmendLawNum = match[1];
            state.amendList.push(match[1]);
        }
        if (match[2]) {
            attributeMap.Extract = 'true';
        }
        state.suppl = buildElement(state.lawBody, 'SupplProvision', attributeMap);
        buildElement(state.suppl, 'SupplProvisionLabel', null, '附　則');
        state.supplList.push(text);
        resetPosition(state, state.suppl);
        return;
    }

    if (EXCERPT_PATTERN.test(text)) {
        flushCaption(state, '〔〕');
        state.suppl = buildElement(state.lawBody, 'SupplProvision');
        buildElement(state.suppl, 'SupplProvisionLabel', null, text);
        state.supplList.push(text);
        note('改正規則の本則の抄録（附則として置いた）', text);
        resetPosition(state, state.suppl);
        return;
    }

    if (!text) {
        return;
    }

    match = text.match(APPDX_PATTERN);
    if (match) {
        flushCaption(state, '別表');
        const tag = match[1] && state.suppl ? 'SupplProvisionAppdxTable' : 'AppdxTable';
        const appdx = buildElement(tag === 'AppdxTable' ? state.lawBody : state.suppl, tag, match[2] ? { Num: String(kan(match[2].slice(1))) } : null);
        buildElement(appdx, tag + 'Title', null, (match[1] || '') + '別表' + (match[2] || ''));
        if (match[3]) {
            buildElement(appdx, 'RelatedArticleNum', null, match[3]);
        }
        resetPosition(state, appdx);
        state.appdx = appdx;
        return;
    }

    if (state.appdx && !ARTICLE_PATTERN.test(text) && !HEADING_PATTERN.test(text)) {
        const remarks = findChildList(state.appdx, 'Remarks')[0] || buildElement(state.appdx, 'Remarks');
        buildSentence(remarks, text);
        note('別表の後ろの文（Remarks にした）', text.slice(0, 40));
        return;
    }

    if (NOTE_PATTERN.test(text)) {
        note('落とした編集注', text);
        return;
    }

    match = text.match(HEADING_PATTERN);
    if (match && !state.suppl) {
        flushCaption(state, '見出し');
        const structure = STRUCTURE_MAP[match[2]];
        while (state.stack[state.stack.length - 1].level >= structure.level) {
            state.stack.pop();
        }
        const element = buildElement(state.stack[state.stack.length - 1].element, structure.tag, { Num: buildNum(match[1], match[3]) });
        buildElement(element, structure.tag + 'Title', null, '第' + match[1] + match[2] + match[3] + '　' + match[4]);
        state.stack.push({ element, level: structure.level });
        resetPosition(state, element);
        return;
    }

    match = text.match(ARTICLE_PATTERN);
    if (match) {
        const start = buildNum(match[1], match[2]);
        let num = start;
        let title = '第' + match[1] + '条' + match[2];
        if (match[3]) {
            num = start + ':' + buildNum(match[4], match[5]);
            title += match[3] + '第' + match[4] + '条' + match[5] + (match[3] === 'から' ? 'まで' : '');
        }
        state.article = buildElement(state.container, 'Article', { Num: num });
        if (state.caption !== null) {
            buildElement(state.article, 'ArticleCaption', null, state.caption);
            state.caption = null;
        }
        buildElement(state.article, 'ArticleTitle', null, title);
        state.articleX = block.lineList[0].x0;
        state.paragraph = match[6] ? buildParagraph(state, state.article, 1, '', match[6]) : null;
        state.item = null;
        state.subitem1 = null;
        if (!state.suppl) {
            const first = parseInt(start.split('_')[0], 10);
            const last = parseInt(num.split(':').pop().split('_')[0], 10);
            if (!start.includes('_') && first !== state.lastArticle + 1) {
                note('条番号の飛び（本則）', '第' + toKan(first) + '条の前が第' + toKan(state.lastArticle) + '条');
            }
            state.lastArticle = Math.max(state.lastArticle, last);
            state.mainArticleList.push(num);
        }
        return;
    }

    match = text.match(PARAGRAPH_PATTERN);
    if (match) {
        const num = parseInt(toHalfWidth(match[1]), 10);
        const parent = state.article || state.container;
        const expected = findChildList(parent, 'Paragraph').length + 1;
        if (num !== expected) {
            note(isExtract(state) ? '抄録の附則の番号の飛び' : '項番号の飛び', describe(state) + ' の第' + expected + '項の位置に ' + match[1]);
        }
        state.paragraph = buildParagraph(state, parent, num, match[1], match[2]);
        state.item = null;
        state.subitem1 = null;
        return;
    }

    match = text.match(ITEM_PATTERN);
    if (match && state.paragraph) {
        flushCaption(state, '号');
        const num = kan(match[1]);
        const expected = findChildList(state.paragraph, 'Item').length + 1;
        if (num !== expected) {
            note(isExtract(state) ? '抄録の附則の番号の飛び' : '号番号の飛び', describe(state) + ' の第' + toKan(expected) + '号の位置に ' + match[1]);
        }
        state.item = buildElement(state.paragraph, 'Item', { Num: String(num) });
        state.itemX = block.lineList[0].x0;
        buildElement(state.item, 'ItemTitle', null, match[1]);
        buildItemSentence(buildElement(state.item, 'ItemSentence'), buildItemColumn(block, match[1]) || match[2]);
        state.subitem1 = null;
        return;
    }

    match = text.match(SUBITEM1_PATTERN);
    if (match && state.item) {
        state.subitem1 = buildElement(state.item, 'Subitem1', { Num: String(IROHA.indexOf(match[1].replace(/[（）]/g, '')) + 1) });
        buildElement(state.subitem1, 'Subitem1Title', null, match[1]);
        buildItemSentence(buildElement(state.subitem1, 'Subitem1Sentence'), match[2]);
        return;
    }

    match = text.match(SUBITEM2_PATTERN);
    if (match && state.subitem1) {
        const subitem2 = buildElement(state.subitem1, 'Subitem2', { Num: toHalfWidth(match[1]) });
        buildElement(subitem2, 'Subitem2Title', null, '（' + match[1] + '）');
        buildItemSentence(buildElement(subitem2, 'Subitem2Sentence'), match[2]);
        return;
    }

    if (CAPTION_PATTERN.test(text) || (text.endsWith('）') && next && ARTICLE_PATTERN.test(next.text || ''))) {
        flushCaption(state, '見出し');
        state.caption = text;
        return;
    }

    if (!state.article && !state.paragraph && ['MainProvision', 'SupplProvision'].includes(state.container.tagName)) {
        state.paragraph = buildParagraph(state, state.container, 1, '', text);
        return;
    }

    if (state.item && block.lineList[0].x0 > state.itemX + block.charWidth / 2) {
        note('号に足した続きの文', describe(state) + ': ' + text.slice(0, 40));
        buildSentence(findChildList(state.item, 'ItemSentence')[0], text);
        return;
    }

    if (state.article && !state.item && block.lineList[0].x0 > state.articleX + block.charWidth / 2) {
        const num = findChildList(state.article, 'Paragraph').length + 1;
        note('番号のない項', describe(state) + ' の第' + num + '項: ' + text.slice(0, 30));
        state.paragraph = buildParagraph(state, state.article, num, '', text);
        return;
    }

    if (state.paragraph) {
        note('項に足した続きの文', describe(state) + ': ' + text.slice(0, 40));
        buildSentence(findChildList(state.paragraph, 'ParagraphSentence')[0], text);
        return;
    }

    note('どの種類にも当たらない行', text.slice(0, 60));
}

function flushCaption(state, kind) {
    if (state.caption !== null) {
        note('見出しのあとに条や項が来ない', state.caption + ' → ' + kind);
        state.caption = null;
    }
}

function isExtract(state) {
    return !!state.suppl && state.suppl.getAttribute('Extract') === 'true';
}

function describe(state) {
    const head = state.suppl ? '附則' + (state.suppl.getAttribute('AmendLawNum') || '') : '本則';
    if (!state.article) {
        return head;
    }
    return head + ' ' + findChildList(state.article, 'ArticleTitle')[0].textContent;
}

function buildParagraph(state, parent, num, numText, text) {
    const paragraph = buildElement(parent, 'Paragraph', { Num: String(num) });
    if (state.caption !== null) {
        buildElement(paragraph, 'ParagraphCaption', null, state.caption);
        state.caption = null;
    }
    buildElement(paragraph, 'ParagraphNum', null, numText);
    buildSentence(buildElement(paragraph, 'ParagraphSentence'), text);
    return paragraph;
}

function normalize(text) {
    return text.replace(/\(/g, '（').replace(/\)/g, '）').replace(/｡/g, '。').replace(/､/g, '、');
}

function splitSentence(text) {
    const partList = [];
    let depth = 0;
    let current = '';
    text.split('').forEach(char => {
        current += char;
        if (char === '（' || char === '「') {
            depth = depth + 1;
        } else if (char === '）' || char === '」') {
            depth = Math.max(0, depth - 1);
        } else if (char === '。' && depth === 0) {
            partList.push(current);
            current = '';
        }
    });
    if (current) {
        partList.push(current);
    }
    const proviso = partList.findIndex(part => part.startsWith('ただし'));
    return partList.map((part, index) => {
        let func = null;
        if (proviso > 0) {
            func = index < proviso ? 'main' : 'proviso';
        }
        return { text: part, func };
    });
}

function buildSentence(parent, text) {
    const start = findChildList(parent, 'Sentence').length + 1;
    splitSentence(normalize(text)).forEach((part, index) => {
        const sentence = buildElement(parent, 'Sentence', { Num: String(start + index) }, part.text);
        if (part.func) {
            sentence.setAttribute('Function', part.func);
        }
    });
}

function buildItemSentence(parent, text) {
    const columnList = text.split(' ').filter(column => column);
    if (columnList.length > 1) {
        note('号の本文を Column に分けた', columnList.join(' / ').slice(0, 60));
        columnList.forEach((column, index) => {
            buildSentence(buildElement(parent, 'Column', { Num: String(index + 1) }), column);
        });
        return;
    }
    buildSentence(parent, text);
}

function splitOnce(text, pattern) {
    const match = text.match(pattern);
    return match ? [match[1], match[2]] : [text];
}

function buildItemColumn(block, title) {
    const lineList = block.lineList;
    const runList = lineList[0].runList;
    if (runList.length < 3) {
        return null;
    }
    const column2X = runList[2].x0 - 2;
    if (!lineList.slice(0, -1).some(line => !line.full && line.x0 < column2X)) {
        return null;
    }
    const first = lineList[0].text.trim().slice(title.length).trim();
    const columnList = splitOnce(first, /^(.*?) +(.*)$/);
    if (columnList.length === 1) {
        columnList.push('');
    }
    lineList.slice(1).forEach(line => {
        if (line.x0 >= column2X) {
            columnList[1] += line.text.trim();
            return;
        }
        const partList = splitOnce(line.text.trim(), /^(.*?) {2,}(.*)$/);
        columnList[0] += partList[0];
        if (partList.length > 1) {
            columnList[1] += partList[1];
        }
    });
    note('二段に組まれた号を Column に分けた', columnList.join(' / ').slice(0, 60));
    return columnList.join(' ');
}

function buildTable(xmlDocument, block) {
    const charWidth = block.charWidth;
    const columnXList = findColumnXList(block.lineList);
    const fragmentListList = block.lineList.map(line => splitColumn(line, columnXList, charWidth));
    const rightList = columnXList.map((columnX, index) => findRight(fragmentListList.filter(fragmentList => fragmentList[index]).map(fragmentList => fragmentList[index].x1)));

    const rowList = [];
    let activeList = [];
    fragmentListList.forEach(fragmentList => {
        const newList = [];
        fragmentList.forEach((fragment, index) => {
            const cell = activeList[index];
            if (fragment && cell && cell.textList.join('') && !cell.open && !(cell.short && KINSOKU_PATTERN.test(fragment.text))) {
                newList.push(index);
            }
        });
        if (rowList.length === 0 || (fragmentList[0] && newList.length > 0)) {
            activeList = columnXList.map(() => buildCell());
            rowList.push(activeList.slice());
        } else if (newList.length > 0 && (CELL_MARK_PATTERN.test(fragmentList[newList[0]].text) || fragmentList.filter(fragment => fragment).length === 1)) {
            newList.forEach(index => {
                activeList[index].textList.push('');
            });
        } else if (newList.length > 0) {
            const first = newList[0];
            const row = columnXList.map((columnX, index) => {
                if (index < first) {
                    activeList[index].rowspan += 1;
                    return null;
                }
                activeList[index] = buildCell();
                return activeList[index];
            });
            rowList.push(row);
        }
        fragmentList.forEach((fragment, index) => {
            if (!fragment) {
                return;
            }
            const cell = activeList[index];
            const indent = fragment.x0 > columnXList[index] + charWidth * FULL_RATIO;
            if (cell.open && cell.textList[cell.textList.length - 1] && (indent || CELL_MARK_PATTERN.test(fragment.text))) {
                cell.textList.push('');
            }
            cell.textList[cell.textList.length - 1] += fragment.text;
            cell.open = fragment.x1 >= rightList[index] - charWidth * FULL_RATIO;
            cell.short = fragment.x1 >= rightList[index] - charWidth * (1 + FULL_RATIO);
        });
    });

    const tableStruct = xmlDocument.createElement('TableStruct');
    const table = buildElement(tableStruct, 'Table');
    const textList = [];
    rowList.forEach(row => {
        const tableRow = buildElement(table, 'TableRow');
        row.forEach(cell => {
            if (!cell) {
                return;
            }
            const column = buildElement(tableRow, 'TableColumn', cell.rowspan > 1 ? { rowspan: String(cell.rowspan) } : null);
            cell.textList.filter(text => text).forEach((text, index) => {
                buildElement(column, 'Sentence', { Num: String(index + 1) }, text);
                textList.push(text);
            });
        });
    });
    block.sourceText = textList.join('');
    note('表として組んだ部分', columnXList.length + ' 列 ' + rowList.length + ' 行（' + block.lineList[0].text.trim().slice(0, 30) + '）');
    return tableStruct;
}

function findRight(xList) {
    const countMap = new Map();
    xList.forEach(x => {
        const key = Math.round(x);
        countMap.set(key, (countMap.get(key) || 0) + 1);
    });
    const repeatList = Array.from(countMap).filter(([key, count]) => count > 1).map(([key]) => key);
    return repeatList.length > 0 ? Math.max(...repeatList) : Math.max(...xList);
}

function buildCell() {
    return { textList: [''], rowspan: 1, open: true };
}

function findColumnXList(lineList) {
    const rangeList = [];
    lineList.forEach(line => {
        line.runList.forEach(run => {
            run.itemList.forEach(item => {
                rangeList.push([Math.round(item.x0), Math.round(item.x1)]);
            });
        });
    });
    const left = Math.min(...rangeList.map(range => range[0]));
    const countList = new Array(Math.max(...rangeList.map(range => range[1])) - left + 1).fill(0);
    rangeList.forEach(([x0, x1]) => {
        for (let x = x0; x < x1; x++) {
            countList[x - left] += 1;
        }
    });
    const limit = Math.floor(lineList.length * GUTTER_RATIO);
    const columnXList = [left];
    let gutter = 0;
    countList.forEach((count, index) => {
        if (count <= limit) {
            gutter = gutter + 1;
            return;
        }
        if (gutter >= GUTTER_WIDTH) {
            columnXList.push(left + index);
        }
        gutter = 0;
    });
    return columnXList;
}

function splitColumn(line, columnXList, charWidth) {
    const fragmentList = columnXList.map(() => null);
    line.runList.forEach(run => {
        run.itemList.forEach(item => {
            const index = findColumnIndex(columnXList, item.x0);
            const fragment = fragmentList[index];
            if (!fragment) {
                fragmentList[index] = { text: normalize(item.text).replace(/ /g, ''), x0: item.x0, x1: item.x1 };
                return;
            }
            fragment.text += (item.x0 - fragment.x1 >= charWidth * CELL_SPACE_RATIO ? '　' : '') + normalize(item.text).replace(/ /g, '');
            fragment.x1 = item.x1;
        });
    });
    return fragmentList;
}

function findColumnIndex(columnXList, x) {
    let index = 0;
    columnXList.forEach((columnX, columnIndex) => {
        if (x >= columnX - 2) {
            index = columnIndex;
        }
    });
    return index;
}

function buildToc(toc, main) {
    buildElement(toc, 'TOCLabel', null, '目次');
    buildTocNode(main, toc);
    buildElement(buildElement(toc, 'TOCSupplProvision'), 'SupplProvisionLabel', null, '附則');
}

function buildTocNode(parent, tocParent) {
    Array.from(parent.children).forEach(child => {
        if (!STRUCTURE_TAG_LIST.includes(child.tagName)) {
            return;
        }
        const node = buildElement(tocParent, 'TOC' + child.tagName, { Num: child.getAttribute('Num') });
        const title = findChildList(child, child.tagName + 'Title')[0].textContent;
        buildElement(node, child.tagName + 'Title', null, title);
        const articleList = findChildList(child, 'Article');
        if (articleList.length > 0 && !title.endsWith('削除')) {
            buildElement(node, 'ArticleRange', null, formatRange(articleList));
        }
        buildTocNode(child, node);
    });
}

function formatRange(articleList) {
    const first = articleList[0].getAttribute('Num').split(':')[0];
    const last = articleList[articleList.length - 1].getAttribute('Num').split(':').pop();
    const count = articleList.length + articleList.filter(article => article.getAttribute('Num').includes(':')).length;
    if (first === last) {
        return '（' + buildArticleTitle(first) + '）';
    }
    if (count === 2) {
        return '（' + buildArticleTitle(first) + '・' + buildArticleTitle(last) + '）';
    }
    return '（' + buildArticleTitle(first) + '―' + buildArticleTitle(last) + '）';
}

function checkToc(toc, tocBlockList) {
    const generatedList = [];
    Array.from(toc.getElementsByTagName('*')).forEach(element => {
        if (element.tagName.endsWith('Title')) {
            generatedList.push(element.textContent);
        }
        if (element.tagName === 'ArticleRange') {
            generatedList[generatedList.length - 1] += element.textContent;
        }
    });
    const sourceList = tocBlockList.filter(block => block.kind === 'text' && block.text).map(block => block.text.replace(' ', '　').replace(/－/g, '―'));
    const length = Math.max(generatedList.length, sourceList.length);
    for (let index = 0; index < length; index++) {
        const generated = index < generatedList.length ? generatedList[index] : '(なし)';
        const source = index < sourceList.length ? sourceList[index] : '(なし)';
        if (generated !== source) {
            note('目次の照合（本文から作った目次と PDF の目次が違う）', '本文: ' + generated + ' ／ PDF: ' + source);
        }
    }
}

function checkText(bodyList, lawBody) {
    const source = bodyList.map(block => buildSourceText(block)).join('').replace(/\s/g, '');
    let target = '';
    Array.from(lawBody.getElementsByTagName('*')).forEach(element => {
        if (element.children.length > 0 || element.tagName === 'LawTitle' || element.closest('TOC')) {
            return;
        }
        if (element.tagName === 'SupplProvisionLabel' && element.textContent === '附　則') {
            const suppl = element.parentElement;
            const amend = suppl.getAttribute('AmendLawNum');
            target += '附則' + (amend ? '（' + amend + '）' : '') + (suppl.getAttribute('Extract') ? '抄' : '');
            return;
        }
        target += element.textContent;
    });
    target = target.replace(/\s/g, '');

    const rowList = Diff.compare([{ key: 'law', text: source }], [{ key: 'law', text: target }]);
    if (rowList.length === 0) {
        return;
    }
    const row = rowList[0];
    if (!row.oldRangeList) {
        note('文字の突き合わせができない', 'PDF ' + source.length + ' 字・XML ' + target.length + ' 字');
        return;
    }
    row.oldRangeList.forEach(range => {
        note('PDF にだけある文字', describeRange(source, range));
    });
    row.newRangeList.forEach(range => {
        note('XML にだけある文字', describeRange(target, range));
    });
}

function buildSourceText(block) {
    if (block.kind === 'table') {
        return block.sourceText || '';
    }
    if (NOTE_PATTERN.test(block.text)) {
        return '';
    }
    return normalize(block.lineList.map(line => line.origin).join('')).replace(AMEND_NOTE_ALL_PATTERN, '').replace(/^(附 *則)〔(.+)〕/, '$1（$2）');
}

function describeRange(text, range) {
    return '…' + text.slice(Math.max(0, range.start - 12), range.start) + '［' + text.slice(range.start, range.end).slice(0, 60) + '］';
}

function buildResponse(xmlDocument, law, lawId, titleInfo, setting) {
    const amend = setting.amendLawNum ? parseAmendLawNum(setting.amendLawNum) : null;
    const revisionId = [lawId, setting.enforcementDate.replace(/-/g, ''), amend ? amend.lawId : ''].filter(part => part).join('_');
    const lawInfo = {
        law_type: 'Rule',
        law_id: lawId,
        law_num: titleInfo.lawNum,
        law_num_era: titleInfo.eraName,
        law_num_year: titleInfo.year,
        law_num_type: 'Rule',
        law_num_num: String(titleInfo.num),
        promulgation_date: titleInfo.date,
    };
    const revision = {
        law_revision_id: revisionId,
        law_type: 'Rule',
        law_title: titleInfo.title,
        law_title_kana: setting.titleKana,
        abbrev: null,
        category: setting.category || null,
        updated: null,
        amendment_promulgate_date: amend ? amend.date : null,
        amendment_enforcement_date: setting.enforcementDate || null,
        amendment_enforcement_comment: null,
        amendment_scheduled_enforcement_date: null,
        amendment_law_id: amend ? amend.lawId : null,
        amendment_law_title: null,
        amendment_law_title_kana: null,
        amendment_law_num: amend ? amend.lawNum : null,
        amendment_type: null,
        repeal_status: 'None',
        repeal_date: null,
        remain_in_force: false,
        mission: 'New',
        current_revision_status: 'CurrentEnforced',
    };

    const root = xmlDocument.documentElement;
    buildElement(root, 'attached_files_info');
    const lawInfoElement = buildElement(root, 'law_info');
    Object.keys(lawInfo).forEach(key => {
        buildElement(lawInfoElement, key, null, String(lawInfo[key]));
    });
    const revisionElement = buildElement(root, 'revision_info');
    Object.keys(revision).forEach(key => {
        buildElement(revisionElement, key, null, revision[key] === null ? '' : String(revision[key]));
    });
    buildElement(root, 'law_full_text').appendChild(law);

    return {
        xml: serialize(root, 0) + '\n',
        json: JSON.stringify({ law_info: lawInfo, revisions: [revision] }, null, 4) + '\n',
    };
}

function serialize(element, depth) {
    const indent = '  '.repeat(depth);
    let open = '<' + element.tagName;
    Array.from(element.attributes).forEach(attribute => {
        open += ' ' + attribute.name + '="' + escapeXml(attribute.value).replace(/"/g, '&quot;') + '"';
    });
    if (element.children.length === 0) {
        if (!element.textContent) {
            return indent + open + '/>';
        }
        return indent + open + '>' + escapeXml(element.textContent) + '</' + element.tagName + '>';
    }
    const lineList = [indent + open + '>'];
    Array.from(element.children).forEach(child => {
        lineList.push(serialize(child, depth + 1));
    });
    lineList.push(indent + '</' + element.tagName + '>');
    return lineList.join('\n');
}

function escapeXml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
