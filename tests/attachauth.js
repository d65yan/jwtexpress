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


describe('attachAuth',function(){





    describe('using extra cookie',function(){

        var authMid=middlewares.attachAuth(null,null,key,key,true,'sample_cookie',null,"uid",null,"new_user");

        beforeEach(function(){
            req.headers={};
            delete req.new_user;
            res.headers={};
            res.cookies={};

        });


        describe('sample_cookie should',function(){
            it('be there',function(){
                function next(){
                    res.cookies.should.have.ownProperty('sample_cookie');
                }
                authMid(req,res,next);
            });
            it('be secure',function(done){

                function next(){
                    res.cookies.sample_cookie.options.secure.should.be.equal(true);
                    done();
                }
                authMid(req,res,next);
            });

        });

        describe("req.new_user should",function(){
            it('be there',function(done){
                function next(){
                    req.should.have.ownProperty('new_user');
                    done();
                }
                authMid(req,res,next);
            });

            it('have a not null token',function(done){
                function next(){
                    expect(req.new_user.token).not.to.be.null;
                    done();
                }
                authMid(req,res,next);
            });

        });

    });

    describe('using with no extra cookie',function(){

        var authMid=middlewares.attachAuth(null,null,key,key,true,null,null,"uid",null,"new_user");

        beforeEach(function(){
            req.headers={};
            delete req.new_user;
            res.headers={};
            res.cookies={};

        });


        it('should not be extra cookie',function(){
            function next(){
                res.cookies.should.not.have.ownProperty('sample_cookie');
            }
            authMid(req,res,next);
        });
        it('should be a tracking cookie',function(done){
            function next(){
                res.cookies.should.have.ownProperty('trackingcookie');
                done();
            }
            authMid(req,res,next);
        });

        describe("req.new_user should",function(){
            it('be there',function(done){
                function next(){
                    req.should.have.ownProperty('new_user');
                    done();
                }
                authMid(req,res,next);
            });

            it('have a not null token',function(done){
                function next(){
                    expect(req.new_user.token).not.to.be.null;
                    done();
                }
                authMid(req,res,next);
            });


        });

    });


});

