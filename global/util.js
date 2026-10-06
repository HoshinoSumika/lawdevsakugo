export const Util = {
    wrap,
    unwrap,
    mark,
    scroll,
};

const scrollTokenMap = new WeakMap();

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

function mark(element, value, className, ignoreSelector) {
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

    wrap(element, findRangeList(element.textContent, value), className);

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
