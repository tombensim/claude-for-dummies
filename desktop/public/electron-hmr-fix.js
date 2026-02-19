// Block Next.js HMR WebSocket in Electron — the Chromium build in Electron
// can't complete the WS upgrade handshake with Next.js 16 Turbopack, causing
// an infinite reconnection loop. Only active inside Electron (window.electronAPI).
(function () {
  if (typeof window === "undefined" || !window.electronAPI) return;

  var _WS = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    if (typeof url === "string" && url.indexOf("webpack-hmr") !== -1) {
      // Return a fake WebSocket that looks "closed" so the HMR client
      // gives up without retrying aggressively.
      var fake = {
        readyState: 3, // CLOSED
        url: url,
        protocol: "",
        extensions: "",
        bufferedAmount: 0,
        binaryType: "blob",
        onopen: null,
        onclose: null,
        onmessage: null,
        onerror: null,
        close: function () {},
        send: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () { return false; },
      };
      return fake;
    }
    if (protocols !== undefined) {
      return new _WS(url, protocols);
    }
    return new _WS(url);
  };
  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;
  window.WebSocket.prototype = _WS.prototype;
})();
