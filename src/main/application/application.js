/** This file defines all the dependencies that the AngularJS application will use
 *  like filters, services, directives and controllers.
 */

var TicTacToe = TicTacToe || {};

TicTacToe.Constants = angular.module('tictactoe.constants', []);
TicTacToe.Services = angular.module('tictactoe.services', []);
TicTacToe.Controllers = angular.module('tictactoe.controllers', []);
TicTacToe.Filters = angular.module('tictactoe.filters', []);
TicTacToe.Directives = angular.module('tictactoe.directives', []);
TicTacToe.Dependencies = [
    'tictactoe.filters',
    'tictactoe.services',
    'tictactoe.directives',
    'tictactoe.constants',
    'tictactoe.controllers',
    'ngRoute',
    'ngAudio'
];

//Define the routes for the application using $routeProvider
angular.module(
    'TicTacToe',
    TicTacToe.Dependencies
).
    config(
    [
        '$routeProvider',
        function($routeProvider) {

            //Routes to game.html for /play
            $routeProvider.when('/play', {
                templateUrl: '/SMG-TicTacToe/src/main/application/view/game.html'
            });

            //Defaults to game.html if it doesn't match any route
            $routeProvider.otherwise({templateUrl: '/SMG-TicTacToe/src/main/application/view/game.html'});
        }
    ]
);
