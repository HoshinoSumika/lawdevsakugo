export const Component = {
    createCategory,
    createDivider,
    createLabelItem,
    createCheckboxItem,
    createNavigationItem,
    createRadioItem,
    createSeekbarItem,
    toggleCheckboxItem,
    initSeekbar,
};

import { Storage } from '/lib/storage.js?v=20260101';

function createCategory(text) {
    const div = document.createElement('div');
    div.className = 'config-category';
    div.textContent = text;
    return div;
}

function createDivider() {
    const div = document.createElement('div');
    div.className = 'config-divider';
    return div;
}

function createLabelItem(labelText) {
    const div = document.createElement('div');
    div.className = 'config-item';

    const label = document.createElement('div');
    label.className = 'config-label';
    label.textContent = labelText;

    div.appendChild(label);

    return div;
}

function createCheckboxItem(labelText) {
    const div = document.createElement('div');
    div.className = 'config-item';

    const label = document.createElement('div');
    label.className = 'config-label';
    label.textContent = labelText;

    const checkbox = document.createElement('div');
    checkbox.className = 'config-checkbox';

    div.appendChild(label);
    div.appendChild(checkbox);

    return div;
}

function createNavigationItem(labelText) {
    const div = document.createElement('div');
    div.className = 'config-item';

    const label = document.createElement('div');
    label.className = 'config-label';
    label.textContent = labelText;

    const value = document.createElement('div');
    value.className = 'config-value';

    div.appendChild(label);
    div.appendChild(value);

    return div;
}

function createRadioItem(labelText) {
    const div = document.createElement('div');
    div.className = 'config-item';

    const label = document.createElement('div');
    label.className = 'config-label';
    label.textContent = labelText;

    const checkmark = document.createElement('div');
    checkmark.className = 'config-checkmark';
    checkmark.textContent = '✓';
    checkmark.style.visibility = 'hidden';

    div.appendChild(label);
    div.appendChild(checkmark);

    return div;
}

function createSeekbarItem(labelText, min, max, step) {
    const div = document.createElement('div');
    div.className = 'config-item';

    const label = document.createElement('div');
    label.className = 'config-label';
    label.textContent = labelText;

    const input = document.createElement('input');
    input.className = 'config-seekbar';
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;

    div.appendChild(label);
    div.appendChild(input);

    return div;
}

function toggleCheckboxItem(item, storageKey, defaultEnabled, onEnable, onDisable) {
    const checkbox = item.querySelector('.config-checkbox');

    if (!item.getAttribute('data-value')) {
        const stored = Storage.get(storageKey, null);
        const enabled = defaultEnabled ? (stored !== 'disable') : (stored === 'enable');

        if (enabled) {
            onEnable();
            item.setAttribute('data-value', 'enable');
            checkbox.classList.add('checked');
        } else {
            onDisable();
            item.setAttribute('data-value', 'disable');
            checkbox.classList.remove('checked');
        }
    } else {
        const currentlyEnabled = item.getAttribute('data-value') === 'enable';

        if (currentlyEnabled) {
            onDisable();
            item.setAttribute('data-value', 'disable');
            checkbox.classList.remove('checked');
            if (defaultEnabled) {
                Storage.set(storageKey, 'disable');
            } else {
                Storage.remove(storageKey);
            }
        } else {
            onEnable();
            item.setAttribute('data-value', 'enable');
            checkbox.classList.add('checked');
            if (defaultEnabled) {
                Storage.remove(storageKey);
            } else {
                Storage.set(storageKey, 'enable');
            }
        }
    }
}

function initSeekbar(item, storageKey, defaultValue, applyValue) {
    const seekbar = item.querySelector('.config-seekbar');
    const stored = Storage.get(storageKey, defaultValue);

    applyValue(stored);
    seekbar.value = stored;

    seekbar.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        applyValue(value);
        if (value === defaultValue) {
            Storage.remove(storageKey);
        } else {
            Storage.set(storageKey, value);
        }
    });
}
