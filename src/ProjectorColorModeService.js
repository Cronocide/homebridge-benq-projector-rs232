'use strict';

let Characteristic;

class ProjectorColorModeService {
  constructor(log, api, device, name) {

    this.log = log;

    this._device = device;
    this._cmodeRegex = /\*appmod=([a-z0-9]+)#/;

    Characteristic = api.hap.Characteristic;

    this._characteristics = [
      { mode: 'dynamic', characteristic: Characteristic.ColorModeDynamic },
      { mode: 'std', characteristic: Characteristic.ColorModeNatural },
      { mode: 'game', characteristic: Characteristic.ColorModeLiving },
      { mode: 'bright', characteristic: Characteristic.ColorModeTHX },
      { mode: 'cine', characteristic: Characteristic.ColorModeCinema },
      { mode: 'threed', characteristic: Characteristic.ColorMode3DCinema },
      { mode: 'preset', characteristic: Characteristic.ColorMode3DDynamic },
      { mode: 'user1', characteristic: Characteristic.ColorMode3DTHX },
      { mode: 'user2', characteristic: Characteristic.ColorModeBlackWhiteCinema },
    ];

    this._service = new api.hap.Service.ProjectorColorModeService(name);

    for (let c of this._characteristics) {
      this._service
        .getCharacteristic(c.characteristic)
        .on('set', this._setColorMode.bind(this, c));
    }
  }

  getService() {
    return this._service;
  }

  async update() {
    const status = await this._device.execute('*appmod=?#');
    const matches = this._cmodeRegex.exec(status);
    if (matches !== null) {
      let value = Number.parseInt(matches[1], 16);

      if (value !== this._lastKnownMode) {
        this._updateMode(this._lastKnownMode, false);
        this._updateMode(value, true);

        this._lastKnownMode = value;
      }
    }
    else {
      this.log(`Failed to refresh characteristic state: *appmod=?# - ${status}`);
    }
  }

  _updateMode(mode, state) {
    const c = this._characteristics.find(c => c.mode === mode);
    if (c) {
      this._service
        .getCharacteristic(c.characteristic)
        .updateValue(state);
    }
  }


  async _setColorMode(c, value, callback) {
    this.log(`Set projector APPMODE to ${c.mode}`);
    try {
      const cmd = `*appmod=${c.mode}#`;

      this.log(`Sending ${cmd}`);
      await this._device.execute(cmd);
      callback(undefined);

      this._updateMode(this._lastKnownMode, false);
      this._lastKnownMode = c.mode;
    }
    catch (e) {
      this.log(`Failed to set characteristic ${e}`);
      callback(e);
    }
  }
}

module.exports = ProjectorColorModeService;
