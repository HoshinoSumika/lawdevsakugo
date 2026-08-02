export const Mokuji = {
    init,
    toggle,
    update,
    clear,
};

import { Shell } from '/lib/shell.js?v=20260101';
import { Storage } from '/lib/storage.js?v=20260101';

let api;
let lawContent;
let lawContainer;
let mokujiSpacer;
let mokujiContent;
let mokujiSidebar;
let mokujiModal;
let mokujiModalContent;

function init(value) {
    api = value;
    lawContent = api.getContent();
    lawContainer = api.getContainer();

    mokujiSpacer = document.querySelector('#mokuji-spacer');

    mokujiContent = document.createElement('div');
    mokujiContent.classList.add('mokuji-content');

    mokujiSidebar = document.createElement('div');
    mokujiSidebar.classList.add('mokuji-sidebar');
    lawContainer.insertBefore(mokujiSidebar, lawContent);

    mokujiModalContent = document.createElement('div');

    mokujiModal = Shell.createModal(mokujiModalContent);
    mokujiModal.setPlacement('bottom');
    mokujiModal.setHeight('100%');
    mokujiModal.setTitle('目次');
    mokujiModal.enableCloseButton(hide);

    resize();
    window.addEventListener('resize', () => {
        resize();
    });

    lawContainer.addEventListener('scroll', () => {
        sync(true);
    });
}

function toggle() {
    if (isOpen) {
        hide();
        if (!isUnderThreshold()) {
            Storage.set('mokuji', false);
        }
    } else {
        show();
        if (!isUnderThreshold()) {
            Storage.remove('mokuji');
        }
    }
}

function update() {
    generate();
    sync(false);
}

function clear() {
    mokujiContent.innerHTML = '';
}

const scrollOffset = 16;
let elements = [];

function generate() {
    const law = lawContent.querySelector('.Law');
    if (!law) {
        return;
    }
    mokujiContent.innerHTML = '';
    const fragment = document.createDocumentFragment();

    let str = '.LawNum, .MainProvision, ';
    str += '.MainProvision .PartTitle, .MainProvision .ChapterTitle, .MainProvision .SectionTitle, ';
    str += '.MainProvision .SubsectionTitle, .MainProvision .DivisionTitle, ';
    str += '.SupplProvision .SupplProvisionLabel, ';
    str += '.AppdxTable .AppdxTableTitle, ';
    str += '.AppdxNote .AppdxNoteTitle, ';
    str += '.AppdxFig .AppdxFigTitle, ';
    str += '.AppdxStyle .AppdxStyleTitle';
    elements = Array.from(law.querySelectorAll(str));

    elements = elements.filter(el => {
        return el.offsetParent !== null;
    });

    const hasPart = elements.some(el => el.classList.contains('PartTitle'));
    const levelOffset = hasPart ? 1 : 0;

    const rootUl = document.createElement('ul');
    const stack = [{ level: 0, ul: rootUl }];

    let nextLevel = 1;

    elements.forEach((el, i) => {
        const level = nextLevel;
        const nextEl = elements[i + 1];
        if (nextEl) {
            if (nextEl.classList.contains('PartTitle')) {
                nextLevel = 2;
            } else if (nextEl.classList.contains('ChapterTitle')) {
                nextLevel = 2 + levelOffset;
            } else if (nextEl.classList.contains('SectionTitle')) {
                nextLevel = 3 + levelOffset;
            } else if (nextEl.classList.contains('SubsectionTitle')) {
                nextLevel = 4 + levelOffset;
            } else if (nextEl.classList.contains('DivisionTitle')) {
                nextLevel = 5 + levelOffset;
            } else {
                nextLevel = 1;
            }
        }

        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        const li = document.createElement('li');
        const item = document.createElement('div');

        const isLawNum = el.classList.contains('LawNum');
        const isMainProvision = el.classList.contains('MainProvision');
        const isSupplProvisionAppdxTableTitle = el.classList.contains('SupplProvisionAppdxTableTitle');
        const isAppdxTableTitle = el.classList.contains('AppdxTableTitle');
        const isAppdxNoteTitle = el.classList.contains('AppdxNoteTitle');
        const isAppdxFigTitle = el.classList.contains('AppdxFigTitle');
        const isAppdxStyleTitle = el.classList.contains('AppdxStyleTitle');
        if (isLawNum) {
            item.textContent = '法令情報';
        } else if (isMainProvision) {
            item.textContent = '本　則';
        } else if (isSupplProvisionAppdxTableTitle || isAppdxTableTitle || isAppdxNoteTitle || isAppdxFigTitle || isAppdxStyleTitle) {
            const nextEl = el.nextElementSibling;
            if (nextEl.classList.contains('RelatedArticleNum')) {
                item.textContent = el.textContent + nextEl.textContent;
            } else {
                item.textContent = el.textContent;
            }
        } else {
            item.textContent = el.textContent;
        }

        item.addEventListener('click', () => {
            if (isUnderThreshold()) {
                hide();
            }
            lawContainer.scrollTo({ top: el.offsetTop - scrollOffset, behavior: 'auto' });
        });

        li.appendChild(item);
        stack[stack.length - 1].ul.appendChild(li);
        if (nextEl && nextLevel > level) {
            const childUl = document.createElement('ul');
            li.appendChild(childUl);
            stack.push({ level: level, ul: childUl });
        }
    });

    fragment.appendChild(rootUl);
    mokujiContent.appendChild(fragment);
}

function sync(isSmoothScroll) {
    const current = lawContainer.scrollTop;
    const items = mokujiContent.querySelectorAll('div');
    let index = -1;

    elements.forEach((el, i) => {
        const position = el.offsetTop - scrollOffset - 8;
        if (current >= position) {
            index = i;
        }
    });

    items.forEach(item => {
        item.classList.remove('current');
    });

    if (index !== -1 && items[index]) {
        items[index].classList.add('current');
    }

    scroll(isSmoothScroll);
}

function scroll(isSmoothScroll) {
    const item = mokujiContent.querySelector('.current');
    if (!item) {
        return;
    }
    const contentRect = mokujiContent.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const position = mokujiContent.scrollTop + itemRect.top - contentRect.top - mokujiContent.clientHeight / 3 + item.clientHeight / 2;
    if (isSmoothScroll) {
        mokujiContent.scrollTo({ top: position, behavior: 'smooth' });
    } else {
        mokujiContent.scrollTo({ top: position, behavior: 'auto' });
    }
}

let isOpen = false;
let wasOpen = true;
let wasDesktop = null;

function resize() {
    const isDesktop = !isUnderThreshold();
    if (wasDesktop === isDesktop) {
        return;
    }

    if (isDesktop) {
        mokujiContent.classList.add('desktop');
        mokujiContent.classList.remove('mobile');
        mokujiSidebar.appendChild(mokujiContent);

        if (wasOpen && Storage.get('mokuji', true)) {
            show();
        } else {
            hide();
        }
    } else {
        mokujiContent.classList.add('mobile');
        mokujiContent.classList.remove('desktop');
        mokujiModalContent.appendChild(mokujiContent);

        if (wasDesktop !== null) {
            wasOpen = isOpen;
        }
        hide();
        if (wasDesktop !== null) {
            api.restoreScroll();
        }
    }

    wasDesktop = isDesktop;
}

function isUnderThreshold() {
    return window.innerWidth < 1080;
}

function show() {
    isOpen = true;

    if (isUnderThreshold()) {
        mokujiSidebar.style.display = 'none';
        mokujiSpacer.style.display = 'none';
        mokujiModal.show();
    } else {
        mokujiModal.hide();
        mokujiSidebar.style.display = '';
        mokujiSpacer.style.display = '';
    }

    scroll(false);
}

function hide() {
    isOpen = false;

    mokujiModal.hide();
    mokujiSidebar.style.display = 'none';
    mokujiSpacer.style.display = 'none';
}
