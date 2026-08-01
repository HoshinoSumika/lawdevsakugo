export const Storage = {
    get,
    set,
    remove,
    clear,
};

function get(key, value) {
    const data = localStorage.getItem(key);
    if (data === null) {
        return value;
    }
    return JSON.parse(data);
}

function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function remove(key) {
    localStorage.removeItem(key);
}

function clear() {
    localStorage.clear();
}
