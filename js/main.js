import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'

window.map = L.map('map')
    .setView([37, 128], 9)

map.setMinZoom(6)

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);


var markerList = []
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
var currentTimeIndex = 0
var config_div = document.getElementById('config')

function set_config() {
    if (map.getZoom() >= 7){
        config.latGap = 0.1
        config.lngGap = 0.1
    } else if (map.getZoom() > 6){
        config.latGap = 0.2
        config.lngGap = 0.2
    } else {
        config.latGap = 0.5
        config.lngGap = 0.5
    }
    // config.latGap = 0.1
    // config.lngGap = 0.1
    config.maxlat = parseFloat((map.getBounds()._northEast.lat - map.getBounds()._northEast.lat % config.latGap + config.latGap).toFixed(3))
    config.maxlng = parseFloat((map.getBounds()._northEast.lng - map.getBounds()._northEast.lng % config.lngGap + config.lngGap).toFixed(3))
    config.minlat = parseFloat((map.getBounds()._southWest.lat - map.getBounds()._southWest.lat % config.latGap - config.latGap).toFixed(3))
    config.minlng = parseFloat((map.getBounds()._southWest.lng - map.getBounds()._southWest.lng % config.lngGap - config.lngGap).toFixed(3))

    config.gridX = Math.round((config.maxlng - config.minlng) / config.lngGap)
    config.gridY = Math.round((config.maxlat - config.minlat) / config.latGap)
}



window.onload = function () {
    config_div.innerText = `${map.getZoom()}level `
    var t = new Date()
    var year = t.getYear() + 1900
    var month = t.getMonth() + 1
    var date = t.getDate()
    var hour = t.getHours()
    var currentTime = `${year}/${month}/${date} ${hour}:00`   
    set_config()
    var post_data = {
        "requestTime" : new Date(currentTime).getTime(),
        "boundary" : {
            "northEast" : {
                "lat" : config.maxlat,
                "lng" : config.maxlng
            }, 
            "southWest" : {
                "lat" : config.minlat,
                "lng" : config.minlng
            }
        },
        "gridSize" : {
            "x" : config.gridX,
            "y" : config.gridY
        }
    }
    var url = `http://192.168.101.23:4500/total_post`
    fetch(url, {
        "method" : "POST",
        "headers" : {
            "Content-Type" : "application/json"
        }, 
        "body" : JSON.stringify(post_data)
    })
        .then(e => e.json())
        .then(d => {
            console.log(d)

            var converting_data = convert_data_one_time(d)
            console.log(converting_data)
            wind_data = []
            pm10_data = []
            pm25_data = []
            h_data = []
            t_data = []
            converting_data.forEach(d => {
                wind_data.push(d[0])
                pm10_data.push(d[1])
            })

            windmap.set_data(config, wind_data[currentTimeIndex])
            heatmap.set_data(config, pm10_data[currentTimeIndex])

            for( var i = 0; i < document.getElementById('date_bar').children.length; i++){
                console.log(d[i].timestamp)
                document.getElementById('date_bar').children[i].innerText = 
                new Date(d[i].timestamp).getMonth() + 1 + '/' + new Date(d[i].timestamp).getDate() + '\n ' + new Date(d[i].timestamp).getHours() + ':00'
            }

        })
}

var moveCount = 0
map.on('move', () => {
    // document.getElementById('lat').value = map.getCenter().lat
    // document.getElementById('lng').value = map.getCenter().lng
    if (moveCount != 0) {
        windmap.stopAnim();
        heatmap.drawCanvas()
    }
    moveCount++;
})

// var countx = 0;
// var county = 0;
// for(var i = 44; i >= 30; i -= 0.5){
//     var countx = 0
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
// console.log(markerList)

map.on('moveend', () => {
    var t = new Date()
    var year = t.getYear() + 1900
    var month = t.getMonth() + 1
    var date = t.getDate()
    var hour = t.getHours()
    var currentTime = `${year}/${month}/${date} ${hour}:00`
    set_config()
    var post_data = {
        "requestTime" : new Date(currentTime).getTime(),
        "boundary" : {
            "northEast" : {
                "lat" : config.maxlat,
                "lng" : config.maxlng
            }, 
            "southWest" : {
                "lat" : config.minlat,
                "lng" : config.minlng
            }
        },
        "gridSize" : {
            "x" : config.gridX,
            "y" : config.gridY
        }
    }
    var url = `http://192.168.101.23:4500/total_post`
    var startT = new Date().getTime()
    fetch(url, {
        "method" : "POST",
        "headers" : {
            "Content-Type" : "application/json"
        }, 
        "body" : JSON.stringify(post_data)
    })
        .then(e => e.json())
        .then(d => {    
            config_div.innerText = `${map.getZoom()}level ${new Date().getTime() - startT}ms`
            console.log(d)
            var converting_data = convert_data_one_time(d)
            console.log(converting_data)
            wind_data = []
            pm10_data = []
            pm25_data = []
            h_data = []
            t_data = []
            converting_data.forEach(d => {
                wind_data.push(d[0])
                pm10_data.push(d[1])
            })
            windmap.set_data(config, wind_data[currentTimeIndex])
            heatmap.set_data(config, pm10_data[currentTimeIndex])
            windmap.startAnim()            
        })
})

function convert_data_one_time(json_data) {

    var return_data = []

    json_data.forEach(d => {

        var return_wind_data = []
        var return_pm10_data = []
        var return_pm25_data = []
        var return_h_data = []
        var return_t_data = []
        d.data.forEach(a => {
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
        var one_timestamp = []
        one_timestamp.push(return_wind_data)
        one_timestamp.push(return_pm10_data)
        one_timestamp.push(return_pm25_data)
        one_timestamp.push(return_h_data)
        one_timestamp.push(return_t_data)

        return_data.push(one_timestamp)
    })

    return return_data
}

document.getElementById('showHeatMap').addEventListener('click', heatmap.toggleHeatMap)
document.getElementById('playWind').addEventListener('click', windmap.toggleWindLayer)
// document.getElementById('goToSeoul').addEventListener('click', () => { map.flyTo(L.latLng(37.552359, 126.987987)) })
// document.getElementById('goToBusan').addEventListener('click', () => { map.flyTo(L.latLng(35.143470, 129.081928)) })
// document.getElementById('go').addEventListener('click', () => {
//     map.flyTo(L.latLng(
//         document.getElementById('lat').value, document.getElementById('lng').value
//     ))
// })
document.getElementById('date_progress').addEventListener('click', (e) => {
    var x = document.getElementById('date_progress').offsetWidth
    var y = e.x - document.getElementById('date_progress').offsetLeft
    // var z = 100 / 12 / 100;
    // console.log(document.getElementById('date_progress_bar').style.width = Math.floor((y / x) / z) * z * 100 + "%")
    document.getElementById('date_progress_bar').style.width = (y / x) * 100 + '%'

    if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333) {
        currentTimeIndex = 0
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 2){
        currentTimeIndex = 1
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 3){
        currentTimeIndex = 2
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 4){
        currentTimeIndex = 3
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 5){
        currentTimeIndex = 4
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 6){
        currentTimeIndex = 5
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 7){
        currentTimeIndex = 6
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 8){
        currentTimeIndex = 7
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 9){
        currentTimeIndex = 8
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 10){
        currentTimeIndex = 9
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 11){
        currentTimeIndex = 10
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    } else if (parseFloat(document.getElementById('date_progress_bar').style.width) < 8.333 * 12){
        currentTimeIndex = 11
        windmap.set_data(config, wind_data[currentTimeIndex])
        heatmap.set_data(config, pm10_data[currentTimeIndex])
        heatmap.drawCanvas()
    }

})
var Interval;
document.getElementById('play').addEventListener('click', () => {
    var progress_bar = document.getElementById('date_progress_bar')
    if (document.getElementById('play').innerText == "play") {
        document.getElementById('play').innerText = "stop"
        Interval = setInterval(() => {
            progress_bar.style.width = (parseFloat(progress_bar.style.width) + 0.5) + "%"
            if (parseFloat(progress_bar.style.width) < 8.333) {
                if (currentTimeIndex != 0){
                    currentTimeIndex = 0
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }                
                return;
            } else if (parseFloat(progress_bar.style.width) <= 8.333 * 2) {
                if (currentTimeIndex != 1){
                    currentTimeIndex = 1
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            } else if (parseFloat(progress_bar.style.width) <= 8.333 * 3) {
                if (currentTimeIndex != 2){
                    currentTimeIndex = 2
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            } else if (parseFloat(progress_bar.style.width) <= 8.333 * 4) {
                if (currentTimeIndex != 3){
                    currentTimeIndex = 3
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            } else if (parseFloat(progress_bar.style.width) <= 8.333 * 5) {
                if (currentTimeIndex != 4){
                    currentTimeIndex = 4
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            } else if (parseFloat(progress_bar.style.width) <= 8.333 * 6) {
                if (currentTimeIndex != 5){
                    currentTimeIndex = 5
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            } else if (parseFloat(progress_bar.style.width) <= 8.333 * 7) {
                if (currentTimeIndex != 6){
                    currentTimeIndex = 6
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            }  else if (parseFloat(progress_bar.style.width) <= 8.333 * 8) {
                if (currentTimeIndex != 7){
                    currentTimeIndex = 7
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            }  else if (parseFloat(progress_bar.style.width) <= 8.333 * 9) {
                if (currentTimeIndex != 8){
                    currentTimeIndex = 8
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            }  else if (parseFloat(progress_bar.style.width) <= 8.333 * 10) {
                if (currentTimeIndex != 9){
                    currentTimeIndex = 9
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            }  else if (parseFloat(progress_bar.style.width) <= 8.333 * 11) {
                if (currentTimeIndex != 10){
                    currentTimeIndex = 10
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            }  else if (parseFloat(progress_bar.style.width) <= 8.333 * 12) {
                if (currentTimeIndex != 11){
                    currentTimeIndex = 11
                    windmap.set_data(config, wind_data[currentTimeIndex])
                    heatmap.set_data(config, pm10_data[currentTimeIndex])
                }
                return;
            }  
            if (parseFloat(progress_bar.style.width) > 100){
                document.getElementById('play').innerText = "play"
                clearInterval(Interval)        
                progress_bar.style.width = '1%'
                currentTimeIndex = 0
                windmap.set_data(config, wind_data[currentTimeIndex])
                heatmap.set_data(config, pm10_data[currentTimeIndex])
            }
        }, 100)
    } else {
        document.getElementById('play').innerText = "play"
        clearInterval(Interval)
    }
})