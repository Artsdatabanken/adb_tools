define(function (require) {
    var ko = require('knockout');

    var Pager = function () {};

    Pager.prototype.activate = function (settings) {
        var configuration = settings.configuration;
        this.data = configuration.data;
        this.currentPageIndex = configuration.currentPageIndex || ko.observable(0);
        this.pageSize = configuration.pageSize || 5;

        this.itemsOnCurrentPage = ko.computed(function () {
            var startIndex = this.pageSize * this.currentPageIndex();
            return this.data.slice(startIndex, startIndex + this.pageSize);
        }, this);

        this.maxPageIndex = ko.computed(function () {
            return Math.ceil(ko.utils.unwrapObservable(this.data).length / this.pageSize) - 1;
        }, this);
    }

    return Pager;
});
