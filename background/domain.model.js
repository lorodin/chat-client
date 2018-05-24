var DomainModel = function(url){
    this.url = url;
    this.pages = [];
}

DomainModel.prototype.setPage = function(page){
    this.pages.push(page);
}

DomainModel.prototype.removePage = function(page){
    let f_page = this.pages.find((v, i, a) => v.url == page.url);
    
    if(!f_page) return;
    
    let index = this.pages.indexOf(f_page);

    this.pages.splice(index, 1);
}

DomainModel.prototype.isEmpty = function(){
    return this.pages.length == 0;
}