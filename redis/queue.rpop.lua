local queue = KEYS[1]
local encode = cjson.encode

return redis.pcall('rpop', queue)
