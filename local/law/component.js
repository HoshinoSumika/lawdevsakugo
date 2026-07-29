export function createCategory(text) {
    const div = document.createElement('div');
    div.className = 'config-category';
    div.textContent = text;
    return div;
}

export function createDivider() {
    const div = document.createElement('div');
    div.className = 'config-divider';
    return div;
}

export function createLabelItem(labelText) {
    const div = document.createElement('div');
    div.className = 'config-item';

    const label = document.createElement('div');
    label.className = 'config-label';
    label.textContent = labelText;

    div.appendChild(label);

    return div;
}

export function createCheckboxItem(labelText) {
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

export function createNavigationItem(labelText) {
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

export function createRadioItem(labelText) {
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

export function createSeekbarItem(labelText, min, max, step) {
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

export function toggleCheckboxItem(item, storageKey, defaultEnabled, onEnable, onDisable) {
    const checkbox = item.querySelector('.config-checkbox');

    if (!item.getAttribute('data-value')) {
        const stored = localStorage.getItem(storageKey);
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
                localStorage.setItem(storageKey, 'disable');
            } else {
                localStorage.removeItem(storageKey);
            }
        } else {
            onEnable();
            item.setAttribute('data-value', 'enable');
            checkbox.classList.add('checked');
            if (defaultEnabled) {
                localStorage.removeItem(storageKey);
            } else {
                localStorage.setItem(storageKey, 'enable');
            }
        }
    }
}

export function initSeekbar(item, storageKey, defaultValue, applyValue) {
    const seekbar = item.querySelector('.config-seekbar');
    const stored = parseFloat(localStorage.getItem(storageKey) ?? defaultValue);

    applyValue(stored);
    seekbar.value = stored;

    seekbar.addEventListener('input', (e) => {
        const value = e.target.value;
        applyValue(parseFloat(value));
        if (parseFloat(value) === defaultValue) {
            localStorage.removeItem(storageKey);
        } else {
            localStorage.setItem(storageKey, value);
        }
    });
}
