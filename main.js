const table = document.getElementById("board");

let grid = [];
let size = 10n;
let boardSize = size ** 2n;
let uncovered = 0n;

function drawGrid() {
    let tbodyHTML = ""
    for (let i = 0n; i < size; i++) { 
        let tr = "<tr>"
        for (let j = 0n; j < size; j++) {
            let index = i * size + j;
            tr += "\n<td"
            if (uncovered & (1n << index)) {
                tr = ">" + grid[index];
            } else {
                tr += " class=\"covered\">";
            }
            tr += "</td>"
        }
        tbodyHTML += tr + "\n</tr>"
    }
    table.innerHTML = tbodyHTML;
}

function generateMines(mineCoverage = 50n) {
    boardSize = size ** 2n;
    // prevent to many mines
    if (mineCoverage > 80n) mineCoverage = 80n;
    let count = boardSize * mineCoverage / 100n
    if (count <= 0n) count = 1n;
    console.log("placing " + count + " mines on the board");
    grid = [];
    let bombs = [];
    for (let i = 0n; i < count; i++) {
        let b = bits(boardSize - i);
        let emptyCount
        for (let j = 0n; j < 10; j++) {
            emptyCount = 0n;
            for (let k = 0n; k < b; k++) {
                emptyCount = emptyCount << 1n | BigInt(Math.random() < 0.5);
            }
            if (emptyCount < boardSize - i) {
                break;
            }
        }
        if (emptyCount >= boardSize - i) {
            emptyCount = 0n;
            console.log("failure on mine" + (i + 1));
        }
        emptyCount++;
        let index = -1n
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
    
}

function bits(int) {
    let b = 0n;
    for (let i = 1n; i <= int; i <<= 1n) {
        b++;
    }
    return b;
}