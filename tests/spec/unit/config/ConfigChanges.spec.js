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

const fs = require('fs-extra');
const os = require('osenv');
const path = require('path');

// Cordova Common Related Imports
const ConfigChanges = require('cordova-common').ConfigChanges;
const PlatformJson = require('cordova-common').PlatformJson;
const PluginInfoProvider = require('cordova-common').PluginInfoProvider;
const ConfigParser = require('../../../../bin/templates/scripts/cordova/lib/config/IosConfigParser');

// Test Fixture Pathings
const varplugin = path.join(__dirname, '../fixtures/plugins/com.adobe.vars');
const bplistplugin = path.join(__dirname, '../fixtures/plugins/org.apache.bplist');
const plistplugin = path.join(__dirname, '../fixtures/plugins/org.apache.plist');
const cbplugin = path.join(__dirname, '../fixtures/plugins/org.test.plugins.childbrowser');
const dummyplugin = path.join(__dirname, '../fixtures/plugins/org.test.plugins.dummyplugin');
const ios_config_xml = path.join(__dirname, '../fixtures/projects/ios-config-xml/');
const configfile1_xml = path.join(__dirname, '../fixtures/test-configfile1.xml');
const configfile2_xml = path.join(__dirname, '../fixtures/test-configfile2.xml');

// Temporary Directory for Test Execution
const temp = path.join(os.tmpdir(), 'plugman');
const plugins_dir = path.join(temp, 'cordova', 'plugins');

const pluginInfoProvider = new PluginInfoProvider();

function install_plugin (pluginPath) {
    fs.copySync(pluginPath, path.join(plugins_dir, path.basename(pluginPath)));
}

describe('ConfigChanges', () => {
    beforeEach(() => {
        fs.ensureDirSync(temp);
        fs.ensureDirSync(plugins_dir);
    });

    afterEach(() => {
        fs.removeSync(temp);
    });

    describe('processing of plugins (via process method)', () => {
        beforeEach(() => {
            install_plugin(dummyplugin);
        });

        describe(': installation', () => {
            describe('of plist config files', () => {
                it('should write empty string nodes with no whitespace', () => {
                    fs.copySync(ios_config_xml, temp);
                    install_plugin(varplugin);

                    const platformJson = PlatformJson.load(plugins_dir, 'ios');
                    platformJson.addInstalledPluginToPrepareQueue('com.adobe.vars', {});
                    ConfigChanges.process(plugins_dir, temp, 'ios', platformJson, pluginInfoProvider);
                    expect(fs.readFileSync(path.join(temp, 'SampleApp', 'SampleApp-Info.plist'), 'utf-8')).toMatch(/<key>APluginNode<\/key>\n {4}<string\/>/m);
                });

                it('should merge dictionaries and arrays, removing duplicates', () => {
                    fs.copySync(ios_config_xml, temp);
                    install_plugin(plistplugin);

                    const platformJson = PlatformJson.load(plugins_dir, 'ios');
                    platformJson.addInstalledPluginToPrepareQueue('org.apache.plist', {});
                    ConfigChanges.process(plugins_dir, temp, 'ios', platformJson, pluginInfoProvider);

                    const infoPlist = fs.readFileSync(path.join(temp, 'SampleApp', 'SampleApp-Info.plist'), 'utf-8');

                    expect(infoPlist).toMatch(/<key>UINewsstandIcon<\/key>[\s\S]*<key>CFBundlePrimaryIcon<\/key>/);
                    expect(infoPlist).toMatch(/<string>schema-b<\/string>/);
                    expect(infoPlist).not.toMatch(/(<string>schema-a<\/string>[^]*){2,}/);
                });

                it('should recover Info.plist after removing config-file tag', () => {
                    fs.copySync(ios_config_xml, temp);

                    const configfile2_cfg = new ConfigParser(configfile2_xml);
                    const platformJson = PlatformJson.load(plugins_dir, 'ios');
                    const munger = new ConfigChanges.PlatformMunger('ios', temp, platformJson, pluginInfoProvider);

                    munger.add_config_changes(configfile2_cfg, true).save_all();

                    let infoPlist = fs.readFileSync(path.join(temp, 'SampleApp', 'SampleApp-Info.plist'), 'utf-8');

                    expect(infoPlist).toMatch(/<key>NSCameraUsageDescription<\/key>\s*<string>Please permit Camera<\/string>/);
                    expect(infoPlist).toMatch(/<key>NSPhotoLibraryUsageDescription<\/key>\s*<string>Please permit PhotoLibrary<\/string>/);
                    expect(infoPlist).toMatch(/<key>LSApplicationQueriesSchemes<\/key>\s*<array>\s*<string>twitter<\/string>\s*<string>fb<\/string>\s*<\/array>/);

                    const configfile1_cfg = new ConfigParser(configfile1_xml);
                    munger.add_config_changes(configfile1_cfg, true).save_all();
                    infoPlist = fs.readFileSync(path.join(temp, 'SampleApp', 'SampleApp-Info.plist'), 'utf-8');

                    expect(infoPlist).toMatch(/<key>NSCameraUsageDescription<\/key>\s*<string>This app uses Camera<\/string>/);
                    expect(infoPlist).not.toMatch(/<key>NSPhotoLibraryUsageDescription<\/key>\s*<string>Please permit PhotoLibrary<\/string>/);
                    expect(infoPlist).not.toMatch(/<key>LSApplicationQueriesSchemes<\/key>\s*<array>\s*<string>twitter<\/string>\s*<string>fb<\/string>\s*<\/array>/);
                    expect(infoPlist).toMatch(/<key>LSApplicationQueriesSchemes<\/key>\s*<array>\s*<string>twitter<\/string>\s*<\/array>/);
                });
            });

            describe('of binary plist config files', () => {
                it('should merge dictionaries and arrays, removing duplicates', () => {
                    fs.copySync(ios_config_xml, temp);
                    install_plugin(bplistplugin);

                    const platformJson = PlatformJson.load(plugins_dir, 'ios');
                    platformJson.addInstalledPluginToPrepareQueue('org.apache.bplist', {});
                    ConfigChanges.process(plugins_dir, temp, 'ios', platformJson, pluginInfoProvider);
                    const edited_plist = fs.readFileSync(path.join(temp, 'SampleApp', 'SampleApp-binary.plist'), 'utf-8');

                    expect(edited_plist).toMatch(/<key>UINewsstandIcon<\/key>[\s\S]*<key>CFBundlePrimaryIcon<\/key>/);
                    expect(fs.readFileSync(path.join(temp, 'SampleApp', 'SampleApp-binary.plist'), 'utf-8')).toMatch(/<string>schema-b<\/string>/);
                    expect(fs.readFileSync(path.join(temp, 'SampleApp', 'SampleApp-binary.plist'), 'utf-8')).not.toMatch(/(<string>schema-a<\/string>[^]*){2,}/);
                });
            });

            it('should resolve wildcard config-file targets to the project, if applicable', () => {
                fs.copySync(ios_config_xml, temp);
                install_plugin(cbplugin);

                const spy = spyOn(fs, 'readFileSync').and.callThrough();
                const platformJson = PlatformJson.load(plugins_dir, 'ios');
                platformJson.addInstalledPluginToPrepareQueue('org.test.plugins.childbrowser', {});

                const munger = new ConfigChanges.PlatformMunger('ios', temp, platformJson, pluginInfoProvider);
                munger.process(plugins_dir);

                expect(spy).toHaveBeenCalledWith(path.join(temp, 'SampleApp', 'SampleApp-Info.plist').replace(/\\/g, '/'), 'utf8');
            });
        });
    });
});
