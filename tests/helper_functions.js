"use strict";
/**
 * Created by dayan on 5/20/14.
 */
var chai=require('chai');
var expect=chai.expect;
var should=chai.should();
var helpers=require('../helpers/index');
var key=require('./stubs/constants').token_key;


describe('Helper function',function(){

        describe('createToken',function(){
            it('should be null when no user',function(){
                    var token=helpers.CreateToken(null,null,key);
                    expect(token).to.be.null;
            });
            it('should be null when user not an object',function(){
                var token=helpers.CreateToken(123,null,key);
                expect(token).to.be.null;
            });
            it('should be null when no user id',function(){
                var token=helpers.CreateToken({},null,key);
                expect(token).to.be.null;
            });
            it('should be null when no token',function(){
                var token=helpers.CreateToken({id:123});
                expect(token).to.be.null;
            });

            describe('should be',function(){
                var token;
                beforeEach(function(){
                    token=helpers.CreateToken({id:1234},null,key);
                });
                it('a string',function(){
                    expect(token).to.be.a('string');
                });
                it(' with 2 points ',function(){
                    var array=token.split('.');
                    expect(array.length).to.equal(3);
                });
            });

        });
        describe('DecryptToken',function(){
            describe('should be null when ', function(){
                it('token is empty',function(){
                    var token=helpers.DecryptToken("",key);
                    expect(token).to.be.null;
                });
                it('no token',function(){
                    var token=helpers.DecryptToken(null,key);
                    expect(token).to.be.null;
                });
                it('token does not have 2 separated dotsin the body but not at the beggining nor the end',function(){
                    var token=helpers.DecryptToken("sdfsdfsadfasdfasdfds.ddegsdfgdsgsdfgdf.",key);
                    expect(token).to.be.null;
                });
            });
            describe('should be ', function(){
                var dto;
                    beforeEach(function(){
                        dto=helpers.DecryptToken(helpers.CreateToken({id:1234},{name:'test user'},key),key);
                    });
                it('an object',function(){

                    expect(dto).to.be.an('object');
                });
                it('contain an user',function(){

                    expect(dto).to.have.a.ownProperty('user');
                });
                describe('and each user',function(){
                    var user;
                    beforeEach(function(){
                        user=dto.user;
                    })
                    it('with a 123 id',function(){
                        user.should.have.ownProperty('id');
                        expect(user.id).to.be.equal(1234);
                    });
                    it('and name = "test user"',function(){
                        user.should.have.ownProperty('name');
                        expect(user.name).to.be.equal("test user");
                    });
                });

            });
        });
})