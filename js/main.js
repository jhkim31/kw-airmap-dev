import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'

window.map = L.map('map')
    .setView([37, 128], 7)
map.setMinZoom(5)

window.myRenderer = L.canvas({ padding: 0.5 }).addTo(map);


L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var heatmap = new HeatMap(document.getElementById('heatmap'))
var windmap = new WindMap(document.getElementById('windmap'))
window.config = {}

window.wind_data = []
window.pm10_data = []
window.pm25_data = []
window.h_data = []
window.t_data = []

var currentTimeIndex = 0
var config_div = document.getElementById('config')
var post_data = {}

function set_config() {
    if (map.getZoom() >= 8) {
        config.latGap = 0.1
        config.lngGap = 0.1
    } else if (map.getZoom() >= 7) {
        config.latGap = 0.2
        config.lngGap = 0.2
    } else if (map.getZoom() >= 5) {
        config.latGap = 0.5
        config.lngGap = 0.5
    }
    // config.latGap = 0.1
    // config.lngGap = 0.1
    config.maxlat = parseFloat((map.getBounds()._northEast.lat - map.getBounds()._northEast.lat % config.latGap + config.latGap).toFixed(3))
    if (config.maxlat > 44){
        config.maxlat = 44
    }
    if (config.maxlat < 32){
        config.maxlat = 32
    }
    config.maxlng = parseFloat((map.getBounds()._northEast.lng - map.getBounds()._northEast.lng % config.lngGap + config.lngGap).toFixed(3))
    if (config.maxlng > 132) {
        config.maxlng = 132
    }
    if (config.maxlng < 122){
        config.maxlng = 122
    }
    config.minlat = parseFloat((map.getBounds()._southWest.lat - map.getBounds()._southWest.lat % config.latGap - config.latGap).toFixed(3))
    if (config.minlat > 44){
        config.minlat = 44
    }
    if (config.minlat < 32){
        config.minlat = 32
    }    
    config.minlng = parseFloat((map.getBounds()._southWest.lng - map.getBounds()._southWest.lng % config.lngGap - config.lngGap).toFixed(3))
    if (config.minlng > 132){
        config.minlng = 132
    }
    if (config.minlng < 122){
        config.minlng = 122
    }

    config.gridX = Math.round((config.maxlng - config.minlng) / config.lngGap)
    config.gridY = Math.round((config.maxlat - config.minlat) / config.latGap)

    var t = new Date()
    var year = t.getYear() + 1900
    var month = t.getMonth() + 1
    var date = t.getDate()
    var hour = t.getHours()
    var currentTime = `${year}/${month}/${date} ${hour}:00`
    post_data = {
        "requestTime": new Date(currentTime).getTime(),
        "boundary": {
            "northEast": {
                "lat": config.maxlat,
                "lng": config.maxlng
            },
            "southWest": {
                "lat": config.minlat,
                "lng": config.minlng
            }
        },
        "gridSize": {
            "x": config.gridX,
            "y": config.gridY
        }
    }
}



window.onload = function () {
    config_div.innerText = `${map.getZoom()}level `
    set_config()

    var url = `http://192.168.101.163:4500/test2`
    fetch(url, {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(post_data)
    })
        .then(e => e.json())
        .then(d => {
            console.log(d)
            wind_data = d[0]
            pm10_data = d[1]
            pm25_data = d[2]
            t_data = d[3]
            h_data = d[4]
            

            windmap.set_data(config, wind_data)
            heatmap.set_data(config, h_data)

            for (var i = 0; i < document.getElementById('date_bar').children.length; i++) {
                console.log(d[0].timestamp)
                document.getElementById('date_bar').children[i].innerText =
                    new Date(d[0].timestamp + 3600000 * i).getMonth() + 1 + '/' + new Date(d[0].timestamp + 3600000 * i).getDate() + '\n ' + new Date(d[0].timestamp + 3600000 * i).getHours() + ':00'
            }
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
    moveCount = 0
    set_config()
    var url = `http://192.168.101.163:4500/test2`
    var startT = new Date().getTime()
    fetch(url, {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(post_data)
    })
        .then(e => e.json())
        .then(d => {
            config_div.innerText = `${map.getZoom()}level ${config.latGap} / ${new Date().getTime() - startT}ms`
            console.log(d)
            wind_data = d[0]
            pm10_data = d[1]
            pm25_data = d[2]
            t_data = d[3]
            h_data = d[4]
            
            windmap.set_data(config, wind_data)
            heatmap.set_data(config, h_data)
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

document.getElementById('date_progress').addEventListener('click', (e) => {
    var x = document.getElementById('date_progress').offsetWidth
    var y = e.x - document.getElementById('date_progress').offsetLeft

    document.getElementById('date_progress_bar').style.width = (y / x) * 100 + '%'

    currentTimeIndex = Math.floor(parseFloat(document.getElementById('date_progress_bar').style.width) / 8.3333)
    windmap.set_data(config, wind_data[currentTimeIndex])
    heatmap.set_data(config, pm10_data[currentTimeIndex])
    heatmap.drawCanvas()
})
var Interval;
document.getElementById('play').addEventListener('click', () => {
    var progress_bar = document.getElementById('date_progress_bar')
    if (document.getElementById('play').innerText == "play") {
        document.getElementById('play').innerText = "stop"
        Interval = setInterval(() => {
            progress_bar.style.width = (parseFloat(progress_bar.style.width) + 0.5) + "%"
            
            if (parseFloat(progress_bar.style.width) > 100) {
                document.getElementById('play').innerText = "play"
                clearInterval(Interval)
                progress_bar.style.width = '1%'
                currentTimeIndex = 0
                windmap.set_data(config, wind_data[currentTimeIndex])
                heatmap.set_data(config, pm10_data[currentTimeIndex])
            }

            var tmp = Math.floor(parseFloat(document.getElementById('date_progress_bar').style.width) / 8.3333)            
            if(currentTimeIndex != tmp){
                currentTimeIndex = tmp
                windmap.set_data(config, wind_data[currentTimeIndex])
                heatmap.set_data(config, pm10_data[currentTimeIndex])
            }            
            
        }, 100)
    } else {
        document.getElementById('play').innerText = "play"
        clearInterval(Interval)
    }
})