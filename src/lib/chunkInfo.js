'use strict'

const fastq = require('fastq')
let fq

const db = require('./database.js')

// TODO; move dbSchema into it's own file.
const dbTransformer = {
  init: (data, dbObj) => {
    if (dbObj.type === 'GAME')
      data.parent = 0
  },

  id: 'number',

  name: (oldValue, newValue) => {
    // Preserve original name if new name is unknown.
    if (oldValue !== newValue) {
      if (newValue === 'Unknown Depot') {
        // Make sure the old value exists
        if (oldValue)
          return oldValue
      }
    }

    return newValue
  },

  type: 'string',
  extra: 'string',

  parent: (oldValue, newValue) => {
    if (!oldValue)
      return newValue

    // No need to change if already MULTI
    if (oldValue == 'MULTI')
      return 'MULTI'

    if (oldValue !== newValue)
      return 'MULTI'

    return newValue
  },  //'string',
  //depot: Set - depots should be serialized/deserialized to/from Sets
}

const tempCache = {}


const clients = {
  generic: require('../clients/generic/index.js'),
  steam: require('../clients/steam/index.js'),
}

class chunkInfo {
  static init() {
    for (let client of Object.keys(clients)) {
      db.prepare(client, dbTransformer)
    }
  }

  static async process(client, url) {
    // Initialize fast queue
    if (!fq)
      fq = fastq.promise(this.processItem, 1)

    return fq.push({ client, url })
  }

  static async processItem(args) {
    const { client, url } = args

    // Resolve the lookup client and parse an ID
    const lookupClient = useClient(client)
    const chunkID = lookupClient.parseID(url)

    if (tempCache[chunkID])
      return tempCache[chunkID]

    // Return item from DB if we have it
    //const depotItem = db.get(client, 'id', chunkID)
    //if (depotItem)
    //  return depotItem
    // FIXME: Resolve refs for this db section. Perhaps a better way would be to serialize/deserialize for the DB..

    // FIXME: Re-enable DB cache once done testing meta api.

    // Use client lookup to lookup item by ID
    const lclient = new lookupClient(chunkID)
    let chunkData

    try {
      chunkData = await lclient.getInfo()
    } catch (err) {
      console.error(`Lookup client '${client}' had an error:`, err)
    }

    // TODO: Turn into GQL error
    if (chunkData?.errors)
      throw new Error(chunkData.errors[0].message)

    // If chunkData doesn't exist, stub it for normalization
    if (!chunkData || typeof chunkData !== 'object')
      chunkData = {}

    chunkData.id = chunkID

    tempCache[chunkID] = chunkData

    //console.log(chunkData)
    return chunkData

    // Normalize data and save to DB
    const normalizedChunkData = lookupClient.normalize(chunkData)
    console.log(normalizedChunkData)

    //return normalizedChunkData // FIXME: Remove after testing

    // TODO: insert into DB with a timeout, so that items will resolve after an hour or so. How does this affect other depot stuffs?
    // Need to rethink this part. Right now, inserting it into DB is a way to stop hitting lookup clients.
    db.set(dbTransformer, client, normalizedChunkData)

    // TODO: Use gameUpdateCheck() idea.
    // Once a day, we can phone home and retrieve lastBuildNumber and check for app updates that are in our local DB.
    // This feature will be opt-in, because many might not like it.
    // This sends GAME items with build number and checks the diff on meta API.

    // Process child depots
    /* FIXME: Make this an array.
    const depotRefs = normalizedChunkData.depots || {}

    for (let childDepots of Object.keys(depotRefs)) {
      const childDepot = depotRefs[childDepots]

      // Create child depot in DB
      db.set(dbTransformer, client, childDepot)
    }*/

    // TODO: If we have a parent, go ahead and run it through processItem() too.


    return normalizedChunkData
  }
}

function useClient(client) {
  if (!clients[client]) {
    console.error(`Error: Lookup client '${client}' does not exist! Falling back to generic client.`)
    return clients.generic
  }

  return clients[client]
}

module.exports = chunkInfo
