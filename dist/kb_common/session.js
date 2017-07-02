define([
    'jquery',
    'bluebird',
    './cookie'
], function (
    $,
    Promise,
    Cookie) {
    'use strict';

    function factory(cfg) {
        var version = '0.2.0',
            config = cfg || {},
            cookieName = config.cookieName,
            cookieMaxAge = config.cookieMaxAge || 36000,
            loginUrl = config.loginUrl,
            extraCookies = config.extraCookies,
            sessionObject,
            cookieManager = Object.create(Cookie).init({ doc: document });

        // Implementation Methods

        /**
         * The canonical kbase session object, based on the kbase session
         * cookie, but removing a duplicated field and adding the parsed
         * token.
         *
         * @typedef {Object} SessionObject
         * @property {string} user_id
         * @property {string} realname
         * @property {string} token
         * @property {string} sessionId
         * @property {TokenObject} tokenObject
         */

        /**
         * The token object as supplied by the Globus auth service.
         * @todo: document the remainder of the fields
         *
         * @typedef {Object} TokenObject
         * @property {string} un
         * @property {string} expiry
         *
         */

        function getVersion() {
            return version;
        }

        /**
         *
         * The traditional KBase session layout, reflecting the fields set
         * in the browser cookie.
         *
         *
         * @typedef {Object} KBaseSessionObject
         * @property {string} token - The Globus auth token
         * @property {string} un - username as extracted from the Globus auth token
         * @property {string} user_id - same as un
         * @property {string} name - The user "full name" (globus) or
         * "user name" (kbase). Deprecated - user name should be taken from
         * the user profile. (See xxx)
         * @property {string} kbase_sessionid - Issued by the auth server,
         * used to uniquely identify this session amongst all other extant
         * sessions. ???
         * @todo Where is kbase_sessionid used??? Not in ui-common ..
         *
         */


        /**
         * An object representation of the Globus authentication token.
         *
         * @typedef {Object} GlobusAuthToken
         *
         */

        /**
         * Decodes a Globus authentication token, transforming the token
         * plain string into a map of field names to values.
         *
         * @function decodeToken
         * @private
         *
         * @param {string} - A globus auth token
         *
         * @returns {GlobusAuthToken} an object representing the decoded
         * token.
         */
        function decodeToken(token) {
            var parts = token.split('|'),
                map = {},
                i,
                fieldParts, key, value;
            for (i = 0; i < parts.length; i += 1) {
                fieldParts = parts[i].split('=');
                key = fieldParts[0];
                value = fieldParts[1];
                map[key] = value;
            }
            return map;
        }

        /**
         * Determines if the session has expired by inspection of the expiry.
         *
         * @function hasExpired
         * @private
         *
         * @param {SessionObject} - a session object
         * @returns {boolean} true if the session has expired, false otherwise.
         */
        function hasExpired(sessionObject) {
            var expirySec = sessionObject.tokenObject.expiry;
            if (!expirySec) {
                return false;
            }
            expirySec = parseInt(expirySec, 10);
            if (isNaN(expirySec)) {
                return false;
            }
            var expiryDate = new Date(expirySec * 1000);
            var diff = expiryDate - new Date();
            if (diff <= 0) {
                return true;
            }
            return false;
        }

        /**
         * Given a session object, ensure that it is valid, to best of our
         * ability. It serves as the gateway between the externally stored
         * session cookie, and the internally stored session object.
         *
         * It probably should not be the responsibility of the front end
         * to front end to evaluate the session -- that should be conducted
         * by a back-end service -- but this is the way it works now.
         *
         * Validation consists of ensuring that the session object is complete,
         * and that it has not expired. The expiration date derives from the
         * Globus auth token. The evaluation of this is one of my bigger
         * problems.
         *
         * @function validateSession
         * @private
         *
         * @param {Object} - the prospective session object
         * @returns {boolean} - if the session is valid.
         */
        function validateSession(sessionObject) {
            if (sessionObject === undefined) {
                sessionObject = sessionObject;
            }
            if (!sessionObject) {
                return false;
            }

            if (!(sessionObject.sessionId && sessionObject.username && sessionObject.token && sessionObject.tokenObject)) {
                return false;
            }

            if (hasExpired(sessionObject)) {
                return false;
            }
            return true;
        }

        /**
         * Creates an session cookie string from the current session cookie.
         *
         * @todo this is not a very good encoding method; needs to be fixed
         * @todo e.g. a field value which also contains delimiters.
         *
         * @function makeSessionCookie
         * @private
         *
         * @returns {string|null} a session object formatted into a string
         * suitable for transport in a cookie.
         */
        function makeSessionCookie() {
            var cookie = '';
            cookie += 'un=' + sessionObject.username;
            cookie += '|kbase_sessionid=' + sessionObject.sessionId;
            cookie += '|user_id=' + sessionObject.username;
            cookie += '|token=' + sessionObject.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g, 'PIPESIGN');
            return cookie;
        }
        /**
         * Create and set a session cookie in the browser.
         *
         * Adds kbase_session cookie to browser
         * Adds kbase_session object to local storage
         *
         * @function setSessionCookie
         * @private
         *
         * @returns {undefined} nothing
         */
        function setSessionCookie() {
            if (sessionObject) {
                var cookieString = makeSessionCookie();
                cookieManager.setItem(cookieName, cookieString, cookieMaxAge, '/');
                if (extraCookies) {
                    extraCookies.forEach(function (extraCookie) {
                        cookieManager.setItem(extraCookie.name, cookieString, cookieMaxAge, '/', extraCookie.domain);
                    });
                }
                var kbaseSession = makeKbaseSession();
                // This is for compatability with the current state of the narrative ui, which uses this
                // as a flag for being authenticated.
                kbaseSession.success = 1;
            }
        }

        /**
         * Forces the session object to be re-imported from the browser
         * cookie. Designed to be used by clients which want to ensure that
         * they have the very latest session.
         *
         * @function refreshSession
         * @public
         *
         * @returns {SessionObject} the current session object.
         */
        function refreshSession() {
            setSession(importFromCookie());
            return sessionObject;
        }

        /**
         * Returns the "KBase Session", for legacy usage. The legacy method
         * of accessing the session is to work directly with a session object,
         * rather than the api.
         *
         * @function getKBaseSesssion
         * @public
         *
         * @returns {KBaseSessionObject}
         */
        function getKbaseSession() {
            refreshSession();
            if (!sessionObject) {
                return null;
            }
            return makeKbaseSession();
        }

        function makeKbaseSession() {
            if (!sessionObject) {
                return null;
            }
            return {
                un: sessionObject.username,
                user_id: sessionObject.username,
                name: sessionObject.realname,
                token: sessionObject.token,
                kbase_sessionid: sessionObject.sessionId
            };
        }

        /**
         * Removes all traces of of the session from the users browser
         *
         * @function removeSession
         * @private
         *
         * @returns {undefined} nothing
         */
        function removeSession() {
            var cookies = cookieManager.getCookies();

            // Main kbase cookie.
            cookieManager.removeItem(cookieName, '/');

            // Extras
            if (extraCookies) {
                extraCookies.forEach(function (extraCookie) {
                    cookieManager.removeItem(extraCookie.name, extraCookie.path || '/', extraCookie.domain);
                });
            }

            // And any others set by third party code on this host only.
            // Note that this may leave cookies on the domain level, but since those
            // cookies may be shared across kbase deployments, we shouldn't do that 
            // until we have more control over cookie namespacing.
            cookies.forEach(function (cookie) {
                cookieManager.removeItem(cookie.name, '/');
                // ookieManager.removeItem(cookie.name, '/', 'kbase.us');
            });

            sessionObject = null;
        }



        /**
         * Attempt to set the internal session object from the given
         * session object.
         *
         * @function setSession
         * @private
         *
         * @param {SessionObject} obj - a session object
         * @returns {undefined}
         */
        function setSession(obj) {
            if (validateSession(obj)) {
                sessionObject = obj;
            } else {
                sessionObject = null;
            }
        }

        /**
         * Extract the cookie from the browser environment, parse it, and
         * validate it. This is the canonical interface betweek KBase ui
         * code and browser authentication.
         *
         * @function importSessionFromCookie
         * @private
         *
         * @returns {SessionObject|null} a kbase session object or null
         * if there is no valid session cookie.
         */
        function importFromCookie() {
            var sessionCookies = cookieManager.getItems(cookieName),
                sessionCookie;

            if (!sessionCookies || sessionCookies.length === 0) {
                return null;
            }
            // if (sessionCookies.length > 1) {
            //     removeSession();
            //     return null;
            // }
            sessionCookie = sessionCookies[0];

            // first pass just break out the string into fields.
            var session = decodeToken(sessionCookie);

            if (!(session.kbase_sessionid && session.un && session.user_id && session.token)) {
                removeSession();
                return null;
            }
            session.token = session.token.replace(/PIPESIGN/g, '|').replace(/EQUALSSIGN/g, '=');

            // now we have a session object equivalent to the one returned by the auth service.
            var newSession = {
                username: session.user_id,
                token: session.token,
                tokenObject: decodeToken(session.token),
                sessionId: session.kbase_sessionid
            };

            if (validateSession(newSession)) {
                return newSession;
            } else {
                return null;
            }
        }
        /**
         * Creates a valid standard Session Object from a raw session object
         * provided by Globus.
         *
         * @function importSessionFromAuthObject
         * @private
         *
         * @param {KBaseSessionObject} kbaseSession - the session object
         * returned from the KBase auth server
         * @returns {SessionObject|null} a validated Session Object, or null
         * if no session or an invalid session was provided.
         */
        function importFromAuthObject(kbaseSession) {
            // Auth object has fields un, user_id, kbase_sessionid, token. If any are missing, we void the session (if any)
            // cookies and pretend we have nothing.
            // NB: the object returned from the auth service does NOT have the un field.
            if (!(kbaseSession.kbase_sessionid && kbaseSession.user_id && kbaseSession.token)) {
                removeSession();
                return null;
            }
            var newSession = {
                username: kbaseSession.user_id,
                realname: kbaseSession.name,
                token: kbaseSession.token,
                tokenObject: decodeToken(kbaseSession.token),
                sessionId: kbaseSession.kbase_sessionid
            };

            if (validateSession(newSession)) {
                return newSession;
            }
            return null;
        }

        /**
         * typedef {Object} LoginCredentials
         * @property {string} username - the username
         * @property {string} password - the password
         *
         */

        /**
         * Authenticate a user give a username and password with the kbase
         * auth service.
         * Named "login" for legacy purposes.
         *
         * @function login
         * @public
         *
         * @param {LoginCredentials} options - a authentication credentials, as would
         * be passed in from a login dialog.
         *
         */
        function login(options) {
            return new Promise(function (resolve, reject) {
                // Uses the options args style, with success and error callbacks.
                // The top layer of kbase widgets do not have Q available.

                // Validate params.
                if (!options.username || options.username.length === 0) {
                    reject('Username is empty: It is required for login');
                    return;
                }
                if (!options.password || options.password.length === 0) {
                    reject('Password is empty: It is required for login');
                    return;
                }

                // Convert the username to lower case, in case the user typed in
                // upper case letters.
                options.username = options.username.toLowerCase();


                // NB: the cookie param determines whether the auth service will
                // set a cookie or not. The cookie set only includes un and kbase_sessionid.
                // It does not include the auth token, amazingly, which is required for all
                // service calls.
                var loginParams = {
                    user_id: options.username,
                    password: options.password,
                    fields: 'un,token,user_id,kbase_sessionid,name',
                    status: 1
                };

                $.support.cors = true;
                $.ajax({
                    type: 'POST',
                    url: loginUrl,
                    data: loginParams,
                    dataType: 'json',
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    },
                    beforeSend: function (xhr) {
                        // make cross-site requests
                        xhr.withCredentials = true;
                    },
                    success: function (data) {
                        if (data.kbase_sessionid) {
                            setSession(importFromAuthObject(data));
                            if (!options.disableCookie) {
                                setSessionCookie();
                            }
                            resolve(makeKbaseSession());
                        } else {
                            reject(new Error(data.error_msg));
                        }
                    },
                    error: function (jqXHR, textStatus) {
                        /* Some error cases
                         * status == 401 - show "uid/pw = wrong!" message
                         * status is not 401,
                         *     and we have a responseJSON - if that's the "LoginFailure: Auth fail" error, show the same uid/pw wrong msg.
                         *     and we do not have a responseJSON (or it's something else): show a generic message
                         */
                        var errmsg = textStatus;
                        var wrongPwMsg = 'The login attempt failed: Username &amp; Password combination are incorrect';
                        if (jqXHR.status && jqXHR.status === 401) {
                            errmsg = wrongPwMsg;
                        } else if (jqXHR.responseJSON) {
                            // if it has an error_msg field, use it
                            if (jqXHR.responseJSON.error_msg) {
                                errmsg = jqXHR.responseJSON.error_msg;
                            }
                            // if that's the unclear auth fail message, update it
                            if (errmsg === 'LoginFailure: Authentication failed.') {
                                errmsg = wrongPwMsg;
                            }
                        }
                        // if we get through here and still have a useless error message, update that, too.
                        if (errmsg === 'error') {
                            errmsg = 'Internal Error: Error connecting to the login server';
                        }
                        sessionObject = null;

                        reject(new Error(errmsg));
                    }
                });
            });
        }

        function logout() {
            return new Promise(function (resolve) {
                removeSession();
                resolve();
            });
        }

        function isLoggedIn() {
            refreshSession();
            if (sessionObject && sessionObject.token) {
                return true;
            }
            return false;
        }

        function getUsername() {
            refreshSession();
            if (sessionObject) {
                return sessionObject.username;
            }
        }

        function getRealname() {
            refreshSession();
            if (sessionObject) {
                return sessionObject.realname;
            }
        }

        function getSessionId() {
            refreshSession();
            if (sessionObject) {
                return sessionObject.sessionId;
            }
        }

        function getAuthToken() {
            refreshSession();
            if (sessionObject) {
                return sessionObject.token;
            }
        }
        // Setup


        // API

        return {
            getVersion: getVersion,
            login: login,
            logout: logout,
            getUsername: getUsername,
            getRealname: getRealname,
            getSessionId: getSessionId,
            getAuthToken: getAuthToken,
            isLoggedIn: isLoggedIn,
            importFromCookie: importFromCookie,
            setSession: setSession,
            getKbaseSession: getKbaseSession
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});