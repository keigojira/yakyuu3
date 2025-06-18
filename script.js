document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const setupSection = document.getElementById('setup-section');
    const scoreboardSection = document.getElementById('scoreboard-section');
    const historySection = document.getElementById('history-section');

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

    const awayPlayerStatsTeamName = document.getElementById('awayPlayerStatsTeamName');
    const homePlayerStatsTeamName = document.getElementById('homePlayerStatsTeamName');
    const awayPlayerStatsTableBody = document.querySelector('#awayPlayerStatsTable tbody');
    const homePlayerStatsTableBody = document.querySelector('#homePlayerStatsTable tbody');

    const gameHistoryList = document.getElementById('gameHistoryList');
    const clearHistoryButton = document.getElementById('clearHistoryButton');


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

    let totalHits = { [awayTeamName]: 0, [homeTeamName]: 0 };
    let totalErrors = { [awayTeamName]: 0, [homeTeamName]: 0 };
    let totalTeamAB = { [awayTeamName]: 0, [homeTeamName]: 0 }; // チーム合計打席数（打率計算用）
    let totalTeamPA = { [awayTeamName]: 0, [homeTeamName]: 0 }; // チーム合計打席数（出塁率計算用）
    let totalTeamH = { [awayTeamName]: 0, [homeTeamName]: 0 }; // チーム合計安打数（打率計算用）
    let totalTeamBB = { [awayTeamName]: 0, [homeTeamName]: 0 }; // チーム合計四球数（出塁率計算用）
    let totalTeamHBP = { [awayTeamName]: 0, [homeTeamName]: 0 }; // チーム合計死球数（出塁率計算用）
    let totalTeamSFSH = { [awayTeamName]: 0, [homeTeamName]: 0 }; // チーム合計犠打/犠飛数（出塁率計算用）

    // inningScores: Array of objects [{away: score, home: score}, {away: score, home: score}, ...]
    let inningScores = [];
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

    function getOppositePlayers() {
        return isTopInning ? homePlayers : awayPlayers;
    }

    function formatStat(value) {
        if (isNaN(value) || !isFinite(value) || value === 0) {
            return '.000';
        }
        return (value).toFixed(3).substring(1); // Remove leading 0 for .XXX format
    }

    // --- Player Management Functions ---
    playerCountInput.addEventListener('change', generatePlayerInputFields);

    function generatePlayerInputFields() {
        const count = parseInt(playerCountInput.value);
        if (isNaN(count) || count < 1 || count > 25) {
            alert("選手人数は1から25の間で入力してください。");
            playerCountInput.value = playerCount; // 元の人数に戻す
            return;
        }
        playerCount = count;
        createPlayerInputDivs(awayPlayersDiv, 'away', awayPlayers);
        createPlayerInputDivs(homePlayersDiv, 'home', homePlayers);
        // 新しい人数で選手データを初期化
        awayPlayers = initializePlayerStats(awayPlayers, playerCount);
        homePlayers = initializePlayerStats(homePlayers, playerCount);
        saveGameState(); // 人数変更を保存
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
                // 平均と出塁率は算出時に計算
            });
        }
        return newPlayersArray;
    }

    function updatePlayerNamesFromInputs() {
        awayPlayers.forEach((player, index) => {
            const input = document.getElementById(`awayPlayer${index + 1}`);
            if (input) player.name = input.value;
        });
        homePlayers.forEach((player, index) => {
            const input = document.getElementById(`homePlayer${index + 1}`);
            if (input) player.name = input.value;
        });
    }

    function populateBatterSelect() {
        currentBatterSelect.innerHTML = '';
        const battingPlayers = getBattingPlayers();
        battingPlayers.forEach((player, index) => {
            const option = document.createElement('option');
            option.value = index; // プレイヤーのインデックス
            option.textContent = player.name;
            currentBatterSelect.appendChild(option);
        });
    }

    function calculatePlayerStats(player) {
        // AVG: H / AB
        const avg = player.atBats > 0 ? player.hits / player.atBats : 0;

        // OBP: (H + BB + HBP) / (AB + BB + HBP + SF)
        // SF (Sacrifice Fly) はここでは sacrifice に含め、SH (Sacrifice Hit/Bunt) は含めない（打席数に含まれないため）
        // ただし、baseball-referenceなどではSFのみPAに含める場合もあるが、ここでは簡略化のためsacrificeを全て含める
        // 実際の野球統計では、犠打(SH)は打席数(PA)に含めず、打数(AB)にも含めない。
        // 犠飛(SF)は打席数(PA)に含めるが、打数(AB)には含めない。
        // ここでは、sacrificeをSF/SHの合計とみなし、ABには含めず、PAには含める。
        const paDenominator = player.atBats + player.walks + player.hbp + player.sacrifice;
        const obp = paDenominator > 0 ? (player.hits + player.walks + player.hbp) / paDenominator : 0;

        return { avg: formatStat(avg), obp: formatStat(obp) };
    }

    function calculateTeamStats() {
        const currentBattingTeamPlayers = getBattingPlayers();
        const battingTeamName = getBattingTeamName();

        let teamAB = 0;
        let teamH = 0;
        let teamBB = 0;
        let teamHBP = 0;
        let teamSFSH = 0;
        let teamPA = 0; // AB + BB + HBP + SF/SH (ここでは犠打もPAに含む)

        currentBattingTeamPlayers.forEach(player => {
            teamAB += player.atBats;
            teamH += player.hits;
            teamBB += player.walks;
            teamHBP += player.hbp;
            teamSFSH += player.sacrifice;
            teamPA += player.atBats + player.walks + player.hbp + player.sacrifice;
        });

        // チームの合計値を更新
        totalTeamAB[battingTeamName] = teamAB;
        totalTeamH[battingTeamName] = teamH;
        totalTeamBB[battingTeamName] = teamBB;
        totalTeamHBP[battingTeamName] = teamHBP;
        totalTeamSFSH[battingTeamName] = teamSFSH;
        totalTeamPA[battingTeamName] = teamPA;

        // チーム打率と出塁率の計算
        const teamAvg = teamAB > 0 ? teamH / teamAB : 0;
        const teamObpDenominator = teamAB + teamBB + teamHBP + teamSFSH; // SF/SHもPAに含める
        const teamObp = teamObpDenominator > 0 ? (teamH + teamBB + teamHBP) / teamObpDenominator : 0;

        const teamAvgLabel = isTopInning ? awayTeamAvgLabel : homeTeamAvgLabel;
        const teamObpLabel = isTopInning ? awayTeamObpLabel : homeTeamObpLabel;

        teamAvgLabel.textContent = formatStat(teamAvg);
        teamObpLabel.textContent = formatStat(teamObp);
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

        // 選手データを初期化（名前は入力値、スタッツは0）
        updatePlayerNamesFromInputs(); // 現在の入力値で名前を更新
        awayPlayers.forEach(player => {
            player.atBats = 0; player.hits = 0; player.walks = 0; player.hbp = 0; player.sacrifice = 0;
        });
        homePlayers.forEach(player => {
            player.atBats = 0; player.hits = 0; player.walks = 0; player.hbp = 0; player.sacrifice = 0;
        });

        totalHits = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalErrors = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalTeamAB = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalTeamPA = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalTeamH = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalTeamBB = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalTeamHBP = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalTeamSFSH = { [awayTeamName]: 0, [homeTeamName]: 0 };

        gameHistoryLog = []; // Clear current game history log

        updateUI();
        addGameHistoryLog('試合開始: ' + awayTeamName + ' vs ' + homeTeamName);
        saveGameState(); // Save initial state
    }

    function addRun(count = 1) {
        const team = getBattingTeamName();
        inningScores[currentInning - 1][team] += count;
        updateUI();
        resetPitchCount(); // 得点が入ったらカウントはリセット
        addGameHistoryLog(team + 'が得点しました (' + count + '点).');
        saveGameState();
    }

    function subtractRun(count = 1) {
        const team = getBattingTeamName();
        if (inningScores[currentInning - 1][team] - count >= 0) {
            inningScores[currentInning - 1][team] -= count;
        } else {
            inningScores[currentInning - 1][team] = 0; // 0より下にはならない
        }
        updateUI();
        addGameHistoryLog(team + 'の得点が' + count + '点減りました.');
        saveGameState();
    }

    function addError() {
        const team = getOppositeTeamName(); // エラーは守備側のチームに記録
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
        const battingTeamName = getBattingTeamName();

        if (!currentBatter) {
            console.error("No current batter selected or found.");
            return;
        }

        let runsScored = 0; // この打席で入った点数
        let isAtBat = true; // 打数としてカウントされるか

        switch (outcomeType) {
            case 'out':
                addOut();
                addGameHistoryLog(`${currentBatter.name}がアウトになりました.`);
                currentBatter.atBats++; // 打数にカウント
                break;
            case 'single':
                advanceRunners(1);
                currentBatter.hits++;
                addGameHistoryLog(`${currentBatter.name}がヒットを打ちました.`);
                currentBatter.atBats++; // 打数にカウント
                totalHits[battingTeamName]++; // チーム合計Hに加算
                break;
            case 'double':
                advanceRunners(2);
                currentBatter.hits++;
                addGameHistoryLog(`${currentBatter.name}が二塁打を打ちました.`);
                currentBatter.atBats++;
                totalHits[battingTeamName]++;
                break;
            case 'triple':
                advanceRunners(3);
                currentBatter.hits++;
                addGameHistoryLog(`${currentBatter.name}が三塁打を打ちました.`);
                currentBatter.atBats++;
                totalHits[battingTeamName]++;
                break;
            case 'homeRun':
                // 本塁打は特別に処理（全ての塁のランナーと打者自身も得点）
                runsScored += (bases[0] ? 1 : 0) + (bases[1] ? 1 : 0) + (bases[2] ? 1 : 0) + 1; // ランナーと打者自身の得点
                addRun(runsScored);
                clearBases();
                currentBatter.hits++;
                addGameHistoryLog(`${currentBatter.name}がホームラン！(${runsScored}点).`);
                currentBatter.atBats++;
                totalHits[battingTeamName]++;
                break;
            case 'walk': // 四球
                advanceRunners(0); // 0は四球を表す
                currentBatter.walks++;
                addGameHistoryLog(`${currentBatter.name}が四球を選びました.`);
                isAtBat = false; // 打数にはカウントしない
                break;
            case 'hbp': // 死球
                advanceRunners(0); // 死球も四球と同じ進塁ロジック
                currentBatter.hbp++;
                addGameHistoryLog(`${currentBatter.name}が死球を受けました.`);
                isAtBat = false; // 打数にはカウントしない
                break;
            case 'sacrifice': // 犠打/犠飛
                // 犠打/犠飛の場合もアウトは増えるが、打数にはカウントしない
                addOut();
                currentBatter.sacrifice++;
                addGameHistoryLog(`${currentBatter.name}が犠打/犠飛をしました.`);
                isAtBat = false; // 打数にはカウントしない
                // 犠打/犠飛の際の進塁ロジックは別途考慮する必要があるが、ここでは簡略化のためランナーは手動で進めてもらう
                break;
            case 'error': // 相手失策出塁
                advanceRunners(1); // 1塁にランナーが出た場合と同じ進塁ロジック
                addError(); // 守備側にエラーを追加
                addGameHistoryLog(`${currentBatter.name}が相手失策で出塁しました.`);
                currentBatter.atBats++; // 打数にカウント (エラーでも打席に立ったので)
                break;
        }

        if (outcomeType !== 'homeRun' && outcomeType !== 'sacrifice') { // HRと犠打は個別にアウト処理
            resetPitchCount();
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
            // 四球処理はbatterWalkボタンで行うため、ここでは自動進塁はなし
            addGameHistoryLog('ボールカウントが4になりました。打者は四球ボタンを押してください。');
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
            // 三振処理はbatterOutボタンで行うため、ここでは自動アウトはなし
            addGameHistoryLog('ストライクカウントが3になりました。打者はアウトボタンを押してください。');
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
        addGameHistoryLog('カウントリセット.');
        saveGameState();
    }

    function clearBases() {
        bases = [false, false, false];
        updateUI();
        addGameHistoryLog('塁上クリア.');
        saveGameState();
    }

    /**
     * @param {number} hitType 0=walk/HBP, 1=single, 2=double, 3=triple
     */
    function advanceRunners(hitType) {
        let runsScored = 0;

        // ランナーを進めるロジック
        // まず、ホームインするランナーを計算し、ベースを空ける
        if (hitType === 1) { // Single or Walk/HBP
            if (bases[2]) { runsScored++; bases[2] = false; } // 3塁ランナーはホームイン
            if (bases[1]) { bases[2] = true; bases[1] = false; } // 2塁ランナーは3塁へ
            if (bases[0]) { bases[1] = true; bases[0] = false; } // 1塁ランナーは2塁へ
            bases[0] = true; // バッターは1塁へ
        } else if (hitType === 2) { // Double
            if (bases[2]) { runsScored++; bases[2] = false; }
            if (bases[1]) { runsScored++; bases[1] = false; }
            if (bases[0]) { bases[2] = true; bases[0] = false; }
            bases[1] = true; // バッターは2塁へ
        } else if (hitType === 3) { // Triple
            if (bases[2]) { runsScored++; bases[2] = false; }
            if (bases[1]) { runsScored++; bases[1] = false; }
            if (bases[0]) { runsScored++; bases[0] = false; }
            bases[2] = true; // バッターは3塁へ
        }
        // 四死球はヒットタイプ0で処理されるので、単打と同じように進塁

        if (runsScored > 0) {
            addRun(runsScored); // 得点を追加
        }

        updateUI();
        addGameHistoryLog('ランナー進塁 (' + (hitType === 0 ? '四死球' : hitType + '塁打') + ').');
        saveGameState();
    }


    function switchSides() {
        isTopInning = !isTopInning;
        if (isTopInning) { // 攻守交代後、表イニングになったらイニングを進める
            currentInning++;
            // 新しいイニングのスコアを初期化
            if (!inningScores[currentInning - 1]) {
                inningScores.push({ [awayTeamName]: 0, [homeTeamName]: 0 });
            }
        }
        outs = 0;
        balls = 0;
        strikes = 0;
        clearBases();
        populateBatterSelect(); // 打者選択リストを更新
        updateUI();
        addGameHistoryLog('攻守交代: ' + currentInning + '回' + (isTopInning ? '表' : '裏'));
        saveGameState();
    }

    function nextInning() {
        if (!isTopInning) { // 現在裏イニングの場合のみ、次のイニングの表へ進む
            currentInning++;
            isTopInning = true;
            if (!inningScores[currentInning - 1]) {
                inningScores.push({ [awayTeamName]: 0, [homeTeamName]: 0 });
            }
        } else { // 現在表イニングの場合、裏イニングへ進む
            isTopInning = false;
        }
        outs = 0;
        balls = 0;
        strikes = 0;
        clearBases();
        populateBatterSelect(); // 打者選択リストを更新
        updateUI();
        addGameHistoryLog('イニング変更: ' + currentInning + '回' + (isTopInning ? '表' : '裏'));
        saveGameState();
    }

    function endGame() {
        const confirmEnd = confirm("試合を終了しますか？");
        if (!confirmEnd) return;

        const awayTotal = calculateTotalScore(awayTeamName);
        const homeTotal = calculateTotalScore(homeTeamName);
        const result = `${awayTeamName}: ${awayTotal} - ${homeTeamName}: ${homeTotal}`;
        const winner = awayTotal > homeTotal ? awayTeamName : (homeTotal > awayTotal ? homeTeamName : '引き分け');

        const gameResult = {
            date: new Date().toLocaleString(),
            awayTeam: awayTeamName,
            homeTeam: homeTeamName,
            awayScore: awayTotal,
            homeScore: homeTotal,
            awayHits: totalTeamH[awayTeamName],
            homeHits: totalTeamH[homeTeamName],
            awayErrors: totalErrors[awayTeamName],
            homeErrors: totalErrors[homeTeamName],
            awayAvg: formatStat(totalTeamH[awayTeamName] / (totalTeamAB[awayTeamName] || 1)),
            homeAvg: formatStat(totalTeamH[homeTeamName] / (totalTeamAB[homeTeamName] || 1)),
            awayObp: formatStat((totalTeamH[awayTeamName] + totalTeamBB[awayTeamName] + totalTeamHBP[awayTeamName]) / (totalTeamAB[awayTeamName] + totalTeamBB[awayTeamName] + totalTeamHBP[awayTeamName] + totalTeamSFSH[awayTeamName] || 1)),
            homeObp: formatStat((totalTeamH[homeTeamName] + totalTeamBB[homeTeamName] + totalTeamHBP[homeTeamName]) / (totalTeamAB[homeTeamName] + totalTeamBB[homeTeamName] + totalTeamHBP[homeTeamName] + totalTeamSFSH[homeTeamName] || 1)),
            winner: winner,
            details: JSON.parse(JSON.stringify(inningScores))
        };
        savedGameResults.push(gameResult);
        saveGameResults();
        addGameHistoryLog('試合終了: ' + result + ' (' + winner + 'の勝利)');

        alert("試合が終了しました。\n最終スコア: " + result);

        // 試合終了後のUI表示
        setupSection.classList.remove('hidden');
        scoreboardSection.classList.add('hidden');
        historySection.classList.remove('hidden'); // 履歴セクションを表示
        displayGameResults(); // 履歴を更新
        resetGame(false); // 履歴には残すが、現在のスコアボードはリセット
    }

    function resetGame(confirmReset = true) {
        if (confirmReset && !confirm("現在の試合をリセットしますか？この操作は取り消せません。")) {
            return;
        }
        awayTeamName = awayTeamNameInput.value || "ビジターズ";
        homeTeamName = homeTeamNameInput.value || "ホームズ";
        playerCount = parseInt(playerCountInput.value) || 9; // リセット時も人数を再取得
        initializeGame();
        saveGameState(); // Reset state
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

        // Update Total Hits and Errors
        awayTotalHLabel.textContent = totalHits[awayTeamName];
        homeTotalHLabel.textContent = totalHits[homeTeamName];
        awayTotalELabel.textContent = totalErrors[awayTeamName];
        homeTotalELabel.textContent = totalErrors[homeTeamName];

        // Update Team AVG and OBP
        calculateTeamStats(); // 最新の選手データでチーム統計を計算

        // Update Scores and Totals
        updateScoreboardTable();
        displayPlayerStats(); // 選手スタッツテーブルを更新
    }

    function updateScoreboardTable() {
        const scoreboardDiv = document.querySelector('.scoreboard');
        const awayTeamRow = document.querySelector('.away-team');
        const homeTeamRow = document.querySelector('.home-team');

        // Remove old inning score cells (keep team label and RHE/AVG/OBP placeholders)
        awayTeamRow.querySelectorAll('.inning-score').forEach(el => el.remove());
        homeTeamRow.querySelectorAll('.inning-score').forEach(el => el.remove());

        // Ensure enough inning columns in header
        const header = document.querySelector('.scoreboard-header');
        // Calculate current number of inning columns + team label + RHE + AVG + OBP (5 fixed columns)
        const currentHeaderCols = header.children.length;
        const fixedCols = 1 + 5; // team-label + R + H + E + AVG + OBP
        const currentInningCols = currentHeaderCols - fixedCols;

        for (let i = currentInningCols; i < currentInning; i++) {
            if (i < 9) { // Default 9 innings are already there
                // Do nothing if it's one of the first 9 innings and exists
            } else { // Add new inning header if beyond 9th inning
                const newInningHeader = document.createElement('div');
                newInningHeader.classList.add('inning-col');
                newInningHeader.textContent = i + 1;
                // Insert before RHE columns (there are 5 fixed columns at the end)
                header.insertBefore(newInningHeader, header.children[header.children.length - 5]);
            }
        }

        let awayTotal = 0;
        let homeTotal = 0;

        inningScores.forEach((inning, index) => {
            const awayInningScore = inning[awayTeamName] || 0;
            const homeInningScore = inning[homeTeamName] || 0;

            awayTotal += awayInningScore;
            homeTotal += homeInningScore;

            // Create and append score for away team
            const awayScoreDiv = document.createElement('div');
            awayScoreDiv.classList.add('inning-score');
            awayScoreDiv.textContent = awayInningScore;
            // Insert after team label and previous innings (account for the initial team label div)
            awayTeamRow.insertBefore(awayScoreDiv, awayTeamRow.children[1 + index]);

            // Create and append score for home team
            const homeScoreDiv = document.createElement('div');
            homeScoreDiv.classList.add('inning-score');
            homeScoreDiv.textContent = homeInningScore;
            homeTeamRow.insertBefore(homeScoreDiv, homeTeamRow.children[1 + index]);
        });

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
                H: ${game.awayHits || 0}, E: ${game.awayErrors || 0}, AVG: ${game.awayAvg || '.000'}, OBP: ${game.awayObp || '.000'}<br>
                H: ${game.homeHits || 0}, E: ${game.homeErrors || 0}, AVG: ${game.homeAvg || '.000'}, OBP: ${game.homeObp || '.000'}<br>
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
            totalTeamAB,
            totalTeamPA,
            totalTeamH,
            totalTeamBB,
            totalTeamHBP,
            totalTeamSFSH,
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
            playerCount = state.playerCount || 9; // 互換性のため
            awayPlayers = state.awayPlayers || initializePlayerStats([], playerCount); // 互換性のため
            homePlayers = state.homePlayers || initializePlayerStats([], playerCount); // 互換性のため
            totalHits = state.totalHits || { [awayTeamName]: 0, [homeTeamName]: 0 };
            totalErrors = state.totalErrors || { [awayTeamName]: 0, [homeTeamName]: 0 };
            totalTeamAB = state.totalTeamAB || { [awayTeamName]: 0, [homeTeamName]: 0 };
            totalTeamPA = state.totalTeamPA || { [awayTeamName]: 0, [homeTeamName]: 0 };
            totalTeamH = state.totalTeamH || { [awayTeamName]: 0, [homeTeamName]: 0 };
            totalTeamBB = state.totalTeamBB || { [awayTeamName]: 0, [homeTeamName]: 0 };
            totalTeamHBP = state.totalTeamHBP || { [awayTeamName]: 0, [homeTeamName]: 0 };
            totalTeamSFSH = state.totalTeamSFSH || { [awayTeamName]: 0, [homeTeamName]: 0 };
            inningScores = state.inningScores;
            gameHistoryLog = state.gameHistoryLog || [];

            // Update input fields with loaded team names and player count
            awayTeamNameInput.value = awayTeamName;
            homeTeamNameInput.value = homeTeamName;
            playerCountInput.value = playerCount;

            // Generate player input fields and populate them with loaded data
            generatePlayerInputFields(); // UIを再生成
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

            populateBatterSelect(); // 打者選択リストを更新
            updateUI();
        } else {
            // No saved game, show setup section
            setupSection.classList.remove('hidden');
            scoreboardSection.classList.add('hidden');
            historySection.classList.add('hidden');
            generatePlayerInputFields(); // 初回ロード時に選手入力欄を生成
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
        historySection.classList.add('hidden');
        populateBatterSelect(); // 試合開始時に打者選択を初期化
    });

    addRunButton.addEventListener('click', () => addRun());
    subtractRunButton.addEventListener('click', () => subtractRun());
    addErrorButton.addEventListener('click', () => addError());
    subtractErrorButton.addEventListener('click', () => subtractError());

    // Batter outcome buttons
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

    // --- Initial Load ---
    loadGameState(); // Attempt to load ongoing game
    loadGameResults(); // Load past game results
});
