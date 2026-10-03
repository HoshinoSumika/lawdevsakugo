export const Address = {
    createIndex,
    createContext,
    build,
    resolve,
    label,
};

const STRUCTURE_LEVELS = ['Part', 'Chapter', 'Section', 'Subsection', 'Division'];
const PROVISION_LEVELS = ['Article', 'Paragraph', 'Item', 'Subitem1'];
const LEVELS = STRUCTURE_LEVELS.concat(PROVISION_LEVELS);
const MAIN_SCOPE = 'MainProvision';
const SUPPL_SCOPE = 'SupplProvision';
const UNKNOWN_LAW = '?';

const MEMBER_PARENT_SELECTORS = {
    Paragraph: '.Article, .MainProvision, .SupplProvision',
    Item: '.Paragraph',
    Subitem1: '.Item',
};

const LEVEL_UNITS = {
    Part: '編',
    Chapter: '章',
    Section: '節',
    Subsection: '款',
    Division: '目',
    Article: '条',
    Paragraph: '項',
    Item: '号',
};

const IROHA = 'イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス';
const KANJI_DIGITS = '〇一二三四五六七八九';

function createIndex(law) {
    const supplProvisions = Array.from(law.querySelectorAll('.LawBody > .SupplProvision'));
    const members = new Map();

    return {
        law,
        supplProvisions,
        listMembers: (container, level) => {
            if (!members.has(container)) {
                members.set(container, {});
            }
            const lists = members.get(container);
            if (!lists[level]) {
                lists[level] = listMembers(container, level);
            }
            return lists[level];
        },
    };
}

function createContext(index, sentence) {
    const scope = sentence.closest('.MainProvision, .SupplProvision');
    const context = {
        index,
        scope,
        isAmendment: Boolean(scope && scope.dataset.amendlawnum),
        elements: {},
    };
    LEVELS.forEach(level => {
        const element = sentence.closest('.' + level);
        if (element && (!scope || scope.contains(element))) {
            context.elements[level] = element;
        }
    });
    return context;
}

function build(events, context, state) {
    const references = [];
    let previous = null;

    events.forEach(event => {
        if (event.type === 'citation') {
            state.lastLaw = event.lawNum;
            if (event.lawName) {
                state.lawNames[event.lawNum] = event.lawName;
            }
            previous = null;
            return;
        }

        const reference = buildReference(event, context, state, event.isConnected || event.isParenthetical ? previous : null);
        previous = reference;
        if (!reference) {
            return;
        }
        if (reference.law === UNKNOWN_LAW) {
            state.lastLaw = UNKNOWN_LAW;
            state.lastTarget = { law: UNKNOWN_LAW, address: '' };
            return;
        }
        if (reference.law) {
            state.lastLaw = reference.law;
        }
        state.lastTarget = { law: reference.law, address: reference.addresses[reference.addresses.length - 1] };
        reference.lawName = reference.law ? state.lawNames[reference.law] || '' : '';
        references.push(reference);
    });

    return references;
}

function buildReference(chain, context, state, previous) {
    const first = chain.terms[0];
    const isAbsolute = first.kind === 'absolute';
    let law = chain.law;

    if (chain.isSameLaw) {
        law = state.lastLaw || UNKNOWN_LAW;
    } else if (!law && previous && isAbsolute) {
        law = previous.law;
    } else if (!law && chain.isAfterLawName && isAbsolute) {
        law = UNKNOWN_LAW;
    }

    if (law === UNKNOWN_LAW) {
        return { law, addresses: [] };
    }

    let bases = null;
    let inheritedLaw = law;

    if (isAbsolute && previous) {
        const previousAddress = previous.addresses[previous.addresses.length - 1];
        const base = chain.isParenthetical && previousAddress ? extend(previousAddress, first) : inheritBase(previousAddress, first);
        if (base) {
            bases = [base];
        }
    }
    if (!bases) {
        const firstResult = law ? buildExternalBase(first) : buildInternalBase(first, context, state);
        if (!firstResult) {
            return null;
        }
        bases = firstResult.addresses;
        if (firstResult.law !== undefined) {
            inheritedLaw = firstResult.law;
        }
    }

    if (!law) {
        bases = bases.filter(address => resolveWithIndex(context.index, address).length > 0);
        if (bases.length === 0) {
            return null;
        }
    }

    let end = first.end;
    for (let i = 1; i < chain.terms.length; i++) {
        const term = chain.terms[i];
        const extended = bases.map(base => extend(base, term));
        if (extended.some(address => !address || (!law && resolveWithIndex(context.index, address).length === 0))) {
            break;
        }
        bases = extended;
        end = term.end;
    }

    return {
        start: chain.start,
        end,
        law: inheritedLaw,
        addresses: bases,
    };
}

function inheritBase(address, term) {
    if (!address) {
        return '';
    }
    const segments = address.split('/');
    const position = segments.findIndex(segment => levelOfSegment(segment) === term.level);
    if (position < 0) {
        return '';
    }
    return segments.slice(0, position).join('/') + '/' + term.level + ':' + term.num;
}

function buildExternalBase(term) {
    if (term.kind !== 'absolute' || term.isSuppl) {
        return null;
    }
    if (!STRUCTURE_LEVELS.includes(term.level) && term.level !== 'Article') {
        return null;
    }
    return { addresses: [MAIN_SCOPE + '/' + term.level + ':' + term.num] };
}

function buildInternalBase(term, context, state) {
    if (term.kind === 'absolute') {
        const address = buildAbsoluteBase(term, context);
        return address ? { addresses: [address] } : null;
    }
    if (term.kind === 'same') {
        return buildSameBase(term, state);
    }

    const element = context.elements[term.level];
    if (!element) {
        return null;
    }
    const siblings = context.index.listMembers(findContainer(element, term.level, context), term.level);
    const position = siblings.indexOf(element);
    if (position < 0) {
        return null;
    }

    let targets = [];
    if (term.kind === 'previous') {
        targets = siblings.slice(position - 1, position).filter(() => position > 0);
    } else if (term.kind === 'next') {
        targets = siblings.slice(position + 1, position + 2);
    } else if (term.kind === 'previousAll') {
        targets = siblings.slice(0, position);
    } else if (term.kind === 'previousCount') {
        targets = position >= term.count ? siblings.slice(position - term.count, position) : [];
    }

    if (targets.length === 0) {
        return null;
    }
    return { addresses: targets.map(target => addressOf(target, context.index)) };
}

function buildAbsoluteBase(term, context) {
    const { elements, index } = context;

    if (term.level === 'Article') {
        if (term.isSuppl) {
            const scope = context.scope && context.scope.classList.contains(SUPPL_SCOPE)
                ? context.scope
                : index.supplProvisions.find(element => !element.dataset.amendlawnum);
            return scope ? scopeAddress(scope, index) + '/Article:' + term.num : '';
        }
        return context.isAmendment ? '' : MAIN_SCOPE + '/Article:' + term.num;
    }

    if (STRUCTURE_LEVELS.includes(term.level)) {
        if (term.isSuppl || context.isAmendment) {
            return '';
        }
        const parentLevel = STRUCTURE_LEVELS[STRUCTURE_LEVELS.indexOf(term.level) - 1];
        const parent = parentLevel ? elements[parentLevel] : null;
        const base = parent ? addressOf(parent, index) : MAIN_SCOPE;
        return base + '/' + term.level + ':' + term.num;
    }

    const parentLevel = PROVISION_LEVELS[PROVISION_LEVELS.indexOf(term.level) - 1];
    const parent = elements[parentLevel];
    if (!parent) {
        return '';
    }
    return addressOf(parent, index) + '/' + term.level + ':' + term.num;
}

function buildSameBase(term, state) {
    const target = state.lastTarget;
    if (!target || target.law === UNKNOWN_LAW) {
        return null;
    }
    const segments = target.address.split('/');
    const position = segments.findIndex(segment => levelOfSegment(segment) === term.level);
    if (position < 0 || segments[position].endsWith(':*')) {
        return null;
    }
    return { addresses: [segments.slice(0, position + 1).join('/')], law: target.law };
}

function extend(address, term) {
    if (term.kind === 'every') {
        return extendLevel(address, 'Item', '*');
    }
    if (term.kind !== 'absolute' || term.isSuppl) {
        return '';
    }
    return extendLevel(address, term.level, term.num);
}

function extendLevel(address, level, num) {
    const segments = address.split('/');
    const lastLevel = levelOfSegment(segments[segments.length - 1]);
    if (segments[segments.length - 1].endsWith(':*')) {
        return '';
    }
    if (LEVELS.indexOf(level) <= LEVELS.indexOf(lastLevel)) {
        return '';
    }
    if (lastLevel === 'Article' && level !== 'Paragraph' && PROVISION_LEVELS.includes(level)) {
        return address + '/Paragraph:1/' + level + ':' + num;
    }
    return address + '/' + level + ':' + num;
}

function findContainer(element, level, context) {
    if (level === 'Article') {
        return context.scope;
    }
    if (MEMBER_PARENT_SELECTORS[level]) {
        return element.parentElement.closest(MEMBER_PARENT_SELECTORS[level]);
    }
    const parentLevels = STRUCTURE_LEVELS.slice(0, STRUCTURE_LEVELS.indexOf(level));
    const selector = parentLevels.map(parentLevel => '.' + parentLevel).concat(['.MainProvision', '.SupplProvision']).join(', ');
    return element.parentElement.closest(selector);
}

function listMembers(container, level) {
    if (!container) {
        return [];
    }
    const newProvision = container.closest('.NewProvision');
    return Array.from(container.querySelectorAll('.' + level)).filter(element => {
        if (element.closest('.NewProvision') !== newProvision) {
            return false;
        }
        if (!MEMBER_PARENT_SELECTORS[level]) {
            return true;
        }
        return element.parentElement.closest(MEMBER_PARENT_SELECTORS[level]) === container;
    });
}

function addressOf(element, index) {
    const segments = [];
    let node = element;
    let hasArticle = false;
    while (node && !isScope(node)) {
        const level = levelOf(node);
        if (level && !(hasArticle && STRUCTURE_LEVELS.includes(level))) {
            segments.unshift(level + ':' + node.dataset.num);
        }
        if (level === 'Article') {
            hasArticle = true;
        }
        node = node.parentElement;
    }
    if (!node) {
        return '';
    }
    segments.unshift(scopeAddress(node, index));
    return segments.join('/');
}

function scopeAddress(scope, index) {
    if (scope.classList.contains(MAIN_SCOPE)) {
        return MAIN_SCOPE;
    }
    return SUPPL_SCOPE + ':' + index.supplProvisions.indexOf(scope);
}

function isScope(element) {
    return element.classList.contains(MAIN_SCOPE) || element.classList.contains(SUPPL_SCOPE);
}

function levelOf(element) {
    return LEVELS.find(level => element.classList.contains(level)) || '';
}

function levelOfSegment(segment) {
    return segment.split(':')[0];
}

function resolve(law, address) {
    return resolveWithIndex(createIndex(law), address);
}

function resolveWithIndex(index, address) {
    if (!address) {
        return [];
    }
    const segments = address.split('/');
    let elements = [findScope(index, segments[0])].filter(Boolean);

    segments.slice(1).forEach(segment => {
        const [level, num] = segment.split(':');
        elements = elements.flatMap(parent => {
            const members = index.listMembers(parent, level);
            if (num === '*') {
                return members;
            }
            const found = members.find(member => matchNum(member.dataset.num || '', num));
            return found ? [found] : [];
        });
    });

    return elements;
}

function findScope(index, segment) {
    const [scope, position] = segment.split(':');
    if (scope === MAIN_SCOPE) {
        return index.law.querySelector('.MainProvision');
    }
    return index.supplProvisions[Number(position)] || null;
}

function matchNum(value, num) {
    if (value === num) {
        return true;
    }
    const range = value.split(':');
    if (range.length !== 2) {
        return false;
    }
    return compareNum(range[0], num) <= 0 && compareNum(num, range[1]) <= 0;
}

function compareNum(a, b) {
    const left = a.split('_').map(Number);
    const right = b.split('_').map(Number);
    const length = Math.max(left.length, right.length);
    for (let i = 0; i < length; i++) {
        const difference = (left[i] || 0) - (right[i] || 0);
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
}

function label(addresses) {
    let previousSegments = [];
    return addresses.map(address => {
        const segments = address.split('/');
        let shared = 0;
        while (shared < segments.length - 1 && segments[shared] === previousSegments[shared]) {
            shared++;
        }
        previousSegments = segments;
        return segments.slice(shared).map(labelSegment).join('');
    }).join('、');
}

function labelSegment(segment) {
    const [level, num] = segment.split(':');
    if (level === MAIN_SCOPE) {
        return '';
    }
    if (level === SUPPL_SCOPE) {
        return '附則';
    }
    if (num === '*') {
        return '各号';
    }
    if (level === 'Subitem1') {
        return IROHA[Number(num) - 1] || '';
    }
    const parts = num.split('_').map(Number);
    const branches = parts.slice(1).map(part => 'の' + formatKanjiNumber(part)).join('');
    return '第' + formatKanjiNumber(parts[0]) + LEVEL_UNITS[level] + branches;
}

function formatKanjiNumber(value) {
    let result = '';
    [[1000, '千'], [100, '百'], [10, '十']].forEach(([unit, mark]) => {
        const digit = Math.floor(value / unit) % 10;
        if (digit > 0) {
            result += (digit > 1 ? KANJI_DIGITS[digit] : '') + mark;
        }
    });
    const one = value % 10;
    if (one > 0 || result === '') {
        result += KANJI_DIGITS[one];
    }
    return result;
}
