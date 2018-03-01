var dataUrl = "data.php";
if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    dataUrl = "https://d-shen.xyz/biblescheduler/" + dataUrl;    
var lastVersion = "";
var bible;
function update(data) {
    if (data) {
        $("#version > select").val(data.version);
    }
    var version = $("#version > select").val();
    if (version != lastVersion) {
        lastVersion = version;
        $.getJSON("bibles/" + version + ".json")
            .done(function(json) {
                bible = json;
                updateInfo();
            })
            .fail(function(a, b, error) {
                console.log("Error:" + error);
            });
    } else {
        updateInfo();
    }
}

function save() {
    var save = false;
    var passages = [];
    $(".chapter > input").each(function (index, element) {
        if ($(element).prop("checked")) {
            save = true;
            passages.push(element.id.replace("#", ""));
        }
    });
    if (save) {
        var version = $("#version > select").val();
        var days = Math.round($("#days").val());
        $.post(dataUrl, { version: version, days: days, passages: passages.join(";") }, function (data) {
            if (data !== "Err") window.history.pushState("", "", "?id=" + data);
        });
    }
}

function updateInfo() {
    var days = Math.round($("#days").val());
    if (days === "" || isNaN(days) || days < 1) days = 1;
    var totalVerses = 0;
    var totalWords = 0;
    var chapters = [];

    $(".chapter > input").each(function (index, element) {
        if ($(element).prop("checked")) {
            var chapterJson = getChapterJson(element.id);
            var numVerses = chapterJson["verses"];
            var wordCount = chapterJson["words"];
            totalVerses += numVerses;
            totalWords += wordCount;
            chapters.push(chapterJson);
        }
    });

    $("#totalChapters").text(chapters.length);
    var dailyChapters = chapters.length / days;
    $("#dailyChapters").text(Math.round(dailyChapters));

    $("#totalVerses").text(totalVerses);
    var dailyVerses = totalVerses / days;
    $("#dailyVerses").text(Math.round(dailyVerses));

    $("#totalWords").text(totalWords);
    var dailyWords = totalWords / days;
    $("#dailyWords").text(Math.round(dailyWords));

    $("#schedule > tbody").empty();
    if (days >= chapters.length) {
        for (var i = 0; i < chapters.length; i++) {
            $("#schedule > tbody").append("<tr><td>" + (i + 1) + "</td><td>" + chapters[i]["book"] + " " + chapters[i]["chapter"] + "</td></tr>");
        }
    } else {
        var lastChapter = 0;

        var sectionChapters = 0;
        var sectionVerses = 0;
        var sectionWords = 0;

        // todo: change based on selection
        var check = "words";
        for (var day = 1; day <= days; day++) {
            for (var i = lastChapter; i < chapters.length; i++) {
                if (day == days) {
                    i = chapters.length - 1;
                }
                var chapter = chapters[i];
                var numVerses = chapter["verses"];
                var wordCount = chapter["words"];

                var oldDiff;
                var newDiff;

                if (check === "chapters") {
                    oldDiff = Math.abs(sectionChapters - dailyChapters * day);
                    sectionChapters++;
                    newDiff = Math.abs(sectionChapters - dailyChapters * day);
                    if (sectionChapters < dailyChapters * day && i != chapters.length - 1) continue;
                    if (newDiff > oldDiff && i != chapters.length - 1 && i > lastChapter) {
                        i--;
                        sectionChapters--;
                    }
                } else if (check === "verses") {
                    oldDiff = Math.abs(sectionVerses - dailyVerses * day);
                    sectionVerses += numVerses;
                    newDiff = Math.abs(sectionVerses - dailyVerses * day);
                    if (sectionVerses < dailyVerses * day && i != chapters.length - 1) continue;
                    if (newDiff > oldDiff && i != chapters.length - 1 && i > lastChapter) {
                        i--;
                        sectionVerses -= numVerses;
                    }
                } else if (check === "words") {
                    oldDiff = Math.abs(sectionWords - dailyWords * day);
                    sectionWords += wordCount;
                    newDiff = Math.abs(sectionWords - dailyWords * day);
                    if (sectionWords < dailyWords * day && i != chapters.length - 1) continue;
                    if (newDiff > oldDiff && i != chapters.length - 1 && i > lastChapter) {
                        i--;
                        sectionWords -= wordCount;
                    }
                } else {
                    console.log("Error: Invalid check type!");
                    return;
                }

                if (lastChapter == i) $("#schedule > tbody").append("<tr><td>" + day + "</td><td>" + chapters[lastChapter]["book"] + " " + chapters[lastChapter]["chapter"] + "</td></tr>");
                else $("#schedule > tbody").append("<tr><td>" + day + "</td><td>" + chapters[lastChapter]["book"] + " " + chapters[lastChapter]["chapter"] + " - " + chapters[i]["book"] + " " + chapters[i]["chapter"] + "</td></tr>");
                lastChapter = i + 1;
                break;
            }
        }
    }
}

function getChapterJson(id) {
    var id = id.split(".");
    var book = id[0].replace(/_/g, " ");
    var chapter = id[1] - 1;
    var chapterJson = bible["books"][book][chapter];
    chapterJson["book"] = book;
    chapterJson["chapter"] = chapter + 1;
    return chapterJson;
}

var lastBox = 0;
function updateSelect(event) {
    var index = $(".book > input, .chapter > input").index(event.target);
    var isBook = $(event.target).parent().attr("class") === "book";
    if (event.shiftKey) {
        checkBoxes(lastBox, index);
        window.getSelection().removeAllRanges();
    } else if (isBook) {
        $(event.target).siblings().children("div").children("input").prop("checked", $(event.target).prop("checked"));
    }
    if (!isBook) {
        if (!$(event.target).prop("checked")) {
            $(event.target).parent().parent().parent().children("input").prop("checked", false);
        } else {
            var allChecked = true;
            $(event.target).parent().parent().parent().children("div").children("input").each(function() {
                if (!$(this).prop("checked")) allChecked = false;
            });
            if (allChecked) {
                $(event.target).parent().parent().children("input").prop("checked", true);
            }
        }
    }
    lastBox = index;
    $(".book").each(function() {
        var allChecked = true;
        $(this).children("div").children("div").children("input").each(function () {
            if (!$(this).prop("checked")) allChecked = false;
        });
        $(this).children("input").prop("checked", allChecked);
    });
    update();
}

function checkBoxes(start, end) {
    var checked = $(".book > input, .chapter > input").eq(start).prop("checked");
    
    if (start > end) {
        var temp = start;
        start = end;
        end = temp;
    };

    for (var i = start; i <= end; i++) {
        if ($(".book > input, .chapter > input").eq(i).parent().attr("class") === "book") continue;
        $(".book > input, .chapter > input").eq(i).prop("checked", checked);
    }
}

$("#days").on("input", function () {
    update();
});

function setup(data) {
    $.getJSON("bibles/NIV.json")
        .done(function (json) {
            bible = json;
            $("#passages").empty();
            $.each(bible["books"], function (name, book) {
                var bookId = name.replace(/ /g, "_");
                var newBook = $("<div class=\"book\"></div>");
                newBook.append("<input type=\"checkbox\" name=\"" + bookId + "\" value=\"" + bookId + "\" id=\"" + bookId + "\">")
                    .append("<label>" + name + "</label>")
                    .append("<br />");
                var section = $("<div class=\"section\"></div>");
                var secIsEmpty = true;
                var secSize = book.length >= 20 ? book.length >= 100 ? 25 : 10 : 5;
                $.each(book, function (index, chapter) {
                    var chapterId = bookId + "." + (index + 1);
                    var newChapter = $("<div class=\"chapter\"></div>");
                    newChapter.append("<input type=\"checkbox\" name=\"" + chapterId + "\" value=\"" + chapterId + "\" id=\"" + chapterId + "\">")
                        .append("<label>" + (index + 1) + "</label>");
                    section.append(newChapter);
                    secIsEmpty = false;
                    if (index % secSize == secSize - 1) {
                        newBook.append(section);
                        section = $("<div class=\"section\"></div>");
                        secIsEmpty = true;
                    }
                });
                if (!secIsEmpty) {
                    newBook.append(section);
                    section = $("<div class=\"section\"></div>");
                }
                $("#passages").append(newBook);

                if (data) {
                    $("#days").val(data.days);
                    for (var i = 0; i < data.passages.length; i++) {
                        $("#" + data.passages[i].replace(/\./g, "\\.")).prop("checked", true);
                    }
                    updateInfo();
                }
            });

            $(".book > input, .chapter > input")
                .click(function (event) {
                    updateSelect(event);
                })
                .on("click2", function (event, data) {
                    updateSelect(data);
                });

            $(".book > label, .chapter > label").click(function (event) {
                event.target = $(this).siblings("input")[0];
                $(event.target).prop("checked", !$(event.target).prop("checked"));
                $(event.target).trigger("click2", [event]);
            });
            if (data) update(data);
            else update();
        })
        .fail(function (a, b, error) {
            console.log("Error:" + error);
        });
}

var url = window.location.href;
name = name.replace(/[\[\]]/g, "\\$&");
var regex = new RegExp("[?&]id(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
if (results && results[2]) {
    var id = decodeURIComponent(results[2].replace(/\+/g, " "));
    $.get(dataUrl, {id: id}, function(data) {
        if (data !== "Err") setup(data);
        else setup();
    });
} else {
    setup();
}