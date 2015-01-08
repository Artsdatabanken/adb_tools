define(function (require) {
    var system = require('durandal/system');
    var app = require('durandal/app');
    var ko = require('knockout');
    var _ = require('underscore');
    var http = require('plugins/http');
    var serializer = require('plugins/serializer');

    var input = ko.observable("");
    var items = ko.observableArray();
    var currentItems = ko.observableArray();

    var pagerViewModelSettings = {
        data: currentItems,
        pageSize: 25,
        currentPageIndex: ko.observable(0)
    };

    var inputItems = ko.computed(function () {
        var rows = input().split("\n");//;.slice(1);
        
        var readItems = 
            _.filter(rows, function (row) {
                return row;
            }).map(
                function (row) {
                    return {
                        'ScientificName': row
                    };
                }
            );

        _.forEach(readItems, function (item) {
            item.html = ko.observable();
            http.get("/Databank/ScientificName/?Template=ListGroupItem&q=" + item.ScientificName).then(function (response) {
                item.html(response);
            });
        });

        items(readItems);
    });

    var filteredItems = ko.computed(function () {
        pagerViewModelSettings.currentPageIndex(0);

        var foundItems = items();

        currentItems(items());
    });

    return {
        pagerViewModelSettings: pagerViewModelSettings,
        input: input,

        activate: function () {
        }
    };
});