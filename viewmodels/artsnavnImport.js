define(['durandal/system', 'durandal/app', 'knockout', 'underscore', 'plugins/http'], function (system, app, ko, _, http) {
    //var serializer = require('plugins/serializer');

    var input = ko.observable("");
    var output = ko.observable("");
    var result = ko.observableArray();

    var headers = ko.computed(function () {
        return input().split("\n")[0].split("\t");
    });

    var resultCompute = ko.computed(function () {
        var rows = input().split("\n").slice(1);

        var hs = headers();

        var result2 =
            _.filter(rows, function (row) {
                return row.trim();
            }).map(function (row) {
                var cols = _.map(row.split("\t"), function (colval) { return colval.trim(); });
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

        result(result2);
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