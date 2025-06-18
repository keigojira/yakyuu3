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

    let totalHits = { "ビジターズ": 0, "ホームズ": 0 }; // 初期値を設定
    let totalErrors = { "ビジターズ": 0, "ホームズ": 0 }; // 初期値を設定

    // totalTeamAB, PA, H, BB, HBP, SFSH は players 配列から動的に計算
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
        // 新しい人数で選手データを初期化または既存データを保持
        awayPlayers = initializePlayerStats(awayPlayers, playerCount, awayTeamNameInput.value);
        homePlayers = initializePlayerStats(homePlayers, playerCount, homeTeamNameInput.value);
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

    function initializePlayerStats(playersArray, count, teamName) {
        const newPlayersArray = [];
        for (let i = 0; i < count; i++) {
            const existingPlayer = playersArray[i];
            newPlayersArray.push({
                name: existingPlayer ? existingPlayer.name : '選手' + (i + 1),
                atBats: existingPlayer ? existingPlayer.atBats : 0, // 打数
                hits: existingPlayer ? existingPlayer.hits : 0,     // 安打
                walks: existingPlayer ? existingPlayer.walks : 0,   // 四球
                hbp: existingPlayer ? existingPlayer.hbp : 0,       // 死球
                sacrifice: existingPlayer ? existingPlayer.sacrifice : 0, // 犠打/犠飛 (犠打+犠飛)
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
            option.textContent = `${index + 1}. ${player.name}`;
            currentBatterSelect.appendChild(option);
        });
    }

    function calculatePlayerStats(player) {
        // AVG: H / AB
        const avg = player.atBats > 0 ? player.hits / player.atBats : 0;

        // OBP: (H + BB + HBP) / (AB + BB + HBP + SF)
        // SF (Sacrifice Fly) は出塁率の分母には含むが、SH (Sacrifice Hit/Bunt) は含めないのが一般的。
        // ここでは簡略化のため、player.sacrifice は SF と SH の合計とみなし、出塁率の分母に含める。
        // 野球規則に厳密に従う場合、犠打(SH)は打席数(PA)にも打数(AB)にも含まれない。
        // 犠飛(SF)は打席数(PA)には含まれるが、打数(AB)には含まれない。
        // ここでは、sacrificeをPAの分母に含めることで、SFの扱いを簡易的に行う。
        const paDenominator = player.atBats + player.walks + player.hbp + player.sacrifice; // SF/SHをPAの分母に含める
        const obp = paDenominator > 0 ? (player.hits + player.walks + player.hbp) / paDenominator : 0;

        return { avg: formatStat(avg), obp: formatStat(obp) };
    }

    function calculateTeamStats() {
        const awayTeamPlayers = awayPlayers;
        const homeTeamPlayers = homePlayers;

        let awayTeamAB = 0, awayTeamH = 0, awayTeamBB = 0, awayTeamHBP = 0, awayTeamSFSH = 0;
        let homeTeamAB = 0, homeTeamH = 0, homeTeamBB = 0, homeTeamHBP = 0, homeTeamSFSH = 0;

        awayTeamPlayers.forEach(player => {
            awayTeamAB += player.atBats;
            awayTeamH += player.hits;
            awayTeamBB += player.walks;
            awayTeamHBP += player.hbp;
            awayTeamSFSH += player.sacrifice;
        });

        homeTeamPlayers.forEach(player => {
            homeTeamAB += player.atBats;
            homeTeamH += player.hits;
            homeTeamBB += player.walks;
            homeTeamHBP += player.hbp;
            homeTeamSFSH += player.sacrifice;
        });

        // チーム打率と出塁率の計算
        const awayAvg = awayTeamAB > 0 ? awayTeamH / awayTeamAB : 0;
        const awayObpDenominator = awayTeamAB + awayTeamBB + awayTeamHBP + awayTeamSFSH;
        const awayObp = awayObpDenominator > 0 ? (awayTeamH + awayTeamBB + awayTeamHBP) / awayObpDenominator : 0;

        const homeAvg = homeTeamAB > 0 ? homeTeamH / homeTeamAB : 0;
        const homeObpDenominator = homeTeamAB + homeTeamBB + homeTeamHBP + homeTeamSFSH;
        const homeObp = homeObpDenominator > 0 ? (homeTeamH + homeTeamBB + homeTeamHBP) / homeObpDenominator : 0;

        awayTeamAvgLabel.textContent = formatStat(awayAvg);
        awayTeamObpLabel.textContent = formatStat(awayObp);
        homeTeamAvgLabel.textContent = formatStat(homeAvg);
        homeTeamObpLabel.textContent = formatStat(homeObp);

        // totalHits (安打数) を更新 (スコアボード表示用)
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

        // 選手データを初期化（名前は入力値、スタッツは0）
        updatePlayerNamesFromInputs(); // 現在の入力値で名前を更新
        awayPlayers.forEach(player => {
            player.atBats = 0; player.hits = 0; player.walks = 0; player.hbp = 0; player.sacrifice = 0;
        });
        homePlayers.forEach(player => {
            player.atBats = 0; player.hits = 0; player.walks = 0; player.hbp = 0; player.sacrifice = 0;
        });

        totalHits = { [awayTeamName]: 0, [homeTeamName]: 0 }; // 新しいチーム名で初期化
        totalErrors = { [awayTeamName]: 0, [homeTeamName]: 0 }; // 新しいチーム名で初期化

        gameHistoryLog = []; // Clear current game history log

        updateUI();
        addGameHistoryLog('試合開始: ' + awayTeamName + ' vs ' + homeTeamName);
        saveGameState(); // Save initial state
    }

    function addRun(count = 1) {
        const team = getBattingTeamName();
        // 現在のイニングが inningScores 配列の範囲内か確認
        if (inningScores[currentInning - 1]) {
            inningScores[currentInning - 1][team] += count;
        } else {
            // エラーハンドリングまたは新しいイニングスコアの初期化
            console.error(`Inning ${currentIninning} does not exist in inningScores.`);
            inningScores.push({ [awayTeamName]: 0, [homeTeamName]: 0 }); // 新しいイニングを追加して対応
            inningScores[currentInning - 1][team] = count;
        }

        updateUI();
        // 得点が入ってもカウントはリセットしない（ランナーがホームインしただけなので）
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

        if (!currentBatter) {
            console.error("No current batter selected or found.");
            return;
        }

        resetPitchCount(); // 打席結果が出たらカウントは常にリセット

        switch (outcomeType) {
            case 'out':
                addOut();
                addGameHistoryLog(`${currentBatter.name}がアウトになりました.`);
                currentBatter.atBats++; // 打数にカウント
                break;
            case 'single':
                const runsSingle = advanceRunners(1);
                addRun(runsSingle);
                currentBatter.hits++;
                currentBatter.atBats++; // 打数にカウント
                addGameHistoryLog(`${currentBatter.name}がヒットを打ちました. (${runsSingle}点)`);
                break;
            case 'double':
                const runsDouble = advanceRunners(2);
                addRun(runsDouble);
                currentBatter.hits++;
                currentBatter.atBats++; // 打数にカウント
                addGameHistoryLog(`${currentBatter.name}が二塁打を打ちました. (${runsDouble}点)`);
                break;
            case 'triple':
                const runsTriple = advanceRunners(3);
                addRun(runsTriple);
                currentBatter.hits++;
                currentBatter.atBats++; // 打数にカウント
                addGameHistoryLog(`${currentBatter.name}が三塁打を打ちました. (${runsTriple}点)`);
                break;
            case 'homeRun':
                // 本塁打は全てのランナーと打者自身も得点
                let runsHomeRun = (bases[0] ? 1 : 0) + (bases[1] ? 1 : 0) + (bases[2] ? 1 : 0) + 1;
                addRun(runsHomeRun);
                clearBases(); // 全員ホームインなので塁上クリア
                currentBatter.hits++;
                currentBatter.atBats++; // 打数にカウント
                addGameHistoryLog(`${currentBatter.name}がホームラン！(${runsHomeRun}点).`);
                break;
            case 'walk': // 四球
                const runsWalk = advanceRunners(0); // 0は四球を表す
                addRun(runsWalk);
                currentBatter.walks++;
                // 打数にはカウントしない (atBats++ は行わない)
                addGameHistoryLog(`${currentBatter.name}が四球を選びました. (${runsWalk}点)`);
                break;
            case 'hbp': // 死球
                const runsHBP = advanceRunners(0); // 死球も四球と同じ進塁ロジック
                addRun(runsHBP);
                currentBatter.hbp++;
                // 打数にはカウントしない (atBats++ は行わない)
                addGameHistoryLog(`${currentBatter.name}が死球を受けました. (${runsHBP}点)`);
                break;
            case 'sacrifice': // 犠打/犠飛
                // 犠打/犠飛の場合もアウトは増えるが、打数にはカウントしない
                addOut(); // 犠牲打でアウトが増える
                currentBatter.sacrifice++;
                // 犠打/犠飛での進塁は複雑なので、ランナーは手動で進めてもらう。
                // ただし、犠飛で得点が入る場合は、advanceRunners を呼び出し、addRun で得点を加算する。
                // ここでは簡略化のため、ランナーの進塁はユーザーのボタン操作に委ねる。
                addGameHistoryLog(`${currentBatter.name}が犠打/犠飛をしました. (1アウト追加)`);
                // 打数にはカウントしない (atBats++ は行わない)
                break;
            case 'error': // 相手失策出塁
                const runsError = advanceRunners(1); // 1塁にランナーが出た場合と同じ進塁ロジック
                addRun(runsError); // エラーで得点が入る可能性もある
                addError(); // 守備側にエラーを追加
                currentBatter.atBats++; // 打数にカウント (エラーでも打席に立ったので)
                addGameHistoryLog(`${currentBatter.name}が相手失策で出塁しました. (${runsError}点)`);
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
            // 四球処理はbatterWalkボタンで行う
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
            // 三振処理はbatterOutボタンで行う
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
        // addGameHistoryLog('カウントリセット.'); // 各打席結果でリセットされるのでログは不要
        saveGameState();
    }

    function clearBases() {
        bases = [false, false, false];
        updateUI();
        addGameHistoryLog('塁上クリア.');
        saveGameState();
    }

    /**
     * @param {number} advanceType 0=walk/HBP, 1=single, 2=double, 3=triple
     * @returns {number} scoredRuns - このプレイで入った得点
     */
    function advanceRunners(advanceType) {
        let scoredRuns = 0;
        let newBases = [false, false, false]; // 次の塁上状況

        // まず、現在のランナーの進塁をシミュレート
        // 3塁ランナー
        if (bases[2]) {
            scoredRuns++; // 3塁ランナーはホームイン
        }
        // 2塁ランナー
        if (bases[1]) {
            if (advanceType === 1 || advanceType === 0) { // 単打または四死球の場合、2塁から3塁へ
                newBases[2] = true;
            } else if (advanceType === 2 || advanceType === 3) { // 二塁打または三塁打の場合、2塁からホームイン
                scoredRuns++;
            }
        }
        // 1塁ランナー
        if (bases[0]) {
            if (advanceType === 0) { // 四死球の場合、1塁から2塁へ (押し出し)
                newBases[1] = true;
            } else if (advanceType === 1) { // 単打の場合、1塁から2塁へ
                newBases[1] = true;
            } else if (advanceType === 2) { // 二塁打の場合、1塁から3塁へ
                newBases[2] = true;
            } else if (advanceType === 3) { // 三塁打の場合、1塁からホームイン
                scoredRuns++;
            }
        }

        // 打者の進塁
        if (advanceType === 0) { // 四死球
            // 1塁にランナーがいなければバッターは1塁へ
            if (!bases[0]) {
                newBases[0] = true;
            } else if (!bases[1]) { // 1塁にランナーがいて、2塁がいなければ1塁ランナーを押し出してバッターは1塁へ
                newBases[1] = true; // 1塁ランナーが2塁へ
                newBases[0] = true; // バッターは1塁へ
            } else if (!bases[2]) { // 1,2塁にランナーがいて、3塁がいなければ1,2塁ランナーを押し出し
                newBases[2] = true; // 2塁ランナーが3塁へ
                newBases[1] = true; // 1塁ランナーが2塁へ
                newBases[0] = true; // バッターは1塁へ
            } else { // 満塁で押し出しの場合
                scoredRuns++; // 3塁ランナーがホームイン
                newBases[2] = true; // 2塁ランナーが3塁へ
                newBases[1] = true; // 1塁ランナーが2塁へ
                newBases[0] = true; // バッターは1塁へ
            }

        } else if (advanceType === 1) { // 単打
            newBases[0] = true;
        } else if (advanceType === 2) { // 二塁打
            newBases[1] = true;
        } else if (advanceType === 3) { // 三塁打
            newBases[2] = true;
        }

        bases = newBases; // 新しい塁上状況を反映
        return scoredRuns;
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
        // 次のイニングへ進む前に、現在の攻守を強制的に終わらせる
        if (outs < 3) {
            if (!confirm("アウトカウントが3未満ですが、強制的にイニングを進めますか？")) {
                return;
            }
            // 強制的に3アウトにする
            outs = 3;
        }
        switchSides(); // これでoutsがリセットされ、イニングが進む
        addGameHistoryLog('強制的に次イニングへ.');
        updateUI();
        saveGameState();
    }

    function endGame() {
        const confirmEnd = confirm("試合を終了しますか？");
        if (!confirmEnd) return;

        const awayTotal = calculateTotalScore(awayTeamName);
        const homeTotal = calculateTotalScore(homeTeamName);
        const result = `${awayTeamName}: ${awayTotal} - ${homeTeamName}: ${homeTotal}`;
        const winner = awayTotal > homeTotal ? awayTeamName : (homeTotal > awayTotal ? homeTeamName : '引き分け');

        // 最終的なチームスタッツを計算
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

    // チーム全体の統計合計を計算するヘルパー関数
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

        // Update Total Hits and Errors (これは calculateTeamStats で更新されるので呼び出す)
        calculateTeamStats(); // 最新の選手データでチーム統計を計算

        awayTotalHLabel.textContent = totalHits[awayTeamName];
        homeTotalHLabel.textContent = totalHits[homeTeamName];
        awayTotalELabel.textContent = totalErrors[awayTeamName];
        homeTotalELabel.textContent = totalErrors[homeTeamName];

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

        // 必要に応じてイニングヘッダーを追加 (最大15イニングまで表示可能とする)
        const maxInningsToShow = Math.max(currentInning, 9); // 最低9イニングは表示

        // ヘッダーのイニング番号を更新/追加
        const existingInningHeaders = header.querySelectorAll('.inning-col');
        for (let i = 0; i < maxInningsToShow; i++) {
            let inningHeaderDiv;
            if (i < existingInningHeaders.length) {
                inningHeaderDiv = existingInningHeaders[i];
            } else {
                inningHeaderDiv = document.createElement('div');
                inningHeaderDiv.classList.add('inning-col');
                // RHE/AVG/OBPの前の位置に挿入
                header.insertBefore(inningHeaderDiv, header.children[header.children.length - 5]);
            }
            inningHeaderDiv.textContent = i + 1;
        }

        // 余分なイニングヘッダーを削除 (例えば9回で終わったのに10回が残っていた場合など)
        for (let i = existingInningHeaders.length - 1; i >= maxInningsToShow; i--) {
            existingInningHeaders[i].remove();
        }

        let awayTotal = 0;
        let homeTotal = 0;

        // スコア表示部分も、maxInningsToShowに基づいて更新
        for (let i = 0; i < maxInningsToShow; i++) {
            const inning = inningScores[i] || { [awayTeamName]: 0, [homeTeamName]: 0 }; // 存在しないイニングは0点で初期化
            const awayInningScore = inning[awayTeamName] || 0;
            const homeInningScore = inning[homeTeamName] || 0;

            awayTotal += awayInningScore;
            homeTotal += homeInningScore;

            // Away Team Score
            const awayScoreDiv = document.createElement('div');
            awayScoreDiv.classList.add('inning-score');
            awayScoreDiv.textContent = awayInningScore;
            awayTeamRow.insertBefore(awayScoreDiv, awayTeamRow.children[1 + i]);

            // Home Team Score
            const homeScoreDiv = document.createElement('div');
            homeScoreDiv.classList.add('inning-score');
            homeScoreDiv.textContent = homeInningScore;
            homeTeamRow.insertBefore(homeScoreDiv, homeTeamRow.children[1 + i]);
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
            // totalTeamAB, PA, H, BB, HBP, SFSH は players 配列から計算されるので保存不要
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
            awayPlayers = state.awayPlayers || initializePlayerStats([], playerCount, state.awayTeamName); // 互換性のため
            homePlayers = state.homePlayers || initializePlayerStats([], playerCount, state.homeTeamName); // 互換性のため
            totalHits = state.totalHits || { [awayTeamName]: 0, [homeTeamName]: 0 };
            totalErrors = state.totalErrors || { [awayTeamName]: 0, [homeTeamName]: 0 };
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
