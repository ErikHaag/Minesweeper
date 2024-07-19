const modeSelector = document.getElementById("mode");
const clueTable = document.getElementById("cluePattern");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const start = document.getElementById("start");
const table = document.getElementById("board");

let offsetTable;
let loaded = false;
let grid = [];
let width = 20n;
let height = 10n;
let boardSize = width * height;
let uncovered = 0n;
let flags = 0n;
let mode;

modeSelector.addEventListener("change", () => {
    drawCluePattern();
});

widthInput.addEventListener("focusout", () => {
    let v = BigInt(Math.floor(widthInput.value));
    if (v < 5n) v = 5n;
    widthInput.value = v;
});

heightInput.addEventListener("focusout", () => {
    let v = BigInt(Math.floor(heightInput.value));
    if (v < 5n) v = 5n;
    heightInput.value = v;
});

start.addEventListener("click", () => {
    mode = modeSelector.value;
    width = BigInt(widthInput.value);
    height = BigInt(heightInput.value);
    boardSize = width * height;
    clearTimeout(uncoverTimeout);
    uncoverQueue = [];
    uncovered = 0n;
    flags = 0n;
    generateMines();
    generateClues();
    drawGrid();
});

table.addEventListener("click", (e) => {
    if (e.target.id == "board" || e.target.id == "") {
        return;
    }
    let index = BigInt(e.target.id);
    let mask = 1n << index;
    if (e.detail == 1) {
        flags ^= mask;
        drawGrid();
    } else if (e.detail == 2) {
        uncoverQueue.push(index);
        uncover();
    }
}, true);

async function loadTable() {
    if (loaded) {
        return;
    }
    let data = await fetch("./offsetTable.json");
    offsetTable = await data.json();
    loaded = true;
    console.log(Object.keys(offsetTable).length + " mode(s) loaded");
    let modeHtml = "";
    for (const mode in offsetTable) {
        modeHtml += "<option value=\"" + mode + "\">" + capitalize(mode) + "</option>\n";
    }
    modeSelector.innerHTML = modeHtml;
    mode = modeSelector.value;
    drawCluePattern();
}

loadTable();

function drawGrid() {
    let tbodyHTML = "";
    for (let i = 0n; i < height; i++) {
        let tr = "<tr>";
        for (let j = 0n; j < width; j++) {
            let index = i * width + j;
            tr += "\n<td id=\"" + index + "\"";
            let mask = 1n << index;
            if (uncovered & mask) {
                tr += ">" + grid[index];
            } else {
                tr += " class=\"covered\">";
                if (flags & mask) {
                    tr += "&#x1F3F3;"
                }
            }
            tr += "</td>";
        }
        tbodyHTML += tr + "\n</tr>";
    }
    table.innerHTML = tbodyHTML;
}

function drawCluePattern() {
    let x = undefined;
    let y = undefined;
    let coords = [];
    let offsets = offsetTable[modeSelector.value];
    for (let offset of offsets) {
        x = y;
        y = BigInt(offset);
        if (x != undefined) {
            coords.push([x, y]);
            y = undefined;
        }
    }
    let xMin = 0n;
    let xMax = 0n;
    let yMin = 0n;
    let yMax = 0n;
    for (let c of coords) {
        if (c[0] < xMin) xMin = c[0];
        if (c[0] > xMax) xMax = c[0];
        if (c[1] < yMin) yMin = c[1];
        if (c[1] > yMax) yMax = c[1];
    }
    let clueTableHtml = "";
    for (let i = yMin; i <= yMax; i++) {
        let tr = "<tr>";
        for (let j = xMin; j <= xMax; j++) {
            tr += "\n<td class=\"";
            if (i == 0n && j == 0n) {
                tr += "center";
            } else {
                let contains = false;
                for (let c of coords) {
                    if (c[0] == j && c[1] == i) {
                        contains = true;
                        break;
                    }
                }
                if (contains) {
                    tr += "counted";
                } else {
                    tr += "uncounted";
                }
            }
            tr += "\"></td>";
        }
        clueTableHtml += tr + "</tr>";
    }
    clueTable.innerHTML = clueTableHtml;
}

function generateMines(mineCoverage = 20n) {
    boardSize = width * height;
    // prevent to many mines
    if (mineCoverage > 80n) mineCoverage = 80n;
    let count = boardSize * mineCoverage / 100n;
    if (count <= 0n) count = 1n;
    console.log("placing " + count + " mines on the board");
    grid = [];
    let bombs = [];
    for (let i = 0n; i < count; i++) {
        let emptyCount = randInt(boardSize - i) + 1n;
        let index = -1n;
        while (emptyCount > 0n) {
            index++;
            if (bombs.indexOf(index) == -1n) {
                emptyCount--;
            }
            if (index >= boardSize) {
                break;
            }
        }
        bombs.push(index);
        grid[index] = "bomb";
    }
}

function generateClues() {
    for (let i = 0n; i < height; i++) {
        for (let j = 0n; j < width; j++) {
            let index = width * i + j;
            if (grid[index] == "bomb") {
                continue;
            }
            let offsets = offsetTable[mode];
            let x = undefined;
            let y = undefined;
            let count = 0n;
            for (let offset of offsets) {
                x = y;
                y = BigInt(offset);
                if (x != undefined) {
                    // for each pair of values (x, y)
                    if (0n <= j + x && j + x < width && 0n <= i + y && i + y < height && grid[index + y * width + x] == "bomb") {
                        // if inbounds and bomb there
                        count++;
                    }
                    // move to next pair
                    y = undefined;
                }
            }
            grid[index] = count;
        }
    }
}

let uncoverQueue = [];
let uncoverTimeout;

function uncover() {
    let nextUncoverQueue = [];
    for (let index of uncoverQueue) {
        let mask = 1n << index;
        flags &= ~mask;
        if (!(uncovered & mask) && grid[index] == 0n) {
            let i = index / width;
            let j = index % width;
            let offsets = offsetTable[mode];
            let x = undefined;
            let y = undefined;
            for (let offset of offsets) {
                x = y;
                y = BigInt(offset);
                if (x != undefined) {
                    if (0n <= j + x && j + x < width && 0n <= i + y && i + y < height) {
                        let offsetIndex = index + y * width + x;
                        nextUncoverQueue.push(offsetIndex);
                    }
                    y = undefined;
                }
            }
        }
        uncovered |= mask;
    }
    uncoverQueue = structuredClone(nextUncoverQueue);
    drawGrid();
    if (uncoverQueue.length) {
        uncoverTimeout = setTimeout(uncover, 500);
    }
}