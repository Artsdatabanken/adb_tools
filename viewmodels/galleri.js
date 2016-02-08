define(function(require){
    var http = require('plugins/http')
    var ko = require('knockout');
    var _ = require('underscore');

    var API = "http://data.artsdatabanken.no/Api";

    var urls = ko.observableArray([]);

    return {
    	urls: urls,

    	activate: function(id) {
    		var that = this;
            return http.get(API + "/Content/"+ id).then(function (response) {
            	var files = _.flatten(_.pluck(response.Content, "Files"), true);
            	that.urls(_.pluck(files, "Url"));
            });
    	}
    }
});