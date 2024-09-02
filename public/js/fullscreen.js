"use strict";
var socket = io();

$(document).ready(function () {
  $("#buttonMenu").html(getSVG("menu"));
  $("#buttonNowPlaying").html(getSVG("play"));
  $("#buttonLibraryBrowser").html(getSVG("library"));

  socket.on("pairStatus", function (payload) {
    var pairEnabled = payload.pairEnabled;

    if (pairEnabled === true) {
      showSection("nowPlaying");
    } else {
      showSection("pairDisabled");
    }
  });
});

function showSection(sectionName) {
  switch (sectionName) {
    case "nowPlaying":
      $("#deviceBrowser").hide();
      $("#buttonMenu").hide();
      $("#buttonNowPlaying").hide();
      $("#buttonLibraryBrowser").show();
      // Show Now Playing screen
      $("#nowPlaying").show();
      // Hide inactive sections
      $("#pairDisabled").hide();
      $("#libraryBrowser").hide();
      $("#overlayMainMenu").hide();
      break;
    case "libraryBrowser":
      $("#deviceBrowser").hide();
      $("#buttonMenu").hide();
      $("#buttonNowPlaying").show();
      $("#buttonLibraryBrowser").hide();
      // Show libraryBrowser
      $("#libraryBrowser").show();
      // Hide inactive sections
      $("#pairDisabled").hide();
      $("#nowPlaying").hide();
      $("#overlayMainMenu").hide();
      break;
    case "deviceBrowser":
      $("#buttonNowPlaying").show();
      $("#buttonLibraryBrowser").hide();
      $("#deviceBrowser").show();
      $("#libraryBrowser").hide();
      $("#pairDisabled").hide();
      $("#nowPlaying").hide();
      $("#overlayMainMenu").hide();
      break;
    case "pairDisabled":
      // Show pairDisabled section
      $("#pairDisabled").show();
      // Hide everthing else
      $("#buttonMenu").hide();
      $("#buttonNowPlaying").hide();
      $("#buttonLibraryBrowser").hide();
      $("#deviceBrowser").hide();

      $("#libraryBrowser").hide();
      $("#nowPlaying").hide();
      $("#pageLoading").hide();
      break;
    default:
      break;
  }
  var t = setTimeout(function () {
    $("#pageLoading").hide();
  }, 250);
}

function getSVG(cmd) {
  switch (cmd) {
    case "menu":
      return '<svg viewBox="0 0 512 512"><path d="M64 128h384v42.667H64V128m0 106.667h384v42.666H64v-42.666m0 106.666h384V384H64v-42.667z"/></svg>';
    case "play":
      return '<svg viewBox="0 0 24.00 24.00"><path d="M 7.99939,5.13684L 7.99939,19.1368L 18.9994,12.1368L 7.99939,5.13684 Z "/></svg>';
    case "library":
      return '<svg width="48px" height="48px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9v11M4 9h16M4 9H3l9-5 9 5h-1M4 20h16M4 20H3m17 0V9m0 11h1M8 13v3m4 0v-3m4 0v3"/></svg>';
    default:
      break;
  }
}
