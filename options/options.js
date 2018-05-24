let name = '';

$(function(){
    let default_chat_status = localStorage.getItem('default_chat_status');

    if(default_chat_status == 'true'){
        $("#default-status-chat").attr('checked', 'checked');
    }

    name = localStorage.getItem('name');
    if(name == undefined) name = 'Guest';
    $("#default-user-name").val(name);
    $("#save-change").click(SaveChange)
})

function SaveChange(){
    let new_name = $("#default-user-name").val();
    if(new_name.trim() == ''){
        alert('The name field can not be empty!');
        $("#default-user-name").val(name);
        return;
    }else{
        console.log('old_name: '  + name + '; new_name: ' + new_name);
        if(name !== new_name){
            localStorage.setItem('name', new_name);
            name = new_name;
            chrome.extension.sendRequest({'msg': {
                'cmd': 'change-name',
                'data': new_name
                }
            });
        }
    }

    let default_chat_status = $("#default-status-chat").prop("checked") ;

    console.log(default_chat_status);

    localStorage.setItem('default_chat_status', default_chat_status);
}