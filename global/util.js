export const Util = {
    wrap,
    unwrap,
    mark,
    nest,
    scroll,
    date,
};

const scrollTokenMap = new WeakMap();

const ERA_LIST = [
    { name: '令和', start: '2019-05-01' },
    { name: '平成', start: '1989-01-08' },
    { name: '昭和', start: '1926-12-25' },
    { name: '大正', start: '1912-07-30' },
    { name: '明治', start: '1868-01-25' },
];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function wrap(element, rangeList, className) {
    if (rangeList.length === 0) {
        return element;
    }

    const owner = element.ownerDocument;
    const textNodeList = [];
    collectTextNodes(element, textNodeList);

    let offset = 0;
    textNodeList.forEach(textNode => {
        const nodeStart = offset;
        const nodeEnd = nodeStart + textNode.data.length;
        offset = nodeEnd;

        const partList = rangeList
            .filter(range => range.start < nodeEnd && range.end > nodeStart)
            .map(range => ({
                start: Math.max(range.start, nodeStart) - nodeStart,
                end: Math.min(range.end, nodeEnd) - nodeStart,
            }));
        if (partList.length === 0) {
            return;
        }

        const fragment = owner.createDocumentFragment();
        let cursor = 0;
        partList.forEach(part => {
            const before = textNode.data.slice(cursor, part.start);
            if (before) {
                fragment.append(before);
            }
            const wrapper = owner.createElement('span');
            wrapper.className = className;
            wrapper.textContent = textNode.data.slice(part.start, part.end);
            fragment.appendChild(wrapper);
            cursor = part.end;
        });
        const rest = textNode.data.slice(cursor);
        if (rest) {
            fragment.append(rest);
        }
        textNode.replaceWith(fragment);
    });
    return element;
}

function collectTextNodes(node, textNodeList) {
    node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            textNodeList.push(child);
        } else {
            collectTextNodes(child, textNodeList);
        }
    });
}

function unwrap(element, className) {
    const wrapperList = Array.from(element.querySelectorAll('.' + className));
    if (element.classList.contains(className)) {
        wrapperList.unshift(element);
    }
    wrapperList.forEach(wrapper => {
        wrapper.replaceWith(...wrapper.childNodes);
    });
    return element;
}

function mark(element, value, className, ignoreSelector, exclusionList = []) {
    if (!value) {
        return element;
    }

    const ignoredList = [];
    if (ignoreSelector) {
        element.querySelectorAll(ignoreSelector).forEach(node => {
            const placeholder = element.ownerDocument.createComment('');
            node.replaceWith(placeholder);
            ignoredList.push({ placeholder, node });
        });
    }

    const text = element.textContent;
    const exclusionRangeList = exclusionList.flatMap(exclusion => findRangeList(text, exclusion));
    const rangeList = findRangeList(text, value).filter(range => {
        return !exclusionRangeList.some(exclusionRange => exclusionRange.start <= range.start && range.end <= exclusionRange.end);
    });
    wrap(element, rangeList, className);

    ignoredList.forEach(({ placeholder, node }) => {
        placeholder.replaceWith(node);
    });
    return element;
}

function findRangeList(text, value) {
    const rangeList = [];
    let start = text.indexOf(value);
    while (start !== -1) {
        const end = start + value.length;
        rangeList.push({ start, end });
        start = text.indexOf(value, end);
    }
    return rangeList;
}

function nest(element, pair, quote, className) {
    const owner = element.ownerDocument;
    const textNodeList = [];
    collectTextNodes(element, textNodeList);

    const text = textNodeList.map(textNode => textNode.data).join('');
    const depthList = findDepthList(text, pair, quote);

    let offset = 0;
    textNodeList.forEach(textNode => {
        const length = textNode.data.length;
        if (depthList.subarray(offset, offset + length).every(depth => depth === 0)) {
            offset = offset + length;
            return;
        }

        const fragment = owner.createDocumentFragment();
        let start = 0;
        while (start < length) {
            const depth = depthList[offset + start];
            let end = start + 1;
            while (end < length && depthList[offset + end] === depth) {
                end = end + 1;
            }
            const value = textNode.data.slice(start, end);
            if (depth === 0) {
                fragment.append(value);
            } else {
                const wrapper = owner.createElement('span');
                wrapper.className = className;
                wrapper.dataset.depth = depth;
                wrapper.textContent = value;
                fragment.appendChild(wrapper);
            }
            start = end;
        }
        textNode.replaceWith(fragment);
        offset = offset + length;
    });
    return element;
}

function findDepthList(text, pair, quote) {
    const [open, close] = pair;
    const [quoteOpen, quoteClose] = quote;
    const ignoredList = new Uint8Array(text.length);

    let quoteStart = -1;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === quoteOpen && quoteStart < 0) {
            quoteStart = i;
        } else if (text[i] === quoteClose && quoteStart >= 0) {
            const openList = [];
            for (let j = quoteStart + 1; j < i; j++) {
                if (text[j] === open) {
                    openList.push(j);
                } else if (text[j] === close) {
                    if (openList.length > 0) {
                        openList.pop();
                    } else {
                        ignoredList[j] = 1;
                    }
                }
            }
            openList.forEach(j => {
                ignoredList[j] = 1;
            });
            quoteStart = -1;
        }
    }

    const edgeList = new Int8Array(text.length);
    const openList = [];
    for (let i = 0; i < text.length; i++) {
        if (ignoredList[i]) {
            continue;
        }
        if (text[i] === open) {
            openList.push(i);
        } else if (text[i] === close && openList.length > 0) {
            edgeList[openList.pop()] = 1;
            edgeList[i] = -1;
        }
    }

    const depthList = new Uint16Array(text.length);
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        if (edgeList[i] === 1) {
            depth = depth + 1;
        }
        depthList[i] = depth;
        if (edgeList[i] === -1) {
            depth = depth - 1;
        }
    }
    return depthList;
}

function scroll(container, toY, duration) {
    const token = {};
    scrollTokenMap.set(container, token);

    const fromY = container.scrollTop;
    const distance = toY - fromY;
    const start = performance.now();

    function step(time) {
        if (scrollTokenMap.get(container) !== token) {
            return;
        }
        const progress = Math.min((time - start) / duration, 1);
        container.scrollTop = fromY + distance * ease(progress);
        if (progress < 1) {
            requestAnimationFrame(step);
            return;
        }
        scrollTokenMap.delete(container);
    }

    requestAnimationFrame(step);
}

function ease(progress) {
    if (progress < 0.5) {
        return 8 * progress ** 4;
    }
    return 1 - ((-2 * progress + 2) ** 4) / 2;
}

function date(value) {
    const match = DATE_PATTERN.exec(value);
    if (!match) {
        return '';
    }

    const year = parseInt(match[1], 10);
    const suffix = parseInt(match[2], 10) + '月' + parseInt(match[3], 10) + '日';

    const era = ERA_LIST.find(item => value >= item.start);
    if (!era) {
        return year + '年' + suffix;
    }

    const eraYear = year - Number(era.start.slice(0, 4)) + 1;
    const label = eraYear === 1 ? '元年' : eraYear + '年';
    return era.name + label + suffix;
}
