define(function(require) {
    var ko = require('knockout');
    var _ = require('underscore');

    var headerNames = ["scientificname", "vitenskapelignavn"];
    var headers = ko.observableArray([]);
    var inputText = ko.observable("");
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

        items(_.map(_.rest(lines), function(line){
            var item = {};
            var splitLine = line.split(/\t/)
            _.each(headers(), function(header, index){
                item[header] = splitLine[index];
            });
            return item;
        }));

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
        promises.push( http.get("Api/Taxon/ScientificName", {scientificName: "sad"}).then(function(){console.log('heia');}));
        promises.push( http.get("Api/Taxon/ScientificName", {scientificName: "sad"}).then(function(){console.log('heia2');}));
        promises.push( http.get("Api/Taxon/ScientificName", {scientificName: "sad"}).then(function(){console.log('heia3');}));

        $.when.apply(undefined, promises).then(function() {console.log('all done');});
    };

    return {
        inputText: inputText,
        gridViewModelSettings: gridViewModelSettings,

        activate : function() {

        }
    };
});
