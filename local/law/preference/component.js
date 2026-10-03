export const Component = {
    createCategory,
    createDivider,
    createLabelItem,
    createCheckboxItem,
    createNavigationItem,
    createRadioItem,
    createSeekbarItem,
    createInputItem,
    createColorItem,
    initSwitch,
    initSeekbar,
};

function createCategory(text) {
    const div = document.createElement('div');
    div.className = 'preference-category';
    div.textContent = text;
    return div;
}

function createDivider() {
    const div = document.createElement('div');
    div.className = 'preference-divider';
    return div;
}

function createLabelItem(labelText) {
    const div = document.createElement('div');
    div.className = 'preference-item';

    const label = document.createElement('div');
    label.className = 'preference-label';
    label.textContent = labelText;

    div.appendChild(label);

    return div;
}

function createCheckboxItem(labelText) {
    const div = document.createElement('div');
    div.className = 'preference-item';

    const label = document.createElement('div');
    label.className = 'preference-label';
    label.textContent = labelText;

    const checkbox = document.createElement('div');
    checkbox.className = 'preference-checkbox';

    div.appendChild(label);
    div.appendChild(checkbox);

    return div;
}

function createNavigationItem(labelText) {
    const div = document.createElement('div');
    div.className = 'preference-item';

    const label = document.createElement('div');
    label.className = 'preference-label';
    label.textContent = labelText;

    const value = document.createElement('div');
    value.className = 'preference-value';

    div.appendChild(label);
    div.appendChild(value);

    return div;
}

function createRadioItem(labelText) {
    const div = document.createElement('div');
    div.className = 'preference-item';

    const label = document.createElement('div');
    label.className = 'preference-label';
    label.textContent = labelText;

    const checkmark = document.createElement('div');
    checkmark.className = 'preference-checkmark';
    checkmark.textContent = '✓';
    checkmark.style.visibility = 'hidden';

    div.appendChild(label);
    div.appendChild(checkmark);

    return div;
}

function createSeekbarItem(labelText, min, max, step) {
    const div = document.createElement('div');
    div.className = 'preference-item';

    const label = document.createElement('div');
    label.className = 'preference-label';
    label.textContent = labelText;

    const input = document.createElement('input');
    input.className = 'preference-seekbar';
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;

    div.appendChild(label);
    div.appendChild(input);

    return div;
}

function createInputItem(placeholder, buttonText) {
    const div = document.createElement('div');
    div.className = 'preference-item preference-input-item';

    const input = document.createElement('input');
    input.className = 'preference-input';
    input.type = 'text';
    input.placeholder = placeholder;

    const button = document.createElement('div');
    button.className = 'preference-button';
    button.textContent = buttonText;

    div.appendChild(input);
    div.appendChild(button);

    return div;
}

function createColorItem(labelText) {
    const div = document.createElement('div');
    div.className = 'preference-item';

    const label = document.createElement('div');
    label.className = 'preference-label';
    label.textContent = labelText;

    const picker = document.createElement('input');
    picker.className = 'preference-color';
    picker.type = 'color';

    const checkmark = document.createElement('div');
    checkmark.className = 'preference-checkmark';
    checkmark.textContent = '✓';
    checkmark.style.visibility = 'hidden';

    div.appendChild(label);
    div.appendChild(picker);
    div.appendChild(checkmark);

    return div;
}

function initSwitch(item, checked, onChange) {
    const checkbox = item.querySelector('.preference-checkbox');
    checkbox.classList.toggle('checked', checked);

    item.addEventListener('click', () => {
        const next = !checkbox.classList.contains('checked');
        checkbox.classList.toggle('checked', next);
        onChange(next);
    });
}

function initSeekbar(item, value, onInput) {
    const seekbar = item.querySelector('.preference-seekbar');
    seekbar.value = value;

    seekbar.addEventListener('input', (e) => {
        onInput(parseFloat(e.target.value));
    });
}
