/**
 * @fileOverview ioredis helper.
 *
 * @author       <a href="mailto:sjian@microsoft.com">Arthur Jiang</a>
 * @version      1.0.0
 *
 * @requires     fs,ioredis
 * @requires     ./log,../config,../redis
 * @requires     NODE_ENV,REDIS_HOST_PRO,REDIS_PORT_PRO,REDIS_HOST_TEST,REDIS_PORT_TEST
 * @module       redis
 */

const config = require(`${__dirname}/../config`);
const fs = require('fs');
const Redis = require('ioredis');
const redis = new Redis(process.env.NODE_ENV == 'development' ? config.redis.test.port : config.redis.pro.port,
    process.env.NODE_ENV == 'development' ? config.redis.test.host : config.redis.pro.host);
const scriptFolder = `${__dirname}/../redis`;
const hashInsertScript = fs.readFileSync(`${scriptFolder}/hash.insert.lua`);
const hashKeysScript = fs.readFileSync(`${scriptFolder}/hash.keys.lua`);
const hashGetallScript = fs.readFileSync(`${scriptFolder}/hash.getall.lua`);
const hashGetScript = fs.readFileSync(`${scriptFolder}/hash.get.lua`);
const inQueueScript = fs.readFileSync(`${scriptFolder}/queue.lpush.lua`);
const outQueueScript = fs.readFileSync(`${scriptFolder}/queue.rpop.lua`);
const listQueueScript = fs.readFileSync(`${scriptFolder}/queue.lrange.lua`);
const getKeyValueScript = fs.readFileSync(`${scriptFolder}/keys.get.lua`);
const setKeyValueScript = fs.readFileSync(`${scriptFolder}/keys.set.lua`);

/**
 * (bath) Write value to redis hash table - redis hexists, hget, hset
 * if the filed does not exist, will insert a new one, and create a timeline record for this field,
 * if the filed does exist, and need update the value, update the value, append a new record at the timeline,
 * if the filed does exist, and no need update, do nothing.
 * @param {string} hashTable - hash table name
 * @param {array} value - json object array for bath, and the object format is fixed. k -- hash field, v -- hash field value
 * t -- timestamp, tls(optional) -- time line suffix, tlp(optional) -- time line prefix.
 * @example
 * // hash insert
 * let hashInsertValue = [
 *   {
 *     k: 'hash field',
 *     v: 'hash field value',
 *     t: 'timestamp',
 *     tls: 'time line suffix',
 *     tlp: 'time line prefix'
 *   }
 * ]
 *
 * redis.hash.insert('hashtable', hanshInsertValue, (err, res) => { ... });
 *
 * @param {function} cb - call back, first argument is err, second argument is res, which is insert status, includes insert/
 * update/nochange num and insert/update/nochange list
 * @example
 * // hash insert return obj
 * let hashInsertCBRes = {
 *   insert: 'insert num',
 *   update: 'update num',
 *   nochange: 'nochange num',
 *   insertList: 'insert list',
 *   updateList: 'update list',
 *   nochangeList: 'nochange list'
 * }
 */
const hashInsert = (hashTable, value, cb) => {
    redis.eval(hashInsertScript, 1, hashTable, JSON.stringify(value), (err, res) => {
        cb(err, JSON.parse(res));
    });
};

/**
 * Get all fields from hashtable - redis hkeys
 * @param {string} hashTable - hash table name
 * @param {function} cb - call back, first argument is err, second argument is res, field list
 * @example
 * // hash get keys
 * redis.hash.keys('hashtable', (err, res) => { ... });
 */
const hashKeys = (hashTable, cb) => {
    redis.eval(hashKeysScript, 1, hashTable, (err, res) => {
        cb(err, res);
    });
};

/**
 * Get all field/value pairs from hashtable - redis hgetall
 * @param {string} hashTable - hash table name
 * @param {function} cb - call back, first argument is err, second argument is res, field/value dict
 * @example
 * // get all kv pairs
 * redis.hash.getall('hashtable', (err, res) => { ... });
 */
const hashGetall = (hashTable, cb) => {
    redis.eval(hashGetallScript, 1, hashTable, (err, res) => {
        cb(err, JSON.parse(res));
    });
};

/**
 * Get field value from hashtable - redis hget
 * @param {string} hashTable - hash table name
 * @param {function} cb - call back, first argument is err, second argument is res, field value
 * @example
 * // get field value
 * redis.hash.get('hashtable', 'field1', (err, res) => { ... });
 */
const hashGet = (hashTable, field, cb) => {
    redis.eval(hashGetScript, 2, hashTable, field, (err, res) => {
        cb(err, JSON.parse(res));
    });
};

/**
 * Clear all items in redis - redis flush all
 */
const clearAll = (cb) => {
    redis.eval(`return redis.pcall('flushall')`, 0, (err, res) => {
        cb(err, res);
    });
};

/**
 * (bath) In queue - redis lpush
 * @param {string} queue - queue name
 * @param {array} value - inqueue item
 * @param {function} cb - call back, first argument is err, second argument is res, inqueue records
 * @example
 * // inqueue
 * let inqueueValues = [
 *   {
 *     url: 'http://123.html',
 *     fingerprint: '12345'
 *   },
 *   {
 *     url: 'http://234.html',
 *     fingerprint: '23445'
 *   }
 * ];
 *
 * redis.queue.in('queue', inqueueValues, (err, res) => { ... });
 */
const inQueue = (queue, values, cb) => {
    redis.eval(inQueueScript, 1, queue, JSON.stringify(values), (err, res) => {
        cb(err, JSON.parse(res));
    });
};

/**
 * Qut queue - redis rpop
 * @param {string} queue - queue name
 * @param {function} cb - call back, first argument is err, second argument is res, outqueue item
 * @example
 * // out queue
 * redis.queue.out('queue', (err, res) => { ... });
 */
const outQueue = (queue, cb) => {
    redis.eval(outQueueScript, 1, queue, (err, res) => {
        cb(err, JSON.parse(res));
    });
};

/**
 * List queue items from start to stop - redis lrange
 * @param {string} queue - queue name
 * @param {function} cb - call back, first argument is err, second argument is res, item list
 * @example
 * // list queue range
 * redis.queue.list('queue', 0, 3, (err, res) => { ... });
 */
const listRange = (queue, start, stop, cb) => {
    redis.eval(listQueueScript, 3, queue, start, stop, (err, res) => {
        cb(err, JSON.parse(res));
    });
};

/**
 * (bath) Get values - get values
 * @param {array} keys - key string array
 * @param {function} cb - call back
 * @example
 * // get values
 * redis.keys.get(['key1', 'key2'], (err, res) => { ... });
 */
const getValue = (keys, cb) => {
    redis.eval(getKeyValueScript, 0, JSON.stringify(keys), (err, res) => {
        cb(err, JSON.parse(res));
    });
};

/**
 * (bath) Set value - set key/value pairs
 * @param {array} kvs - kv pair array
 * @param {function} cb - call back
 * // set kvs
 * redis.keys.set([{
 *   k: 1,
 *   v: 2
 * }], cb(err, res) => { ... });
 */
const setValue = (kvs, cb) => {
    redis.eval(setKeyValueScript, 0, JSON.stringify(kvs), (err, res) => {
        cb(err, JSON.parse(res));
    });
};

const disconnect = () => {
    redis.disconnect();
};

module.exports = {
    hash: {
        insert: hashInsert,
        keys: hashKeys,
        getall: hashGetall,
        get: hashGet
    },
    queue: { in: inQueue,
        out: outQueue,
        list: listRange
    },
    keys: {
        get: getValue,
        set: setValue
    },
    clearAll: clearAll,
    disconnect: disconnect
};