var Server = function(protocol, host, port){
    this.socket = io(protocol + '://' + host + ':' + port);
    this.listeners = {};
    this.registrateSocket(this.socket);    
}

/**SOCKET ON */
Server.prototype.registrateSocket = function(socket){
    let _this = this;

    let msgs = [
        'register_user_complete',
        'change_name_complete'
    ];

    msgs.forEach(msg => {
        socket.on(msg, (resp)=>{
            _this.listeners[msg](resp);
        });    
    });
} 

/**ADD LISTENERS */

Server.prototype.onErrorListener = function(callback){
    this.listeners['on_error'] = callback;
}

Server.prototype.onRegisterClientCompleteListener = function(callback){
    this.setListener('register_user_complete', callback);
}

Server.prototype.onRegisterPageCompleteListener = function(callback){

}

Server.prototype.onChangeNameComplete = function(callback){
    this.setListener('change_name_complete', callback);
}

Server.prototype.setListener = function(cmd, callback){
    let _this = this;
    this.listeners[cmd] = (resp) => {
        if(resp.type === 'ERROR'){
            if(_this.listeners['on_error']) _this.listeners['on_error'](resp.msg);
            return;
        }
        callback(resp.data);
    };
}

/**ADD LISTENERS */

/**EMIT COMMANDS */

/**Регистрация пользователя на сервере */
Server.prototype.registerUser = function(user_name){
    this._sendRequest('register_user', {
        'id': '',
        'name': user_name
    })
}


/**Изменение имени пользователя */
Server.prototype.changeName = function(new_name){
    this._sendRequest('change_name', new_name);
}


/** Отключение пользователя */
Server.prototype.exit = function(){
    this.socket.emit('disconnect');
}


/**EMIT COMMANDS */

Server.prototype.unregisterPage = function(url, callback){
    this._updateListener('unregister_page_complete', callback);
    this.socket.emit('unregister_page', { 'url': url });
}

Server.prototype.registerNewPage = function(page, callback){
    this._updateListener('register_page_complete', callback);
    this.socket.emit('register_new_page', { 'data': page });
}


Server.prototype._sendRequest = function(cmd, data){
    this.socket.emit(cmd, {
        'time': Date.now() / 1000, 
        'data': data
    });
}
