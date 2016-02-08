define(function (require) {
    var http = require('plugins/http')
    var ko = require('knockout');
    var _ = require('underscore');

    var widgetPath = 'http://data.artsdatabanken.no/';

    var characters = ko.observableArray();
    var parents = ko.observableArray();
    var items = ko.observableArray();
    var currentItems = ko.observableArray();
    var selectedStates = ko.observableArray([]);
    var implicitStates = ko.observableArray([]);
    var dependencies = ko.observableArray();
    var selectedCharacters = {};

    var filterParents = function (list) {
        return _.filter(list, function (item) {
            return !item.parent;
        });
    };

    var filterConditionsCharacter = function (characters) {
        return _.filter(characters, function (character) {
            if (!_.isEmpty(character.conditions)) {
                var states = selectedStates().concat(implicitStates());
                var intersection = _.intersection(states, character.conditions);
                if (_.isEmpty(intersection)) {//Do not show if it has conditions, but none of them are chosen
                    return false;
                }
                return true;
            }
            return true;
        });
    };

    var findStatesCurrentItems = function () {
        //Find all stateIds for currently shown items, and for children if applicable.
        //Parents do not have their own stateIds, only their children have
        return _.map(currentItems(), function (item) {
            var states = [], children;

            if (Array.isArray(item.children) && item.children.length) {
                states = _.map(_.filter(items(), function (item) {
                    return _.includes(children, item.id);
                }), "stateIds");
            } else {
                states = item.stateIds;
            }

            return states;
        });
    };

    var charactersToShow = ko.computed(function () {
        var statesCurrentIds = findStatesCurrentItems();
        //statesCurrentIds is a list of lists, that contain all the states for each item
        var filteredCharacters = _.filter(characters(), function (character) {
            var stateIds = _.map(character.states, "id");

            //For a character to be shown, it has to have one of its states in all of the states for the current items
            return _.every(statesCurrentIds, function (state) {
                return !_.isEmpty(_.intersection(state, stateIds));
            });
        });

        return filterConditionsCharacter(filteredCharacters);
    });

    var filteredItems = ko.computed(function () {
        if (selectedStates().length === 0) {
            currentItems(parents());
            return;
        }

        //Find items where all the states that are selected, are in the statelist for the item
        var filtered = _.filter(items(), function (item) {
            var states;
            //If only 1 taxon remains, all states are implicitly selected, as they all 'belong' to the taxon.
            //Therefore we can't use the implicitly selected states
            if (currentItems().length === 1) {
                states = selectedStates();
            }
            else {
                states = selectedStates().concat(implicitStates());
            }
            return _(states).every(function (state) {
                return _.includes(item.stateIds, state)
            });
        });

        var mergedChildren = combineSiblingsIntoParent(filtered);

        currentItems(mergedChildren);
    });

    ko.computed(function () {
        var statesCurrentIds = findStatesCurrentItems();
        var groups = _.groupBy(_.flatten(statesCurrentIds));
        var keys = _.keys(groups); //All unique states for current items

        var implicitlySelectedStates = _.filter(groups, function (list) {
            var currentState = list[0]; //Always at least one item, all items are the same
            var currentChar = currentState.split("_")[0];
            var hasSiblingState = _.some(keys, function (state) {
                var stateChar = state.split("_")[0];
                return stateChar === currentChar && state !== currentState
            });

            return list.length === currentItems().length && !hasSiblingState;
        });

        implicitlySelectedStates = _.map(implicitlySelectedStates, function (list) {
            return list[0];
        });
        implicitlySelectedStates = _.filter(implicitlySelectedStates, function (state) {
            return !_.includes(selectedStates(), state);
        });
        implicitStates(implicitlySelectedStates);
    });

    var combineSiblingsIntoParent = function (listOfItems) {
        var itemIds = _.map(listOfItems, "id");
        var parentsWithAllChildrenInList = [];

        _.forEach(parents(), function (parent) {
            if (parent.children.length === 0) {
                return;
            }

            //Sjekk om alle ungene til parenten skal vises
            var allChildrenInList = _.every(parent.children, function (childId) {
                return _.includes(itemIds, childId)
            });

            if (allChildrenInList) {
                parentsWithAllChildrenInList.push(parent);
            }
        });

        var childrenToRemove = _.flatten(parentsWithAllChildrenInList, "children");

        listOfItems = _.filter(listOfItems, function (item) {
            return !_.includes(childrenToRemove, item.id)
        });
        listOfItems = _.unique(listOfItems.concat(parentsWithAllChildrenInList));

        return listOfItems;
    };

    var valgteOrdener = ko.computed(function () {
        if (currentItems().length === 0) {
            return parents();
        }

        var selectedParents = _.map(currentItems(), function (item) {
            if (!item.parent) { //Hvis den er valgt, men ikke har noe parent, er den sin egen 'orden'
                return item.id;
            }
            return item.parent;
        });
        return _.filter(parents(), function (parent) {
            return _.includes(selectedParents, parent.id);
        });
    });

    var stateSelected = function (data, event) {
        settInnStateIListeOgOppdaterSelectedStates(data.id);
    };

    var settInnStateIListeOgOppdaterSelectedStates = function (state) {
        var character = state.split("_")[0];
        if (selectedCharacters[character] === state) {//State er allerede valgt, klikk på den skal fjerne valgt.
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
        charactersToShow: charactersToShow,
        implicitStates: implicitStates,

        activate: function () {
            var that = this;

            return http.get("./viewmodels/glansvinger.json").then(function (response) {
                var pairs = response.pairs.pair;
                var taxa = response.taxa.taxon;
                var dependencies = response.dependencies.dependency;
                var states = response.states.state;
                var characters = response.characters.character;


                _.forEach(taxa, function (taxon) {
                    taxon.stateIds = _(pairs).filter({taxon: taxon.id}).map('state').value();
                    taxon.html = ko.observable();
                    taxon.url = ko.observable(taxon.widget ? widgetPath + taxon.widget : null);


                    //if (taxon.widget != undefined) {
                    //    http.get(widgetPath + taxon.widget).then(function (response) {
                    //        console.log("resp", response)
                    //        taxon.html(response);
                    //    });
                    //}
                });

                _.forEach(characters, function (character) {
                    character.states = _.filter(states, {character: character.id});
                    character.conditions = _(dependencies).filter({dependant: character.id}).map('condition').flatten().value();

                    _.forEach(character.states, function (state) {
                        state.html = ko.observable();
                        state.url = ko.observable(state.widget ? widgetPath + state.widget: null);
                        //if (state.widget != undefined) {
                        //    http.get(widgetPath + state.widget).then(function (response) {
                        //        state.html(response);
                        //    });
                        //}
                    })
                });

                var parents = filterParents(taxa);
                _.forEach(parents, function (parent) {
                    parent.children = [];
                    _.forEach(taxa, function (item) {
                        if (item.parent === parent.id) {
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
