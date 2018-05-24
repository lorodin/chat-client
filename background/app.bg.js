var ChromeApp = function(server){
    let _this = this;
    this.tag = 'ChromApp';
    this.pageContainer = new PageContainer();
    this.server = server;

    let default_chat_status = localStorage.getItem('default_chat_status');

    if(!default_chat_status) localStorage.setItem('default_chat_status', false);
    
    // Считаем начальное количество открытых вкладок
    chrome.tabs.getAllInWindow( null, function( tabs ){
        console.log("Initial tab count: " + tabs.length);
        _this.num_tabs = tabs.length;
    });

    // Слушаем удаление страницы
    this.pageContainer.onRemovePageListener((page) => {
        logD(_this.tag, 'Page "' + page.url + '" deleted!');
        
        if(page.on) _this.server.unregisterPage(page.url, ()=>{});
    });
 
    // Слушаем создание новой страницы
    this.pageContainer.onCreateNewPage((page)=>{
        page.on = getChatStatusOnPage(page.url);

        if(page.on) _this.registerPage(page);
    });

    chrome.extension.onRequest.addListener(
        function(request, sender, sendResponse) {
            _this.onRequest(request, sender, sendResponse);
        }
    );
}

ChromeApp.prototype.onRequest = function(request, sender, sendResponse){
    if(!request || !request.msg || !request.msg.cmd) return;

    switch(request.msg.cmd){
        case 'change-name':
            this.server.changeName(request.msg.data);
        break;
    }
}

ChromeApp.prototype.registerPage = function(page, old_status){
    _this = this;
    
    console.log('register page:');
    console.log(page);
    console.log(old_status);

    if(page.on && page.on !== 'false'){
        this.server.registerNewPage({
            'url': page.url
        }, (data) => {
            _this.onRegisterPageComplete(data);
        });
    }else if((!page.on || page.on === 'false') && old_status){
        this.server.unregisterPage(page.url, () => {
            console.log('page was be unregister ' + page.url);
        });
    }
}

ChromeApp.prototype.onRegisterPageComplete = function(data){
    console.log('Register new page complete');
    console.log(data);
    if(data.url == this.pageContainer.getActiveTab().page.url){
        this.pageContainer.getActiveTab().port.postMessage({
            'cmd':'register-page',
            'data': data
        });
    }
}



ChromeApp.prototype.removePage = function(url){
    
}

ChromeApp.prototype.testAction = function(msg){
    if(this.pageContainer.getActiveTab() == null) return;
    if(this.pageContainer.getActiveTab().port == null) return;
    console.log('send message to extension');
    this.pageContainer.getActiveTab().port.postMessage({'msg':msg});
}

ChromeApp.prototype.start = function(){
    let _this = this;

    // Задаем начальное значение имени пользователя
    let user_name = localStorage.getItem('name');
    
    if(!user_name) {
        user_name = 'Guest';
        localStorage.setItem('name', user_name);
    }

    this._user = {
        id: '',
        name: user_name
    }

    console.log('User name: ' + user_name);

    // Слушаем закрытие вкладок
    chrome.tabs.onRemoved.addListener((id) => {
        _this.num_tabs--;
        console.log('Num tabs: ' + _this.num_tabs);
        _this.pageContainer.removeTabFromPage(id);
        if(_this.num_tabs == 0){
            // close connection
            _this.server.exit();
        }
    })
    
    // Слушаем закрытие вкладок
    chrome.tabs.onCreated.addListener(()=>{
        _this.num_tabs++;
    })

    // Слушаем обновление страницы
    chrome.tabs.onUpdated.addListener((id, info, tab) => {
        if(info.status && info.status == 'complete'){
            let page = _this.pageContainer.createOrUpdatePage(id, tab.url);
        }
    });
    
    // Слушаем изменение активной вкладки
    chrome.tabs.onActivated.addListener((tab) => {
        _this.pageContainer.setActiveTab(tab.tabId);
    });

    // Слушаем подключение к bg из popup
    chrome.runtime.onConnect.addListener(
        function(port){
            let active_tab = _this.pageContainer.getActiveTab();
            
            if(active_tab == null) return;

            active_tab.port = port;

            port.onMessage.addListener((msg)=> _this.onMessage(msg));
        }
    );

    this.server.onRegisterClientCompleteListener((data)=>{
        console.log(data);
    });

    this.server.onChangeNameComplete((new_name) => {
        console.log(new_name);
        this._user.name = new_name;

        if(this.pageContainer.getActiveTab() != null) { 
            this.pageContainer.getActiveTab().port.postMessage({
                'cmd': 'change-name',
                'data': {
                    'name' : new_name
                }
            })
        }

    });

    this.server.onErrorListener((msg)=>{
        console.log('Error: ' + msg);
    });

    this.server.registerUser(user_name);
}


ChromeApp.prototype.onMessage = function(msg){
    if(!msg) return;
    if(!msg.cmd) return;

    console.log(msg);

    switch(msg.cmd){
        case 'init':
            this.initPage();
        break;
        case 'chat-status':
            this.toogleChatStatus(msg.data);
        break;
    }
}

ChromeApp.prototype.initPage = function(){
    if(this.pageContainer.getActiveTab() == null) return;

    console.log('init page');

    let data = {
        'url': this.pageContainer.getActiveTab().page.url,
        'on': getChatStatusOnPage(this.pageContainer.getActiveTab().page.url) == "true",
        'name': this._user.name
    }

    console.log(data);

    this.pageContainer.getActiveTab().port.postMessage({
        'cmd': 'init',
        'data': data
    });
}

ChromeApp.prototype.toogleChatStatus = function(status){
    if(this.pageContainer.getActiveTab() == null) return;

    let old_status = this.pageContainer.getActiveTab().page.on;
    
    this.pageContainer.getActiveTab().page.on = status;

    this.pageContainer.getActiveTab().port.postMessage({
        'cmd': 'chat-status',
        'data': status
    });

    this.registerPage(this.pageContainer.getActiveTab().page, old_status);
   
    setChatStatusOnPage(this.pageContainer.getActiveTab().page.url, status);
}