function MapReplacer(key, value) {
    if(value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries())
        };
    } else {
        return value;
    }
}

function MapReviver(key, value) {
    if(typeof value === 'object' && value !== null) {
        if(value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}