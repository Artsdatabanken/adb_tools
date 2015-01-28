define(function (require) {
    var system = require('durandal/system');
    var app = require('durandal/app');
    var ko = require('knockout');
    var http = require('plugins/http');
    var serializer = require('plugins/serializer');

    var input = ko.observable("");
    var output = ko.observable("");

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
                    VitenskapeligNavnID: cols[hs.indexOf("VitenskapeligNavnID")],
                    AkseptertNavn: cols[hs.indexOf("AkseptertNavn")],
                    AkseptertNavnID: cols[hs.indexOf("AkseptertNavnID")],
                    OverordnaNavn: cols[hs.indexOf("OverordnaNavn")],
                    OverordnaNavnID: cols[hs.indexOf("OverordnaNavnID")],
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

    var generateSeleniumScript = function () {
        var seleniumscript = [];

        var prescript = '<html>\n<body>';
        var postscript = '</body>\n</html>';

        $(".seleniumscript > tbody").each(function () {
            seleniumscript.push($(this).html());
        });

        output(prescript + seleniumscript.join("\n") + postscript);
    }


    return {
        input: input,
        output: output,
        headers: headers,
        result: result,
        generateSeleniumScript: generateSeleniumScript,

        activate: function () {
        }
    };
});