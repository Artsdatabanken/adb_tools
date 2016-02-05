var path = './bower_components';

requirejs.config({
    paths: {
        'text': path + '/requirejs-text/text',
        'durandal': path + '/durandal/js',
        'plugins': path + '/durandal/js/plugins',
        'selectpicker': path + '/bootstrap-select/dist/js',
        'transitions': path + '/durandal/js/transitions',
        'typeahead': path + '/bootstrap3-typeahead',
        'underscore' : path + '/lodash/lodash'
    }
});

define('jquery', function () { return jQuery; });
define('knockout', ko);

define(function (require) {
    var system = require('durandal/system');
    var app = require('durandal/app');
    var viewLocator = require('durandal/viewLocator');
    var selectBindings = require('koSelectBinding');
    var typeaheadBinding = require('typeaheadBinding');

    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build");

    app.title = 'Artsdatabanken Data API';

    app.configurePlugins({
        router: true,
        dialog: true,
        widget: {
            kinds: ['pager', 'grid', 'treemenu']
        }
    });

    app.start().then(function () {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        viewLocator.useConvention();

        //Show the app by setting the root view model for our application with a transition.
        app.setRoot('shell', 'entrance');
    });
});
