export const Flex = {
    setColor,
    create,
};

let textColor = '#000000';
let backgroundColor = '#ffffff';

const borderColor = 'color-mix(in srgb, currentColor 16%, transparent)';

const defaultOption = {
    anchor: 'top',
    radius: 25,
    borderWidth: 1,
    shadow: '0 8px 32px rgba(0,0,0,0.18)',
    shadowMargin: 40,
    duration: 420,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    footer: null,
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

    const topCard = buildCard(setting);
    topCard.style.top = shadowMargin + 'px';
    topCard.style.bottom = -overhang + 'px';

    const topClip = buildClip('flex-top-clip', topCard, shadowMargin);
    topClip.style.top = -shadowMargin + 'px';
    topClip.style.bottom = '50%';

    const bottomCard = buildCard(setting);
    bottomCard.style.top = -overhang + 'px';
    bottomCard.style.bottom = shadowMargin + 'px';

    const bottomClip = buildClip('flex-bottom-clip', bottomCard, shadowMargin);
    bottomClip.style.top = '50%';
    bottomClip.style.bottom = -shadowMargin + 'px';

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
    flex.appendChild(topClip);
    flex.appendChild(bottomClip);
    flex.appendChild(contentClip);

    let animationList = null;

    const stop = () => {
        if (!animationList) {
            return;
        }
        animationList.forEach(animation => {
            animation.cancel();
        });
        animationList = null;
        flex.style.height = '';
        topClip.style.bottom = '50%';
        bottomClip.style.top = '50%';
    };

    const getShift = (element) => {
        return new DOMMatrix(window.getComputedStyle(element).transform).m42;
    };

    const getVisibleHeight = () => {
        if (!animationList) {
            return flex.offsetHeight;
        }
        const bottom = getShift(contentClip);
        const top = bottom + getShift(content);
        return flex.offsetHeight + bottom - top;
    };

    const getEdge = (visibleHeight, height) => {
        if (setting.anchor === 'center') {
            return { top: (height - visibleHeight) / 2, bottom: (visibleHeight - height) / 2 };
        }
        return { top: 0, bottom: visibleHeight - height };
    };

    const animateShift = (element, from, to) => {
        return element.animate([
            { transform: 'translateY(' + from + 'px)' },
            { transform: 'translateY(' + to + 'px)' },
        ], { duration: setting.duration, easing: setting.easing, fill: 'forwards' });
    };

    const api = {};

    api.getElement = () => flex;

    api.resize = (change) => {
        const from = getVisibleHeight();
        stop();

        change();

        const to = flex.offsetHeight;
        if (Math.abs(from - to) < 1) {
            return false;
        }

        const height = Math.max(from, to);
        const split = Math.round(setting.anchor === 'center' ? height / 2 : Math.min(from, to) / 2);
        flex.style.height = height + 'px';
        topClip.style.bottom = (height - split) + 'px';
        bottomClip.style.top = split + 'px';

        const fromEdge = getEdge(from, height);
        const toEdge = getEdge(to, height);

        animationList = [
            animateShift(topCard, fromEdge.top, toEdge.top),
            animateShift(bottomCard, fromEdge.bottom, toEdge.bottom),
            animateShift(contentClip, fromEdge.bottom, toEdge.bottom),
            animateShift(content, fromEdge.top - fromEdge.bottom, toEdge.top - toEdge.bottom),
        ];
        if (setting.footer) {
            animationList.push(animateShift(setting.footer, fromEdge.bottom - fromEdge.top, toEdge.bottom - toEdge.top));
        }
        animationList[0].onfinish = () => {
            stop();
        };
        return true;
    };

    api.stop = stop;

    api.setRadius = (value) => {
        topCard.style.borderRadius = value;
        bottomCard.style.borderRadius = value;
        contentClip.style.borderRadius = value;
    };

    return api;
}

function buildCard(setting) {
    const card = document.createElement('div');
    card.className = 'flex-card';
    card.style.position = 'absolute';
    card.style.left = setting.shadowMargin + 'px';
    card.style.right = setting.shadowMargin + 'px';
    card.style.boxSizing = 'border-box';
    card.style.background = setting.background;
    card.style.border = setting.borderWidth > 0 ? setting.borderWidth + 'px solid ' + borderColor : 'none';
    card.style.borderRadius = setting.radius + 'px';
    card.style.boxShadow = setting.shadow;
    return card;
}

function buildClip(className, card, shadowMargin) {
    const clip = document.createElement('div');
    clip.className = className;
    clip.style.overflow = 'hidden';
    clip.style.position = 'absolute';
    clip.style.left = -shadowMargin + 'px';
    clip.style.right = -shadowMargin + 'px';
    clip.style.pointerEvents = 'none';
    clip.appendChild(card);
    return clip;
}
