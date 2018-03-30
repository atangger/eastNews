# Document for eastNews

EastNews is a multi-process online-storage, Nodejs-based web crawler system.
## Main modules
  - eastmoney_list -- crawler for news list 
  - eastmoney_content -- crawler for news content
  - eastmoney_list_update -- updater for news list 
  - eastmoney_content_update -- updater for news content

# eastmoney_list 

  - Rely on the **sl.json** which provide the stock list
  - The data will be writen to blob the blob key is set in the **ev.sh**
  - Should set the **ENV** for blob storage:
  - The cintainer name is in the eastnews_config.js
  ```sh
  $ source ev.sh
  ```
# eastnews_config:
```
module.exports = {
	blob_container: 'twjcontainer', // blob container name
	rurl: 'http://so.eastmoney.com/Web/GetSearchList',// eastmoney search api
	cookie: "REQUEST COOKIE"

}
```
# eastmoney_content
- Rely on the list data in the blob container for list.
- The container is the same as the eastmoney_list
- This script will overwrite the list file on the blob adding a new field of the news blob url

# eastmoney_list_update
- TODO: merger the schema updater to this part 

# eastmoney_content_update
- TODO: merge the schema updater to this part


# Influx Schema
``` json
news_tags: &news_tags
  - title  
news_fields: &news_fields
  detail_url: # blob url to the whole schema
  pv: # view number 
  cv: # comments number 
  active_window: # the influence duration of the news 
  related_codes: # the stocks relat to this news
  author: # the author of this news  
news: &news
  database: news
  schema:
    news:
      measurement: news
      fields: *news_fields
      tags: *news_tags
```
# Dependency
``` sh
npm install redis jsdom influx cheerio azure-storage
```

