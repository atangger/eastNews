module.exports = {
  influx: {
    host: process.env.INFLUX_HOST || '10.6.0.10',
    port: process.env.INFLUX_PORT || 8086,
    table: {
      index_ps: 'index_ps',
      income_statment: 'income_statment',
      balance_sheet: 'balance_sheet',
      cash_flow: 'cash_flow',
      daily_quote: 'daily_quote'
    },
    response_format: {
      json: 'json',
      csv: 'csv',
      json_url: 'json_url',
      csv_url: 'csv_url',
      blob_url: 'blob_url'
    },
    quote_resolution: {
      '3second': {
        value: '3second'
      },
      '1minute': {
        value: '1minute'
      },
      '3minute': {
        value: '3minute'
      },
      '5minute': {
        value: '5minute'
      },
      '1hour': {
        value: '1hour'
      },
      'day': {
        value: 'day',
        table: 'daily_quote'
      },
      'week': {
        value: 'week'
      },
      'month': {
        value: 'month'
      },
      'quarter': {
        value: 'quarter'
      }

    }
  },
  blob: {
    container: 'wfe'
  },
  ori: {
    explorer: `https://azure.microsoft.com/en-us/features/storage-explorer/`,
    daily_quote: {
      source: `https://financestore.file.core.windows.net/financeafs/data/daily_quote.csv`,
      local: `/finance/data/daily_quote.csv`,
      schema: ['date', 'code', 'name', 'closing_price', 'highest_price', 'lowest_price', 'opening_price', 'pre_closing_price', 'up_down_amount', 'up_down_rate', 'turnover_rate', 'trade_volume', 'trade_amount', 'total_market_capitalization', 'circulation_market_capitalization', 'trade_num'],
      ch: ['日期', '股票代码', '名称', '收盘价', '最高价', '最低价', '开盘价', '前收盘', '涨跌额', '涨跌幅', '换手率', '成交量', '成交金额', '总市值', '流通市值', '成交笔数']
    },
    es_report: {
      source: `https://financestore.file.core.windows.net/financeafs/data/es_report.csv`,
      local: `/finance/data/es_report.csv`,
      schema: ['date', 'stock_num', 'index_ps:basic_eps', 'index_ps:dilution_eps', 'index_ps:net_assets_ps', 'index_ps:operation_cash_flow_ps', 'index_ps:roe', 'index_ps:rate_of_total_asset_return', 'index_ps:rate_of_gross_profit', 'index_ps:rate_of_net_profit_on_sales', 'index_ps:rate_of_debt_asset', 'index_ps:rate_of_operation_profit_growth', 'index_ps:rate_of_net_profit_growth_of_parent_company_shareholder', 'income_statment_summary:total_operation_income', 'income_statment_summary:total_operation_costs', 'income_statment_summary:operation_income', 'income_statment_summary:operation_cost', 'income_statment_summary:operation_profit', 'income_statment_summary:total_profit', 'income_statment_summary:net_profit', 'income_statment_summary:net_profit_of_parent_company_shareholder', 'balance_sheet_summary:total_assets', 'balance_sheet_summary:total_liabilities', 'balance_sheet_summary:equity_of_shareholder', 'balance_sheet_summary:equity_of_parent_company_shareholder', 'cash_flow_summary:cash_flow_of_operation', 'cash_flow_summary:cash_flow_of_investment', 'cash_flow_summary:cash_flow_of_funding', 'cash_flow_summary:net_increase_of_cash_and_equivalent'],
      en: ['date', 'index_ps', 'basic_eps', 'dilution_eps', 'net_assets_ps', 'operation_cash_flow_ps', 'roe', 'rate_of_total_asset_return', 'rate_of_gross_profit', 'rate_of_net_profit_on_sales', 'rate_of_debt_asset', 'rate_of_operation_profit_growth', 'rate_of_net_profit_growth_of_parent_company_shareholder', 'income_statment_summary', 'total_operation_income', 'total_operation_costs', 'operation_income', 'operation_cost', 'operation_profit', 'total_profit', 'net_profit', 'net_profit_of_parent_company_shareholder', 'balance_sheet_summary', 'total_assets', 'total_liabilities', 'equity_of_shareholder', 'equity_of_parent_company_shareholder', 'cash_flow_summary', 'cash_flow_of_operation', 'cash_flow_of_investment', 'cash_flow_of_funding', 'net_increase_of_cash_and_equivalent'],
      ch: ['报告期日期', '每股指标', '每股收益-基本(元)', '每股收益-稀释(元)', '每股净资产(元)', '每股经营活动产生的现金流量净额(元)', '净资产收益率(%)', '总资产净利率(%)', '销售毛利率(%)', '销售净利率(%)', '资产负债率(%)', '营业利润同比增长率(%)', '归属母公司股东的净利润同比增长率(%)', '利润表摘要', '营业总收入(元)', '营业总成本(元)', '营业收入(元)', '营业成本(元)', '营业利润(元)', '利润总额(元)', '净利润(元)', '归属母公司股东的净利润(元)', '资产负债表摘要', '资产总计(元)', '负债合计(元)', '股东权益(元)', '归属母公司股东的权益(元)', '现金流量表摘要', '经营活动产生的现金流量(元)', '投资活动产生的现金流量(元)', '筹资活动产生的现金流量(元)', '现金及现金等价物净增加(元)']
    },
    stock_info: {
      source: `https://financestore.file.core.windows.net/financeafs/data/stock_info.json`,
      local: `${__dirname}/../data/stock_info.json`,
      schema: {
        market: {
          code: {
            name: '',
            quote_url: '',
            sector_en_name: '',
            sector_cn_name: ''
          }
        }
      }
    }
  }
};
