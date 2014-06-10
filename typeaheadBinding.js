define(function(require) {
    var ko = require('knockout');
    var $ = require('jquery');
    ko.bindingHandlers.typeahead = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var $element = $(element);
            var allBindings = allBindingsAccessor();
            var typeaheadOpts = {};
            var source = { source: ko.utils.unwrapObservable(valueAccessor()) };

            triggerChange = function() {
                $element.change();
            }

            if (allBindings.typeaheadOptions) {
                $.each(allBindings.typeaheadOptions, function (optionName, optionValue) {
                    typeaheadOpts[optionName] = ko.utils.unwrapObservable(optionValue);
                });
            }

            $element.attr("autocomplete", "off").typeahead(typeaheadOpts, source )
                .on("typeahead:selected", triggerChange)
                .on("typeahead:autocompleted", triggerChange);
        }
    };
});
