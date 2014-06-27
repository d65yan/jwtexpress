"use strict";

/**
 * Created by dayan on 5/20/14.
 */
module.exports={
    getReq:function(){
        return {
            headers:{},
            get:function(name){
                return this.headers[name];
            },
            cookies:[],
            params:{},
            query:{}
        };
    },
    getRes:function(){
        return {
            cookies:{},
            cookie:function(name,value,object){
                this.cookies[name]={
                    value:value,
                    options:object
                };
            },
            headers:{},
            set:function(k,v) {
                this.headers[k]=v;
            }
        };
    }
}