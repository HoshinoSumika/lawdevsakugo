export const Storage = {
    get,
    set,
    remove,
    clear,
};

function get(key, value) {
    try {
        const data = localStorage.getItem(key);
        if (data === null) {
            return value;
        }
        return JSON.parse(data);
    } catch (e) {
        console.error(e);
        return value;
    }
}

function set(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function remove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function clear() {
    try {
        localStorage.clear();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
