define(['durandal/system', 'durandal/app', 'knockout', 'lodash', 'plugins/http'], function (system, app, ko, _, http) {

    var input = ko.observable("");
    var output = ko.observable("");
    var resultFilter = ko.observableArray(["exact", "multiple", "none"]);
    var higherClassification = ko.observable();
    var items = ko.observableArray();
    var currentItems = ko.observableArray();

    var BASEURL = "http://data.artsdatabanken.no/";
    var API = BASEURL + "Api/Taxon";

    var template = ko.observableArray([""]);

    var pagerViewModelSettings = {
        data: currentItems,
        pageSize: ko.observable(25),
        currentPageIndex: ko.observable(0)
    };

    var parseInputItems = function () {
        var rows = input().split("\n");
        
        // Dispose all current subscriptions
        _.filter(items(), function (item) {
            return item.subscriptions;
        }).forEach(function (item) {
            _.each(item.subscriptions, function (sub) { sub.dispose(); })
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
                    item.Taxon = ko.observable();
                    item.message = ko.observable();
                    item.suggest = ko.observableArray();
                    item.html = ko.observable();

                    item.processed = ko.observable(false);

                    return item;
                }
            ).map(
                function (item, index) {

                    item.subscriptions = [

                        // Changes on ScientificName triggers a call to API
                        item.ScientificName.subscribe(function (newValue) {

                            if (isNaN(item.ScientificName())) {

                                http.get(API + "/ScientificName/", { scientificName: item.ScientificName(), higherClassificationID: (higherClassification()) ? higherClassification().scientificNameID : "" }).then(function (response) {
                                    item.result(response);
                                    item.selectedResult("");

                                    // Call API for suggestions if no result.
                                    if (item.result().length == 0) {
                                        http.get(API + "/ScientificName/Suggest", { scientificName: item.ScientificName() }).then(function (response) {
                                            // If suggestions contain the given name, other criteria excludes it and the suggestion should not be shown
                                            if (_.includes(response, item.ScientificName())) {
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

                            }

                            else {
                                // Input is numeric, try to access name directly with scientificNameID from API
                                http.get(API + "/ScientificName/" + item.ScientificName()).then(function (response) {
                                    if (_.isPlainObject(response)) {
                                        item.result([response]);
                                        item.selectedResult(item.result()[0]);
                                    }

                                    item.processed(true);
                                });

                            }
                        }),

                        // Changes on selectedResult triggers reading of corresponding Taxon
                        item.selectedResult.subscribe(function (newValue) {
                            if (!newValue) {
                                item.Taxon('');
                            }
                            else {
                                http.get(API + "/" + newValue.taxonID).then(function (response) {
                                    item.Taxon(response);
                                });
                            }
                        }),

                        // Changes on selectedResult triggers reading of corresponding HTML for selected name when template() is set
                        item.selectedResult.subscribe(function (newValue) {
                            if (!newValue || !template()) {
                                item.html('');
                            }
                            else {
                                http.get(BASEURL + "/Databank/ScientificName/" + newValue.scientificNameID + (template() ? ("?Template=" + template()) : "")).then(function (response) {
                                    item.html(response);
                                });
                            }
                        }),

                        // Changes on template() triggers reading of HTML for all items where selectedResult is set
                        template.subscribe(function (newValue) {
                            if (!item.selectedResult() || !newValue) {
                                item.html('');
                            }
                            else {
                                item.processed(false);

                                _.delay(function (item) {
                                    http.get(BASEURL + "/Databank/ScientificName/" + item.selectedResult().scientificNameID + (template() ? ("?Template=" + template()) : "")).then(function (response) {
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
                    if (_.includes(resultFilter(), "exact") && item.result().length == 1)
                        return true;
                    if (_.includes(resultFilter(), "multiple") && item.result().length > 1)
                        return true;
                    if (_.includes(resultFilter(), "none") && item.result().length == 0)
                        return true;
                    else 
                        return false;
                }
            );

        currentItems(foundItems);
    });

    filteredItems.extend({ rateLimit: 500 });

    var generateOutput = function(params)
    {
        var outputContent = "";

        ["Input", "", "taxonID", "scientificNameID", "scientificName", "scientificNameAuthorship", "taxonRank", "acceptedNameUsageID", "acceptedNameUsage", "kingdom", "phylum", "class", "order", "family", "genus", "subgenus", "specificEpithet", "infraspecificEpithet", "higherClassification", "vernacularName (nb)", "vernacularName (nn)", "dynamicProperty"].forEach(function (value) {
            outputContent += value + "\t";
        });

        items().forEach(function (item, index) {
            outputContent += "\n";
            outputContent += item.inputRow + "\t";
            outputContent += ((item.inputRow != item.ScientificName()) ? item.ScientificName() : ("")) + "\t";

            if (item.selectedResult())
            {
                var s = item.selectedResult();
                var exportValues = [
                        s.taxonID,
                        s.scientificNameID,
                        s.scientificName,
                        s.scientificNameAuthorship,
                        s.taxonRank,
                        (s.acceptedNameUsage == undefined) ? "" : s.acceptedNameUsage.scientificNameID,
                        (s.acceptedNameUsage == undefined) ? "" : s.acceptedNameUsage.scientificName,
                        (_.find(s.higherClassification, { "taxonRank": "kingdom" })) ? _.find(s.higherClassification, { "taxonRank": "kingdom" }).scientificName : "",
                        (_.find(s.higherClassification, { "taxonRank": "phylum" })) ? _.find(s.higherClassification, { "taxonRank": "phylum" }).scientificName : "",
                        (_.find(s.higherClassification, { "taxonRank": "class" })) ? _.find(s.higherClassification, { "taxonRank": "class" }).scientificName : "",
                        (_.find(s.higherClassification, { "taxonRank": "order" })) ? _.find(s.higherClassification, { "taxonRank": "order" }).scientificName : "",
                        (_.find(s.higherClassification, { "taxonRank": "family" })) ? _.find(s.higherClassification, { "taxonRank": "family" }).scientificName : "",
                        (_.find(s.higherClassification, { "taxonRank": "genus" })) ? _.find(s.higherClassification, { "taxonRank": "genus" }).scientificName : "",
                        (_.find(s.higherClassification, { "taxonRank": "subgenus" })) ? _.find(s.higherClassification, { "taxonRank": "subgenus" }).scientificName : "",
                        (_.find(s.higherClassification, { "taxonRank": "specificEpithet" })) ? _.find(s.higherClassification, { "taxonRank": "specificEpithet" }).scientificName : "",
                        (_.find(s.higherClassification, { "taxonRank": "infraspecificEpithet" })) ? _.find(s.higherClassification, { "taxonRank": "infraspecificEpithet" }).scientificName : "",
                        _.map(s.higherClassification, function (hi) { return hi.scientificName }).join(" "),
                        (_.find(item.Taxon().vernacularNames, { "nomenclaturalStatus": "preferred", "language": "nb-NO" })) ? _.find(item.Taxon().vernacularNames, { "nomenclaturalStatus": "preferred", "language": "nb-NO" }).vernacularName : "",
                        (_.find(item.Taxon().vernacularNames, { "nomenclaturalStatus": "preferred", "language": "nn-NO" })) ? _.find(item.Taxon().vernacularNames, { "nomenclaturalStatus": "preferred", "language": "nn-NO" }).vernacularName : ""
                ];

                _.each(exportValues, function (value) {
                    outputContent += value + "\t";
                });

                if (params != undefined && params.dynamicProperties) {
                    var dynamicProperties = _.union(item.Taxon().dynamicProperties, item.selectedResult().dynamicProperties)
                    if (_.isArray(params.dynamicProperties)) {
                        dynamicProperties = _.filter(dynamicProperties, function (prop) { return _.includes(params.dynamicProperties, prop.Name) });
                    }
                    _.each(dynamicProperties, function (property, index) {
                        if (index > 0)
                        {
                            outputContent += "\n";
                            _.times(exportValues.length + 2, function (value) {
                                outputContent += "\t";
                            });
                        }
                        outputContent += property.Name + "\t" + property.Value;

                        _.each(property.Properties, function (subProperty) {
                            outputContent += "\t" + subProperty.Name + "\t" + subProperty.Value;
                        })
                    })
                }
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
        resultFilter: resultFilter,
        template: template,
        generateOutput: generateOutput,

        activate: function (scientificNameID, queryString) {
            if (queryString != undefined && queryString.q != undefined) {
                input(queryString.q);
            }

            if (scientificNameID)
            {
                http.get(API + "/ScientificName/" + scientificNameID).then(function (response) {
                    higherClassification(response);
                });
            }
        }
    };
});