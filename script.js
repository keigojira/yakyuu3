document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const setupSection = document.getElementById('setup-section');
    const scoreboardSection = document.getElementById('scoreboard-section');
    const historySection = document.getElementById('history-section');
    const bigCountSection = document.getElementById('big-count-section'); // 大画面カウント表示セクション

    const awayTeamNameInput = document.getElementById('awayTeamNameInput');
    const homeTeamNameInput = document.getElementById('homeTeamNameInput');
    const playerCountInput = document.getElementById('playerCountInput');
    const awayPlayersDiv = document.getElementById('awayPlayers');
    const homePlayersDiv = document.getElementById('homePlayers');
    const startGameButton = document.getElementById('startGameButton');

    const awayTeamLabel = document.getElementById('awayTeamLabel');
    const homeTeamLabel = document.getElementById('homeTeamLabel');
    const awayTotalScoreLabel = document.getElementById('awayTotalScore');
    const homeTotalScoreLabel = document.getElementById('homeTotalScore');
    const awayTotalHLabel = document.getElementById('awayTotalH');
    const homeTotalHLabel = document.getElementById('homeTotalH');
    const awayTotalELabel = document.getElementById('awayTotalE');
    const homeTotalELabel = document.getElementById('homeTotalE');
    const awayTeamAvgLabel = document.getElementById('awayTeamAvg');
    const homeTeamAvgLabel = document.getElementById('homeTeamAvg');
    const awayTeamObpLabel = document.getElementById('awayTeamObp');
    const homeTeamObpLabel = document.getElementById('homeTeamObp');

    const currentInningInfo = document.getElementById('currentInningInfo');
    const outsInfo = document.getElementById('outsInfo');
    const ballsInfo = document.getElementById('ballsInfo');
    const strikesInfo = document.getElementById('strikesInfo');

    const firstBase = document.getElementById('firstBase');
    const secondBase = document.getElementById('secondBase');
    const thirdBase = document.getElementById('thirdBase');

    const currentBatterSelect = document.getElementById('currentBatterSelect');

    const batterOutButton = document.getElementById('batterOut');
    const batterSingleButton = document.getElementById('batterSingle');
    const batterDoubleButton = document.getElementById('batterDouble');
    const batterTripleButton = document.getElementById('batterTriple');
    const batterHomeRunButton = document.getElementById('batterHomeRun');
    const batterWalkButton = document.getElementById('batterWalk');
    const batterHBPButton = document.getElementById('batterHBP');
    const batterSacrificeButton = document.getElementById('batterSacrifice');
    const batterErrorButton = document.getElementById('batterError');

    const addRunButton = document.getElementById('addRun');
    const subtractRunButton = document.getElementById('subtractRun');
    const addErrorButton = document.getElementById('addError');
    const subtractErrorButton = document.getElementById('subtractError');

    const clearBasesButton = document.getElementById('clearBases');
    const addBallButton = document.getElementById('addBall');
    const addStrikeButton = document.getElementById('addStrike');
    const resetCountButton = document.getElementById('resetCount');

    const nextInningButton = document.getElementById('nextInning');
    const switchSidesButton = document.getElementById('switchSides');
    const endGameButton = document.getElementById('endGame');
    const resetGameButton = document.getElementById('resetGame');

    const awayPlayerStatsTableBody = document.querySelector('#awayPlayerStatsTable tbody');
    const homePlayerStatsTableBody = document.querySelector('#homePlayerStatsTable tbody');
    const awayPlayerStatsTeamName = document.getElementById('awayPlayerStatsTeamName');
    const homePlayerStatsTeamName = document.getElementById('homePlayerStatsTeamName');

    const gameHistoryList = document.getElementById('gameHistoryList');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    // 大きなカウント表示用の要素
    const showBigCountButton = document.createElement('button'); // Dynamically create button
    showBigCountButton.id = 'showBigCountButton';
    showBigCountButton.classList.add('btn', 'btn-primary');
    showBigCountButton.textContent = 'カウントを大画面表示';
    // 試合開始時に動的に追加される場所を考慮して、既存のcontrols-gridに追加
    const inningGameControls = document.querySelector('.inning-game-controls .button-grid-2col');
    if (inningGameControls) {
        inningGameControls.appendChild(showBigCountButton);
    }

    const backToScoreboardButton = document.getElementById('backToScoreboardButton');
    const bigBallsCount = document.getElementById('bigBallsCount');
    const bigStrikesCount = document.getElementById('bigStrikesCount');
    const bigOutsCount = document.getElementById('bigOutsCount');

    // --- Game State Variables ---
    let currentInning = 1;
    let isTopInning = true; // true: top (away batting), false: bottom (home batting)
    let outs = 0;
    let balls = 0;
    let strikes = 0;
    let bases = [false, false, false]; // [1st, 2nd, 3rd]

    let awayTeamName = "ビジターズ";
    let homeTeamName = "ホームズ";
    let playerCount = 9;

    let awayPlayers = [];
    let homePlayers = [];

    let totalHits = {}; // Initialization in initializeGame
    let totalErrors = {}; // Initialization in initializeGame

    let inningScores = []; // Array of objects [{away: score, home: score}, {away: score, home: score}, ...]
    let gameHistoryLog = []; // Records for the current game session (reset on game end)

    let savedGameResults = []; // Records for all past games (persists in localStorage)

    // --- Utility Functions ---
    function getBattingTeamName() {
        return isTopInning ? awayTeamName : homeTeamName;
    }

    function getOppositeTeamName() {
        return isTopInning ? homeTeamName : awayTeamName;
    }

    function getBattingPlayers() {
        return isTopInning ? awayPlayers : homePlayers;
    }

    function formatStat(value) {
        if (isNaN(value) || !isFinite(value) || value === 0) {
            return '.000';
        }
        // Ensure rounding to 3 decimal places and then string formatting
        return (value).toFixed(3).substring(1); // Remove leading 0 for .XXX format
    }

    // --- Player Management Functions ---
    playerCountInput.addEventListener('change', generatePlayerInputFields);

    function generatePlayerInputFields() {
        const count = parseInt(playerCountInput.value);
        if (isNaN(count) || count < 1 || count > 25) {
            alert("選手人数は1から25の間で入力してください。");
            playerCountInput.value = playerCount; // Revert to previous valid count
            return;
        }
        playerCount = count;
        // Reinitialize or preserve player data based on new count
        awayPlayers = initializePlayerStats(awayPlayers, playerCount);
        homePlayers = initializePlayerStats(homePlayers, playerCount);
        createPlayerInputDivs(awayPlayersDiv, 'away', awayPlayers);
        createPlayerInputDivs(homePlayersDiv, 'home', homePlayers);
        saveGameState(); // Save count change
    }

    function createPlayerInputDivs(container, teamPrefix, playersData) {
        container.innerHTML = '';
        for (let i = 0; i < playerCount; i++) {
            const div = document.createElement('div');
            div.classList.add('player-input-group');
            div.innerHTML = `
                <label for="${teamPrefix}Player${i + 1}">打席${i + 1}:</label>
                <input type="text" id="${teamPrefix}Player${i + 1}" value="${playersData[i] ? playersData[i].name : '選手' + (i + 1)}">
            `;
            container.appendChild(div);
        }
    }

    function initializePlayerStats(playersArray, count) {
        const newPlayersArray = [];
        for (let i = 0; i < count; i++) {
            const existingPlayer = playersArray[i];
            newPlayersArray.push({
                name: existingPlayer ? existingPlayer.name : '選手' + (i + 1),
                atBats: existingPlayer ? existingPlayer.atBats : 0, // 打数
                hits: existingPlayer ? existingPlayer.hits : 0,     // 安打
                walks: existingPlayer ? existingPlayer.walks : 0,   // 四球
                hbp: existingPlayer ? existingPlayer.hbp : 0,       // 死球
                sacrifice: existingPlayer ? existingPlayer.sacrifice : 0, // 犠打/犠飛
            });
        }
        return newPlayersArray;
    }

    function updatePlayerNamesFromInputs() {
        awayPlayers.forEach((player, index) => {
            const input = document.getElementById(`awayPlayer${index + 1}`);
            if (input) player.name = input.value || `選手${index + 1}`; // Fallback if input is empty
        });
        homePlayers.forEach((player, index) => {
            const input = document.getElementById(`homePlayer${index + 1}`);
            if (input) player.name = input.value || `選手${index + 1}`; // Fallback if input is empty
        });
    }

    function populateBatterSelect() {
        currentBatterSelect.innerHTML = '';
        const battingPlayers = getBattingPlayers();
        battingPlayers.forEach((player, index) => {
            const option = document.createElement('option');
            option.value = index; // Player index
            option.textContent = `${index + 1}. ${player.name}`;
            currentBatterSelect.appendChild(option);
        });
        // Select the first batter by default if available
        if (battingPlayers.length > 0) {
            currentBatterSelect.value = 0;
        }
    }

    function calculatePlayerStats(player) {
        // AVG: H / AB
        const avg = player.atBats > 0 ? player.hits / player.atBats : 0;

        // OBP: (H + BB + HBP) / (AB + BB + HBP + SF)
        // Note: SF (Sacrifice Fly) counts in PA denominator but not AB.
        // SH (Sacrifice Hit/Bunt) does not count in AB or PA denominator.
        // For simplicity, we assume player.sacrifice includes both SF and SH.
        // We include player.sacrifice in PA denominator for OBP calculation,
        // which might not be strictly accurate for SH but is a common simplification.
        const paDenominator = player.atBats + player.walks + player.hbp + player.sacrifice;
        const obp = paDenominator > 0 ? (player.hits + player.walks + player.hbp) / paDenominator : 0;

        return { avg: formatStat(avg), obp: formatStat(obp) };
    }

    function calculateTeamStats() {
        const awayTeamPlayers = awayPlayers;
        const homeTeamPlayers = homePlayers;

        let awayTeamAB = 0, awayTeamH = 0, awayTeamBB = 0, awayTeamHBP = 0, awayTeamSac = 0;
        let homeTeamAB = 0, homeTeamH = 0, homeTeamBB = 0, homeTeamHBP = 0, homeTeamSac = 0;

        awayTeamPlayers.forEach(player => {
            awayTeamAB += player.atBats;
            awayTeamH += player.hits;
            awayTeamBB += player.walks;
            awayTeamHBP += player.hbp;
            awayTeamSac += player.sacrifice;
        });

        homeTeamPlayers.forEach(player => {
            homeTeamAB += player.atBats;
            homeTeamH += player.hits;
            homeTeamBB += player.walks;
            homeTeamHBP += player.hbp;
            homeTeamSac += player.sacrifice;
        });

        const awayAvg = awayTeamAB > 0 ? awayTeamH / awayTeamAB : 0;
        const awayObpDenominator = awayTeamAB + awayTeamBB + awayTeamHBP + awayTeamSac;
        const awayObp = awayObpDenominator > 0 ? (awayTeamH + awayTeamBB + awayTeamHBP) / awayObpDenominator : 0;

        const homeAvg = homeTeamAB > 0 ? homeTeamH / homeTeamAB : 0;
        const homeObpDenominator = homeTeamAB + homeTeamBB + homeTeamHBP + homeTeamSac;
        const homeObp = homeObpDenominator > 0 ? (homeTeamH + homeTeamBB + homeTeamHBP) / homeObpDenominator : 0;

        awayTeamAvgLabel.textContent = formatStat(awayAvg);
        awayTeamObpLabel.textContent = formatStat(awayObp);
        homeTeamAvgLabel.textContent = formatStat(homeAvg);
        homeTeamObpLabel.textContent = formatStat(homeObp);

        totalHits[awayTeamName] = awayTeamH;
        totalHits[homeTeamName] = homeTeamH;
    }

    function displayPlayerStats() {
        awayPlayerStatsTeamName.textContent = awayTeamName;
        homePlayerStatsTeamName.textContent = homeTeamName;

        displayTeamPlayerStats(awayPlayers, awayPlayerStatsTableBody);
        displayTeamPlayerStats(homePlayers, homePlayerStatsTableBody);
    }

    function displayTeamPlayerStats(players, tableBody) {
        tableBody.innerHTML = '';
        players.forEach((player, index) => {
            const stats = calculatePlayerStats(player);
            const row = tableBody.insertRow();
            row.insertCell().textContent = index + 1;
            row.insertCell().textContent = player.name;
            row.insertCell().textContent = player.atBats;
            row.insertCell().textContent = player.hits;
            row.insertCell().textContent = player.walks;
            row.insertCell().textContent = player.hbp;
            row.insertCell().textContent = player.sacrifice;
            row.insertCell().textContent = stats.avg;
            row.insertCell().textContent = stats.obp;
        });
    }

    // --- Game Logic Functions ---

    function initializeGame() {
        currentInning = 1;
        isTopInning = true;
        outs = 0;
        balls = 0;
        strikes = 0;
        bases = [false, false, false];
        inningScores = [{ [awayTeamName]: 0, [homeTeamName]: 0 }]; // Initialize first inning score

        updatePlayerNamesFromInputs(); // Update names from setup inputs
        awayPlayers.forEach(player => {
            player.atBats = 0; player.hits = 0; player.walks = 0; player.hbp = 0; player.sacrifice = 0;
        });
        homePlayers.forEach(player => {
            player.atBats = 0; player.hits = 0; player.walks = 0; player.hbp = 0; player.sacrifice = 0;
        });

        totalHits = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalErrors = { [awayTeamName]: 0, [homeTeamName]: 0 };

        gameHistoryLog = []; // Clear current game history log

        updateUI();
        addGameHistoryLog('試合開始: ' + awayTeamName + ' vs ' + homeTeamName);
        saveGameState(); // Save initial state
    }

    function addRun(count = 1) {
        const team = getBattingTeamName();
        if (inningScores[currentInning - 1]) {
            inningScores[currentInning - 1][team] += count;
        } else {
            console.error(`Inning ${currentInning} does not exist in inningScores. Adding new inning.`);
            inningScores.push({ [awayTeamName]: 0, [homeTeamName]: 0 });
            inningScores[currentInning - 1][team] = count;
        }
        updateUI();
        addGameHistoryLog(team + 'が得点しました (' + count + '点).');
        saveGameState();
    }

    function subtractRun(count = 1) {
        const team = getBattingTeamName();
        if (inningScores[currentInning - 1] && inningScores[currentInning - 1][team] >= count) {
            inningScores[currentInning - 1][team] -= count;
        } else if (inningScores[currentInning - 1]) {
            inningScores[currentInning - 1][team] = 0;
        }
        updateUI();
        addGameHistoryLog(team + 'の得点が' + count + '点減りました.');
        saveGameState();
    }

    function addError() {
        const team = getOppositeTeamName(); // Error is recorded against the fielding team
        totalErrors[team]++;
        updateUI();
        addGameHistoryLog(team + 'にエラー追加 (' + totalErrors[team] + 'E).');
        saveGameState();
    }

    function subtractError() {
        const team = getOppositeTeamName();
        if (totalErrors[team] > 0) {
            totalErrors[team]--;
        }
        updateUI();
        addGameHistoryLog(team + 'のエラー削減 (' + totalErrors[team] + 'E).');
        saveGameState();
    }

    function handleBatterOutcome(outcomeType) {
        const selectedBatterIndex = currentBatterSelect.value;
        if (selectedBatterIndex === "" || isNaN(selectedBatterIndex)) {
            alert("打者を選択してください。");
            return;
        }

        const battingPlayers = getBattingPlayers();
        const currentBatter = battingPlayers[selectedBatterIndex];

        if (!currentBatter) {
            console.error("No current batter selected or found.");
            return;
        }

        resetPitchCount(); // Reset count after any batter outcome

        let runsScored = 0;
        switch (outcomeType) {
            case 'out':
                addOut();
                addGameHistoryLog(`${currentBatter.name}がアウトになりました.`);
                currentBatter.atBats++; // Count as at-bat
                break;
            case 'single':
                runsScored = advanceRunners(1);
                addRun(runsScored);
                currentBatter.hits++;
                currentBatter.atBats++; // Count as at-bat
                addGameHistoryLog(`${currentBatter.name}がヒットを打ちました. (${runsScored}点)`);
                break;
            case 'double':
                runsScored = advanceRunners(2);
                addRun(runsScored);
                currentBatter.hits++;
                currentBatter.atBats++; // Count as at-bat
                addGameHistoryLog(`${currentBatter.name}が二塁打を打ちました. (${runsScored}点)`);
                break;
            case 'triple':
                runsScored = advanceRunners(3);
                addRun(runsScored);
                currentBatter.hits++;
                currentBatter.atBats++; // Count as at-bat
                addGameHistoryLog(`${currentBatter.name}が三塁打を打ちました. (${runsScored}点)`);
                break;
            case 'homeRun':
                // All runners plus batter score
                runsScored = (bases[0] ? 1 : 0) + (bases[1] ? 1 : 0) + (bases[2] ? 1 : 0) + 1;
                addRun(runsScored);
                clearBases(); // All runners home
                currentBatter.hits++;
                currentBatter.atBats++; // Count as at-bat
                addGameHistoryLog(`${currentBatter.name}がホームラン！(${runsScored}点).`);
                break;
            case 'walk': // Base on Balls (BB)
                runsScored = advanceRunners(0); // 0 signifies a walk/HBP for advancing logic
                addRun(runsScored);
                currentBatter.walks++;
                // Not counted as at-bat
                addGameHistoryLog(`${currentBatter.name}が四球を選びました. (${runsScored}点)`);
                break;
            case 'hbp': // Hit By Pitch (HBP)
                runsScored = advanceRunners(0); // Same advance logic as walk
                addRun(runsScored);
                currentBatter.hbp++;
                // Not counted as at-bat
                addGameHistoryLog(`${currentBatter.name}が死球を受けました. (${runsScored}点)`);
                break;
            case 'sacrifice': // Sacrifice Hit (SH) or Sacrifice Fly (SF)
                addOut(); // An out is recorded
                currentBatter.sacrifice++;
                // Runners advance logic for sacrifice is complex and depends on type (fly/bunt).
                // For simplicity, we don't auto-advance runners here; manual base controls are available.
                // If a run scored on a sacrifice fly, the user should manually add the run.
                addGameHistoryLog(`${currentBatter.name}が犠打/犠飛をしました. (1アウト追加)`);
                // Not counted as at-bat
                break;
            case 'error': // Reached on Error (ROE)
                runsScored = advanceRunners(1); // Treat as a single for base advancement
                addRun(runsScored); // Error might score a run
                addError(); // Record an error for the fielding team
                currentBatter.atBats++; // Count as at-bat (batter still had a plate appearance)
                addGameHistoryLog(`${currentBatter.name}が相手失策で出塁しました. (${runsScored}点)`);
                break;
        }

        updateUI();
        saveGameState();
    }

    function addOut() {
        outs++;
        if (outs >= 3) {
            outs = 0;
            resetPitchCount();
            clearBases();
            switchSides();
            addGameHistoryLog('3アウトチェンジ！');
        } else {
            addGameHistoryLog('アウト追加 (' + outs + 'アウト).');
        }
        updateUI();
        saveGameState();
    }

    function addBall() {
        balls++;
        if (balls >= 4) {
            balls = 0;
            strikes = 0;
            addGameHistoryLog('ボールカウントが4になりました。四球ボタンを押して打者を進塁させてください。');
            // User needs to click "batterWalk" to process the walk
        } else {
            addGameHistoryLog('ボール追加 (' + balls + 'B).');
        }
        updateUI();
        saveGameState();
    }

    function addStrike() {
        strikes++;
        if (strikes >= 3) {
            strikes = 0;
            balls = 0;
            addGameHistoryLog('ストライクカウントが3になりました。アウトボタンを押して打者をアウトにしてください。');
            // User needs to click "batterOut" to process the strikeout
        } else {
            addGameHistoryLog('ストライク追加 (' + strikes + 'S).');
        }
        updateUI();
        saveGameState();
    }

    function resetPitchCount() {
        balls = 0;
        strikes = 0;
        updateUI();
        saveGameState();
    }

    function clearBases() {
        bases = [false, false, false];
        updateUI();
        addGameHistoryLog('塁上クリア.');
        saveGameState();
    }

    /**
     * Advances runners based on hit type or walk/HBP.
     * @param {number} advanceType 0=walk/HBP, 1=single, 2=double, 3=triple
     * @returns {number} scoredRuns - Number of runs scored in this play.
     */
    function advanceRunners(advanceType) {
        let scoredRuns = 0;
        let newBases = [false, false, false]; // [1st, 2nd, 3rd]

        // 3rd base runner
        if (bases[2]) {
            scoredRuns++;
        }
        // 2nd base runner
        if (bases[1]) {
            if (advanceType === 1 || advanceType === 0) { // Single or Walk/HBP
                newBases[2] = true;
            } else { // Double, Triple (runner scores)
                scoredRuns++;
            }
        }
        // 1st base runner
        if (bases[0]) {
            if (advanceType === 0) { // Walk/HBP (forced advance)
                if (!newBases[1]) newBases[1] = true; // If 2nd base is empty after previous advances
                else if (!newBases[2]) newBases[2] = true; // If 2nd base is occupied, try 3rd
                else scoredRuns++; // If 2nd and 3rd are occupied, score a run
            } else if (advanceType === 1) { // Single
                newBases[1] = true;
            } else if (advanceType === 2) { // Double
                newBases[2] = true;
            } else if (advanceType === 3) { // Triple
                scoredRuns++;
            }
        }

        // Batter's advance
        if (advanceType === 0) { // Walk/HBP
            newBases[0] = true; // Batter goes to 1st
        } else if (advanceType === 1) { // Single
            newBases[0] = true;
        } else if (advanceType === 2) { // Double
            newBases[1] = true;
        } else if (advanceType === 3) { // Triple
            newBases[2] = true;
        }

        bases = newBases; // Apply new base state
        return scoredRuns;
    }

    function switchSides() {
        isTopInning = !isTopInning;
        if (isTopInning) { // If it's the top of the inning, increment inning number
            currentInning++;
            // Initialize new inning score if it doesn't exist
            if (!inningScores[currentInning - 1]) {
                inningScores.push({ [awayTeamName]: 0, [homeTeamName]: 0 });
            }
        }
        outs = 0;
        balls = 0;
        strikes = 0;
        clearBases();
        populateBatterSelect(); // Update batter select list for new batting team
        updateUI();
        addGameHistoryLog('攻守交代: ' + currentInning + '回' + (isTopInning ? '表' : '裏'));
        saveGameState();
    }

    function nextInning() {
        // Force 3 outs if less than 3, then switch sides
        if (outs < 3) {
            if (!confirm("アウトカウントが3未満ですが、強制的にイニングを進めますか？")) {
                return;
            }
        }
        outs = 3; // Force 3 outs to trigger switchSides logic
        switchSides();
        addGameHistoryLog('強制的に次イニングへ.');
        updateUI();
        saveGameState();
    }

    function endGame() {
        const confirmEnd = confirm("試合を終了しますか？");
        if (!confirmEnd) return;

        const awayTotal = calculateTotalScore(awayTeamName);
        const homeTotal = calculateTotalScore(homeTeamName);
        let winner = '引き分け';
        if (awayTotal > homeTotal) {
            winner = awayTeamName;
        } else if (homeTotal > awayTotal) {
            winner = homeTeamName;
        }

        // Calculate final team stats for history
        const awayTeamStatTotals = calculateTeamStatTotals(awayPlayers);
        const homeTeamStatTotals = calculateTeamStatTotals(homePlayers);

        const gameResult = {
            date: new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            awayTeam: awayTeamName,
            homeTeam: homeTeamName,
            awayScore: awayTotal,
            homeScore: homeTotal,
            awayHits: totalHits[awayTeamName],
            homeHits: totalHits[homeTeamName],
            awayErrors: totalErrors[awayTeamName],
            homeErrors: totalErrors[homeTeamName],
            awayAvg: formatStat(awayTeamStatTotals.totalH / (awayTeamStatTotals.totalAB || 1)),
            homeAvg: formatStat(homeTeamStatTotals.totalH / (homeTeamStatTotals.totalAB || 1)),
            awayObp: formatStat((awayTeamStatTotals.totalH + awayTeamStatTotals.totalBB + awayTeamStatTotals.totalHBP) / (awayTeamStatTotals.totalAB + awayTeamStatTotals.totalBB + awayTeamStatTotals.totalHBP + awayTeamStatTotals.totalSFSH || 1)),
            homeObp: formatStat((homeTeamStatTotals.totalH + homeTeamStatTotals.totalBB + homeTeamStatTotals.totalHBP) / (homeTeamStatTotals.totalAB + homeTeamStatTotals.totalBB + homeTeamStatTotals.totalHBP + homeTeamStatTotals.totalSFSH || 1)),
            winner: winner,
            details: JSON.parse(JSON.stringify(inningScores)) // Deep copy
        };
        savedGameResults.push(gameResult);
        saveGameResults();
        addGameHistoryLog('試合終了: ' + gameResult.awayTeam + ': ' + gameResult.awayScore + ' - ' + gameResult.homeTeam + ': ' + gameResult.homeScore + ' (' + winner + 'の勝利)');

        alert("試合が終了しました。\n最終スコア: " + gameResult.awayTeam + ': ' + gameResult.awayScore + ' - ' + gameResult.homeTeam + ': ' + gameResult.homeScore);

        // After game end, reset scoreboard state and show setup/history
        setupSection.classList.remove('hidden');
        scoreboardSection.classList.add('hidden');
        historySection.classList.remove('hidden'); // Show history after game
        bigCountSection.classList.add('hidden'); // Hide big count if it was visible
        displayGameResults(); // Update history list
        resetGame(false); // Reset current game but don't ask for confirmation
    }

    function resetGame(confirmReset = true) {
        if (confirmReset && !confirm("現在の試合をリセットしますか？この操作は取り消せません。")) {
            return;
        }
        // Re-read team names and player count from inputs, just in case user changed them
        awayTeamName = awayTeamNameInput.value || "ビジターズ";
        homeTeamName = homeTeamNameInput.value || "ホームズ";
        playerCount = parseInt(playerCountInput.value) || 9;
        initializeGame(); // Re-initialize game state
        saveGameState(); // Save reset state
    }

    function calculateTeamStatTotals(players) {
        let totalAB = 0;
        let totalH = 0;
        let totalBB = 0;
        let totalHBP = 0;
        let totalSFSH = 0;
        players.forEach(player => {
            totalAB += player.atBats;
            totalH += player.hits;
            totalBB += player.walks;
            totalHBP += player.hbp;
            totalSFSH += player.sacrifice;
        });
        return { totalAB, totalH, totalBB, totalHBP, totalSFSH };
    }

    // --- UI Update Functions ---

    function updateUI() {
        // Update Team Names
        awayTeamLabel.textContent = awayTeamName;
        homeTeamLabel.textContent = homeTeamName;

        // Update Inning Info
        currentInningInfo.textContent = `${currentInning}回${isTopInning ? '表' : '裏'}`;
        outsInfo.textContent = `O: ${outs}`;
        ballsInfo.textContent = `B: ${balls}`;
        strikesInfo.textContent = `S: ${strikes}`;

        // Update Bases
        firstBase.classList.toggle('active', bases[0]);
        secondBase.classList.toggle('active', bases[1]);
        thirdBase.classList.toggle('active', bases[2]);

        // Update Scores and Totals
        updateScoreboardTable();

        calculateTeamStats(); // Calculate team stats (AVG, OBP) and update totalHits
        awayTotalHLabel.textContent = totalHits[awayTeamName];
        homeTotalHLabel.textContent = totalHits[homeTeamName];
        awayTotalELabel.textContent = totalErrors[awayTeamName];
        homeTotalELabel.textContent = totalErrors[homeTeamName];

        displayPlayerStats(); // Update player stats tables

        // Update big count display if it's visible
        if (!bigCountSection.classList.contains('hidden')) {
            bigBallsCount.textContent = balls;
            bigStrikesCount.textContent = strikes;
            bigOutsCount.textContent = outs;
        }
    }

    function updateScoreboardTable() {
        const scoreboardHeader = document.querySelector('.scoreboard-header');
        const awayTeamRow = document.querySelector('.away-team');
        const homeTeamRow = document.querySelector('.home-team');

        // Remove existing dynamic inning cells
        scoreboardHeader.querySelectorAll('.inning-col:not(.team-label):not(.rhe-col):not(.stats-col)').forEach(el => el.remove());
        awayTeamRow.querySelectorAll('.inning-score').forEach(el => el.remove());
        homeTeamRow.querySelectorAll('.inning-score').forEach(el => el.remove());

        // Determine max innings to display (at least 9, or current inning if greater)
        const maxInningsToShow = Math.max(currentInning, 9);

        // Re-add inning headers and scores
        let awayTotal = 0;
        let homeTotal = 0;

        // Find the insertion point: before the first RHE-col in the header
        const rheColHeader = scoreboardHeader.querySelector('.rhe-col');
        const rheColAway = awayTeamRow.querySelector('.rhe-score');
        const rheColHome = homeTeamRow.querySelector('.rhe-score');


        for (let i = 0; i < maxInningsToShow; i++) {
            const inning = inningScores[i] || { [awayTeamName]: 0, [homeTeamName]: 0 };
            const awayInningScore = inning[awayTeamName] || 0;
            const homeInningScore = inning[homeTeamName] || 0;

            awayTotal += awayInningScore;
            homeTotal += homeInningScore;

            // Header
            const inningHeaderDiv = document.createElement('div');
            inningHeaderDiv.classList.add('inning-col');
            inningHeaderDiv.textContent = i + 1;
            scoreboardHeader.insertBefore(inningHeaderDiv, rheColHeader);

            // Away Score
            const awayScoreDiv = document.createElement('div');
            awayScoreDiv.classList.add('inning-score');
            awayScoreDiv.textContent = awayInningScore;
            awayTeamRow.insertBefore(awayScoreDiv, rheColAway);

            // Home Score
            const homeScoreDiv = document.createElement('div');
            homeScoreDiv.classList.add('inning-score');
            homeScoreDiv.textContent = homeInningScore;
            homeTeamRow.insertBefore(homeScoreDiv, rheColHome);
        }

        awayTotalScoreLabel.textContent = awayTotal;
        homeTotalScoreLabel.textContent = homeTotal;
    }

    function addGameHistoryLog(action) {
        const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        gameHistoryLog.unshift(`[${timestamp}] ${action}`); // Add to the beginning
    }

    function displayGameResults() {
        gameHistoryList.innerHTML = ''; // Clear previous history
        if (savedGameResults.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'まだ試合の履歴がありません。';
            gameHistoryList.appendChild(li);
            return;
        }

        savedGameResults.forEach(game => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${game.date}</strong><br>
                ${game.awayTeam}: ${game.awayScore} - ${game.homeTeam}: ${game.homeScore}<br>
                H(ビジ): ${game.awayHits || 0}, E(ビジ): ${game.awayErrors || 0}, AVG(ビジ): ${game.awayAvg || '.000'}, OBP(ビジ): ${game.awayObp || '.000'}<br>
                H(ホーム): ${game.homeHits || 0}, E(ホーム): ${game.homeErrors || 0}, AVG(ホーム): ${game.homeAvg || '.000'}, OBP(ホーム): ${game.homeObp || '.000'}<br>
                勝者: ${game.winner}
            `;
            gameHistoryList.appendChild(li);
        });
    }

    function calculateTotalScore(teamName) {
        return inningScores.reduce((total, inning) => total + (inning[teamName] || 0), 0);
    }

    // --- Local Storage Functions ---

    function saveGameState() {
        const state = {
            currentInning,
            isTopInning,
            outs,
            balls,
            strikes,
            bases,
            awayTeamName,
            homeTeamName,
            playerCount,
            awayPlayers,
            homePlayers,
            totalHits,
            totalErrors,
            inningScores,
            gameHistoryLog
        };
        localStorage.setItem('baseballScoreboardCurrentGame', JSON.stringify(state));
    }

    function loadGameState() {
        const savedState = localStorage.getItem('baseballScoreboardCurrentGame');
        if (savedState) {
            const state = JSON.parse(savedState);
            currentInning = state.currentInning;
            isTopInning = state.isTopInning;
            outs = state.outs;
            balls = state.balls;
            strikes = state.strikes;
            bases = state.bases;
            awayTeamName = state.awayTeamName;
            homeTeamName = state.homeTeamName;
            playerCount = state.playerCount || 9;

            awayPlayers = state.awayPlayers || initializePlayerStats([], playerCount);
            homePlayers = state.homePlayers || initializePlayerStats([], playerCount);

            // Ensure player objects have all required stats properties for old saved games
            awayPlayers.forEach(player => {
                player.atBats = player.atBats !== undefined ? player.atBats : 0;
                player.hits = player.hits !== undefined ? player.hits : 0;
                player.walks = player.walks !== undefined ? player.walks : 0;
                player.hbp = player.hbp !== undefined ? player.hbp : 0;
                player.sacrifice = player.sacrifice !== undefined ? player.sacrifice : 0;
            });
            homePlayers.forEach(player => {
                player.atBats = player.atBats !== undefined ? player.atBats : 0;
                player.hits = player.hits !== undefined ? player.hits : 0;
                player.walks = player.walks !== undefined ? player.walks : 0;
                player.hbp = player.hbp !== undefined ? player.hbp : 0;
                player.sacrifice = player.sacrifice !== undefined ? player.sacrifice : 0;
            });


            totalHits = state.totalHits || { [state.awayTeamName]: 0, [state.homeTeamName]: 0 };
            totalErrors = state.totalErrors || { [state.awayTeamName]: 0, [state.homeTeamName]: 0 };

            inningScores = state.inningScores;
            gameHistoryLog = state.gameHistoryLog || [];

            // Update input fields with loaded team names and player count
            awayTeamNameInput.value = awayTeamName;
            homeTeamNameInput.value = homeTeamName;
            playerCountInput.value = playerCount;

            // Generate player input fields and populate them with loaded data
            generatePlayerInputFields(); // This re-creates inputs and sets default names
            // Then manually set names from loaded player objects
            awayPlayers.forEach((player, index) => {
                const input = document.getElementById(`awayPlayer${index + 1}`);
                if (input) input.value = player.name;
            });
            homePlayers.forEach((player, index) => {
                const input = document.getElementById(`homePlayer${index + 1}`);
                if (input) input.value = player.name;
            });

            // Show scoreboard if game was active
            setupSection.classList.add('hidden');
            scoreboardSection.classList.remove('hidden');
            historySection.classList.add('hidden'); // Initially hide history when game is active
            bigCountSection.classList.add('hidden'); // Big count is always hidden on initial load

            populateBatterSelect(); // Populate batter select list
            updateUI();
        } else {
            // No saved game, show setup section
            setupSection.classList.remove('hidden');
            scoreboardSection.classList.add('hidden');
            historySection.classList.add('hidden');
            bigCountSection.classList.add('hidden');
            generatePlayerInputFields(); // Generate player input fields on first load
        }
    }

    function saveGameResults() {
        localStorage.setItem('baseballScoreboardGameResults', JSON.stringify(savedGameResults));
    }

    function loadGameResults() {
        const results = localStorage.getItem('baseballScoreboardGameResults');
        if (results) {
            savedGameResults = JSON.parse(results);
        }
        displayGameResults();
    }

    function clearGameHistory() {
        if (confirm("全ての試合履歴をクリアしますか？この操作は元に戻せません。")) {
            localStorage.removeItem('baseballScoreboardGameResults');
            savedGameResults = [];
            displayGameResults();
            alert("試合履歴がクリアされました。");
        }
    }

    // --- Event Listeners ---

    startGameButton.addEventListener('click', () => {
        awayTeamName = awayTeamNameInput.value || "ビジターズ";
        homeTeamName = homeTeamNameInput.value || "ホームズ";
        initializeGame();
        setupSection.classList.add('hidden');
        scoreboardSection.classList.remove('hidden');
        historySection.classList.add('hidden'); // Hide history on game start
        bigCountSection.classList.add('hidden'); // Ensure big count is hidden
        populateBatterSelect(); // Initialize batter select list
    });

    addRunButton.addEventListener('click', () => addRun());
    subtractRunButton.addEventListener('click', () => subtractRun());
    addErrorButton.addEventListener('click', () => addError());
    subtractErrorButton.addEventListener('click', () => subtractError());

    batterOutButton.addEventListener('click', () => handleBatterOutcome('out'));
    batterSingleButton.addEventListener('click', () => handleBatterOutcome('single'));
    batterDoubleButton.addEventListener('click', () => handleBatterOutcome('double'));
    batterTripleButton.addEventListener('click', () => handleBatterOutcome('triple'));
    batterHomeRunButton.addEventListener('click', () => handleBatterOutcome('homeRun'));
    batterWalkButton.addEventListener('click', () => handleBatterOutcome('walk'));
    batterHBPButton.addEventListener('click', () => handleBatterOutcome('hbp'));
    batterSacrificeButton.addEventListener('click', () => handleBatterOutcome('sacrifice'));
    batterErrorButton.addEventListener('click', () => handleBatterOutcome('error'));


    clearBasesButton.addEventListener('click', () => clearBases());
    addBallButton.addEventListener('click', () => addBall());
    addStrikeButton.addEventListener('click', () => addStrike());
    resetCountButton.addEventListener('click', () => resetPitchCount());

    nextInningButton.addEventListener('click', () => nextInning());
    switchSidesButton.addEventListener('click', () => switchSides());
    endGameButton.addEventListener('click', () => endGame());
    resetGameButton.addEventListener('click', () => resetGame());

    clearHistoryButton.addEventListener('click', clearGameHistory);

    // Toggle big count display
    showBigCountButton.addEventListener('click', () => {
        scoreboardSection.classList.add('hidden');
        historySection.classList.add('hidden');
        setupSection.classList.add('hidden'); // Also hide setup if somehow visible
        bigCountSection.classList.remove('hidden');
        updateUI(); // Update big count numbers
    });

    backToScoreboardButton.addEventListener('click', () => {
        bigCountSection.classList.add('hidden');
        scoreboardSection.classList.remove('hidden');
        historySection.classList.remove('hidden'); // Show history again when back
    });

    // --- Initial Load ---
    loadGameState(); // Attempt to load ongoing game
    loadGameResults(); // Load past game results
});
