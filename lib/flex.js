export const Flex = {
    setColor,
    create,
};

let textColor = '#000000';
let backgroundColor = '#ffffff';

const borderColor = 'color-mix(in srgb, currentColor 16%, transparent)';

const radius = 25;
const shadow = '0 8px 32px rgba(0,0,0,0.18)';
const shadowMargin = 40;

const duration = 420;
const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

function setColor(text, background) {
    textColor = text;
    backgroundColor = background;
}

function create(content) {
    const topCard = buildCard();
    topCard.style.top = shadowMargin + 'px';
    topCard.style.bottom = -(radius + shadowMargin) + 'px';

    const topClip = buildClip('flex-top-clip', topCard);
    topClip.style.top = -shadowMargin + 'px';
    topClip.style.bottom = radius + 'px';

    const bottomCard = buildCard();
    bottomCard.style.bottom = shadowMargin + 'px';
    bottomCard.style.height = (radius + shadowMargin) + 'px';

    const bottomClip = buildClip('flex-bottom-clip', bottomCard);
    bottomClip.style.bottom = -shadowMargin + 'px';
    bottomClip.style.height = (radius + shadowMargin) + 'px';

    const contentClip = document.createElement('div');
    contentClip.className = 'flex-content-clip';
    contentClip.style.overflow = 'hidden';
    contentClip.style.position = 'relative';
    contentClip.style.flex = '1 1 auto';
    contentClip.style.boxSizing = 'border-box';
    contentClip.style.width = 'calc(100% - 2px)';
    contentClip.style.minHeight = '0px';
    contentClip.style.margin = '1px';
    contentClip.style.display = 'flex';
    contentClip.style.flexDirection = 'column';
    contentClip.style.borderRadius = (radius - 1) + 'px';
    contentClip.appendChild(content);

    const flex = document.createElement('div');
    flex.className = 'flex';
    flex.style.position = 'relative';
    flex.style.display = 'flex';
    flex.style.flexDirection = 'column';
    flex.style.color = textColor;
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
    };

    const getVisibleHeight = () => {
        const shift = new DOMMatrix(window.getComputedStyle(contentClip).transform).m42;
        return flex.offsetHeight + shift;
    };

    const api = {};

    api.getElement = () => flex;

    api.resize = (change) => {
        const from = getVisibleHeight();
        stop();

        change();

        const to = flex.offsetHeight;
        if (from === to) {
            return;
        }

        const height = Math.max(from, to);
        flex.style.height = height + 'px';

        animationList = [
            animateShift(topClip, from - height, to - height),
            animateShift(topCard, height - from, height - to),
            animateShift(bottomClip, from - height, to - height),
            animateShift(contentClip, from - height, to - height),
            animateShift(content, height - from, height - to),
        ];
        animationList[0].onfinish = () => {
            stop();
        };
    };

    api.stop = stop;

    return api;
}

function buildCard() {
    const card = document.createElement('div');
    card.className = 'flex-card';
    card.style.position = 'absolute';
    card.style.left = shadowMargin + 'px';
    card.style.right = shadowMargin + 'px';
    card.style.boxSizing = 'border-box';
    card.style.background = backgroundColor;
    card.style.border = '1px solid ' + borderColor;
    card.style.borderRadius = radius + 'px';
    card.style.boxShadow = shadow;
    return card;
}

function buildClip(className, card) {
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

function animateShift(element, from, to) {
    return element.animate([
        { transform: 'translateY(' + from + 'px)' },
        { transform: 'translateY(' + to + 'px)' },
    ], { duration, easing, fill: 'forwards' });
}
