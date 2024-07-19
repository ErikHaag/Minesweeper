function capitalize(str) {
    first = str[0];
    return first.toUpperCase() + str.slice(1);
}

function randInt(excludedMax) {
    let b = bits(excludedMax);
    let int = 0n;
    do {
        int = 0n;
        // generate a b bit number
        for (let j = 0n; j < b; j++) {
            int = int << 1n | BigInt(Math.random() < 0.5);
        }
        //reject if out of range
    } while (int >= excludedMax)
    return int;
}

function bits(int) {
    let b = 0n;
    for (let i = 1n; i <= int; i <<= 1n) {
        b++;
    }
    return b;
}