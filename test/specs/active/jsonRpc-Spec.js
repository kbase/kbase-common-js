define([
    'kb/common/jsonRpc/genericClient',
    'kb/common/jsonRpc/exceptions',
    'kb/common/session',
    'testConfig'
], function (GenericClient, exceptions, Session, testConfig) {
    'use strict';

    function getToken(username, password) {
        var session = Session.make({
            cookieName: 'kbase_session',
            loginUrl: testConfig.services.auth.login.url
        });
        return session.login({
                username: username,
                password: password
            })
            .then(function (result) {
                return result.token;
            });
    }

    describe('Basic tests', function () {
        it('Loads', function () {
            var alive;
            if (GenericClient) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
    });

    /*
    These tests require there to be a service endpoint 
    in CI. We choose stable legacy systems.
    */

    describe('Non-authenticated Service calls - user profile', function () {
        // The profile service is publicly readable, so this is a good
        // candidate.
        var profileService = new GenericClient({
            url: testConfig.services.user_profile.url,
            module: 'UserProfile'
        });
        it('Fetch Erik\'s profile', function (done) {
            // NB: called functions take an array of positional arguments
            profileService.callFunc('get_user_profile', [
                    ['eapearson']
                ])
                .then(function (result) {
                    if (result[0].length > 1) {
                        done.fail('Too many user profiles returned - one expected');
                    } else if (result[0].length === 0) {
                        done.fail('No user profiles returned');
                    } else {
                        expect(result[0][0].user.username).toEqual('eapearson');
                        done();
                        return null;
                    }
                })
                .catch(function (err) {
                    done.fail('Error! ');
                });
        });
    });

    describe('Non-authenticated Service calls - error conditions', function () {
        // The profile service is publicly readable, so this is a good
        // candidate. 


        it('Username not found should generate null', function (done) {
            var profileService = new GenericClient({
                url: testConfig.services.user_profile.url,
                module: 'UserProfile'
            });
            profileService.callFunc('get_user_profile', [
                    ['eapearson123']
                ])
                .spread(function (result) {
                    if (result.length > 1) {
                        done.fail('Too many user profiles returned - one expected');
                    } else if (result.length === 0) {
                        done.fail('No user profiles returned');
                    } else {
                        // console.log(JSON.stringify(result, null, 3));
                        expect(result[0]).toBe(null);
                        done();
                        return null;
                    }
                })
                .catch(function (err) {
                    console.log(JSON.stringify(err, null, 2));
                    done.fail('Error! ');
                });
        });

        it('Non-existent host should generate ConnectionError', function (done) {
            var profileService = new GenericClient({
                url: 'http://12345.12345.com',
                module: 'UserProfile'
            });
            profileService.callFunc('get_user_profile', [
                    ['eapearson']
                ])
                .spread(function (result) {
                    done.fail('Should not have succeeded');
                    return null;
                })
                .catch(exceptions.ConnectionError, function (err) {
                    expect(err.xhr.status).toBe(0);
                    done();
                    return null;
                })
                .catch(function (err) {
                    done.fail('Error! ');
                });
        });

        it('Wrong url on existing service -- should generate 404', function (done) {
            var profileService = new GenericClient({
                url: 'http://localhost:8090/trigger/404',
                module: 'UserProfile',
                timeout: 1000
            });
            profileService.callFunc('get_user_profile', [
                    ['eapearson']
                ])
                .spread(function (result) {
                    done.fail('Should not have succeeded');
                    return null;
                })
                .catch(exceptions.ClientError, function (err) {
                    expect(err.xhr.status).toBe(404);
                    done();
                    return null;
                })
                .catch(function (err) {
                    console.log(JSON.stringify(err, null, 2));
                    done.fail('Error! ' + err.message);
                });
        });

        it('Detects server error -- should generate 500', function (done) {
            var profileService = new GenericClient({
                url: 'http://localhost:8090/trigger/500',
                module: 'UserProfile',
                timeout: 1000
            });
            profileService.callFunc('get_user_profile', [
                    ['eapearson']
                ])
                .spread(function (result) {
                    done.fail('Should not have succeeded');
                    return null;
                })
                .catch(exceptions.ServerError, function (err) {
                    expect(err.xhr.status).toBe(500);
                    done();
                    return null;
                })
                .catch(function (err) {
                    console.log(JSON.stringify(err, null, 2));
                    done.fail('Error! ');
                });
        });

        it('Detects down server', function (done) {
            var profileService = new GenericClient({
                url: 'http://localhost:8091',
                module: 'UserProfile',
                timeout: 1000
            });
            profileService.callFunc('get_user_profile', [
                    ['eapearson']
                ])
                .spread(function (result) {
                    done.fail('Should not have succeeded');
                    return null;
                })
                .catch(exceptions.ConnectionError, function (err) {
                    expect(err.xhr.status).toBe(0);
                    done();
                    return null;
                })
                .catch(function (err) {
                    console.log(JSON.stringify(err, null, 2));
                    done.fail('Error! ');
                });
        });

    });

    describe('Non-authenticated Service calls - workspace public', function () {
        // The profile service is publicly readable, so this is a good
        // candidate.
        it('Fetch public workspace info', function (done) {
            // NB: called functions take an array of positional arguments
            var workspaceService = new GenericClient({
                url: testConfig.services.workspace.url,
                module: 'Workspace'
            });
            workspaceService.callFunc('get_workspace_info', [{
                    id: testConfig.services.workspace.publicId
                }])
                .then(function (result) {
                    expect(result.length).toBe(1);
                    if (result.length > 1) {
                        done.fail('Too many return values - 1 expected');
                    } else if (result.length === 0) {
                        done.fail('Too few return values - 1 expected');
                    } else {
                        var info = result[0];
                        expect(info[0]).toBe(testConfig.services.workspace.publicId);
                        done();
                        return null;
                    }
                })
                .catch(function (err) {
                    console.log(err.message);
                    done.fail('Error! ');
                });
        });

        it('Fetch public workspace object info', function (done) {
            // NB: called functions take an array of positional arguments
            var workspaceService = new GenericClient({
                url: testConfig.services.workspace.url,
                module: 'Workspace'
            });
            var ref = testConfig.services.workspace.publicObjectRef;
            workspaceService.callFunc('get_object_info_new', [{
                    objects: [{
                        ref: ref
                    }]
                }])
                .then(function (result) {
                    expect(result.length).toBe(1);
                    if (result.length > 1) {
                        done.fail('Too many return values - 1 expected');
                    } else if (result.length === 0) {
                        done.fail('Too few return values - 1 expected');
                    } else {
                        var infos = result[0];
                        if (infos.length !== 1) {
                            done.fail('Expected just one object to be returned, got ' + infos.length);
                        } else {
                            var info = infos[0];
                            var foundRef = info[6] + '/' + info[0] + '/' + info[4];
                            expect(foundRef).toEqual(ref);
                            done();
                        }
                    }
                    return null;
                })
                .catch(function (err) {
                    console.log(err.message);
                    done.fail('Error! ');
                });
        });

        it('Fetch private workspace info, no auth', function (done) {
            // NB: called functions take an array of positional arguments
            var workspaceService = new GenericClient({
                url: testConfig.services.workspace.url,
                module: 'Workspace'
            });
            var id = testConfig.services.workspace.privateId;
            workspaceService.callFunc('get_workspace_info', [{
                    id: id
                }])
                .then(function (result) {
                    done.fail('Expected a public call to private workspace to fail');
                    return null;
                })
                .catch(function (err) {
                    // console.log(err.message);
                    done();
                    return null;
                });
        });
    });

    describe('Authenticated ws', function () {
        it('Fetch private workspace info, no auth', function (done) {
            // NB: called functions take an array of positional arguments
            var id = testConfig.services.workspace.privateId;
            getToken(testConfig.auth.username, testConfig.auth.password)
                .then(function (token) {
                    var workspaceService = new GenericClient({
                        url: testConfig.services.workspace.url,
                        module: 'Workspace',
                        token: token
                    });
                    return workspaceService.callFunc('get_workspace_info', [{
                        id: id
                    }])
                })
                .then(function (result) {
                    expect(result.length).toBe(1);
                    if (result.length > 1) {
                        done.fail('Too many return values - 1 expected');
                    } else if (result.length === 0) {
                        done.fail('Too few return values - 1 expected');
                    } else {
                        var info = result[0];
                        expect(info[0]).toBe(id);
                        done();
                        return null;
                    }
                })
                .catch(function (err) {
                    console.log('ERROR', err.message);
                    done.fail('Error: ' + err.message);
                });
        });



    });
});