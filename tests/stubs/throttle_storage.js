"use strict";
/**
 * Created by dayan on 5/21/14.
 */
var when=require('when');
var sinon=require('sinon');
var _=require('lodash');
function createVault(){
    var vault={};
    var blacklistedTokens=[];
    var blacklistedIPs=[]
    var obj={
        Create:function(obj){
            vault[obj.user_token]=obj;
            return when.resolve(obj);
        },
        Update:function(idObj,dataObj){
            if(!vault[idObj]){
                return when.resolve();
            }
            for(var i in dataObj){
                vault[idObj][i]=dataObj[i];
            }
            return when.resolve(vault[iObj]);
        },
        Get:function(obj){
            if(!obj || _.isEmpty(obj)){
                return when.reject(new Error('invalid arguments'));
            }

            var lid;
            var i;
            var elem;
            var j;
            var matches=true;
            for(var i in vault){
                elem=vault[i];
                matches=true;
                for(j in obj){
                    matches=matches && (obj[i]==elem[i]);
                }
                if(matches){
                    return when.resolve(elem);
                }

            }
            return when.resolve();
        },
        Delete:function(id){},
        BlackListIt:function(obj){
            if(!obj.user_token || !obj.user_token.ip){
                return when.resolve(false);
            }

            if(blacklistedTokens.indexOf(obj.user_token)<0){
                blacklistedTokens.push(obj.user_token);
            }

            if(blacklistedIPs.indexOf(obj.ip)<0){
                blacklistedIPs.push(obj.ip);
            }

            return when.resolve(true);

        },
        isBlackListed:function(obj){
            if(!obj || _.isEmpty(obj)){
                return when.reject(new Error('invalid arguments'));
            }

            return when.resolve(blacklistedIPs.indexOf(obj.ip)>=0 || blacklistedTokens.indexOf(obj.user_token)>=0);
        }



    };

    return {

        Create:sinon.spy(obj.Create),
        Get:sinon.spy(obj.Get),
        Update:sinon.spy(obj.Update),
        BlackListIt:sinon.spy(obj.BlackListIt),
        isBlackListed:sinon.spy(obj.isBlackListed)
    };

}


module.exports=createVault;