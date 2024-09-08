"use strict";
var socket = io(undefined, {
  reconnection: true,            // 启用自动重连
  reconnectionAttempts: Infinity, // 无限次重连尝试
  reconnectionDelay: 1000,       // 每次重连之间的延迟时间（毫秒）
  reconnectionDelayMax: 1000,    // 最大延迟时间，保持和 reconnectionDelay 一致
  timeout: 10000,                // 连接超时时间（毫秒）
  query: {
    subscribes: "roon",
  },
});

socket.on('connect', () => {
  console.log('[Fullscreen] Socket.io Connected to server.');
  // socket.emit("subscribe", {
  //   type: "roon",
  // });
});

socket.on('disconnect', (reason) => {
  console.log(`[Fullscreen] Socket.io Disconnected from server. Reason: ${reason}`);
  // 在这里可以提示用户连接断开
});

socket.on('reconnect_attempt', (attempt) => {
  console.log(`[Fullscreen] Socket.io Reconnection attempt ${attempt}`);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`[Fullscreen] Socket.io Reconnected to server on attempt ${attemptNumber}`);
});

socket.on('reconnect_failed', () => {
  console.log('[Fullscreen] Socket.io Failed to reconnect to the server.');
});

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
      $("#renderDeviceBrowser").hide();
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
      $("#renderDeviceBrowser").hide();
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
      $("#renderDeviceBrowser").hide();
      $("#libraryBrowser").hide();
      $("#pairDisabled").hide();
      $("#nowPlaying").hide();
      $("#overlayMainMenu").hide();
      break;
    case "renderDeviceBrowser":
      $("#buttonNowPlaying").show();
      $("#buttonLibraryBrowser").hide();
      $("#deviceBrowser").hide();
      $("#renderDeviceBrowser").show();
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
      $("#renderDeviceBrowser").hide();

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
