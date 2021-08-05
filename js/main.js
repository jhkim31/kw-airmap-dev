import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'
import { config as config } from '../config.js'
import { data as data } from './20210723_0000.js'
import { heatData as point_data } from './data.js'



window.map = L.map('map')
    .setView([37, 128], 8)
map.setMinZoom(5)


L.rectangle([[32, 120], [44, 132]], { color: "#ff7800", weight: 1, fillOpacity: 0 }).addTo(map);
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=8f890138-c2ce-4e19-a081-ec6b9154f34').addTo(map);

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
// for (var i = 0; i < 10; i++) {
//     var d = data[parseInt(getRandomArbitrary(0, 66504))]
//     console.log(d)
//     L.marker(L.latLng(d.latlng.lat, d.latlng.lng))
//         .addTo(map)
//         .bindTooltip(`${d.h.toFixed(3)}`)
//         .openTooltip()
// }

var heatmap = new HeatMap(document.getElementById("heatmap"))
var windmap = new WindMap(document.getElementById('windmap'))
window.current_state = {}

window.wind_data = []
window.heat_data = []       //0 : pm10, 1 : pm25, 2 : t, 3 : h

var currentTimeIndex = 0

var post_data = {}
var heatmap_layer = [document.getElementById('show_pm10'), document.getElementById('show_pm25'),
document.getElementById('show_t'), document.getElementById('show_h')]
var current_heatmap_index = 2
var show_marker = false


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

map.on('moveend', (e) => {
    wind_data = []
    heat_data = []
    map_update(currentTimeIndex)
    change_marker()
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
                heatmap.set_data(current_state, heat_data[index][current_heatmap_index], current_heatmap_index)
                windmap.startAnim()
            })
    } else {
        windmap.set_data(current_state, wind_data[index][0])
        heatmap.set_data(current_state, heat_data[index][current_heatmap_index], current_heatmap_index)
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
        heatmap.set_data(current_state, heat_data[currentTimeIndex][current_heatmap_index], current_heatmap_index)
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
        heatmap.set_data(current_state, heat_data[currentTimeIndex][current_heatmap_index], current_heatmap_index)
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
        heatmap.set_data(current_state, heat_data[currentTimeIndex][current_heatmap_index], current_heatmap_index)
        document.getElementById("heat_bar").src = "./image/heat_bar_t2.png";
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
        heatmap.set_data(current_state, heat_data[currentTimeIndex][current_heatmap_index], current_heatmap_index)
        document.getElementById("heat_bar").src = "./image/heat_bar_t2.png";
    } else {
        heatmap.toggleHeatMap()
    }
})

document.getElementById('play_wind').addEventListener('click', () => {
    windmap.toggleWindLayer()
})

document.getElementById('IoT_network').addEventListener('click', () => {
    show_marker = document.getElementById('IoT_network').checked

    if (show_marker){
        overlay_marker()
    } else {
        remove_marker()
    }

})

document.getElementById('date_progress').addEventListener('click', (e) => {
    var x = document.getElementById('date_progress').offsetWidth
    var y = e.x - document.getElementById('date_progress').offsetLeft

    document.getElementById('date_progress_bar').style.width = (y / x) * 100 + '%'

    currentTimeIndex = Math.floor(parseFloat(document.getElementById('date_progress_bar').style.width) / 4.16667)
    map_update(currentTimeIndex)
})
var Interval;
var play_btn = document.getElementById('play')
play_btn.addEventListener('click', () => {
    var progress_bar = document.getElementById('date_progress_bar')
    if (play_btn.children[0].id == "play_btn") {
        play_btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-pause-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5z"/>
        </svg>
        `
        Interval = setInterval(() => {
            progress_bar.style.width = (parseFloat(progress_bar.style.width) + 0.3) + "%"
            if (parseFloat(progress_bar.style.width) > 100) {
                play_btn.innerText = "play"
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
        play_btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="25" height="25" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
        </svg>        
        `
        clearInterval(Interval)
    }
})

function show_detail_data(e) {
    var dbox = document.getElementById('detail_box')
    if (dbox.style.visibility != 'visible') {
        console.log(e)
        document.getElementById('current_location').innerText = e.latlng.lat.toFixed(3) + ',' + e.latlng.lng.toFixed(3)
        dbox.style.visibility = 'visible'
        dbox.style.height = "auto"
    } else {
        document.getElementById('current_location').innerText = e.latlng.lat.toFixed(3) + ',' + e.latlng.lng.toFixed(3)
    }
}
map.on('click', (e) => {
    show_detail_data(e)
})

document.getElementById('close_detail_box').addEventListener('click', () => {
    document.getElementById('detail_box').style.visibility = 'hidden'
    document.getElementById('detail_box').style.height = "0px"
})

document.getElementById('dust_button').addEventListener('click', () => {
    document.getElementById('weather_button').className = document.getElementById('dust_button').className.replace('primary', 'light')
    document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('light', 'primary')
})
document.getElementById('weather_button').addEventListener('click', () => {
    document.getElementById('weather_button').className = document.getElementById('dust_button').className.replace('light', 'primary')
    document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('primary', 'light')

})

var icon1 = L.icon({
    iconUrl: '../image/m1.png',
    iconSize: [8, 8]
})

var icon1_red = L.icon({
    iconUrl: '../image/m1_red.png',
    iconSize: [8, 8]
})

var icon1_blue = L.icon({
    iconUrl: '../image/m1_blue.png',
    iconSize: [8, 8]
})

var icon1_black = L.icon({
    iconUrl: '../image/m1_black.png',
    iconSize: [8, 8]
})

var icon2 = L.icon({
    iconUrl: '../image/m2.png',
    iconSize: [20, 20]
})

var icon3 = L.icon({
    iconUrl: '../image/m3.png',
    iconSize: [80, 40]
})

var icon4 = L.icon({
    iconUrl: '../image/m4.png',
    iconSize: [50, 50]
})
var count = 0
var layer = 1
var markerList = []
window.level1MarkerList = []
window.level2MarkerList = []
window.level3MarkerList = []
point_data.forEach(d => {
    if (count % 9 == 0) {
        if (layer >= 1) {
            level1MarkerList.push(
                L.marker([d.latitude, d.longitude], { icon: icon4, id: count })
                    .on('click', (e) => {
                        console.log(e.target.options.id)
                        show_detail_data(e)
                    })
            )
        }
        if (layer >= 2) {
            level2MarkerList.push(L.marker([d.latitude, d.longitude], { icon: icon4, id: count })                
                .on('click', (e) => {
                    console.log(e.target.options.id)
                    show_detail_data(e)
                })
            )
        }
        if (layer >= 3) {
            level3MarkerList.push(L.marker([d.latitude, d.longitude], { icon: icon4, id: count })
                .on('click', (e) => {
                    console.log(e.target.options.id)
                    show_detail_data(e)
                })
            )
            layer = 0
        }
        layer++
        count++
    } else {
        markerList.push(L.marker([d.latitude, d.longitude], {
            icon: icon1,
            id: count
        })
            .on('click', (e) => {
                console.log(e.target.options.id)
                show_detail_data(e)
            })
        )
        count++
    }
})

function change_marker(){
    if (show_marker) {
        if (map.getZoom() > 11) {
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
        } else if (map.getZoom() > 8) {
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
    }
}

function overlay_marker(){
    if (map.getZoom() > 11) {
        markerList.forEach(d => {
            d.setIcon(icon3).addTo(map)
        })
        level1MarkerList.forEach(d => {
            d.addTo(map)
        })
    } else if (map.getZoom() > 8) {
        markerList.forEach(d => {
            d.setIcon(icon2).addTo(map)
        })        
        level2MarkerList.forEach(d => {
            d.addTo(map)
        })
    } else {
        markerList.forEach(d => {
            d.setIcon(icon1).addTo(map)
        })
        level3MarkerList.forEach(d => {
            d.addTo(map)
        })
    }
}

function remove_marker(){
    markerList.forEach(d => {
        map.removeLayer(d)
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
}