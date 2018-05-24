var ChromeApp = function(server){
    let _this = this;
    this.tag = 'ChromApp';
    this.domains = [];
    this.pageContainer = new PageContainer();
    this.server = server;

    let default_chat_status = localStorage.getItem('default_chat_status');

    if(!default_chat_status) localStorage.setItem('default_chat_status', false);
    
    chrome.tabs.getAllInWindow( null, function( tabs ){
        console.log("Initial tab count: " + tabs.length);
        _this.num_tabs = tabs.length;
    });

    this.pageContainer.onRemovePageListener((page) => {
        logD(_this.tag, 'Page "' + page.url + '" deleted!');
        
        let domain_url = getDomain(page.url);
        
        let find = _this.domains.find((v, i, a) => v.url == domain_url);
        
        if(find){
            find.removePage(page);
            if(find.isEmpty()){
                let index = _this.domains.indexOf(find);
                _this.domains.splice(index, 1);
            }
        }

        if(page.on) _this.server.unregisterPage(page.url, ()=>{});
    });
 
    this.pageContainer.onCreateNewPage((page)=>{
        let domain_url = getDomain(page.url);
        let find = _this.domains.find((v, i, a) => v.url == domain_url);
        if(find){
            find.setPage(page);   
        }else{
            let domain = new DomainModel(domain_url);
            domain.setPage(page);
            _this.domains.push(domain);
            logD(_this.tag, 'Create new domain: ' + domain.url);
        }
        
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
            this.server.changeName(request.msg.data, (data)=>{
                if(!data.status){
                    console.log('change name error!');
                    return;
                }
                console.log('change name complete, new name: ' + data.name);

                this._user.name = data.name;

                if(this.pageContainer.getActiveTab() != null) { 
                    this.pageContainer.getActiveTab().port.postMessage({
                        'cmd': 'change-name',
                        'data': {
                            'name' : data.name
                        }
                    })
                }
            })
        break;
    }
}

ChromeApp.prototype.registerPage = function(page, old_status){
    _this = this;
    
    console.log('register page:');
    console.log(page);
    console.log(old_status);

    if(page.on && page.on !== 'false'){
        let domain_url = getDomain(page.url);
        this.server.registerNewPage({
            'url': page.url,
            'domain': domain_url
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
    chrome.tabs.onRemoved.addListener((id) => {
        _this.num_tabs--;
        console.log('Num tabs: ' + _this.num_tabs);
        _this.pageContainer.removeTabFromPage(id);
        if(_this.num_tabs == 0){
            // close connection
            _this.server.exit();
        }
    })
    
    chrome.tabs.onCreated.addListener(()=>{
        _this.num_tabs++;
    })

    chrome.tabs.onUpdated.addListener((id, info, tab) => {
        if(info.status && info.status == 'complete'){
            let page = _this.pageContainer.createOrUpdatePage(id, tab.url);
        }
    });
    
    chrome.tabs.onActivated.addListener((tab) => {
        _this.pageContainer.setActiveTab(tab.tabId);
    });

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

    chrome.runtime.onConnect.addListener(
        function(port){
            let active_tab = _this.pageContainer.getActiveTab();
            
            if(active_tab == null) return;

            active_tab.port = port;

            port.onMessage.addListener((msg)=> _this.onMessage(msg));
        }
    );

    this.server.registerUser(this._user.name, (data)=>{
        console.log('register_user');
        console.log(data);
        _this._user.id = data.user_id;
    })
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