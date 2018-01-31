local decode = cjson.decode
local encode = cjson.encode
local hashTable = KEYS[1]
local res = {}

local all = redis.pcall('hgetall', hashTable)
for index, item in pairs(all) do
   if index % 2 ~= 0 then
      res[item] = decode(all[index + 1])
   end
end

return encode(res)
