local hashTable = KEYS[1]

return redis.pcall('hkeys', hashTable)
