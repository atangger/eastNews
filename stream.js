const Log = require(`${__dirname}/log`);
const log = new Log({
  tag: 'lib_stream'
});

const Stream = {
  _streams: {},
  _defaultConcurrency: 50,
  _defaultIntervale: 200,
  _minInterval: 100,
  _minConcurrency: 1,
  create: function(name, handler) {
    if (this._streams[name] == undefined) {
      this._streams[name] = {};
      this._streams[name]['new'] = [];
      this._streams[name]['retry'] = [];
      this._streams[name]['maxConcurrency'] = this._defaultConcurrency;
      this._streams[name]['curConcurrency'] = 0;
      this._streams[name]['handler'] = handler;
      this._streams[name]['interval'] = this._defaultIntervale;
      this._streams[name]['setInterval'] = setInterval(this._interval(name), this._streams[name]['interval']);

      this._streams[name]['updateInterval'] = setInterval(() => {
        log.info(`new quque: ${this._streams[name]['new']}\nretry queue: ${this._streams[name]['retry']}\nmax concurrency: ${this._streams[name]['maxConcurrency']}\ncurrent concurrency: ${this._streams[name]['curConcurrency']}\ninterval: ${this._streams[name]['interval']}`);
        let newLength = this._streams[name]['new'].length;
        let retryLength = this._streams[name]['retry'].length;

        if (newLength < retryLength) {
          let newCon = Math.ceil(this._streams[name]['maxConcurrency']/2);
          this._streams[name]['maxConcurrency'] = newCon <= this._minConcurrency ? this._minConcurrency : newCon;
        } else {
          this._streams[name]['maxConcurrency'] += 1;
          let newInt = this._streams[name]['interval'] - 10;
          let tmpInt = newInt < this._minInterval ? this._minInterval : newInt;

          if (tmpInt != this._streams[name]['interval']) {
            this._streams[name]['interval'] = newInt < this._minInterval ? this._minInterval : newInt;
            clearInterval(this._streams[name]['setInterval']);
            this._streams[name]['setInterval'] = setInterval(this._interval(name), this._streams[name]['interval']);
          }
        }

        if (this._streams[name]['maxConcurrency'] == this._minConcurrency && this._streams[name]['interval'] * 2 < 8000) {
          this._streams[name]['interval'] = this._streams[name]['interval'] * 2;
          clearInterval(this._streams[name]['setInterval']);
          this._streams[name]['setInterval'] = setInterval(this._interval(name), this._streams[name]['interval']);
        }
      }, 2000);
    }
  },

  insert: function(name, item) {
    this._streams[name]['new'].push(item);
  },

  retry: function(name, item) {
    this._streams[name]['retry'].push(item);
  },

  finished: function(name) {
    this._streams[name]['curConcurrency'] -= 1;
  },

  clear: function(name) {
    clearInterval(this._streams[name]['setInterval']);
    clearInterval(this._streams[name]['updateInterval']);
  },

  _interval: function(name) {
    return () => {
      if (this._streams[name]['curConcurrency'] < this._streams[name]['maxConcurrency']) {
        let item = this._streams[name]['new'].shift();

        if (item != undefined) {
          log.info(`new queue pop: ${item}`);
          this._streams[name]['curConcurrency'] += 1;
          this._streams[name]['handler'](item);
        } else {
          item = this._streams[name]['retry'].shift();
          if (item != undefined) {
            log.info(`retry queue pop: ${item}`);
            this._streams[name]['curConcurrency'] += 1;
            this._streams[name]['handler'](item);
          }
        }
      }
    };
  }
};

module.exports = Stream;
