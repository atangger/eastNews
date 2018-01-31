local encode = cjson.encode
local decode = cjson.decode
local queue = KEYS[1]
local start = KEYS[2]
local stop = KEYS[3]
local res = {}

local all = redis.call('lrange', queue, start, stop)
for index, item in pairs(all) do
   table.insert(res, 1, decode(item));
end

return encode(res)
