import { Device } from '/lib/device.js?v=20260101';
import { Frame } from '/lib/frame.js?v=20260101';
import { Message } from '/lib/message.js?v=20260101';
import { Shell } from '/lib/shell.js?v=20260101';
import { Storage } from '/lib/storage.js?v=20260101';

import { Route } from '/global/route.js?v=20260101';
import { Theme } from '/global/theme.js?v=20260101';

let logEl;

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();

    logEl = document.querySelector('#dev-log');

    initRoute();
    initFrame();
    initShell();
    initMessage();
});

window.addEventListener('load', () => {
    Device.disableHoverOnTouch();
});

let routeStateEl;

function initRoute() {
    routeStateEl = document.querySelector('#route-dev-state');
    updateRouteState();

    bind('#route-dev-toggle', () => {
        if (Storage.get('dev', false)) {
            Storage.remove('dev');
        } else {
            Storage.set('dev', true);
        }
        updateRouteState();
        log("Storage 'dev' = " + Storage.get('dev', false));
    });
}

function updateRouteState() {
    const state = Storage.get('dev', false) ? 'dev モード：ON' : 'dev モード：OFF';
    routeStateEl.textContent = state + '　法令へのリンク例：' + Route.getLawHref('129AC0000000089');
}

function initFrame() {
    bind('#frame-panel-top', (button) => openFramePanel(button, 'top'));
    bind('#frame-panel-bottom', (button) => openFramePanel(button, 'bottom'));
    bind('#frame-panel-left', (button) => openFramePanel(button, 'left'));
    bind('#frame-panel-right', (button) => openFramePanel(button, 'right'));
    bind('#frame-modal', () => openFrameModal());
    bind('#frame-index', () => log('Frame.getIndex() → ' + Frame.getIndex()));
}

function openFramePanel(button, placement) {
    const content = createBox('Frame.createPanel', 'anchor: ' + placement);
    const close = createButton('閉じる');
    content.appendChild(close);

    const panel = Frame.createPanel(content);
    panel.setBackground('var(--color-white)');
    panel.setBorder('1px solid var(--color-border)');
    panel.setRadius('var(--radius-normal)');
    panel.setShadow('0 8px 32px rgba(0,0,0,0.18)');
    panel.setTransition('opacity var(--transition-duration)');
    panel.anchor(button, placement, 8);
    panel.show();
    log('Frame.createPanel anchor=' + placement);

    close.addEventListener('click', () => {
        panel.getPanel().addEventListener('transitionend', () => {
            panel.destroy();
            log('Frame panel destroy');
        }, { once: true });
        panel.hide();
    });
}

function openFrameModal() {
    const content = createBox('Frame.createModal', '背景のクリックでも閉じる');
    const close = createButton('閉じる');
    content.appendChild(close);

    const modal = Frame.createModal(content);
    modal.setTransition('opacity var(--transition-duration)');
    modal.setOverlayBackground('var(--color-translucent-overlay)');
    modal.setModalBackground('var(--color-white)');
    modal.setModalBorder('1px solid var(--color-border)');
    modal.setModalRadius('var(--radius-normal)');
    modal.setModalShadow('0 8px 32px rgba(0,0,0,0.18)');
    modal.show();
    log('Frame.createModal');

    const dismiss = () => {
        modal.getPanel().addEventListener('transitionend', () => {
            modal.destroy();
            log('Frame modal destroy');
        }, { once: true });
        modal.hide();
    };

    modal.setDismiss(dismiss);
    close.addEventListener('click', dismiss);
}

function initShell() {
    bind('#shell-panel', () => openShellPanel());
    bind('#shell-modal-center', () => openShellModal('center'));
    bind('#shell-modal-left', () => openShellModal('left'));
    bind('#shell-modal-right', () => openShellModal('right'));
    bind('#shell-modal-top', () => openShellModal('top'));
    bind('#shell-modal-bottom', () => openShellModal('bottom'));
}

let shellPanelCount = 0;

function openShellPanel() {
    shellPanelCount = shellPanelCount + 1;
    const number = shellPanelCount;

    const content = createBox('Shell.createPanel', 'タイトルのドラッグで移動', '右下の角でリサイズ');

    const panel = Shell.createPanel(content);
    panel.setTitle('パネル ' + number);
    panel.enableBackButton(() => log('Shell panel ' + number + ' back'));
    panel.enableCloseButton(() => {
        panel.destroy();
        log('Shell panel ' + number + ' destroy');
    });
    panel.show();
    log('Shell.createPanel ' + number);
}

const shellModals = {};

function openShellModal(placement) {
    if (!shellModals[placement]) {
        shellModals[placement] = createShellModal(placement);
        log('Shell.createModal ' + placement + '（生成）');
    }
    shellModals[placement].show();
    log('Shell modal ' + placement + ' show');
}

function createShellModal(placement) {
    const content = createBox('Shell.createModal', 'placement: ' + placement);

    const modal = Shell.createModal(content);
    if (placement !== 'center') {
        modal.setPlacement(placement);
    }
    modal.setTitle('モーダル（' + placement + '）');
    modal.enableBackButton(() => log('Shell modal ' + placement + ' back'));
    modal.enableCloseButton(() => {
        modal.hide();
        log('Shell modal ' + placement + ' hide');
    });
    modal.addLeftButton('左ボタン', () => log('Shell modal ' + placement + ' left button'));
    modal.addRightButton('キャンセル', () => modal.hide());
    modal.addRightButton('OK', () => {
        modal.hide();
        log('Shell modal ' + placement + ' OK');
    });

    const clearNav = createButton('nav をクリア');
    clearNav.addEventListener('click', () => {
        modal.clearNav();
        modal.disableBackButton();
        modal.disableCloseButton();
        log('Shell modal ' + placement + ' clearNav');
    });
    content.appendChild(clearNav);

    const restoreNav = createButton('nav を戻す');
    restoreNav.addEventListener('click', () => {
        modal.clearNav();
        modal.enableBackButton(() => log('Shell modal ' + placement + ' back'));
        modal.enableCloseButton(() => {
            modal.hide();
            log('Shell modal ' + placement + ' hide');
        });
        modal.addLeftButton('左ボタン', () => log('Shell modal ' + placement + ' left button'));
        modal.addRightButton('キャンセル', () => modal.hide());
        modal.addRightButton('OK', () => {
            modal.hide();
            log('Shell modal ' + placement + ' OK');
        });
        log('Shell modal ' + placement + ' restoreNav');
    });
    content.appendChild(restoreNav);

    return modal;
}

let progressHandle = null;

function initMessage() {
    Message.tip(document.querySelector('#message-tip'), 'これが tip です');

    bind('#message-toast', () => {
        Message.toast('保存しました。');
        log('Message.toast（3秒で消える）');
    });

    bind('#message-toast-long', () => {
        Message.toast('折り返しの確認用に長めの文章を表示します。画面幅から32pxを引いた幅で折り返され、×ボタンは右端に残ります。');
        log('Message.toast 長文');
    });

    bind('#message-warning', () => {
        Message.warning('通信が不安定です。');
        log('Message.warning（4秒で消える）');
    });

    bind('#message-error', () => {
        Message.error('データを取得できませんでした。');
        log('Message.error（×ボタンでのみ消える）');
    });

    bind('#message-progress-open', () => {
        if (progressHandle) {
            log('Message.progress は表示中');
            return;
        }
        progressHandle = Message.progress('読み込み中...');
        log('Message.progress 開始');
    });

    bind('#message-progress-close', () => {
        if (!progressHandle) {
            log('Message.progress は未表示');
            return;
        }
        progressHandle.close();
        progressHandle = null;
        log('Message.progress 終了');
    });

    bind('#message-stack', () => {
        Message.toast('toast');
        Message.warning('warning');
        Message.error('error');
        Message.progress('progress');
        log('4種を同時に表示');
    });
}

function bind(selector, onClick) {
    const button = document.querySelector(selector);
    button.addEventListener('click', () => onClick(button));
}

function createBox(...lines) {
    const box = document.createElement('div');
    box.classList.add('dev-box');
    for (const line of lines) {
        const div = document.createElement('div');
        div.textContent = line;
        box.appendChild(div);
    }
    return box;
}

function createButton(text) {
    const button = document.createElement('div');
    button.classList.add('dev-button');
    button.textContent = text;
    return button;
}

function log(text) {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    logEl.textContent = time + '  ' + text + '\n' + logEl.textContent;
}
