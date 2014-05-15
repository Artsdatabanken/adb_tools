define(function(require){
    var ko = require("knockout");
    var _ = require("underscore");
    var http = require('plugins/http');

    var search = ko.observable("");
    var items = ko.observableArray([]);
    var selectedRanks = ko.observableArray([]);

    var rankMapping = ko.observableArray([
        { text: "Art"           , value: "species"},
        { text: "Familie"       , value: "family"},
        { text: "Form"          , value: "form"},
        { text: "Infraklasse"   , value: "infraclass"},
        { text: "Infraorden"    , value: "infraorder"},
        { text: "Klasse"        , value: "class"},
        { text: "Kohort"        , value: "cohort"},
        { text: "Orden"         , value: "order"},
        { text: "Overfamilie"   , value: "superfamily"},
        { text: "Overklasse"    , value: "superclass"},
        { text: "Overorden"     , value: "superorder"},
        { text: "Rekke"         , value: "phylum"},
        { text: "Rike"          , value: "kingdom"},
        { text: "Seksjon"       , value: "section"},
        { text: "Slekt"         , value: "genus"},
        { text: "Tribus"        , value: "tribe"},
        { text: "Underart"      , value: "subspecies"},
        { text: "Underfamilie"  , value: "subfamily"},
        { text: "Underklasse"   , value: "subclass"},
        { text: "Underorden"    , value: "suborder"},
        { text: "Underrekke"    , value: "subphylum"},
        { text: "Underrike"     , value: "subkingdom"},
        { text: "Underslekt"    , value: "subgenus"},
        { text: "Undertribus"   , value: "subtribe"},
        { text: "Varietet"      , value: "variety"}
    ]);

    var gridViewModelSettings = {
        data: items,
        columns: [
            {
                headerText: "Vitenskapelignavn",
                isSortable: true,
                rowText: "scientificName",
                classList: "break-line"
            },
            {
                headerText: "Author",
                isSortable: true,
                rowText: "scientificNameAuthorship",
                classList: "break-line"
            },
            {
                headerText: "Rank",
                isSortable: true,
                rowText: function(item) {return _.where(rankMapping(), {value: item.taxonRank})[0].text},
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
        var hit = http.get("/Api/Taxon/ScientificName", {scientificName: search(), taxonRank: selectedRanks()}).then(function (response) {
            items(response);
        });
    });

    return {
        search: search,
        gridViewModelSettings: gridViewModelSettings,
        rankMapping: rankMapping,
        selectedRanks: selectedRanks,

        activate : function() {

        }
    }
})