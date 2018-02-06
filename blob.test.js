const assert = require('assert');
const rs = require('randomstring');
const fs = require('fs');
const blob = require(`${__dirname}/blob`);
const Log = require(`${__dirname}/log`);
const log = new Log({
  tag: 'blob_test'
});

describe(`io`, () => {
  describe(`text`, () => {
    let smallText = `test from ${process.pid}`;
    let bigText = rs.generate(2929853);

    it('write small text', (done) => {
      blob.writeText('test', 'smallText', smallText, (err, res) => {
        log.info('err:', err, 'res:', res);
        assert(err == null);
        done();
      });
    });

    it('read small text', (done) => {
      blob.readText('test', 'smallText', (err, res) => {
        log.info('err:', err, 'res:', res);
        assert(err == null);
        assert(res == smallText);
        done();
      });
    });

    it('write big text', (done) => {
      blob.writeText('test', 'bigText', bigText, (err, res) => {
        log.info('err:', err);
        assert(err == null);
        done();
      });
    });

    it('read big text', (done) => {
      blob.readText('test', 'bigText', (err, res) => {
        log.info('err:', err);
        assert(err == null);
        assert(res == bigText);
        done();
      });
    });
  });

  describe('stream', () => {
    let readSmallStream = fs.createReadStream(`${__dirname}/../data/read.small.stream`);
    let readBigStream = fs.createReadStream(`${__dirname}/../data/read.big.stream`);
    let writeSmallStream = fs.createWriteStream(`${__dirname}/../data/write.small.stream`);
    let writeBigStream = fs.createWriteStream(`${__dirname}/../data/write.big.stream`);

    it('write small stream', (done) => {
      blob.writeStream('test', 'smallStream', readSmallStream, (err, res) => {
        log.info('err:', err, 'res:', res);
        assert(err == null);
        done();
      });
    });

    it('read small stream', (done) => {
      blob.readStream('test', 'smallStream', writeSmallStream, (err, res) => {
        log.info('err:', err, 'res:', res);
        assert(err == null);
        done();
      });
    });

    it('write big stream', (done) => {
      blob.writeStream('test', 'bigStream', readBigStream, (err, res) => {
        log.info('err:', err, 'res:', res);
        assert(err == null);
        done();
      });
    });

    it('read big stream', (done) => {
      blob.readStream('test', 'bigStream', writeBigStream, (err, res) => {
        log.info('err:', err, 'res:', res);
        assert(err == null);
        done();
      });
    });
  });
});
