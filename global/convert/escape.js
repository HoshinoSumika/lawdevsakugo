export function escapePattern(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
