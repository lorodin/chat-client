var PageContainer = function(){
    this._pages = [];
    this._active_tab = null;
}

PageContainer.prototype.setActiveTab = function(id){
    let page = this._pages.find((p, i, a) => p.hasId(id));

    if(!page) {
        this._active_tab = null;
        return;
    }

    this._active_tab = {
        'tab_id': id,
        'page': page
    }
}

PageContainer.prototype.createOrUpdatePage = function(id, url){
    let _this = this;

    if(!validUrl(url)){
        this._active_tab = null;
        return null;
    } 

    let clear_url = clearUrl(url);
    
    // Ищем страницу по url
    let page = this._pages.find((p, i, ar) => p.url == clear_url);

    let old_page = this._pages.find((p, i, a) => p.hasId(id));

    if(page && old_page && page.url == old_page.url && page.id == old_page.id) return page;

    if(old_page) old_page.removeTab(id);

    if(page){ // Страница с таким url уже есть
        page.setTab(id);
    }else{ 
        page = new PageModel(url);
        
        page.setTab(id);

        page.onEmptyListener((url)=>{
            let index = _this._pages.indexOf(page);
            _this._pages.splice(index, 1);
            if(_this.onRemovePage != undefined) _this.onRemovePage(page);
        });

        if(this.createNewPage != undefined) this.createNewPage(page);

        this._pages.push(page);
    }

    this._active_tab = {
        'tab_id': id,
        'page': page,
        'port': null
    };

    return page;
}

PageContainer.prototype.onCreateNewPage = function(callback){
    this.createNewPage = callback;
}

PageContainer.prototype.getActiveTab = function(){
    return this._active_tab;
}

PageContainer.prototype.getPageByURL = function(url){
    return this._pages.find((p, i, a) => p.url == url);
}

PageContainer.prototype.getPageByTabID = function(id){
    return this._pages.find((p, i, a) => p.hasId(id));
} 

PageContainer.prototype.removeTabFromPage = function(id){
    let page = this._pages.find((p, i, a) => p.hasId(id));

    if(!page) return;

    page.removeTab(id);
}

PageContainer.prototype.onRemovePageListener = function(callback){
    this.onRemovePage = callback;
}