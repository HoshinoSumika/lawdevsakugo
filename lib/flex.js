export const Flex = {
    setColor,
    create,
};

let textColor = '#000000';
let backgroundColor = '#ffffff';

const borderColor = 'color-mix(in srgb, currentColor 16%, transparent)';

const oppositeMap = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

const defaultOption = {
    anchor: 'top',
    radius: 25,
    borderWidth: 1,
    shadow: '0px 8px 32px rgba(0,0,0,0.18)',
    shadowMargin: 40,
    duration: 420,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    footer: null,
    trailing: null,
};

function setColor(text, background) {
    textColor = text;
    backgroundColor = background;
}

function create(content, option) {
    const setting = Object.assign({ color: textColor, background: backgroundColor }, defaultOption, option);
    const radius = setting.radius;
    const shadowMargin = setting.shadowMargin;
    const borderWidth = setting.borderWidth;

    const overhang = radius + shadowMargin * 2;

    const topLeft = buildCorner(setting, 'top', 'left', overhang);
    const topRight = buildCorner(setting, 'top', 'right', overhang);
    const bottomLeft = buildCorner(setting, 'bottom', 'left', overhang);
    const bottomRight = buildCorner(setting, 'bottom', 'right', overhang);

    const contentClip = document.createElement('div');
    contentClip.className = 'flex-content-clip';
    contentClip.style.overflow = 'hidden';
    contentClip.style.position = 'relative';
    contentClip.style.flex = '1 1 auto';
    contentClip.style.boxSizing = 'border-box';
    contentClip.style.width = 'calc(100% - ' + (borderWidth * 2) + 'px)';
    contentClip.style.minHeight = '0px';
    contentClip.style.margin = borderWidth + 'px';
    contentClip.style.display = 'flex';
    contentClip.style.flexDirection = 'column';
    contentClip.style.borderRadius = (radius - borderWidth) + 'px';
    contentClip.appendChild(content);

    const flex = document.createElement('div');
    flex.className = 'flex';
    flex.style.position = 'relative';
    flex.style.display = 'flex';
    flex.style.flexDirection = 'column';
    flex.style.color = setting.color;
    flex.appendChild(topLeft.clip);
    flex.appendChild(topRight.clip);
    flex.appendChild(bottomLeft.clip);
    flex.appendChild(bottomRight.clip);
    flex.appendChild(contentClip);

    let animationList = null;
    let currentRadius = radius + 'px';
    let pendingRadius = '';

    const split = (x, restX, y, restY) => {
        topLeft.clip.style.right = restX;
        topLeft.clip.style.bottom = restY;
        topRight.clip.style.left = x;
        topRight.clip.style.bottom = restY;
        bottomLeft.clip.style.right = restX;
        bottomLeft.clip.style.top = y;
        bottomRight.clip.style.left = x;
        bottomRight.clip.style.top = y;
    };

    const stop = () => {
        if (!animationList) {
            return;
        }
        animationList.forEach(animation => {
            animation.cancel();
        });
        animationList = null;
        flex.style.width = '';
        flex.style.height = '';
        flex.style.marginLeft = '';
        flex.style.marginTop = '';
        flex.style.marginBottom = '';
        content.style.width = '';
        split('50%', '50%', '50%', '50%');
        if (pendingRadius) {
            applyRadius(pendingRadius);
            pendingRadius = '';
        }
    };

    const applyRadius = (value) => {
        topLeft.card.style.borderRadius = value;
        topRight.card.style.borderRadius = value;
        bottomLeft.card.style.borderRadius = value;
        bottomRight.card.style.borderRadius = value;
        contentClip.style.borderRadius = value;
    };

    const getVisibleSize = () => {
        if (!animationList) {
            return { width: flex.offsetWidth, height: flex.offsetHeight };
        }
        const shift = new DOMMatrix(window.getComputedStyle(content).transform);
        return { width: flex.offsetWidth - shift.m41, height: flex.offsetHeight - shift.m42 };
    };

    const getEdge = (visible, size, isCentered) => {
        if (isCentered) {
            return { start: (size - visible) / 2, end: (visible - size) / 2 };
        }
        return { start: 0, end: visible - size };
    };

    const animateShift = (element, fromX, fromY, toX, toY) => {
        return element.animate([
            { transform: 'translate(' + fromX + 'px, ' + fromY + 'px)' },
            { transform: 'translate(' + toX + 'px, ' + toY + 'px)' },
        ], { duration: setting.duration, easing: setting.easing, fill: 'forwards' });
    };

    const api = {};

    api.getElement = () => flex;

    api.resize = (change) => {
        const from = getVisibleSize();
        stop();
        const fromRadius = currentRadius;

        change();

        const to = { width: flex.offsetWidth, height: flex.offsetHeight };
        const isWidthChanged = Math.abs(from.width - to.width) >= 1;
        if (!isWidthChanged && Math.abs(from.height - to.height) < 1) {
            return false;
        }

        const isCentered = setting.anchor === 'center';
        const width = Math.max(from.width, to.width);
        const height = Math.max(from.height, to.height);
        const splitX = Math.round(width / 2);
        const splitY = Math.round(isCentered ? height / 2 : Math.min(from.height, to.height) / 2);
        if (isWidthChanged) {
            flex.style.width = width + 'px';
            flex.style.marginLeft = (to.width - width) / 2 + 'px';
            content.style.width = (to.width - borderWidth * 2) + 'px';
        }
        flex.style.height = height + 'px';
        if (isCentered && to.height < height) {
            flex.style.marginTop = (to.height - height) / 2 + 'px';
            flex.style.marginBottom = (to.height - height) / 2 + 'px';
        }
        if (currentRadius !== fromRadius && (to.width > from.width || to.height > from.height)) {
            pendingRadius = currentRadius;
            applyRadius(fromRadius);
        }
        split(splitX + 'px', (width - splitX) + 'px', splitY + 'px', (height - splitY) + 'px');

        const fromX = getEdge(from.width, width, true);
        const toX = getEdge(to.width, width, true);
        const fromY = getEdge(from.height, height, isCentered);
        const toY = getEdge(to.height, height, isCentered);

        animationList = [
            animateShift(topLeft.card, fromX.start, fromY.start, toX.start, toY.start),
            animateShift(topRight.card, fromX.end, fromY.start, toX.end, toY.start),
            animateShift(bottomLeft.card, fromX.start, fromY.end, toX.start, toY.end),
            animateShift(bottomRight.card, fromX.end, fromY.end, toX.end, toY.end),
            animateShift(contentClip, fromX.end, fromY.end, toX.end, toY.end),
            animateShift(content, fromX.start - fromX.end, fromY.start - fromY.end, toX.start - toX.end, toY.start - toY.end),
        ];
        if (setting.footer) {
            animationList.push(animateShift(setting.footer, 0, fromY.end - fromY.start, 0, toY.end - toY.start));
        }
        if (setting.trailing) {
            animationList.push(animateShift(setting.trailing, from.width - to.width, 0, 0, 0));
        }
        animationList[0].onfinish = () => {
            stop();
        };
        return true;
    };

    api.stop = stop;

    api.setRadius = (value) => {
        currentRadius = value;
        applyRadius(value);
    };

    return api;
}

function buildCard(setting) {
    const card = document.createElement('div');
    card.className = 'flex-card';
    card.style.position = 'absolute';
    card.style.boxSizing = 'border-box';
    card.style.background = setting.background;
    card.style.border = setting.borderWidth > 0 ? setting.borderWidth + 'px solid ' + borderColor : 'none';
    card.style.borderRadius = setting.radius + 'px';
    card.style.boxShadow = setting.shadow;
    return card;
}

function buildCorner(setting, vertical, horizontal, overhang) {
    const card = buildCard(setting);
    card.style[vertical] = setting.shadowMargin + 'px';
    card.style[horizontal] = setting.shadowMargin + 'px';
    card.style[oppositeMap[vertical]] = -overhang + 'px';
    card.style[oppositeMap[horizontal]] = -overhang + 'px';

    const clip = document.createElement('div');
    clip.className = 'flex-' + vertical + '-' + horizontal + '-clip';
    clip.style.overflow = 'hidden';
    clip.style.position = 'absolute';
    clip.style[vertical] = -setting.shadowMargin + 'px';
    clip.style[horizontal] = -setting.shadowMargin + 'px';
    clip.style[oppositeMap[vertical]] = '50%';
    clip.style[oppositeMap[horizontal]] = '50%';
    clip.style.pointerEvents = 'none';
    clip.appendChild(card);
    return { clip, card };
}
