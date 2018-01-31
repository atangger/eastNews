local hashTable = KEYS[1]
local field = KEYS[2]

return redis.pcall('hget', hashTable, field)
