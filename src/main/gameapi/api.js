/*global window, console */
/*
 //multiplayer-gaming.com/api.js
 */
var platform = function () {
    var isPassAndPlay;
    var isPlayAgainstTheComputer;
    var urlPlayersNumber;
    var isOldApi = false;
    var game;
    var minNumberOfPlayers;
    var maxNumberOfPlayers;

    var currentState;
    var lastState;
    var currentVisibleTo;
    var lastVisibleTo;
    var lastMove;
    var turnIndexBeforeMove;
    var turnIndexAfterMove;
    var allPlayerIds;
    var playersInfo;
    // Old API
    var oldApiPlayerIdToNumberOfTokensInPot;
    var oldApiMove;

    // private methods
    var makeMoveCallback;

    function parseUrl() {
        var url = window.location.search;
        isPassAndPlay = new RegExp("PassAndPlay", "i").exec(url) !== null;
        isPlayAgainstTheComputer = new RegExp("PlayAgainstTheComputer", "i").exec(url) !== null;
        var playersNumberMatch = new RegExp("PlayersNumber=([0-9])+", "i").exec(url);
        urlPlayersNumber = playersNumberMatch === null ? 2 : parseInt(playersNumberMatch[1], 10);
    }
    parseUrl();

    function init() {
        currentState = {};
        lastState = null;
        currentVisibleTo = {};
        lastVisibleTo = null;
        lastMove = [];
        allPlayerIds = [];
        playersInfo = [];
        for (var i = 0; i < urlPlayersNumber; i++) {
            var playerId = "" + (i === (urlPlayersNumber - 1) && isPlayAgainstTheComputer ? 0 : i + 42); // AI id (in OldAPI) is 0.
            allPlayerIds.push(playerId);
            playersInfo.push({playerId : playerId});
        }
        turnIndexBeforeMove = 0;
        turnIndexAfterMove = 0;
        // Old API
        oldApiPlayerIdToNumberOfTokensInPot = {};
        oldApiMove = [];
    }

    //Function to get the keys from a JSON object
    function getKeys(object) {
        var keys = [];
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    function clone(obj) {
        var str = JSON.stringify(obj);
        var copy = JSON.parse(str);
        return copy;
    }

    function isNull(obj) {
        return obj === undefined || obj === null;
    }

    function throwError() {
        console.log("Throwing an error with these arguments=", arguments);
        throw new Error(Array.prototype.join.call(arguments, ", "));
    }

    function get(obj, field) {
        if (isNull(obj[field])) {
            throwError("You must have a field named '", field, "' in this object=", obj);
        }
        return obj[field];
    }

    function getStateforPlayerIndex(playerIndex, gameState, visibleTo) {
        if (gameState === null) {
            return null;
        }
        var result = {};
        var keys = getKeys(gameState);
        for (var k = 0; k < keys.length; k++) {
            var visibleToPlayerIndexes = visibleTo[keys[k]];
            var value = null;
            if (visibleToPlayerIndexes === null || visibleToPlayerIndexes.indexOf(playerIndex) > -1) {
                value = gameState[keys[k]];
            }
            result[keys[k]] = value;
        }
        return result;
    }

    function shuffle(keys) {
        var keysCopy = keys.slice(0);
        var result = [];
        while (keysCopy.length >= 1) {
            var index = Math.floor(Math.random() * keysCopy.length);
            var removed = keysCopy.splice(index, 1);
            result.push(removed);
        }
        return result;
    }

    function convertPlayerIdsToPlayerIndexes(playerIds) {
        if (playerIds === undefined || playerIds === null || playerIds === "ALL") {
            return null;
        }
        var playerIndexes = [];
        for (var i = 0; i < playerIds.length; i++) {
            var playerId = playerIds[i];
            var playerIndex = allPlayerIds.indexOf(playerId);
            if (playerIndex === -1) {
                throw Error("Cannot find playerId=" + playerId + " in " + allPlayerIds);
            }
            playerIndexes.push(playerIndex);
        }
        return playerIndexes;
    }

    function processApiOperation(operation) {
        //Check for all types of Operations
        var key = operation.key;
        var visibleToPlayerIndexes = operation.visibleToPlayerIndexes; // can be omitted
        if (visibleToPlayerIndexes === undefined) {
            visibleToPlayerIndexes = null;
        }
        var type = operation.type;
        if (type === "Set") {
            var value = operation.value;
            if (isNull(key) || isNull(value)) {
                throwError("Fields key and value in Set operation must be non null. operation=" + operation);
            }
            currentState[key] = value;
            currentVisibleTo[key] = visibleToPlayerIndexes;
        } else if (type === "SetRandomInteger") {
            var from = operation.from;
            var to = operation.to;
            if (isNull(key) || isNull(from) || isNull(to)) {
                throwError("Fields key, from, and to, in SetRandomInteger operation must be non null. operation=" + operation);
            }
            var randomValue = Math.floor((Math.random() * (to - from)) + from);
            currentState[key] = randomValue;
            currentVisibleTo[key] = null;
        } else if (type === "SetVisibility") {
            if (isNull(key)) {
                throwError("Fields key in SetVisibility operation must be non null. operation=" + operation);
            }
            currentVisibleTo[key] = visibleToPlayerIndexes;
        } else if (type === "Delete") {
            key = operation.key;
            if (isNull(key)) {
                throwError("Field key in Delete operation must be non null. operation=" + operation);
            }
            delete currentState[key];
            delete currentVisibleTo[key];
        } else if (type === "Shuffle") {
            var keys = operation.keys;
            if (isNull(keys) || (keys.length === 0)) {
                throwError("Field keys in Shuffle operation must be a non empty array. operation=" + operation);
            }
            var shuffledKeys = shuffle(keys);
            var oldGameState = clone(currentState);
            var oldVisibleTo = clone(currentVisibleTo);
            for (var j = 0; j < shuffledKeys.length; j++) {
                var fromKey = keys[j];
                var toKey = shuffledKeys[j];
                currentState[toKey] = oldGameState[fromKey];
                currentVisibleTo[toKey] = oldVisibleTo[fromKey];
            }
        } else if (type === "EndGame") {
            if (!isOldApi) {
                var scores = operation.endGameScores;
                if (isNull(scores) || scores.length !== allPlayerIds.length) {
                    throwError("Field scores in EndGame operation must be an array of the same length as the number of players. scores=" + operation.scores + " #players=" + allPlayerIds.length);
                }
                window.alert("EndGame with scores=" + JSON.stringify(scores));
            } else {
                window.alert("EndGame: playerIdToScore=" + JSON.stringify(operation.playerIdToScore));
            }
            init();
        } else {
            throwError("Illegal operation.type = " + type + " (type must be either Set, SetRandomInteger, SetVisibility, Delete, Shuffle, or EndGame).");
        }
    }

    function hackerFoundCallback(params) {
        var gameDeveloperEmail = get(params, 'gameDeveloperEmail');
        var emailSubject = get(params, 'emailSubject');
        var emailBody = get(params, 'emailBody');
        // TODO: email the developer.
        throwError("Declared a hacker");
    }

    function sendUpdateUi() {
        if (!isOldApi) {
            var stateBeforeMove = getStateforPlayerIndex(turnIndexAfterMove, lastState, lastVisibleTo);
            var stateAfterMove = getStateforPlayerIndex(turnIndexAfterMove, currentState, currentVisibleTo);
            if (game.isMoveOk(
                {
                    move : lastMove,
                    turnIndexBeforeMove : turnIndexBeforeMove,
                    turnIndexAfterMove : turnIndexAfterMove,
                    stateBeforeMove : stateBeforeMove,
                    stateAfterMove : stateAfterMove
                }) !== true) {
                throwError("You declared a hacker for a legal move! move=" + lastMove);
            }
            game.updateUI(
                {
                    move : lastMove,
                    turnIndexBeforeMove : turnIndexBeforeMove,
                    turnIndexAfterMove : turnIndexAfterMove,
                    stateBeforeMove : stateBeforeMove,
                    stateAfterMove : stateAfterMove,
                    yourPlayerIndex : turnIndexAfterMove,
                    matchId : 1,
                    createdTimestampMillis : 0,
                    lastMoveTimestampMillis : 0,
                    endGameResult : null,
                    playersInfo : playersInfo,
                    makeMoveCallback : makeMoveCallback
                });
        } else {
            var currentPlayerId = allPlayerIds[turnIndexAfterMove];
            window.passMessage({'type': 'UpdateUI',
                'yourPlayerId': currentPlayerId,
                'playersInfo': playersInfo,
                'state': getStateforPlayerIndex(turnIndexAfterMove, currentState, currentVisibleTo),
                'lastState': getStateforPlayerIndex(turnIndexAfterMove, lastState, lastVisibleTo),
                'lastMove': oldApiMove,
                'lastPlayerId': allPlayerIds[turnIndexBeforeMove],
                'playerIdToNumberOfTokensInPot': oldApiPlayerIdToNumberOfTokensInPot });
        }
    }

    makeMoveCallback = function (params) {
        lastState = clone(currentState);
        lastVisibleTo = clone(currentVisibleTo);
        turnIndexBeforeMove = turnIndexAfterMove;
        turnIndexAfterMove = get(params, "turnIndexAfterMove");
        lastMove = get(params, "move");
        if (!(turnIndexAfterMove >= 0 && turnIndexAfterMove < allPlayerIds.length)) {
            throwError("Parameter turnIndexAfterMove in makeMoveCallback must be between 0 and " + allPlayerIds.length + ", but it was " + turnIndexAfterMove + ".");
        }
        for (var i = 0; i < lastMove.length; i++) {
            processApiOperation(lastMove[i]);
        }
        sendUpdateUi();
    };

    function processOldApiMessage(msg) {
        if (msg.type === "GameReady") {
            init();
            sendUpdateUi();
        } else if (msg.type === "MakeMove") {
            // Convert OldAPI to new API.
            var _turnIndexAfterMove = null;
            var operations = msg.operations;
            var newApiOperations = [];
            oldApiMove = msg.operations;
            for (var i = 0; i < operations.length; i++) {
                var operation = operations[i];
                if (operation.type === "SetTurn") {
                    if (_turnIndexAfterMove !== null) {
                        throwError("You can only call SetTurn once in operations=" + operations);
                    }
                    _turnIndexAfterMove = allPlayerIds.indexOf(operation.playerId);
                    if (_turnIndexAfterMove === -1) {
                        throwError("Missing playerId=" + operation.playerId);
                    }
                } else if (operation.type === "AttemptChangeTokens") {
                    oldApiPlayerIdToNumberOfTokensInPot = operation.playerIdToNumberOfTokensInPot;
                } else if (operation.type === "Set") {
                    newApiOperations.push({type: "Set", key: operation.key, value: operation.value,
                        visibleToPlayerIndexes: convertPlayerIdsToPlayerIndexes(operation.visibleToPlayerIds)});
                } else if (operation.type === "SetVisibility") {
                    newApiOperations.push({type: "SetVisibility", key: operation.key,
                        visibleToPlayerIndexes: convertPlayerIdsToPlayerIndexes(operation.visibleToPlayerIds)});
                } else {
                    newApiOperations.push(operation);
                }
            }
            if (_turnIndexAfterMove === null) {
                throwError('You must call SetTurn every MakeMove, or your game is NOT turn-based! operations=' + operations);
            }
            makeMoveCallback({ move : newApiOperations, turnIndexAfterMove : _turnIndexAfterMove});
        }
    }

    function setGame(_game) {
        game = _game;
        get(game, "isMoveOk");
        get(game, "updateUI");
    }

    function showUI(params) {
        minNumberOfPlayers = get(params, "minNumberOfPlayers");
        maxNumberOfPlayers = get(params, "maxNumberOfPlayers");
        init();
        sendUpdateUi();
    }

    // For old API from Spring 2014 (where we used postMessage)
    function gotMessage(message) {
        isOldApi = true;
        if (isPassAndPlay || isPlayAgainstTheComputer) {
            processOldApiMessage(message);
        } else {
            window.parent.postMessage(message, "*");
        }
    }

    return {setGame : setGame, showUI: showUI, gotMessage: gotMessage};
} ();