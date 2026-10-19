export const Component = {
    createSwitch,
    createRadio,
    createSeekbar,
    createColorPicker,
};

const SWITCH_WIDTH = 34;
const SWITCH_HEIGHT = 20;
const SWITCH_KNOB_SIZE = 14;
const SWITCH_KNOB_OFFSET = (SWITCH_HEIGHT - SWITCH_KNOB_SIZE) / 2;
const SWITCH_OFF_COLOR = 'var(--color-silver)';
const SWITCH_OFF_BORDER_COLOR = 'var(--color-border)';
const SWITCH_ON_COLOR = '#05c46b';
const SWITCH_ON_BORDER_COLOR = '#04b360';
const SWITCH_KNOB_SHADOW = '0px 2px 5px rgba(0,0,0,0.2)';

const RADIO_PADDING = 4;
const RADIO_GAP = 4;
const RADIO_MOVE_DURATION = 280;
const RADIO_MOVE_EASING = 'cubic-bezier(0.3, 0, 0.2, 1.4)';

const SEEKBAR_HEIGHT = 24;
const SEEKBAR_TRACK_HEIGHT = 2;
const SEEKBAR_THUMB_SIZE = 16;
const SEEKBAR_THUMB_PRESSED_SCALE = 1.25;

const COLOR_PICKER_SIZE = 28;

function createSwitch(value, onChange) {
    let current = value;

    const knob = document.createElement('div');
    knob.style.position = 'absolute';
    knob.style.top = SWITCH_KNOB_OFFSET + 'px';
    knob.style.left = SWITCH_KNOB_OFFSET + 'px';
    knob.style.width = SWITCH_KNOB_SIZE + 'px';
    knob.style.height = SWITCH_KNOB_SIZE + 'px';
    knob.style.transition = 'transform var(--transition-duration) ease';
    knob.style.backgroundColor = 'var(--color-white)';
    knob.style.borderRadius = '50%';
    knob.style.boxShadow = SWITCH_KNOB_SHADOW;

    const toggle = document.createElement('div');
    toggle.className = 'component-switch';
    toggle.tabIndex = 0;
    toggle.setAttribute('role', 'switch');
    toggle.style.position = 'relative';
    toggle.style.flexShrink = '0';
    toggle.style.width = SWITCH_WIDTH + 'px';
    toggle.style.height = SWITCH_HEIGHT + 'px';
    toggle.style.cursor = 'pointer';
    toggle.style.userSelect = 'none';
    toggle.style.webkitUserSelect = 'none';
    toggle.style.transition = 'background-color var(--transition-duration) ease, box-shadow var(--transition-duration) ease';
    toggle.style.borderRadius = 'var(--radius-max)';
    toggle.appendChild(knob);

    const render = () => {
        toggle.setAttribute('aria-checked', current ? 'true' : 'false');
        toggle.style.backgroundColor = current ? SWITCH_ON_COLOR : SWITCH_OFF_COLOR;
        toggle.style.boxShadow = 'inset 0px 0px 0px 2px ' + (current ? SWITCH_ON_BORDER_COLOR : SWITCH_OFF_BORDER_COLOR);
        knob.style.transform = current ? 'translateX(' + (SWITCH_WIDTH - SWITCH_HEIGHT) + 'px)' : '';
    };

    const api = {};

    api.getElement = () => toggle;

    api.getValue = () => current;

    api.setValue = (next) => {
        current = next;
        render();
    };

    api.toggle = () => {
        api.setValue(!current);
        onChange(current);
    };

    toggle.addEventListener('click', () => {
        api.toggle();
    });

    toggle.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            api.toggle();
        }
    });

    render();
    return api;
}

function createRadio(optionList, value, onChange) {
    let current = value;

    const radio = document.createElement('div');
    radio.className = 'component-radio';
    radio.setAttribute('role', 'radiogroup');
    radio.style.position = 'relative';
    radio.style.overflow = 'hidden';
    radio.style.flexShrink = '0';
    radio.style.padding = RADIO_PADDING + 'px';
    radio.style.display = 'grid';
    radio.style.gridTemplateColumns = 'repeat(' + optionList.length + ', 1fr)';
    radio.style.gap = RADIO_GAP + 'px';
    radio.style.backgroundColor = 'var(--color-smoke)';
    radio.style.borderRadius = 'var(--radius-max)';

    const indicator = document.createElement('div');
    indicator.style.position = 'absolute';
    indicator.style.top = RADIO_PADDING + 'px';
    indicator.style.bottom = RADIO_PADDING + 'px';
    indicator.style.left = RADIO_PADDING + 'px';
    indicator.style.width = 'calc((100% - ' + (RADIO_PADDING * 2 + RADIO_GAP * (optionList.length - 1)) + 'px) / ' + optionList.length + ')';
    indicator.style.transition = 'transform ' + RADIO_MOVE_DURATION + 'ms ' + RADIO_MOVE_EASING + ', opacity var(--transition-duration) ease';
    indicator.style.backgroundColor = 'var(--color-black)';
    indicator.style.borderRadius = 'var(--radius-max)';
    radio.appendChild(indicator);

    const renderIndicator = () => {
        const index = optionList.findIndex(option => option.value === current);
        indicator.style.opacity = index < 0 ? '0' : '1';
        indicator.style.transform = 'translateX(calc(' + Math.max(index, 0) + ' * (100% + ' + RADIO_GAP + 'px)))';
    };

    const renderList = [renderIndicator];

    const api = {};

    api.getElement = () => radio;

    api.getValue = () => current;

    api.setValue = (next) => {
        current = next;
        renderList.forEach(render => render());
    };

    optionList.forEach(option => {
        let isHovered = false;
        let isPressed = false;

        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'radio');
        button.style.position = 'relative';
        button.style.padding = '4px 16px';
        button.style.cursor = 'pointer';
        button.style.userSelect = 'none';
        button.style.webkitUserSelect = 'none';
        button.style.transition = 'color var(--transition-duration) ease, background-color var(--transition-duration) ease';
        button.style.font = 'inherit';
        button.style.fontSize = '14px';
        button.style.textAlign = 'center';
        button.style.border = 'none';
        button.style.borderRadius = 'var(--radius-max)';
        button.textContent = option.label;

        const render = () => {
            const isSelected = option.value === current;
            button.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            button.style.color = isSelected ? 'var(--color-white)' : 'var(--color-black)';
            if (isSelected) {
                button.style.backgroundColor = 'transparent';
            } else if (isPressed) {
                button.style.backgroundColor = 'var(--color-active)';
            } else if (isHovered) {
                button.style.backgroundColor = 'var(--color-hover)';
            } else {
                button.style.backgroundColor = 'transparent';
            }
        };
        renderList.push(render);

        button.addEventListener('pointerenter', () => {
            isHovered = true;
            render();
        });

        button.addEventListener('pointerleave', () => {
            isHovered = false;
            isPressed = false;
            render();
        });

        button.addEventListener('pointerdown', () => {
            isPressed = true;
            render();
        });

        button.addEventListener('pointerup', () => {
            isPressed = false;
            render();
        });

        button.addEventListener('click', () => {
            if (option.value === current) {
                return;
            }
            api.setValue(option.value);
            onChange(current);
        });

        radio.appendChild(button);
    });

    api.setValue(current);
    return api;
}

function createSeekbar(min, max, step, value, onChange) {
    const digit = (String(step).split('.')[1] || '').length;
    let current = value;

    const track = document.createElement('div');
    track.style.position = 'absolute';
    track.style.top = 'calc(50% - ' + (SEEKBAR_TRACK_HEIGHT / 2) + 'px)';
    track.style.left = (SEEKBAR_THUMB_SIZE / 2) + 'px';
    track.style.right = (SEEKBAR_THUMB_SIZE / 2) + 'px';
    track.style.height = SEEKBAR_TRACK_HEIGHT + 'px';
    track.style.backgroundColor = 'var(--color-black)';
    track.style.borderRadius = SEEKBAR_TRACK_HEIGHT + 'px';

    const thumb = document.createElement('div');
    thumb.style.position = 'absolute';
    thumb.style.top = 'calc(50% - ' + (SEEKBAR_THUMB_SIZE / 2) + 'px)';
    thumb.style.width = SEEKBAR_THUMB_SIZE + 'px';
    thumb.style.height = SEEKBAR_THUMB_SIZE + 'px';
    thumb.style.transition = 'transform var(--transition-duration) ease';
    thumb.style.backgroundColor = 'var(--color-white)';
    thumb.style.border = '1px solid var(--color-gray)';
    thumb.style.borderRadius = '50%';

    const seekbar = document.createElement('div');
    seekbar.className = 'component-seekbar';
    seekbar.tabIndex = 0;
    seekbar.setAttribute('role', 'slider');
    seekbar.setAttribute('aria-valuemin', String(min));
    seekbar.setAttribute('aria-valuemax', String(max));
    seekbar.style.position = 'relative';
    seekbar.style.width = '100%';
    seekbar.style.height = SEEKBAR_HEIGHT + 'px';
    seekbar.style.cursor = 'pointer';
    seekbar.style.userSelect = 'none';
    seekbar.style.webkitUserSelect = 'none';
    seekbar.style.touchAction = 'pan-y';
    seekbar.appendChild(track);
    seekbar.appendChild(thumb);

    const normalize = (next) => {
        const snapped = min + Math.round((next - min) / step) * step;
        const clamped = Math.min(max, Math.max(min, snapped));
        return parseFloat(clamped.toFixed(digit));
    };

    const render = () => {
        const ratio = (current - min) / (max - min);
        thumb.style.left = 'calc((100% - ' + SEEKBAR_THUMB_SIZE + 'px) * ' + ratio + ')';
        seekbar.setAttribute('aria-valuenow', String(current));
    };

    const change = (next) => {
        const normalized = normalize(next);
        if (normalized === current) {
            return;
        }
        current = normalized;
        render();
        onChange(current);
    };

    const changeByPointer = (clientX) => {
        const rect = seekbar.getBoundingClientRect();
        const ratio = (clientX - rect.left - SEEKBAR_THUMB_SIZE / 2) / (rect.width - SEEKBAR_THUMB_SIZE);
        change(min + ratio * (max - min));
    };

    const release = () => {
        thumb.style.transform = '';
    };

    seekbar.addEventListener('pointerdown', (e) => {
        seekbar.setPointerCapture(e.pointerId);
        thumb.style.transform = 'scale(' + SEEKBAR_THUMB_PRESSED_SCALE + ')';
        changeByPointer(e.clientX);
    });

    seekbar.addEventListener('pointermove', (e) => {
        if (seekbar.hasPointerCapture(e.pointerId)) {
            changeByPointer(e.clientX);
        }
    });

    seekbar.addEventListener('pointerup', release);
    seekbar.addEventListener('pointercancel', release);

    seekbar.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            change(current - step);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            change(current + step);
        } else if (e.key === 'Home') {
            change(min);
        } else if (e.key === 'End') {
            change(max);
        } else {
            return;
        }
        e.preventDefault();
    });

    const api = {};

    api.getElement = () => seekbar;

    api.getValue = () => current;

    api.setValue = (next) => {
        current = normalize(next);
        render();
    };

    api.setValue(current);
    return api;
}

function createColorPicker(value, onChange) {
    let current = value;

    const input = document.createElement('input');
    input.type = 'color';
    input.style.position = 'absolute';
    input.style.inset = '0px';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.padding = '0px';
    input.style.cursor = 'pointer';
    input.style.opacity = '0';
    input.style.border = 'none';

    const picker = document.createElement('div');
    picker.className = 'component-color-picker';
    picker.style.position = 'relative';
    picker.style.flexShrink = '0';
    picker.style.width = COLOR_PICKER_SIZE + 'px';
    picker.style.height = COLOR_PICKER_SIZE + 'px';
    picker.style.border = '1px solid var(--color-border)';
    picker.style.borderRadius = '50%';
    picker.appendChild(input);

    const render = () => {
        input.value = current;
        picker.style.backgroundColor = current;
    };

    const api = {};

    api.getElement = () => picker;

    api.getValue = () => current;

    api.setValue = (next) => {
        current = next;
        render();
    };

    input.addEventListener('input', () => {
        current = input.value;
        render();
        onChange(current);
    });

    render();
    return api;
}
