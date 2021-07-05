import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'

window.map = L.map('map')
    .setView([36, 128], 8)

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var icon1 = L.icon({
    iconUrl: '../image/marker1.png',
    iconSize: [15, 15]
})

var icon2 = L.icon({
    iconUrl: '../image/marker2.png',
    iconSize: [15, 15]
})

var icon3 = L.icon({
    iconUrl: '../image/marker3.png',
    iconSize: [15, 15]
})

var icon4 = L.icon({
    iconUrl: '../image/marker4.png',
    iconSize: [15, 15]
})

var icon5 = L.divIcon({
    html: `<div> aa </div>`,
    iconSize: [20, 20]
})

var markerList = []
var level1MarkerList = []
var level2MarkerList = []
var level3MarkerList = []
var count = 0

console.log(count)
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
    var url = `http://localhost:4500/total?gridX=${config.gridX}&gridY=${config.gridY}&maxlat=${config.maxlat}&maxlng=${config.maxlng}&minlat=${config.minlat}&minlng=${config.minlng}`
    fetch(url)
        .then(e => e.json())
        .then(d => {
            console.log(d)
            // d.forEach(a => {
            //     a.forEach(b => {
            //         var ll = L.latLng(b.latlng)
            //         markerList.push(L.marker(ll, {
            //             icon: L.divIcon({
            //                 html: `<div> ${b.latlng.lat.toFixed(2)}, ${b.latlng.lng.toFixed(2)} <br>${b.wx.toFixed(1)} <br> ${b.wy.toFixed(1)}<br> ${b.pm10.toFixed(1)} </div>`,
            //                   iconSize: [30, 50]
            //             })
            //         }).addTo(map));
            //     })
            // })

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
    if (moveCount != 0) {
        windmap.stopAnim();
        heatmap.drawCanvas()
    }
    moveCount++;
})

map.on('moveend', () => {
    markerList.forEach(d => {
        map.removeLayer(d)
    })
    document.getElementById('lat').value = map.getCenter().lat
    document.getElementById('lng').value = map.getCenter().lng
    console.log('moveend')
    set_config()
    var url = `http://localhost:4500/total?gridX=${config.gridX}&gridY=${config.gridY}&maxlat=${config.maxlat}&maxlng=${config.maxlng}&minlat=${config.minlat}&minlng=${config.minlng}`
    fetch(url)
        .then(e => e.json())
        .then(d => {
            var countx = 0;
            var county = 0;
            // d.forEach(a => {
            //     a.forEach(b => {
            //         var ll = L.latLng(b.latlng)
            //         markerList.push(L.marker(ll, {
            //             icon: L.divIcon({
            //                 // html: `<div> ${b.latlng.lat.toFixed(2)}, ${b.latlng.lng.toFixed(2)} <br>${b.wx.toFixed(1)} <br> ${b.wy.toFixed(1)}<br> ${b.pm10.toFixed(1)} </div>`,
            //                 html: `<div>${b.latlng.lat.toFixed(2)}<br>${b.latlng.lng.toFixed(2)}</div>`,
            //                 iconSize: [5, 5]
            //             })
            //         }).addTo(map));
            //     })            
            // })
            // for(var i = 44; i >= 30; i -= 0.5){
            //     countx = 0
            //     for (var j = 118; j <= 134; j += 0.5){
            //         var ll = L.latLng(i,j)
            //         markerList.push(L.marker(ll, {
            //             icon: L.divIcon({
            //                 // html: `<div> ${b.latlng.lat.toFixed(2)}, ${b.latlng.lng.toFixed(2)} <br>${b.wx.toFixed(1)} <br> ${b.wy.toFixed(1)}<br> ${b.pm10.toFixed(1)} </div>`,
            //                 html: `<div style = "color:red">[${county},${countx}]</div>`,
            //                 iconSize: [5, 5]
            //             })
            //         }).addTo(map));     
            //         countx += 5
            //     }
            //     county += 5
            // }
            var converting_data = convert_data_one_time(d)
            wind_data = converting_data[0]
            pm10_data = converting_data[1]

            console.log(converting_data)

            windmap.set_data(config, wind_data);
            heatmap.set_data(config, pm10_data);
            windmap.startAnim()
        })
})

function convert_data_one_time(json_data) {
    var return_data = []
    var return_wind_data = []
    var return_pm10_data = []
    var return_pm25_data = []
    var return_h_data = []
    var return_t_data = []

    //windData
    json_data.forEach(a => {
        var wind_tmp = []
        var pm10_tmp = []
        var pm25_tmp = []
        var t_tmp = []
        var h_tmp = []
        a.forEach(b => {
            wind_tmp.push([b.wx, b.wy])
            pm10_tmp.push(b.pm10)
            pm25_tmp.push(b.pm25)
            h_tmp.push(b.h)
            t_tmp.push(b.t)
        })
        return_wind_data.push(wind_tmp)
        return_pm10_data.push(pm10_tmp)
        return_pm25_data.push(pm25_tmp)
        return_h_data.push(h_tmp)
        return_t_data.push(t_tmp)
    })
    return_data.push(return_wind_data)
    return_data.push(return_pm10_data)
    return_data.push(return_pm25_data)
    return_data.push(return_h_data)
    return_data.push(return_t_data)

    return return_data
}

document.getElementById('showHeatMap').addEventListener('click', heatmap.toggleHeatMap)
document.getElementById('playWind').addEventListener('click', windmap.toggleWindLayer)
document.getElementById('goToSeoul').addEventListener('click', () => { map.flyTo(L.latLng(37.552359, 126.987987)) })
document.getElementById('goToBusan').addEventListener('click', () => { map.flyTo(L.latLng(35.143470, 129.081928)) })
document.getElementById('go').addEventListener('click', () => { 
    map.flyTo(L.latLng(
        document.getElementById('lat').value, document.getElementById('lng').value
        )) 
    })
document.getElementById('date_progress').addEventListener('click', (e) => {
    var x = document.getElementById('date_progress').offsetWidth
    var y = e.x - document.getElementById('date_progress').offsetLeft
    console.log(document.getElementById('date_progress_bar').style.width = (y / x).toFixed(1) * 100 + "%")

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