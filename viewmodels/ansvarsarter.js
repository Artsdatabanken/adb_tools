define(function (require) {
    var system = require('durandal/system');
    var app = require('durandal/app');
    var ko = require('knockout');
    var http = require('plugins/http');
    var serializer = require('plugins/serializer');
    var $ = require('jquery');
    var _ = require('underscore');

    var kategoriRekkefølge = ["RE", "CR", "EN", "VU", "NT", "DD", "LC", "NA", "NE"];

    var items = ko.observableArray();
    var currentItems = ko.observableArray();
    var kategorier = ko.observableArray();
    var artsgrupper = ko.observableArray();
    var hovedhabitater = ko.observableArray();
    var selectedKategorier = ko.observableArray([]);
    var selectedArtsgrupper = ko.observableArray([]);
    var selectedHovedhabitater = ko.observableArray([]);
    var searchTerms = ko.observable("");

    var gridViewModelSettings = {
        data: currentItems,
        columns: [
            { headerText: "Vitenskapelignavn", isSortable: true, rowText: "scientificName", classList: "scientific-name", href: function (item) { return "http://www.artsportalen.artsdatabanken.no/#/Rodliste2010/Vurdering/" + item.scientificName.replace(" ", "_") + "/" + item.rodlistevurderingID; } },
            { headerText: "Populærnavn", isSortable: true, rowText: "vernacularName" },
            { headerText: "Kategori", isSortable: true, rowText: "kategori" },
            { headerText: "Hovedhabitat", rowText: function (item) { return item.hovedhabitat.join(", ");  } },
            { headerText: "Artsgruppe", isSortable: true, rowText: "ekspertgruppe" }
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
    var filteredItems = ko.computed(function() {
        gridViewModelSettings.currentPageIndex(0);
        var foundItems;
        if (selectedKategorier().length === 0 && selectedArtsgrupper().length === 0 && selectedHovedhabitater().length === 0) {
            foundItems = items();
        } else {
            foundItems = ko.utils.arrayFilter(items(), function(item) {
                            var kategoriSelected = true;
                            if(selectedKategorier().length !== 0){
                                kategoriSelected = selectedKategorier().indexOf(item.kategori.substring(0,2)) !== -1;
                            }
                            var artsgruppeSelected = true;
                            if(selectedArtsgrupper().length !== 0){
                                artsgruppeSelected = selectedArtsgrupper().indexOf(item.ekspertgruppe) !== -1;
                            }
                            var hovedhabitatSelected = true;
                            if(selectedHovedhabitater().length !== 0){
                                hovedhabitatSelected = !_.isEmpty(_.intersection(item.hovedhabitat, selectedHovedhabitater()));
                            }
                            return artsgruppeSelected && kategoriSelected && hovedhabitatSelected;
            });
        }

        if(searchTerms().length !== 0){
            foundItems = filterSearch(foundItems);
        }

        currentItems(foundItems);
    });

    var resetFilters = function() {
        selectedKategorier([]);
        selectedArtsgrupper([]);
        selectedHovedhabitater([]);
        searchTerms("");
    };

    var filterSearch = function(listOfItems) {
        var terms = searchTerms().split(/\s+/);

        return _.filter(listOfItems, function(item){
            return _.all(terms, function(term) {
                term = term.toLowerCase();
                if(item.kategori.toLowerCase().indexOf(term) === 0) { return true;}
                if(item.ekspertgruppe.toLowerCase().indexOf(term) === 0) { return true; }
                if(item.scientificName.toLowerCase().indexOf(term) !== -1) { return true; }
                if(item.vernacularName.toLowerCase().indexOf(term) === 0) { return true; }
                return _.any(item.hovedhabitat, function(habitat){
                    if(habitat.toLowerCase().indexOf(term) === 0) { return true; }
                });
            });
        });
    };

    return {
        gridViewModelSettings: gridViewModelSettings,
        kategorier: kategorier,
        artsgrupper: artsgrupper,
        hovedhabitater: hovedhabitater,
        selectedKategorier: selectedKategorier,
        selectedArtsgrupper: selectedArtsgrupper,
        selectedHovedhabitater: selectedHovedhabitater,
        searchTerms: searchTerms,
        resetFilters: resetFilters,
        currentItems: currentItems,

        activate: function () {
            var that = this;

            return http.get("/App/viewmodels/ansvarsarter-data.json").then(function (response) {
                items(response);
                currentItems(response);

                var unsortedKategorier = _(response).map(function (d) {return d.kategori.substring(0,2);}).unique();//EN0 skal bli EN
                var sortedKategorier = unsortedKategorier.sortBy(function(item){return kategoriRekkefølge.indexOf(item);}).value();
                that.kategorier(sortedKategorier);

                var grupper = _(response).map("ekspertgruppe").unique().sort().value();
                that.artsgrupper(grupper);

                var habitater = _(response).flatten("hovedhabitat").unique().sort().value();
                that.hovedhabitater(habitater);
            });
        },
    };
});
