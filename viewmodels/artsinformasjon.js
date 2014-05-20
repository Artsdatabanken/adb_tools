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
            return {headerText: header, isSortable: true, rowText: header}
        });
        columns(headerColumns);
    };

    var getAdditionalInfo = function() {
        var promises = [];
        var secondLevelPromises = [];
        var newItems = [];

        _.forEach(parsedItems, function(item){
            newItems.push(item);
            promises.push(http.get("Api/Taxon/ScientificName", {scientificName: item.Vitenskapelignavn})
                .then(function(response){
                    if(response.length === 0){
                        secondLevelPromises.push(http.get("Api/Taxon/ScientificName/Suggest", {scientificName: item.Vitenskapelignavn})
                            .then(function(response){
                                item.Forslag = response.join(", ");
                            }));
                    }
                })
            );

        });

        $.when.apply(undefined, promises).then(function() {
            $.when.apply(undefined, secondLevelPromises).then(function() {
                items(newItems);
            });
        });
    };

    return {
        inputText: inputText,
        parseInput: parseInput,
        gridViewModelSettings: gridViewModelSettings,

        activate : function() {

        }
    };
});
