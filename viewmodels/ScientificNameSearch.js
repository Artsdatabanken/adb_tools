define(function (require) {
    var system = require('durandal/system');
    var app = require('durandal/app');
    var ko = require('knockout');
    var _ = require('underscore');
    var http = require('plugins/http');
    var serializer = require('plugins/serializer');

    var input = ko.observable("");
    var resultFilter = ko.observable(true);
    var higherClassification = ko.observable();
    var items = ko.observableArray();
    var currentItems = ko.observableArray();

    var scientificNameLabel = function (sciName) {
        return sciName.scientificName + " " + sciName.scientificNameAuthorship + ((sciName.acceptedNameUsage) ? (" >>> " + sciName.acceptedNameUsage.scientificName + " " + sciName.acceptedNameUsage.scientificNameAuthorship) : "");
    }

    var pagerViewModelSettings = {
        data: currentItems,
        pageSize: 25,
        currentPageIndex: ko.observable(0)
    };

    var parseInputItems = function () {
        var rows = input().split("\n");
        
        var readItems = 
            _.filter(rows, function (row) {
                return row;
            }).map(
                function (row) {
                    return {
                        'ScientificName': ko.observable(row)
                    };
                }
            ).map(
                function (item) {
                    item.result = ko.observableArray();
                    item.selectedResult = ko.observable();
                    item.message = ko.observable();
                    item.suggest = ko.observableArray();
                    item.html = ko.observable();

                    item.resultCompute = ko.computed(function () {
                        http.get("/Api/Taxon/ScientificName", { scientificName: item.ScientificName(), higherClassificationID: (higherClassification()) ? higherClassification().scientificNameID : "" }).then(function (response) {
                            item.result(response);
                            item.selectedResult("");

                            if (item.result().length == 1) {
                                item.selectedResult(item.result()[0]);
                            }
                            else if (item.result().length == 0)
                            {
                                http.get("/Api/Taxon/ScientificName/Suggest", { scientificName: item.ScientificName() }).then(function (response) {
                                    if (_.some(response, item.ScientificName ))
                                    {
                                        item.message("Navnet finnes, men ikke innenfor valgte søkekriterier");
                                    }
                                    else {
                                        item.suggest(response);
                                    } 
                                });
                            }
                        });
                    }, item);

                    item.htmlCompute = ko.computed(function () {
                        if (item.selectedResult() == undefined) {
                            item.html('');
                        }
                        else {
                            http.get("/Databank/ScientificName/" + item.selectedResult().scientificNameID + "?Template=ListGroupItem").then(function (response) {
                                item.html(response);
                            });
                        }
                    }, item);

                    return item;
                }
            );

        items(readItems);
    }

    var filteredItems = ko.computed(function () {
        pagerViewModelSettings.currentPageIndex(0);

        var foundItems =
            _.filter(items(),
                function (item) {
                    return (resultFilter()) ? (item.selectedResult() == undefined) : true;
                }
            );

        currentItems(foundItems);
    });

    return {
        pagerViewModelSettings: pagerViewModelSettings,
        input: input,
        higherClassification: higherClassification,
        parseInputItems: parseInputItems,
        scientificNameLabel: scientificNameLabel,
        resultFilter: resultFilter,

        activate: function (scientificNameID, queryString) {
            if (queryString != undefined && queryString.q != undefined) {
                input(queryString.q);
            }

            console.log(queryString);

            if (scientificNameID)
            {
                http.get("/Api/Taxon/ScientificName/" + scientificNameID).then(function (response) {
                    higherClassification(response);
                });
            }
        }
    };
});