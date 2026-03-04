export const Search = {
    init,
};

let searchInput;
let searchIcon;
let searchExec;
let searchResult;

let selectedIndex = -1;

function init() {
    searchInput = document.querySelector('#search-input');
    searchInput.value = '';
    searchInput.addEventListener('keydown', (e) => {
        const links = searchResult.querySelectorAll('a');
        if (links.length === 0) {
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, links.length - 1);
            updateSelection();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection();
        }
        if (e.key === 'Enter') {
            const link = links[selectedIndex] || links[0];
            if (link) {
                window.location.href = link.href;
            }
        }
    });
    searchInput.addEventListener('input', () => {
        updateResult();
    });
    searchInput.addEventListener('focus', () => {
        if (searchInput.value) {
            searchResult.style.display = '';
        }
    });
    searchInput.addEventListener('blur', () => {
        searchResult.style.display = 'none';
    });

    searchIcon = document.querySelector('#search-icon');

    searchExec = document.querySelector('#search-exec');
    searchExec.addEventListener('click', () => {
        if (searchInput.value) {
            const url = new URL('./search.html', window.location);
            url.searchParams.set('q', searchInput.value);
            window.location.href = url;
        }
    });

    searchResult = document.querySelector('#search-result');
    searchResult.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });
    searchResult.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    searchInput.focus();
}

const QUICK_SEARCH_DATA = [
    { id: '321CONSTITUTION', title: '日本国憲法', title_kana: 'にほんこくけんぽう', title_alphabet: 'nihonkokukenpou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '129AC0000000089', title: '民法', title_kana: 'みんぽう', title_alphabet: 'minpou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '132AC0000000048', title: '商法', title_kana: 'しょうほう', title_alphabet: 'shouhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '417AC0000000086', title: '会社法', title_kana: 'かいしゃほう', title_alphabet: 'kaishahou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '408AC0000000109', title: '民事訴訟法', title_kana: 'みんじそしょうほう', title_alphabet: 'minjisoshouhou', abbrev: '民訴法', abbrev_kana: 'みんそほう', abbrev_alphabet: 'minsohou', },
    { id: '140AC0000000045', title: '刑法', title_kana: 'けいほう', title_alphabet: 'keihou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '323AC0000000131', title: '刑事訴訟法', title_kana: 'けいじそしょうほう', title_alphabet: 'keijisoshouhou', abbrev: '刑訴法', abbrev_kana: 'けいそほう', abbrev_alphabet: 'keisohou', },

    { id: '405AC0000000088', title: '行政手続法', title_kana: 'ぎょうせいてつづきほう', title_alphabet: 'gyouseitetsuzukihou', abbrev: '行手法', abbrev_kana: 'ぎょうてほう', abbrev_alphabet: 'gyoutehou', },
    { id: '426AC0000000068', title: '行政不服審査法', title_kana: 'ぎょうせいふふくしんさほう', title_alphabet: 'gyouseifufukushinsahou', abbrev: '行服法,行審法', abbrev_kana: 'ぎょうふくほう,ぎょうしんほう', abbrev_alphabet: 'gyoufukuhou,gyoushinhou', },
    { id: '337AC0000000139', title: '行政事件訴訟法', title_kana: 'ぎょうせいじけんそしょうほう', title_alphabet: 'gyouseijikensoshouhou', abbrev: '行訴法', abbrev_kana: 'ぎょうそほう', abbrev_alphabet: 'gyousohou', },
    { id: '322AC0000000125', title: '国家賠償法', title_kana: 'こっかばいしょうほう', title_alphabet: 'kokkabaishouhou', abbrev: '国賠法', abbrev_kana: 'こくばいほう', abbrev_alphabet: 'kokubaihou', },
    { id: '323AC0000000043', title: '行政代執行法', title_kana: 'ぎょうせいだいしっこうほう', title_alphabet: 'gyouseidaishikkouhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '322AC0000000067', title: '地方自治法', title_kana: 'ちほうじちほう', title_alphabet: 'chihoujichihou', abbrev: '地自法', abbrev_kana: 'ちじほう', abbrev_alphabet: 'chijihou', },

    { id: '322AC0000000059', title: '裁判所法', title_kana: 'さいばんしょほう', title_alphabet: 'saibanshohou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '324AC1000000205', title: '弁護士法', title_kana: 'べんごしほう', title_alphabet: 'bengoshihou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '326CO0000000319', title: '出入国管理及び難民認定法', title_kana: 'しゅつにゅうこくかんりおよびなんみんにんていほう', title_alphabet: 'shutsunyuukokukanrioyobinanminninteihou', abbrev: '入管法', abbrev_kana: 'にゅうかんほう', abbrev_alphabet: 'nyuukanhou', },
    { id: '415AC0000000057', title: '個人情報の保護に関する法律', title_kana: 'こじんじょうほうのほごにかんするほうりつ', title_alphabet: 'kojinjouhounohogonikansuruhouritsu', abbrev: '個人情報保護法', abbrev_kana: 'こじんじょうほうほごほう', abbrev_alphabet: 'kojinjouhouhogohou', },

    { id: '403AC0000000090', title: '借地借家法', title_kana: 'しゃくちしゃくやほう', title_alphabet: 'shakuchishakuyahou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '416AC0000000123', title: '不動産登記法', title_kana: 'ふどうさんとうきほう', title_alphabet: 'fudousantoukihou', abbrev: '新不動産登記法,不登法', abbrev_kana: 'しんふどうさんとうきほう,ふとうほう', abbrev_alphabet: 'shinfudousantoukihou,futouhou', },
    { id: '406AC0000000085', title: '製造物責任法', title_kana: 'せいぞうぶつせきにんほう', title_alphabet: 'seizoubutsusekininhou', abbrev: 'ＰＬ法', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '412AC0000000061', title: '消費者契約法', title_kana: 'しょうひしゃけいやくほう', title_alphabet: 'shouhishakeiyakuhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },

    { id: '419AC0000000102', title: '電子記録債権法', title_kana: 'でんしきろくさいけんほう', title_alphabet: 'denshikirokusaikenhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '329AC0000000100', title: '利息制限法', title_kana: 'りそくせいげんほう', title_alphabet: 'risokuseigenhou', abbrev: '利限法', abbrev_kana: 'りげんほう', abbrev_alphabet: 'rigenhou', },
    { id: '418AC0000000108', title: '信託法', title_kana: 'しんたくほう', title_alphabet: 'shintakuhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },

    { id: '420AC0000000056', title: '保険法', title_kana: 'ほけんほう', title_alphabet: 'hokenhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '323AC0000000025', title: '金融商品取引法', title_kana: 'きんゆうしょうひんとりひきほう', title_alphabet: 'kinyuushouhintorihikihou', abbrev: '金商法,証取法', abbrev_kana: 'きんしょうほう,しょうとりほう', abbrev_alphabet: 'kinshouhou,shoutorihou', },
    { id: '307AC0000000020', title: '手形法', title_kana: 'てがたほう', title_alphabet: 'tegatahou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '308AC0000000057', title: '小切手法', title_kana: 'こぎってほう', title_alphabet: 'kogittehou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },

    { id: '354AC0000000004', title: '民事執行法', title_kana: 'みんじしっこうほう', title_alphabet: 'minjishikkouhou', abbrev: '民執法', abbrev_kana: 'みんしつほう', abbrev_alphabet: 'minshitsuhou', },
    { id: '401AC0000000091', title: '民事保全法', title_kana: 'みんじほぜんほう', title_alphabet: 'minjihozenhou', abbrev: '民保法', abbrev_kana: 'みんほほう,みんぽほう', abbrev_alphabet: 'minhohou,minpohou', },
    { id: '415AC0000000109', title: '人事訴訟法', title_kana: 'じんじそしょうほう', title_alphabet: 'jinjisoshouhou', abbrev: '人訴法', abbrev_kana: 'じんそほう', abbrev_alphabet: 'jinsohou', },
    { id: '423AC0000000052', title: '家事事件手続法', title_kana: 'かじじけんてつづきほう', title_alphabet: 'kajijikentetsuzukihou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },

    { id: '323AC0000000136', title: '警察官職務執行法', title_kana: 'けいさつかんしょくむしっこうほう', title_alphabet: 'keisatsukanshokumushikkouhou', abbrev: '警職法', abbrev_kana: 'けいしょくほう', abbrev_alphabet: 'keishokuhou', },
    { id: '323AC0000000039', title: '軽犯罪法', title_kana: 'けいはんざいほう', title_alphabet: 'keihanzaihou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '323AC0000000168', title: '少年法', title_kana: 'しょうねんほう', title_alphabet: 'shounenhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },

    { id: '419AC0000000128', title: '労働契約法', title_kana: 'ろうどうけいやくほう', title_alphabet: 'roudoukeiyakuhou', abbrev: '労契法', abbrev_kana: 'ろうけいほう', abbrev_alphabet: 'roukeihou', },
    { id: '322AC0000000049', title: '労働基準法', title_kana: 'ろうどうきじゅんほう', title_alphabet: 'roudoukijunhou', abbrev: '労基法', abbrev_kana: 'ろうきほう', abbrev_alphabet: 'roukihou', },
    { id: '324AC0000000174', title: '労働組合法', title_kana: 'ろうどうくみあいほう', title_alphabet: 'roudoukumiaihou', abbrev: '労組法,労働三法', abbrev_kana: 'ろうくみほう,ろうそほう,ろうどうさんぽう', abbrev_alphabet: 'roukumihou,rousohou,roudousanpou', },

    { id: '322AC0000000054', title: '昭和二十二年法律第五十四号（私的独占の禁止及び公正取引の確保に関する法律）', title_kana: 'してきどくせんのきんしおよびこうせいとりひきのかくほにかんするほうりつ', title_alphabet: 'shitekidokusennokinshioyobikouseitorihikinokakuhonikansuruhouritsu', abbrev: '独禁法,独占禁止法', abbrev_kana: 'どっきんほう,どくせんきんしほう', abbrev_alphabet: 'dokkinhou,dokusenkinshihou', },

    { id: '416AC0000000075', title: '破産法', title_kana: 'はさんほう', title_alphabet: 'hasanhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '411AC0000000225', title: '民事再生法', title_kana: 'みんじさいせいほう', title_alphabet: 'minjisaiseihou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },

    { id: '334AC0000000121', title: '特許法', title_kana: 'とっきょほう', title_alphabet: 'tokkyohou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '345AC0000000048', title: '著作権法', title_kana: 'ちょさくけんほう', title_alphabet: 'chosakukenhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '334AC0000000127', title: '商標法', title_kana: 'しょうひょうほう', title_alphabet: 'shouhyouhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },

    { id: '418AC0000000078', title: '法の適用に関する通則法', title_kana: 'ほうのてきようにかんするつうそくほう', title_alphabet: 'hounotekiyounikansurutsuusokuhou', abbrev: '法適用通則法', abbrev_kana: 'ほうてきようつうそくほう', abbrev_alphabet: 'houtekiyoutsuusokuhou', },

    { id: '337AC0000000066', title: '国税通則法', title_kana: 'こくぜいつうそくほう', title_alphabet: 'kokuzeitsuusokuhou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '340AC0000000033', title: '所得税法', title_kana: 'しょとくぜいほう', title_alphabet: 'shotokuzeihou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
    { id: '340AC0000000034', title: '法人税法', title_kana: 'ほうじんぜいほう', title_alphabet: 'houjinzeihou', abbrev: '', abbrev_kana: '', abbrev_alphabet: '', },
];

function normalizeInput(input) {
    let normalized = input.toLowerCase();

    normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    normalized = normalized.replace(/sya/g, 'sha');
    normalized = normalized.replace(/syu/g, 'shu');
    normalized = normalized.replace(/syo/g, 'sho');

    normalized = normalized.replace(/zya/g, 'ja');
    normalized = normalized.replace(/zyu/g, 'ju');
    normalized = normalized.replace(/zyo/g, 'jo');

    normalized = normalized.replace(/jya/g, 'ja');
    normalized = normalized.replace(/jyu/g, 'ju');
    normalized = normalized.replace(/jyo/g, 'jo');

    normalized = normalized.replace(/tya/g, 'cha');
    normalized = normalized.replace(/tyu/g, 'chu');
    normalized = normalized.replace(/tyo/g, 'cho');

    normalized = normalized.replace(/cya/g, 'cha');
    normalized = normalized.replace(/cyu/g, 'chu');
    normalized = normalized.replace(/cyo/g, 'cho');

    normalized = normalized.replace(/si/g, 'shi');
    normalized = normalized.replace(/zi/g, 'ji');
    normalized = normalized.replace(/ti/g, 'chi');
    normalized = normalized.replace(/tu/g, 'tsu');
    normalized = normalized.replace(/hu/g, 'fu');

    return normalized;
}

function updateResult() {
    searchResult.innerHTML = '';
    const value = normalizeInput(searchInput.value.trim().toLowerCase());
    if (!value) {
        searchResult.style.display = 'none';
        searchExec.style.display = 'none';
        return;
    } else {
        searchResult.style.display = '';
        searchExec.style.display = '';
    }

    const icon = searchIcon.innerHTML;

    let matched = QUICK_SEARCH_DATA.filter(data => {
        const titleMatch = data.title.toLowerCase().includes(value);
        const titleKanaMatch = data.title_kana.toLowerCase().includes(value);
        const titleAlphabetMatch = data.title_alphabet.toLowerCase().includes(value);
        const abbrevMatch = data.abbrev.split(',').some(ab => ab.toLowerCase().includes(value));
        const abbrevKanaMatch = data.abbrev_kana.split(',').some(ab => ab.toLowerCase().includes(value));
        const abbrevAlphabetMatch = data.abbrev_alphabet.split(',').some(ab => ab.toLowerCase().includes(value));
        return titleMatch || titleKanaMatch || titleAlphabetMatch || abbrevMatch || abbrevKanaMatch || abbrevAlphabetMatch;
    });
    matched = matched.sort((a, b) => {
        const aTitleStartsWith = a.title.toLowerCase().startsWith(value);
        const aKanaStartsWith = a.title_kana.toLowerCase().startsWith(value);
        const aAlphabetStartsWith = a.title_alphabet.toLowerCase().startsWith(value);
        const aStartsWith = aTitleStartsWith || aKanaStartsWith || aAlphabetStartsWith;
        const bTitleStartsWith = b.title.toLowerCase().startsWith(value);
        const bKanaStartsWith = b.title_kana.toLowerCase().startsWith(value);
        const bAlphabetStartsWith = b.title_alphabet.toLowerCase().startsWith(value);
        const bStartsWith = bTitleStartsWith || bKanaStartsWith || bAlphabetStartsWith;
        if (aStartsWith && !bStartsWith) {
            return -1;
        }
        if (!aStartsWith && bStartsWith) {
            return 1;
        }
        return 0;
    });

    if (matched.length > 0) {
        matched.slice(0, 4).forEach((data, index) => {
            const iconEl = document.createElement('div');
            iconEl.innerHTML = icon;
            const textEl = document.createElement('div');
            textEl.textContent = data.title;
            const url = new URL('./law.html', window.location);
            url.searchParams.set('id', data.id);
            const itemEl = document.createElement('a');
            itemEl.href = url;
            itemEl.appendChild(iconEl);
            itemEl.appendChild(textEl);
            itemEl.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
            });
            searchResult.appendChild(itemEl);
        });
    }
    if (true) {
        const iconEl = document.createElement('div');
        iconEl.innerHTML = icon;
        const textEl = document.createElement('div');
        textEl.textContent = searchInput.value + 'を検索';
        const url = new URL('./search.html', window.location);
        url.searchParams.set('q', searchInput.value);
        const itemEl = document.createElement('a');
        itemEl.href = url;
        itemEl.appendChild(iconEl);
        itemEl.appendChild(textEl);
        itemEl.addEventListener('mouseenter', () => {
            selectedIndex = searchResult.children.length - 1;
            updateSelection();
        });
        searchResult.appendChild(itemEl);
    }

    selectedIndex = 0;
    updateSelection();
}

function updateSelection() {
    const links = searchResult.querySelectorAll('a');
    links.forEach((link, index) => {
        if (index === selectedIndex) {
            link.classList.add('selected');
        } else {
            link.classList.remove('selected');
        }
    });
}
