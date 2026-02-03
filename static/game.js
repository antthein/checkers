document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const newGameBtn = document.getElementById('new-game-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const turnIndicator = document.getElementById('turn-indicator');
    const historyList = document.getElementById('history-list');

    // UI Elements
    const themeCheckbox = document.getElementById('checkbox');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const currentModeText = document.getElementById('current-mode-text');
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    const instructionsModal = document.getElementById('instructions-modal');
    const instructionsClose = document.getElementById('instructions-close');

    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    const initialMode = urlParams.get('mode') || 'pvp'; // Default to pvp if direct access

    // Update Mode Text
    if (currentModeText) {
        currentModeText.textContent = initialMode === 'ai' ? 'Vs AI' : 'Player Vs Player';
    }

    // Hide dropdown if mode is set via URL (optional, but requested logic)
    // Actually, let's keep it but sync it.
    const gameModeSelect = document.getElementById('game-mode');
    if (gameModeSelect) {
        gameModeSelect.value = initialMode;
    }

    let gameState = {
        board: [],
        turn: 'red',
        selectedPiece: null,
        validMoves: [],
        redLeft: 12,
        whiteLeft: 12,
        gameOver: false,
        mode: initialMode,
        compulsoryJump: false,
        chainJumping: false
    };

    // History Stacks
    let historyStack = [];
    let redoStack = [];

    // Dark Mode Logic (Updated for Checkbox)
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeCheckbox.checked = true;
    }
    themeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    // Instructions Modal Logic
    howToPlayBtn.addEventListener('click', () => {
        instructionsModal.style.display = 'flex';
    });
    instructionsClose.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
    });

    // Undo/Redo Logic
    undoBtn.addEventListener('click', () => performUndo());
    redoBtn.addEventListener('click', () => performRedo());

    function initGame() {
        gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
        gameState.turn = 'red';
        gameState.redLeft = 12;
        gameState.whiteLeft = 12;
        gameState.gameOver = false;
        gameState.selectedPiece = null;
        gameState.validMoves = [];
        gameState.mode = initialMode;
        gameState.compulsoryJump = false;
        gameState.chainJumping = false;

        // Reset History
        historyStack = [];
        redoStack = [];
        updateUndoRedoUI();

        // Initialize pieces
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) {
                    if (r < 3) {
                        gameState.board[r][c] = { color: 'white', king: false }; // AI/Player 2
                    } else if (r > 4) {
                        gameState.board[r][c] = { color: 'red', king: false }; // Player 1
                    }
                }
            }
        }

        renderBoard();
        updateStatus();
    }

    function renderBoard() {
        board.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement('div');
                square.className = `square ${(r + c) % 2 === 1 ? 'dark' : 'light'}`;
                square.dataset.r = r;
                square.dataset.c = c;
                square.onclick = (e) => handleSquareClick(r, c);

                // Highlight valid moves
                if (gameState.validMoves.some(m => m.r === r && m.c === c)) {
                    square.classList.add('valid-move');
                }

                // Render piece
                const pieceData = gameState.board[r][c];
                if (pieceData) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${pieceData.color} ${pieceData.king ? 'king' : ''}`;
                    // Highlight selected piece
                    if (gameState.selectedPiece && gameState.selectedPiece.r === r && gameState.selectedPiece.c === c) {
                        piece.style.border = '3px solid yellow';
                    }
                    square.appendChild(piece);
                }

                board.appendChild(square);
            }
        }
    }

    function getValidMoves(r, c, piece) {
        const moves = [];
        const directions = piece.king ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : (piece.color === 'red' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

        // Check for simple moves and jumps
        directions.forEach(dir => {
            const newR = r + dir[0];
            const newC = c + dir[1];

            if (isValidPos(newR, newC)) {
                // Empty square
                if (!gameState.board[newR][newC]) {
                    // Only allow non-jump moves if NO compulsory jump exists globally (to be implemented strictly later)
                    // For now, let's just add it. rigorous mandatory jump logic requires pre-scan.
                    moves.push({ r: newR, c: newC, isJump: false });
                } else if (gameState.board[newR][newC].color !== piece.color) {
                    // Check jump
                    const jumpR = newR + dir[0];
                    const jumpC = newC + dir[1];
                    if (isValidPos(jumpR, jumpC) && !gameState.board[jumpR][jumpC]) {
                        moves.push({ r: jumpR, c: jumpC, isJump: true, jumpR: newR, jumpC: newC });
                    }
                }
            }
        });
        return moves;
    }

    // Improved valid move logic with mandatory captures
    function getAllValidMoves(color) {
        let jumps = [];
        let simpleMoves = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (gameState.board[r][c] && gameState.board[r][c].color === color) {
                    const piece = gameState.board[r][c];
                    const rawMoves = getValidMoves(r, c, piece);
                    rawMoves.forEach(m => {
                        const moveFull = { ...m, fromR: r, fromC: c };
                        if (m.isJump) jumps.push(moveFull);
                        else simpleMoves.push(moveFull);
                    });
                }
            }
        }
        return jumps.length > 0 ? jumps : simpleMoves;
    }

    function isValidPos(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    function handleSquareClick(r, c) {
        if (gameState.gameOver) return;
        // If AI turn, ignore clicks
        if (gameState.mode === 'ai' && gameState.turn === 'white') return;

        // If in the middle of a chain jump, strictly restrict interaction
        if (gameState.chainJumping) {
            // Can only click on valid move squares (which are highlighted)
            // or the selected piece itself (no-op)
            const move = gameState.validMoves.find(m => m.r === r && m.c === c);
            if (move) {
                executeMove(move);
            }
            return;
        }

        const clickedPiece = gameState.board[r][c];
        const isCurrentPlayersPiece = clickedPiece && clickedPiece.color === gameState.turn;

        // Select piece
        if (isCurrentPlayersPiece) {
            // Check if this piece has valid moves considering mandatory jumps
            const allMoves = getAllValidMoves(gameState.turn);
            const movesForThisPiece = allMoves.filter(m => m.fromR === r && m.fromC === c);

            if (movesForThisPiece.length > 0) {
                gameState.selectedPiece = { r, c };
                gameState.validMoves = movesForThisPiece;
                renderBoard();
            }
            return;
        }

        // Move piece
        if (gameState.selectedPiece) {
            const move = gameState.validMoves.find(m => m.r === r && m.c === c);
            if (move) {
                executeMove(move);
            } else {
                // Deselect if clicking invalid square (only if not chain jumping)
                gameState.selectedPiece = null;
                gameState.validMoves = [];
                renderBoard();
            }
        }
    }

    function saveState() {
        // Deep copy board and relevant state
        const stateCopy = {
            board: JSON.parse(JSON.stringify(gameState.board)),
            turn: gameState.turn,
            redLeft: gameState.redLeft,
            whiteLeft: gameState.whiteLeft,
            gameOver: gameState.gameOver,
            compulsoryJump: gameState.compulsoryJump
        };
        historyStack.push(stateCopy);
        redoStack = []; // Clear redo on new move
        updateUndoRedoUI();
    }

    function performUndo() {
        if (historyStack.length === 0) return;

        let stepsToUndo = 1;
        if (gameState.mode === 'ai') {
            // In AI mode, undoing means reverting Player's move AND AI's move (so 2 steps)
            // Unless it was player's turn (e.g. invalid state?), usually we undo to start of player turn.
            if (historyStack.length >= 2) stepsToUndo = 2;
            else stepsToUndo = historyStack.length; // fallback
        }

        // Save current state to redoStack before restoring
        // Actually, for redo to work like standard, we need to push CURRENT state to redo 
        // before overwriting it with previous via undo.
        // Simplified approach: Redo stack holds "future" states.

        // Push current state to redo
        redoStack.push({
            board: JSON.parse(JSON.stringify(gameState.board)),
            turn: gameState.turn,
            redLeft: gameState.redLeft,
            whiteLeft: gameState.whiteLeft,
            gameOver: gameState.gameOver,
            compulsoryJump: gameState.compulsoryJump
        });

        // If undoing 2 steps, we need to push the intermediate state too? 
        // This gets complex for AI. Simple approach: In AI mode, redo is disabled or clears on AI move.
        // Let's implement robust single-step undo for now, and handle AI logic by calling it twice if needed.

        const prevState = historyStack.pop();
        restoreState(prevState);

        if (gameState.mode === 'ai' && gameState.turn === 'white' && historyStack.length > 0) {
            // We undid to White's turn? That means we undid AI's move. 
            // Now we are at Black's move (Player 1 ended turn).
            // This is strange.
            // Let's stick to: Undo reverts 1 turn.
            // If AI just moved, it is Red's turn. Undo -> White's turn (AI).
            // AI will immediately move again? 
            // Fix: If we undo to AI's turn, we should probably undo ONCE MORE to get to Player's turn.

            const prevPrevState = historyStack.pop();
            // We need to move the 'prevState' (AI's start state) to redo stack too?
            // To keep it simple: Undo in AI mode reverts 2 turns (Player + AI).
            if (prevPrevState) {
                redoStack.push(prevState); // Keep history consistent?
                restoreState(prevPrevState);
            }
        }

        updateUndoRedoUI();
        renderBoard();
    }

    function performRedo() {
        if (redoStack.length === 0) return;

        const nextState = redoStack.pop();
        // Save current to history
        historyStack.push({
            board: JSON.parse(JSON.stringify(gameState.board)),
            turn: gameState.turn,
            redLeft: gameState.redLeft,
            whiteLeft: gameState.whiteLeft,
            gameOver: gameState.gameOver,
            compulsoryJump: gameState.compulsoryJump
        });

        restoreState(nextState);
        updateUndoRedoUI();
        renderBoard();
    }

    function restoreState(state) {
        gameState.board = JSON.parse(JSON.stringify(state.board));
        gameState.turn = state.turn;
        gameState.redLeft = state.redLeft;
        gameState.whiteLeft = state.whiteLeft;
        gameState.gameOver = state.gameOver;
        gameState.compulsoryJump = state.compulsoryJump;
        gameState.selectedPiece = null;
        gameState.validMoves = [];
        gameState.chainJumping = false;
        updateStatus();
    }

    function updateUndoRedoUI() {
        undoBtn.disabled = historyStack.length === 0;
        redoBtn.disabled = redoStack.length === 0;
    }

    function executeMove(move) {
        // SAVE STATE BEFORE MOVE
        // Only save if NOT chain jumping (start of a turn sequence)
        if (!gameState.chainJumping) {
            saveState();
        }

        let piece = gameState.board[move.fromR][move.fromC];
        gameState.board[move.r][move.c] = piece;
        gameState.board[move.fromR][move.fromC] = null;

        let promoted = false; // Track promotion to end turn immediately

        // Handle Jump
        if (move.isJump) {
            gameState.board[move.jumpR][move.jumpC] = null;
            if (piece.color === 'red') gameState.whiteLeft--;
            else gameState.redLeft--;
        }

        // King Promotion
        if (!piece.king && ((piece.color === 'red' && move.r === 0) || (piece.color === 'white' && move.r === 7))) {
            piece.king = true;
            promoted = true;
        }

        // Handle Chain Jumping
        let moreJumps = [];
        if (move.isJump && !promoted) {
            // Check for more jumps from the NEW position
            const subsequentMoves = getValidMoves(move.r, move.c, piece);
            moreJumps = subsequentMoves.filter(m => m.isJump);
        }

        if (moreJumps.length > 0) {
            // Chain jump available
            gameState.chainJumping = true;
            gameState.selectedPiece = { r: move.r, c: move.c };
            // Map simple moves to include fromR/fromC for consistency, though here we only have one source
            gameState.validMoves = moreJumps.map(m => ({ ...m, fromR: move.r, fromC: move.c }));

            // For AI, we can recursively call or just schedule next move if it's AI
            // But executeMove is sync. If it's AI, we should probably continue immediately.
            // However, this architecture relies on click handling or makeAIMove.

            checkWinCondition(); // Check if game over during jump (e.g. wiped out opponent)
            renderBoard();

            if (gameState.mode === 'ai' && gameState.turn === 'white' && !gameState.gameOver) {
                setTimeout(() => {
                    const randomNext = gameState.validMoves[Math.floor(Math.random() * gameState.validMoves.length)];
                    executeMove(randomNext);
                }, 500);
            }
            return; // Turn does NOT end
        }

        // End turn
        gameState.chainJumping = false;
        gameState.selectedPiece = null;
        gameState.validMoves = [];

        checkWinCondition();

        if (!gameState.gameOver) {
            gameState.turn = gameState.turn === 'red' ? 'white' : 'red';
            updateStatus();

            // AI Turn Trigger
            if (gameState.mode === 'ai' && gameState.turn === 'white') {
                setTimeout(makeAIMove, 500);
            }
        }
        renderBoard();
    }

    function makeAIMove() {
        if (gameState.gameOver) return;

        const allMoves = getAllValidMoves('white');
        if (allMoves.length === 0) {
            // AI loses
            gameState.gameOver = true;
            showModal("You Win!");
            saveGame('red');
            return;
        }

        const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        executeMove(randomMove);
    }

    function checkWinCondition() {
        if (gameState.redLeft === 0) {
            endGame('white');
        } else if (gameState.whiteLeft === 0) {
            endGame('red');
        } else {
            // Check if current player has any moves
            // Swapped turn briefly to check next player's moves? 
            // Actually, we check at start of turn usually.
        }
    }

    function endGame(winner) {
        gameState.gameOver = true;
        updateStatus();
        showModal(`${winner.toUpperCase()} Wins!`);
        saveGame(winner);
    }

    function showModal(msg) {
        const modal = document.getElementById('game-over-modal');
        const modalMsg = document.getElementById('modal-message');
        const modalRestart = document.getElementById('modal-restart');
        const modalClose = document.getElementById('modal-close');

        modalMsg.textContent = msg;
        modal.style.display = 'flex';

        modalRestart.onclick = () => {
            modal.style.display = 'none';
            initGame();
        };

        modalClose.onclick = () => {
            modal.style.display = 'none';
        };
    }

    function saveGame(winner) {
        fetch('/api/save_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ winner: winner, mode: gameState.mode })
        }).then(() => loadHistory());
    }

    function loadHistory() {
        fetch('/api/history')
            .then(res => res.json())
            .then(data => {
                historyList.innerHTML = data.map(g => `<li>${g.winner_name} (${g.mode})</li>`).join('');
            });
    }

    function updateStatus() {
        turnIndicator.innerHTML = `Turn: <span class="${gameState.turn === 'red' ? 'turn-red' : 'turn-white'}">${gameState.turn.toUpperCase()}</span>`;
    }

    newGameBtn.addEventListener('click', initGame);
    // gameModeSelect.addEventListener('change', initGame); // Removed

    // Initial load
    initGame();
    loadHistory();
});
