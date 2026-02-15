import { Device } from '/global/device.js?v=20260213';
import { Service } from '/global/service.js?v=20260213';
import { Theme } from '/global/theme.js?v=20260213';

let searchInput;
let searchExec;
let searchFilterContainer;
let searchFilterUnderline;
let searchMessage;
let searchResult;

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();

    searchInput = document.querySelector('#search-input');
    searchExec = document.querySelector('#search-exec');
    searchFilterContainer = document.querySelector('#search-filter-container');
    searchMessage = document.querySelector('#search-message');
    searchResult = document.querySelector('#search-result');

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (document.activeElement === searchInput) {
                searchInput.blur();
            }
            exec();
        }
    });
    searchExec.addEventListener('click', () => {
        exec();
    });

    const filters = searchFilterContainer.querySelectorAll('.search-filter-item');
    filters[0].classList.add('current');
    Array.from(filters).forEach((filter) => {
        filter.addEventListener('click', () => {
            Array.from(filters).forEach((item) => {
                item.classList.remove('current');
            });
            filter.classList.add('current');
            move();
            update();
        });
    });

    move();

    sync();

    resize();
});

window.addEventListener('load', () => {
    Device.disableHoverOnTouch();
    Device.disableBodyScrollOnApple(document.querySelector('#content'));
});

window.addEventListener('popstate', () => {
    sync();
});

window.addEventListener('resize', () => {
    resize();
});

function resize() {
    if (window.innerWidth < 1080) {
        searchResult.classList.add('mobile');
        searchResult.classList.remove('desktop');
    } else {
        searchResult.classList.add('desktop');
        searchResult.classList.remove('mobile');
    }
}

async function exec() {
    const value = searchInput.value;
    const url = new URL(window.location.href);
    url.searchParams.set('q', value);
    window.history.replaceState(null, '', url);
    await search();
    update();
}

async function sync() {
    const query = new URLSearchParams(window.location.search).get('q');
    searchInput.value = query;
    await search();
    update();
}

let result;
let searchVersion = 0;
let renderVersion = 0;

async function search() {
    searchVersion = searchVersion + 1;
    const currentVersion = searchVersion;

    const query = new URLSearchParams(window.location.search).get('q');

    searchResult.innerHTML = '';
    searchMessage.textContent = '検索中...';
    searchMessage.style.display = '';

    try {
        const r = await Service.search(query);
        if (currentVersion !== searchVersion) {
            return;
        }
        result = r;
        renderVersion = currentVersion;
    } catch {
        if (currentVersion !== searchVersion) {
            return;
        }
        result = null;
        renderVersion = currentVersion;
    }
}

function update() {
    if (renderVersion !== searchVersion) {
        return;
    }

    document.querySelector('#content').scrollTop = 0;
    searchResult.innerHTML = '';

    if (!result) {
        reset();
        searchMessage.textContent = 'データを取得できませんでした。';
        return;
    }
    if (result.total_count === 0) {
        reset();
        searchMessage.textContent = '検索結果が見つかりませんでした。';
        return;
    }

    let laws = result.laws.slice();
    const order = ['Constitution', 'Act', 'CabinetOrder', 'ImperialOrder', 'MinisterialOrdinance', 'Rule', 'Misc'];
    laws.sort((a, b) => {
        const ai = order.indexOf(a.law_info.law_type);
        const bi = order.indexOf(b.law_info.law_type);
        return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
    });

    const filterMap = {
        Constitution: 'search-filter-item-constitution',
        Act: 'search-filter-item-act',
        CabinetOrder: 'search-filter-item-cabinet-order',
        ImperialOrder: 'search-filter-item-imperial-order',
        MinisterialOrdinance: 'search-filter-item-ministerial-ordinance',
        Rule: 'search-filter-item-rule',
        Misc: 'search-filter-item-misc'
    };

    const idToType = Object.fromEntries(Object.entries(filterMap).map(([type, id]) => {
        return [id, type];
    }));

    const existingTypes = new Set(result.laws.map((data) => data.law_info.law_type));

    Object.entries(filterMap).forEach(([type, id]) => {
        const filter = searchFilterContainer.querySelector('#' + id);
        if (!existingTypes.has(type)) {
            if (filter.classList.contains('current')) {
                filter.classList.remove('current');
                searchFilterContainer.querySelectorAll('.search-filter-item')[0].classList.add('current');
            }
            filter.style.display = 'none';
        } else {
            filter.style.display = '';
        }
    });

    move();

    const current = searchFilterContainer.querySelector('.current');
    const activeType = current ? idToType[current.id] : null;

    if (activeType) {
        laws = laws.filter((data) => {
            return data.law_info.law_type === activeType;
        });
    }

    searchMessage.textContent = 'total : ' + result.total_count + ', ' + 'count : ' + result.count;
    searchMessage.style.display = 'none';

    const fragment = document.createDocumentFragment();

    laws.forEach((data) => {
        const item = document.createElement('a');
        const url = new URL('./law.html', window.location);
        url.searchParams.set('id', data.law_info.law_id);
        item.href = url;

        const title = document.createElement('div');
        title.textContent = data.revision_info.law_title;

        const num = document.createElement('div');
        num.textContent = data.law_info.law_num;

        item.appendChild(title);
        item.appendChild(num);
        fragment.appendChild(item);
    });

    searchResult.appendChild(fragment);
}

function reset() {
    const filters = searchFilterContainer.querySelectorAll('.search-filter-item');

    Array.from(filters).forEach((item) => {
        item.style.display = 'none';
        item.classList.remove('current');
    });

    filters[0].style.display = '';
    filters[0].classList.add('current');

    move();
}

function move() {
    const target = searchFilterContainer.querySelector('.current');

    if (!searchFilterUnderline) {
        searchFilterUnderline = document.createElement('div');
        searchFilterUnderline.id = 'search-filter-underline';
        searchFilterContainer.appendChild(searchFilterUnderline);
    }

    searchFilterUnderline.style.width = target.offsetWidth + 'px';
    searchFilterUnderline.style.transform = 'translateX(' + target.offsetLeft + 'px)';
}
