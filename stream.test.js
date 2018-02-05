const assert = require('assert');
const cluster = require('cluster');
const stream = require(`${__dirname}/stream`);
const Log = require(`${__dirname}/log`);
const log = new Log({
  tag:'stream_test'
});

describe('stream', () => {
  it('network blocked', (done) => {
    stream.create('blocked', (i) => {
      let choice = Math.floor(Math.random() * Math.random() * 1000 % 4);
      if (choice == 0) {
        log.info(`new queue push: ${i+1}`);
        stream.insert('blocked', ++i);
      }

      if (choice == 1 || choice == 3) {
        log.info(`retry queue push: ${i}`);
        stream.retry('blocked', i);
      }

      if (choice == 2) {
        log.info(`finished, new queue push: ${i+1}`);
        stream.finished('blocked');
        stream.insert('blocked', ++i);
      }
    });

    stream.insert('blocked', 0);

    let intervalCheck = setInterval(() => {
      if (stream._streams['blocked']['interval'] <=  8000
          && stream._streams['blocked']['maxConcurrency'] == 1
          && stream._streams['blocked']['curConcurrency'] > 1) {
        stream.clear('blocked');
        clearInterval(intervalCheck);
        done();
      }
    }, 1000);
  });

  it('fast network', (done) => {
    stream.create('fast', (i) => {
      stream.insert('fast', ++i);
      setTimeout(() => {
        stream.finished('fast');
      }, 80);
    });

    stream.insert('fast', 0);

    let intervalCheck = setInterval(() => {
      if (stream._streams['fast']['interval'] ==  100
          && stream._streams['fast']['maxConcurrency'] > 100) {
        stream.clear('fast');
        clearInterval(intervalCheck);
        done();
      }
    }, 1000);
  });
});
