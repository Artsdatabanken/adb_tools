﻿define(function (require) {
    var ko = require('knockout');

    var SimpleGrid = function () {};

    SimpleGrid.prototype.getColumnsForScaffolding = function (data) {
        if ((typeof data.length !== 'number') || data.length === 0) {
            return [];
        }
        var columns = [];
        for (var propertyName in data[0]) {
            columns.push({ headerText: propertyName, rowText: propertyName });
        }
        return columns;
    };

    SimpleGrid.prototype.showDownload = function(){
        return Modernizr.adownload;
    }

    SimpleGrid.prototype.downloadCsv = function() {
        if(this.data().length === 0) { return; }

        var csvContent = "data:text/csv;charset=utf-8,";

        var texts = _.map(this.columns, function(item) { return item.rowText });
        csvContent += _.map(this.columns, function(item) { return item.headerText }).join(";") + "\n";

        this.data().forEach(function(object, index){
            texts.forEach(function(text){
                csvContent += typeof text === 'function' ? text(object) : object[text];
                csvContent += ";";
            });
            csvContent += "\n";
        });
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "data.csv");

        link.click();
    };

    SimpleGrid.prototype.activate = function(settings) {
        var configuration = settings.configuration;
        this.data = configuration.data;
        this.currentPageIndex = configuration.currentPageIndex || ko.observable(0);
        this.pageSize = configuration.pageSize || 5;

        this.sortBy = configuration.sortBy;

        // If you don't specify columns configuration, we'll use scaffolding
        this.columns = configuration.columns || this.getColumnsForScaffolding(ko.utils.unwrapObservable(this.data));

        this.itemsOnCurrentPage = ko.computed(function () {
            var startIndex = this.pageSize * this.currentPageIndex();
            return this.data.slice(startIndex, startIndex + this.pageSize);
        }, this);

        this.maxPageIndex = ko.computed(function () {
            return Math.ceil(ko.utils.unwrapObservable(this.data).length / this.pageSize) - 1;
        }, this);
    }

    return SimpleGrid;
});