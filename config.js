const Influx = require('influx');

module.exports = {
  pipeline: {
    getter: {
      stockList: {
        timelineSuffix: ':getter.timeline',
        hashTable: 'stocklist:getter.latest',
        blob: 'stocklistblob',
        queue: 'stocklist:queue'
      }
    },
    cleaner: {
      stockList: {
        timelineSuffix: ':cleaner.timeline',
        hashTable: 'stocklist:cleaner.latest'
      }
    }
  },
  blob: {
    container: {
      stockList: 'stocklist'
    }
  },
  secret: {
    fingerprint: `MIIEowIBAAKCAQEA3wr6YJrB+UIdZ09pmYsLj13FP7Y8G4o9irporOPo4lr/9zBqebO4bMV/f3d2a6ybSpAbkae3zTjIH8FdZXuQyrgBl01AJFSL6m6rXt/ol6EBBkIW8PK2Fez+t8NR8sIiCOcJKuHVBTXh7PDMnBauYQrUTN35/faUf0hbz3kvShKdSp+zFe1tlGZmPhN/u8B+dkptGAGtMdrnHfDVAbJFqx+eFTZv2S3uzE3mWb+/38rXDLupSPiGVuTWZBNLpj63F67DbXMYY/D39qFEN7myE3k+ZmlG6M2A4ykkQXvMvbbooSG+m8nq0QumYibr7PT+DqquD6/DA4qSQJzkiPLwvQIDAQABAoIBAAheZhSX2e1bULUeoqyzLeTcNNl2If06i6KX6fOKvaM4nOAOfgBBAQt7wZPrzJKvsEf07kPh0iCuH7wpSjLTlxQ0IUMnD+ANGA7cxitSJW0DCoHMmwXBZZmfAdOtTXbZV+OTn6FvRcnjQq3cPyEgLLzRZjPYJFgmF15LPb6kImUaCcPciFlVoat/XGli+nf+LAoA7qPReXPxSCZ3nGmMoV8Ynnwv/R4n7DDUWbjY40Po9VAp1vLzRTpiKjBvQSA1AzFFpICqHU72J77OTV+mpu1EmEaG6n7VOjiZaT2mUGXasilBDhSQ/hCsim9gu/fjYZSXIVgl5HC5PotXh+r7uzUCgYEA8j9OzQ8L6iG9/Ut9CCCm9+6nbQnAiN1jEmV2LQXUl9Zu3qcgMmgVTIIDrPaYFNGIp48m02i45VsplweJFBdj9kLTTFxStfO8CYJfc0oyhjGVLI38MOVBRUtbWAReO44yIEy2QBbxBrYQ4gGgNiZOTy2n3gk4f8vc8jAJ01t/UncCgYEA67SQRyxB6prXDzu8EKWMP51LRlqoSLlgMFx5G2wW15s5YVZNEqN64A06B7UgyQ9GvjWF77dqZf2QgP2m5G6rwl0MAKo0RZe4IyLxvSb+GyEiRPMOwyuocLSuD8xPOK1FRoNZjYzAdtPPp8GJYX0CxPPicSeMIHxRW7WTqiltj2sCgYB4gwwVsUWRHWYhy1sRHwVRVDWQZgiVTeWKclU/AqaHPtL7CxNWYDcwT4G6mxZ/TNn52ZpME83fs+FV1BbamuRMz2PEmi0/fVhvNp97gE7wOVxnxN7QCEzXRyzS9aFXaV8AeIk2CvOvDgYKGRr1tUrB0wmuyNGFqgpppYJN1jfZ8wKBgQDKSj+BNfSkmpt0UXoId2w0tJSEHw5Ky/5HwzWVWWEJTgkjBuRC2Nd+LxvcvZETve6jFGCM6ceBHOvGKOvxJSJ4P08ryuftylaYoUcDnZdG0Cu3Uax4CVxfLEuZIXLqpE9xetiBHocMUuJiBi1KSvq1/xyhSoPRcdRWGNgIzijajXQKBgBuuhA+C25fzm+p9D5oeLdcZ8eVqzQd1hB6uj3p7PWEaCmHcq1NE6dzZsXWbC7yHVlwNVgSB3vqspqJ+rLBX1jn5AX6OzyQ1AlebBLl4OcsK5UIUO5vUYg+xcSAfLl3F0ilMfjSjfpt1EmZcS5YC7nbg+WMfkA+ooemTCAbOYb2A`
  },
  output: {
    stdout: 'stdout',
    redis: 'redis',
    csv: 'csv',
    json: 'json',
    blob: 'blob'
  },
  cfi: {
    slUrl: page => `http://data.cfi.cn/cfidata.aspx?sortfd=&sortway=&curpage=${page}&fr=content&ndk=A0A1934A1939A1947A1952&xztj=&mystock=`,
    quoteUrl: code => `http://quote.cfi.cn/quote_${code}.html`,
    slLocalCSVPath: `${__dirname}/data/sl.csv`,
    slLocalJSONPath: `${__dirname}/data/sl.json`
  },
  stockMarket: {
    china: {
      sh: {
        a: {
          regexs: [/^600\d{3}/, /^601\d{3}/, /^603\d{3}/],
          cnName: 'A股'
        },
        b: {
          regexs: [/^900\d{3}/],
          cnName: 'B股'
        },
        p: {
          regexs: [/^700\d{3}/],
          cnName: '配股'
        },
        x: {
          regexs: [/^730\d{3}/],
          cnName: '新股申购'
        },
        gzxh: {
          regexs: [/^001\d{3}/],
          cnName: '国债现货'
        },
        qyzq: {
          regexs: [/^110\d{3}/, /^120\d{3}/],
          cnName: '企业债券'
        },
        cnName: '上交所'
      },
      sz: {
        a: {
          regexs: [/^000\d{3}/],
          cnName: 'A股'
        },
        b: {
          regexs: [/^200\d{3}/],
          cnName: 'B股'
        },
        g: {
          regexs: [/^300\d{3}/],
          cnName: '创业版'
        },
        p: {
          regexs: [/^080\d{3}/],
          cnName: '配股'
        },
        z: {
          regexs: [/^002\d{3}/],
          cnName: '中小板股票'
        },
        cnName: '深交所'
      },
      specialMeaning: {
        xr: {
          regex: /.*XR.*/,
          meaning: '该股已除权，购买这样的股票后将不再享有分红的权利。'
        },
        dr: {
          regex: /.*DR.*/,
          meaning: '除权除息，购买这样的股票不再享有送股派息的权利。'
        },
        xd: {
          regex: /.*XD.*/,
          meaning: '股票除息，购买这样的股票后将不再享有派息的权利。'
        },
        st: {
          regex: /^ST.*/,
          meaning: '连续两个会计年度都出现亏损的公司施行的特别处理。ST即为亏损股。'
        },
        _st: {
          regex: /^\*ST.*/,
          meaning: '连续三年亏损，有退市风险的意思，购买这样的股票要有比较好的基本面分析能力。'
        },
        n: {
          regex: /.*N.*/,
          meaning: '新股上市首日的名称前都会加一个字母N，即英文NEW的意思。'
        },
        s_st: {
          regex: /.*S\*ST.*/,
          meaning: '公司经营连续三年亏损，进行退市预警和还没有完成股改。'
        },
        sst: {
          regex: /.*SST.*/,
          meaning: '公司经营连续二年亏损进行的特别处理和还没有完成股改。'
        },
        s: {
          regex: /.*S.*/,
          meaning: '还没有进行或完成股改的股票。'
        },
        nst: {
          regex: /.*S.*/,
          meaning: '经过重组或股改重新恢复上市的ST股。'
        },
        pt: {
          regex: /.*PT.*/,
          meaning: '退市的股票。'
        }
      }
    }
  },
  redis: {
    pro: {
      host: process.env.REDIS_HOST_PRO || '127.0.0.1',
      port: process.env.REDIS_PORT_PRO || 30001,
      stockList: 'sl'
    },
    test: {
      host: process.env.REDIS_HOST_TEST || '127.0.0.1',
      port: process.env.REDIS_PORT_TEST || 40001,
      stockList: 'sl'
    }
  },
  influx: {
    pro: {
      host: process.env.INFLUX_HOST_PRO || '127.0.0.1',
      port: process.env.INFLUX_PORT_PRO || 30002,
      table: {
        influxLog: 'pipeline_log'
      },
      handlers: {
        influxLog: new Influx.InfluxDB({
          host: process.env.INFLUX_HOST_PRO || '127.0.0.1',
          port: process.env.INFLUX_PORT_PRO || 30002,
          database: 'pipeline_log',
          schema: [
            {
              measurement: 'scheduler',
              fields: {
                'err': Influx.FieldType.STRING,
                'res': Influx.FieldType.STRING
              },
              tags: [
                'job',
                'host',
                'pid',
                'timezone',
                'status'
              ]
            },
            {
              measurement: 'getter',
              fields: {
                'err': Influx.FieldType.STRING,
                'res': Influx.FieldType.STRING
              },
              tags: [
                'job',
                'host',
                'pid',
                'timezone',
                'status'
              ]
            },
            {
              measurement: 'cleaner',
              fields: {
                'err': Influx.FieldType.STRING,
                'res': Influx.FieldType.STRING
              },
              tags: [
                'job',
                'host',
                'pid',
                'timezone',
                'status'
              ]
            },
            {
              measurement: 'aligner',
              fields: {
                'err': Influx.FieldType.STRING,
                'res': Influx.FieldType.STRING
              },
              tags: [
                'job',
                'host',
                'pid',
                'timezone',
                'status'
              ]
            }
          ]
        })
      }
    },
    test: {
      host: process.env.INFLUX_HOST_TEST || '127.0.0.1',
      port: process.env.INFLUX_PORT_PRO || 40002,
      table: {
        influxLog: 'pipeline_log'
      },
      handlers: {
        influxLog: new Influx.InfluxDB({
          host: process.env.INFLUX_HOST_TEST || '127.0.0.1',
          port: process.env.INFLUX_PORT_PRO || 40002,
          database: 'pipeline_log',
          schema: [
            {
              measurement: 'scheduler',
              fields: {
                'err': Influx.FieldType.STRING,
                'res': Influx.FieldType.STRING
              },
              tags: [
                'job',
                'host',
                'pid',
                'timezone',
                'status'
              ]
            },
            {
              measurement: 'getter',
              fields: {
                'err': Influx.FieldType.STRING,
                'res': Influx.FieldType.STRING
              },
              tags: [
                'job',
                'host',
                'pid',
                'timezone',
                'status'
              ]
            },
            {
              measurement: 'cleaner',
              fields: {
                'err': Influx.FieldType.STRING,
                'res': Influx.FieldType.STRING
              },
              tags: [
                'job',
                'host',
                'pid',
                'timezone',
                'status'
              ]
            },
            {
              measurement: 'aligner',
              fields: {
                'err': Influx.FieldType.STRING,
                'res': Influx.FieldType.STRING
              },
              tags: [
                'job',
                'host',
                'pid',
                'timezone',
                'status'
              ]
            }
          ]
        })
      }
    }
  }
};
