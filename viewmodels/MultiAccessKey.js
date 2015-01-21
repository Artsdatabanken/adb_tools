define(['durandal/system', 'durandal/app', 'knockout', 'underscore', 'plugins/http'], function (system, app, ko, _, http) {

    var keyContent = ko.observable();
    var items = ko.observableArray();
    var characters = ko.observableArray();
    var scoring = ko.observableArray();
    var currentItems = ko.observableArray();

    var pagerViewModelSettings = {
        data: currentItems,
        pageSize: ko.observable(25),
        currentPageIndex: ko.observable(0)
    };

    var filteredItems = ko.computed(function () {

        pagerViewModelSettings.currentPageIndex(0);

        var selectedStates =
            _.filter(_.flatten(characters(), "Content"), function (state) { return state.selected() });

        if (selectedStates.length > 0)
        {
            var selectedStateIds = _.pluck(selectedStates, "Id");

            var selectedStateItems =
                _.pluck(
                    _.filter(scoring(), function (score) {
                        return _.intersection(score.state, selectedStateIds).length > 0;
                    }),
                    "items"
                );

            var selectedItems =
                _.intersection.apply(_, selectedStateItems);

            var foundItems =
                _.filter(items(),
                    function (item) {
                        var inter = _.intersection(_.pluck(item.Content, "Id"), selectedItems);
                        return inter.length > 0;
                    })

            currentItems(foundItems);
        }

        else {
            currentItems(items());
        }


    });

    return {
        pagerViewModelSettings: pagerViewModelSettings,
        items: items,
        characters: characters,
        scoring: scoring,
        currentItems: currentItems,
        keyContent: keyContent,

        activate: function (contentID) {
            if (contentID)
            {
                http.get("/Api/Content/" + contentID).then(function (response) {

                    items(
                        _.flatten(
                            _.filter(response.References, { "Type": "collection" }),
                            "References"
                        )
                    );

                    characters(
                        _.map(
                            _.flatten(
                                _.filter(response.References, { "Type": "description" }),
                                "Content"
                            ),
                            function (character) {
                                _.each(character.Content, function (state) {
                                    state.selected = ko.observable(false);
                                });

                                return character;
                            }
                        )

                    );

                    scoring(
                        _.map(response.Tuples, function (tuple) {
                            return {
                                selected: ko.observable(false),
                                state: _.pluck(tuple.References, "Id"),
                                items: _.pluck(_.flatten(tuple.Tuples, "References"), "Id")
                            }
                        })
                    );
                });

            }
        }
    };
});