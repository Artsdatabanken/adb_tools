define(function(require){
    var ko = require("knockout");
    var _ = require("underscore");
    var http = require('plugins/http');

    var search = ko.observable("");
    var items = ko.observableArray([]);

    var gridViewModelSettings = {
        data: items,
        columns: [
            {
                headerText: "Vitenskapelignavn",
                isSortable: true,
                rowText: function(item) {
                    return _.map(item.scientificNames,
                            function(name){
                                return name.scientificName
                            }).join("\n") },
                classList: "break-line"
            },
            {
                headerText: "Author",
                isSortable: true,
                rowText: function(item) {
                    return _.map(item.scientificNames,
                            function(name){
                                return name.scientificNameAuthorship
                            }).join("\n") },
                classList: "break-line"
            },
            {
                headerText: "Rank",
                isSortable: true,
                rowText: function(item) {
                    return _.map(item.scientificNames,
                            function(name){
                                return name.taxonRank
                            }).join("\n") },
                classList: "break-line"
            },
        ],
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

    ko.computed(function(){
        if(search().length < 3){ return; }

        var hit = http.get("/Api/Taxon/", {scientificName: search()}).then(function (response) {
            console.log(response);
            items(response);
        });
    });

    return {
        search: search,
        gridViewModelSettings: gridViewModelSettings,

        activate : function() {

        }
    }
})