define(function(require){
    var http = require('plugins/http')
    var ko = require('knockout');
    var _ = require('underscore');

    var characters = ko.observableArray();
    var parents = ko.observableArray();
    var items = ko.observableArray();
    var currentItems = ko.observableArray();
    var selectedStates = ko.observableArray();
    var dependencies = ko.observableArray();
    var selectedCharacters = {};

    var filterParents = function(list) {
        return _.filter(list, function(item){ return !item.parent; });
    };

    var filterConditionsCharacter = function(characters) {
        return _.filter(characters, function(character){
            if(!_.isEmpty(character.conditions)){
                var intersection = _.intersection(selectedStates(), character.conditions);
                if(_.isEmpty(intersection)){//Do not show if it has conditions, but none of them are chosen
                    return false;
                }
                return true;
            }
            return true;
        });
    };

    var charactersToShow = ko.computed(function() {
        //Find all stateIds for currently shown items, and for children if applicable.
        //Parents do not have their own stateIds, only their children have
        var statesCurrentIds = _.map(currentItems(), function(item){

            //Will work without children as well, just a noop then
            var children = item.children;
            children = _.filter(items(), function(item){
                return _.contains(children, item.id);
            });
            var states = _.flatten(children, "stateIds");

            //No children, use own states instead
            if(states.length === 0) { states = item.stateIds }
            return states;
        });

        //statesCurrentIds is a list of lists, that contain all the states for each item
        var filteredCharacters = _.filter(characters(), function(character){
            var stateIds = _.map(character.states, "id");

            //For a character to be shown, it has to have one of its states in all of the states for the current items
            return _.all(statesCurrentIds, function(state) {
                return ! _.isEmpty(_.intersection(state, stateIds));
            });
        });

        return filterConditionsCharacter(filteredCharacters);
    });

    var filteredItems = ko.computed(function() {
        if(selectedStates().length === 0){
            currentItems(parents());
            return;
        }

        //Finn items hvor alle states som er valgt er i statelisten til itemen
        var filtered = _.filter(items(), function(item) {
            return _(selectedStates()).all(function(state){
                    return _.contains(item.stateIds, state)
                });
        });

        var mergedChildren = combineSiblingsIntoParent(filtered);

        currentItems(mergedChildren);
    });

    var combineSiblingsIntoParent = function(listOfItems) {
        var itemIds = _.map(listOfItems, "id");
        var parentsWithAllChildrenInList = [];

        _.forEach(parents(), function(parent) {
            if(parent.children.length === 0 ) { return; }

            //Sjekk om alle ungene til parenten skal vises
            var allChildrenInList = _.all(parent.children, function(childId) { return _.contains(itemIds, childId)});

            if(allChildrenInList){
                parentsWithAllChildrenInList.push(parent);
            }
        });

        var childrenToRemove = _.flatten(parentsWithAllChildrenInList, "children");

        listOfItems = _.filter(listOfItems, function(item){ return ! _.contains(childrenToRemove, item.id)});
        listOfItems = _.unique(listOfItems.concat(parentsWithAllChildrenInList));

        return listOfItems;
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

    var lagCSV = function(){
        var taxons = items();
        var states = _(characters()).map("states").flatten().map("id").value();

        var matrix = {};

        _.forEach(states, function(stateId){
            matrix[stateId] = [];

            _.forEach(taxons, function(item){
                matrix[stateId].push(_.contains(item.stateIds, stateId));
            });
        });

        var csvContent = "data:text/csv;charset=utf-8,";

        csvContent += ";" + _.map(taxons, "text").join(";") + "\n"; //Taxons top row, empty first cell

        _.forOwn(matrix, function(value, key){
            csvContent += key + ";";
            csvContent += value.join(";");
            csvContent += "\n";
        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "nokkel.csv");

        link.click();
    }

    return {
        items: items,
        parents: parents,
        valgteOrdener: valgteOrdener,
        currentItems: currentItems,
        characters: characters,
        selectedStates: selectedStates,
        stateSelected: stateSelected,
        charactersToShow: charactersToShow,

        activate: function () {
            var that = this;

            return http.get("/App/viewmodels/glansvinger.json").then(function (response) {
                var pairs = response.pairs.pair;
                var taxa = response.taxa.taxon;
                var dependencies = response.dependencies.dependency;
                var states = response.states.state;
                var characters =  response.characters.character;


                _.forEach(taxa, function(taxon){
                    taxon.stateIds = _(pairs).filter({taxon: taxon.id}).map('state').value();
                    taxon.html = ko.observable();
                    if (taxon.widget != undefined) {
                        http.get(taxon.widget).then(function (response) {
                            taxon.html(response);
                        });
                    }
                });

                _.forEach(characters, function(character){
                    character.states = _.where(states, {character: character.id});
                    character.conditions = _(dependencies).where({dependant: character.id}).map('condition').flatten().value();

                    _.forEach(character.states, function(state){
                        state.html = ko.observable();
                        if (state.widget != undefined) {
                            http.get(state.widget).then(function (response) {
                                state.html(response);
                            });
                        }
                    })
                });

                var parents = filterParents(taxa);
                _.forEach(parents, function(parent){
                    parent.children = [];
                    _.forEach(taxa, function(item){
                        if(item.parent === parent.id){
                            parent.children.push(item.id);
                        }
                    });
                });
                that.parents(parents);

                that.currentItems(parents);
                that.items(taxa);
                that.characters(characters);

            });
        }
    };
});
