var port = chrome.runtime.connect();
var chat_chb = document.getElementById('chat-status');
var chat_title = document.getElementById('chat-status-txt');
var user_name = document.getElementById('user-name');

var page_url = '';

chat_chb.addEventListener('click', chb_property_change);
document.getElementById('btn-options').addEventListener('click', openOptionsPage);

port.onMessage.addListener(function(msg){
    onMessage(msg);
})


function onMessage(msg){
    console.log(msg);
    if(!msg) return;
    if(!msg.cmd) return;

    switch(msg.cmd){
        case 'chat-status':
            chat_chb.checked = msg.data;
            chat_title.innerHTML = msg.data ? 'chat on' : 'chat off';
        break;
        case 'init':
            chat_chb.checked = msg.data.on;
            page_url = msg.data.url;
            chat_title.innerHTML = msg.data.on ? 'chat on' : 'chat off';
            user_name.innerHTML = msg.data.name;
        break;
        case 'register-page':
            console.log(msg.data);
        break;
        case 'change-name':
            user_name.innerHTML = msg.data.name;
        break;
    }
}

function chb_property_change(){
    let msg = {
        'cmd': 'chat-status',
        'data': chat_chb.checked
    };

    port.postMessage(msg);
}

function openOptionsPage(){
    chrome.tabs.create({'url': 'options/index.html'});
}

port.postMessage({'cmd': 'init'});