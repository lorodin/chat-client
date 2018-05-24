chrome.browserAction.setIcon({path: '../popup/icon.png'});
chrome.browserAction.setBadgeText({text:"2"});

const host = "ec2-18-216-0-225.us-east-2.compute.amazonaws.com";
const localhost = 'localhost';
const protocol = "http";
const port = "8080";

var server = new Server(protocol, localhost, port);

const app = new ChromeApp(server);

app.start();