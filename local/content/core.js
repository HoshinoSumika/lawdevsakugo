import { Device } from '/lib/device.js';
import { Message } from '/lib/message.js';

import { Route } from '/global/route.js';
import { Service } from '/global/service.js';

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

async function init() {
    const id = Route.getLawId();
    if (!id) {
        Message.error('法令IDが指定されていません。');
        return;
    }

    const law = await Service.getLawFullText(id);
    if (!law) {
        Message.error('データを取得できませんでした。');
        return;
    }

    const content = document.querySelector('#content');
    content.innerHTML = law;
    document.title = content.querySelector('.Law > .LawBody > .LawTitle')?.textContent || '';
}
