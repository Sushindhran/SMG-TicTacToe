TicTacToe.Controllers.controller('view.GameController',
    ['$scope', '$rootScope', 'constants.Configuration', 'services.GameService',
        function ($scope, $rootScope, configuration, gameService) {
            var makeMoveCallback;
            $scope.displayText = "Game started";

            $scope.gridRows = [
                {'id' : '0','class': 't l cell'},
                {'id' : '1','class': 't c cell'},
                {'id' : '2','class': 't r cell'},
                {'id' : '3','class': 'm l cell'},
                {'id' : '4','class': 'm c cell'},
                {'id' : '5','class': 'm r cell'},
                {'id' : '6','class': 'b l cell'},
                {'id' : '7','class': 'b c cell'},
                {'id' : '8','class': 'b r cell'}
            ];

            var setState = function(serverState) {
                console.log("serverState "+serverState);
                var state = {};
                state.board = [];
                for (var i = 0; i < 9; i++) {
                    state.board[i] = serverState[i] == null ? ' ' : serverState[i];
                }
                if(serverState.winner!=null){
                    state.winner = serverState.winner;
                }else{
                    state.winner = getWinner();
                }

                console.log("State board "+state.board);
                gameService.setState(state);
            }

            function isTie() {
                for (var i = 0; i < 9; i++) {
                    if (gameService.getState().board[i] === ' ') {
                        return false;
                    }
                }
                return true;
            }

            var getWinner = function(){
                var stateStr = '';
                var state = gameService.getState();
                var win_patterns = gameService.getWinPatterns();
                for (var i = 0; i < 9; i++) {
                    stateStr += state.board[i];
                }

                for (var i = 0; i < win_patterns.length; i++) {
                    var win_pattern = win_patterns[i];
                    var x_regexp = new RegExp(win_pattern);
                    var o_regexp = new RegExp(win_pattern.replace(/X/g,'O'));
                    if (x_regexp.test(stateStr)) {
                        return 'X';
                    }
                    if (o_regexp.test(stateStr)) {
                        return 'O';
                    }
                }
                return ' ';
            }

            $scope.getWinner = getWinner;

            var updateTicTacToeGraphics = function() {
                console.log("Updating the UI");
                var state = gameService.getState();
                for (var i = 0; i < 9; i++) {
                    var square = document.getElementById(i);
                    square.innerHTML = state.board[i];
                }

                if (state.winner != ' ') {
                    var yourPlayerIndex = gameService.getYourPlayerIndex();
                    var winnerPlayerId = state.winner == 'X' ? 0 : 1;
                    yourPlayerIndex == winnerPlayerId ? $scope.displayText = "You won the game!" : "";
                    yourPlayerIndex == winnerPlayerId ? "" : $scope.displayText = "You lost the game.";
                } else if (isMyMove()) {
                    $scope.displayText = "Your move! Click a square to place your piece.";
                } else {
                    $scope.displayText = "Waiting for other player to move...";
                }
            };

            var isMyMove = function() {
                var state = gameService.getState();
                if(state == null) {
                    return;
                }
                var numberOfMoves = 0;
                for (i = 0; i < 9; i++) {
                    if (state.board[i] != ' ') {
                        numberOfMoves++;
                    }
                }
                return state.winner == ' ' && (numberOfMoves % 2 == gameService.getYourPlayerIndex());
            }

            $scope.isMyMove = isMyMove;
            var sendMessage = function(id){
                var state = gameService.getState();
                var value = gameService.getYourPlayerIndex() == 0 ? 'X' : 'O';
                state.board[id] = value;
                state.winner =  getWinner();
                console.log("Winner is "+state.winner);
                setState(state.board);
                updateTicTacToeGraphics();
                var operations = [];
                operations.push({type: "Set", key: id.toString(), value: value, visibleToPlayerIndexes: "null"});
                if (state.winner != ' ') {
                    var winnerPlayerIndex = state.winner == 'X' ? 0 : 1;
                    var playerScores = {};
                    for (var index = 0; index < 2; index++) {
                        playerScores[configuration.playerIds[index]] = winnerPlayerIndex == index ? 1 : 0;
                    }
                    operations.push({"type": "EndGame", endGameScores: playerScores});
                    console.log("Sending game over!");
                } else if (isTie()) {
                    operations.push({"type": "EndGame", endGameScores: [0, 0]})
                }
                console.log(["operations",operations,"state.winner=", state.winner, state]);
                makeMoveCallback({move : operations, turnIndexAfterMove : 1 - gameService.getYourPlayerIndex()});
            };

            $scope.moveInSquare = function(id){
                var state = gameService.getState();

                if (isMyMove() && state.board[id] == ' ') {
                    sendMessage(id);
                }
            };


            $scope.highlightSquare = function(id) {
                var state = gameService.getState();
                if (state == null) {
                    return;
                }
                if (state.winner != " ") {
                    return;
                }
                for (var i = 0; i < 9; i++) {
                    if (i == id  && isMyMove()) {
                        if (state.board[i] == ' ') {
                            color = 'lightBlue';
                        } else {
                            color = 'lightGrey';
                        }
                    } else {
                        color = 'white';
                    }
                    document.getElementById(i).style['background'] = color;
                }
            }

            var game = function () {
                function isMoveOk(match) {
                    console.log("verifyMove:", match);
                    return true;
                }

                function updateUI(match) {
                    console.log("updateUI:", match);
                    gameService.setYourPlayerIndex( match.yourPlayerIndex);
                    makeMoveCallback = match.makeMoveCallback;
                    setState(match.stateAfterMove);
                    updateTicTacToeGraphics();
                }

                return {
                    isMoveOk : isMoveOk,
                    updateUI: updateUI
                };
            }();

            $scope.startGame = function(){
                platform.setGame(game);
                platform.showUI({minNumberOfPlayers: 2, maxNumberOfPlayers: 2});
            };
        }]);