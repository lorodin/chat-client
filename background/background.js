chrome.browserAction.setIcon({path: '../popup/icon.png'});
chrome.browserAction.setBadgeText({text:"2"});

var server = new Server('http', '192.168.1.8', '8080');

const app = new ChromeApp(server);

app.start();