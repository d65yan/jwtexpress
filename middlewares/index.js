"use strict";
var when=require('when');
var helpers=require('../helpers');


/**
 * Created by dayan on 4/6/14.
 */

/*var token_header_name=conf.get('TOKEN_NAME')||'TOKEN',
    token_cookie_name=conf.get('TOKEN_COOKIE')||'mappercookie',
    tracking_cookie_name=conf.get('TRACKING_COOKIE')||'ap44mtracking',
    returned_token_header=conf.get('RESTORE_CREDENTIALS_HEADER')||'X-CREDENTIALS',
    db_token=conf.get('DB_TOKEN')?1000:0;*/
    


module.exports={
    /*
    * middleware that attaches an anonymous user to the req object and generates cookies and tokens to allow app apis use.
    * @uHelper[optional]: if present tells the app is ok to try to create anonymous users in the db
    * @db_timeout[optional]: timeout after which creating a user in the db would fail and an anonymous user with id =-1 will be created
    * @token_key:key required to generate the user token
    * @extra_cookie_key[optional]: if not present no extra cookie will be generated
    * @secure[optional]: defines whether the cookies should be secured or not
    * @extra_cookie_name[optional, default="mapper"]:extra cookie name
    * @tracking_cookie_name[optional,default="trackingcookie"]: other cookie not encrypted is only used to tell if the user has been here before is a long live cookie
    * @id_field[optional, default="id"]:identification field of the user
    * @u_name[optional, default="f_name"- set on the helper function]:display field for the user
    * @req_prop_name[optional, default="sanitized_user"]:name of the property created in the req object that references the user information "req.sanitized_user" by default
    * */
    attachAuth:function(uHelper,db_timeout,token_key,extra_cookie_key,secure,extra_cookie_name,tracking_cookie_name,id_field,u_name,req_prop_name){
        extra_cookie_name=extra_cookie_name||'mappercookie';
        tracking_cookie_name=tracking_cookie_name||'trackingcookie';
        db_timeout=!uHelper?0:(db_timeout||1000);
        id_field=id_field||"id";
        req_prop_name=req_prop_name||"user";
        secure=!!secure;


        return function(req,res,next){

            var defUser={logged:false,time:Date.now()};
            defUser[id_field]=-1;

            var roads=[when(defUser).delay(db_timeout)];
            if(uHelper){
                roads.push(uHelper.Create().then(function(user){
                        var usr=defUser;
                        if(user){
                            usr=user;
                        }
                        return when.resolve(usr);
                    },
                    function(err){
                        console.log(err);
                        return when.resolve(defUser);
                    }
                ));
            }

            when.any(roads)
                .done(function(user){
                    Deliver(user);
                });

            function Deliver(user) {
                var t = helpers.CreateToken(user, null, token_key,id_field);
                var track = helpers.CreateTracking(t);
                res.cookie(tracking_cookie_name, track, {maxAge: Date.now() + 200000000, secure: secure, http_only: true});
                var tobj = {logged: false, role: 0};
                tobj[id_field] = user[id_field];
                if (extra_cookie_key) {
                    res.cookie(extra_cookie_name, helpers.CreateToken(tobj, null, extra_cookie_key), {secure: secure, http_only: true});
                }


                user.token=t;
                if(user[id_field]!==-1){
                    uHelper.Update(user,{token:t}).then(function(ouser){
                            if(ouser){
                                delete user[id_field];
                                req[req_prop_name]=user;
                            }

                            return next();
                        },
                        function(err){
                            //console.log(err);
                            return next();
                        });
                }else{
                    delete user[id_field];
                    req[req_prop_name]=user;
                    return next();
                }



            }

        };
    },


    /*
    * Reads the token from the specified header, decrypts it using the provided key and attaches a property named after the req_prop_name to the request object
    * that represents the user information. If no token it will return null and the user won't be created. it will verify the token ttl and if expired it will not generate a new token or the user
    * it takes:
    * @token_key: key to decrypt and generate tokens
    * @db_timeout[optional]: time in milliseconds after which the the db token verification would timeout, this is done to avoid crashing the app if db fails
    * @uHelper[optional]: user storage interface to manipulate user information and token verification
    * @req_prop_name[optional, default="sanitized_user"]:name of the property created in the req object that references the user information "req.sanitized_user" by default
    * @token_header_name[optional, default="TOKEN"]: name of the header containing the token
    * @returned_token_header[optional, default="X-CREDENTIALS"]: name of the header containing the newly created token to the user in case auto generation is enabled
    * @auto_generate[optional, default=false]: tells the middleware is ok or not to generate a new token out of an expired one using the token_ttl and auto_gen_window
    * @token_ttl[optional, default=1 week]: establish the time the token will be valid for the system.
    * @auto_gen_window[optional, default=5 minutes]: valid time window in which a token can be regenerated after it expires if auto_generate option is true
    * @id_field[optional, default="id"]:identification field of the user
    * @u_name[optional, default="f_name"- set on the helper function]:display field for the user
    * */
    sanitize:function(token_key,db_timeout,uHelper,req_prop_name,token_header_name,returned_token_header,auto_generate,token_ttl,auto_gen_window,id_field,u_name){

        req_prop_name=req_prop_name||'sanitized_user';
        token_header_name=token_header_name||'TOKEN';
        returned_token_header=returned_token_header||'X-CREDENTIALS';
        auto_generate=!!auto_generate;
        token_ttl=token_ttl||(7*24*60*60*1000);
        auto_gen_window=auto_gen_window||(5*60);
        auto_gen_window=auto_gen_window*1000;
        id_field=id_field||"id";
        return function(req,res,next){
            //console.log('sanitizing');

            var t= req.get(token_header_name);
            if(!t){
                return next();
            }


            var dto=helpers.DecryptToken(t,token_key);
            if(!dto || !dto.user){
                return next();
            }
            var defUser=dto.user;
            var roads=[when(defUser).delay(db_timeout)];
            if(uHelper){
                roads.push(uHelper.Get({token:t}).then(function(user){
                        if(!user){return when.reject(new Error('Unauthorized Access'));}
                        return user;
                    },
                    function(){
                        return when.resolve(defUser);
                    }
                ));

            }


            when.any(roads).
                done(function(user){

                    var cdate=Date.now();
                    if(dto.expires<cdate){
                        if(!auto_generate || (auto_gen_window+dto.expires)<cdate){
                            return next();
                        }

                        t=helpers.CreateToken(user,null,token_key,id_field,u_name,token_ttl);
                        if(uHelper){
                            var uobj={};
                            uobj[id_field]=user[id_field];
                            uHelper.Update(uobj,{token:t});
                        }
                        res.set(returned_token_header,t);

                    }
                    else{
                        user.logged=dto.user.logged;
                    }
                    user.token=t;
                    req[req_prop_name]=user;
                    return next();
                },
                function(err){
                    req.error=err;
                    return next();
                }
            );

        };
    },

    /*
    * This middleware filters out the invalid users and launches the fail function
    *
    * @req_prop_name[optional default="sanitized_user"]: req object property that would contain user information
    * @fail: callback function that would be called in case no user present in the request. this callback will take the response object as a parameter.
    *
    * */
    onlyValidUsers:function(req_prop_name,fail){

        req_prop_name=req_prop_name||'sanitized_user';

        return function(req,res,next){
            //('verifying');
            //console.log(req.originalBaseUrl);
            if(!req[req_prop_name]){
                return fail(res);
            }
            return next();
        };

    },

    /*
     * This middleware filters out the non logged users and launches the fail function if an unauthorize access
     *
     * @req_prop_name[optional default="sanitized_user"]: req object property that would contain user information
     * @errorFn: callback function that would be called in case no user present in the request or  the user is
     * not logged. this callback will take the response object as a parameter.
     *
     * */
    onlyRegistered:function(errorFn,req_prop_name){
        req_prop_name=req_prop_name||'sanitized_user';
        return function(req,res,next){

            if(!req[req_prop_name] || !req[req_prop_name].logged){
                errorFn(res);
                return;
            }
            return next();

        };
    },

    /*
    * this middleware deals with token authentication based on a cookie, this is done to maintain access controll over
    * resources that won't let the headers be manipulated, like the images in openlayers so we can monitor their usage.
    * this cookie will be sort of a session cookie with minimal user information and won't be persistent, it will also
    * be secure and http_only. the token that this cookie holds will have the same expiration time the main auth token
    * but is not open for renewal for now.
    *
    * @cookie_key: key to use to decrypt the cookie
    * @req_prop_name[optional, default="sanitized_user"]: property name where the req stream will hold the user data
    * @token_cookie_name[optional, default="mappercookie"]:name provided to the token cookie
    *
    * */
    auxiliaryCookieSanitize:function(cookie_key,req_prop_name,token_cookie_name){
        req_prop_name=req_prop_name||'sanitized_user';
        token_cookie_name=token_cookie_name||'mappercookie';
        return function(req,res,next){
            var t= req.cookies[token_cookie_name];
            if(!t){
               return next();
            }
            var dto=helpers.DecryptToken(t,cookie_key);
            var cdate=Date.now();
            if(dto.expires>cdate){
                req[req_prop_name]=dto.user;
            }
            else{
                res.cookie(token_cookie_name,null,{maxAge:-3000000});
            }
            return next();
        };
    },

    /*
    * */
    throttle:function(name,towait,limit,storage,db_timeout,failFn,req_prop_name,token_header_name){
        var apiName=name;
        var apLimit=limit;
        req_prop_name=req_prop_name||'sanitized_user';
        token_header_name=token_header_name||'TOKEN';
        return function(req,res,next){
            if(!storage){
                return next();
            }

            if(!req[req_prop_name] || !req[req_prop_name].token){
                failFn(res);
            }


        var ip=req.get('X-FORWARDED-FOR')|| req.connection.remoteAddress;

        function blacklistit(markgap,count){
            var obj={last_hit:Date.now(),count:count+1}
            if(markgap<=60000){
                if(count>limit){
                    storage.BlackListIt({user_token:token,ip:ip,api:name,hits:count });
                    return true;
                }
            }
            else
            return false;
        }



        var token=req.get(token_header_name);
        var paths=[when(true).delay(db_timeout)];

        var db_path=storage.Get({api:name,user_token:token}).
            then(function(record){
                if(!record){
                    return storage.Create({api:name,user_token:token,last_hit:Date.now(),marker:Date.now(),count:1});
                }
                var tstamp=Date.now();
                var count=+record.count;
                var markgap=tstamp-(+record.marker);
                var hitgap=tstamp-(+record.last_hit);
                count++;

                //console.log(hitgap);

                if((hitgap/1000)<towait){
                    record.last_hit=tstamp;
                    record.count=count;
                    storage.Save(props);
                    blacklistit(markgap,count);
                    return when.reject({blacklisted:true});
                }




                if(blacklistit(markgap,count)){
                    return when.reject({blacklisted:true});
                }


                if(markgap>60000){
                    record.count=1;
                    record.marker=tstamp;
                }
                else{
                    record.count=count;
                    record.last_hit=tstamp;

                }

                return storage.Save(record);

            });
            paths.push(db_path);
            when.any(paths).then(next,failFn(res));
    };
},
    applyRole:function(obj,req_prop_name){
        req_prop_name=req_prop_name||'sanitized_user';
        obj=obj||{};
        return function(req,res,next){
            var role="anonymous";
            if(req[req_prop_name].logged){
                role="registered"
                if(req[req_prop_name].plan){
                    role="premium";
                }
            }
            req[req_prop_name].access=obj[role];
            req[req_prop_name].api_key=req[req_prop_name].api_key||obj.anonymous.api_key;
            return next();
        }

    },
}