define(function(require){
    var http = require('plugins/http')
    var ko = require('knockout');
    var _ = require('underscore');

    var characters;
    var parents = ko.observableArray();
    var items = ko.observableArray();
    var currentItems = ko.observableArray();
    var selectedStates = ko.observableArray();
    var dependencies = ko.observableArray();
    var selectedCharacters = {};

    var filterParents = function(list) {
        return _.filter(list, function(item){return !item.parent});
    }

    var filteredItems = ko.computed(function() {
        if(selectedStates().length === 0){
            currentItems(parents());
            return;
        }

        var filtered = _.filter(items(), function(item) {
            return _(selectedStates()).every(function(state){
                    return _.contains(item.stateIds, state)
                });
        });

        var filteredIds = _.map(filtered, "id");
        var parentsWithAllChildrenSelected = [];

        _.forEach(parents(), function(parent) {
            if(parent.children.length === 0 ) { return; }
            var allChildrenSelected = _.all(parent.children, function(siblingId) { return _.contains(filteredIds, siblingId)});

            if(allChildrenSelected){
                parentsWithAllChildrenSelected.push(parent);
            }
        });

        var childrenToRemove = _.flatten(parentsWithAllChildrenSelected, "children");

        filtered = _.filter(filtered, function(item){ return ! _.contains(childrenToRemove, item.id)});
        filtered = _.unique(filtered.concat(parentsWithAllChildrenSelected));


        currentItems(filtered);
    });

    var characterHidden = function(conditions) {
        if(conditions.length === 0){
            return false;
        }

        var intersection = _.intersection(selectedStates(), conditions);
        if(intersection.length === 0){//Skjult hvis den har conditions, men ingen av de er valgt
            return true;
        }

        return false;
    };

    var valgteOrdener = ko.computed(function(){
        if(currentItems().length === 0) {
            return parents();
        }

        var selectedParents = _.map(currentItems(), function(item){
            if(!item.parent){ //Hvis den er valgt, men ikke har noe parent, er den sin egen 'orden'
                return item.id;
            }
            return item.parent;
        });
        return _.filter(parents(), function(parent){
            return _.contains(selectedParents, parent.id);
        });
    });

    var stateSelected = function(data, event) {
        settInnStateIListeOgOppdaterSelectedStates(data.id);
    };

    var settInnStateIListeOgOppdaterSelectedStates = function(state) {
        var character = state.split("_")[0];
        if(selectedCharacters[character] === state){//State er allerede valgt, klikk på den skal fjerne valgt.
            delete selectedCharacters[character];
        } else {
            selectedCharacters[character] = state; //Sett inn state på character, og overskriv hvis søskenstate er valgt.
        }
        selectedStates(_.map(selectedCharacters)); //Hent ut states fra valgte characters og sett til valgte states.
    };

    return {
        items: items,
        parents: parents,
        valgteOrdener: valgteOrdener,
        currentItems: currentItems,
        characters: characters,
        selectedStates: selectedStates,
        stateSelected: stateSelected,
        characterHidden: characterHidden,

        activate: function () {
            var that = this;

            return http.get("/App/viewmodels/glansvinger.json").then(function (response) {
                var pairs = response.pairs.pair;
                var taxa = response.taxa.taxon;
                var dependencies = response.dependencies.dependency;

                _.forEach(taxa, function(taxon){
                    taxon.stateIds = _(pairs).filter({taxon: taxon.id}).map('state').value();
                });

                that.items(taxa);
                that.parents(filterParents(that.items()));

                _.forEach(that.parents(), function(parent){
                    parent.children = [];
                    _.forEach(that.items(), function(item){
                        if(item.parent === parent.id){
                            parent.children.push(item.id);
                        }
                    });
                });

                that.currentItems(that.parents());
                var states = response.states.state;
                var characters =  response.characters.character;

                _.forEach(characters, function(character){
                    character.states = _.filter(states, {character: character.id});
                    character.conditions = _(dependencies).filter({dependant: character.id}).map('condition').value();
                });

                that.characters = characters;
            });
        }
    };
});