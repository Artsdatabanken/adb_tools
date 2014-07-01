define(function(require) {
    var ko = require('knockout');
    var _ = require('underscore');
    var http = require('plugins/http')

    var headerNames = ["scientificname", "vitenskapelignavn"];
    var headers = ko.observableArray([]);
    var inputText = ko.observable("");
    var parsedItems;
    var items = ko.observableArray([]);
    var columns = ko.observableArray([]);
    var typeaheadSelectedValue = ko.observable({});
    var typeaheadTextValue = ko.observable();
    var searchName = ko.observable();
    var searchId = "";

    ko.computed(function() {
        if( _.isEmpty(typeaheadTextValue()) || typeaheadSelectedValue().ScientificName !== typeaheadTextValue()) {
            searchName("Du søker nå i alle arter");
            searchId = "";
        }
        else {
            searchName("Du søker nå fra og med " + typeaheadSelectedValue().ScientificName);
            searchId = typeaheadSelectedValue().ScientificNameID;
        }
    });

    var typeaheadSource = {
        source: function() {
                    var currentSearch;
                    return function(query, callback) {
                        if(currentSearch) { currentSearch.abort(); }
                        currentSearch = http.get("/Api/Taxon/ScientificName/Lookup", {scientificName: query});
                        currentSearch.then(function (response) {
                            callback(response);
                        });
                        return currentSearch;
                    }
                }(),
        displayKey: function(item) { return item.ScientificName + " <span class='text-muted'>" + item.ScientificNameAuthorship + "</span>"; },
        valueKey: "ScientificName"
    };

    var typeaheadOptions = {
        hint: false,
        minLength: 2
    };

    var gridViewModelSettings = {
        data: items,
        columns: columns,
        pageSize: 25,
        currentPageIndex: ko.observable(0),
        sortBy: function (column) {
            if (!column.sortAsc) {
                column.sortAsc = true;
                items(_.sortBy(items(), column.rowText));
            } else {
                column.sortAsc = false;
                items(_(items()).sortBy(column.rowText).reverse().value());
            }
        }
    };

    var parseInput = function (){
        if(inputText().length === 0) { return; }
        items([]);

        var lines = inputText().split("\n");
        headers(lines[0].split(/\t/));
        headers.push("Forslag");
        createColumnHeaders();

        parsedItems = _.map(_.rest(lines), function(line){
            var item = {};
            var splitLine = line.split(/\t/)
            _.each(headers(), function(header, index){
                item[header] = splitLine[index];
            });
            return item;
        });

        getAdditionalInfo();
    };

    var createColumnHeaders = function(){
        var headerColumns = _.map(headers(), function(header){
            return {
                        headerText: header,
                        isSortable: true,
                        rowText: function(item) {
                                if(typeof item[header] === "function") return item[header]();
                                return item[header];
                        },
                        skipCsv: header === "Forslag"
                    }
        });
        columns(headerColumns);
    };

    var getAdditionalInfo = function() {
        var promises = [];
        var secondLevelPromises = [];
        var newItems = [];

        _.forEach(parsedItems, function(item){
            newItems.push(item);
            item.Id = ko.observable();
            item.ScientificName = ko.observable();
            console.log(searchId);
            promises.push(http.get("Api/Taxon/ScientificName", {scientificName: item.Vitenskapelignavn.trim(), higherClassificationID: searchId})
                .then(function(response) {
                    if(response.length === 0){
                        secondLevelPromises.push(http.get("Api/Taxon/ScientificName/Suggest", {scientificName: item.Vitenskapelignavn})
                            .then(function(response){
                                item.Forslag = ko.observableArray(response);
                                item.ScientificName = ko.observable(item.ScientificName);
                            }));
                    } else {
                        item.ScientificName(response[0].scientificName);
                        item.Id(response[0].scientificNameID);
                    }
                })
            );
        });

        $.when.apply(undefined, promises).then(function() {
            $.when.apply(undefined, secondLevelPromises).then(function() {
                headers.push("Id");
                headers.push("ScientificName");
                createColumnHeaders();
                items(newItems);
            });
        });
    };

    var parseFixedTable = function() {
        _.forEach(items(), function(item){
            if (typeof item.ScientificName !== "function") { return; } //Skip items that had a hit the first time around

            http.get("Api/Taxon/ScientificName", { scientificName: item.ScientificName.trim(), higherClassificationID: searchId })
                .then(function(response) {
                    if(response.length > 0) {
                        item.Forslag(null);
                        item.ScientificName(response[0].scientificName);
                        item.Id(response[0].scientificNameID);
                    }
                });
        });
    };

    return {
        inputText: inputText,
        parseInput: parseInput,
        parseFixedTable: parseFixedTable,
        typeaheadSelectedValue: typeaheadSelectedValue,
        typeaheadSource: typeaheadSource,
        typeaheadOptions: typeaheadOptions,
        typeaheadTextValue: typeaheadTextValue,
        searchName: searchName,
        gridViewModelSettings: gridViewModelSettings,
    };
});
