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
            '<div class= "text-input">Meme Name</div>' +
            '<input type="text" class="unique-name text-input" placeholder="Unique Meme Name"/>' +
            '<div class= "text-input">Url</div>' +
            '<input type="text" class="custom-url text-input" placeholder="Image URL .JPG or .PNG"/>' +
            //'<div class= "text-input">OR: File</div>' +
            //'<input type="file" class="custom-file text-input" placeholder="File"/>' +
            '<input class="top-text text-input create-second" type="text" placeholder="Top Text"/>' +
            '<input type="text" class="bottom-text text-input create-second" placeholder="Bottom Text"/>' +
            '<input type="button" class="meme-creation create-second" value="Create Meme >"/>' +
            '<input type="text" readonly=true class="new-meme-url create-third" value="havent made one" />' +
        '</div>'+
        '<img class="your-new-meme create-third" src=""/>';

    var list = new WinJS.Binding.List();
    var groupedItems = list.createGrouped(
        function groupKeySelector(item) { return item.group.key; },
        function groupDataSelector(item) { return item.group; }
    );

    var UrlObj = {
        Premade_Popular: "http://version1.api.memegenerator.net/Instances_Select_ByPopular?languageCode=en&pageIndex=0&pageSize=6&urlName=&days=7",
        //Premade_New: "http://version1.api.memegenerator.net/Instances_Select_ByNew?languageCode=en&pageIndex=0&pageSize=6&urlName=",
        Templates_Popular: "http://version1.api.memegenerator.net/Generators_Select_ByPopular?pageIndex=0&pageSize=6&days=7",
        Templates_New: "http://version1.api.memegenerator.net/Generators_Select_ByNew?pageIndex=0&pageSize=6"
        //Trending: "http://version1.api.memegenerator.net/Generators_Select_ByTrending"
    };    

    //EVENT HANDLERS
    $(document).ready(function () {
        staticGroups();
        //READ ALL APIs
        Object.keys(UrlObj).forEach(function (title) {
            $.ajax({
                type: 'GET',
                dataType: "json",
                url: UrlObj[title],
                success: function (data) {
                    if (data.success) {
                        generateMemeData(data.result.slice(0, 6), title.replace('_', ' '));
                    }
                },
                error: function (req, status, err) {
                    console.log("Init ERROR: " + err);
                    if ($('.css-noload').length < 1) {
                        $('section div').hide();
                        $('section').append(NoLoadMessage);
                    }
                }
            });
        });
        console.log("READY");
        $(document).on('click', 'button', function (ev) {
            console.log('BUTTON CLICKED');
            setTimeout(removeExtraTitles, 500);
            setTimeout(reRouteCustom, 500);
        });
        $(document).on('click', '.meme-submission', function (ev) {
            var textTop = $(this).closest('.customize-center').find('.top-text').val(),
                textBottom = $(this).closest('.customize-center').find('.bottom-text').val(),
                imgId = $(this).closest('.content').find('.imgId').attr('data-imgid'),
                genId = $(this).closest('.content').find('.genId').attr('data-genid');
            submitMeme(genId, imgId, textTop, textBottom);
        });
        $(document).on('click', '.meme-creation', function (ev) {
            var textTop = $('.top-text').val(),
                textBottom = $('.bottom-text').val(),
                url = $('.custom-url').val(),
                uniqueName = $('.unique-name').val();
            if (url && uniqueName) {
                checkUrl(url, uniqueName, textTop, textBottom);
            }
        });
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
                }
            },
            error: function (req, status, err) {
                console.log("Url ERROR: " + err);
                $('.custom-url').css('border', '4px solid red');
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
            }
        });
    }
    function testCreateMeme() {
        console.log("testing");
        $.ajax({
            type: 'POST',
            data: 'generatorID=19675&imageID=8179778&text0=' + 'Trying to burn'.split(' ').join('+') + '&text1=' + 'the last couple inches'.split(' ').join('+') + '&languageCode=en',
            url: "http://memegenerator.net/MarathonGirl/caption",
            success: function (data) {
                console.log(data);
                var finalImgId = data.match('instance/[1-9]{1,}')[0].split('/')[1];
                var src = 'http://cdn.memegenerator.net/instances/400x/' + finalImgId + '.jpg';
                console.log(src);
            },
            error: function (req, status, err) {
                Object.keys(req).forEach(function (key) {
                    console.log(key);
                });
                console.log(req.statusText);
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
            },
            error: function (req, status, err) {
                console.log("Create ERROR: " + err);
                $('.custom-url').css('border', '4px solid red');
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
            { key: "custom", title: "Create Custom", subtitle: "Got your own idea?", backgroundImage: darkGray, description: groupDescription }
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
