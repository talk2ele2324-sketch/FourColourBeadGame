let targetArrangements = generateNewCard();

// Each column stores beads from bottom to top.
let columns = [
    ["turquoise", "turquoise", "turquoise", "turquoise"],
    ["pink", "pink", "pink", "pink"],
    ["blue", "blue", "blue", "blue"],
    ["orange", "orange", "orange", "orange"]
];

const targetBoard = document.getElementById("target-board");
const gameBoard = document.getElementById("game-board");
const changeCardsButton = document.getElementById("change-cards-button");
const timerDisplay = document.getElementById("timer");
const movesDisplay = document.getElementById("moves");

let moves = 0;
const originalColumns = columns.map(column => [...column]);
const resetButton = document.getElementById("reset-button");
let seconds = 0;
let timerStarted = false;
let timerInterval = null;

function createTargetCard() {
    targetBoard.innerHTML = "";

    targetArrangements.forEach(arrangement => {
        const targetColumn = document.createElement("div");

        targetColumn.style.display = "flex";
        targetColumn.style.flexDirection = "column";
        targetColumn.style.alignItems = "center";
        targetColumn.style.gap = "5px";

        arrangement.forEach(colour => {
            const bead = document.createElement("div");
            bead.className = `bead ${colour}`;
            bead.style.cursor = "default";
            targetColumn.appendChild(bead);
        });

        targetBoard.appendChild(targetColumn);
    });
}



function generateNewCard() {
    const colours = ["turquoise", "pink", "blue", "orange"];

    const beads = colours.flatMap(colour =>
        Array(4).fill(colour)
    );

    // Shuffle the beads
    for (let i = beads.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [beads[i], beads[j]] = [beads[j], beads[i]];
    }

    return [
        beads.slice(0, 4),
        beads.slice(4, 8),
        beads.slice(8, 12),
        beads.slice(12, 16)
    ];
}

function drawBoard() {
    gameBoard.innerHTML = "";

    columns.forEach((column, columnIndex) => {
        const columnElement = document.createElement("div");

        columnElement.className = "column";
        columnElement.dataset.column = columnIndex;

        for (let position = 0; position < 6; position++) {
            const slot = document.createElement("div");
            slot.className = "slot";

            const beadIndex = 5 - position;

            if (beadIndex < column.length) {
                const bead = document.createElement("div");

                bead.className = `bead ${column[beadIndex]}`;
                bead.dataset.column = columnIndex;

                slot.appendChild(bead);
            }

            columnElement.appendChild(slot);
        }

        gameBoard.appendChild(columnElement);
    });
}


function updateTimerDisplay() {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    timerDisplay.textContent = `${minutes}:${secs}`;
}

function startTimer() {
    if (timerStarted) return;

    timerStarted = true;

    timerInterval = setInterval(() => {
        seconds++;
        updateTimerDisplay();
    }, 1000);
}


let gameCompleted = false;

function checkWin() {
    const won = columns.every((column, index) => {
        const target = targetArrangements[index];

        return column.length === 4 &&
            column.slice().reverse().every(
                (colour, beadIndex) => colour === target[beadIndex]
            );
    });

    if (won) {
        gameCompleted = true;

        clearInterval(timerInterval);
        timerInterval = null;

        alert(`Congratulations! You completed the puzzle in ${moves} moves and ${timerDisplay.textContent}!`);
    }
}

// Dragging information
let floatingBead = null;
let sourceBead = null;
let sourceColumn = null;
let destinationColumn = null;
let dragPhase = null;

let sourceX = 0;
let destinationX = 0;
let railY = 0;
let destinationY = 0;
let startY = 0;
let pointerId = null;

// Get the centre of a column
function getColumnX(index) {
    const column = gameBoard.querySelectorAll(".column")[index];
    const rect = column.getBoundingClientRect();

    return rect.left + rect.width / 2;
}

// Get the horizontal rail position
function getRailY() {
    const board = document.querySelector(".wooden-board");
    const boardRect = board.getBoundingClientRect();
    const railStyle = getComputedStyle(board, "::before");

    const railTop = parseFloat(railStyle.top);
    const railHeight = parseFloat(railStyle.height);

    return boardRect.top + railTop + railHeight / 2;
}

// Position bead
function positionFloatingBead(x, y) {
    if (!floatingBead) return;

    const radius = floatingBead.offsetWidth / 2;

    floatingBead.style.left = `${x - radius}px`;
    floatingBead.style.top = `${y - radius}px`;
}

// Start dragging
gameBoard.addEventListener("pointerdown", function(event) {
    const bead = event.target.closest(".bead");

    if (!bead) return;

    if (gameCompleted) return;

    if (event.pointerType === "mouse" && event.button !== 0) {
        return;
    }

    const columnIndex = Number(bead.dataset.column);
    const column = columns[columnIndex];

    const columnElement = bead.closest(".column");
    const beads = columnElement.querySelectorAll(".bead");

    // Only the topmost bead can move
    if (beads[0] !== bead) return;

    if (column.length === 0) return;

    sourceBead = bead;
    sourceColumn = columnIndex;
    destinationColumn = null;
    dragPhase = "up";

    pointerId = event.pointerId;

    const beadRect = bead.getBoundingClientRect();

    sourceX = getColumnX(sourceColumn);
    railY = getRailY();

    startY = beadRect.top + beadRect.height / 2;

    floatingBead = bead.cloneNode(true);

    floatingBead.style.position = "fixed";
    floatingBead.style.width = beadRect.width + "px";
    floatingBead.style.height = beadRect.height + "px";
    floatingBead.style.zIndex = "1000";
    floatingBead.style.pointerEvents = "none";
    floatingBead.style.margin = "0";

    document.body.appendChild(floatingBead);

    sourceBead.style.visibility = "hidden";

    positionFloatingBead(sourceX, startY);

    event.preventDefault();
});

// Move bead along the track
document.addEventListener("pointermove", function(event) {
    if (!floatingBead || event.pointerId !== pointerId) return;

    const pointerX = event.clientX;
    const pointerY = event.clientY;

    // PHASE 1: Move straight upwards
    if (dragPhase === "up") {

        const progress = Math.max(0, Math.min(1,
            (startY - pointerY) / (startY - railY)
        ));

        const currentY = startY - progress * (startY - railY);

        positionFloatingBead(sourceX, currentY);

        if (progress >= 1) {
            dragPhase = "across";
            positionFloatingBead(sourceX, railY);
        }
    }

    // PHASE 2: Move horizontally along the rail


else if (dragPhase === "across") {

    const minX = Math.min(getColumnX(0), getColumnX(3));
    const maxX = Math.max(getColumnX(0), getColumnX(3));

    const currentX = Math.max(minX, Math.min(maxX, pointerX));

    positionFloatingBead(currentX, railY);

    // Do not select the next column automatically.
    // Wait until the player moves down inside a destination column.

    if (pointerY > railY + 10) {

        let nearestColumn = null;
        let nearestDistance = Infinity;

        for (let i = 0; i < 4; i++) {

            if (i === sourceColumn) continue;
            if (columns[i].length >= 6) continue;

            const columnX = getColumnX(i);
            const distance = Math.abs(currentX - columnX);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestColumn = i;
            }
        }

        // Only select a destination when close to its centre.
        if (nearestColumn !== null && nearestDistance < 20) {

            destinationColumn = nearestColumn;
            destinationX = getColumnX(nearestColumn);

            const destinationElement =
                gameBoard.querySelectorAll(".column")[nearestColumn];

            const slots =
                destinationElement.querySelectorAll(".slot");

            const nextSlotIndex = 5 - columns[nearestColumn].length;

            const slotRect =
                slots[nextSlotIndex].getBoundingClientRect();

            destinationY =
                slotRect.top + slotRect.height / 2;

            dragPhase = "down";

            positionFloatingBead(destinationX, railY);
        }
    }
}

    // PHASE 3: Move straight down
    else if (dragPhase === "down") {

        const progress = Math.max(0, Math.min(1,
            (pointerY - railY) / (destinationY - railY)
        ));

        const currentY = railY + progress * (destinationY - railY);

        positionFloatingBead(destinationX, currentY);
    }
});

// Finish movement
function finishDrag() {
    if (!floatingBead) return;

    let validMove = dragPhase === "down" &&
        destinationColumn !== null &&
        columns[destinationColumn].length < 6;

if (validMove) {
    const colour = columns[sourceColumn].pop();

    columns[destinationColumn].push(colour);

    startTimer();

    moves++;
    movesDisplay.textContent = moves;

    checkWin();
}

    floatingBead.remove();

    floatingBead = null;
    sourceBead = null;
    sourceColumn = null;
    destinationColumn = null;
    dragPhase = null;
    pointerId = null;

    drawBoard();
}

document.addEventListener("pointerup", function(event) {
    if (pointerId !== null && event.pointerId === pointerId) {
        finishDrag();
    }
});

document.addEventListener("pointercancel", function(event) {
    if (pointerId !== null && event.pointerId === pointerId) {
        finishDrag();
    }
});

// Start game
createTargetCard();
drawBoard();


// Reset Game
resetButton.addEventListener("click", function() {
    gameCompleted = false;
    columns = originalColumns.map(column => [...column]);

    moves = 0;
    seconds = 0;
    timerStarted = false;

    clearInterval(timerInterval);
    timerInterval = null;

    movesDisplay.textContent = moves;
    updateTimerDisplay();

    drawBoard();
});



// Change Cards
changeCardsButton.addEventListener("click", function() {

    gameCompleted = false;

    // Generate a new target card
    targetArrangements = generateNewCard();

    // Restore the original bead arrangement
    columns = originalColumns.map(column => [...column]);

    // Reset moves and timer
    moves = 0;
    seconds = 0;
    timerStarted = false;

    clearInterval(timerInterval);
    timerInterval = null;

    movesDisplay.textContent = "0";
    updateTimerDisplay();

    // Display the new card and beads
    createTargetCard();
    drawBoard();
});



// Register the service worker for offline support
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(registration => {
                console.log("Service Worker registered successfully:", registration);
            })
            .catch(error => {
                console.error("Service Worker registration failed:", error);
            });
    });
}
