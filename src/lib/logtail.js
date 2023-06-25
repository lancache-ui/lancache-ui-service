'use strict'

const showDebug = process.env.DEBUG || true // Show debug info

const EventEmitter = require('events')
const { spawn } = require('child_process')
//const { spawn } = require('bun-utilities/spawn')

// https://nodejs.org/api/readline.html#readline
const readline = require('node:readline/promises')

class logtail extends EventEmitter {
  constructor(logFile, prefill) {
    super()

    this.logFile = logFile
    this.prefill = prefill
    this.spawn = {}

    process.on('uncaughtException', this.handleError.bind(this))
    process.on('unhandledRejection', this.handleError.bind(this))
  }

  handleError(err) {
    console.error('Unhandled Error:', err)
    this.emit('error', err)
  }

  async start() {
    console.log('Creating logtail instance:', this.logFile)

    // TODO: path, check if this.logFile exists, if not fail with error.
    // Log file does not exist. Can not read log file

    // TODO: check existence of `this.prefill` to determine cmd and cmdOpts, cat or tail
    // FIXME: Instead of this, what about an "Import" feature on UI in settings. The txt file will be uploaded then processed.
    // Replicate code as logimport.js
    // Or rename `prefill` to be `import`, because most of the code should stay the same...
    // TODO: Think about how prefill performance would be with the event emitter attached to every line... it's needed tho for `stats` but not
    // necessarily for pubSub.. actually wrapping another logtail instance for the UI feature could be done.. then handle the stats page, etc from there.

    let cmd, cmdOpts
    if (this.prefill) {
      cmd = 'cat'
      cmdOpts = [this.logFile]
    } else {
      cmd = 'tail'
      cmdOpts = ['-f', this.logFile, '-n', 0]
    }

    const child = spawn(cmd, cmdOpts)
    this.child = child

    // Pipe child's stdout and stderr to console
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    let rl
    child.on('close', code => {
      if (code === 0) {
        if (rl && typeof rl.close === 'function')
          rl.close()

        this.emit('close')
      } else {
        this.emit('error', 'Process unexpectedly quit, code: ' + code)
        console.error('Child process closed, code:', code)
      }
    })

    rl = readline.createInterface({
      input: child.stdout,
      output: null,
    })

    for await (const line of rl) {
      processLine.call(this, line)
    }
  }
}

function processLine(line) {
  if (typeof line !== 'string')
    return

  const regexMatch = /^\[(?<service>[A-Za-z0-9_.]+)\]\s(?<client>[0-9.]+).+?(?=\[)\[(?<timestamp>.+?(?=\]))\]\s"(?<method>[A-Z]+)\s(?<url>\S+).+?(?=")"\s(?<statusCode>[0-9]+)\s(?<size>[0-9]+)\s"-"\s"(.*?)"\s"(?<cache>[A-Z]+)?/
  const matches = line.match(regexMatch)

  if (matches && matches.groups) {
    this.emit('item', matches.groups)
  } else {
    showDebug && console.log(`WARN: Unhandled log Event: ${line}`)
  }
}

module.exports = logtail
