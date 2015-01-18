define(['durandal/system', 'durandal/app', 'knockout', 'underscore', 'plugins/http'], function (system, app, ko, _, http) {

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
        pageSize: ko.observable(25),
        currentPageIndex: ko.observable(0)
    };

    var parseInputItems = function () {
        var rows = input().split("\n");
        
        // Dispose all current subscriptions
        _.filter(items(), function (item) {
            return item.subsciptions;
        }).forEach(function (item) {
            _.each(item.subsciptions, function (sub) { sub.dispose(); })
        });

        items.removeAll();

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

                    item.processed = ko.observable(false);

                    return item;
                }
            ).map(
                function (item, index) {

                    item.subsciptions = [

                        // Changes on ScientificName triggers a call to API
                        item.ScientificName.subscribe(function (newValue) {
                            http.get("/Api/Taxon/ScientificName", { scientificName: item.ScientificName(), higherClassificationID: (higherClassification()) ? higherClassification().scientificNameID : "" }).then(function (response) {
                                item.result(response);
                                item.selectedResult("");

                                // Call API for suggestions if no result.
                                if (item.result().length == 0)
                                {
                                    http.get("/Api/Taxon/ScientificName/Suggest", { scientificName: item.ScientificName() }).then(function (response) {
                                        // If suggestions contain the given name, other criteria excludes it and the suggestion should not be shown
                                        if (_.contains(response, item.ScientificName() ))
                                        {
                                            item.message("Navnet finnes, men ikke innenfor valgte søkekriterier");
                                            item.suggest("");
                                        }
                                        else {
                                            item.suggest(response);
                                        }

                                        item.processed(true);
                                    });
                                }
                                else {
                                    // If single result, set selectedResult
                                    if (item.result().length == 1) {
                                        item.selectedResult(item.result()[0]);
                                    }

                                    item.processed(true);
                                }
                            });
                        }),

                        // Changes on selectedResult triggers reading of corresponding HTML for selected name when template() is set
                        item.selectedResult.subscribe(function (newValue) {
                            if (newValue == "" || !template()) {
                                item.html('');
                            }
                            else {
                                http.get("/Databank/ScientificName/" + newValue.scientificNameID + (template() ? ("?Template=" + template()) : "")).then(function (response) {
                                    item.html(response);
                                });
                            }
                        }),

                        // Changes on template() triggers reading of HTML for all items where selectedResult is set
                        template.subscribe(function (newValue) {
                            if (item.selectedResult() == "" || newValue == "") {
                                item.html('');
                            }
                            else {
                                item.processed(false);

                                _.delay(function (item) {
                                    http.get("/Databank/ScientificName/" + item.selectedResult().scientificNameID + (template() ? ("?Template=" + template()) : "")).then(function (response) {
                                        item.html(response);
                                        item.processed(true);
                                    });
                                }, index * 50, item);
                            }
                        })
                    ]

                    return item;
                }
            ).map(
                function (item, index) {
                    // Set each ScientificName with a delay, to limit the number of concurrent requests to the server
                    _.delay(function (item) { item.ScientificName(item.inputRow); }, index * 50, item);

                    return item;
                }
            );

        items(readItems);
    }

    // Calculate values for progress bar
    var progress = ko.computed(function () {

        var processedItems =
            _.filter(items(),
                function (item) {
                    return item.processed();
                }
            );

        return {
            processedItems: processedItems.length,
            totalItems: items().length,
            progress: Math.ceil((processedItems.length * 100) / items().length)
        };
    });

    progress.extend({ rateLimit: 500 });

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

    filteredItems.extend({ rateLimit: 500 });

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
        progress: progress,
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