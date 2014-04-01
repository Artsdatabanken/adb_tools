define(function (require) {
    var system = require('durandal/system');
    var app = require('durandal/app');
    var SimpleGrid = require('./simpleGrid');
    var ko = require('knockout');
    var http = require('plugins/http');
    var serializer = require('plugins/serializer');

    var input = ko.observable("");

    var headers = ko.computed(function () {
        return input().split("\n")[0].split("\t");
    });

    var result = ko.computed(function () {
        var rows = input().split("\n").slice(1);

        var hs = headers();

        var result2 =
            rows.filter(function (element) { return element.trim() != ''; }).map(function (element) {
                var cols = element.split("\t").map(function (colval) { return colval.trim(); });
                return {
                    Cols: cols,
                    Operasjon: cols[hs.indexOf("Operasjon")],
                    VitenskapeligNavn: cols[hs.indexOf("VitenskapeligNavn")],
                    AkseptertNavn: cols[hs.indexOf("AkseptertNavn")],
                    OverordnaNavn: cols[hs.indexOf("OverordnaNavn")],
                    Navn: cols[hs.indexOf("Navn")],
                    Kategori: cols[hs.indexOf("Kategori")],
                    Autorstreng: cols[hs.indexOf("Autorstreng")],
                    Forfatter: cols[hs.indexOf("Forfatter")],
                    Aar: cols[hs.indexOf("Aar")],
                    Referanse: cols[hs.indexOf("Referanse")],
                    Kommentar: cols[hs.indexOf("Kommentar")],
                    NavnKunTilSamling: cols[hs.indexOf("NavnKunTilSamling")],
                    FinnesINorge: cols[hs.indexOf("FinnesINorge")]
                };
            });

        return result2;
    });

    var getSeleniumScript = function () {
        var seleniumscript = [];

        var prescript = '<html>\n<body>';
        var postscript = '</body>\n</html>';

        $(".seleniumscript > tbody").each(function () {
            seleniumscript.push($(this).html());
        });

        $("#seleniumscripttext").val(prescript + seleniumscript.join("\n") + postscript);
    }


    return {
        input: input,
        headers: headers,
        result: result,
        getSeleniumScript: getSeleniumScript,

        activate: function () {
        }
    };
});