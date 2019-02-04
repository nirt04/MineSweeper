'use strict'
var MINE = '&#128163'
// The model
var gBoard;
// This is an object by which the gBoard size is set (in this case: 4*4), and how many mines to put
var gLevel = {
    level: null,
    size: null,
    mines: null,
    hints: 3,
    isHinted: false
}
// This is an object in which you can keep and update the current game state:
var gGame = {
    flagsCounter: 0,
    flagsRemain: 6,
    emptysCounter: 0,
    isOn: true,
    isFirstClick: true,
    isFirstClickIds: {
        i: null,
        j: null
    }
}

var gTimeerStart;
var gTimerInterval;
var gElResetBtn = document.querySelector('.reset');
var gElTimer = document.querySelector('.timer')
var gElFlagsCounter = document.querySelector('.score')
var gModal = document.querySelector('.modal')
// Mines sweeper
// Add garray object with all the mines locations
var gMines;

// This is called when page loads
expert();

function initGame() {
    gBoard = buildBoard()
    renderBoard(gBoard);
    gElResetBtn.innerHTML = '&#128578;'
}

// Builds the gBoard Set mines at random locations Call setMinesNegsCount() Return the created gBoard
function buildBoard() {
    var res = new Array(gLevel.size)
    for (let i = 0; i < gLevel.size; i++) {
        res[i] = new Array(gLevel.size)
        for (let j = 0; j < gLevel.size; j++) {
            res[i][j] = {
                value: '',
                isHidden: true,
                isFlag: false,
                isMine: false,
                minesAroundCount: 0,
                i: i,
                j: j,
            }
        }
    }
    gElFlagsCounter.innerText = gGame.flagsRemain + ''
    return res
}

function renderBoard(gBoard) {
    var strHTML = ''
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            strHTML += `<div id="${i}-${j}" class="cell hidden" onmousedown="checkClick(this,event)">${gBoard[i][j].value}</div>`
        }

    }
    var elBoard = document.querySelector('.container-game')
    elBoard.innerHTML = strHTML
    // elBoard = this.className = '';
    elBoard.classList.remove('beginner')
    elBoard.classList.remove('expert')
    elBoard.classList.remove('medium')
    if (gLevel.level === 'beginner') elBoard.classList.add('beginner')
    if (gLevel.level === 'expert') elBoard.classList.add('expert')
    if (gLevel.level === 'medium') elBoard.classList.add('medium')
}

function spawnMinesOnBoard(gBoard, minesAmount) {
    var minesSpawned = 0
    var mines = []
    while (minesSpawned < minesAmount) {
        var randI = randNum(0, gBoard.length)
        var randJ = randNum(0, gBoard[0].length)
        var gBoardCell = gBoard[randI][randJ]
        // preventing the mine from showing in the index of the first click
        if (!gBoardCell.isMine && randI !== gGame.isFirstClickIds.i && randJ !== gGame.isFirstClickIds.j) {
            gBoardCell.isMine = true;
            gBoardCell.value = MINE
            mines.push({
                i: randI,
                j: randJ
            })
            minesSpawned++
        }
    }
    gMines = mines
}

// Sets mine's count to mine's neighbors
// Function loop on all mines locations and adding a 'M' string to each cell in the area of the mine
// example: if cell is near by 2 mines it will get 'M'+'M' - for later use to get his length that will be equal to the mines the cell have near to him
// loop on all the mines to mark their Neighboors with the count of how many around them

function loopOnMines(mines) {
    for (let i = 0; i < mines.length; i++) {
        markNeighboorsOfMine(mines[i].i, mines[i].j, gBoard)
    }
}

function markNeighboorsOfMine(cellI, cellJ, gBoard) {

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= gBoard[i].length) continue;
            if (gBoard[i][j].value !== MINE) {
                gBoard[i][j].value += 'M';
                gBoard[i][j].minesAroundCount += 1
            }
        }
    }
}


function replaceNeighboorsWithNums(gBoard) {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].value === '' || gBoard[i][j].value === MINE) continue;
            // following the last functions it check what is the length of the value ('M'/'MM'/'MMM'...) 
            // and replace it with his length that is equal the mines around
            gBoard[i][j].value = gBoard[i][j].value.length + ''
        }
    }
}

function checkClick(el, event) {
    if (gGame.isOn) {
        var elLoc = {
            i: +el.id.split('-')[0],
            j: +el.id.split('-')[1]
        }
        var gBoardLoc = gBoard[elLoc.i][elLoc.j]
        gBoardLoc = Object.assign({}, gBoardLoc)

        // toggle true on flag and false when removed and counting their nubmers so they dont pass the mines number
        if (event.button === 2 & gGame.isFirstClick) return;
        if (event.button === 2 && gBoardLoc.isHidden && !gGame.isFirstClick) {
            if (gBoardLoc.isFlag && gGame.flagsCounter <= gLevel.mines) {
                gGame.flagsCounter -= 1
                gGame.flagsRemain += 1
                el.classList.remove("flag");
                gBoard[elLoc.i][elLoc.j].isFlag = !gBoard[elLoc.i][elLoc.j].isFlag
                gElFlagsCounter.innerText = gGame.flagsRemain + ''
                return;
            }
            if (!gBoardLoc.isFlag && gGame.flagsCounter < gLevel.mines) {
                gBoard[elLoc.i][elLoc.j].isFlag = !gBoard[elLoc.i][elLoc.j].isFlag
                gGame.flagsCounter += 1
                gGame.flagsRemain -= 1
                el.classList.add("flag");
                gElFlagsCounter.innerText = gGame.flagsRemain + ''
                winCheck()
                return;
            }
        }

        // storing first click idx in order to remove him from the options of the mines
        if (gGame.isFirstClick) {
            gTimeerStart = Date.now() / 1000
            gTimerInterval = setInterval(timer, 1000)
            gGame.isFirstClick = false;
            gGame.isFirstClickIds.i = elLoc.i;
            gGame.isFirstClickIds.j = elLoc.j;
            spawnMinesOnBoard(gBoard, gLevel.mines);
            loopOnMines(gMines);
            replaceNeighboorsWithNums(gBoard);
            renderBoard(gBoard);
            revealFREECell(elLoc.i, elLoc.j)
            if (gBoard[elLoc.i][elLoc.j].value === 'numberRevealed') return;
        }


        if (gLevel.isHinted) {
            el.classList.remove("hidden")
            gLevel.isHinted = false;
            setTimeout(function () {
                gBoardLoc.isHidden = true
                el.classList.add("hidden")
            }, 2000)
            return;
        }


        if (gBoardLoc.isMine && !gBoardLoc.isFlag) return lost();
        if (event.button === 0 && gBoardLoc.isHidden && !gBoardLoc.isFlag) {
            revealFREECell(elLoc.i, elLoc.j)

            // if its empty area we want to expand the search
            if (gBoardLoc.value === "") return expandShown(elLoc.i, elLoc.j)

        }

    }
    gGame.isOn ? winCheck() : null;
}

// When user clicks a cell with no mines around, we need to open not only that cell, but also its neighbors.

function expandShown(cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            // Cannceling the option of searching diagonal
            if (
                i === cellI - 1 && j === cellJ + 1 ||
                i === cellI - 1 && j === cellJ - 1 ||
                i === cellI + 1 && j === cellJ + 1 ||
                i === cellI + 1 && j === cellJ - 1
            ) continue;
            // if the search is the cell him self, skip
            if (i === cellI && j === cellJ) continue;
            // if the shearch is off board limits
            if (j < 0 || j >= gBoard[i].length) continue;
            // Checking if number is showen if its reavel and continue with out expanding the search
            if (/[1-9]/.test(gBoard[i][j].value)) {
                revealFREECell(i, j)
                continue;
            }
            // if empty cell than keep expanding with recursive of this function in order to reavel max emptys untill it reach border of numbers or mines
            if (gBoard[i][j].value === "") {
                revealFREECell(i, j)
                expandShown(i, j)
            }
        }
    }

}

function hint() {
    if (gLevel.hints && !gGame.isFirstClick && gGame.isOn) {
        gLevel.isHinted = true;
        gLevel.hints--
        displayModal('YOU ARE HINTED')
    }
}

function revealFREECell(i, j) {
    var cellDom = document.getElementById(`${i}-${j}`)
    // TODO Make function that remove flag insted of repeating it
    if (gBoard[i][j].isFlag) {
        removeFlag(i, j, cellDom)
    }
    if (/[1-9]/.test(gBoard[i][j].value)) {
        gBoard[i][j].value = 'numberRevealed'

    } else gBoard[i][j].value = 'emptyRevealed';
    // we check if the cell is already revaled becouse of the recursive function expandShowen()
    if (gBoard[i][j].isHidden) {
        gGame.emptysCounter += 1
        gBoard[i][j].isHidden = false;
        cellDom.classList.remove("hidden");
    }
}

function lost() {
    displayModal('YOU\'VE LOST', 'lost')
    clearInterval(gTimerInterval)
    gGame.isOn = false;
    for (let i = 0; i < gMines.length; i++) {
        var mine = document.getElementById(`${gMines[i].i}-${gMines[i].j}`)
        mine.classList.add('mines');
        mine.classList.remove('flag')
        mine.classList.remove('hidden')
    }
    gElResetBtn.innerHTML = '&#128577;'
}

// Game ends when all mines are marked and all the other cells are shown
function winCheck() {
    var revaledNeeded = (gLevel.size * gLevel.size) - gLevel.mines
    if (revaledNeeded === gGame.emptysCounter && gGame.flagsCounter === gMines.length) {
        gGame.isOn = false
        gElResetBtn.innerHTML = '&#128526;'
        clearInterval(gTimerInterval)
        return displayModal('YOU\'VE WON')
    }
}
// And add a string += ‘S’To all neighbors
function timer() {
    var timeNow = Math.floor((Date.now() / 1000) - gTimeerStart) + ''
    timeNow.length === 1 ? timeNow = '00' + timeNow : null;
    timeNow.length === 2 ? timeNow = '0' + timeNow : null;
    gElTimer.innerText = timeNow
}

function removeFlag(i, j, DOM) {
    gBoard[i][j].isFlag = false
    DOM.classList.remove("flag")
    gGame.flagsCounter -= 1
    gGame.flagsRemain += 1
    gElFlagsCounter.innerText = gGame.flagsRemain
}

function expert() {
    resetGameStats(8, 15, 'expert');
    initGame()
}

function medium() {
    resetGameStats(6, 5, 'medium');
    initGame()
}

function beginner() {
    resetGameStats(4, 2, 'beginner');
    initGame()
}

function resetGameStats(size, mines, level) {
    clearInterval(gTimerInterval)
    gElTimer.innerText = '000';
    gLevel = {
        level: level,
        size: size,
        mines: mines,
        hints: 3,
        isHinted: false
    };

    gGame = {
        flagsCounter: 0,
        flagsRemain: gLevel.mines,
        emptysCounter: 0,
        isOn: true,
        isFirstClick: true,
        isFirstClickIds: {
            i: null,
            j: null
        }
    }
}

function reset() {
    if (gLevel.level === 'beginner') return beginner()
    if (gLevel.level === 'medium') return medium()
    if (gLevel.level === 'expert') return expert()
}

function displayModal(text, isLost) {
    if (isLost) gModal.style.backgroundColor = 'red';
    else gModal.style.backgroundColor = 'green'



    gModal.innerText = text
    gModal.classList.remove('hide')
    setTimeout(() => gModal.classList.add('hide'), 1600)
}
// function of loop on all the array that replace the string in to the length of the cell
// Example:
// Cell with 2 =>
// Cell with 0 => will stay empty 


// Find the index of all the mines