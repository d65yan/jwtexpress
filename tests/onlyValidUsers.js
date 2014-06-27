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

describe('onlyValidUser',function(){


    it('should return a function',function(){
        var valid=middlewares.onlyValidUsers();
        expect(valid).to.be.a('function');
    });

    describe('if valid user',function(){
        afterEach(function(){
            req.headers={};
            delete req.test_user;
            res.headers={};
        });

        it('should call next',function(done){
            function next(){
                expect(true).to.be.equal(true);
                done();
            }
            function fail(){
                expect(true).to.be.equal(false);
                done();
            }
            req.headers["test-token"]=helpers.CreateToken({id:1234},{plan:"basic",api_key:"mykey"},key);
            sanitize(req,res,function(){
                middlewares.onlyValidUsers('test_user',fail)(req,res,next);
            });


        });
    });
    describe('if no valid user',function(){
        it('should call fail',function(done){
            function next(){
                expect(false).to.be.equal(true);
                done();
            }
            function fail(){
                expect(true).to.be.equal(true);
                done();
            }
            sanitize(req,res,function(){
                middlewares.onlyValidUsers('test_user',fail)(req,res,next);
            });


        });
    });
});


