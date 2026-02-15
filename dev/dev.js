import { Service } from '/global/service.js?v=20260213';

let inputEl;
let execEl;
let resultEl;

window.addEventListener('DOMContentLoaded', () => {
    inputEl = document.querySelector('#input');
    execEl = document.querySelector('#exec');
    resultEl = document.querySelector('#result');

    inputEl.value = '';
    execEl.addEventListener('click', () => {
        resultEl.textContent = 'loading';
        convert();
    });
    resultEl.textContent = 'nothing';
});

function convert() {
    const input = inputEl.value.trim();
    if (!input) {
        resultEl.textContent = 'nothing';
        return;
    }

    let data;
    try {
        data = Function('"use strict"; return ' + input)();
    } catch (e) {
        resultEl.textContent = 'parse error';
        return;
    }

    if (!Array.isArray(data)) {
        resultEl.textContent = 'input is not array';
        return;
    }

    let output = '[\n';

    data.forEach(item => {
        const abbrevKana = item.abbrev_kana || '';
        let abbrevAlphabet = '';

        if (abbrevKana) {
            abbrevAlphabet = abbrevKana
                .split(',')
                .map(k => kanaToHebon(k))
                .join(',');
        }

        output += '    { ';
        output += "id: '" + item.id + "', ";
        output += "title: '" + item.title + "', ";
        output += "title_kana: '" + item.title_kana + "', ";
        output += "title_alphabet: '" + item.title_alphabet + "', ";
        output += "abbrev: '" + (item.abbrev || '') + "', ";
        output += "abbrev_kana: '" + abbrevKana + "', ";
        output += "abbrev_alphabet: '" + abbrevAlphabet + "', ";
        output += '},\n';
    });

    output += ']';

    resultEl.textContent = output;
}

async function download() {
    const input = inputEl.value;
    if (!input) {
        return;
    }

    const list = input.split(/[\s,]+/).filter(Boolean);
    let output = '';

    for (const id of list) {
        const data = await Service.getLawRevisions(id);
        const revisions = data ? data.revisions : null;
        if (!revisions) {
            output += 'error:' + id + '\n';
            continue;
        }
        const singleQuote = "'";
        let str = '{ ';
        str += 'id: ' + singleQuote + id + singleQuote + ', ';
        revisions.forEach(revision => {
            if (revision.current_revision_status === 'CurrentEnforced') {
                str += 'title: ' + singleQuote + revision.law_title + singleQuote + ', ';
                str += 'title_kana: ' + singleQuote + revision.law_title_kana + singleQuote + ', ';
                str += 'title_alphabet: ' + singleQuote + kanaToHebon(revision.law_title_kana) + singleQuote + ', ';
                const abbrev = (revision.abbrev === 'null' || !revision.abbrev) ? '' : revision.abbrev;
                str += 'abbrev: ' + singleQuote + abbrev + singleQuote + ', ';
                str += 'abbrev_kana: ' + singleQuote + '' + singleQuote + ', ';
                str += 'abbrev_alphabet: ' + singleQuote + '' + singleQuote + ', ';
            }
        });
        str += '},\n';
        output += str;
    }

    resultEl.textContent = output;
}

function kanaToHebon(input) {
    const table = {
        きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
        しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
        ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
        にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
        ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
        みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
        りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
        ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
        じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
        びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
        ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
        ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo',
        づゃ: 'dya', づゅ: 'dyu', づょ: 'dyo',
        あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
        か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
        さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
        た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
        な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
        は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
        ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
        や: 'ya', ゆ: 'yu', よ: 'yo',
        ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
        わ: 'wa', を: 'o', ん: 'n',
        が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
        ざ: 'za', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
        だ: 'da', じ: 'ji', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
        ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
        ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
        ゃ: 'ya', ゅ: 'yu', ょ: 'yo',
        っ: '',
    };

    let result = '';
    for (let i = 0; i < input.length; i++) {
        const two = input.slice(i, i + 2);
        if (table[two]) {
            result += table[two];
            i++;
            continue;
        }

        const one = input[i];
        if (one === 'っ' && i + 1 < input.length) {
            const next = input[i + 1];
            const nextRomaji = table[input.slice(i + 1, i + 3)] || table[next];
            if (nextRomaji) result += nextRomaji[0];
            continue;
        }

        result += table[one] || one;
    }

    return result;
}
