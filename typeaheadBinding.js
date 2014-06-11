define(function(require) {
    var ko = require('knockout');
    var $ = require('jquery');
    ko.bindingHandlers.typeahead = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var $element = $(element);
            var allBindings = allBindingsAccessor();
            var typeaheadOpts = {};
            var source = ko.utils.unwrapObservable(valueAccessor());
            var selectedValue;

            if (allBindings.typeaheadOptions) {
                $.each(allBindings.typeaheadOptions, function (optionName, optionValue) {
                    typeaheadOpts[optionName] = ko.utils.unwrapObservable(optionValue);
                });
            }

             if (allBindings.selectedValue) {
                selectedValue = allBindings.selectedValue
             }

            var triggerChange = function($event, changeValue, datasetName) {
                if(selectedValue) { selectedValue(changeValue); }
                $element.val(changeValue[source.valueKey]);
                $element.change();
            }

            var blurFix = function() {
                if($element.val() === "") { return; }
                $element.val(selectedValue()[source.valueKey]);
            }

            $element.attr("autocomplete", "off").typeahead(typeaheadOpts, source )
                .on("typeahead:selected", triggerChange)
                .on("typeahead:autocompleted", triggerChange)
                .on("typeahead:cursorchanged", triggerChange)
                .on("blur", blurFix);
        }
    };
});
