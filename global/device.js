export const Device = {
    disableHoverOnTouch,
    disableBodyScrollOnApple,
};

function disableHoverOnTouch() {
    document.body.setAttribute('ontouchstart', '');
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        for (const sheet of document.styleSheets) {
            try {
                const rules = sheet.cssRules;
                for (let i = rules.length - 1; i >= 0; i--) {
                    const rule = rules[i];
                    if (rule.selectorText && rule.selectorText.includes(':hover')) {
                        const selectors = rule.selectorText.split(',');
                        const filteredSelectors = selectors.map(s => s.trim()).filter(s => !s.includes(':hover'));
                        if (filteredSelectors.length === 0) {
                            sheet.deleteRule(i);
                        } else {
                            const newSelectorText = filteredSelectors.join(',');
                            const cssText = rule.style.cssText;
                            sheet.deleteRule(i);
                            sheet.insertRule(newSelectorText + '{' + cssText + '}', i);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
}

function disableBodyScrollOnApple(el) {
    if (isAppleDevice()) {
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
        if (el) {
            el.style.overflowY = 'auto';
        }
    }
}

function isAppleDevice() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isIOS || isIPadOS;
}
