TicTacToe.Services.factory('services.GameService',
    function(){
        var Service = {};
        var state = {};
        state.board = [];
        state.winner = ' ';
        var yourPlayerIndex = 0;
        var win_patterns = [
            'XXX......',
            '...XXX...',
            '......XXX',
            'X..X..X..',
            '.X..X..X.',
            '..X..X..X',
            'X...X...X',
            '..X.X.X..'];

        Service.setState = function(newState) {
            state = newState;
        };

        Service.getState = function(){
            return state;
        };

        Service.setYourPlayerIndex = function(playerIndex){
            yourPlayerIndex = playerIndex;
        };

        Service.getYourPlayerIndex = function(){
            return yourPlayerIndex;
        };

        Service.getWinPatterns = function() {
            return win_patterns;
        };

        return Service;
    });