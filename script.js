document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element Selectors ---
    const setupSection = document.getElementById('setup-section');
    const scoreboardSection = document.getElementById('scoreboard-section');
    const historySection = document.getElementById('history-section');
    const bigCountSection = document.getElementById('big-count-section');

    const awayTeamNameInput = document.getElementById('awayTeamNameInput');
    const homeTeamNameInput = document.getElementById('homeTeamNameInput');
    const playerCountInput = document.getElementById('playerCountInput');
    const awayPlayersDiv = document.getElementById('awayPlayers');
    const homePlayersDiv = document.getElementById('homePlayers');
    const startGameButton = document.getElementById('startGameButton');

    const awayTeamLabel = document.getElementById('awayTeamLabel');
    const homeTeamLabel = document.getElementById('homeTeamLabel');
    const awayTotalScore = document.getElementById('awayTotalScore');
    const awayTotalH = document.getElementById('awayTotalH');
    const awayTotalE = document.getElementById('awayTotalE');
    const awayTeamAvg = document.getElementById('awayTeamAvg');
    const awayTeamObp = document.getElementById('awayTeamObp');
    const homeTotalScore = document.getElementById('homeTotalScore');
    const homeTotalH = document.getElementById('homeTotalH');
    const homeTotalE = document.getElementById('homeTotalE');
    const homeTeamAvg = document.getElementById('homeTeamAvg');
    const homeTeamObp = document.getElementById('homeTeamObp');

    const currentInningInfo = document.getElementById('currentInningInfo');
    const ballsInfo = document.getElementById('ballsInfo');
    const strikesInfo = document.getElementById('strikesInfo');
    const outsInfo = document.getElementById('outsInfo');
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
    let showBigCountButton = null; // Dynamically created

    const awayPlayerStatsTableBody = document.getElementById('awayPlayerStatsTable');
    const homePlayerStatsTableBody = document.getElementById('homePlayerStatsTable');
    const awayPlayerStatsTeamName = document.getElementById('awayPlayerStatsTeamName');
    const homePlayerStatsTeamName = document.getElementById('homePlayerStatsTeamName');

    const gameHistoryList = document.getElementById('gameHistoryList');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    const bigBallsCount = document.getElementById('bigBallsCount');
    const bigStrikesCount = document.getElementById('bigStrikesCount');
    const bigOutsCount = document.getElementById('bigOutsCount');
    const backToScoreboardButton = document.getElementById('backToScoreboardButton');

    // --- Game State Variables ---
    let awayTeam = { name: 'ビジターズ', score: 0, hits: 0, errors: 0, players: [], currentBatterIndex: 0 };
    let homeTeam = { name: 'ホームズ', score: 0, hits: 0, errors: 0, players: [], currentBatterIndex: 0 };
    let currentInning = 1;
    let isTopInning = true; // true for top (away team offense), false for bottom (home team offense)
    let balls = 0;
    let strikes = 0;
    let outs = 0;
    let bases = { first: false, second: false, third: false }; // true if runner on base
    let maxInnings = 9; // Default max innings
    let currentTeamOffense; // Reference to the team currently batting
    let currentTeamDefense; // Reference to the team currently fielding

    // Scoreboard Data Structure:
    // [ [away_inning_1_score, away_inning_2_score, ...], [home_inning_1_score, home_inning_2_score, ...] ]
    let scoreboardScores = [[], []];

    // --- Player Object Structure ---
    // { name: "選手名", atBats: 0, hits: 0, walks: 0, hbp: 0, sacrifice: 0, avg: 0.000, obp: 0.000 }

    // --- Functions ---

    /**
     * Initializes player input fields based on playerCountInput.
     */
    const populatePlayerInputs = () => {
        const playerCount = parseInt(playerCountInput.value);
        awayPlayersDiv.innerHTML = '';
        homePlayersDiv.innerHTML = '';

        for (let i = 1; i <= playerCount; i++) {
            awayPlayersDiv.innerHTML += `
                <div class="player-input-group">
                    <label for="awayPlayer${i}">選手 ${i}:</label>
                    <input type="text" id="awayPlayer${i}" value="ビジター${i}">
                </div>
            `;
            homePlayersDiv.innerHTML += `
                <div class="player-input-group">
                    <label for="homePlayer${i}">選手 ${i}:</label>
                    <input type="text" id="homePlayer${i}" value="ホーム${i}">
                </div>
            `;
        }
    };

    /**
     * Updates the game info display (inning, count, bases).
     */
    const updateGameInfo = () => {
        currentInningInfo.textContent = `${currentInning}回${isTopInning ? '表' : '裏'}`;
        ballsInfo.textContent = `B: ${balls}`;
        strikesInfo.textContent = `S: ${strikes}`;
        outsInfo.textContent = `O: ${outs}`;

        firstBase.classList.toggle('active', bases.first);
        secondBase.classList.toggle('active', bases.second);
        thirdBase.classList.toggle('active', bases.third);

        // Update big count display
        if (!bigCountSection.classList.contains('hidden')) {
            bigBallsCount.textContent = balls;
            bigStrikesCount.textContent = strikes;
            bigOutsCount.textContent = outs;
        }
    };

    /**
     * Populates the current batter select dropdown.
     */
    const populateBatterSelect = () => {
        currentBatterSelect.innerHTML = '';
        const teamPlayers = currentTeamOffense.players;
        teamPlayers.forEach((player, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${index + 1}. ${player.name}`;
            currentBatterSelect.appendChild(option);
        });
        // Select the current batter
        currentBatterSelect.value = currentTeamOffense.currentBatterIndex;
    };

    /**
     * Updates the scoreboard display.
     */
    const updateScoreboard = () => {
        const scoreboardContainer = document.querySelector('.scoreboard-container');
        const awayRow = document.querySelector('.scoreboard-row.away-team');
        const homeRow = document.querySelector('.scoreboard-row.home-team');
        const headerRow = document.querySelector('.scoreboard-header');

        // Clear existing inning columns (except team label, R, H, E, AVG, OBP)
        headerRow.querySelectorAll('.inning-col').forEach(col => col.remove());
        awayRow.querySelectorAll('.inning-score').forEach(col => col.remove());
        homeRow.querySelectorAll('.inning-score').forEach(col => col.remove());

        // Re-add inning columns
        for (let i = 0; i < maxInnings; i++) {
            const inningNum = i + 1;
            const inningColHeader = document.createElement('div');
            inningColHeader.classList.add('inning-col');
            inningColHeader.textContent = inningNum;
            // Insert before R, H, E columns
            headerRow.insertBefore(inningColHeader, headerRow.querySelector('.rhe-col'));

            const awayInningScore = document.createElement('div');
            awayInningScore.classList.add('inning-score');
            awayInningScore.textContent = scoreboardScores[0][i] !== undefined ? scoreboardScores[0][i] : '';
            awayRow.insertBefore(awayInningScore, awayRow.querySelector('.rhe-score'));

            const homeInningScore = document.createElement('div');
            homeInningScore.classList.add('inning-score');
            homeInningScore.textContent = scoreboardScores[1][i] !== undefined ? scoreboardScores[1][i] : '';
            homeRow.insertBefore(homeInningScore, homeRow.querySelector('.rhe-score'));
        }

        // Update total R, H, E
        awayTotalScore.textContent = awayTeam.score;
        awayTotalH.textContent = awayTeam.hits;
        awayTotalE.textContent = awayTeam.errors;

        homeTotalScore.textContent = homeTeam.score;
        homeTotalH.textContent = homeTeam.hits;
        homeTotalE.textContent = homeTeam.errors;

        // Update team AVG and OBP
        awayTeamAvg.textContent = calculateTeamAverage(awayTeam.players);
        awayTeamObp.textContent = calculateTeamOBP(awayTeam.players);
        homeTeamAvg.textContent = calculateTeamAverage(homeTeam.players);
        homeTeamObp.textContent = calculateTeamOBP(homeTeam.players);
    };

    /**
     * Calculates team batting average.
     * @param {Array} players - Array of player objects.
     * @returns {string} Formatted batting average.
     */
    const calculateTeamAverage = (players) => {
        let totalAtBats = 0;
        let totalHits = 0;
        players.forEach(p => {
            totalAtBats += p.atBats;
            totalHits += p.hits;
        });
        if (totalAtBats === 0) return '.000';
        return (totalHits / totalAtBats).toFixed(3).substring(1); // Remove leading '0'
    };

    /**
     * Calculates team on-base percentage.
     * @param {Array} players - Array of player objects.
     * @returns {string} Formatted on-base percentage.
     */
    const calculateTeamOBP = (players) => {
        let totalPA = 0; // Plate Appearances (AB + BB + HBP + SF)
        let totalOnBase = 0; // Hits + BB + HBP
        players.forEach(p => {
            totalAtBats = p.atBats;
            totalHits = p.hits;
            totalWalks = p.walks;
            totalHBP = p.hbp;
            totalSacrifice = p.sacrifice;

            totalPA += totalAtBats + totalWalks + totalHBP + totalSacrifice;
            totalOnBase += totalHits + totalWalks + totalHBP;
        });
        if (totalPA === 0) return '.000';
        return (totalOnBase / totalPA).toFixed(3).substring(1); // Remove leading '0'
    };


    /**
     * Updates the player stats tables.
     */
    const updatePlayerStatsTables = () => {
        updateSinglePlayerStatsTable(awayTeam, awayPlayerStatsTableBody, awayPlayerStatsTeamName);
        updateSinglePlayerStatsTable(homeTeam, homePlayerStatsTableBody, homePlayerStatsTeamName);
    };

    /**
     * Updates a single player stats table.
     * @param {Object} team - The team object.
     * @param {HTMLElement} tableBody - The tbody element to update.
     * @param {HTMLElement} teamNameHeader - The h3 element for the team name.
     */
    const updateSinglePlayerStatsTable = (team, tableBody, teamNameHeader) => {
        tableBody.innerHTML = '';
        teamNameHeader.textContent = `${team.name} 選手成績`;

        team.players.forEach((player, index) => {
            // Recalculate AVG and OBP for individual players
            const avg = player.atBats === 0 ? '.000' : (player.hits / player.atBats).toFixed(3).substring(1);
            const pa = player.atBats + player.walks + player.hbp + player.sacrifice;
            const obp = pa === 0 ? '.000' : ((player.hits + player.walks + player.hbp) / pa).toFixed(3).substring(1);

            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.atBats}</td>
                <td>${player.hits}</td>
                <td>${player.walks}</td>
                <td>${player.hbp}</td>
                <td>${player.sacrifice}</td>
                <td>${avg}</td>
                <td>${obp}</td>
            `;
        });
    };

    /**
     * Resets balls and strikes count.
     */
    const resetCount = () => {
        balls = 0;
        strikes = 0;
    };

    /**
     * Adds an event to the game history.
     * @param {string} eventText - The description of the event.
     */
    const addHistory = (eventText) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${currentInning}回${isTopInning ? '表' : '裏'}</strong>: ${eventText}`;
        gameHistoryList.prepend(listItem); // Add to the top
    };

    /**
     * Advances bases based on event.
     * @param {number} basesAdvanced - Number of bases to advance.
     * @param {boolean} isHit - True if the event is a hit (for RBI calculation).
     */
    const advanceBases = (basesAdvanced, isHit = false) => {
        let runsScored = 0;

        // Logic for runners scoring
        if (basesAdvanced === 4 || (basesAdvanced >= 1 && bases.third)) {
            runsScored++; // Runner on 3rd scores
        }
        if (basesAdvanced >= 2 && bases.second) {
            // Runner on 2nd scores (if hit is at least double or HR)
            if (basesAdvanced === 2 || basesAdvanced === 3 || basesAdvanced === 4) runsScored++;
        }
        if (basesAdvanced >= 3 && bases.first) {
            // Runner on 1st scores (if hit is at least triple or HR)
            if (basesAdvanced === 3 || basesAdvanced === 4) runsScored++;
        }

        // Move existing runners
        bases.third = (bases.third && basesAdvanced < 4) || (bases.second && basesAdvanced >= 2) || (bases.first && basesAdvanced >= 3);
        bases.second = (bases.second && basesAdvanced < 3) || (bases.first && basesAdvanced >= 2);
        bases.first = (bases.first && basesAdvanced < 2); // Runner from 1st either moves or scores

        // New batter reaches base
        if (basesAdvanced >= 1 && basesAdvanced <= 3) {
            if (basesAdvanced === 1) bases.first = true;
            else if (basesAdvanced === 2) bases.second = true;
            else if (basesAdvanced === 3) bases.third = true;
        }

        // Update score
        if (runsScored > 0) {
            currentTeamOffense.score += runsScored;
            addHistory(`${runsScored}点追加！`);
        }
    };

    /**
     * Handles an out event.
     */
    const handleOut = () => {
        outs++;
        resetCount();
        addHistory('アウト！');
        if (outs >= 3) {
            addHistory('3アウトチェンジ！');
            switchSides();
        } else {
            nextBatter();
        }
        updateGameInfo();
        updatePlayerStatsTables();
    };

    /**
     * Handles a hit event.
     * @param {number} basesHit - Number of bases for the hit (1 for single, 2 for double, etc.)
     */
    const handleHit = (basesHit) => {
        const batter = currentTeamOffense.players[currentTeamOffense.currentBatterIndex];
        batter.atBats++;
        batter.hits++;
        addHistory(`${batter.name} が ${basesHit === 1 ? 'ヒット' : basesHit === 2 ? '二塁打' : basesHit === 3 ? '三塁打' : 'ホームラン'}！`);
        advanceBases(basesHit, true); // Pass true for isHit
        currentTeamOffense.hits++;
        resetCount();
        nextBatter();
        updateGameInfo();
        updateScoreboard();
        updatePlayerStatsTables();
    };

    /**
     * Handles a walk (four-pitch walk or hit by pitch).
     * @param {string} type - 'walk' or 'hbp'
     */
    const handleWalkOrHBP = (type) => {
        const batter = currentTeamOffense.players[currentTeamOffense.currentBatterIndex];
        if (type === 'walk') {
            batter.walks++;
            addHistory(`${batter.name} が四球で出塁！`);
        } else { // type === 'hbp'
            batter.hbp++;
            addHistory(`${batter.name} が死球で出塁！`);
        }
        advanceBases(1); // Advance one base for walk/HBP
        resetCount();
        nextBatter();
        updateGameInfo();
        updateScoreboard(); // Score might change if runner scores
        updatePlayerStatsTables();
    };

    /**
     * Handles a sacrifice (bunt or fly).
     */
    const handleSacrifice = () => {
        const batter = currentTeamOffense.players[currentTeamOffense.currentBatterIndex];
        batter.sacrifice++;
        outs++; // Sacrifice counts as an out
        addHistory(`${batter.name} が犠打/犠飛！`);
        // Runners advance one base on sacrifice, but no hit for batter
        // Specific logic needed for sacrifice flies (runner on 3rd scores) vs sacrifice bunts (runners advance)
        // For simplicity, let's assume runner on 3rd scores and others advance one base if possible.
        if (bases.third && outs <= 3) { // Only score if not 3rd out on the play
            currentTeamOffense.score++;
            addHistory('ランナー生還！');
            bases.third = false; // Runner scored
        }
        // Advance other runners if they exist (simplistic for now)
        bases.third = bases.second;
        bases.second = bases.first;
        bases.first = false; // Batter is out, so first base is clear after advancing runners.

        resetCount();
        if (outs >= 3) {
            addHistory('3アウトチェンジ！');
            switchSides();
        } else {
            nextBatter();
        }
        updateGameInfo();
        updateScoreboard();
        updatePlayerStatsTables();
    };

    /**
     * Handles an error leading to batter reaching base.
     */
    const handleErrorOnBase = () => {
        const batter = currentTeamOffense.players[currentTeamOffense.currentBatterIndex];
        // Batter does not get an at-bat or hit for an error
        currentTeamDefense.errors++;
        addHistory(`${batter.name} が相手エラーで出塁！`);
        advanceBases(1); // Batter reaches 1st base
        resetCount();
        nextBatter();
        updateGameInfo();
        updateScoreboard();
        updatePlayerStatsTables();
    };


    /**
     * Moves to the next batter in the lineup.
     */
    const nextBatter = () => {
        currentTeamOffense.currentBatterIndex = (currentTeamOffense.currentBatterIndex + 1) % currentTeamOffense.players.length;
        populateBatterSelect();
    };

    /**
     * Switches offensive and defensive teams, and handles inning progression.
     */
    const switchSides = () => {
        // Store current team's score for the inning
        const scoreIndex = isTopInning ? 0 : 1; // 0 for away, 1 for home
        const currentInningScore = isTopInning ? awayTeam.score - (scoreboardScores[0].slice(0, currentInning - 1).reduce((a, b) => a + b, 0) || 0) : homeTeam.score - (scoreboardScores[1].slice(0, currentInning - 1).reduce((a, b) => a + b, 0) || 0);

        // Ensure array has space for current inning score
        if (scoreboardScores[scoreIndex].length < currentInning) {
            scoreboardScores[scoreIndex][currentInning - 1] = currentInningScore;
        } else {
            scoreboardScores[scoreIndex][currentInning - 1] = currentInningScore;
        }

        isTopInning = !isTopInning;
        outs = 0;
        resetCount();
        bases = { first: false, second: false, third: false };

        if (isTopInning) {
            currentInning++;
            if (currentInning > maxInnings && awayTeam.score !== homeTeam.score) {
                // If max innings reached and not a tie, end game
                endGame();
                return; // Prevent further execution if game ends
            } else if (currentInning > maxInnings && awayTeam.score === homeTeam.score) {
                // If tied after max innings, extend
                maxInnings++; // Extend by one inning
                alert(`9回終了同点！延長${currentInning}回に突入します。`);
            }
        }
        updateCurrentTeams();
        populateBatterSelect();
        updateGameInfo();
        updateScoreboard();
    };

    /**
     * Determines which team is currently on offense/defense.
     */
    const updateCurrentTeams = () => {
        if (isTopInning) {
            currentTeamOffense = awayTeam;
            currentTeamDefense = homeTeam;
        } else {
            currentTeamOffense = homeTeam;
            currentTeamDefense = awayTeam;
        }
    };

    /**
     * Ends the game and determines the winner.
     */
    const endGame = () => {
        let winnerMessage = '';
        if (awayTeam.score > homeTeam.score) {
            winnerMessage = `${awayTeam.name} の勝利！スコア: ${awayTeam.score} - ${homeTeam.score}`;
        } else if (homeTeam.score > awayTeam.score) {
            winnerMessage = `${homeTeam.name} の勝利！スコア: ${homeTeam.score} - ${awayTeam.score}`;
        } else {
            winnerMessage = `引き分け！スコア: ${awayTeam.score} - ${homeTeam.score}`;
        }
        alert(`試合終了！\n${winnerMessage}`);
        addHistory(`試合終了: ${awayTeam.name} ${awayTeam.score} - ${homeTeam.score} ${homeTeam.name} (${winnerMessage})`);

        // Save game state
        saveGameState();

        // Optionally, reset or show history
        showSection(historySection);
    };

    /**
     * Resets the entire game state.
     */
    const resetGame = () => {
        if (!confirm('本当に試合をリセットしますか？現在のデータは失われます。')) {
            return;
        }
        awayTeam = { name: awayTeamNameInput.value, score: 0, hits: 0, errors: 0, players: [], currentBatterIndex: 0 };
        homeTeam = { name: homeTeamNameInput.value, score: 0, hits: 0, errors: 0, players: [], currentBatterIndex: 0 };
        currentInning = 1;
        isTopInning = true;
        balls = 0;
        strikes = 0;
        outs = 0;
        bases = { first: false, second: false, third: false };
        scoreboardScores = [[], []]; // Reset scores per inning
        maxInnings = 9; // Reset max innings to default

        // Repopulate players from input fields
        createPlayerObjects();

        updateCurrentTeams(); // Set initial current teams
        updateScoreboard();
        updateGameInfo();
        populateBatterSelect();
        updatePlayerStatsTables();

        showSection(setupSection); // Go back to setup screen
    };

    /**
     * Creates player objects from input fields.
     */
    const createPlayerObjects = () => {
        const playerCount = parseInt(playerCountInput.value);

        awayTeam.players = [];
        homeTeam.players = [];

        for (let i = 1; i <= playerCount; i++) {
            const awayPlayerName = document.getElementById(`awayPlayer${i}`).value;
            const homePlayerName = document.getElementById(`homePlayer${i}`).value;

            awayTeam.players.push({ name: awayPlayerName, atBats: 0, hits: 0, walks: 0, hbp: 0, sacrifice: 0 });
            homeTeam.players.push({ name: homePlayerName, atBats: 0, hits: 0, walks: 0, hbp: 0, sacrifice: 0 });
        }
    };

    /**
     * Hides all sections and shows only the specified one.
     * @param {HTMLElement} sectionToShow - The section to display.
     */
    const showSection = (sectionToShow) => {
        setupSection.classList.add('hidden');
        scoreboardSection.classList.add('hidden');
        historySection.classList.add('hidden');
        bigCountSection.classList.add('hidden');
        sectionToShow.classList.remove('hidden');
    };

    /**
     * Saves the current game state to local storage.
     */
    const saveGameState = () => {
        const savedGames = JSON.parse(localStorage.getItem('baseballScoreboardGames')) || [];
        const gameData = {
            timestamp: new Date().toLocaleString(),
            awayTeam: { name: awayTeam.name, score: awayTeam.score, hits: awayTeam.hits, errors: awayTeam.errors },
            homeTeam: { name: homeTeam.name, score: homeTeam.score, hits: homeTeam.hits, errors: homeTeam.errors },
            innings: scoreboardScores.map(teamScores => [...teamScores]), // Deep copy
            finalResult: `${awayTeam.name} ${awayTeam.score} - ${homeTeam.score} ${homeTeam.name}`
        };
        savedGames.unshift(gameData); // Add to the beginning
        localStorage.setItem('baseballScoreboardGames', JSON.stringify(savedGames));
        loadGameHistory(); // Reload history after saving
    };

    /**
     * Loads and displays game history from local storage.
     */
    const loadGameHistory = () => {
        const savedGames = JSON.parse(localStorage.getItem('baseballScoreboardGames')) || [];
        gameHistoryList.innerHTML = '';
        if (savedGames.length === 0) {
            gameHistoryList.innerHTML = '<li>まだ試合履歴がありません。</li>';
            return;
        }
        savedGames.forEach(game => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>${game.timestamp}</strong><br>
                ${game.finalResult}
            `;
            gameHistoryList.appendChild(listItem);
        });
    };

    /**
     * Clears all game history from local storage.
     */
    const clearGameHistory = () => {
        if (confirm('全ての試合履歴をクリアしますか？')) {
            localStorage.removeItem('baseballScoreboardGames');
            loadGameHistory();
            addHistory('試合履歴をクリアしました。');
        }
    };

    // --- Event Listeners ---

    // Populate player inputs on page load and when count changes
    playerCountInput.addEventListener('change', populatePlayerInputs);
    // Initial population
    populatePlayerInputs();

    startGameButton.addEventListener('click', () => {
        awayTeam.name = awayTeamNameInput.value || 'ビジターズ';
        homeTeam.name = homeTeamNameInput.value || 'ホームズ';
        awayTeamLabel.textContent = awayTeam.name;
        homeTeamLabel.textContent = homeTeam.name;

        // Initialize players based on input fields
        createPlayerObjects();

        // Initialize scoreboardScores for the first inning (ensure 0 runs initially)
        scoreboardScores = [[0], [0]]; // Away, Home for currentInning 1

        updateCurrentTeams();
        populateBatterSelect();
        updateScoreboard();
        updateGameInfo();
        updatePlayerStatsTables();
        showSection(scoreboardSection);

        addHistory('試合開始！');

        // Add "Show Big Count" button dynamically if not already present
        if (!showBigCountButton) {
            const inningGameControlsDiv = document.querySelector('.inning-game-controls .button-grid-2col');
            showBigCountButton = document.createElement('button');
            showBigCountButton.id = 'showBigCountButton';
            showBigCountButton.classList.add('btn', 'btn-info');
            showBigCountButton.textContent = 'カウント拡大表示';
            inningGameControlsDiv.appendChild(showBigCountButton);

            showBigCountButton.addEventListener('click', () => {
                bigBallsCount.textContent = balls;
                bigStrikesCount.textContent = strikes;
                bigOutsCount.textContent = outs;
                showSection(bigCountSection);
            });
        }
    });

    backToScoreboardButton.addEventListener('click', () => {
        showSection(scoreboardSection);
    });

    batterOutButton.addEventListener('click', handleOut);
    batterSingleButton.addEventListener('click', () => handleHit(1));
    batterDoubleButton.addEventListener('click', () => handleHit(2));
    batterTripleButton.addEventListener('click', () => handleHit(3));
    batterHomeRunButton.addEventListener('click', () => handleHit(4));
    batterWalkButton.addEventListener('click', () => handleWalkOrHBP('walk'));
    batterHBPButton.addEventListener('click', () => handleWalkOrHBP('hbp'));
    batterSacrificeButton.addEventListener('click', handleSacrifice);
    batterErrorButton.addEventListener('click', handleErrorOnBase);

    addBallButton.addEventListener('click', () => {
        if (balls < 4) {
            balls++;
            addHistory('ボール！');
            if (balls === 4) {
                handleWalkOrHBP('walk'); // Batter walks on 4 balls
            }
        }
        updateGameInfo();
    });

    addStrikeButton.addEventListener('click', () => {
        if (strikes < 3) {
            strikes++;
            addHistory('ストライク！');
            if (strikes === 3) {
                handleOut(); // Batter strikes out on 3 strikes
            }
        }
        updateGameInfo();
    });

    resetCountButton.addEventListener('click', () => {
        resetCount();
        addHistory('カウントをリセットしました。');
        updateGameInfo();
    });

    addRunButton.addEventListener('click', () => {
        currentTeamOffense.score++;
        addHistory('得点追加！');
        updateScoreboard();
    });

    subtractRunButton.addEventListener('click', () => {
        if (currentTeamOffense.score > 0) {
            currentTeamOffense.score--;
            addHistory('得点削除。');
        }
        updateScoreboard();
    });

    addErrorButton.addEventListener('click', () => {
        currentTeamDefense.errors++;
        addHistory('エラー追加！');
        updateScoreboard();
    });

    subtractErrorButton.addEventListener('click', () => {
        if (currentTeamDefense.errors > 0) {
            currentTeamDefense.errors--;
            addHistory('エラー削除。');
        }
        updateScoreboard();
    });

    clearBasesButton.addEventListener('click', () => {
        bases = { first: false, second: false, third: false };
        addHistory('塁上をクリアしました。');
        updateGameInfo();
    });

    nextInningButton.addEventListener('click', () => {
        if (outs < 3) {
            if (!confirm('まだ3アウトではありませんが、次のイニングに進みますか？')) {
                return;
            }
        }
        // Force 3 outs if not already
        outs = 3;
        addHistory('強制的に3アウトとし、イニングを進めます。');
        switchSides(); // This will increment inning if needed
    });

    switchSidesButton.addEventListener('click', () => {
        if (outs < 3) {
            if (!confirm('まだ3アウトではありませんが、攻守交代しますか？')) {
                return;
            }
        }
        // Force 3 outs if not already
        outs = 3;
        addHistory('強制的に3アウトとし、攻守交代します。');
        switchSides();
    });

    endGameButton.addEventListener('click', endGame);
    resetGameButton.addEventListener('click', resetGame);

    clearHistoryButton.addEventListener('click', clearGameHistory);

    currentBatterSelect.addEventListener('change', (event) => {
        currentTeamOffense.currentBatterIndex = parseInt(event.target.value);
        addHistory(`${currentTeamOffense.players[currentTeamOffense.currentBatterIndex].name} が打席に入ります。`);
        resetCount(); // Reset count when new batter comes up
        updateGameInfo();
    });


    // --- Initial Setup on Load ---
    loadGameHistory(); // Load history when the page loads
});
