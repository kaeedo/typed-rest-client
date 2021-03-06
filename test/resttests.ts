// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert = require('assert');
import * as restm from 'typed-rest-client/RestClient';
import * as util from 'typed-rest-client/Util';
import * as fs from 'fs';
import * as path from 'path';

export interface HttpBinData {
    url: string;
    data: any;
    args?: any
}

describe('Rest Tests', function () {
    let _rest: restm.RestClient;

    before(() => {
        _rest = new restm.RestClient('typed-rest-client-tests');
    });

    after(() => {
    });

    it('constructs', () => {
        this.timeout(1000);
        
        let rest: restm.RestClient = new restm.RestClient('typed-test-client-tests');
        assert(rest, 'rest client should not be null');
    })

    it('gets a resource', async() => {
        let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/get');
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/get');
    });

    //----------------------------------------------
    // Get Error Cases
    //----------------------------------------------

    //
    // Resource not found (404)
    // should return a null resource, 404 status, and should not throw
    //
    it('gets a non-existant resource (404)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/404');
            
            assert(restRes.statusCode == 404, "statusCode should be 404");
            assert(restRes.result == null, "object should be null");
        }
        catch(err) {
            assert(false, "should not throw");
        }
    });

    //
    // Unauthorized (401)
    // should throw and attach statusCode to the Error object
    // err.message is message proerty of resourceful error object or if not supplied, a generic error message
    //    
    it('gets and handles unauthorized (401)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/401');
            assert(false, "should throw");
        }
        catch(err) {
            assert(err['statusCode'] == 401, "statusCode should be 401");
            assert(err.message && err.message.length > 0, "should have error message");
        }
    });    
    
    //
    // Internal Server Error
    // should throw and attach statusCode to the Error object
    // err.message is message proerty of resourceful error object or if not supplied, a generic error message
    //    
    it('gets and handles a server error (500)', async() => {
        try {
            let restRes: restm.IRestResponse<HttpBinData> = await _rest.get<HttpBinData>('https://httpbin.org/status/500');
            assert(false, "should throw");
        }
        catch(err) {
            assert(err['statusCode'] == 500, "statusCode should be 500");
            assert(err.message && err.message.length > 0, "should have error message");
        }
    });

    //--------------------------------------------------------
    // Path in baseUrl tests
    //--------------------------------------------------------
    it('maintains the path from the base url', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with no slashes', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with double slashes', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/anythingextra');
    });

    it('maintains the path from the base url with multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/extrapart');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/extrapart/anythingextra');
    });

    it('maintains the path from the base url where request has multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra/moreparts');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/anythingextra/moreparts');
    });

    it('maintains the path from the base url where both have multiple parts', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/multiple');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra/moreparts');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/multiple/anythingextra/moreparts');
    });

    it('maintains the path from the base url where request has query parameters', async() => {
        // Arrange
        let rest = new restm.RestClient('typed-rest-client-tests', 'https://httpbin.org/anything/multiple');

        // Act
        let restRes: restm.IRestResponse<HttpBinData> = await rest.get<HttpBinData>('anythingextra/moreparts?foo=bar&baz=top');

        // Assert
        assert(restRes.statusCode == 200, "statusCode should be 200");
        assert(restRes.result.url === 'https://httpbin.org/anything/multiple/anythingextra/moreparts?foo=bar&baz=top');
        assert(restRes.result.args.foo === 'bar');
        assert(restRes.result.args.baz === 'top');
    });

    //
    // getUrl path tests
    //
    it('resolves a just host resource and no baseUrl', async() => {
        let res: string = util.getUrl('http://httpbin.org');
        assert(res === 'http://httpbin.org', "should be http://httpbin.org");
    });

    it('resolves a full resource and no baseUrl', async() => {
        let res: string = util.getUrl('http://httpbin.org/get?x=y&a=b');
        assert(res === 'http://httpbin.org/get?x=y&a=b', `should be http://httpbin.org/get?x=y&a=b but is ${res}`);
    });

    it('resolves a rooted path resource with host baseUrl', async() => {
        let res: string = util.getUrl('/get/foo', 'http://httpbin.org');
        assert(res === 'http://httpbin.org/get/foo', `should be http://httpbin.org/get/foo but is ${res}`);
    });

    it('resolves a rooted path resource with pathed baseUrl', async() => {
        let res: string = util.getUrl('/get/foo', 'http://httpbin.org/bar');
        assert(res === 'http://httpbin.org/get/foo', "should be http://httpbin.org/get/foo");
    });

    it('resolves a relative path resource with pathed baseUrl', async() => {
        let res: string = util.getUrl('get/foo', 'http://httpbin.org/bar');
        assert(res === 'http://httpbin.org/bar/get/foo', `should be http://httpbin.org/bar/get/foo but is ${res}`);
    });
    // TODO: more tests here    
});
