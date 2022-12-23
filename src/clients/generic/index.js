'use strict'

module.exports = class genericLookupClient {
  static parseID(url) {
    // Legacy logs
    url = url.replace('https://', '')
    url = url.replace('http://', '')

    const depotID = url
    // TODO: hash url for unique ID

    return depotID
  }

  static normalize(chunkData) {}
  async getInfo() {
    throw new Error('Unknown Service; Not implemented yet')
  }
}
