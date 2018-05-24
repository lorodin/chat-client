var Server = function(protocol, host, port){
    this.socket = io(protocol + '://' + host + ':' + port);
    this._makeListeners();
}

Server.prototype.registerUser = function(user_name, callback){
    this._updateListener('register_user_complete', callback);
    this.socket.emit('register_user', { 'name': user_name });
    console.log('register user from bg.server, user_name: ' + user_name);
}

Server.prototype.changeName = function(new_name, callback){
    this._updateListener('change_name_complete', callback);
    this.socket.emit('change_name', { 'name': new_name });
}

Server.prototype.exit = function(){
    this.socket.emit('disconnect');
}

Server.prototype.unregisterPage = function(url, callback){
    this._updateListener('unregister_page_complete', callback);
    this.socket.emit('unregister_page', { 'url': url });
}

Server.prototype.registerNewPage = function(page, callback){
    this._updateListener('register_page_complete', callback);
    this.socket.emit('register_new_page', { 'data': page });
}

Server.prototype._updateListener = function(cmd, callback){
    if(!cmd || this.actions.indexOf(cmd) == -1) return;
    if(!callback) return;

    this.listeners[cmd] = callback;
}

Server.prototype._makeListeners = function(){
    this.listeners = {
        'register_user_complete': undefined ,
        'register_page_complete': undefined,
        'unregister_page_complete': undefined,
        'change_name_complete': undefined
    };

    this.actions = [
        'register_user_complete',
        'register_page_complete',
        'unregister_page_complete',
        'change_name_complete'
    ]

    let _this = this;

    for(let i = 0; i < this.actions.length; i++){
        this.socket.on(this.actions[i], (data) => {
            if(_this.listeners[_this.actions[i]] != undefined) 
               _this.listeners[_this.actions[i]](data);
        });
    }
}