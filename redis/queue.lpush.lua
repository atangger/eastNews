local queue = KEYS[1]
local args = ARGV[1]
local decode = cjson.decode
local encode = cjson.encode
local records = {}

for index, item in pairs(decode(args)) do
   redis.call('lpush', queue, encode(item))
   table.insert(records, item)
end

return encode(records)
