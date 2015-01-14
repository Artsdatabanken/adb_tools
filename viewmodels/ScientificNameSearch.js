define(function (require) {
    var system = require('durandal/system');
    var app = require('durandal/app');
    var ko = require('knockout');
    var _ = require('underscore');
    var http = require('plugins/http');
    var serializer = require('plugins/serializer');

    var input = ko.observable("");
    var output = ko.observable("");
    var resultFilter = ko.observableArray(["exact", "multiple", "none"]);
    var higherClassification = ko.observable();
    var items = ko.observableArray();
    var currentItems = ko.observableArray();

    var template = ko.observableArray([""]);

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
                    var item = {};

                    item.inputRow = row.replace(/\s+/g, ' ').trim();
                    item.ScientificName = ko.observable("");
                    item.result = ko.observableArray();
                    item.selectedResult = ko.observable("");
                    item.message = ko.observable();
                    item.suggest = ko.observableArray();
                    item.html = ko.observable();

                    return item;
                }
            ).map(
                function (item) {

                    item.ScientificName.subscribe(function (newValue) {
                        http.get("/Api/Taxon/ScientificName", { scientificName: item.ScientificName(), higherClassificationID: (higherClassification()) ? higherClassification().scientificNameID : "" }).then(function (response) {
                            item.result(response);
                            item.selectedResult("");

                            if (item.result().length == 1) {
                                item.selectedResult(item.result()[0]);
                            }
                            else if (item.result().length == 0)
                            {
                                http.get("/Api/Taxon/ScientificName/Suggest", { scientificName: item.ScientificName() }).then(function (response) {
                                    if (_.contains(response, item.ScientificName() ))
                                    {
                                        item.message("Navnet finnes, men ikke innenfor valgte søkekriterier");
                                        item.suggest("");
                                    }
                                    else {
                                        item.suggest(response);
                                    } 
                                });
                            }
                        });
                    });

                    item.selectedResult.subscribe(function (newValue) {
                        if (newValue == "" || !template()) {
                            item.html('');
                        }
                        else {
                            http.get("/Databank/ScientificName/" + newValue.scientificNameID + (template() ? ("?Template=" + template()) : "")).then(function (response) {
                                item.html(response);
                            });
                        }
                    });

                    template.subscribe(function (newValue) {
                        if (item.selectedResult() == "" || newValue == "") {
                            item.html('');
                        }
                        else {
                            http.get("/Databank/ScientificName/" + item.selectedResult().scientificNameID + (template() ? ("?Template=" + template()) : "")).then(function (response) {
                                item.html(response);
                            });
                        }
                    });

                    return item;
                }
            ).map(
                function (item) {
                    item.ScientificName(item.inputRow);

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
                    if (_.contains(resultFilter(), "exact") && item.result().length == 1)
                        return true;
                    if (_.contains(resultFilter(), "multiple") && item.result().length > 1)
                        return true;
                    if (_.contains(resultFilter(), "none") && item.result().length == 0)
                        return true;
                    else 
                        return false;
                }
            );

        currentItems(foundItems);
    });

    var generateOutput = function()
    {
        var outputContent = "";

        ["taxonID", "scientificNameID", "scientificName", "scientificNameAuthorship", "acceptedNameUsageID", "acceptedNameUsage", "kingdom", "higherClassification"].forEach(function (value) {
            outputContent += value;
            outputContent += "\t";
        });

        items().forEach(function (item, index) {
            outputContent += "\n";

            if (item.selectedResult() != undefined)
            {
                var s = item.selectedResult();
                [   s.taxonID,
                    s.scientificNameID,
                    s.scientificName,
                    s.scientificNameAuthorship,
                    (s.acceptedNameUsage == undefined) ? "" : s.acceptedNameUsage.scientificNameID,
                    (s.acceptedNameUsage == undefined) ? "" : s.acceptedNameUsage.scientificName,
                    (_.find(s.higherClassification, { "taxonRank": "kingdom" })) ? _.find(s.higherClassification, { "taxonRank": "kingdom" }).scientificName : "",
                    _.map(s.higherClassification, function (hi) { return hi.scientificName }).join(" ")

                ].forEach(function (value) {
                    outputContent += value;
                    outputContent += "\t";
                });
            }
        });

        output(outputContent);
    }

    return {
        pagerViewModelSettings: pagerViewModelSettings,
        input: input,
        output: output,
        items: items,
        currentItems: currentItems,
        higherClassification: higherClassification,
        parseInputItems: parseInputItems,
        scientificNameLabel: scientificNameLabel,
        resultFilter: resultFilter,
        template: template,
        generateOutput: generateOutput,

        activate: function (scientificNameID, queryString) {
            if (queryString != undefined && queryString.q != undefined) {
                input(queryString.q);
            }

            if (scientificNameID)
            {
                http.get("/Api/Taxon/ScientificName/" + scientificNameID).then(function (response) {
                    higherClassification(response);
                });
            }
        }
    };
});