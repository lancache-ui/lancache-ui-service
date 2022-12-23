import { createServer, createPubSub } from '@graphql-yoga/node'
import * as fs from 'fs'
import * as path from 'path'

import logtail from './lib/logtail.js'
import chunkInfo from './lib/chunkInfo.js'

import stats from './stats.js'

const pubSub = createPubSub()
// FIXME: Use a .env file + docker environment variable for log file location
const logFileLocation = '/run/user/1000/gvfs/sftp:host=10.0.1.101,user=root/mnt/user/appdata/lancache/logs/access.log'
const tailInstance = new logtail(logFileLocation, false)

chunkInfo.init()
// stats.init(pubSub)

const typeDefs = fs.readFileSync(path.join(process.cwd(), "schema.graphql"), {
  encoding: 'utf-8',
})

function newPubSub(name: string) {
  return {
    subscribe: (_, {}, { pubSub } ) => pubSub.subscribe(name),
    resolve: (payload) => payload,
  }
}

const resolvers = {
  Query: {
    stats: () => stats.getStats(),
    active: () => stats.getActive(),
    // top, bySize

    lookup: async (_, { service, url }) => {
      const chunk = await chunkInfo.process(service, url)
      console.log(`${chunk.name} (`, Number(chunk.id), ')', (chunk.parent ? `-> ${chunk.parent.name} (${Number(chunk.parent.id)})` : ''))
      return chunk
    }
  },

  Subscription: {
    stats: newPubSub('stats'),
    active: newPubSub('active'),
    //top: newPubSub('top'),
    //bySize: newPubSub('bySize'),
  }
}

/* TODO: Add type checking to pubsub
const pubSub = createPubSub<{
  data: [payload: any]
}>()
*/


const server = createServer({
  endpoint: '/api',
  port: 3002,
  logging: true,

  schema: {
    typeDefs,
    resolvers,
  },
  context: {
    pubSub,
  },
})


tailInstance.on('item', async (logItem) => {
  // Don't handle lancache heartbeats. We may use this in the future for something.
  if (logItem.url === '/lancache-heartbeat')
    return

  // Process chunk
  const gameInfo = await chunkInfo.process(logItem.service, logItem.url)

  pubSub.publish('stats', stats.addRequest(gameInfo, logItem))

  const activeGames = stats.addActive(gameInfo, logItem)
  pubSub.publish('active', activeGames)

  console.log(`${gameInfo.name} (`, Number(gameInfo.id), ')', (gameInfo.parent ? `-> ${gameInfo.parent.name} (${Number(gameInfo.parent.id)})` : ''))
})

setInterval(() => {
  const activeGames = stats.getActive()
  pubSub.publish('active', activeGames)
}, 30 * 1000)

server.start()
tailInstance.start()

// pnpm dev
