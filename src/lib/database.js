'use strict'

const sqlite3 = require('better-sqlite3')
const db = new sqlite3('data/gameinfo.db', /*{ verbose: console.log }*/)

module.exports = class database {
  static prepare(table, tableKeys) {
    if (typeof tableKeys !== 'object')
      throw new Error('Invalid tableKeys passed to database.prepare')

    let tableKeysStr = ''
    let index = 0

    for (let tableKey of Object.keys(tableKeys)) {
      if (tableKey == 'init')
        continue

      tableKeysStr += (index > 0) ? ', ' + tableKey : tableKey
      index++
    }

    // TODO: Object.keys(tableKeys).join(', ')

    const stmt = db.prepare(`CREATE TABLE IF NOT EXISTS ${table} (${tableKeysStr})`)
    stmt.run()
  }

  static get(table, keyName, keyValue) {
    const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${keyName} = ?`)
    const res = stmt.get(keyValue)

    return res
  }

  static has(table, keyName, keyValue) {
    const res = this.get(table, keyName, keyValue)

    // Because it may return undefined or null for specific value
    if (!res)
      return false

    return true
  }

  static serialize(transformer, data, dbObj) {
    // Call init function on transformer if it exists, for transformations.
    if (typeof transformer.init === 'function')
      transformer.init(data, dbObj)

    // Only serialize stuff in the transformer
    const returnObj = {}
    for (let transformKey of Object.keys(transformer)) {
      // If no data to operate on, skip
      if (typeof data[transformKey] === 'undefined' || typeof data[transformKey] === 'null')
        continue

      const transformValue = transformer[transformKey]

      if (typeof transformValue === 'function') {
        //console.log(schemaKey, 'is function')
        const fnResult = transformValue(dbObj[transformKey], data[transformKey], dbObj)
        returnObj[transformKey] = fnResult
        continue
      }

      if (typeof transformValue === 'object') {
        if (typeof transformValue.serialize === 'function') {
          const fnResult = transformValue.serialize(dbObj[transformKey], data[transformKey], dbObj)
          returnObj[transformKey] = fnResult
          continue
        }

        if (typeof transformValue.deserialize === 'function') {
          const fnResult = transformValue.serialize(dbObj[transformKey], data[transformKey], dbObj)
          returnObj[transformKey] = fnResult
          continue
        }
      }

      returnObj[transformKey] = data[transformKey]
    }

    // Only update items that have changed.
    for (let returnObjKeys of Object.keys(returnObj)) {
      if (returnObj[returnObjKeys] == dbObj[returnObjKeys])
        delete returnObj[returnObjKeys]
    }

    return returnObj
  }

  static set(transformer, table, data) {
    const dbObj = this.get(table, 'id', data.id)

    // Item exists in the DB already
    if (dbObj) {
      const serializedObj = this.serialize(transformer, data, dbObj)
      const keys = Object.keys(serializedObj)

      // Nothing to update
      if (keys.length === 0)
        return //console.warn(`UPDATE ${table} WHERE id = '${data.id}' - Nothing to update`)

      const insert =  db.prepare(`UPDATE ${table} SET ${keys.map(x => x + " = ?").join(", ")} WHERE id = '${data.id}'`)
      insert.run(...Object.values(serializedObj))
    } else {
      const serializedObj = this.serialize(transformer, data, {})
      const keys = Object.keys(serializedObj)

      // Nothing to insert
      if (keys.length === 0)
        return console.warn(`INSERT INTO ${table} for '${data.id}' - Nothing to insert`)

      const insert =  db.prepare(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${"?, ".repeat(keys.length).slice(0, -2)})`)
      insert.run(...Object.values(serializedObj))
    }
  }
}


      // TODO: Add typeof checks, against schema
      // TODO: add .serialize and .deserialize
