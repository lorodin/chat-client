var UserModel = function(id, name, time_z){
    this._id = id;
    this._name = name
    this._time_z = time_z;
}

UserModel.prototype.getTimeZone = function(){
    return this._time_z;
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