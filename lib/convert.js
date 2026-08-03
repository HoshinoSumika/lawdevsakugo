export const Convert = {
    date,
    wrap,
};

function date(dateStr) {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (year >= 2019) {
        const reiwaYear = year - 2018;
        const reiwaLabel = reiwaYear === 1 ? '令和元年' : `令和${reiwaYear}年`;
        return `${reiwaLabel}${month}月${day}日`;
    } else if (year >= 1989) {
        const heiseiYear = year - 1988;
        const heiseiLabel = heiseiYear === 1 ? '平成元年' : `平成${heiseiYear}年`;
        return `${heiseiLabel}${month}月${day}日`;
    } else if (year >= 1926) {
        const showaYear = year - 1925;
        const showaLabel = showaYear === 1 ? '昭和元年' : `昭和${showaYear}年`;
        return `${showaLabel}${month}月${day}日`;
    } else if (year >= 1912) {
        const taishoYear = year - 1911;
        const taishoLabel = taishoYear === 1 ? '大正元年' : `大正${taishoYear}年`;
        return `${taishoLabel}${month}月${day}日`;
    } else if (year >= 1868) {
        const meijiYear = year - 1867;
        const meijiLabel = meijiYear === 1 ? '明治元年' : `明治${meijiYear}年`;
        return `${meijiLabel}${month}月${day}日`;
    } else {
        return `${year}年${month}月${day}日`;
    }
}

function wrap(element, ranges, className) {
    if (!element || ranges.length === 0) return;

    const owner = element.ownerDocument;
    const textNodes = [];
    collectTextNodes(element, textNodes);

    let offset = 0;
    textNodes.forEach(textNode => {
        const nodeStart = offset;
        const nodeEnd = nodeStart + textNode.data.length;
        offset = nodeEnd;

        const parts = ranges
            .filter(range => range.start < nodeEnd && range.end > nodeStart)
            .map(range => ({
                start: Math.max(range.start, nodeStart) - nodeStart,
                end: Math.min(range.end, nodeEnd) - nodeStart,
            }));
        if (parts.length === 0) return;

        const fragment = owner.createDocumentFragment();
        let cursor = 0;
        parts.forEach(part => {
            fragment.append(textNode.data.slice(cursor, part.start));
            const wrapper = owner.createElement('span');
            wrapper.className = className;
            wrapper.textContent = textNode.data.slice(part.start, part.end);
            fragment.appendChild(wrapper);
            cursor = part.end;
        });
        fragment.append(textNode.data.slice(cursor));
        textNode.replaceWith(fragment);
    });
}

function collectTextNodes(node, result) {
    node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            result.push(child);
        } else {
            collectTextNodes(child, result);
        }
    });
}
