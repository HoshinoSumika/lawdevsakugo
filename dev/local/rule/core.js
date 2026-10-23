import { Device } from '/lib/device.js';

import { Route } from '/global/route.js';

import { Law } from './law.js';
import { Pdf } from './pdf.js';

const LEVEL_LABEL_MAP = { error: 'エラー', warn: '要確認', info: '情報' };

let source = null;
let result = null;

let statusEl;
let batchStatusEl;
let batchEl;
let settingSection;
let idInput;
let kanaInput;
let categoryInput;
let amendSelect;
let dateInput;
let checkEl;
let detailLink;

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

function init() {
    const content = document.querySelector('#content');
    content.classList.add('dev-content');
    content.appendChild(buildTitle('規則の変換'));
    content.appendChild(buildFileSection());
    content.appendChild(buildBatchSection());
    content.appendChild(buildSettingSection());
    content.appendChild(buildCheckSection());
    content.appendChild(buildSaveSection());
}

function buildFileSection() {
    const section = buildSection('PDF');

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.className = 'rule-file';
    input.addEventListener('change', () => {
        if (input.files[0]) {
            load(input.files[0]);
        }
    });
    section.appendChild(input);

    statusEl = buildNote('裁判所の規則集（courts.go.jp）から保存した PDF を選ぶ。文字は pdf.js で取り出す。');
    section.appendChild(statusEl);
    return section;
}

function buildBatchSection() {
    const section = buildSection('まとめて変換');

    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.className = 'rule-file';
    input.addEventListener('change', () => {
        convertFolder(Array.from(input.files));
    });
    section.appendChild(input);

    section.appendChild(buildNote('先に「node dev/download.mjs <規則集の一覧ページの URL> <保存先のフォルダー>」で PDF と list.json を保存し、そのフォルダーを選ぶ。保存先はリポジトリの外にする。'));
    batchStatusEl = buildNote('');
    section.appendChild(batchStatusEl);

    batchEl = document.createElement('div');
    batchEl.className = 'rule-batch';
    section.appendChild(batchEl);
    return section;
}

function buildSettingSection() {
    const section = buildSection('設定');
    settingSection = section;

    idInput = buildInput('text');
    section.appendChild(buildField('法令 ID', 'URL（/<法令 ID>）と保存するファイル名になる。空なら題名の法令番号から作る。', idInput));

    kanaInput = buildInput('text');
    section.appendChild(buildField('よみ', 'XML の LawTitle の Kana と、改正履歴の law_title_kana に入る。', kanaInput));

    categoryInput = buildInput('text');
    section.appendChild(buildField('分類', '改正履歴の category に入る（民事・刑事など）。', categoryInput));

    amendSelect = document.createElement('select');
    amendSelect.className = 'rule-input';
    renderAmendOption([]);
    section.appendChild(buildField('今の版の改正規則', '法令詳細と改正履歴に出る改正規則で、版の ID にもなる。附則から選ぶ。', amendSelect));

    dateInput = buildInput('date');
    section.appendChild(buildField('今の版の施行日', '法令詳細の施行日と、改正履歴の日付になる。', dateInput));

    [idInput, kanaInput, categoryInput, amendSelect, dateInput].forEach(element => {
        element.addEventListener('change', () => {
            convert();
        });
    });
    return section;
}

function buildCheckSection() {
    const section = buildSection('検査');
    checkEl = document.createElement('div');
    checkEl.className = 'rule-check-area';
    checkEl.appendChild(buildNote('PDF を選ぶと、ここに検査の結果が出る。'));
    section.appendChild(checkEl);
    return section;
}

function buildSaveSection() {
    const section = buildSection('保存');

    const group = buildGroup();
    group.appendChild(buildButton('XML を保存', () => save('xml')));
    group.appendChild(buildButton('JSON を保存', () => save('json')));
    detailLink = buildLink('detail で開く', '#');
    detailLink.target = '_blank';
    group.appendChild(detailLink);
    section.appendChild(group);

    section.appendChild(buildNote('2つのファイルを data/rule/ に置くと、detail で開ける（dev モードでは /detail.html?id=<法令 ID>）。'));
    return section;
}

async function convertFolder(fileList) {
    batchEl.innerHTML = '';
    const pdfList = fileList.filter(file => /\.pdf$/i.test(file.name));
    const listFile = fileList.find(file => file.name === 'list.json');
    let itemList = [];
    if (listFile) {
        try {
            itemList = JSON.parse(await listFile.text()).itemList;
        } catch (e) {
            console.error(e);
        }
    }

    const rowList = itemList.map(item => ({
        title: item.title,
        url: item.url,
        kind: item.kind,
        file: pdfList.find(file => file.name === item.file) || null,
    }));
    pdfList.forEach(file => {
        if (!rowList.some(row => row.file === file)) {
            rowList.push({ title: '', url: '', kind: 'pdf', file });
        }
    });

    const table = document.createElement('table');
    table.className = 'rule-batch-table';
    const head = document.createElement('tr');
    ['規則', '法令 ID', 'エラー', '要確認', 'エラーの内容', ''].forEach(text => {
        head.appendChild(buildCell('th', text));
    });
    table.appendChild(head);
    batchEl.appendChild(table);

    let cleanCount = 0;
    let skipCount = 0;
    for (let index = 0; index < rowList.length; index++) {
        batchStatusEl.textContent = '変換中 ' + (index + 1) + ' / ' + rowList.length;
        const tr = await buildBatchRow(rowList[index]);
        table.appendChild(tr);
        if (tr.dataset.state === 'clean') {
            cleanCount = cleanCount + 1;
        } else if (tr.dataset.state === 'skip') {
            skipCount = skipCount + 1;
        }
    }
    batchStatusEl.textContent = rowList.length + ' 件のうち、エラーなし ' + cleanCount + ' 件・未対応 ' + skipCount + ' 件（設定の不足はエラーに数えない）';
}

async function buildBatchRow(row) {
    const tr = document.createElement('tr');
    const titleCell = buildCell('td', '');
    if (row.url) {
        const link = document.createElement('a');
        link.href = row.url;
        link.target = '_blank';
        link.textContent = row.title || row.url;
        titleCell.appendChild(link);
    } else {
        titleCell.textContent = row.file.name;
    }
    tr.appendChild(titleCell);

    if (!row.file) {
        tr.dataset.state = 'skip';
        const cell = buildCell('td', row.kind === 'html' ? '未対応（HTML のページ）' : 'PDF がフォルダーにない');
        cell.colSpan = 5;
        tr.appendChild(cell);
        return tr;
    }

    let rowResult;
    try {
        rowResult = Law.create(await Pdf.read(row.file), { lawId: '', titleKana: '', category: '', amendLawNum: '', enforcementDate: '' });
    } catch (e) {
        console.error(e);
        tr.dataset.state = 'skip';
        const cell = buildCell('td', '読み込めなかった（' + e.message + '）');
        cell.colSpan = 5;
        tr.appendChild(cell);
        return tr;
    }

    const errorList = rowResult.reportList.filter(report => report.level === 'error' && report.title !== '設定の不足');
    const warnList = rowResult.reportList.filter(report => report.level === 'warn');
    tr.dataset.state = errorList.length === 0 ? 'clean' : 'error';
    if (!row.url && rowResult.lawTitle) {
        titleCell.textContent = rowResult.lawTitle + '（' + row.file.name + '）';
    }
    tr.appendChild(buildCell('td', rowResult.lawId || ''));
    const errorCell = buildCell('td', String(countItem(errorList)));
    errorCell.classList.toggle('error', errorList.length > 0);
    tr.appendChild(errorCell);
    tr.appendChild(buildCell('td', String(countItem(warnList))));
    tr.appendChild(buildCell('td', errorList.map(report => report.title).join('・')));

    const buttonCell = buildCell('td', '');
    buttonCell.appendChild(buildButton('開く', () => {
        load(row.file);
        settingSection.scrollIntoView({ block: 'start' });
    }));
    tr.appendChild(buttonCell);
    return tr;
}

function countItem(reportList) {
    return reportList.reduce((total, report) => total + report.itemList.length, 0);
}

async function load(file) {
    source = null;
    result = null;
    idInput.value = '';
    kanaInput.value = '';
    dateInput.value = '';
    renderAmendOption([]);
    statusEl.textContent = '読み込み中…';
    try {
        source = await Pdf.read(file);
    } catch (e) {
        console.error(e);
        statusEl.textContent = 'PDF を読み込めなかった（' + e.message + '）';
        return;
    }
    statusEl.textContent = file.name + '（' + source.lineList.length + ' 行）';
    convert();
}

function convert() {
    if (!source) {
        return;
    }
    result = Law.create(source, readSetting());
    if (!idInput.value) {
        idInput.value = result.lawId || '';
    }
    renderAmendOption(result.amendLawNumList);
    renderCheck(result.reportList);
    detailLink.href = Route.getLawHref(result.lawId || '');
}

function readSetting() {
    return {
        lawId: idInput.value.trim(),
        titleKana: kanaInput.value.trim(),
        category: categoryInput.value.trim(),
        amendLawNum: amendSelect.value,
        enforcementDate: dateInput.value,
    };
}

function renderAmendOption(amendLawNumList) {
    const selected = amendSelect.value;
    amendSelect.innerHTML = '';
    amendSelect.appendChild(buildOption('', '（選ぶ）'));
    amendLawNumList.forEach(amendLawNum => {
        amendSelect.appendChild(buildOption(amendLawNum, amendLawNum));
    });
    amendSelect.value = amendLawNumList.includes(selected) ? selected : '';
}

function renderCheck(reportList) {
    checkEl.innerHTML = '';

    const countMap = { error: 0, warn: 0 };
    reportList.forEach(report => {
        if (report.level in countMap) {
            countMap[report.level] += report.itemList.length;
        }
    });
    const summary = document.createElement('div');
    summary.className = 'rule-summary';
    summary.classList.toggle('error', countMap.error > 0);
    summary.textContent = 'エラー ' + countMap.error + ' 件・要確認 ' + countMap.warn + ' 件';
    checkEl.appendChild(summary);

    reportList.forEach(report => {
        const details = document.createElement('details');
        details.className = 'rule-check ' + report.level;
        details.open = report.level !== 'info';

        const title = document.createElement('summary');
        title.className = 'rule-check-title';
        title.textContent = '［' + LEVEL_LABEL_MAP[report.level] + '］' + report.title + '（' + report.itemList.length + '）';
        details.appendChild(title);

        if (report.description) {
            details.appendChild(buildNote(report.description));
        }

        const list = document.createElement('ul');
        list.className = 'rule-check-list';
        report.itemList.forEach(text => {
            const item = document.createElement('li');
            item.textContent = text;
            list.appendChild(item);
        });
        details.appendChild(list);
        checkEl.appendChild(details);
    });
}

async function save(type) {
    if (!result || !result.xml) {
        return;
    }
    const fileName = result.lawId + '.' + type;
    const blob = new Blob([type === 'xml' ? result.xml : result.json], { type: type === 'xml' ? 'application/xml' : 'application/json' });
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({ suggestedName: fileName });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error(e);
            }
        }
        return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

function buildTitle(text) {
    const title = document.createElement('h1');
    title.className = 'dev-title';
    title.textContent = text;
    return title;
}

function buildSection(text) {
    const section = document.createElement('section');
    section.className = 'dev-section';

    const category = document.createElement('h2');
    category.className = 'dev-category';
    category.textContent = text;
    section.appendChild(category);

    return section;
}

function buildGroup() {
    const group = document.createElement('div');
    group.className = 'dev-group';
    return group;
}

function buildButton(text, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dev-button';
    button.textContent = text;
    button.addEventListener('click', () => onClick());
    return button;
}

function buildLink(text, href) {
    const link = document.createElement('a');
    link.className = 'dev-button';
    link.href = href;
    link.textContent = text;
    return link;
}

function buildNote(text) {
    const note = document.createElement('div');
    note.className = 'dev-note';
    note.textContent = text;
    return note;
}

function buildInput(type) {
    const input = document.createElement('input');
    input.type = type;
    input.className = 'rule-input';
    return input;
}

function buildCell(tag, text) {
    const cell = document.createElement(tag);
    cell.textContent = text;
    return cell;
}

function buildOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
}

function buildField(label, description, input) {
    const field = document.createElement('label');
    field.className = 'rule-field';

    const name = document.createElement('span');
    name.className = 'rule-label';
    name.textContent = label;
    field.appendChild(name);
    field.appendChild(input);
    field.appendChild(buildNote(description));

    return field;
}
