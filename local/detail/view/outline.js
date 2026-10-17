export const Outline = {
    init,
    toggle,
    update,
};

import { Dialog } from '/lib/dialog.js';

import { Config } from '/global/config.js';
import { Text } from '/global/text.js';

const TARGET_SELECTOR = [
    '.LawNum',
    '.MainProvision',
    '.MainProvision .PartTitle',
    '.MainProvision .ChapterTitle',
    '.MainProvision .SectionTitle',
    '.MainProvision .SubsectionTitle',
    '.MainProvision .DivisionTitle',
    '.SupplProvision .SupplProvisionLabel',
    '.AppdxTable .AppdxTableTitle',
    '.AppdxNote .AppdxNoteTitle',
    '.AppdxFig .AppdxFigTitle',
    '.AppdxStyle .AppdxStyleTitle',
].join(', ');
const STRUCTURE_SELECTOR = '.Part, .Chapter, .Section, .Subsection, .Division';
const DESKTOP_QUERY = '(min-width: 1080px)';
const JUMP_OFFSET = 16;
const CURRENT_OFFSET = 24;
const CURRENT_POSITION = 1 / 3;

let lawContent;
let lawContainer;
let desktopMedia;
let desktop;
let spacer;
let mobile;
let modal;
let tree;
let entryList = [];
let currentEntry = null;

function init(api) {
    lawContent = api.getContent();
    lawContainer = api.getContainer();

    tree = document.createElement('ul');
    tree.classList.add('outline-tree');

    desktop = document.createElement('div');
    desktop.classList.add('outline-desktop');
    lawContainer.insertBefore(desktop, lawContent);

    spacer = document.createElement('div');
    spacer.classList.add('outline-spacer');
    lawContainer.appendChild(spacer);

    mobile = document.createElement('div');
    mobile.classList.add('outline-mobile');

    modal = Dialog.createModal(mobile);
    modal.setPlacement('bottom');
    modal.setTitle(Text.getOutline());
    modal.enableCloseButton(hide);

    desktopMedia = window.matchMedia(DESKTOP_QUERY);
    desktopMedia.addEventListener('change', () => {
        moveTree();
    });
    moveTree();

    lawContainer.addEventListener('scroll', () => {
        sync(true);
    });
}

function toggle() {
    if (!desktopMedia.matches) {
        show();
        return;
    }
    Config.setOutline(!Config.getOutline());
    applySidebar();
}

function update() {
    entryList = buildEntryList();
    renderTree();
    setCurrent(findCurrentEntry());
    applySidebar();
}

function show() {
    reveal(false);
    modal.show();
}

function hide() {
    modal.hide();
}

function moveTree() {
    if (desktopMedia.matches) {
        hide();
        desktop.appendChild(tree);
    } else {
        mobile.appendChild(tree);
    }
    applySidebar();
}

function applySidebar() {
    const isShown = desktopMedia.matches && Config.getOutline();
    desktop.style.display = isShown ? '' : 'none';
    spacer.style.display = isShown ? '' : 'none';
    reveal(false);
}

function buildEntryList() {
    const law = lawContent.querySelector('.Law');
    if (!law) {
        return [];
    }
    return Array.from(law.querySelectorAll(TARGET_SELECTOR))
        .filter(target => target.offsetParent !== null)
        .map(target => ({ target, level: getLevel(target), item: buildItem(target) }));
}

function getLevel(target) {
    let level = 1;
    let structure = target.closest(STRUCTURE_SELECTOR);
    while (structure) {
        level = level + 1;
        structure = structure.parentElement.closest(STRUCTURE_SELECTOR);
    }
    return level;
}

function buildItem(target) {
    const item = document.createElement('div');
    item.classList.add('outline-item');
    item.textContent = getLabel(target);
    item.addEventListener('click', () => {
        if (!desktopMedia.matches) {
            hide();
        }
        lawContainer.scrollTop = target.offsetTop - JUMP_OFFSET;
    });
    return item;
}

function getLabel(target) {
    if (target.classList.contains('LawNum')) {
        return Text.getOutlineLawInfo();
    }
    if (target.classList.contains('MainProvision')) {
        return Text.getMainProvision();
    }
    const next = target.nextElementSibling;
    if (next && next.classList.contains('RelatedArticleNum')) {
        return target.textContent + next.textContent;
    }
    return target.textContent;
}

function renderTree() {
    const fragment = document.createDocumentFragment();
    const stack = [{ level: 0, node: null, branch: fragment }];
    entryList.forEach(entry => {
        while (stack[stack.length - 1].level >= entry.level) {
            stack.pop();
        }
        const parent = stack[stack.length - 1];
        if (!parent.branch) {
            parent.branch = document.createElement('ul');
            parent.node.appendChild(parent.branch);
        }
        const node = document.createElement('li');
        node.appendChild(entry.item);
        parent.branch.appendChild(node);
        stack.push({ level: entry.level, node, branch: null });
    });
    tree.replaceChildren(fragment);
}

function sync(isSmooth) {
    const entry = findCurrentEntry();
    if (entry === currentEntry) {
        return;
    }
    setCurrent(entry);
    reveal(isSmooth);
}

function findCurrentEntry() {
    const scrollTop = lawContainer.scrollTop;
    let current = null;
    for (const entry of entryList) {
        if (entry.target.offsetTop - CURRENT_OFFSET > scrollTop) {
            break;
        }
        current = entry;
    }
    return current;
}

function setCurrent(entry) {
    if (currentEntry) {
        currentEntry.item.classList.remove('current');
    }
    if (entry) {
        entry.item.classList.add('current');
    }
    currentEntry = entry;
}

function reveal(isSmooth) {
    if (!currentEntry) {
        return;
    }
    const scroll = desktopMedia.matches ? desktop : mobile.closest('.dialog-scroll');
    const item = currentEntry.item;
    const top = scroll.scrollTop
        + item.getBoundingClientRect().top - scroll.getBoundingClientRect().top
        - scroll.clientHeight * CURRENT_POSITION + item.offsetHeight / 2;
    scroll.scrollTo({ top, behavior: isSmooth ? 'smooth' : 'auto' });
}
