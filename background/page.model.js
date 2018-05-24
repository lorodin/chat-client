var PageModel = function(url){
    this.url = url;
    this.tab_ids = [];
    this.messages = [];
    this.users = [];
    this.on = false;
}

PageModel.prototype.setMessage = function(msg){
    this.messages.push(msg);
}

PageModel.prototype.setUser = function(user){
    this.users.push(user);
}

PageModel.prototype.removeUser = function(user){
    let index = this.users.indexOf(user);

    if(index == -1) return;

    for(let i = 0; i < this.messages.length; i++){
        if(this.messages[i].type != 1) continue;
        if(this.messages[i].from == user.id || this.messages[i].to == user.id)
            this.messages.splice(i, 1);
    }

    this.users.splice(index, 1);
}

/**
 * Срабатывает, если у текущей траницы нет вкладок
 * @param {Колбэк срабатывает при опустение страницы (нет вкладок с url страницы)} callback 
 */
PageModel.prototype.onEmptyListener = function(callback){
    this.onEmpty = callback;
}

/**
 * Добавляет вкладку с заданным id к url страницы
 * @param {ID TAB} id 
 */
PageModel.prototype.setTab = function(id){
    if(this.hasId(id)) return;
    this.tab_ids.push(id);
}

/**
 * Удаляет вкладку с заданым id из списка вкладок по url страницы
 * @param {ID TAB} id 
 */
PageModel.prototype.removeTab = function(id){
    let index = this.tab_ids.indexOf(id);
    if(index == -1) return;
    this.tab_ids.splice(index, 1);
    if(this.tab_ids.length == 0)
        if(this.onEmpty != undefined) 
            this.onEmpty(this.url);
}

/**
 * Определяет принадлежность вкладки к url страницы
 * @param {ID TAB} id 
 */
PageModel.prototype.hasId = function(id){
    return this.tab_ids.indexOf(id) != -1;
}