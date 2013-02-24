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
    var customForm = ''+
        '<div class="create-new">' +
            '<div class= "text-input">Unique Meme Name</div>' +
            '<input type="text" class="unique-name text-input" placeholder="Unique Meme Name"/>' +
            '<div class= "text-input">Url (must be a .jpg or .png)</div>' +
            '<input type="text" class="custom-url text-input" placeholder="Image URL .JPG or .PNG"/>' +
            //'<div class= "text-input">OR: File</div>' +
            //'<input type="file" class="custom-file text-input" placeholder="File"/>' +
            '<input class="top-text text-input create-second" type="text" placeholder="Top Text"/>' +
            '<input type="text" class="bottom-text text-input create-second" placeholder="Bottom Text"/>' +
            '<input type="button" class="meme-creation create-second" value="Create Meme >"/>' +
            '<input type="text" readonly=true class="new-meme-url create-third" value="havent made one" />' +
        '</div>'+
        '<img class="your-new-meme create-third" src=""/>';
    var searchBar = '' +
        '<div class="searchbar-container">'+
            '<input type="text" placeholder="Search" class="search-text" />' +
            '<input type="button" class="search-button" value="Search >" />'
        '</div>';

    var list = new WinJS.Binding.List();
    var groupedItems = list.createGrouped(
        function groupKeySelector(item) { return item.group.key; },
        function groupDataSelector(item) { return item.group; }
    );

    var UrlObj = {
        Premade_Popular: "http://version1.api.memegenerator.net/Instances_Select_ByPopular?languageCode=en&urlName=&days=7&pageSize=6&pageIndex=0",
        Premade_New: "http://version1.api.memegenerator.net/Instances_Select_ByNew?languageCode=en&urlName=&pageSize=6&pageIndex=0",
        Templates_Popular: "http://version1.api.memegenerator.net/Generators_Select_ByPopular?days=7&pageSize=6&pageIndex=0",
        Templates_New: "http://version1.api.memegenerator.net/Generators_Select_ByNew?&pageSize=6&pageIndex=0"
        //Trending: "http://version1.api.memegenerator.net/Generators_Select_ByTrending"
    };

    var UrlLoaded = {
        Premade_Popular: false,
        Premade_New: false,
        Templates_Popular: false,
        Templates_New: false
        //Trending: false
    };

    //EVENT HANDLERS
    $(document).ready(function () {
        startLoading();
        staticGroups();
        setTimeout(makeSearchBar, 500);
        //makeSearchBar();
        //READ ALL APIs
        Object.keys(UrlObj).forEach(function (title) {
            $.ajax({
                type: 'GET',
                dataType: "json",
                url: UrlObj[title],
                success: function (data) {
                    if (data.success) {
                        generateMemeData(data.result.slice(0, 6), title.replace('_', ' '));
                        stopLoading();
                    }
                },
                error: function (req, status, err) {
                    console.log("Init ERROR: " + err);
                    if ($('.css-noload').length < 1) {
                        $('section div').hide();
                        $('section').append(NoLoadMessage);
                        stopLoading();
                    }
                }
            });
        });
        console.log("READY");
        $(document).on('click', 'button', function (ev) {
            var text = $(this).text().trim().replace(' ', '_');
            console.log(text);
            if (UrlObj[text] && !UrlLoaded[text]) {
                UrlLoaded[text] = true;
                loadMore(UrlObj[text], text);
            }
            setTimeout(removeExtraTitles, 500);
            setTimeout(reRouteCustom, 500);
            setTimeout(makeSearchBar, 500);
        });
        $(document).on('click', '.meme-submission', function (ev) {
            var textTop = $(this).closest('.customize-center').find('.top-text').val(),
                textBottom = $(this).closest('.customize-center').find('.bottom-text').val(),
                imgId = $(this).closest('.content').find('.imgId').attr('data-imgid'),
                genId = $(this).closest('.content').find('.genId').attr('data-genid');
            startLoading();
            submitMeme(genId, imgId, textTop, textBottom);
        });
        $(document).on('click', '.meme-creation', function (ev) {
            var textTop = $('.top-text').val(),
                textBottom = $('.bottom-text').val(),
                url = $('.custom-url').val(),
                uniqueName = $('.unique-name').val();
            startLoading();
            if (url && uniqueName) {
                checkUrl(url, uniqueName, textTop, textBottom);
            }
        });
        /*$(document).on('keypress', '.bottom-text', function (e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13) {
                var textTop = $('.top-text').val(),
                textBottom = $('.bottom-text').val(),
                url = $('.custom-url').val(),
                uniqueName = $('.unique-name').val();
                startLoading();
                if (url && uniqueName) {
                    checkUrl(url, uniqueName, textTop, textBottom);
                }
            }
        });*/
        $(document).on('click', '.new-meme-url', function (ev) {
            $(this).select();
        });
        $(document).on('click', '.make-custom', function (ev) {
            setTimeout(showCustomForm, 50);
            setTimeout(showCustomForm, 700);
        });
        $(document).on('keyup', '.unique-name', function (ev) {
            var uniqueName = $('.unique-name').val();
            console.log(uniqueName);
            checkUniqueName(uniqueName);
        });
        $(document).on('keyup', '.custom-url', function (ev) {
            var customUrl = $('.custom-url').val();
            console.log(customUrl);
            var chunks = customUrl.split('.');
            if (chunks[chunks.length - 1] === 'jpg' || chunks[chunks.length - 1] === 'png') {
                $('.custom-url').css('border', 'none');
            }
            else {
                $('.custom-url').css('border', '4px solid red');
            }
        });
        $(document).on('click', '.search-button', function (ev) {
            console.log($('.search-text').val().trim());
            startLoading();
            makeSearchGroup($('.search-text').val().trim());
        });
        $(document).on('keypress', '.search-text', function (e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            $('.search-text').css('border', 'none');
            if (code == 13) {
                console.log($('.search-text').val().trim());
                makeSearchGroup($('.search-text').val().trim());
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

    function makeSearchGroup(query) {
        var url = 'http://version1.api.memegenerator.net/Generators_Search?q=' + encodeURI(query) + '&pageIndex=0&pageSize=12';
        $.ajax({
            type: 'GET',
            dataType: "json",
            url: url,
            success: function (data) {
                if (data.success) {
                    if (data.result.length < 1) {
                        $('.search-text').css('border', '4px solid red');
                        stopLoading();
                    }
                    else {
                        generateMemeData(data.result, query);
                        setTimeout(forceScroll, 500);
                        $('.search-text').css('border', 'none');
                    }
                }
            },
            error: function (req, status, err) {
                console.log("search ERROR: " + err);
                $('.search-text').css('border', '4px solid red');
                stopLoading();
            }
        });
    }

    function forceScroll() {
        console.log($(".win-surface")[0].scrollWidth);
        $(".win-surface").scrollLeft($(".win-surface")[0].scrollWidth);
        console.log($(".win-viewport")[0].scrollWidth);
        $(".win-viewport").scrollLeft($(".win-viewport")[0].scrollWidth);
        console.log($(".win-container").parent()[0].scrollWidth);
        $(".win-container").parent().scrollLeft($(".win-container").parent()[0].scrollWidth);
        stopLoading();
    }

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
                    var share = 'https://www.facebook.com/sharer.php?u=' + data.result.instanceImageUrl + '&t=' + encodeURI('Ultimate Meme Generator Win8 App');
                    $('.meme-share').attr('href', share);
                    $('.meme-share').css('display', 'block');
                    stopLoading();
                }
                else {
                    console.log("Something bad happened");
                }
            },
            error: function (req, status, err) {
                console.log("Submit ERROR: " + err);
                stopLoading();
            }
        });
    }

    function checkUrl(url, name, textTop, textBottom) {
        $.ajax({
            type: 'POST',
            data: 'imageValue='+encodeURIComponent(url),
            url: "http://memegenerator.net/Xhr/ImageValueToImageID",
            success: function (id) {
                if (parseInt(id)) {
                    console.log('url good '+id);
                    createImage(url, name, textTop, textBottom, id);
                    $('.custom-url').css('border', '4px solid green');
                }
                else {
                    console.log('BAD URL');
                    console.log(id);
                    $('.custom-url').css('border', '4px solid red');
                    stopLoading();
                }
            },
            error: function (req, status, err) {
                console.log("Url ERROR: " + err);
                $('.custom-url').css('border', '4px solid red');
                stopLoading();
            }
        });
    }

    function createImage(url, name, textTop, textBottom, id) {
        $.ajax({
            type: 'POST',
            data: 'imageID=' + id + '&DisplayName=' + name + '&TagLine=&Description=+',
            url: "http://memegenerator.net/create/generator",
            success: function (data) {
                //$('.item-image').attr('src', 'http://cdn.memegenerator.net/images/' + id + '.jpg');
                console.log("image created");
                getGenId(url, name, textTop, textBottom, id);
            },
            error: function (req, status, err) {
                console.log("CreateImg ERROR: " + err);
                $('.custom-url').css('border', '4px solid red');
                stopLoading();
            }
        });
    }

    function getGenId(url, name, textTop, textBottom, imgId) {
        $.ajax({
            type: 'GET',
            url: 'http://memegenerator.net/'+name,
            success: function (data) {
                //parse data
                var genId = data.match('generatorID&quot;:[1-9]{1,}')[0].split(':')[1];
                console.log("got genId " + genId);
                createMemeWithText(genId, imgId, textTop, textBottom, name);
            },
            error: function (req, status, err) {
                console.log("GetGenID ERROR: " + err);
                $('.custom-url').css('border', '4px solid red');
                stopLoading();
            }
        });
    }
    function createMemeWithText(genId, imgId, textTop, textBottom, name) {
        $.ajax({
            type: 'POST',
            data: 'generatorID=' + genId + '&imageID=' + imgId + '&text0=' + textTop.replace(' ', '+') + '&text1=' + textBottom.replace(' ', '+') + '&languageCode=en',
            url: "http://memegenerator.net/"+name+"/caption",
            success: function (data) {
                //console.log(data);
                var finalImgId = data.match('instance/[0-9]{1,}')[0].split('/')[1];
                var src = 'http://cdn.memegenerator.net/instances/400x/' + finalImgId + '.jpg';
                $('.create-third').css('display', 'block');
                $('.new-meme-url').attr('value', src);
                $('.your-new-meme').attr('src', src);
                console.log(src);
                stopLoading();
            },
            error: function (req, status, err) {
                console.log("Create ERROR: " + err);
                $('.custom-url').css('border', '4px solid red');
                stopLoading();
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
            backgroundImage: './images/mainLogoLarge.png',
            description: groupDescription
        };

        data.forEach(function (item) {
            var imgId;
            if (item.imageUrl) {
                var urlStrip = item.imageUrl.split('/');
                imgId = urlStrip[urlStrip.length - 1].split('.')[0];
            }
            list.push({
                group: group,
                title: item[imageTitle] || item.displayName+"...",
                subtitle: "",
                description: "",
                content: '<span style="display: none" data-genid="'+item.generatorID+'" class="genId"></span>'+
                        '<span style="display: none" data-imgid="' + imgId + '" class="imgId"></span>',
                backgroundImage: item[imageUrl]
            });
        });
        setTimeout(removeExtraTitles, 500);
    }

    function loadMore(url, title) {
        var newUrl = url.substring(0, url.length - 1) + 2;
        console.log(newUrl);
        $.ajax({
            type: 'GET',
            dataType: "json",
            url: newUrl,
            success: function (data) {
                if (data.success) {
                    generateMemeData(data.result, title.replace('_', ' '));
                }
            },
            error: function (req, status, err) {
                console.log("loadMore ERROR: " + err);
                /*if ($('.css-noload').length < 1) {
                    $('section div').hide();
                    $('section').append(NoLoadMessage);
                }*/
            }
        });
    }

    function startLoading() {
        $('#loader').addClass('show');
    }
    function stopLoading() {
        $('#loader').removeClass('show');
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
        var itemContent = "<p>THIS IS THE ITEM Content</p>";
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
            { key: "custom", title: "Create Custom", subtitle: "Got your own idea?", backgroundImage: './images/mainLogoLarge.png', description: groupDescription }
        ];

        // Each of these sample items should have a reference to a particular
        // group.
        var sampleItems = [
            { group: sampleGroups[0], title: "New", subtitle: "Use your own image", description: itemDescription, content: itemContent, backgroundImage: './images/plus.png' }
        ];
        //TODO
        sampleItems.forEach(function (item) {
            list.push(item);
        });
        setTimeout(reRouteCustom, 500);
    }

    function makeSearchBar() {
        $('header').append(searchBar);
    }

    function showCustomForm() {
        console.log('custom');
        $('.content').html(customForm);
    }

    function checkUniqueName(name) {
        $.ajax({
            type: 'GET',
            dataType: "json",
            url: 'http://memegenerator.net/Generator/Json_isDisplayNameValid?displayName='+encodeURI(name),
            success: function (data) {
                if (data.Success) {
                    console.log('good name: ' + data);
                    $('.unique-name').css('border', '4px solid green');
                    $('.create-second').css('display', 'block');
                }
                else {
                    $('.unique-name').css('border', '4px solid red');
                    $('.create-second').css('display', 'none');
                }
            },
            error: function (req, status, err) {
                console.log("NameCheck ERROR: " + err);
            }
        });
    }

    function reRouteCustom() {
        $('.item-image[src="./images/plus.png"]').addClass('make-custom');
        $('.item-image[src="./images/plus.png"]').parent().addClass('make-custom');
        $('.item-image[src="./images/plus.png"] .item-overlay').addClass('make-custom');
        $('.group-title:contains(Create Custom)').closest('button').addClass("make-custom");
        $('.group-title:contains(Create Custom)').closest('button').attr('onclick', '');
    }
})();
