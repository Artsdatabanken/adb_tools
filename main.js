var bc = './bower_components/';

requirejs.config({
    paths: {
        'text': bc + 'requirejs-text/text',
        'durandal': bc + 'durandal/js',
        'plugins': bc + 'durandal/js/plugins',
        'selectpicker': bc + 'bootstrap-select/dist/js/bootstrap-select.min',
        'transitions': bc + 'durandal/js/transitions',
        'typeahead': bc + 'bootstrap3-typeahead',
        'lodash': bc + 'lodash/lodash',
        'knockout': bc + 'knockout.js/knockout'
    }
});

define('jquery', function () {
    return jQuery;
});

define(['durandal/system', 'durandal/app', 'durandal/viewLocator', 'koSelectBinding', 'typeaheadBinding'],
    function (system, app, viewLocator) {

        system.debug(true);

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
            app.setRoot('shell');
        });
    });
