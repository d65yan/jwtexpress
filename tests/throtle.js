"use strict";
/**
 * Created by dayan on 5/20/14.
 */
var chai=require('chai');
var expect=chai.expect;
var should=chai.should();
var middlewares=require('../middlewares/index');
var helpers=require('../helpers/index');
var key=require('./stubs/constants').token_key;
var stubs=require('./stubs/http_streams');

var req=stubs.getReq();
var res=stubs.getRes();

var sanitize=middlewares.sanitize(key,0,null,"test_user","test-token","new-token");
var token;
describe('throttle',function(){

    beforeEach(function(done){
        req.headers["test-token"]="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3N1ZWQiOjE0MDA3Nzc3MDI4NjYsImV4cGlyZXMiOjE0MDA3Nzg5MDI4NjYsInVzZXIiOnsiaWQiOjEyMzQsInBsYW4iOiJiYXNpYyIsImFwaV9rZXkiOiJteWtleSJ9fQ.2C1J7ZCUjIG1dIdhi3g8cZ8Elyjz5JwGPW3VYUeH7e4";//helpers.CreateToken({id:1234},{plan:"basic",api_key:"mykey"},key,null,null,20);
        req.headers["X-FORWARDED-FOR"]='1.1.1.1';
        req.connection={remoteAddress:'1.1.1.1'};
        delete req.test_user;
        sanitize(req,res,done);
    })

    it('should return a function',function(){
        expect(middlewares.throttle()).to.be.a('function');
    });

    describe('single call',function(){
        var vault=require('./stubs/throttle_storage')();//getting a new instance of tha vault spy;


        beforeEach(function(done){
            middlewares.throttle("myapi",200,30,vault,30,function(){done();},'test_user','test-token')(req,res,done);
        })

        /*describe('req.test_user',function(){
            it('should be there',function(){
                expect(req).to.have.ownProperty('test_user');
                expect(req.test_user).to.have.ownProperty('token');
                expect(req.test_user.token).to.be.equal(req.get('test-token'));
            });
        })*/

        describe('vault',function(){
            describe('should call Get',function(){
                it('once',function(){
                    expect(vault.Get.callCount).to.be.equal(1);
                });
                it('its argument object should have a user_token',function(){
                    expect(vault.Get.args[0][0]).to.have.ownProperty('user_token');
                });
                it('its argument object.user_token should be the same as the req.test_user.token',function(){
                    expect(vault.Get.args[0][0].user_token).to.be.equal(req.test_user.token);
                });
            });
            describe('should call Create',function(){
                it('once',function(){
                    expect(vault.Create.callCount).to.be.equal(1);
                });
                it('its argument object should have a user_token',function(){
                    expect(vault.Create.args[0][0]).to.have.ownProperty('user_token');
                });
                it('its argument object.user_token should be the same as the req.test_user.token',function(){
                    expect(vault.Create.args[0][0].user_token).to.be.equal(req.test_user.token);
                });
            });
           describe('should not call Update',function(){
                it('once',function(){
                    expect(vault.Update.callCount).to.be.equal(0);
                });
            });

            describe('should not call BlackListeIt',function(){
                it('once',function(){
                    expect(vault.BlackListIt.callCount).to.be.equal(0);
                });
            });

        });


    });

    describe('2 calls closer than what they should',function(){
        var vault=require('./stubs/throttle_storage')();//getting a new instance of tha vault spy;


        beforeEach(function(done){
            var throttle=middlewares.throttle("myapi",200,30,vault,30,function(){done();},'test_user','test-token')
            throttle(req,res,function(){
                throttle(req,res,done);
            });
        })

        /*describe('req.test_user',function(){
            it('should be there',function(){
                expect(req).to.have.ownProperty('test_user');
                expect(req.test_user).to.have.ownProperty('token');
                expect(req.test_user.token).to.be.equal(req.get('test-token'));
            });
        })*/

        describe('vault',function(){
            describe('should call Get',function(){
                it('once',function(){
                    expect(vault.Get.callCount).to.be.equal(2);
                });
                it('its argument object should have a user_token',function(){
                    expect(vault.Get.args[0][0]).to.have.ownProperty('user_token');
                });
                it('its argument object.user_token should be the same as the req.test_user.token',function(){
                    expect(vault.Get.args[0][0].user_token).to.be.equal(req.test_user.token);
                });
            });
            describe('should call Create',function(){
                it('once',function(){
                    expect(vault.Create.callCount).to.be.equal(1);
                });
                it('its argument object should have a user_token',function(){
                    expect(vault.Create.args[0][0]).to.have.ownProperty('user_token');
                });
                it('its argument object.user_token should be the same as the req.test_user.token',function(){
                    expect(vault.Create.args[0][0].user_token).to.be.equal(req.test_user.token);
                });
            });
           describe('should call Update',function(){
                it('once',function(){
                    expect(vault.Update.callCount).to.be.equal(1);
                });
            });

            describe('should not call BlackListeIt',function(){
                it('once',function(){
                    expect(vault.BlackListIt.callCount).to.be.equal(0);
                });
            });

        });


    });




});




