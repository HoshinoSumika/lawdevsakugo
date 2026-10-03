export const Diff = {
    compare,
};

const MAX_EDIT_DISTANCE = 1000;
const BOUNDARY_SCORES = { '。': 2, '）': 2, '　': 2, '、': 1 };

function compare(oldItems, newItems) {
    const rows = [];
    alignItems(oldItems, newItems).forEach(({ oldItem, newItem }) => {
        if (!oldItem || !newItem) {
            rows.push({ oldItem, newItem, oldRanges: null, newRanges: null });
            return;
        }
        if (normalizeText(oldItem.text) === normalizeText(newItem.text)) return;

        const { oldRanges, newRanges } = diffText(
            oldItem.text,
            newItem.text,
            MAX_EDIT_DISTANCE,
        );
        rows.push({ oldItem, newItem, oldRanges, newRanges });
    });
    return rows;
}

function normalizeText(text) {
    return text.normalize('NFC').replace(/\s+/gu, '');
}

function alignItems(oldItems, newItems) {
    const oldLength = oldItems.length;
    const newLength = newItems.length;
    const lcs = Array.from(
        { length: oldLength + 1 },
        () => new Uint32Array(newLength + 1),
    );

    for (let i = oldLength - 1; i >= 0; i--) {
        for (let j = newLength - 1; j >= 0; j--) {
            lcs[i][j] = oldItems[i].key === newItems[j].key
                ? lcs[i + 1][j + 1] + 1
                : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }

    const pairs = [];
    let i = 0;
    let j = 0;
    while (i < oldLength || j < newLength) {
        if (i < oldLength && j < newLength && oldItems[i].key === newItems[j].key) {
            pairs.push({ oldItem: oldItems[i], newItem: newItems[j] });
            i++;
            j++;
        } else if (j >= newLength || (i < oldLength && lcs[i + 1][j] >= lcs[i][j + 1])) {
            pairs.push({ oldItem: oldItems[i], newItem: null });
            i++;
        } else {
            pairs.push({ oldItem: null, newItem: newItems[j] });
            j++;
        }
    }
    return pairs;
}

function diffText(oldText, newText, maxEditDistance) {
    const oldChars = Array.from(oldText);
    const newChars = Array.from(newText);

    let prefix = 0;
    while (
        prefix < oldChars.length
        && prefix < newChars.length
        && oldChars[prefix] === newChars[prefix]
    ) {
        prefix++;
    }

    let suffix = 0;
    while (
        suffix < oldChars.length - prefix
        && suffix < newChars.length - prefix
        && oldChars[oldChars.length - 1 - suffix] === newChars[newChars.length - 1 - suffix]
    ) {
        suffix++;
    }

    const operations = diffChars(
        oldChars.slice(prefix, oldChars.length - suffix),
        newChars.slice(prefix, newChars.length - suffix),
        maxEditDistance,
    );
    if (!operations) {
        return { oldRanges: null, newRanges: null };
    }

    const prefixOperations = oldChars.slice(0, prefix).map(value => ({ type: 'equal', value }));
    const suffixOperations = oldChars.slice(oldChars.length - suffix).map(value => ({ type: 'equal', value }));
    const allOperations = slideHunks(prefixOperations.concat(operations, suffixOperations));

    const oldRanges = [];
    const newRanges = [];
    let oldOffset = 0;
    let newOffset = 0;

    allOperations.forEach(operation => {
        const length = operation.value.length;
        if (operation.type === 'equal') {
            oldOffset += length;
            newOffset += length;
        } else if (operation.type === 'delete') {
            appendRange(oldRanges, oldOffset, oldOffset + length);
            oldOffset += length;
        } else {
            appendRange(newRanges, newOffset, newOffset + length);
            newOffset += length;
        }
    });
    return { oldRanges, newRanges };
}

function slideHunks(operations) {
    let index = 0;
    while (index < operations.length) {
        if (operations[index].type === 'equal') {
            index++;
            continue;
        }
        let end = index;
        while (end < operations.length && operations[end].type !== 'equal') {
            end++;
        }
        const type = operations[index].type;
        if (operations.slice(index, end).every(operation => operation.type === type)) {
            slideHunk(operations, index, end);
        }
        index = end;
    }
    return operations;
}

function slideHunk(operations, start, end) {
    const hunk = { start, end };
    while (canSlideLeft(operations, hunk)) {
        slideLeft(operations, hunk);
    }

    let bestStep = 0;
    let bestScore = scoreHunk(operations, hunk);
    let step = 0;
    while (canSlideRight(operations, hunk)) {
        slideRight(operations, hunk);
        step++;
        const score = scoreHunk(operations, hunk);
        if (score >= bestScore) {
            bestScore = score;
            bestStep = step;
        }
    }

    while (step > bestStep) {
        slideLeft(operations, hunk);
        step--;
    }
}

function canSlideLeft(operations, hunk) {
    const before = operations[hunk.start - 1];
    return Boolean(before) && before.type === 'equal' && before.value === operations[hunk.end - 1].value;
}

function canSlideRight(operations, hunk) {
    const after = operations[hunk.end];
    return Boolean(after) && after.type === 'equal' && after.value === operations[hunk.start].value;
}

function slideLeft(operations, hunk) {
    const type = operations[hunk.start].type;
    operations[hunk.end - 1] = { type: 'equal', value: operations[hunk.end - 1].value };
    operations[hunk.start - 1] = { type, value: operations[hunk.start - 1].value };
    hunk.start--;
    hunk.end--;
}

function slideRight(operations, hunk) {
    const type = operations[hunk.start].type;
    operations[hunk.start] = { type: 'equal', value: operations[hunk.start].value };
    operations[hunk.end] = { type, value: operations[hunk.end].value };
    hunk.start++;
    hunk.end++;
}

function scoreHunk(operations, hunk) {
    const before = operations[hunk.start - 1];
    const last = operations[hunk.end - 1];
    const beforeScore = before ? BOUNDARY_SCORES[before.value] || 0 : 2;
    return beforeScore + (BOUNDARY_SCORES[last.value] || 0);
}

function appendRange(ranges, start, end) {
    const previous = ranges[ranges.length - 1];
    if (previous && previous.end === start) {
        previous.end = end;
    } else {
        ranges.push({ start, end });
    }
}

function diffChars(oldChars, newChars, maxEditDistance) {
    const limit = Math.min(oldChars.length + newChars.length, maxEditDistance);
    const trace = [];
    let previous = new Map([[1, 0]]);

    for (let distance = 0; distance <= limit; distance++) {
        const current = new Map();
        for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
            const left = previous.get(diagonal - 1) ?? -1;
            const right = previous.get(diagonal + 1) ?? -1;
            let oldIndex = diagonal === -distance || (diagonal !== distance && left < right)
                ? Math.max(0, right)
                : Math.max(0, left + 1);
            let newIndex = oldIndex - diagonal;

            while (
                oldIndex < oldChars.length
                && newIndex < newChars.length
                && oldChars[oldIndex] === newChars[newIndex]
            ) {
                oldIndex++;
                newIndex++;
            }
            current.set(diagonal, oldIndex);

            if (oldIndex >= oldChars.length && newIndex >= newChars.length) {
                trace.push(current);
                return backtrack(trace, oldChars, newChars);
            }
        }
        trace.push(current);
        previous = current;
    }
    return null;
}

function backtrack(trace, oldChars, newChars) {
    const operations = [];
    let oldIndex = oldChars.length;
    let newIndex = newChars.length;

    for (let distance = trace.length - 1; distance > 0; distance--) {
        const previous = trace[distance - 1];
        const diagonal = oldIndex - newIndex;
        const left = previous.get(diagonal - 1) ?? -1;
        const right = previous.get(diagonal + 1) ?? -1;
        const previousDiagonal = diagonal === -distance || (diagonal !== distance && left < right)
            ? diagonal + 1
            : diagonal - 1;
        const previousOldIndex = Math.max(0, previous.get(previousDiagonal) ?? 0);
        const previousNewIndex = previousOldIndex - previousDiagonal;

        while (oldIndex > previousOldIndex && newIndex > previousNewIndex) {
            operations.push({ type: 'equal', value: oldChars[oldIndex - 1] });
            oldIndex--;
            newIndex--;
        }

        if (oldIndex === previousOldIndex) {
            operations.push({ type: 'insert', value: newChars[newIndex - 1] });
            newIndex--;
        } else {
            operations.push({ type: 'delete', value: oldChars[oldIndex - 1] });
            oldIndex--;
        }
    }

    while (oldIndex > 0 && newIndex > 0) {
        operations.push({ type: 'equal', value: oldChars[oldIndex - 1] });
        oldIndex--;
        newIndex--;
    }

    return operations.reverse();
}
