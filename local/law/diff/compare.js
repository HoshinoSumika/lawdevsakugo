const MAX_EDIT_DISTANCE = 1000;

export function computeArticleDiff(oldArticles, newArticles) {
    const aligned = alignArticles(oldArticles, newArticles);

    return aligned.flatMap(row => {
        const oldArticle = getAlignedArticle(oldArticles, row.oldIndex);
        const newArticle = getAlignedArticle(newArticles, row.newIndex);
        if (!oldArticle || !newArticle) return [row];
        if (normalizedText(oldArticle.text) === normalizedText(newArticle.text)) return [];

        const changes = diffText(
            oldArticle.text,
            newArticle.text,
        );
        return [{
            ...row,
            oldRanges: changes.oldRanges,
            newRanges: changes.newRanges,
        }];
    });
}

function normalizedText(text) {
    return text
        .normalize('NFC')
        .replace(/[\s\u3000]+/gu, '');
}

function getAlignedArticle(articles, index) {
    return Number.isInteger(index) ? articles[index] : null;
}

function diffText(oldText, newText) {
    const oldTokens = toCharacterTokens(oldText);
    const newTokens = toCharacterTokens(newText);

    let prefix = 0;
    while (
        prefix < oldTokens.length
        && prefix < newTokens.length
        && oldTokens[prefix].value === newTokens[prefix].value
    ) {
        prefix++;
    }

    let suffix = 0;
    while (
        suffix < oldTokens.length - prefix
        && suffix < newTokens.length - prefix
        && oldTokens[oldTokens.length - 1 - suffix].value === newTokens[newTokens.length - 1 - suffix].value
    ) {
        suffix++;
    }

    const oldEnd = oldTokens.length - suffix;
    const newEnd = newTokens.length - suffix;
    const oldMiddle = oldTokens.slice(prefix, oldEnd);
    const newMiddle = newTokens.slice(prefix, newEnd);
    const operations = myersDiff(oldMiddle, newMiddle);

    if (!operations) {
        return { oldRanges: null, newRanges: null };
    }

    const oldRanges = [];
    const newRanges = [];
    operations.forEach(operation => {
        if (operation.type === 'delete') {
            appendRange(oldRanges, operation.token.start, operation.token.end);
        } else if (operation.type === 'insert') {
            appendRange(newRanges, operation.token.start, operation.token.end);
        }
    });
    return { oldRanges, newRanges };
}

function toCharacterTokens(text) {
    let offset = 0;
    return Array.from(text, value => {
        const token = { value, start: offset, end: offset + value.length };
        offset = token.end;
        return token;
    });
}

function myersDiff(oldTokens, newTokens) {
    const maxDistance = oldTokens.length + newTokens.length;
    const limit = Math.min(maxDistance, MAX_EDIT_DISTANCE);
    const trace = [];
    let previous = new Map([[1, 0]]);

    for (let distance = 0; distance <= limit; distance++) {
        const current = new Map();
        for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
            let oldIndex;
            const left = previous.get(diagonal - 1) ?? -1;
            const right = previous.get(diagonal + 1) ?? -1;
            if (diagonal === -distance || (diagonal !== distance && left < right)) {
                oldIndex = Math.max(0, right);
            } else {
                oldIndex = Math.max(0, left + 1);
            }

            let newIndex = oldIndex - diagonal;
            while (
                oldIndex < oldTokens.length
                && newIndex < newTokens.length
                && oldTokens[oldIndex].value === newTokens[newIndex].value
            ) {
                oldIndex++;
                newIndex++;
            }
            current.set(diagonal, oldIndex);

            if (oldIndex >= oldTokens.length && newIndex >= newTokens.length) {
                trace.push(current);
                return backtrack(trace, oldTokens, newTokens);
            }
        }
        trace.push(current);
        previous = current;
    }
    return null;
}

function backtrack(trace, oldTokens, newTokens) {
    const operations = [];
    let oldIndex = oldTokens.length;
    let newIndex = newTokens.length;

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
            operations.push({ type: 'equal', token: oldTokens[oldIndex - 1] });
            oldIndex--;
            newIndex--;
        }

        if (oldIndex === previousOldIndex) {
            operations.push({ type: 'insert', token: newTokens[newIndex - 1] });
            newIndex--;
        } else {
            operations.push({ type: 'delete', token: oldTokens[oldIndex - 1] });
            oldIndex--;
        }
    }

    while (oldIndex > 0 && newIndex > 0) {
        operations.push({ type: 'equal', token: oldTokens[oldIndex - 1] });
        oldIndex--;
        newIndex--;
    }
    while (oldIndex > 0) {
        operations.push({ type: 'delete', token: oldTokens[oldIndex - 1] });
        oldIndex--;
    }
    while (newIndex > 0) {
        operations.push({ type: 'insert', token: newTokens[newIndex - 1] });
        newIndex--;
    }

    return operations.reverse();
}

function appendRange(ranges, start, end) {
    const previous = ranges[ranges.length - 1];
    if (previous && previous.end === start) {
        previous.end = end;
    } else {
        ranges.push({ start, end });
    }
}

function alignArticles(oldArticles, newArticles) {
    const oldLength = oldArticles.length;
    const newLength = newArticles.length;
    const lcs = Array.from(
        { length: oldLength + 1 },
        () => new Uint32Array(newLength + 1),
    );

    for (let i = oldLength - 1; i >= 0; i--) {
        for (let j = newLength - 1; j >= 0; j--) {
            if (oldArticles[i].key === newArticles[j].key) {
                lcs[i][j] = lcs[i + 1][j + 1] + 1;
            } else {
                lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
            }
        }
    }

    const rows = [];
    let i = 0;
    let j = 0;
    while (i < oldLength || j < newLength) {
        if (i < oldLength && j < newLength && oldArticles[i].key === newArticles[j].key) {
            rows.push({ oldIndex: i, newIndex: j });
            i++;
            j++;
        } else if (j >= newLength || (i < oldLength && lcs[i + 1][j] >= lcs[i][j + 1])) {
            rows.push({ oldIndex: i, newIndex: null });
            i++;
        } else {
            rows.push({ oldIndex: null, newIndex: j });
            j++;
        }
    }
    return rows;
}
