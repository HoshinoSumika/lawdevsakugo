import { Device } from '/lib/device.js';
import { Dialog } from '/lib/dialog.js';
import { Frame } from '/lib/frame.js';
import { Message } from '/lib/message.js';

const overlayColor = 'rgba(0,0,0,0.32)';

const frameBackground = 'var(--color-white)';
const frameBorder = '1px solid var(--color-border)';
const frameRadius = 'var(--radius-large)';
const frameShadow = '0 8px 32px rgba(0,0,0,0.18)';
const frameTransition = 'opacity var(--transition-duration)';

let logEl;
let dialogModalMap = {};
let dialogPanelCount = 0;
let isDark = false;
let alertHandle = null;

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

function init() {
    applyDialogColor();

    const content = document.querySelector('#content');
    content.classList.add('dev-content');
    content.appendChild(buildTitle('テスト'));
    content.appendChild(buildFrameSection());
    content.appendChild(buildDialogSection());
    content.appendChild(buildMessageSection());
    content.appendChild(buildLogSection());
}

function buildFrameSection() {
    const section = buildSection('Frame');

    const group = buildGroup();
    for (const placement of ['top', 'bottom', 'left', 'right']) {
        group.appendChild(buildButton('createPanel / anchor ' + placement, (button) => openFramePanel(button, placement)));
    }
    group.appendChild(buildButton('createModal', () => openFrameModal()));
    group.appendChild(buildButton('getIndex', () => log('Frame.getIndex() → ' + Frame.getIndex())));
    section.appendChild(group);

    section.appendChild(buildNote('パネルは押したボタンを基準に配置される。モーダルは背景のクリックでも閉じる。'));
    return section;
}

function openFramePanel(button, placement) {
    const content = buildBox('Frame.createPanel', 'anchor: ' + placement);
    const panel = Frame.createPanel(content);

    content.appendChild(buildButton('閉じる', () => {
        panel.getPanel().addEventListener('transitionend', () => {
            panel.destroy();
            log('Frame panel destroy');
        }, { once: true });
        panel.hide();
    }));

    panel.setBackground(frameBackground);
    panel.setBorder(frameBorder);
    panel.setRadius(frameRadius);
    panel.setShadow(frameShadow);
    panel.setTransition(frameTransition);
    panel.anchor(button, placement, 8);
    panel.show();
    log('Frame.createPanel anchor=' + placement);
}

function openFrameModal() {
    const content = buildBox('Frame.createModal', '背景のクリックでも閉じる');
    const modal = Frame.createModal(content);

    const dismiss = () => {
        modal.getPanel().addEventListener('transitionend', () => {
            modal.destroy();
            log('Frame modal destroy');
        }, { once: true });
        modal.hide();
    };

    content.appendChild(buildButton('閉じる', dismiss));

    modal.setTransition(frameTransition);
    modal.setOverlayBackground(overlayColor);
    modal.setModalBackground(frameBackground);
    modal.setModalBorder(frameBorder);
    modal.setModalRadius(frameRadius);
    modal.setModalShadow(frameShadow);
    modal.setDismiss(dismiss);
    modal.show();
    log('Frame.createModal');
}

function buildDialogSection() {
    const section = buildSection('Dialog');

    const group = buildGroup();
    group.appendChild(buildButton('createPanel', () => openDialogPanel()));
    for (const placement of ['center', 'left', 'right', 'top', 'bottom']) {
        group.appendChild(buildButton('createModal / ' + placement, () => openDialogModal(placement)));
    }
    group.appendChild(buildButton('setColor を切り替える', () => switchDialogColor()));
    section.appendChild(group);

    section.appendChild(buildNote('パネルは連続で開くと位置がずれる。タイトルのドラッグで移動、四辺と四隅でリサイズ。モーダルは配置ごとに一度だけ生成して再利用する。色はページの色（style.css の変数）とダークを切り替えられ、切り替えるとモーダルを作り直す。行を増減したときに高さが動くのは、高さが固定されていない center だけ。'));
    return section;
}

function openDialogPanel() {
    dialogPanelCount = dialogPanelCount + 1;
    const number = dialogPanelCount;

    const content = buildBox('Dialog.createPanel', 'タイトルのドラッグで移動', '四辺と四隅でリサイズ');
    const panel = Dialog.createPanel(content);
    panel.setTitle('パネル ' + number);
    panel.enableBackButton(() => log('Dialog panel ' + number + ' back'));
    panel.enableCloseButton(() => {
        panel.destroy();
        log('Dialog panel ' + number + ' destroy');
    });
    panel.show();
    log('Dialog.createPanel ' + number);
}

function openDialogModal(placement) {
    if (!dialogModalMap[placement]) {
        dialogModalMap[placement] = buildDialogModal(placement);
        log('Dialog.createModal ' + placement + '（生成）');
    }
    dialogModalMap[placement].show();
    log('Dialog modal ' + placement + ' show');
}

function buildDialogModal(placement) {
    const content = buildBox('Dialog.createModal', 'placement: ' + placement);
    const lineArea = document.createElement('div');

    const modal = Dialog.createModal(content);
    modal.setPlacement(placement);
    modal.setTitle('モーダル（' + placement + '）');
    restoreDialogNav(modal, placement);

    const group = buildGroup();
    group.appendChild(buildButton('行を足す', () => {
        modal.fitHeight(() => {
            const line = document.createElement('div');
            line.textContent = '行 ' + (lineArea.children.length + 1);
            lineArea.appendChild(line);
        });
    }));
    group.appendChild(buildButton('行を減らす', () => {
        modal.fitHeight(() => {
            if (lineArea.lastChild) {
                lineArea.lastChild.remove();
            }
        });
    }));
    group.appendChild(buildButton('nav をクリア', () => {
        modal.clearNav();
        modal.disableBackButton();
        modal.disableCloseButton();
        log('Dialog modal ' + placement + ' clearNav');
    }));
    group.appendChild(buildButton('nav を戻す', () => {
        restoreDialogNav(modal, placement);
        log('Dialog modal ' + placement + ' restoreNav');
    }));
    content.appendChild(group);
    content.appendChild(lineArea);

    return modal;
}

function restoreDialogNav(modal, placement) {
    modal.clearNav();
    modal.enableBackButton(() => log('Dialog modal ' + placement + ' back'));
    modal.enableCloseButton(() => {
        modal.hide();
        log('Dialog modal ' + placement + ' hide');
    });
    modal.addLeftButton('左ボタン', () => log('Dialog modal ' + placement + ' left button'));
    modal.addRightButton('キャンセル', () => modal.hide());
    modal.addRightButton('OK', () => {
        modal.hide();
        log('Dialog modal ' + placement + ' OK');
    });
}

function switchDialogColor() {
    isDark = !isDark;
    applyDialogColor();

    for (const placement of Object.keys(dialogModalMap)) {
        dialogModalMap[placement].destroy();
    }
    dialogModalMap = {};

    log('Dialog.setColor ' + (isDark ? 'ダーク' : 'ページの色'));
}

function applyDialogColor() {
    if (isDark) {
        Dialog.setColor('#f5f5f5', '#242424', 'rgba(0,0,0,0.5)');
    } else {
        Dialog.setColor('var(--color-black)', 'var(--color-white)', overlayColor);
    }
}

function buildMessageSection() {
    const section = buildSection('Message');

    const group = buildGroup();

    const hint = buildButton('hint（ホバーで表示）', () => {});
    Message.hint(hint, 'これが hint です');
    group.appendChild(hint);

    group.appendChild(buildButton('info', () => {
        Message.info('保存しました。');
        log('Message.info');
    }));
    group.appendChild(buildButton('info / 長文', () => {
        Message.info('折り返しの確認用に長めの文章を表示します。最大512pxの幅で折り返され、×ボタンは右端に残ります。');
        log('Message.info 長文');
    }));
    group.appendChild(buildButton('warn', () => {
        Message.warn('通信が不安定です。');
        log('Message.warn');
    }));
    group.appendChild(buildButton('error', () => {
        Message.error('データを取得できませんでした。');
        log('Message.error');
    }));
    group.appendChild(buildButton('alert 開始', () => {
        if (alertHandle) {
            log('Message.alert は表示中');
            return;
        }
        alertHandle = Message.alert('読み込み中...');
        log('Message.alert 開始');
    }));
    group.appendChild(buildButton('alert 終了', () => {
        if (!alertHandle) {
            log('Message.alert は未表示');
            return;
        }
        alertHandle.close();
        alertHandle = null;
        log('Message.alert 終了');
    }));
    group.appendChild(buildButton('4種を同時に表示', () => {
        Message.info('info');
        Message.warn('warn');
        Message.error('error');
        Message.alert('alert');
        log('4種を同時に表示');
    }));
    section.appendChild(group);

    section.appendChild(buildNote('info・warn・error は1行なら4.8秒で自動的に消え、行が増えるほど長く表示される。ポインターを重ねている間は止まる。alert は自動では消えない。複数出すと新しいものが下に加わる。'));
    return section;
}

function buildLogSection() {
    const section = buildSection('ログ');

    logEl = document.createElement('div');
    logEl.className = 'dev-log';
    section.appendChild(logEl);

    return section;
}

function log(text) {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    logEl.textContent = time + '  ' + text + '\n' + logEl.textContent;
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
    button.addEventListener('click', () => onClick(button));
    return button;
}

function buildNote(text) {
    const note = document.createElement('div');
    note.className = 'dev-note';
    note.textContent = text;
    return note;
}

function buildBox(...textList) {
    const box = document.createElement('div');
    box.className = 'dev-box';
    for (const text of textList) {
        const line = document.createElement('div');
        line.textContent = text;
        box.appendChild(line);
    }
    return box;
}
