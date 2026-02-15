export const Message = {
    alert,
    confirm,
    notify,
};

import { Interface } from '/global/interface.js?v=20260213';

function alert(title, message, exec) {
    const container = document.createElement('div');
    container.className = 'message-alert-container';
    const content = document.createElement('div');
    content.className = 'message-alert-content';
    const bar = document.createElement('div');
    bar.className = 'message-alert-bar';
    const cancel = document.createElement('div');
    cancel.className = 'message-alert-cancel';
    const ok = document.createElement('div');
    ok.className = 'message-alert-ok';
    bar.appendChild(ok);
    bar.appendChild(cancel);
    container.appendChild(content);
    container.appendChild(bar);

    const interface = Interface.createModal(content);
}

function confirm(title, message, exec) {
}

function notify(message) {
}
