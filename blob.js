/*
Performances: https://docs.microsoft.com/en-us/azure/storage/common/storage-scalability-targets
20,000 reqs per storage account per second
200 storage account per sub
max 500 TB per storage axxount
non-us max ingress 5Gbps for GRS/ZRS, 10Gps for LRS
non-us max egress 10Gps for RA-GRS/GRS/ZRS, 15GPS for LRS
*/

const azure = require('azure-storage');
const blobSvc = azure.createBlobService();
const async = require('async');
const config = require(`${__dirname}/config`);
const Log = require(`${__dirname}/log`);

const log = new Log({
  tag: 'blob'
});

const blobUnit = 4 * 1000 * 1000;
const maxBlobSize = 5000 * blobUnit;

const writeText = (container, blob, text, cb) => {
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

    if (text.length > maxBlobSize) {
      cb(`current text size is ${text.length/1000000}MB, blob size should be less than ${maxBlobsize/1000}MB`);
    } else {
      blobSvc.createAppendBlobFromText(container, blob, '', options, (err, result, response) => {
        cb(err, response);
      });
    }
  };

  const appendSlicedText = (cb) => {
    let slicedText = [];

    for (let i = 0; i < Math.ceil(text.length/blobUnit); i++) {
      slicedText.push(text.slice(i * blobUnit, (i + 1) * blobUnit));
      log.info(`Slice ${i}: ${slicedText[i].length} bytes`);
    }

    async.eachSeries(slicedText, (text, cb) => {
      blobSvc.appendFromText(container, blob, text, (err, result, response) => {
        cb(err, response);
      });
    }, (err) => {
      cb(err);
    });
  };

  const createSAS = (cb) => {
    let startDate = new Date();
    let expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 512640);
    startDate.setMinutes(startDate.getMinutes() - 1440);

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

  async.series([createContainer, createBlob, appendSlicedText, createSAS], (err, results) => {
    log.info(`Blob async series:`, err, results);

    if (!err) {
      cb(null, results[3]);
    } else {
      cb(err);
    }
  });
};

// 50MB/s, sample: http://willi.am/blog/2014/07/03/azure-blob-storage-and-node-downloading-blobs/
const writeStream = (container, blob, stream, cb) => {
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

    let blobStream = blobSvc.createWriteStreamToBlockBlob(container, blob, options, (err, result, response) => {
      if (err) {
        log.info(`Stream upload err: ${err}`);
      } else {
        log.info(`Stream upload finished: ${result}`);
      }

      cb(err, result);
    });

    stream.pipe(blobStream);
  };

  const createSAS = (cb) => {
    let startDate = new Date();
    let expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 525600);
    startDate.setMinutes(startDate.getMinutes() - 1440);

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

const readText = (container, blob, cb) => {
  blobSvc.getBlobToText(container, blob, (err, text) => {
    cb(err, text);
  });
};

const readStream = (container, blob, stream, cb) => {
  blobSvc.getBlobToStream(container, blob, stream, (err, res) => {
    cb(err, res);
  });
};

module.exports = {
  writeText: writeText,
  writeStream: writeStream,
  readText: readText,
  readStream: readStream
};
