import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'
import { config as config } from '../config.js'
import { heatData as point_data } from './data.js'



window.map = L.map('map')
    .setView([37, 128], 8)
map.setMinZoom(5)



L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var heatmap = new HeatMap(document.getElementById("heatmap"))
var windmap = new WindMap(document.getElementById('windmap'))


window.current_state = {
    "heatmap_index": 2,
    "time_index": 0,
    "show_marker": false,
    "show_detail_table": false,
    "map": {
        "latGap": 0,
        "lngGap": 0,
        "maxlat": 0,
        "minlat": 0,
        "maxlng": 0,
        "minlng": 0,
        "gridX": 0,
        "gridY": 0
    }
}

var wind_data = []
var heat_data = []       //0 : pm10, 1 : pm25, 2 : t, 3 : h
var Interval;
var play_btn = document.getElementById('play')
window.on_map_info = null;

var post_data = {}
var heatmap_layer = [document.getElementById('show_pm10'), document.getElementById('show_pm25'),
document.getElementById('show_t'), document.getElementById('show_h')]

var markerList = []
var level1MarkerList = []
var level2MarkerList = []
var level3MarkerList = []


function set_state(delta = 0) {
    if (map.getZoom() >= 8) {
        current_state.map.latGap = 0.1
        current_state.map.lngGap = 0.1
    } else if (map.getZoom() >= 7) {
        current_state.map.latGap = 0.2
        current_state.map.lngGap = 0.2
    } else if (map.getZoom() >= 5) {
        current_state.map.latGap = 0.5
        current_state.map.lngGap = 0.5
    }
    current_state.map.maxlat = parseFloat((map.getBounds()._northEast.lat - map.getBounds()._northEast.lat % current_state.map.latGap + current_state.map.latGap).toFixed(3))
    if (current_state.map.maxlat > 44) {
        current_state.map.maxlat = 44
    } if (current_state.map.maxlat < 32) {
        current_state.map.maxlat = 32
    }
    current_state.map.maxlng = parseFloat((map.getBounds()._northEast.lng - map.getBounds()._northEast.lng % current_state.map.lngGap + current_state.map.lngGap).toFixed(3))
    if (current_state.map.maxlng > 132) {
        current_state.map.maxlng = 132
    }
    if (current_state.map.maxlng < 120) {
        current_state.map.maxlng = 120
    }
    current_state.map.minlat = parseFloat((map.getBounds()._southWest.lat - map.getBounds()._southWest.lat % current_state.map.latGap - current_state.map.latGap).toFixed(3))
    if (current_state.map.minlat > 44) {
        current_state.map.minlat = 44
    }
    if (current_state.map.minlat < 32) {
        current_state.map.minlat = 32
    }
    current_state.map.minlng = parseFloat((map.getBounds()._southWest.lng - map.getBounds()._southWest.lng % current_state.map.lngGap - current_state.map.lngGap).toFixed(3))
    if (current_state.map.minlng > 132) {
        current_state.map.minlng = 132
    }
    if (current_state.map.minlng < 120) {
        current_state.map.minlng = 120
    }

    current_state.map.gridX = Math.round((current_state.map.maxlng - current_state.map.minlng) / current_state.map.lngGap)
    current_state.map.gridY = Math.round((current_state.map.maxlat - current_state.map.minlat) / current_state.map.latGap)

    // var t = new Date(new Date().getTime() + delta)
    var t = new Date(1628262000000 + delta)
    var year = t.getYear() + 1900
    var month = t.getMonth() + 1
    var date = t.getDate()
    var hour = t.getHours()
    var currentTime = `${year}/${month}/${date} ${hour}:00`
    post_data = {
        "requestTime": new Date(currentTime).getTime(),
        "boundary": {
            "northEast": {
                "lat": current_state.map.maxlat,
                "lng": current_state.map.maxlng
            },
            "southWest": {
                "lat": current_state.map.minlat,
                "lng": current_state.map.minlng
            }
        },
        "gridSize": {
            "x": current_state.map.gridX,
            "y": current_state.map.gridY
        }
    }
}

window.onload = function () {
    map_update()
}

map.on('moveend', (e) => {
    wind_data = []
    heat_data = []
    map_update(current_state.time_index)
    change_marker()
})

function map_update(index = 0) {
    windmap.stopAnim()
    set_state(current_state.time_index * 3600000)
    var url = `http://${config.host}/test3`
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
                wind_data[index].push(converting_data[0])
                heat_data[index].push(converting_data[1])        //pm10
                heat_data[index].push(converting_data[2])        //pm25
                heat_data[index].push(converting_data[3])        //t
                heat_data[index].push(converting_data[4])        //h

                windmap.set_data(current_state.map, wind_data[index][0])
                heatmap.set_data(current_state.map, heat_data[index][current_state.heatmap_index], current_state.heatmap_index)
                windmap.startAnim()
            })
    } else {
        windmap.set_data(current_state.map, wind_data[index][0])
        heatmap.set_data(current_state.map, heat_data[index][current_state.heatmap_index], current_state.heatmap_index)
        windmap.startAnim()
    }
}

function convert_data_one_time(json_data) {
    var one_timestamp = []
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

        one_timestamp.push(return_wind_data)
        one_timestamp.push(return_pm10_data)
        one_timestamp.push(return_pm25_data)
        one_timestamp.push(return_t_data)
        one_timestamp.push(return_h_data)
    })

    return one_timestamp
}

function button_change() {
    if (current_state.heatmap_index < 2) {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('primary', 'light')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('light', 'primary')
    } else {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('light', 'primary')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('primary', 'light')
    }

}

heatmap_layer[0].addEventListener('click', () => {
    if (current_state.heatmap_index != 0) {
        heatmap_layer[1].checked = false
        heatmap_layer[2].checked = false
        heatmap_layer[3].checked = false
        current_state.heatmap_index = 0        
        button_change()
        heatmap.set_showheat(true)
        heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(0)
        }
    } else {
        heatmap.toggleHeatMap()
    }
})

heatmap_layer[1].addEventListener('click', () => {

    if (current_state.heatmap_index != 1) {
        heatmap_layer[0].checked = false
        heatmap_layer[2].checked = false
        heatmap_layer[3].checked = false
        current_state.heatmap_index = 1        
        button_change()
        heatmap.set_showheat(true)
        heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(1)
        }
    } else {
        heatmap.toggleHeatMap()
    }
})

heatmap_layer[2].addEventListener('click', () => {
    if (current_state.heatmap_index != 2) {
        heatmap_layer[0].checked = false
        heatmap_layer[1].checked = false
        heatmap_layer[3].checked = false
        current_state.heatmap_index = 2        
        button_change()
        heatmap.set_showheat(true)
        heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "./image/heat_bar_t2.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(2)
        }
    } else {
        heatmap.toggleHeatMap()
    }
})

heatmap_layer[3].addEventListener('click', () => {
    if (current_state.heatmap_index != 3) {
        heatmap_layer[0].checked = false
        heatmap_layer[1].checked = false
        heatmap_layer[2].checked = false
        current_state.heatmap_index = 3        
        button_change()
        heatmap.set_showheat(true)
        heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "./image/heat_bar_h.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(3)
        }
    } else {
        heatmap.toggleHeatMap()
    }
})

document.getElementById('play_wind').addEventListener('click', () => {
    windmap.toggleWindLayer()
})

document.getElementById('IoT_network').addEventListener('click', () => {
    current_state.show_marker = document.getElementById('IoT_network').checked

    if (current_state.show_marker) {
        overlay_marker()
    } else {
        remove_marker()
    }

})

document.getElementById('date_progress').addEventListener('click', (e) => {
    var x = document.getElementById('date_progress').offsetWidth
    var y = e.x - document.getElementById('date_progress').offsetLeft

    document.getElementById('date_progress_bar').style.width = (y / x) * 100 + '%'

    current_state.time_index = Math.floor(parseFloat(document.getElementById('date_progress_bar').style.width) / 4.16667)
    map_update(current_state.time_index)
    if (on_map_info != undefined) {
        update_on_map_info()
    }
})

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
                play_btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="25" height="25" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                </svg>
                `
                clearInterval(Interval)
                progress_bar.style.width = '1%'
                current_state.time_index = 0
                map_update(current_state.time_index)
                if (on_map_info != undefined) {
                    update_on_map_info()
                }
            }

            var tmp = Math.floor(parseFloat(document.getElementById('date_progress_bar').style.width) / 4.16667)
            if (current_state.time_index != tmp) {
                current_state.time_index = tmp
                map_update(current_state.time_index)
            }
            if (on_map_info != undefined) {
                update_on_map_info()
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

function show_detail_data(e, type = 0) {        // type 위치검색 : 0, 지도선택 : 1, 마커선택 : 2
    var dbox = document.getElementById('detail_box')
    if (dbox.style.visibility != 'visible') {
        console.log(e)
        document.getElementById('current_location').innerText = e.latlng.lat.toFixed(3) + ',' + e.latlng.lng.toFixed(3)
        dbox.style.visibility = 'visible'
        fill_detail_table(type)
        dbox.style.height = 'auto';
    } else {
        document.getElementById('current_location').innerText = e.latlng.lat.toFixed(3) + ',' + e.latlng.lng.toFixed(3)
    }
}

function fill_detail_table(type = 0) {
    var detail_table = document.getElementById('detail_table')
    if (type < 2) {       // 미세먼지
        detail_table.innerHTML =
            `
        <tr>
                                <td>구분</td>
                                <td colspan="8">오늘 6/3</td>
                                <td colspan="8">내일 6/4</td>
                                <td colspan="2">6/5</td>
                                <td colspan="2">6/6</td>
                                <td colspan="2">6/7</td>
                                <td colspan="2">6/8</td>
                                <td colspan="2">6/9</td>                                
                            </tr>
                            <tr>
                                <td>미세먼지(PM10)</td>
                                <td colspan="8">한때 나쁨</td>
                                <td colspan="8">보통</td>
                                <td colspan="2">한때 나쁨</td>
                                <td colspan="2">보통</td>
                                <td colspan="2">한때 나쁨</td>
                                <td colspan="2">보통</td>
                                <td colspan="2">한때 나쁨</td>

                                
                            </tr>
                            <tr>
                                <td>미세먼지(PM25)</td>
                                <td colspan="8">한때 나쁨</td>
                                <td colspan="8">보통</td>
                                <td colspan="2">한때 나쁨</td>
                                <td colspan="2">보통</td>
                                <td colspan="2">한때 나쁨</td>
                                <td colspan="2">보통</td>
                                <td colspan="2">한때 나쁨</td>
                            </tr>
                            <tr>
                                <td>오전/오후</td>
                                <td colspan = "4">오전</td>
                                <td colspan = "4">오후</td>
                                <td colspan = "4">오전</td>
                                <td colspan = "4">오후</td>

                                <td rowspan="2" colspan = "1">오전</td>
                                <td rowspan="2" colspan = "1">오후</td>
                                <td rowspan="2" colspan = "1">오전</td>
                                <td rowspan="2" colspan = "1">오후</td>
                                <td rowspan="2" colspan = "1">오전</td>
                                <td rowspan="2" colspan = "1">오후</td>
                                <td rowspan="2" colspan = "1">오전</td>
                                <td rowspan="2" colspan = "1">오후</td>
                                <td rowspan="2" colspan = "1">오전</td>
                                <td rowspan="2" colspan = "1">오후</td>                             
                            </tr>
                            <tr>
                                <td>시각</td>
                                <td>00~03</td>
                                <td>03~06</td>
                                <td>06~09</td>
                                <td>09~12</td>
                                <td>12~15</td>
                                <td>15~18</td>
                                <td>18~21</td>
                                <td>21~24</td>
                                <td>00~03</td>
                                <td>03~06</td>
                                <td>06~09</td>
                                <td>09~12</td>
                                <td>12~15</td>
                                <td>15~18</td>
                                <td>18~21</td>
                                <td>21~24</td>
                            </tr>
                            <tr>
                                <td>미세먼지(PM10)</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                                <td>보통</td>
                            </tr>
                            <tr>
                                <td>미세먼지(PM25)</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                                <td>한때나쁨</td>
                            </tr>
        `   // dust forecast
    } else {                                    // 기상 상황
        detail_table.innerHTML =
            `
        <tr>
                        <td>날짜</td>
                        <td colspan="24 ">오늘 6/3</td>
                        <td colspan="24">내일 6/4</td>
                        <td colspan="24">모래6/5</td>
                        <td rowspan="2">날짜</td>
                        <td colspan="2">6/6</td>
                        <td colspan="2">6/7</td>
                        <td colspan="2">6/8</td>
                        <td colspan="2">6/9</td>
                    </tr>
                    <tr>
                        <td rowspan="2">예보</td>
                        <td colspan="6">새벽</td>
                        <td colspan="6">아침</td>
                        <td colspan="6">낯</td>
                        <td colspan="6">저녁</td>
                        <td colspan="6">새벽</td>
                        <td colspan="6">아침</td>
                        <td colspan="6">낯</td>
                        <td colspan="6">저녁</td>
                        <td colspan="6">새벽</td>
                        <td colspan="6">아침</td>
                        <td colspan="6">낯</td>
                        <td colspan="6">저녁</td>
                        <td>오전</td>
                        <td>오후</td>
                        <td>오전</td>
                        <td>오후</td>
                        <td>오전</td>
                        <td>오후</td>
                        <td>오전</td>
                        <td>오후</td>
                    </tr>
                    <tr>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td colspan="6"><img src='image/forecast.png' width="30px"></td>
                        <td>날씨</td>
                        <td><img src='image/forecast.png' width="30px"></td>
                        <td><img src='image/forecast.png' width="30px"></td>
                        <td><img src='image/forecast.png' width="30px"></td>
                        <td><img src='image/forecast.png' width="30px"></td>
                        <td><img src='image/forecast.png' width="30px"></td>
                        <td><img src='image/forecast.png' width="30px"></td>
                        <td><img src='image/forecast.png' width="30px"></td>
                        <td><img src='image/forecast.png' width="30px"></td>

                    </tr>
                    <tr>
                        <td>시간</td>
                        <td>0시</td>
                        <td>1시</td>
                        <td>2시</td>
                        <td>3시</td>
                        <td>4시</td>
                        <td>5시</td>
                        <td>6시</td>
                        <td>7시</td>
                        <td>8시</td>
                        <td>9시</td>
                        <td>10시</td>
                        <td>11시</td>
                        <td>12시</td>
                        <td>13시</td>
                        <td>14시</td>
                        <td>15시</td>
                        <td>16시</td>
                        <td>17시</td>
                        <td>18시</td>
                        <td>19시</td>
                        <td>20시</td>
                        <td>21시</td>
                        <td>22시</td>
                        <td>23시</td>
                        <td>0시</td>
                        <td>1시</td>
                        <td>2시</td>
                        <td>3시</td>
                        <td>4시</td>
                        <td>5시</td>
                        <td>6시</td>
                        <td>7시</td>
                        <td>8시</td>
                        <td>9시</td>
                        <td>10시</td>
                        <td>11시</td>
                        <td>12시</td>
                        <td>13시</td>
                        <td>14시</td>
                        <td>15시</td>
                        <td>16시</td>
                        <td>17시</td>
                        <td>18시</td>
                        <td>19시</td>
                        <td>20시</td>
                        <td>21시</td>
                        <td>22시</td>
                        <td>23시</td>
                        <td>0시</td>
                        <td>1시</td>
                        <td>2시</td>
                        <td>3시</td>
                        <td>4시</td>
                        <td>5시</td>
                        <td>6시</td>
                        <td>7시</td>
                        <td>8시</td>
                        <td>9시</td>
                        <td>10시</td>
                        <td>11시</td>
                        <td>12시</td>
                        <td>13시</td>
                        <td>14시</td>
                        <td>15시</td>
                        <td>16시</td>
                        <td>17시</td>
                        <td>18시</td>
                        <td>19시</td>
                        <td>20시</td>
                        <td>21시</td>
                        <td>22시</td>
                        <td>23시</td>
                        <td rowspan="4">최저 / 최고 (C)</td>
                        <td rowspan="4" colspan="2">16/26</td>
                        <td rowspan="4" colspan="2">16/26</td>
                        <td rowspan="4" colspan="2">16/26</td>
                        <td rowspan="4" colspan="2">16/26</td>
                    </tr>
                    <tr>
                        <td>날씨</td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                        <td><img src='image/forecast.png' width="15px"></td>
                    </tr>

                    <tr>
                        <td>강수확률 (%)</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                    </tr>

                    <tr>
                        <td>강수량 (mm)</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                    </tr>
                    <tr>
                        <td>기온 ( C )</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td rowspan="4">강수확률 (%)</td>
                        <td rowspan="4" >20</td>
                        <td rowspan="4" >10</td>
                        <td rowspan="4" >20</td>
                        <td rowspan="4" >10</td>
                        <td rowspan="4" >20</td>
                        <td rowspan="4" >10</td>
                        <td rowspan="4" >20</td>
                        <td rowspan="4" >10</td>
                    </tr>
                    <tr>
                        <td>풍향</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                    </tr>
                    <tr>
                        <td>풍속 (m/s)</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                    </tr>
                    <tr>
                        <td>습도 (%)</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
                        <td>30</td>
    </tr>
        `   // weather forecast
    }
}
map.on('click', (e) => {
    if (on_map_info != undefined) {
        map.removeLayer(on_map_info)
    }
    current_state.show_detail_table = true
    button_change()
    show_detail_data(e, current_state.heatmap_index)
    var value = ""
    if (current_state.heatmap_index < 2){        
        value = Math.round(heatmap.getValue(e.containerPoint.x, e.containerPoint.y)) + "µg/m³"
    } else if (current_state.heatmap_index == 2){
        value = heatmap.getValue(e.containerPoint.x, e.containerPoint.y).toFixed(1) + "℃"
    } else {
        value = heatmap.getValue(e.containerPoint.x, e.containerPoint.y).toFixed(1) + "%"
    }
    
    on_map_info = on_map_info = L.marker([e.latlng.lat, e.latlng.lng], {
        icon: L.divIcon({
            html: `
            <div style = "position:absolute;background:white; border-radius:5px; width:100px; height:30px; top:-72px; left:2px; font-size:17px;">
            <div style = "background:white; position:absolute; width:5px; height:55px; top:28px;">
            </div>
            ${value}
            </div>`,
            className:'display-none'
        })
    }).addTo(map)

})

function update_on_map_info(){
    if (on_map_info != undefined){
        var latlng = on_map_info._latlng
        map.removeLayer(on_map_info)
        var point = map.latLngToContainerPoint(latlng)

        var value = ""
        if (current_state.heatmap_index < 2){        
            value = Math.round(heatmap.getValue(point.x, point.y)) + "µg/m³"
        } else if (current_state.heatmap_index == 2){
            value = heatmap.getValue(point.x, point.y).toFixed(1) + "℃"
        } else {
            value = heatmap.getValue(point.x, point.y).toFixed(1) + "%"
        }
        on_map_info = on_map_info = L.marker(latlng, {
            icon: L.divIcon({
                html: `
                <div style = "position:absolute;background:white; border-radius:5px; width:100px; height:30px; top:-72px; left:2px; font-size:17px;">
                <div style = "background:white; position:absolute; width:5px; height:55px; top:28px;">
                </div>
                ${value}
                </div>`,
                className:'display-none'
            })
        }).addTo(map)
    }
}

document.getElementById('close_detail_box').addEventListener('click', () => {
    document.getElementById('detail_box').style.visibility = 'hidden'
    document.getElementById('detail_box').style.height = '0px';
    current_state.show_detail_table = false
})

document.getElementById('dust_button').addEventListener('click', () => {
    document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('primary', 'light')
    document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('light', 'primary')
})
document.getElementById('weather_button').addEventListener('click', () => {
    document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('light', 'primary')
    document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('primary', 'light')

})

var icon1 = L.icon({
    iconUrl: '../image/m1.png',
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

function change_marker() {
    if (current_state.show_marker) {
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

function overlay_marker() {
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

function remove_marker() {
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


document.getElementById('search_btn').addEventListener('click', (e) => {
    button_change()
    fill_detail_table(current_state.heatmap_index)
    var value = $('#search_field').val();
    // document.getElementById('detail_table').innerHTML = ""
    document.getElementById('detail_box').style.visibility = 'visible'
    document.getElementById('detail_box').style.height = 'auto';
    map.flyTo(L.latLng($('#cities [value="' + value + '"]').data('value').split(',')), 10)

    console.log(e)
})

$('#dust_button').on('click', (e) => {
    fill_detail_table(1)
})

$('#weather_button').on('click', () => {
    fill_detail_table(2)
})

$('#move_to_current_location').on('click', () => {
    if (navigator.geolocation) {
        //위치 정보를 얻기
        navigator.geolocation.getCurrentPosition(function (pos) {
            map.flyTo(L.latLng(pos.coords.latitude, pos.coords.longitude), 10);
        });
    } else {
        alert("이 브라우저에서는 Geolocation이 지원되지 않습니다.")
    }
})
