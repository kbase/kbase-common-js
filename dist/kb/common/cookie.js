/*global define,encodeURIComponent*/
/*jslint white:true,browser:true*/
/* based on https://developer.mozilla.org/en-US/docs/Web/API/document.cookie?redirectlocale=en-US&redirectslug=DOM%2Fdocument.cookie */
define([], function () {
    'use strict';
    var Cookie = Object.create({}, {
        init: {
            value: function (options) {
                this.doc = options.doc || document;
                return this;
            }
        },
        importCookies: {
            value: function () {
                var cookieString = this.doc.cookie;
                if (cookieString) {
                    return cookieString.split(';')
                        .map(function (cookie) {
                            var pieces = cookie.split('='),
                                name = pieces[0].trim(' '),
                                value = pieces[1].trim(' ');
                            return {
                                name: name,
                                value: decodeURIComponent(value)
                            };
                        });
                }
                return [];
            }
        },
        getCookies: {
            value: function () {
                return this.importCookies();
            }
        },
        findCookie: {
            value: function (key) {
                var cookies = this.importCookies();
                return cookies.filter(function (cookie) {
                    if (cookie.name === key) {
                        return true;
                    }
                });
            }
        },
        getItem: {
            value: function (key) {
                if (!key) {
                    return null;
                }                
                var cookie = this.findCookie(key), value;
                if (cookie.length > 1) {
                    throw new Error('Too many cookies returned, expected 1');
                }
                if (cookie.length === 0) {
                    return;
                }
                return cookie[0].value;
            }
        },
        getItems: {
            value: function (key) {
                if (!key) {
                    return null;
                }
                return this.findCookie(key).map(function (cookie) {
                    return cookie.value;
                });
            }
        },
        setItem: {
            value: function (sKey, sValue, vEnd, sPath, sDomain, bSecure, bNoEncode) {
                if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
                    return false;
                }
                var sExpires, maxAge;
                if (vEnd) {
                    switch (vEnd.constructor) {
                        case Number:
                            if (vEnd === Infinity) {
                                sExpires = (new Date('9999-12-31T23:59:59Z')).toUTCString(); 
                            } else {
                                maxAge = vEnd;
                                // set both expires and max-age. Max-age because it is more accurate
                                // and expires because it is more compatible (well, with IE).
                                sExpires = (new Date((new Date()).getTime() + vEnd*1000)).toUTCString()
                            }
                            break;
                        case String:
                            sExpires = vEnd;
                            break;
                        case Date:
                            sExpires = vEnd.toUTCString();
                            break;
                    }
                }
                var newCookie = {
                    name: sKey,
                    value: sValue,
                    expires: sExpires,
                    'max-age': maxAge,
                    domain: sDomain,
                    path: sPath,
                    secure: bSecure,
                    noEncode: bNoEncode
                };
                this.setCookie(newCookie);
                return true;
            }
        },
        setCookie: {
            value: function (cookie) {
                var cookieProps, propString,
                    cookieString;
                cookieProps = ['domain', 'path', 'secure', 'expires', 'max-age']
                    .map(function (key) {
                        if (cookie[key]) {
                            return {
                                key: key,
                                value: cookie[key]
                            };
                        }
                    })
                    .filter(function (prop) {
                        if (prop) {
                            return true;
                        }
                    });

                if (cookie.noEncode) {
                    // For compatability with services which do not decode cookies yet create cookies
                    // save for not encoding. Aka - Globus.
                    propString = cookieProps.map(function (prop) {
                        return [prop.key, prop.value].join('=');
                    }).join(';');
                    cookieString = [cookie.key, [cookie.value, propString].join(';')].join('=');
                } else {
                    propString = cookieProps.map(function (prop) {
                        return [prop.key, prop.value].join('=');
                    }).join(';');
                    cookieString = [encodeURIComponent(cookie.name), [encodeURIComponent(cookie.value), propString].join(';')].join('=');                    
                }
                this.doc.cookie = cookieString;
            }
        },
        removeItem: {
            value: function (sKey, sPath, sDomain) {
                this.setCookie({
                    name: sKey,
                    value: '*',
                    domain: sDomain,
                    path: sPath,
                    expires:  (new Date('1970-01-01T00:00:00Z')).toUTCString()
                });
            }
        },
        hasItem: {
            value: function (key) {
                var cookies = this.importCookies();
                if (cookies[key]) {
                    return true;
                }
                return false;
            }
        },
        keys: {
            value: function () {
                var cookies = this.importCookies();
                return Object.keys(cookies);
            }
        }
    });
    return Cookie;
});