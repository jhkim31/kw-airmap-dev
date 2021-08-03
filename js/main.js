import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'
import { config as config } from '../config.js'
import { data as data } from './20210723_0000.js'



window.map = L.map('map')
    .setView([37, 128], 8)
map.setMinZoom(5)


L.rectangle([[32, 120], [44, 132]], { color: "#ff7800", weight: 1, fillOpacity: 0 }).addTo(map);
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
for (var i = 0; i < 10; i++) {
    var d = data[parseInt(getRandomArbitrary(0, 66504))]
    console.log(d)
    L.marker(L.latLng(d.latlng.lat, d.latlng.lng))
        .addTo(map)
        .bindTooltip(`${d.h.toFixed(3)}`)
        .openTooltip()
}

var heatmap = new HeatMap(document.getElementById("heatmap"))
var windmap = new WindMap(document.getElementById('windmap'))
window.current_state = {}

window.wind_data = []
window.heat_data = []       //0 : pm10, 1 : pm25, 2 : t, 3 : h

var currentTimeIndex = 0
var current_state_div = document.getElementById('current_state')
var post_data = {}
var heatmap_layer = [document.getElementById('show_pm10'), document.getElementById('show_pm25'),
document.getElementById('show_t'), document.getElementById('show_h')]
var current_heatmap_index = 3


function set_state(delta = 0) {
    if (map.getZoom() >= 8) {
        current_state.latGap = 0.1
        current_state.lngGap = 0.1
    } else if (map.getZoom() >= 7) {
        current_state.latGap = 0.2
        current_state.lngGap = 0.2
    } else if (map.getZoom() >= 5) {
        current_state.latGap = 0.5
        current_state.lngGap = 0.5
    }
    // current_state.latGap = 0.1
    // current_state.lngGap = 0.1
    current_state.maxlat = parseFloat((map.getBounds()._northEast.lat - map.getBounds()._northEast.lat % current_state.latGap + current_state.latGap).toFixed(3))
    if (current_state.maxlat > 44) {
        current_state.maxlat = 44
    }
    if (current_state.maxlat < 32) {
        current_state.maxlat = 32
    }
    current_state.maxlng = parseFloat((map.getBounds()._northEast.lng - map.getBounds()._northEast.lng % current_state.lngGap + current_state.lngGap).toFixed(3))
    if (current_state.maxlng > 132) {
        current_state.maxlng = 132
    }
    if (current_state.maxlng < 120) {
        current_state.maxlng = 120
    }
    current_state.minlat = parseFloat((map.getBounds()._southWest.lat - map.getBounds()._southWest.lat % current_state.latGap - current_state.latGap).toFixed(3))
    if (current_state.minlat > 44) {
        current_state.minlat = 44
    }
    if (current_state.minlat < 32) {
        current_state.minlat = 32
    }
    current_state.minlng = parseFloat((map.getBounds()._southWest.lng - map.getBounds()._southWest.lng % current_state.lngGap - current_state.lngGap).toFixed(3))
    if (current_state.minlng > 132) {
        current_state.minlng = 132
    }
    if (current_state.minlng < 120) {
        current_state.minlng = 120
    }

    current_state.gridX = Math.round((current_state.maxlng - current_state.minlng) / current_state.lngGap)
    current_state.gridY = Math.round((current_state.maxlat - current_state.minlat) / current_state.latGap)

    var t = new Date(new Date().getTime() + delta)
    var year = t.getYear() + 1900
    var month = t.getMonth() + 1
    var date = t.getDate()
    var hour = t.getHours()
    var currentTime = `${year}/${month}/${date} ${hour}:00`
    post_data = {
        "requestTime": new Date(currentTime).getTime(),
        "boundary": {
            "northEast": {
                "lat": current_state.maxlat,
                "lng": current_state.maxlng
            },
            "southWest": {
                "lat": current_state.minlat,
                "lng": current_state.minlng
            }
        },
        "gridSize": {
            "x": current_state.gridX,
            "y": current_state.gridY
        }
    }
}



window.onload = function () {
    map_update()
}

map.on('moveend', () => {
    wind_data = []
    heat_data = []
    map_update(currentTimeIndex)
})

function map_update(index = 0) {
    set_state(currentTimeIndex * 3600000)
    var url = `http://${config.host}/test3`
    var startT = new Date().getTime()
    if (wind_data[index] == undefined && heat_data[index] == undefined) {
        wind_data[index] = []
        heat_data[index] = []
        fetch(url, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(post_data)
        })
            .then(e => e.json())
            .then(d => {
                current_state_div.innerText = `${map.getZoom()}level ${current_state.latGap} / ${new Date().getTime() - startT}ms\n`
                current_state_div.innerText += new Date(new Date().getTime() + currentTimeIndex * 3600000)
                var converting_data = convert_data_one_time(d)
                console.log(converting_data)
                converting_data.forEach(d => {
                    wind_data[index].push(d[0])
                    heat_data[index].push(d[1])        //pm10
                    heat_data[index].push(d[2])        //pm25
                    heat_data[index].push(d[3])        //t
                    heat_data[index].push(d[4])        //h

                })

                windmap.set_data(current_state, wind_data[index][0])
                heatmap.set_data(current_state, heat_data[index][current_heatmap_index])
                windmap.startAnim()
            })
    } else {
        windmap.set_data(current_state, wind_data[index][0])
        heatmap.set_data(current_state, heat_data[index][current_heatmap_index])
        windmap.startAnim()
    }
}

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
        one_timestamp.push(return_t_data)
        one_timestamp.push(return_h_data)

        return_data.push(one_timestamp)
    })

    return return_data
}

heatmap_layer[0].addEventListener('click', () => {
    if (current_heatmap_index != 0) {
        heatmap_layer[1].checked = false
        heatmap_layer[2].checked = false
        heatmap_layer[3].checked = false
        current_heatmap_index = 0
        heatmap.set_showheat(true)
        heatmap.set_data(current_state, heat_data[current_heatmap_index])
    } else {
        heatmap.toggleHeatMap()
    }
})

heatmap_layer[1].addEventListener('click', () => {
    if (current_heatmap_index != 1) {
        heatmap_layer[0].checked = false
        heatmap_layer[2].checked = false
        heatmap_layer[3].checked = false
        current_heatmap_index = 1
        heatmap.set_showheat(true)
        heatmap.set_data(current_state, heat_data[current_heatmap_index])
    } else {
        heatmap.toggleHeatMap()
    }
})

heatmap_layer[2].addEventListener('click', () => {
    if (current_heatmap_index != 2) {
        heatmap_layer[0].checked = false
        heatmap_layer[1].checked = false
        heatmap_layer[3].checked = false
        current_heatmap_index = 2
        heatmap.set_showheat(true)
        heatmap.set_data(current_state, heat_data[current_heatmap_index])
    } else {
        heatmap.toggleHeatMap()
    }
})

heatmap_layer[3].addEventListener('click', () => {
    if (current_heatmap_index != 3) {
        heatmap_layer[0].checked = false
        heatmap_layer[1].checked = false
        heatmap_layer[2].checked = false
        current_heatmap_index = 3
        heatmap.set_showheat(true)
        heatmap.set_data(current_state, heat_data[current_heatmap_index])
    } else {
        heatmap.toggleHeatMap()
    }
})

document.getElementById('play_wind').addEventListener('click', () => {
    windmap.toggleWindLayer()
})

document.getElementById('date_progress').addEventListener('click', (e) => {
    var x = document.getElementById('date_progress').offsetWidth
    var y = e.x - document.getElementById('date_progress').offsetLeft

    document.getElementById('date_progress_bar').style.width = (y / x) * 100 + '%'

    currentTimeIndex = Math.floor(parseFloat(document.getElementById('date_progress_bar').style.width) / 4.16667)
    map_update(currentTimeIndex)
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
                map_update(currentTimeIndex)
            }

            var tmp = Math.floor(parseFloat(document.getElementById('date_progress_bar').style.width) / 4.16667)
            if (currentTimeIndex != tmp) {
                currentTimeIndex = tmp
                map_update(currentTimeIndex)
            }

        }, 100)
    } else {
        document.getElementById('play').innerText = "play"
        clearInterval(Interval)
    }
})

map.on('click', (e) => {
    var dbox = document.getElementById('detail_box')
    if (dbox.style.visibility != 'visible') {
        console.log(e)
        document.getElementById('current_location').innerText = e.latlng
        dbox.style.visibility = 'visible'
        dbox.style.height = "180px"
    } else {
        document.getElementById('current_location').innerText = e.latlng
    }
})

document.getElementById('close_detail_box').addEventListener('click', () => {
    document.getElementById('detail_box').style.visibility = 'hidden'
    document.getElementById('detail_box').style.height = "0px"
})