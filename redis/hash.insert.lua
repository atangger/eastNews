local decode = cjson.decode
local encode = cjson.encode
local hashTable = KEYS[1]
local args = ARGV[1]
local insert = 0
local update = 0
local nochange = 0
local insertList = {}
local updateList = {}
local nochangeList = {}

for index, item in pairs(decode(args)) do
   local key = tostring(item.k)
   local value = tostring(encode(item.v))
   local timestamp = tostring(item.t)
   local timelineSuffix = tostring(item.tls)
   local timelineHash = key .. timelineSuffix

   if redis.pcall('hexists', hashTable, key) == 1 then
      if redis.pcall('hget', hashTable, key) ~= value then
         redis.call('hset', hashTable, key, value)
         redis.call('hset', timelineHash, timestamp, value)
         update = update + 1
         table.insert(updateList, key)
      else
         nochange = nochange + 1
         table.insert(nochangeList, key)
      end
   else
      redis.call('hset', hashTable, key, value)
      redis.call('hset', timelineHash, timestamp, value)
      insert = insert + 1
      table.insert(insertList, key)
   end
end

return encode({
      insert = insert,
      update = update,
      nochange = nochange,
      insertList = insertList,
      updateList = updateList,
      nochangeList = nochangeList
})
