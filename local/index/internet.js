export const Internet = {
    search,
};

import { Service } from '/global/service.js';

const TYPE_ORDER = ['Constitution', 'Act', 'CabinetOrder', 'ImperialOrder', 'MinisterialOrdinance', 'Rule', 'Misc'];

const resultMap = new Map();

async function search(query, limit) {
    const key = limit + ':' + query;
    if (resultMap.has(key)) {
        return resultMap.get(key);
    }

    const data = await Service.search(query, limit);
    if (!data || !Array.isArray(data.laws)) {
        return null;
    }

    const result = build(data, query);
    resultMap.set(key, result);
    return result;
}

function build(data, query) {
    const entryList = data.laws.map((law, index) => {
        const info = law.revision_info;
        const nameList = [info.law_title].concat(info.abbrev ? info.abbrev.split(',') : []);
        return {
            law: {
                id: law.law_info.law_id,
                title: info.law_title,
                num: law.law_info.law_num,
                type: law.law_info.law_type,
                repealStatus: info.repeal_status,
                isRepealed: Boolean(info.repeal_status) && info.repeal_status !== 'None',
                isUnenforced: info.current_revision_status === 'UnEnforced',
            },
            level: getMatchLevel(nameList, query),
            index,
        };
    });
    entryList.sort(compareEntry);

    return {
        totalCount: data.total_count,
        lawList: entryList.map(entry => entry.law),
    };
}

function compareEntry(a, b) {
    return Number(a.law.isRepealed) - Number(b.law.isRepealed)
        || b.level - a.level
        || getTypeOrder(a.law.type) - getTypeOrder(b.law.type)
        || a.law.title.length - b.law.title.length
        || a.index - b.index;
}

function getTypeOrder(type) {
    const index = TYPE_ORDER.indexOf(type.split(',')[0]);
    return index === -1 ? TYPE_ORDER.length : index;
}

function getMatchLevel(nameList, query) {
    let level = 0;
    nameList.forEach(name => {
        if (name === query) {
            level = Math.max(level, 3);
        } else if (name.startsWith(query)) {
            level = Math.max(level, 2);
        } else if (name.includes(query)) {
            level = Math.max(level, 1);
        }
    });
    return level;
}
