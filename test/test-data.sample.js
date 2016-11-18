/*
copy this file to test-data.js
fill in the values specific for your test:
username and password for a kbase acocunt to be used for authorized access tests
if you want to test against specific services or not in ci, change the urls
you'll want to set up the ids and references based on what is available
in the test environment
you may want to keep a copy of this outside of the repo for quickly setting up
tests.
*/
define('testConfig', [], function () {
    return {
        auth: {
            username: 'USERNAME',
            password: 'PASSWORD'
        },
        services: {
            user_profile: {
                url: 'https://ci.kbase.us/services/user_profile/rpc'
            },
            workspace: {
                url: 'https://ci.kbase.us/services/ws',
                publicId: 13388,
                publicObjectRef: '13388/1/1',
                privateId: 13499
            },
            auth: {
                login: {
                    url: 'https://ci.kbase.us/services/authorization/Sessions/Login'
                }
            }
        }
    }
});