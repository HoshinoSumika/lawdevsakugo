export const Mokuji = {
    init,
    register,
    toggle,
    update,
    clear,
};

import { Interface } from '/global/interface.js?v=20260213';

let interfaceView;
let lawContent;
let lawContainer;
let mokujiSpacer;
let mokujiContent;
let mokujiBar;

function init(el) {
    lawContent = el;
    lawContainer = el.parentNode;

    mokujiSpacer = document.querySelector('#mokuji-spacer');

    mokujiBar = document.querySelector('#mokuji-bar');

    mokujiContent = document.createElement('div');

    interfaceView = Interface.createModal(mokujiContent);
    interfaceView.enableTitleBar();
    interfaceView.setTitle('目次');
    interfaceView.getOverlay().classList.add('law-overlay');
    interfaceView.getOverlay().classList.add('mokuji-overlay');
    interfaceView.getContainer().classList.add('law-container');
    interfaceView.getContainer().classList.add('mokuji-container');
    interfaceView.getContent().classList.add('mokuji-content');

    interfaceView.onShow(() => {
        requestAnimationFrame(() => {
            interfaceView.getContainer().classList.add('show');
        });
    });
    interfaceView.onHide(() => {
        interfaceView.getContainer().classList.remove('show');
    });

    lawContent.parentNode.insertBefore(interfaceView.getOverlay(), lawContent);

    resize();
    window.addEventListener('resize', () => {
        resize();
    });

    lawContainer.addEventListener('scroll', () => {
        sync(true);
    });

    if (!isUnderThreshold()) {
        if (localStorage.getItem('mokuji') === 'false') {
            hide();
        }
    }
}

let restoreScrollPosition = () => {};

function register(name, func) {
    if (name === 'restoreScrollPosition') {
        restoreScrollPosition = func;
    }
}

function toggle() {
    if (interfaceView.getOverlay().style.pointerEvents === 'none') {
        show();
        if (!isUnderThreshold()) {
            localStorage.removeItem('mokuji');
        }
    } else {
        hide();
        if (!isUnderThreshold()) {
            localStorage.setItem('mokuji', 'false');
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
    str += '.AppdxNote .AppdxNoteTitle';
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
        if (isLawNum) {
            item.textContent = '法令情報';
        } else if (isMainProvision) {
            item.textContent = '本　則';
        } else if (isSupplProvisionAppdxTableTitle || isAppdxTableTitle || isAppdxNoteTitle) {
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

let wasShown = true;
let wasDesktop = false;

function resize() {
    const isMobile = isUnderThreshold();
    if (isMobile) {
        interfaceView.getOverlay().classList.add('overlay');
        interfaceView.getOverlay().classList.remove('desktop');
        interfaceView.getContainer().style.transition = '';
        interfaceView.enableTitleBar();
        mokujiContent.classList.add('mobile');
        mokujiContent.classList.remove('desktop');
    } else {
        interfaceView.getOverlay().classList.add('desktop');
        interfaceView.getOverlay().classList.remove('overlay');
        interfaceView.getContainer().style.transition = 'none';
        interfaceView.disableTitleBar();
        mokujiContent.classList.add('desktop');
        mokujiContent.classList.remove('mobile');
    }
    if (!isMobile && !wasDesktop) {
        if (localStorage.getItem('mokuji') === 'false') {
            hide();
        } else if (wasShown) {
            show();
        }
    } else if (isMobile && wasDesktop) {
        wasShown = interfaceView.getOverlay().style.display !== 'none';
        hide();
        interfaceView.getOverlay().style.display = 'none';
        mokujiSpacer.style.display = 'none';
        restoreScrollPosition();
    }
    wasDesktop = !isMobile;
}

function isUnderThreshold() {
    return window.innerWidth < 1080;
}

function show() {
    interfaceView.getOverlay().style.display = '';
    if (!isUnderThreshold()) {
        mokujiSpacer.style.display = '';
    }

    interfaceView.show();

    scroll(false);
}

function hide() {
    if (!isUnderThreshold()) {
        interfaceView.getOverlay().style.display = 'none';
    }
    mokujiSpacer.style.display = 'none';

    interfaceView.hide();
}
