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
    var gridViewModelSettings = {
        data: currentItems,
        columns: [
            { headerText: "Vitenskapelignavn", isSortable: true, rowText: "scientificName", href: function (item) { return "http://www.artsportalen.artsdatabanken.no/#/Rodliste2010/Vurdering/" + item.scientificName.replace(" ", "_") + "/" + item.rodlistevurderingID; } },
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

                items.sort(function (a, b) {
                    return a[column.rowText] < b[column.rowText] ? -1 : 1;
                });
            } else {
                column.sortAsc = false;

                items.sort(function (a, b) {
                    return a[column.rowText] > b[column.rowText] ? -1 : 1;
                });
            }
        }
    };
    var filteredItems = ko.computed(function() {
        gridViewModelSettings.currentPageIndex(0);
        if (selectedKategorier().length === 0 && selectedArtsgrupper().length === 0 && selectedHovedhabitater().length === 0) {
            currentItems(items());
        } else {
            currentItems(ko.utils.arrayFilter(items(), function(item) {
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
            }));
        }
    });

    return {
        gridViewModelSettings: gridViewModelSettings,
        kategorier: kategorier,
        artsgrupper: artsgrupper,
        hovedhabitater: hovedhabitater,
        selectedKategorier: selectedKategorier,
        selectedArtsgrupper: selectedArtsgrupper,
        selectedHovedhabitater: selectedHovedhabitater,

        activate: function () {
            var that = this;

            return http.get("/App/viewmodels/ansvarsarter-data.json").then(function (response) {
                items(response);
                currentItems(response);
                var unsortedKategorier = $.unique(response.map(function (d) {return d.kategori.substring(0,2);}))//EN0 skal bli EN
                that.kategorier(_.sortBy(unsortedKategorier, function(item){return kategoriRekkefølge.indexOf(item)}, that));

                that.artsgrupper($.unique(response.map(function (d) {return d.ekspertgruppe;}).sort()));

                var habitatlister = response.map(function(d) {return d.hovedhabitat});
                var flattened = habitatlister.reduce(function(acc, list){return acc.concat(list)}, []);
                that.hovedhabitater($.unique(flattened).sort());
            });
        },
    };
});