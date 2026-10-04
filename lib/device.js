export const Device = {
    getOperatingSystem,
    isDesktop,
    isMobile,
    optimizeForTouch,
};

function getOperatingSystem() {
    const agent = navigator.userAgent;
    if (agent.includes('iPhone') || agent.includes('iPod')) {
        return 'iOS';
    }
    if (agent.includes('iPad')) {
        return 'iPadOS';
    }
    if (agent.includes('Android')) {
        return 'Android';
    }
    if (agent.includes('CrOS')) {
        return 'ChromeOS';
    }
    if (agent.includes('Macintosh')) {
        if (navigator.maxTouchPoints > 1) {
            return 'iPadOS';
        }
        return 'macOS';
    }
    if (agent.includes('Windows')) {
        return 'Windows';
    }
    if (agent.includes('Linux')) {
        return 'Linux';
    }
    return 'Unknown';
}

function isDesktop() {
    const desktopWidth = 720;
    return window.innerWidth > desktopWidth;
}

function isMobile() {
    return !isDesktop();
}

function optimizeForTouch() {
    const system = getOperatingSystem();
    if (system !== 'iOS' && system !== 'iPadOS') {
        return;
    }

    document.body.setAttribute('ontouchstart', '');

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
