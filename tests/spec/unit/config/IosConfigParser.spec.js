/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

const path = require('path');
const fs = require('fs');
const ConfigParser = require('../../../../bin/templates/scripts/cordova/lib/config/IosConfigParser');
const xml = path.join(__dirname, '../fixtures/test-config.xml');
const xml_contents = fs.readFileSync(xml, 'utf-8');

describe('IosConfigParser', () => {
    let readFile; /* eslint no-unused-vars : 0 */
    beforeEach(() => {
        readFile = spyOn(fs, 'readFileSync').and.returnValue(xml_contents);
    });

    describe('methods', () => {
        let cfg;
        beforeEach(() => { cfg = new ConfigParser(xml); });

        describe('package name / ios-CFBundleIdentifier', () => {
            it('Test 005 : should get the ios packagename', () => {
                expect(cfg.ios_CFBundleIdentifier()).toEqual('io.cordova.hellocordova.ios');
            });
        });

        // describe('getStaticResources method', () => {
        //     let hasPlatformPropertyDefined = function (e) { return !!e.platform; };
        //     let hasSrcPropertyDefined = function (e) { return !!e.src; };
        //     let hasTargetPropertyDefined = function (e) { return !!e.target; };

        //     it('should parse resources\' attributes', () => {
        //         expect(cfg.getStaticResources(null, 'icon').every(hasSrcPropertyDefined)).toBeTruthy();
        //         expect(cfg.getStaticResources('windows', 'icon').filter(hasPlatformPropertyDefined).every(hasTargetPropertyDefined)).toBeTruthy();
        //     });

        //     it('Test 040 : should have getBySize method returning resource with size specified or null', () => {
        //         expect(cfg.getStaticResources('windows', 'icon').getBySize(128)).toBe(null);
        //         expect(cfg.getStaticResources('windows', 'icon').getBySize(72)).toBeDefined();
        //         expect(cfg.getStaticResources('windows', 'icon').getBySize(72).width).toBe(72);
        //         expect(cfg.getStaticResources('windows', 'icon').getBySize(null, 48)).toBeDefined();
        //         expect(cfg.getStaticResources('windows', 'icon').getBySize(null, 48).height).toBe(48);
        //     });
        // });

        // describe('getFileResources method', () => {
        //     let hasArchPropertyDefined = function (e) { return !!e.arch; };

        //     it('should parse resources\' attributes', () => {
        //         expect(cfg.getFileResources('windows').every(hasArchPropertyDefined)).toBeTruthy();
        //     });
        // });
    });
});
