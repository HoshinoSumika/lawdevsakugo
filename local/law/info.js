export const Info = {
    init,
    show,
    update,
    clear,
};

import { Interface } from '/global/interface.js?v=20260213';
import { Kaiseki } from '/global/kaiseki.js?v=20260213';

let interfaceView;
let lawContent;
let infoContent;

function init(el) {
    lawContent = el;

    infoContent = document.createElement('div');

    interfaceView = Interface.createModal(infoContent);
    interfaceView.enableTitleBar();
    interfaceView.setTitle('法令詳細');
    interfaceView.getOverlay().classList.add('law-overlay');
    interfaceView.getOverlay().classList.add('info-overlay');
    interfaceView.getContainer().classList.add('law-container');
    interfaceView.getContainer().classList.add('info-container');
    interfaceView.getContent().classList.add('info-content');

    interfaceView.onShow(() => {
        requestAnimationFrame(() => {
            interfaceView.getContainer().classList.add('show');
        });
    });
    interfaceView.onHide(() => {
        interfaceView.getContainer().classList.remove('show');
    });
}

function show() {
    interfaceView.show();
}

function update() {
    updateContent();
}

function clear() {
    infoContent.innerHTML = 'Loading...';
}

function updateContent() {
    infoContent.innerHTML = '';

    const infoEl = lawContent.querySelector('.Law');
    if (!infoEl) {
        const message = document.createElement('div');
        message.style.padding = '8px 16px 8px 16px';
        message.textContent = 'データを取得できませんでした。';
        infoContent.appendChild(message);
        return;
    }

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const dataAttributes = infoEl.dataset;
    let value;

    value = dataAttributes['revision_info_law_title'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '現行法令名';
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['revision_info_abbrev'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '略称法令名';
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['law_info_law_num'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '法令番号';
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['law_info_promulgation_date'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '公布日';
        const td = document.createElement('td');
        td.textContent = Kaiseki.wareki(value);
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['revision_info_amendment_enforcement_date'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '施行日';
        const td = document.createElement('td');
        td.textContent = Kaiseki.wareki(value);
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['revision_info_amendment_law_title'] + '（' + dataAttributes['revision_info_amendment_law_num'] + '）';
    if (dataAttributes['revision_info_amendment_law_title'] && dataAttributes['revision_info_amendment_law_num']) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '改正法令';
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['revision_info_repeal_status'];
    if (value !== 'None') {
        let str = '';
        if (value === 'Repeal') {
            str = '廃止';
        } else if (value === 'Expire') {
            str = '失効';
        } else if (value === 'Suspend') {
            str = '停止';
        } else if (value === 'LossOfEffectiveness') {
            str = '実効性喪失';
        }
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '状態';
        const td = document.createElement('td');
        td.textContent = str;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    infoContent.appendChild(table);
}
