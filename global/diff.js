export const Diff = {
    compare,
};

const MAX_EDIT_DISTANCE = 2000;
const MATCH_LENGTH_MIN = 4;
const BOUNDARY_SCORE_MAP = { '。': 2, '）': 2, '　': 2, '、': 1 };

function compare(oldList, newList) {
    const rowList = [];
    buildPairList(oldList, newList).forEach(({ oldItem, newItem }) => {
        if (!oldItem || !newItem) {
            rowList.push({ oldItem, newItem, oldRangeList: null, newRangeList: null });
            return;
        }
        if (normalizeText(oldItem.text) === normalizeText(newItem.text)) {
            return;
        }
        const { oldRangeList, newRangeList } = diffText(oldItem.text, newItem.text, MAX_EDIT_DISTANCE);
        rowList.push({ oldItem, newItem, oldRangeList, newRangeList });
    });
    return rowList;
}

function normalizeText(text) {
    return text.normalize('NFC').replace(/\s+/gu, '');
}

function buildPairList(oldList, newList) {
    const oldLength = oldList.length;
    const newLength = newList.length;
    const lcsList = Array.from({ length: oldLength + 1 }, () => new Uint32Array(newLength + 1));

    for (let i = oldLength - 1; i >= 0; i--) {
        for (let j = newLength - 1; j >= 0; j--) {
            if (oldList[i].key === newList[j].key) {
                lcsList[i][j] = lcsList[i + 1][j + 1] + 1;
            } else {
                lcsList[i][j] = Math.max(lcsList[i + 1][j], lcsList[i][j + 1]);
            }
        }
    }

    const pairList = [];
    let i = 0;
    let j = 0;
    while (i < oldLength || j < newLength) {
        if (i < oldLength && j < newLength && oldList[i].key === newList[j].key) {
            pairList.push({ oldItem: oldList[i], newItem: newList[j] });
            i = i + 1;
            j = j + 1;
        } else if (j >= newLength || (i < oldLength && lcsList[i + 1][j] >= lcsList[i][j + 1])) {
            pairList.push({ oldItem: oldList[i], newItem: null });
            i = i + 1;
        } else {
            pairList.push({ oldItem: null, newItem: newList[j] });
            j = j + 1;
        }
    }
    return pairList;
}

function diffText(oldText, newText, maxEditDistance) {
    const oldCharList = oldText.split('');
    const newCharList = newText.split('');

    let prefix = 0;
    while (prefix < oldCharList.length && prefix < newCharList.length && oldCharList[prefix] === newCharList[prefix]) {
        prefix = prefix + 1;
    }

    let suffix = 0;
    while (suffix < oldCharList.length - prefix && suffix < newCharList.length - prefix
        && oldCharList[oldCharList.length - 1 - suffix] === newCharList[newCharList.length - 1 - suffix]) {
        suffix = suffix + 1;
    }

    const middleList = findOperationList(
        oldCharList.slice(prefix, oldCharList.length - suffix),
        newCharList.slice(prefix, newCharList.length - suffix),
        maxEditDistance,
    );
    if (!middleList) {
        return { oldRangeList: null, newRangeList: null };
    }

    const prefixList = oldCharList.slice(0, prefix).map(value => ({ type: 'equal', value }));
    const suffixList = oldCharList.slice(oldCharList.length - suffix).map(value => ({ type: 'equal', value }));
    const operationList = prefixList.concat(middleList, suffixList);
    moveHunkToBoundary(operationList);

    const oldRangeList = [];
    const newRangeList = [];
    let oldOffset = 0;
    let newOffset = 0;
    absorbShortMatch(operationList).forEach(operation => {
        if (operation.type === 'equal') {
            oldOffset = oldOffset + 1;
            newOffset = newOffset + 1;
        } else if (operation.type === 'delete') {
            appendRange(oldRangeList, oldOffset, oldOffset + 1);
            oldOffset = oldOffset + 1;
        } else {
            appendRange(newRangeList, newOffset, newOffset + 1);
            newOffset = newOffset + 1;
        }
    });
    return { oldRangeList, newRangeList };
}

function appendRange(rangeList, start, end) {
    const previous = rangeList[rangeList.length - 1];
    if (previous && previous.end === start) {
        previous.end = end;
        return;
    }
    rangeList.push({ start, end });
}

function moveHunkToBoundary(operationList) {
    let index = 0;
    while (index < operationList.length) {
        if (operationList[index].type === 'equal') {
            index = index + 1;
            continue;
        }
        let end = index;
        while (end < operationList.length && operationList[end].type !== 'equal') {
            end = end + 1;
        }
        const type = operationList[index].type;
        if (operationList.slice(index, end).every(operation => operation.type === type)) {
            index = slideHunk(operationList, index, end);
        } else {
            index = end;
        }
    }
}

function slideHunk(operationList, start, end) {
    const hunk = { start, end };
    while (canSlideLeft(operationList, hunk)) {
        slideLeft(operationList, hunk);
    }

    let bestStep = 0;
    let bestScore = scoreHunk(operationList, hunk);
    let step = 0;
    while (canSlideRight(operationList, hunk)) {
        slideRight(operationList, hunk);
        step = step + 1;
        const score = scoreHunk(operationList, hunk);
        if (score >= bestScore) {
            bestScore = score;
            bestStep = step;
        }
    }

    while (step > bestStep) {
        slideLeft(operationList, hunk);
        step = step - 1;
    }
    return hunk.end;
}

function canSlideLeft(operationList, hunk) {
    const before = operationList[hunk.start - 1];
    return Boolean(before) && before.type === 'equal' && before.value === operationList[hunk.end - 1].value;
}

function canSlideRight(operationList, hunk) {
    const after = operationList[hunk.end];
    return Boolean(after) && after.type === 'equal' && after.value === operationList[hunk.start].value;
}

function slideLeft(operationList, hunk) {
    const type = operationList[hunk.start].type;
    operationList[hunk.end - 1] = { type: 'equal', value: operationList[hunk.end - 1].value };
    operationList[hunk.start - 1] = { type, value: operationList[hunk.start - 1].value };
    hunk.start = hunk.start - 1;
    hunk.end = hunk.end - 1;
}

function slideRight(operationList, hunk) {
    const type = operationList[hunk.start].type;
    operationList[hunk.start] = { type: 'equal', value: operationList[hunk.start].value };
    operationList[hunk.end] = { type, value: operationList[hunk.end].value };
    hunk.start = hunk.start + 1;
    hunk.end = hunk.end + 1;
}

function scoreHunk(operationList, hunk) {
    const before = operationList[hunk.start - 1];
    const last = operationList[hunk.end - 1];
    const beforeScore = before ? BOUNDARY_SCORE_MAP[before.value] || 0 : 2;
    return beforeScore + (BOUNDARY_SCORE_MAP[last.value] || 0);
}

function absorbShortMatch(operationList) {
    const resultList = [];
    let matchList = [];
    operationList.forEach(operation => {
        if (operation.type === 'equal') {
            matchList.push(operation);
            return;
        }
        if (resultList.length > 0 && matchList.length < MATCH_LENGTH_MIN) {
            matchList = matchList.flatMap(({ value }) => [{ type: 'delete', value }, { type: 'insert', value }]);
        }
        matchList.forEach(match => {
            resultList.push(match);
        });
        resultList.push(operation);
        matchList = [];
    });
    return resultList.concat(matchList);
}

function findOperationList(oldCharList, newCharList, maxEditDistance) {
    const limit = Math.min(oldCharList.length + newCharList.length, maxEditDistance);
    const traceList = [];
    let previous = new Int32Array(1);

    for (let distance = 0; distance <= limit; distance++) {
        const current = new Int32Array(distance + 1);
        for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
            const index = (diagonal + distance) / 2;
            const left = previous[index - 1];
            const right = previous[index];
            let oldIndex = diagonal === -distance || (diagonal !== distance && left < right)
                ? right
                : left + 1;
            let newIndex = oldIndex - diagonal;

            while (oldIndex < oldCharList.length && newIndex < newCharList.length && oldCharList[oldIndex] === newCharList[newIndex]) {
                oldIndex = oldIndex + 1;
                newIndex = newIndex + 1;
            }
            current[index] = oldIndex;

            if (oldIndex >= oldCharList.length && newIndex >= newCharList.length) {
                traceList.push(current);
                return backtrack(traceList, oldCharList, newCharList);
            }
        }
        traceList.push(current);
        previous = current;
    }
    return null;
}

function backtrack(traceList, oldCharList, newCharList) {
    const operationList = [];
    let oldIndex = oldCharList.length;
    let newIndex = newCharList.length;

    for (let distance = traceList.length - 1; distance > 0; distance--) {
        const previous = traceList[distance - 1];
        const diagonal = oldIndex - newIndex;
        const index = (diagonal + distance) / 2;
        const left = previous[index - 1];
        const right = previous[index];
        const previousDiagonal = diagonal === -distance || (diagonal !== distance && left < right)
            ? diagonal + 1
            : diagonal - 1;
        const previousOldIndex = previous[(previousDiagonal + distance - 1) / 2];
        const previousNewIndex = previousOldIndex - previousDiagonal;

        while (oldIndex > previousOldIndex && newIndex > previousNewIndex) {
            operationList.push({ type: 'equal', value: oldCharList[oldIndex - 1] });
            oldIndex = oldIndex - 1;
            newIndex = newIndex - 1;
        }

        if (oldIndex === previousOldIndex) {
            operationList.push({ type: 'insert', value: newCharList[newIndex - 1] });
            newIndex = newIndex - 1;
        } else {
            operationList.push({ type: 'delete', value: oldCharList[oldIndex - 1] });
            oldIndex = oldIndex - 1;
        }
    }

    while (oldIndex > 0 && newIndex > 0) {
        operationList.push({ type: 'equal', value: oldCharList[oldIndex - 1] });
        oldIndex = oldIndex - 1;
        newIndex = newIndex - 1;
    }

    return operationList.reverse();
}
