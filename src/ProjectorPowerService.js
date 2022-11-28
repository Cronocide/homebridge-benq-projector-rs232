'use strict';

let Characteristic;

class ProjectorPowerService {
  constructor(log, api, device, name) {

    this.log = log;

    this._device = device;

    Characteristic = api.hap.Characteristic;

    this._service = new api.hap.Service.Switch(name);
    this._service
      .getCharacteristic(Characteristic.On)
      .on('set', this._setPowerState.bind(this));

    this._regex = /\*POW=(ON|OFF)/;
  }

  getService() {
    return this._service;
  }

  async update(powerStatus) {
    const isOn = ['ON', 'OFF'].indexOf(powerStatus) !== -1;
    // const isWarmup = powerStatus === '02';
    // const isCooldown = powerStatus === '03';
    // const isAbnormalStandby = powerStatus === '05';

    this._service
      .getCharacteristic(Characteristic.On)
      .updateValue(isOn);
  }

  async _setPowerState(value, callback) {
    this.log(`Set projector power state to ${value}`);
    try {
      let cmd = '*pow=off#';
      if (value) {
        cmd = '*pow=on#';
      }

      await this._device.execute(cmd);
      callback(undefined);
    }
    catch (e) {
      this.log(`Failed to set power state ${e}`);
      callback(e);
    }
  }
}

module.exports = ProjectorPowerService;
