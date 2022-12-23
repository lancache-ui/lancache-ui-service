'use strict'

const activeGames = [] // TODO: replace with Set

let totalReqs = 0
let totalHits = 0
let totalMisses = 0

function gameTimeout(game) {
  const timeout = setTimeout(() => {
    //removeGame(game.id)
    let removeInactiveGameIndex = activeGames.findIndex(gameItem => gameItem.id === game.id)
    if (removeInactiveGameIndex === -1)
      return

    activeGames.splice(removeInactiveGameIndex, 1)
    //console.log('Should remove game:', game.name, 'timeout:', timeout)
    // TODO: update pubSub
  }, 30 * 1000)

  //console.log('Create gameTimeout:', game.name, 'timeout:', timeout)
  return timeout
}


function parseActiveItem(gameInfo, logItem) {
  // If item is a child, retrieve parent's info
  // TODO: simplify this by gameInfo(gameInfo.parent)

  if (gameInfo.parent && gameInfo.parent.name) {
    const gqlItem = {
      id: gameInfo.parent.id,
      service: logItem.service,

      client: logItem.client, // TODO: determine IP/DHCP hostname (for now, just export IP and then we can do GQL resolveClient(ip) => dhcp), GQL should cache that

      name: gameInfo.parent.name,
      content: gameInfo.name,
    }
    return gqlItem

  } else {
    const gqlItem = {
      id: gameInfo.id,
      service: logItem.service,

      client: logItem.client,

      name: gameInfo.name,
      content: '', // temp fix for UI
    }

    return gqlItem
  }
}

module.exports = {
  addActive: function(gameInfo, logItem) {
    const game = parseActiveItem(gameInfo, logItem)

    // FIXME: This won't work for multiple clients, different DLC, etc.. Need to fix the filter...
    const foundActiveGame = activeGames.find(gameItem => gameItem.id === game.id)
    if (foundActiveGame) { // lastSeen
      //console.log('clearTimeout:', game.name, 'timeout:', foundActiveGame.timeout)

      clearTimeout(foundActiveGame.timeout)
      foundActiveGame.timeout = gameTimeout(game)
      return activeGames
    }

    game.timeout = gameTimeout(game)
    activeGames.push(game)

    return activeGames
  },

  getStats() {
    return {
      totalReqs,
      totalHits,
      totalMisses,
    }
  },

  getActive() {
    return activeGames
  },

  addRequest(gameInfo, logItem) {
    totalReqs++
    this.addHitMissRatio(gameInfo, logItem)

    // TODO: publish to db for resume support.
    return {
      totalReqs,
      totalHits,
      totalMisses,
    }
  },

  addHitMissRatio(gameInfo, logItem) {
    // TODO: add miss/hit stat to individual item
    if (logItem.cache === 'HIT')
      totalHits++
    else
      totalMisses++

  },
}

// lastAccess

function findGameRoot() {
  // If this is a child depot, traverse until we have parent.

}
