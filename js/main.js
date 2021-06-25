import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'

window.map = L.map('map')
    .setView([36, 128], 8)

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var heatmap = new HeatMap()
var windmap = new WindMap()
var config = {}

var wind_data = []
var pm10_data = []
var pm25_data = []
var h_data = []
var t_data = []

function set_config() {
    var a = L.point(map.getSize().x + 70, -70)
    var initLat = map.containerPointToLatLng(a).lat;
    var initLng = map.containerPointToLatLng(a).lng;
    config.latGap = map.containerPointToLatLng(a).lat - map.getBounds()._northEast.lat;
    config.lngGap = map.containerPointToLatLng(a).lng - map.getBounds()._northEast.lng;
    config.maxlat = initLat;
    config.maxlng = initLng;
    config.gridX = Math.ceil(map.getSize().x / 70) + 2
    config.gridY = Math.ceil(map.getSize().y / 70) + 2
    config.minlng = initLng - config.lngGap * config.gridX
    config.minlat = initLat - config.latGap * config.gridY
}

window.onload = function () {
    set_config()
    var url = `http://localhost:4500/total?gridX=${config.gridX}&gridY=${config.gridY}&latGap=${config.latGap}&lngGap=${config.lngGap}&maxlat=${config.maxlat}&maxlng=${config.maxlng}&minlat=${config.minlat}&minlng=${config.minlng}`
    fetch(url)
        .then(e => e.json())
        .then(d => {
            var converting_data = convert_data_one_time(config, d)
            wind_data = converting_data[0]
            windmap.set_data(config, wind_data);
        })
    // heatmap.init();
}

map.on('move', () => {
    windmap.stopAnim();
})

map.on('moveend', () => {
    set_config()
    var url = `http://localhost:4500/total?gridX=${config.gridX}&gridY=${config.gridY}&latGap=${config.latGap}&lngGap=${config.lngGap}&maxlat=${config.maxlat}&maxlng=${config.maxlng}&minlat=${config.minlat}&minlng=${config.minlng}`
    console.log(url)
    fetch(url)
        .then(e => e.json())
        .then(d => {
            var converting_data = convert_data_one_time(config, d)
            wind_data = converting_data[0]
            windmap.set_data(config, wind_data);
            windmap.startAnim()
        })
})
map.on('zoomend', () => {
    set_config()
    var url = `http://localhost:4500/total?gridX=${config.gridX}&gridY=${config.gridY}&latGap=${config.latGap}&lngGap=${config.lngGap}&maxlat=${config.maxlat}&maxlng=${config.maxlng}&minlat=${config.minlat}&minlng=${config.minlng}`
    console.log(url)
    fetch(url)
        .then(e => e.json())
        .then(d => {
            var converting_data = convert_data_one_time(config, d)
            wind_data = converting_data[0]
            windmap.set_data(config, wind_data);
            windmap.startAnim()
        })
})

function convert_data_one_time(config, json_data){
    var return_data = []
    var return_wind_data = []
    var return_pm10_data = []
    var return_pm25_data = []
    var return_h_data = []
    var return_t_data = []

    //windData
    json_data.forEach(a => {
        var wind_tmp = []
        a.forEach(b => {
            wind_tmp.push([b.wx, b.wy])
        })
        return_wind_data.push(wind_tmp)
    })
    return_data.push(return_wind_data)

    //pm10Data
    json_data.forEach(a => {
        var pm10_tmp = []
        a.forEach(b => {
            pm10_tmp.push(b.pm10)
        })
        return_pm10_data.push(pm10_tmp)
    })
    return_data.push(return_pm10_data)

    //pm2.5Data
    json_data.forEach(a => {
        var pm25_tmp = []
        a.forEach(b => {
            pm25_tmp.push(b.pm25)
        })
        return_pm25_data.push(pm25_tmp)
    })
    return_data.push(return_pm25_data)

    //humidityData
    json_data.forEach(a => {
        var h_tmp = []
        a.forEach(b => {
            h_tmp.push(b.h)
        })
        return_h_data.push(h_tmp)
    })
    return_data.push(return_h_data)

    //temperatureData
    json_data.forEach(a => {
        var t_tmp = []
        a.forEach(b => {
            t_tmp.push(b.t)
        })
        return_t_data.push(t_tmp)
    })
    return_data.push(return_t_data)

    return return_data
}


document.getElementById('showHeatMap').addEventListener('click', heatmap.toggleHeatMap)
document.getElementById('playWind').addEventListener('click', windmap.toggleWindLayer)