define(function(require){
    var http = require('plugins/http')
    var ko = require('knockout');
    var _ = require('underscore');

    var items = ko.observableArray();
    var currentItems = ko.observableArray();
    var characters;



    return {
        items: items,
        currentItems: currentItems,
        characters: characters,

        activate: function () {
            var that = this;

            return http.get("/App/viewmodels/glansvinger.json").then(function (response) {
                that.items(response.taxa.taxon);
                that.currentItems(response.taxa.taxon);
                var characters =  response.characters.character;
                var states = response.states.state;

                _.forEach(characters, function(character){
                    character.states = _.filter(states, function(state){ if(state.character === character.id) return state});
                });

                that.characters = characters;
            });
        }
    };
});