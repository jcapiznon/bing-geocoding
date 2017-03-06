'use strict'

const reekoh = require('reekoh')
const _plugin = new reekoh.plugins.Service()

const isNan = require('lodash.isnan')
const inRange = require('lodash.inrange')
const isNumber = require('lodash.isnumber')
const isString = require('lodash.isstring')
const isPlainObject = require('lodash.isplainobject')

let geobing = null
let geocodingType = null

_plugin.on('data', (data) => {
  if (isPlainObject(data)) {
    if (geocodingType === 'Forward') {
      if (!isString(data.address)) { return _plugin.logException(new Error(`Invalid address. Address ${data.address}`)) }

      geobing.getCoordinates(data.address, (err, coordinates) => {
        if (err) {
          return _plugin.logException(err)
        }

        let result = {
          lat: coordinates.lat,
          lng: coordinates.lng
        }

        _plugin.pipe(data, JSON.stringify({result: result}))
          .then(() => {
            _plugin.log(JSON.stringify({
              title: 'Bing Maps Geocoding Service Result',
              data: data,
              result: result
            }))
          })
          .catch((error) => {
            _plugin.logException(error)
          })
        console.log(result)
      })
    } else {
      if (isNan(data.lat) || !isNumber(data.lat) || !inRange(data.lat, -90, 90) ||
        isNan(data.lng) || !isNumber(data.lng) || !inRange(data.lng, -180, 180)) {
        return _plugin.logException(new Error('Latitude (lat) and Longitude (lng) are not valid. lat: ' + data.lat + ' lng:' + data.lng))
      }

      geobing.getInfoFromCoordinates({lat: data.lat, lng: data.lng}, (err, resp) => {
        if (err) {
          return _plugin.logException(err)
        }

        let result = {
          address: resp.name
        }

        _plugin.pipe(data, JSON.stringify({result: result}))
          .then(() => {
            _plugin.log(JSON.stringify({
              title: 'Bing Maps Geocoding Service Result',
              data: data,
              result: result
            }))
          })
          .catch((error) => {
            _plugin.logException(error)
          })
        console.log(result)
      })
    }
  } else {
    _plugin.logException(new Error(`Invalid data received. Data must be a valid JSON Object. Data: ${data}`))
  }
})
_plugin.once('ready', () => {
  geobing = require('geobing')
  geobing.setKey(_plugin.config.apiKey)

  geocodingType = _plugin.config.geocodingType || _plugin.config.geocodingType.default
  _plugin.log('Bing Maps Geocoding Service has been initialized.')
  _plugin.emit('init')
})

module.exports = _plugin
