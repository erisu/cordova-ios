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

const simctl = require('simctl');

/**
 * Replaces:
 *   - Hyphens in iPad Pro name which differ in "Device Types" and "Devices"
 *   - "ʀ" in "iPhone Xʀ" with "R"
 *
 * @param {string} deviceName
 * @returns {string}
 */
function filterDeviceName (deviceName) {
    if (/^iPad Pro/i.test(deviceName)) {
        return deviceName.replace(/-/g, ' ').trim();
    }

    if (deviceName.includes('ʀ')) {
        return deviceName.replace('ʀ', 'R');
    }

    return deviceName;
}

function fixRuntimeName (runtimeName) {
    // looking for format 'com.apple.CoreSimulator.SimRuntime.iOS-12-0'
    const pattern = /^com\.apple\.CoreSimulator\.SimRuntime\.(([a-zA-Z0-9]+)-(\S+))$/i;
    const match = pattern.exec(runtimeName);

    if (match) {
        const [, , os, version] = match;
        // all or nothing -- os, version will always have a value for match
        return `${os} ${version.replace('-', '.')}`;
    }

    return runtimeName;
}

/**
 * Finds and groups runtimes by device property.
 *
 * Example Output:
 * {
 *   "iPhone 6" : [ "iOS 8.2", "iOS 8.3"],
 *   "iPhone 6 Plus" : [ "iOS 8.2", "iOS 8.3"]
 * }
 *
 * @param {object} list
 * @param {string} deviceProperty
 * @param {boolean} availableOnly
 * @param {object} options
 * @returns {object}
 */
function findRuntimesGroupByDeviceProperty (list, deviceProperty, availableOnly, options = {}) {
    const runtimes = {};
    const availableRuntimes = {};

    // The key "availability" was renamed to "isAvailable" in newer Xcode versions
    list.runtimes.forEach(({ name, availability, isAvailable }) => {
        availableRuntimes[name] = availability
            ? availability === '(available)'
            : isAvailable;
    });

    for (const [deviceGroup, devices] of Object.entries(list.devices)) {
        // This will normalize runtime names since deviceGroup can be either namespaced or human-readable.
        const normalizedRuntimeName = fixRuntimeName(deviceGroup);

        for (const device of devices) {
            let devicePropertyValue = device[deviceProperty];

            if (options.lowerCase) {
                devicePropertyValue = devicePropertyValue.toLowerCase();
            }

            if (!runtimes[devicePropertyValue]) {
                runtimes[devicePropertyValue] = [];
            }

            if (!availableOnly || availableRuntimes[normalizedRuntimeName]) {
                runtimes[devicePropertyValue].push(normalizedRuntimeName);
            }
        }
    }

    return runtimes;
}

module.exports.fetchSimCtlList = () => simctl.list().json;

/**
 * Gets list of iOS devices available for simulation
 * @return {Promise} Promise fulfilled with list of devices available for simulation
 */
async function listEmulatorImages () {
    const list = module.exports.fetchSimCtlList();

    const druntimes = findRuntimesGroupByDeviceProperty(list, 'name', true, { lowerCase: true });
    const nameIdMap = {};

    for (const device of list.devicetypes) {
        nameIdMap[filterDeviceName(device.name).toLowerCase()] = device.identifier;
    }

    const results = [];

    /**
     * Removes "iOS" prefix from runtime.
     * Removes "com.apple.CoreSimulator.SimDeviceType." prefix from id.
     *
     * @param {string} devicename
     * @param {string} runtime
     */
    const remove = function (devicename, runtime) {
        const formattedId = nameIdMap[devicename].replace(/^com.apple.CoreSimulator.SimDeviceType./, '');
        const formattedRuntime = runtime.replace(/^iOS /, '');
        results.push(`${formattedId}, ${formattedRuntime}`);
    };

    for (const [deviceName, runtimes] of Object.entries(druntimes)) {
        const formattedDeviceName = filterDeviceName(deviceName).toLowerCase();
        if (!nameIdMap[formattedDeviceName]) continue;

        runtimes.forEach(runtime => remove(formattedDeviceName, runtime));
    }

    return results;
}

exports.run = listEmulatorImages;
