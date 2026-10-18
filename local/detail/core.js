import { Device } from '/lib/device.js';
import { Dialog } from '/lib/dialog.js';
import { Flex } from '/lib/flex.js';
import { Message } from '/lib/message.js';

import { Config } from '/global/config.js';
import { Convert } from '/global/convert.js';
import { Route } from '/global/route.js';
import { Service } from '/global/service.js';
import { Text } from '/global/text.js';
import { Util } from '/global/util.js';

import { Compare } from './view/compare.js';
import { History } from './view/history.js';
import { Info } from './view/info.js';
import { Menu } from './view/menu.js';
import { Nav } from './view/nav.js';
import { Outline } from './view/outline.js';
import { Preference } from './view/preference.js';
import { Search } from './view/search.js';

const PAREN_PAIR = ['（', '）'];
const QUOTE_PAIR = ['「', '」'];

const contentEl = document.querySelector('#content');

const api = {
    getContent: () => contentEl,
    getContainer: () => contentEl.parentElement,
    getLawId: () => Route.getLawId(),
    getLawTitle: () => findLawTitle(contentEl),
    onCompareSelect: () => Compare.show(),
    onHistorySelect: () => History.show(),
    onInfoSelect: () => Info.show(),
    onMenuSelect: () => Menu.show(),
    onOutlineSelect: () => Outline.toggle(),
    onPreferenceSelect: () => Preference.show(),
    onRevisionSelect: (id) => move(id),
    onSearchSelect: () => Search.show(),
    onWordChange: () => changeWord(),
    onArticlePlacementChange: () => arrangeArticle(contentEl),
    onSupplProvisionChange: () => Outline.update(),
    arrangeArticle: (root) => arrangeArticle(root),
};

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

window.addEventListener('popstate', () => {
    load();
});

let messageMissingId;
let messageLoadError;
let messageLoading;
let messageRepeal = null;

let contentVersion = 0;

async function init() {
    Dialog.setColor('var(--color-black)', 'var(--color-white)', 'rgba(0,0,0,0.32)');
    Flex.setColor('var(--color-black)', 'var(--color-white)');
    Message.setColor('var(--color-black)', 'var(--color-white)', 'rgba(0,0,0,0)');

    messageMissingId = Message.error(Text.getLawIdMissing());
    messageMissingId.disableClose();
    messageLoadError = Message.error(Text.getLawLoadFailed());
    messageLoadError.disableClose();
    messageLoading = Message.wait();

    Compare.init(api);
    History.init(api);
    Info.init(api);
    Menu.init(api);
    Nav.init(api);
    Outline.init(api);
    Preference.init(api);
    Search.init(api);

    await load();
}

function move(id) {
    window.history.pushState(null, '', Route.getLawHref(id));
    load();
}

async function load() {
    contentVersion = contentVersion + 1;
    const functionVersion = contentVersion;

    contentEl.innerHTML = '';
    Outline.update();

    if (messageRepeal) {
        messageRepeal.hide();
        messageRepeal = null;
    }

    const id = Route.getLawId();
    if (!id) {
        messageLoading.hide();
        messageLoadError.hide();
        messageMissingId.show();
        return;
    }

    messageLoading.show();
    const law = await Service.getLawFullText(id);
    if (functionVersion !== contentVersion) {
        return;
    }
    if (!law) {
        messageLoading.hide();
        messageMissingId.hide();
        messageLoadError.show();
        return;
    }

    messageMissingId.hide();
    messageLoadError.hide();

    const template = document.createElement('template');
    template.innerHTML = law;
    markSentence(template.content);
    arrangeArticle(template.content);
    contentEl.replaceChildren(template.content);

    const title = findLawTitle(contentEl);
    document.title = title;
    Nav.setTitle(title);
    Outline.update();
    addRecent(id.split('_')[0], title);

    messageLoading.hide();

    const repealStatus = contentEl.querySelector('.Law')?.dataset.revision_info_repeal_status;
    if (repealStatus && repealStatus !== 'None') {
        messageRepeal = Message.alert(Text.getRepealAlert(repealStatus));
        messageRepeal.show();
    }
}

function findLawTitle(root) {
    return root.querySelector('.Law > .LawBody > .LawTitle')?.textContent || '';
}

function addRecent(id, title) {
    if (!title) {
        return;
    }
    const recentList = Config.getRecentList().filter(recent => recent.id !== id);
    Config.setRecentList(recentList.concat({ id, title }));
}

function markSentence(root) {
    root.querySelectorAll('.Sentence').forEach(sentence => {
        Util.nest(sentence, PAREN_PAIR, QUOTE_PAIR, 'paren');
    });
    markWord(root);
}

function markWord(root) {
    const wordList = Config.getWordList();
    findSentenceParentSet(root).forEach(parent => {
        wordList.forEach((word, index) => {
            Util.mark(parent, word.value, 'word word-' + index, 'rt', word.exclusionList);
        });
    });
}

function changeWord() {
    Util.unwrap(contentEl, 'word');
    markWord(contentEl);
}

function findSentenceParentSet(root) {
    return new Set(Array.from(root.querySelectorAll('.Sentence'), sentence => sentence.parentElement));
}

function arrangeArticle(root) {
    Convert.setArticleCaption(root, Config.getArticlePlacement() === 'reverse', Config.getSingleParagraphNum() === 'shown');
}
