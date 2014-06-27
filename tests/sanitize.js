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
describe('sanitize',function(){

    it('should return a function',function(){
        expect(sanitize).to.be.a('function');
    })



    it('will not create a user object when no token or token invalid',function(done){
        function next(){
            req.should.not. have.ownProperty('test_user')
            done();
        }
        sanitize(req,res,next);

    });

    describe('If there is a well formatted token not expired token for a logged user',function(){

        beforeEach(function(){
            req.headers["test-token"]=helpers.CreateToken({id:1234},{plan:"basic",api_key:"mykey",logged:true},key);
            delete req.test_user;
            res.headers={};

        });


        it('will create a "test_user" object in the response stream',function(done){
            function next(){
                req.should.have.ownProperty('test_user')
                done();
            }
            sanitize(req,res,next);

        });
        it('"test_user" will have an id = "1234"',function(done){
            function next(){
                req.test_user.should.have.ownProperty('id');
                req.test_user.id.should.be.equal(1234);
                done();
            }
            sanitize(req,res,next);
       });
        it('"test_user" will have a "basic" plan',function(done){
            function next(){
                req.test_user.should.have.ownProperty('plan');
                req.test_user.plan.should.be.equal("basic");
                done();
            }
            sanitize(req,res,next);


        });
        it('"test_user" will have an api_key="mykey"',function(done){
            function next(){
                req.test_user.should.have.ownProperty('api_key');
                req.test_user.api_key.should.be.equal("mykey");
                done();
            }
            sanitize(req,res,next);

        });

        it('"test_user" will be logged',function(done){
            function next(){
                req.test_user.should.have.ownProperty('logged');
                req.test_user.logged.should.be.true;
                done();
            }
            sanitize(req,res,next);

        });

        it('"test_user.token" matches the header',function(done){
            function next(){
                req.test_user.should.have.ownProperty('token');
                req.test_user.token.should.be.equal(req.get('test-token'));
                done();
            }
            sanitize(req,res,next);

        });

        describe('if the token  has not expired',function(done){

            it('will not create a "new-token" header in the response stream',function(done){

                function next(){
                    res.headers.should.not.to.have.ownProperty("new-token");
                    done();
                }
                sanitize(req,res,next);
            });

        });

        describe('if the token has expired',function(){
            beforeEach(function(){
                req.headers["test-token"]=helpers.CreateToken({id:1234},{plan:"basic",api_key:"mykey"},key,null,null,0.005);
                delete req.test_user;
                res.headers={};
            })

            it('should provide be no user',function(done){

                function next(){
                    expect(req).not.to.have.ownProperty("test_user");
                    done();
                }
                setTimeout(function(){
                    sanitize(req,res,next);
                },2000);

            });


            it('should provide not a new token',function(done){

                function next(){
                    expect(res.headers).not.to.have.ownProperty("new-token");
                    done();
                }
                setTimeout(function(){
                    sanitize(req,res,next);
                },2000);

            });
        });

    });


});




