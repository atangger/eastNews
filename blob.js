const azure = require('azure-storage');
const blobSvc = azure.createBlobService();
const async = require('async');
const config = require(`${__dirname}/config`);
const Log = require(`${__dirname}/../util/log`);

const log = new Log({
  tag: 'blob'
});

const maxBolbSize = 64 * 1000 * 1000;

const dumpToBlob = (container, blob, text, cb) => {
  const createContainer = (cb) => {
    blobSvc.createContainerIfNotExists(container, (err, result, response) => {
      cb(err, response);
    });
  };

  const createBlob = (cb) => {
    let options = {
      contentSettings: {
        contentType: 'text/plain;charset=utf-8'
      }
    };

    if (text.length > maxBolbSize) {
      cb(`current text size is ${text.length/1000000}MB, blob size should be less than 64MB`);
    } else {
      blobSvc.createBlockBlobFromText(container, blob, text, options, (err, result, response) => {
        cb(err, response);
      });
    }

  };

  const createSAS = (cb) => {
    let startDate = new Date();
    let expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 10080);
    startDate.setMinutes(startDate.getMinutes() - 100);

    let sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
        Start: startDate,
        Expiry: expiryDate
      }
    };

    let blobSAS = blobSvc.generateSharedAccessSignature(container, blob, sharedAccessPolicy);
    let host = blobSvc.host;
    let sasUrl = `${host.primaryHost}${container}/${blob}?${blobSAS}`;

    cb(null, sasUrl);
  };

  async.series([createContainer, createBlob, createSAS], (err, results) => {
    log.info(`Blob async series:`, err, results);

    if (!err) {
      cb(null, results[2]);
    } else {
      cb(err);
    }
  });
};

module.exports = {
  dump: dumpToBlob
};
