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

var cookie_sanitize=middlewares.auxiliaryCookieSanitize(key,'test_user','test_cookie');
var mainAuth=middlewares.attachAuth(null,0,key,key,true,"test_cookie",null,null,null,'test_user');
var token;
describe('auxiliaryCookieSanitize',function(){

    it('should return a function',function(){
        expect(cookie_sanitize).to.be.a('function');
    })

    describe('valid cookie',function(){
        beforeEach(function(done){
            delete req.test_user;
            req.cookies={};
            mainAuth(req,res,function(){
                for(var i in res.cookies){
                    req.cookies[i]=res.cookies[i].value;
                }

                done();
            });

        });
        it('is there',function(){
            expect(res.cookies).to.have.ownProperty('test_cookie');
        });

        it('should produce a req.tes_user',function(done){
            function next(){
                expect(req).to.have.ownProperty('test_user');
                done();
            }

            cookie_sanitize(req,res,next);
        });

        it('req.tes_user should be an object',function(done){
            function next(){
                expect(req.test_user).to.be.a('object');
                done();
            }
            cookie_sanitize(req,res,next);
        });

        it('req.tes_user should have an id',function(done){
            function next(){
                expect(req.test_user).to.have.ownProperty('id');
                done();
            }
            cookie_sanitize(req,res,next);
        });



    });

});




