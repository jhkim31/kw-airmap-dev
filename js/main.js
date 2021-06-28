import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'

window.map = L.map('map')
    .setView([36, 128], 8)

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var icon1 = L.icon({
    iconUrl: '../image/marker1.png',
    iconSize:[30,30]
})

var icon2 = L.icon({
    iconUrl: '../image/marker2.png',
    iconSize:[30,30]
})

var icon3 = L.icon({
    iconUrl: '../image/marker3.png',
    iconSize:[30,30]
})

var icon4 = L.icon({
    iconUrl: '../image/marker4.png',
    iconSize:[30,30]
})

var markerList = [] 
var level1MarkerList = []
var level2MarkerList = []
var level3MarkerList = []
for(var i = 36.25; i < 38.25; i += 0.5){
    for (var j = 126.25; j <= 128.25; j += 0.5){
        markerList.push(L.marker([i,j], {icon : icon2}).addTo(map));
    }
}

for(var i = 34; i < 38; i += 0.5){
    for (var j = 126; j <= 130; j += 0.5){        
        if (j % 2 == 0 && i % 2 == 0){ 
            level3MarkerList.push(L.marker([i,j], {icon : icon4}).addTo(map));
        }
        if (j % 1 == 0 && i % 1 == 0){
            level2MarkerList.push(L.marker([i,j], {icon : icon4}).addTo(map));
        }       
        level1MarkerList.push(L.marker([i,j], {icon : icon4}));        
    }
}

map.on('zoomend', e => {    
    if (e.sourceTarget._zoom > 9){
        markerList.forEach(d => {
            d.setIcon(icon3)
        })
        level3MarkerList.forEach(d => {
            map.removeLayer(d)
        })
        level2MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level1MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level1MarkerList.forEach(d => {
            d.addTo(map)
        })
    } else if (e.sourceTarget._zoom > 7) { 
        markerList.forEach(d => {
            d.setIcon(icon2)
        })
        level3MarkerList.forEach(d => {
            map.removeLayer(d)
        })
        level2MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level1MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level2MarkerList.forEach(d => {
            d.addTo(map)
        })
    } else {
        markerList.forEach(d => {
            d.setIcon(icon1)
        })
        level3MarkerList.forEach(d => {
            map.removeLayer(d)
        })
        level2MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level1MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level3MarkerList.forEach(d => {
            d.addTo(map)
        })    
    }
})



var heatmap = new HeatMap()
var windmap = new WindMap()
var config = {}

var wind_data = []
var pm10_data = []
var pm25_data = []
var h_data = []
var t_data = []

function set_config() {
    var grid_size = 70
    var a = L.point(map.getSize().x + grid_size, -grid_size)
    var b = L.point(-grid_size, map.getSize().y + grid_size)
    config.maxlat = map.containerPointToLatLng(a).lat
    config.maxlng = map.containerPointToLatLng(a).lng
    config.minlat = map.containerPointToLatLng(b).lat
    config.minlng = map.containerPointToLatLng(b).lng
    config.gridX = Math.ceil(map.getSize().x / grid_size) + 2
    config.gridY = Math.ceil(map.getSize().y / grid_size) + 2
    config.latGap = (map.containerPointToLatLng(a).lat - map.containerPointToLatLng(b).lat) / config.gridY
    config.lngGap = (map.containerPointToLatLng(a).lng - map.containerPointToLatLng(b).lng) / config.gridX    
    
}

window.onload = function () {
    set_config()
    var startT = new Date().getTime()
    // var url = `http://localhost:4500/total?gridX=${config.gridX}&gridY=${config.gridY}&latGap=${config.latGap}&lngGap=${config.lngGap}&maxlat=${config.maxlat}&maxlng=${config.maxlng}&minlat=${config.minlat}&minlng=${config.minlng}`
    var url = `http://localhost:4500/total?gridX=${config.gridX}&gridY=${config.gridY}&maxlat=${config.maxlat}&maxlng=${config.maxlng}&minlat=${config.minlat}&minlng=${config.minlng}`
    fetch(url)
        .then(e => e.json())
        .then(d => {
            console.log(d)
            
            var converting_data = convert_data_one_time(d)            
            console.log('처리시간 : ' + (new Date().getTime() - startT) + 'ms')
            console.log(converting_data)
            wind_data = converting_data[0]
            pm10_data = converting_data[1]
            windmap.set_data(config, wind_data)
            heatmap.set_data(config, pm10_data)
        })
}
var moveCount = 0
map.on('move', () => {
    if (moveCount != 0){
        windmap.stopAnim();
        heatmap.drawCanvas()
    }
    moveCount++;    
})

map.on('moveend', () => {
    moveCount = 0
    console.log('moveend')
    set_config()
    var url = `http://localhost:4500/total?gridX=${config.gridX}&gridY=${config.gridY}&maxlat=${config.maxlat}&maxlng=${config.maxlng}&minlat=${config.minlat}&minlng=${config.minlng}`
    fetch(url)
        .then(e => e.json())
        .then(d => {
            var converting_data = convert_data_one_time(d)            
            wind_data = converting_data[0]
            pm10_data = converting_data[1]
            
            windmap.set_data(config, wind_data);
            heatmap.set_data(config, pm10_data);
            windmap.startAnim()
            
        })
})

function convert_data_one_time(json_data){
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