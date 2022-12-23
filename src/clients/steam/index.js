'use strict'

const phin = require('phin')

const serviceURL = 'http://api.object.media:3001' // TODO: Load from .env file

module.exports = class steamLookupClient {
  static parseID(url) {
    // Example: '/depot/322331/chunk/XXX'
    // Example: '/depot/322331/manifest/XXX/X/XXX'

    // Legacy logs
    url = url.replace('https://', '')
    url = url.replace('http://', '')

    const urlSections = url.split('/')
    const depotID = urlSections[2]

    return depotID
  }

  constructor(depotID) {
    this.id = depotID
    this.service = "steam"
  }

  // static login(), and instance reuseLogin()

  static normalize(chunkData) {
    if (chunkData.parent)
      chunkData.parent = chunkData.parent?.id

    return chunkData
  }

  async getInfo() {
    console.log('Looking up game:', this.id)

    try {
      const url = new URL(`${serviceURL}/api`)

      url.searchParams.append(
        'query',
        /* GraphQL */ `
        query {
          lookup(id: ${this.id}, service: "steam") {
            id
            service # Needed? We already know service.

            type
            name

            # If we are a depot, we want the parent and all it's depots for faster lookups later
            parent {
              id

              type
              name

              depots { # TODO: Implement @stream, since we don't necessarily need all the depots right away
                id

                type
                name
              }
            }

            # If we are a game, we want all it's depots for faster lookups later
            depots { # TODO: Implement @stream, since we don't necessarily need all the depots right away
              id
              service # Needed? We already know service.

              type
              name
            }
          }
        }
        `,
      )

      // TODO: add depots to list, cuz right now it's only retrieving app ID as first fetch. Then it requires another fetch for
      // depots that it sees.

      const res = await phin({ url: url.toString(), method: 'GET', parse: 'json' })
      return res.body?.data?.lookup


    } catch(e) {
      console.log('metadataAPI failed:')
      console.log(e)
    }

    return null
  }
}


// TODO: implement GQL/fetch cache with TTL for 30 minutes.
// TODO: FIXME: proton lookups, not in global steam API list. 1580130

// TODO: Set a hard limit on depots streamed to 20 for parent on metadata API. (MAYBE) 30 for game depots lookup; need to think through repercussions.
// Could sort the depots by date, so newest are always streamed
