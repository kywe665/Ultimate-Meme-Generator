(function () {
    "use strict";

    var NoLoadMessage = ''+
        '<div class="css-noload">' +
            '<h2>Connectivity Error</h2>' +
            '<p>We cannot connect to the Meme Server at his time. Check your connection to <a href="http://memegenerator.net">memegenerator.net</a>. Your loss of connectivity could be due to:</p>' +
            '<ul>' +
                '<li>ISP or router configurations</li>' +
                '<li>Firewall settings</li>' +
                '<li>Content filtering on public connections</li>' +
            '</ul>'+
        '</div>';
    var list = new WinJS.Binding.List();
    var groupedItems = list.createGrouped(
        function groupKeySelector(item) { return item.group.key; },
        function groupDataSelector(item) { return item.group; }
    );

    var UrlObj = {
        Premade_Popular: "http://version1.api.memegenerator.net/Instances_Select_ByPopular?languageCode=en&pageIndex=0&pageSize=6&urlName=&days=7",
        Premade_New: "http://version1.api.memegenerator.net/Instances_Select_ByNew?languageCode=en&pageIndex=0&pageSize=6&urlName=",
        Templates_Popular: "http://version1.api.memegenerator.net/Generators_Select_ByPopular?pageIndex=0&pageSize=6&days=7",
        Templates_New: "http://version1.api.memegenerator.net/Generators_Select_ByNew?pageIndex=0&pageSize=6",
        Trending: "http://version1.api.memegenerator.net/Generators_Select_ByTrending"
    };
    //TODO remove
    staticGroups();

    $(document).ready(function () {
        console.log("READY");
        $(document).on('click', 'button', function (ev) {
            console.log('BUTTON CLICKED');
            setTimeout(removeExtraTitles, 500);
        });
        $(document).on('click', '.meme-submission', function (ev) {
            var textTop = $(this).closest('.customize-center').find('.top-text').val(),
                textBottom = $(this).closest('.customize-center').find('.bottom-text').val(),
                imgId = $(this).closest('.content').find('.imgId').attr('data-imgid'),
                genId = $(this).closest('.content').find('.genId').attr('data-genid');
            //createMeme("http://www.hasbrotoyshop.com/Files_Main/67910f9093b_Main400.jpg", 'ifgdfawfaxzvksjds');
            submitMeme(genId, imgId, textTop, textBottom);
        });
        $(document).on('click', '.new-meme-url', function (ev) {
            $(this).select();
        });
    });

    Object.keys(UrlObj).forEach(function (title) {
        $.ajax({
            type: 'GET',
            dataType: "json",
            url: UrlObj[title],
            success: function (data) {
                if (data.success) {
                    staticGroups();
                    generateMemeData(data.result.slice(0,6), title.replace('_', ' '));
                }
            },
            error: function (req, status, err) {
                console.log("Init ERROR: " + err);
                if ($('.css-noload').length < 1) {
                    //TODO enable
                    //$('section').append(NoLoadMessage);
                }
            }
        });
    });

    WinJS.Namespace.define("Data", {
        items: groupedItems,
        groups: groupedItems.groups,
        getItemReference: getItemReference,
        getItemsFromGroup: getItemsFromGroup,
        resolveGroupReference: resolveGroupReference,
        resolveItemReference: resolveItemReference
    });

    function submitMeme(genId, imgId, textTop, textBottom) {
        var username = "ultimatememes",
            password = "generator";
        var url = encodeURI("http://version1.api.memegenerator.net/Instance_Create?username=" +
            username + "&password=" + password + "&languageCode=en&generatorID="+ genId +
            "&imageID=" + imgId + "&text0=" + textTop + "&text1=" + textBottom);
        console.log(url);
        $.ajax({
            type: 'GET',
            dataType: "json",
            url: url,
            success: function (data) {
                if (data.success) {
                    $('.item-image').attr('src', data.result.instanceImageUrl);
                    $('.new-meme-url').attr('value', data.result.instanceImageUrl);
                    $('.new-meme-url').css('display', 'block');
                    $('.new-meme-url').select();
                }
                else {
                    console.log("Something bad happened");
                }
            },
            error: function (req, status, err) {
                console.log("Submit ERROR: " + err);
            }
        });
    }

    function createMeme(url, name) {
        $.ajax({
            type: 'POST',
            data: 'imageValue='+encodeURIComponent(url),
            url: "http://memegenerator.net/Xhr/ImageValueToImageID",
            success: function (id) {
                if (parseInt(id)) {
                    console.log(id);
                    $.ajax({
                        type: 'POST',
                        data: 'imageID=' + id + '&DisplayName=' + name + '&TagLine=&Description=+',
                        url: "http://memegenerator.net/create/generator",
                        success: function (data) {
                            $('.item-image').attr('src', 'http://cdn.memegenerator.net/images/' + id + '.jpg');
                        },
                        error: function (req, status, err) {
                            console.log("Create ERROR: " + err);
                        }
                    });
                }
                else {
                    console.log('BAD IMAGE');
                    console.log(id);
                }
            },
            error: function (req, status, err) {
                console.log("Img ERROR: " + err);
            }
        });
    }

    // Get a reference for an item, using the group key and item title as a
    // unique reference to the item that can be easily serialized.
    function getItemReference(item) {
        return [item.group.key, item.title];
    }

    // This function returns a WinJS.Binding.List containing only the items
    // that belong to the provided group.
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) { return item.group.key === group.key; });
    }

    // Get the unique group corresponding to the provided group key.
    function resolveGroupReference(key) {
        for (var i = 0; i < groupedItems.groups.length; i++) {
            if (groupedItems.groups.getAt(i).key === key) {
                return groupedItems.groups.getAt(i);
            }
        }
    }

    // Get a unique item from the provided string array, which should contain a
    // group key and an item title.
    function resolveItemReference(reference) {
        for (var i = 0; i < groupedItems.length; i++) {
            var item = groupedItems.getAt(i);
            if (item.group.key === reference[0] && item.title === reference[1]) {
                return item;
            }
        }
    }

    function generateMemeData(data, title) {
        var itemContent = "",//'<div class="customize-container">ME BE THE CUSTOM</div>',
            groupDescription = "Most used or visited memes.",
            darkGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC",
            lightGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY7h4+cp/AAhpA3h+ANDKAAAAAElFTkSuQmCC",
            mediumGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY5g8dcZ/AAY/AsAlWFQ+AAAAAElFTkSuQmCC",
            imageUrl = "imageUrl",
            imageTitle = "displayName";
        if (title.indexOf("Premade") !== -1) {
            imageUrl = "instanceImageUrl";
            imageTitle = false;
        }
        var group = { 
            key: title,
            title: title,
            subtitle: title,
            backgroundImage: darkGray,
            description: groupDescription
        };

        data.forEach(function (item) {
            var imgId;
            if (item.imageUrl) {
                var urlStrip = item.imageUrl.split('/');
                imgId = urlStrip[urlStrip.length - 1].split('.')[0];
                console.log(imgId);
            }
            list.push({
                group: group,
                title: item[imageTitle] || item.displayName+"...",
                subtitle: "",
                description: "Use me description!",
                content: '<span style="display: none" data-genid="'+item.generatorID+'" class="genId"></span>'+
                        '<span style="display: none" data-imgid="' + imgId + '" class="imgId"></span>',
                backgroundImage: item[imageUrl]
            });
        });
        setTimeout(removeExtraTitles, 500);
    }

    function removeExtraTitles() {
        var items = $('.item-title');
        items.each(function (i) {
            if ($(items[i]).html().indexOf("...") !== -1) {
                $(items[i]).closest('.item-overlay').remove();
            }
        });
    }

    function staticGroups() {
        var itemContent = "<p>THIS IS THE ITEM DESCRIPTION</p>";
        var itemDescription = "Item Description: Pellentesque porta mauris quis interdum vehicula urna sapien ultrices velit nec venenatis dui odio in augue cras posuere enim a cursus convallis neque turpis malesuada erat ut adipiscing neque tortor ac erat";
        var groupDescription = "Group Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus tempor scelerisque lorem in vehicula. Aliquam tincidunt, lacus ut sagittis tristique, turpis massa volutpat augue, eu rutrum ligula ante a ante";

        // These three strings encode placeholder images. You will want to set the
        // backgroundImage property in your real data to be URLs to images.
        var darkGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC";
        var lightGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY7h4+cp/AAhpA3h+ANDKAAAAAElFTkSuQmCC";
        var mediumGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY5g8dcZ/AAY/AsAlWFQ+AAAAAElFTkSuQmCC";

        // Each of these sample groups must have a unique key to be displayed
        // separately.
        var sampleGroups = [
            { key: "custom", title: "Create Custom", subtitle: "Got your own idea?", backgroundImage: darkGray, description: groupDescription }
        ];

        // Each of these sample items should have a reference to a particular
        // group.
        var sampleItems = [
            { group: sampleGroups[0], title: "New", subtitle: "Use your own image", description: itemDescription, content: itemContent, backgroundImage: 'custom' }
        ];
        //TODO
        sampleItems.forEach(function (item) {
            list.push(item);
        });
        setTimeout(reRouteCustom, 500);
    }
    function reRouteCustom() {
        $('.item-image[src="custom"]').addClass('make-custom');
        $('.group-title:contains(Create Custom)').closest('button').addClass("make-custom");
        $('.group-title:contains(Create Custom)').closest('button').attr('onclick', '');
    }
})();
