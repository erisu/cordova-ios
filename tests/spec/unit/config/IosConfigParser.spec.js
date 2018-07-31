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

        describe('ios_CFBundleIdentifier method', () => {
            it('should get the ios packagename', () => {
                expect(cfg.ios_CFBundleIdentifier()).toEqual('io.cordova.hellocordova.ios');
            });
        });
    });
});
