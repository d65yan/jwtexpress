/**
 * Created by dayan on 5/12/14.
 */
var jwt=require('jwt-simple'),
    _=require('lodash');


module.exports={
    CreateToken:function(user,extra,key,idField,uname,ttl){
        ttl=ttl||60;
        uname=uname||'f_name';
        idField=idField||'id';
        if(!user || _.isEmpty(user) || !_.isObject(user) || (extra && !_.isObject(extra)) || !user[idField] || !key || !key.length){
            return null;
        }
        var cdt=Date.now();
        var obj= {
            issued: cdt,
            expires: (cdt + ttl*60*1000),
            previousToken: user.token,
            user:{}
        };
        obj.user[uname]=user[uname];
        obj.user[idField]=user[idField];

        if(extra){
            obj.user=_.extend(obj.user,extra);
        }

        return jwt.encode(obj,key);
    },
    DecryptToken:function(t,k){
        if(!t || !_.isString(t) || !t.length || !/([A-Za-z0-9]+\.[A-Za-z0-9]){2}/.test(t)){
            return null;
        }

        return jwt.decode(t,k);
    },
    CreateTracking:function(id){
        return 'track_'+Date.now()+'_'+Math.random();
    }
}


