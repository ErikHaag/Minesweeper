const table = document.getElementById("board");
const modeSelector = document.getElementById("mode");

let offsetTable;
let loaded = false;
let grid = [];
let width = 20n;
let height = 10n;
let boardSize = width * height;
let uncovered = 0n;

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
        modeHtml += "<option value=\"" + mode + "\">" + mode + "</option>\n";
    }
    modeSelector.innerHTML = modeHtml;
}

loadTable();

function drawGrid() {
    let tbodyHTML = "";
    for (let i = 0n; i < height; i++) { 
        let tr = "<tr>";
        for (let j = 0n; j < width; j++) {
            let index = i * width + j;
            tr += "\n<td id=\"" + index + "\"";
            if (uncovered & (1n << index)) {
                tr += ">" + grid[index];
            } else {
                tr += " class=\"covered\">";
            }
            tr += "</td>";
        }
        tbodyHTML += tr + "\n</tr>";
    }
    table.innerHTML = tbodyHTML;
}

function generateMines(mineCoverage = 50n) {
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
            let offsets = offsetTable[modeSelector.value];
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

let uncoverQueue = [];
let uncoverTimeout;

function uncover() {
    let nextUncoverQueue = [];
    for (let index of uncoverQueue) {
        let mask = 1n << index;
        if (!(uncovered & mask) && grid[index] == 0n) {
            let i = index / width;
            let j = index % width;
            let offsets = offsetTable[modeSelector.value];
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