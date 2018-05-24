var UserModel = function(id, name){
    this._id = id;
    this._name = name
}

/** 
 * Возвращает id пользователя
*/
UserModel.prototype.getID = function(){
    return this._id;
}

/** 
 * Возвращает имя пользователя
*/
UserModel.prototype.getName = function(){
    return this._name;
}