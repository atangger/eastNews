const config = require(`${__dirname}/config`);
const fs = require('fs');
const Redis = require('ioredis');
const redis = new Redis(process.env.NODE_ENV == 'development' ? config.redis.test.port : config.redis.pro.port,
                        process.env.NODE_ENV == 'development' ? config.redis.test.host : config.redis.pro.hos);
const scriptFolder = `${__dirname}/redis`;
const hashInsertScript = fs.readFileSync(`${scriptFolder}/hash.insert.lua`);
const hashKeysScript = fs.readFileSync(`${scriptFolder}/hash.keys.lua`);
const hashGetallScript = fs.readFileSync(`${scriptFolder}/hash.getall.lua`);
const hashGetScript = fs.readFileSync(`${scriptFolder}/hash.get.lua`);
const inQueueScript = fs.readFileSync(`${scriptFolder}/queue.lpush.lua`);
const outQueueScript = fs.readFileSync(`${scriptFolder}/queue.rpop.lua`);
const listQueueScript = fs.readFileSync(`${scriptFolder}/queue.lrange.lua`);

const hashInsert = (hashTable, value, cb) => {
  redis.eval(hashInsertScript, 1, hashTable, value, (err, res) => {
    cb(err, res);
  });
};

const hashKeys = (hashTable, cb) => {
  redis.eval(hashKeysScript, 1, hashTable, (err, res) => {
    cb(err, res);
  });
};

const hashGetall = (hashTable, cb) => {
  redis.eval(hashGetallScript, 1, hashTable, (err, res) => {
    cb(err, res);
  });
};

const hashGet = (hashTable, field, cb) => {
  redis.eval(hashGetScript, 2, hashTable, field, (err, res) => {
    cb(err, res);
  });
};

const clearAll = (cb) => {
  redis.eval(`return redis.pcall('flushall')`, 0, (err, res) => {
    cb(err, res);
  });
};

const inQueue = (queue, values, cb) => {
  redis.eval(inQueueScript, 1, queue, values, (err, res) => {
    cb(err, res);
  });
};

const outQueue = (queue, cb) => {
  redis.eval(outQueueScript, 1, queue, (err, res) => {
    cb(err, res);
  });
};

const listRange = (queue, start, stop, cb) => {
  redis.eval(listQueueScript, 3, queue, start, stop, (err, res) => {
    cb(err, res);
  });
};

module.exports = {
  hash: {
    insert: hashInsert,
    keys: hashKeys,
    getall: hashGetall,
    get: hashGet
  },
  queue: {
    in: inQueue,
    out: outQueue,
    list: listRange
  },
  clearAll: clearAll
};
