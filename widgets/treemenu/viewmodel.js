define(function(require) {
    var _ = require("underscore");

    var TreeMenu = function() {};

    TreeMenu.prototype.activate = function(settings) {
        var that = this;
        this.searchTerms = ko.observable("");

        this.items = [
                        new Node("Forelder1",
                            [
                                new Node("Barn1",
                                    [
                                        new Node("Barnebarn1", [
                                                new Node("Oldebarn")
                                            ]),
                                        new Node("Barnebarn2")
                                    ]),
                                new Node("Barn2")
                            ]
                        ),
                        new Node("Forelder2")
                    ];
        _.forEach(this.items, function(item) { item.hidden(false);});

        ko.computed(function(){
            var terms = that.searchTerms().split(" ");
            terms = _.filter(terms, function(term){ return ! _.isEmpty(term)});
            terms = _.map(terms, function(term){ return term.toLowerCase();});

            if(terms.length == 0) {
                _.forEach(that.items, function(item) { hideAll(item); item.hidden(false);});
                return;
            }
            _.forEach(that.items, function(item){
                recurFunc(item, terms);
            });
        });
    };

    var hideAll = function(item) {
        item.hidden(true);

        _.forEach(item.children, function(child){ hideAll(child);});
    }


    var recurFunc = function(item, terms) {
        item.hidden( !_.any(terms, function(term){
            console.log("term " + term);
            console.log("name "+item.name);
            console.log("check " + (item.name.toLowerCase().indexOf(term) === 0));
            return item.name.toLowerCase().indexOf(term) === 0;
        }));
        console.log("hidden " + item.hidden());

        if(!item.children) {
            return !item.hidden();
        }

        var found = _.filter(item.children, function(child){
            return recurFunc(child, terms);
        });

        if(found.length > 0) {
            item.hidden(false);
        }
    };

    var Node = function(name, children) {
        this.name = name;
        this.children = children;
        this.hidden = ko.observable(true);
    };

    Node.prototype.toggle = function(data) {
        _.forEach(data.children, function(child){ child.hidden(!child.hidden())})
    };

    return TreeMenu;

});

    // TreeMenu.prototype.clickFunc = function(e) {
    //     var children = $(this).parent('li.parent_li').find(' > ul > li');
    //     if (children.is(":visible")) {
    //         children.hide('fast');
    //         $(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign').removeClass('icon-minus-sign');
    //     } else {
    //         children.show('fast');
    //         $(this).attr('title', 'Collapse this branch').find(' > i').addClass('icon-minus-sign').removeClass('icon-plus-sign');
    //     }
    //     e.stopPropagation();
    // };
// $(function () {
//     $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');
//     $('.tree li.parent_li > span').on('click', function (e) {
//         var children = $(this).parent('li.parent_li').find(' > ul > li');
//         if (children.is(":visible")) {
//             children.hide('fast');
//             $(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign').removeClass('icon-minus-sign');
//         } else {
//             children.show('fast');
//             $(this).attr('title', 'Collapse this branch').find(' > i').addClass('icon-minus-sign').removeClass('icon-plus-sign');
//         }
//         e.stopPropagation();
//     });
// });