define(function(require){
    var http = require("plugins/http")
    var ko = require('knockout');

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
                that.characters = response.characters.character;
            });
        }
    };
});