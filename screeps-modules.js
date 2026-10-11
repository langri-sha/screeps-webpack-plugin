const debug = require('debug')('screeps-modules')
const http = require('http')
const https = require('https')
const zlib = require('zlib')

module.exports = class ScreepsModules {
  constructor (options) {
    this.options = Object.assign({}, {
      email: '',
      password: '',
      token: '',
      serverUrl: 'https://screeps.com',
      serverPassword: '',
      gzip: false
    }, options)
  }

  refreshToken () {
    const { email, password } = this.options

    return this.request('/api/auth/signin', {
      method: 'POST',
      json: { email, password }
    }).then(({ ok, token }) => {
      if (ok) {
        this.options.token = token
        return token
      }
    })
  }

  commit (branch, modules) {
    if (!modules) {
      modules = branch
      branch = undefined
    }

    const data = { branch, modules }

    if (!this.options.gzip) {
      return this.request('/api/user/code', {
        method: 'POST',
        json: data
      })
    }

    return this.request('/api/user/code', {
      method: 'POST',
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Type': 'application/json'
      },
      body: zlib.gzipSync(JSON.stringify(data)).toString('hex')
    })
  }

  retrieve (branch) {
    return this.request('/api/user/code', {
      method: 'GET',
      gzip: true,
      json: true,
      qs: { branch }
    })
  }

  fetch (...args) {
    return this.retrieve(...args)
  }

  up (...args) {
    return this.commit(...args)
  }

  down (...args) {
    return this.retrieve(...args)
  }

  push (...args) {
    return this.commit(...args)
  }

  pull (...args) {
    return this.retrieve(...args)
  }

  request (path, options = {}) {
    const requestOptions = Object.assign({}, options, {
      uri: path,
      baseUrl: this.options.serverUrl,
      headers: Object.assign({}, options.headers)
    })
    this.auth(path, requestOptions)

    const url = new URL(requestOptions.uri, requestOptions.baseUrl)
    const headers = requestOptions.headers

    if (requestOptions.qs) {
      for (const [key, value] of Object.entries(requestOptions.qs)) {
        if (value !== undefined) url.searchParams.set(key, value)
      }
    }

    if (requestOptions.gzip) headers['Accept-Encoding'] = headers['Accept-Encoding'] || 'gzip'

    if (requestOptions.auth && requestOptions.auth.username !== undefined) {
      const { username, password } = requestOptions.auth
      headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }

    let body = requestOptions.body

    if (requestOptions.json && requestOptions.json !== true && body === undefined) {
      body = JSON.stringify(requestOptions.json)
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    }

    if (requestOptions.json && body !== undefined && typeof body !== 'string' && !Buffer.isBuffer(body)) {
      body = JSON.stringify(body)
    }

    if (body !== undefined && !headers['Content-Length']) {
      headers['Content-Length'] = Buffer.byteLength(body)
    }

    const transportOptions = {
      method: options.method || 'GET',
      headers
    }

    debug(`Requesting: ${JSON.stringify({ ...transportOptions, url: url.toString() }, null, 2)}`)

    return new Promise((resolve, reject) => {
      const transport = url.protocol === 'https:' ? https : http
      const req = transport.request(url, transportOptions, (response) => {
        const chunks = []

        response.on('data', (chunk) => chunks.push(chunk))
        response.on('error', reject)
        response.on('end', () => {
          let responseBody = Buffer.concat(chunks)
          const finish = (err, data) => {
            if (err) return reject(err)

            if (requestOptions.json) {
              try {
                data = JSON.parse(data.toString())
              } catch (parseError) {
                return reject(parseError)
              }
            } else if (Buffer.isBuffer(data)) {
              data = data.toString()
            }

            debug(`Response: ${JSON.stringify(response.statusCode)}`)
            debug(`Body: ${JSON.stringify(data)}`)

            if (response.statusCode === 401) this.options.token = ''
            if (response.headers['x-token']) this.options.token = response.headers['x-token']
            if (data && Object.prototype.hasOwnProperty.call(data, 'error')) return reject(data.error)
            if (response.statusCode % 400 < 200) return reject(data)

            resolve(data)
          }

          if (requestOptions.gzip && response.headers['content-encoding'] === 'gzip') {
            zlib.gunzip(responseBody, finish)
          } else {
            finish(null, responseBody)
          }
        })
      })

      req.on('error', reject)
      if (body !== undefined) req.write(body)
      req.end()
    })
  }

  auth (path, options) {
    if (path === '/api/auth/signin') return

    const { email, password, token, serverPassword } = this.options

    if (token !== '') {
      options.headers = Object.assign({}, options.headers, {
        'X-Token': token,
        'X-Username': token
      })
    } else {
      options.auth = { username: email, password }
    }

    if (serverPassword !== '') {
      options.headers = Object.assign({}, options.headers, {
        'X-Server-Password': serverPassword
      })
    }
  }
}
