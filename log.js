/**
  * @Author: Microsoft ARD Incubation Team
  * @Date: 16-Mar-2017
  * @Email: sjian@microsoft.com
  * @File: log.js
  * @Project: Health Care
  * @Last modified by: Arthur Jiang
  * @Last modified time: 11:19:03+08:00 16-Mar-2017
  * @License: Copyright © 2016 Microsoft. All rights reserved.
 */


const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const debug = require('debug');
const chalk = require('chalk');
const os = require('os');
const uuid = require('uuid/v1');

const usr = process.env.USER;
const logHost = process.env.NOMAD_META_FLUENTD_HOST;
const logPort = process.env.NOMAD_META_FLUENTD_PORT;
const colDebug = process.env.COL_DEBUG;
const isColor = process.env.IS_COLOR == 'true';
const isUdp = logHost && logPort;

const logColor = {
  T: chalk.blue,
  D: chalk.white.bgBlack,
  I: chalk.green,
  W: chalk.yellow,
  E: chalk.red,
  F: chalk.red.bgYellow.bold
};


class Log {
  constructor(options) {
    this.tag = (options && options.tag) || `${os.hostname()}:${usr}:${process.pid}`;
    this.instance = (options && options.instance) || `${os.hostname()}:${process.pid}`;
    this.scope = (options && options.scope) || `${os.hostname()}:${usr}:${process.pid}`;
    this.session = (options && options.session) || `${uuid()}`;

    if (!isUdp) {
      this.locDebug = debug(this.tag);
    }

    this._nomalize();
  }

  trace() {
    this._dispatch('T', arguments);
  }

  debug() {
    this._dispatch('D', arguments);
  }

  info() {
    this._dispatch('I', arguments);
  }

  warn() {
    this._dispatch('W', arguments);
  }

  error() {
    this._dispatch('E', arguments);
  }

  fatal() {
    this._dispatch('F', arguments);
  }

  _nomalize() {
    this.tag = this.tag.toString().replace(/\s+/, '_');
    this.instance = this.instance.toString().replace(/\s+/, '_');
    this.scope = this.scope.toString().replace(/\s+/, '_');
    this.session = this.session.toString().replace(/\s+/, '_');
  }

  _dispatch(level, args) {
    let msg = Array.from(args).map(arg => typeof arg == 'object' ? JSON.stringify(arg) : arg).join(' ');

    let formattedMsg = this._formatter(level, msg);

    if (isUdp) {
      this._udpLog(formattedMsg);
    } else {
      if (colDebug != '*') {
        formattedMsg = this._cutter(level, msg);
      }

      if (isColor) {
        this.locDebug(`${logColor[level](`${formattedMsg}`)}`);
      } else {
        this.locDebug(`${formattedMsg}`);
      }

    }
  }

  _udpLog(msg) {
    let buf = new Buffer(msg);
    client.send(buf, 0, buf.length, logPort, logHost, this._blackHole);
  }

  _blackHole() {
    return;
  }

  _formatter(level, meta) {
    return [this.tag, level, [this.session, this.instance, this.scope].join(':'), meta].join(' ');
  }

  _cutter(level, meta) {
    if (colDebug) {
      return [
        colDebug.includes('tag') ? this.tag : '',
        colDebug.includes('level') ? level : '',
        [
          colDebug.includes('session') ? this.session : '',
          colDebug.includes('instance') ? this.instance : '',
          colDebug.includes('scope') ? this.scope : ''
        ].join(':'),
        meta
      ].join(' ');
    } else {
      return meta;
    }
  }
}

module.exports = Log;
