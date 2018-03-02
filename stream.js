/**
 * @fileOverview stream helper. based on system/network state, update request/call frequency
 *
 * @author       <a href="mailto:sjian@microsoft.com">Arthur Jiang</a>
 * @version      1.0.0
 *
 * @requires     ./log
 * @module       stream
 */

const Log = require(`${__dirname}/log`);
const log = new Log({
  tag: 'stream'
});

/**
 * @example
 * // bfs http request
 * stream.create('http', (url) => {
 *   request(url, (err, res) => {
 *     if (!err) {
 *       stream.finished('http');
 *       let urls = getUrls(res);
 *       urls.map(url => stream.insert('http', url));
 *     } else {
 *       stream.retry('http', url);
 *     }
 *   });
 * });
 * stream.insert('http', 'seed_url');
 */
const Stream = {
  _streams: {},
  _defaultConcurrency: 50,
  _defaultIntervale: 200,
  _minInterval: 50,
  _minConcurrency: 10,
  _formatLog: function(action, state, curReq, maxReq, queueSize, retryQueueSize, successNum, failNum, curInterval) {
    log.info(`------------------------------------------------`);
    log.info(`${action}: ${state}`);
    log.info(`cur reqs: ${curReq}`);
    log.info(`max reqs: ${maxReq}`);
    log.info(`queue size: ${queueSize}`);
    log.info(`retry queue size: ${retryQueueSize}`);
    log.info(`success num: ${successNum}`);
    log.info(`fail num: ${failNum}`);
    log.info(`cur interval: ${curInterval}`);
    log.info(`approximately memory: ${Math.round(process.memoryUsage().heapUsed/1024/1024 * 100)/100} MB`);
    log.info(`------------------------------------------------`);
  },
  /**
   * create - create a topic, register its handler
   * @param {string} name - topic name
   * @param {function} handler - the topic handler
   */
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
      this._streams[name]['success'] = 0;
      this._streams[name]['fail'] = 0;

      this._streams[name]['updateInterval'] = setInterval(() => {
        if (this._streams[name]['fail'] == 0 && this._streams[name]['success'] > 1) {
          if (this._streams[name]['maxConcurrency'] + 1 > this._streams[name]['curConcurrency'] * 2) {
            this._streams[name]['maxConcurrency'] = this._streams[name]['curConcurrency'] * 2 > 0 ? this._streams[name]['curConcurrency'] * 2 : this._minConcurrency;
          } else {
            this._streams[name]['maxConcurrency'] += 1;
          }

          let newInt = this._streams[name]['interval'] - 10;
          let tmpInt = newInt < this._minInterval ? this._minInterval : newInt;

          if (tmpInt != this._streams[name]['interval']) {
            this._streams[name]['interval'] = newInt < this._minInterval ? this._minInterval : newInt;
            clearInterval(this._streams[name]['setInterval']);
            this._streams[name]['setInterval'] = setInterval(this._interval(name), this._streams[name]['interval']);
            this._formatLog('upgrade interval', 'success',
                            this._streams[name]['curConcurrency'], this._streams[name]['maxConcurrency'],
                            this._streams[name]['new'].length, this._streams[name]['retry'].length,
                            this._streams[name]['success'], this._streams[name]['fail'],
                            this._streams[name]['interval']);
          }
        } else if ((this._streams[name]['fail'] / (this._streams[name]['success'] + this._streams[name]['fail'] + 1)) > 0.5) {
          let newCon = Math.ceil(this._streams[name]['maxConcurrency']/2);
          this._streams[name]['maxConcurrency'] = newCon <= this._minConcurrency ? this._minConcurrency : newCon;
          this._streams[name]['interval'] = this._streams[name]['interval'] * 2;
          clearInterval(this._streams[name]['setInterval']);
          this._streams[name]['setInterval'] = setInterval(this._interval(name), this._streams[name]['interval']);
          this._formatLog('downgrade interval', 'success',
                          this._streams[name]['curConcurrency'], this._streams[name]['maxConcurrency'],
                          this._streams[name]['new'].length, this._streams[name]['retry'].length,
                          this._streams[name]['success'], this._streams[name]['fail'],
                          this._streams[name]['interval']);
        }

        this._streams[name]['success'] = 0;
        this._streams[name]['fail'] = 0;
      }, 2000);
    }
  },

  /**
   * insert - insert item to a topic
   * @param {string} name - topic name
   * @param {string} item - the item, which is required by handler
   */
  insert: function(name, item) {
    this._streams[name]['new'].push(item);
  },

  /**
   * retry - when handler failed, need call this function
   * @param {string} name - topic name
   * @param {string} item - the item, which is required by handler
   */
  retry: function(name, item) {
    this._streams[name]['fail'] += 1;
    this._streams[name]['retry'].push(item);
    this._streams[name]['curConcurrency'] -= 1;

    if (this._streams[name]['maxConcurrency'] + 1 > this._streams[name]['curConcurrency'] * 2) {
      this._streams[name]['maxConcurrency'] = this._streams[name]['curConcurrency'] * 2 > 0 ? this._streams[name]['curConcurrency'] * 2 : this._minConcurrency;
    } else {
      this._streams[name]['maxConcurrency'] += 1;
    }
  },

  /**
   * finished - when handler successed, need call this function
   * @param {string} name - topic name
   */
  finished: function(name) {
    this._streams[name]['success'] += 1;
    this._streams[name]['curConcurrency'] -= 1;

    if (this._streams[name]['maxConcurrency'] + 1 > this._streams[name]['curConcurrency'] * 2) {
      this._streams[name]['maxConcurrency'] = this._streams[name]['curConcurrency'] * 2 > 0 ? this._streams[name]['curConcurrency'] * 2 : this._minConcurrency;
    } else {
      this._streams[name]['maxConcurrency'] += 1;
    }
  },

  /**
   * clear - when topic should be finished, need call this function
   * @param {string} name - topic name
   */
  clear: function(name) {
    clearInterval(this._streams[name]['setInterval']);
    clearInterval(this._streams[name]['updateInterval']);
  },

  _interval: function(name) {
    return () => {
      if (this._streams[name]['curConcurrency'] < this._streams[name]['maxConcurrency']) {
        let item = this._streams[name]['new'].shift();

        if (item != undefined) {
          log.info(`${name} new queue pop: `, item);
          this._streams[name]['curConcurrency'] += 1;
          this._streams[name]['handler'](item);
        } else {
          item = this._streams[name]['retry'].shift();
          if (item != undefined) {
            log.info(`${name} retry queue pop: `, item);
            this._streams[name]['curConcurrency'] += 1;
            this._streams[name]['handler'](item);
          }
        }
      } else {
        log.info(`stream is blocked`);
      }
    };
  }
};

module.exports = Stream;
