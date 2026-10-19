export const Dictionary = {
    load,
    find,
    getMajorList,
};

const DATA_URL = '/data/law.json';
const ROMAJI_TAIL_PATTERN = /[a-z'-]+$/;
const DOUBLE_CONSONANT_PATTERN = /^[bcdfghjklmpqrstvwxyz]$/;
const VOWEL_LIST = ['a', 'i', 'u', 'e', 'o'];
const SYLLABLE_LENGTH = 3;
const KATAKANA_OFFSET = 0x60;
const VARIANT_LIMIT = 32;

const ROW_MAP = {
    '': 'あいうえお',
    k: 'かきくけこ',
    g: 'がぎぐげご',
    s: 'さしすせそ',
    z: 'ざじずぜぞ',
    t: 'たちつてと',
    d: 'だぢづでど',
    n: 'なにぬねの',
    h: 'はひふへほ',
    b: 'ばびぶべぼ',
    p: 'ぱぴぷぺぽ',
    m: 'まみむめも',
    y: 'や ゆ よ',
    r: 'らりるれろ',
    w: 'わ   を',
};

const CONTRACTION_MAP = {
    ky: 'き',
    gy: 'ぎ',
    sh: 'し',
    sy: 'し',
    j: 'じ',
    jy: 'じ',
    zy: 'じ',
    ch: 'ち',
    cy: 'ち',
    ty: 'ち',
    dy: 'ぢ',
    ny: 'に',
    hy: 'ひ',
    by: 'び',
    py: 'ぴ',
    my: 'み',
    ry: 'り',
};

const SPECIAL_MAP = {
    shi: 'し',
    ji: 'じ',
    chi: 'ち',
    tsu: 'つ',
    fu: 'ふ',
    fa: 'ふぁ',
    fi: 'ふぃ',
    fe: 'ふぇ',
    fo: 'ふぉ',
    thi: 'てぃ',
    dhi: 'でぃ',
    nn: 'ん',
    'n\'': 'ん',
    xtu: 'っ',
    ltu: 'っ',
    '-': 'ー',
};

const syllableMap = buildSyllableMap();

let entryList = [];

async function load() {
    try {
        const res = await fetch(DATA_URL);
        if (res.ok) {
            const lawList = await res.json();
            entryList = lawList.map(law => buildEntry(law));
        }
    } catch (e) {
        console.error(e);
    }
}

function find(query, limit) {
    const text = normalize(query);
    if (!text) {
        return [];
    }
    const romaji = text.match(ROMAJI_TAIL_PATTERN);
    const kanaList = romaji ? toHiraganaList(romaji[0]).map(kana => text.slice(0, romaji.index) + kana) : [];

    const matchList = [];
    entryList.forEach((entry, index) => {
        const level = Math.max(getLevel(entry.textList, text), ...kanaList.map(kana => getLevel(entry.kanaList, kana)));
        if (level > 0) {
            matchList.push({ law: entry.law, level, index });
        }
    });
    matchList.sort((a, b) => b.level - a.level || a.law.title.length - b.law.title.length || a.index - b.index);
    return matchList.slice(0, limit).map(match => match.law);
}

function getMajorList() {
    return entryList.filter(entry => entry.law.isMajor).map(entry => entry.law);
}

function buildEntry(law) {
    const kanaList = [law.kana].concat(law.abbrevList.map(abbrev => abbrev.kana)).map(normalize);
    const titleList = [law.title].concat(law.abbrevList.map(abbrev => abbrev.title)).map(normalize);
    return {
        law,
        textList: titleList.concat(kanaList),
        kanaList,
    };
}

function getLevel(keyList, value) {
    if (!value) {
        return 0;
    }
    let level = 0;
    keyList.forEach(key => {
        if (key === value) {
            level = Math.max(level, 3);
        } else if (key.startsWith(value)) {
            level = Math.max(level, 2);
        } else if (key.includes(value)) {
            level = Math.max(level, 1);
        }
    });
    return level;
}

function normalize(value) {
    const text = value.normalize('NFKC').toLowerCase().replace(/\s/g, '');
    return unifyKana(text.replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - KATAKANA_OFFSET)));
}

function unifyKana(text) {
    return text.replace(/ぢ/g, 'じ').replace(/づ/g, 'ず');
}

function toHiraganaList(text) {
    const kanaList = [];
    convertRomaji(text, 0, '', kanaList);
    return Array.from(new Set(kanaList.map(unifyKana)));
}

function convertRomaji(text, index, kana, kanaList) {
    if (kanaList.length >= VARIANT_LIMIT) {
        return;
    }
    if (index >= text.length) {
        kanaList.push(kana);
        return;
    }

    const char = text[index];
    const next = text[index + 1] || '';
    if (char === 'n' && next && !'aiueoyn\''.includes(next)) {
        convertRomaji(text, index + 1, kana + 'ん', kanaList);
        return;
    }
    if (isDoubleConsonant(char, next)) {
        convertRomaji(text, index + 1, kana + 'っ', kanaList);
        return;
    }

    const key = findSyllable(text, index);
    if (key) {
        convertRomaji(text, index + key.length, kana + syllableMap.get(key), kanaList);
    } else {
        getCompletionList(text.slice(index)).forEach(completion => {
            kanaList.push(kana + completion);
        });
    }
    if (char === 'n' && next) {
        convertRomaji(text, index + 1, kana + 'ん', kanaList);
    }
}

function isDoubleConsonant(char, next) {
    if (char === 't' && next === 'c') {
        return true;
    }
    return char === next && DOUBLE_CONSONANT_PATTERN.test(char);
}

function findSyllable(text, index) {
    for (let length = SYLLABLE_LENGTH; length > 0; length--) {
        const key = text.slice(index, index + length);
        if (key.length === length && syllableMap.has(key)) {
            return key;
        }
    }
    return '';
}

function getCompletionList(rest) {
    if (rest.length >= SYLLABLE_LENGTH) {
        return [];
    }
    return Array.from(syllableMap.keys()).filter(key => key.startsWith(rest)).map(key => syllableMap.get(key));
}

function buildSyllableMap() {
    const map = new Map();
    Object.entries(ROW_MAP).forEach(([consonant, kanaRow]) => {
        VOWEL_LIST.forEach((vowel, position) => {
            if (kanaRow[position] !== ' ') {
                map.set(consonant + vowel, kanaRow[position]);
            }
        });
    });
    Object.entries(CONTRACTION_MAP).forEach(([head, kana]) => {
        map.set(head + 'a', kana + 'ゃ');
        map.set(head + 'u', kana + 'ゅ');
        map.set(head + 'e', kana + 'ぇ');
        map.set(head + 'o', kana + 'ょ');
    });
    Object.entries(SPECIAL_MAP).forEach(([key, kana]) => {
        map.set(key, kana);
    });
    return map;
}
