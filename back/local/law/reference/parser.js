export const Parser = {
    parse,
};

const NUMBER = '[〇一二三四五六七八九十百千]+';
const BRANCH = '(?:の(?!一(?![〇一二三四五六七八九十百千]))' + NUMBER + ')*';
const IROHA = 'イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス';
const ERA = '(?:明治|大正|昭和|平成|令和)';
const LAW_TYPE = '(?:法律|政令|勅令|太政官布告|太政官達|[^\\s、。（）「」第年]{1,12}?(?:省令|府令|規則|告示))';

const TERM_PATTERN = new RegExp(
    '(?<citation>（?' + ERA + '(?:元|' + NUMBER + ')年' + LAW_TYPE + '第' + NUMBER + '号）?)' +
    '|(?<sameLaw>同法)' +
    '|(?<suppl>附則)?第(?<structureNum>' + NUMBER + ')(?<structureUnit>[編章節款目条])(?<structureBranch>' + BRANCH + ')' +
    '|第(?<paragraphNum>' + NUMBER + ')項' +
    '|第(?<itemNum>' + NUMBER + ')号(?<itemBranch>' + BRANCH + ')(?<iroha>[' + IROHA + '](?![ァ-ヶー]))?' +
    '|前各(?<previousAllUnit>[条項号])' +
    '|前(?<previousCount>' + NUMBER + ')(?<previousCountUnit>[条項号])' +
    '|(?<relativeDirection>[前次同])(?<relativeUnit>[編章節款条項号])(?!約)' +
    '|(?<every>各号)',
    'g',
);

const CONNECTOR_PATTERN = /^[、・]?(?:及び|又は|若しくは|並びに|から)?$/;
const PARENTHESIS_OPEN = '（';
const QUOTE_OPEN = '「';
const QUOTE_CLOSE = '」';
const LAW_NAME_ENDING_PATTERN = /[法令則約律旧新]$/;
const LAW_NAME_BOUNDARY_PATTERN = /(?:[、。「」『』（）・\s]|又は|若しくは|並びに|前に|後に|された|て|に基づく)$/;
const LAW_NAME_LEADING_PATTERN = /^[中のに]/;
const LAW_NAME_MAX_LENGTH = 40;

const UNIT_LEVELS = {
    '編': 'Part',
    '章': 'Chapter',
    '節': 'Section',
    '款': 'Subsection',
    '目': 'Division',
    '条': 'Article',
    '項': 'Paragraph',
    '号': 'Item',
};

const RELATIVE_KINDS = {
    '前': 'previous',
    '次': 'next',
    '同': 'same',
};

const KANJI_DIGITS = {
    '〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
};

const KANJI_UNITS = {
    '十': 10, '百': 100, '千': 1000,
};

function parse(text) {
    const events = [];
    const quoteDepths = measureQuoteDepths(text);
    let chain = null;
    let prefix = null;
    let previousEnd = -1;
    let boundary = 0;

    TERM_PATTERN.lastIndex = 0;
    let match;
    while ((match = TERM_PATTERN.exec(text)) !== null) {
        const start = match.index;
        if (quoteDepths[start] > 0) {
            closeChain();
            prefix = null;
            continue;
        }

        const terms = buildTerms(match);
        const end = start + match[0].length;
        const isContiguous = start === previousEnd;

        if (terms[0].kind === 'citation' || terms[0].kind === 'sameLaw') {
            closeChain();
            const nameStart = findLawNameStart(text, start, boundary, terms[0]);
            if (terms[0].kind === 'citation') {
                events.push({ type: 'citation', lawNum: terms[0].lawNum, lawName: text.slice(nameStart, start) });
            }
            prefix = { term: terms[0], start, end, nameStart };
            boundary = end;
            previousEnd = end;
            continue;
        }

        if (chain && isContiguous && canExtend(terms[0])) {
            terms.forEach(term => chain.terms.push(Object.assign(term, { start, end })));
            chain.end = end;
            previousEnd = end;
            continue;
        }

        const lastChainEnd = chain ? chain.end : lastEventEnd();
        closeChain();

        if (terms[0].kind === 'every') {
            previousEnd = end;
            prefix = null;
            continue;
        }

        const hasPrefix = prefix && prefix.end === start;
        const gap = lastChainEnd >= 0 ? text.slice(lastChainEnd, start) : null;

        chain = {
            type: 'chain',
            start: hasPrefix ? prefix.nameStart : start,
            end,
            terms: terms.map(term => Object.assign(term, { start, end })),
            law: hasPrefix && prefix.term.kind === 'citation' ? prefix.term.lawNum : '',
            isSameLaw: hasPrefix && prefix.term.kind === 'sameLaw',
            isConnected: !hasPrefix && gap !== null && gap.length > 0 && CONNECTOR_PATTERN.test(gap),
            isParenthetical: !hasPrefix && gap === PARENTHESIS_OPEN,
            isAfterLawName: !hasPrefix && LAW_NAME_ENDING_PATTERN.test(text.slice(0, start)),
        };
        prefix = null;
        previousEnd = end;
    }
    closeChain();
    return events;

    function closeChain() {
        if (chain) {
            boundary = chain.end;
            events.push(chain);
            chain = null;
        }
    }

    function lastEventEnd() {
        const last = events[events.length - 1];
        return last && last.type === 'chain' ? last.end : -1;
    }
}

function findLawNameStart(text, start, boundary, term) {
    if (term.kind === 'sameLaw' || text[start] !== '（') {
        return start;
    }
    let nameStart = start;
    while (nameStart > boundary && start - nameStart < LAW_NAME_MAX_LENGTH) {
        if (LAW_NAME_BOUNDARY_PATTERN.test(text.slice(0, nameStart))) {
            break;
        }
        nameStart--;
    }
    if (nameStart === boundary && LAW_NAME_LEADING_PATTERN.test(text.slice(nameStart, start))) {
        nameStart++;
    }
    return nameStart;
}

function measureQuoteDepths(text) {
    const depths = new Uint16Array(text.length);
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === QUOTE_OPEN) {
            depth++;
        }
        depths[i] = depth;
        if (text[i] === QUOTE_CLOSE && depth > 0) {
            depth--;
        }
    }
    return depths;
}

function canExtend(term) {
    return term.kind === 'absolute' || term.kind === 'every';
}

function buildTerms(match) {
    const groups = match.groups;

    if (groups.citation) {
        return [{ kind: 'citation', lawNum: groups.citation.replace(/^（|）$/g, '') }];
    }
    if (groups.sameLaw) {
        return [{ kind: 'sameLaw' }];
    }
    if (groups.structureUnit) {
        return [{
            kind: 'absolute',
            level: UNIT_LEVELS[groups.structureUnit],
            num: buildNum(groups.structureNum, groups.structureBranch),
            isSuppl: Boolean(groups.suppl),
        }];
    }
    if (groups.paragraphNum) {
        return [{ kind: 'absolute', level: 'Paragraph', num: buildNum(groups.paragraphNum, '') }];
    }
    if (groups.itemNum) {
        const terms = [{ kind: 'absolute', level: 'Item', num: buildNum(groups.itemNum, groups.itemBranch) }];
        if (groups.iroha) {
            terms.push({ kind: 'absolute', level: 'Subitem1', num: String(IROHA.indexOf(groups.iroha) + 1) });
        }
        return terms;
    }
    if (groups.previousAllUnit) {
        return [{ kind: 'previousAll', level: UNIT_LEVELS[groups.previousAllUnit] }];
    }
    if (groups.previousCountUnit) {
        return [{
            kind: 'previousCount',
            level: UNIT_LEVELS[groups.previousCountUnit],
            count: parseKanjiNumber(groups.previousCount),
        }];
    }
    if (groups.relativeUnit) {
        return [{ kind: RELATIVE_KINDS[groups.relativeDirection], level: UNIT_LEVELS[groups.relativeUnit] }];
    }
    return [{ kind: 'every' }];
}

function buildNum(main, branch) {
    const parts = [parseKanjiNumber(main)];
    branch.split('の').filter(part => part.length > 0).forEach(part => {
        parts.push(parseKanjiNumber(part));
    });
    return parts.join('_');
}

function parseKanjiNumber(text) {
    let total = 0;
    let digit = 0;
    for (const char of text) {
        if (char in KANJI_DIGITS) {
            digit = digit * 10 + KANJI_DIGITS[char];
        } else {
            total += (digit || 1) * KANJI_UNITS[char];
            digit = 0;
        }
    }
    return total + digit;
}
