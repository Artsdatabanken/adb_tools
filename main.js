requirejs.config({
    paths: {
        'text': '../Scripts/text',
        'durandal': '../Scripts/durandal',
        'plugins': '../Scripts/durandal/plugins',
        'transitions': '../Scripts/durandal/transitions',
        'underscore' : '../Scripts/lodash'
    }
});

define('jquery', function () { return jQuery; });
define('knockout', ko);

define(function (require) {
    var system = require('durandal/system');
    var app = require('durandal/app');
    var viewLocator = require('durandal/viewLocator');
    var selectBindings = require('../../App/koSelectBinding');

    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build");

    app.title = 'Artsdatabanken Data API';

    app.configurePlugins({
        router: true,
        dialog: true,
        widget: {
            kinds: ['grid']
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