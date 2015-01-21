define(function (require) {
    var router = require('plugins/router');
    var app = require('durandal/app');

    return {
        router: router,
        search: function () {
            //It's really easy to show a message box.
            //You can add custom options too. Also, it returns a promise for the user's response.
            app.showMessage('Search not yet implemented...');
        },
        activate: function () {
            router.map([
                { route: 'Ansvarsarter', title: 'Ansvarsarter', moduleId: 'viewmodels/ansvarsarter', nav: true },
                { route: 'ArtsnavnImport', title: 'ArtsnavnImport', moduleId: 'viewmodels/artsnavnImport', nav: true },
                { route: 'Flervalg', title: 'Flervalg', moduleId: 'viewmodels/flervalg', nav: true },
                { route: 'Galleri/:id', title: 'Galleri', moduleId: 'viewmodels/galleri', nav: true},
                { route: 'Sok', title: 'Søk', moduleId: 'viewmodels/search', nav: true},
                { route: 'Artsinformasjon', title: 'Artsinformasjon', moduleId: 'viewmodels/artsinformasjon', nav: true },
                { route: 'ScientificNameSearch(/:scientificNameID)', title: 'ScientificNameSearch', moduleId: 'viewmodels/ScientificNameSearch', nav: true },
                { route: 'MultiAccessKey(/:contentID)', title: 'MultiAccessKey', moduleId: 'viewmodels/MultiAccessKey', nav: true }
            ]).buildNavigationModel();

            return router.activate();
        },
        compositionComplete: function(view, parnt) {
            //parent er document sin parent, for å sende meldinger. parnt er input til compositonComplete, og urelatert
            parent.postMessage(document.body.scrollHeight, '*');
        }
    };
});
