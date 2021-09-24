import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'
import { PointMap as PointMap } from './pointmap.js'
import { heatData as point_list } from './data.js'
import { dust_forecast as dust_forecast } from './table.js'
import { weather_forecast as weather_forecast } from './table.js'

window.map = L.map('map', {
    "maxBounds" : L.latLngBounds([[
        [32, 120],
        [44, 132]
    ]])
})
    .setView([37, 127], 10)
map.setMinZoom(5)



L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var heatmap = new HeatMap(document.getElementById("heatmap"))
var windmap = new WindMap(document.getElementById('windmap'))
var pointmap = new PointMap(document.getElementById('pointmap'))
window.current_state = {
    "heatmap_index": 2,
    "time_index": 24,
    "timestamp": 0,
    "show_detail_table": false,
    "knob_drag": false,
    "show_date_timeline": false,
    "is_playing": false,
    "pointmap_index": -1,
    "last_aws_marker": null,
    "map": {
        "current_time": 0,
        "current_time_str": "",
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
window.wind_data = []
window.heat_data = []       //0 : pm10, 1 : pm25, 2 : t, 3 : h
var Interval;
var on_map_info = null;

var post_data = {}
var heatmap_layer = [$('#show_pm10')[0], $('#show_pm25')[0], $('#show_t')[0], $('#show_h')[0]]
var point_layer = [$('#iot_national_network'), $('#iot_network'), $('#national_network'), $('#manned_network'), $('#aws_network')]

var iot_network_list = []
var national_network_list = []
var aws_network_list = []

var manned_level1_network_list = []
var manned_level2_network_list = []
var manned_level3_network_list = []


function get_point_map(){
    var url = 'https://kwapi.kweather.co.kr/v1/air/stations?type=all'

    fetch(url, {
        "headers": {
            "Content-Type": "application/json",
            "auth": "kweather-test"
        }
    })
    .then(e => e.json())
    .then(d => {

        d.data.forEach(i => {
            if (i.deviceType == "AK"){

                national_network_list.push(
                    { 
                        "_latlng" : [i.latlng.lat, i.latlng.lon],
                        "serial" : i.serial,
                        "deviceType" : i.deviceType
                    }
                )
            } else {
                iot_network_list.push(
                    { 
                        "_latlng" : [i.latlng.lat, i.latlng.lon],
                        "serial" : i.serial,
                        "deviceType" : i.deviceType
                    }
                )
            }            
        })
        pointmap.set_data(current_state, iot_network_list, national_network_list)
    })
}

//boundary값과 시간등 상태를 정하는 함수
function set_state(delta = 0) {
    var zoom = map.getZoom()
    if (zoom >= 8) {
        current_state.map.latGap = 0.1
        current_state.map.lngGap = 0.1
    } else if (zoom >= 7) {
        current_state.map.latGap = 0.2
        current_state.map.lngGap = 0.2
    } else if (zoom >= 5) {
        current_state.map.latGap = 0.5
        current_state.map.lngGap = 0.5
    }
    current_state.map.maxlat = parseFloat((map.getBounds()._northEast.lat - map.getBounds()._northEast.lat % current_state.map.latGap + current_state.map.latGap).toFixed(3))
    current_state.map.maxlat = (current_state.map.maxlat > 44) ? 44 : current_state.map.maxlat
    current_state.map.maxlat = (current_state.map.maxlat < 32) ? 32 : current_state.map.maxlat

    current_state.map.maxlng = parseFloat((map.getBounds()._northEast.lng - map.getBounds()._northEast.lng % current_state.map.lngGap + current_state.map.lngGap).toFixed(3))
    current_state.map.maxlng = (current_state.map.maxlng > 132) ? 132 : current_state.map.maxlng
    current_state.map.maxlng = (current_state.map.maxlng < 120) ? 120 : current_state.map.maxlng

    current_state.map.minlat = parseFloat((map.getBounds()._southWest.lat - map.getBounds()._southWest.lat % current_state.map.latGap - current_state.map.latGap).toFixed(3))
    current_state.map.minlat = (current_state.map.minlat > 44) ? 44 : current_state.map.minlat
    current_state.map.minlat = (current_state.map.minlat < 32) ? 32 : current_state.map.minlat

    current_state.map.minlng = parseFloat((map.getBounds()._southWest.lng - map.getBounds()._southWest.lng % current_state.map.lngGap - current_state.map.lngGap).toFixed(3))
    current_state.map.minlng = (current_state.map.minlng > 132) ? 132 : current_state.map.minlng
    current_state.map.minlng = (current_state.map.minlng < 120) ? 120 : current_state.map.minlng

    current_state.map.gridX = Math.round((current_state.map.maxlng - current_state.map.minlng) / current_state.map.lngGap)
    current_state.map.gridY = Math.round((current_state.map.maxlat - current_state.map.minlat) / current_state.map.latGap)

    var t = new Date(new Date().getTime() - 86400000 + delta)      
    // var t = new Date(1628262000000 + delta)               //현재는 시간을 임의로 고정시킴.
    current_state.map.current_time = t
    var year = t.getYear() + 1900
    var month = t.getMonth() + 1
    var date = t.getDate()
    var hour = t.getHours()
    var currentTime = `${year}/${month}/${date} ${hour}:00`

    current_state.map.current_time_str = currentTime
    current_state.timestamp = new Date(currentTime).getTime()

    var tmp = 24 - current_state.time_index 
    post_data = {
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
        },
        "period": `${tmp},${tmp}`
    }
}

//서버에서 넘어온 json데이터를 사용할 수 있게 배열로 만들어 리턴하는 함수
function convert_data_one_time(json_data) {
    var one_timestamp = []

    var return_wind_data = []
    var return_pm10_data = []
    var return_pm25_data = []
    var return_h_data = []
    var return_t_data = []
    json_data.data.reverse().forEach(a => {     //리턴되는 데이터가 구현 방법의 역순으로 오기 때문에 resverse해줌
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

    return one_timestamp
}

//히트맵, 플로우맵들을 현재 상태로 업데이트 하는 함수
function map_update() {
    windmap.stopAnim()
    set_state(current_state.time_index * 3600000)
    var url = 'https://kwapi.kweather.co.kr/v1/klps/model/data'
    if (wind_data[current_state.time_index] == undefined) {
        fetch(url, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "auth": "kweather-test"
            },
            "body": JSON.stringify(post_data)
        })
            .then(e => e.json())
            .then(d => {
                // if (d.timestamp != current_state.timestamp){
                //     return
                // }
                wind_data[current_state.time_index] = []
                heat_data[current_state.time_index] = []
                var converting_data = convert_data_one_time(d.data[0])
                wind_data[current_state.time_index].push(converting_data[0])
                heat_data[current_state.time_index].push(converting_data[1])        //pm10
                heat_data[current_state.time_index].push(converting_data[2])        //pm25
                heat_data[current_state.time_index].push(converting_data[3])        //t
                heat_data[current_state.time_index].push(converting_data[4])        //h

                windmap.set_data(current_state.map, wind_data[current_state.time_index][0])
                heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
                pointmap.set_data(current_state, iot_network_list, national_network_list)
                pointmap.update_point_map(current_state.pointmap_index)
                windmap.startAnim()
            })
    } else {
        windmap.set_data(current_state.map, wind_data[current_state.time_index][0])
        heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        pointmap.set_data(current_state, iot_network_list, national_network_list)
        pointmap.update_point_map(current_state.pointmap_index)
        windmap.startAnim()
    }
}

//하단에 있는 날씨, 미세먼지의 버튼을 현재 상황에 맞게 업데이트 해주는 함수
function update_detail_box_button() {
    if (current_state.heatmap_index < 2) {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('primary', 'light')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('light', 'primary')
    } else {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('light', 'primary')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('primary', 'light')
    }
}

//하단 상세 보기의 표를 채워주는 함수
function fill_detail_table(type = 0) {
    var detail_table = document.getElementById('detail_table')
    detail_table.style.height = "240px"
    if (type < 2) {       // 미세먼지일때
        detail_table.innerHTML = dust_forecast
    } else {              // 기상 상황일때
        detail_table.innerHTML = weather_forecast
    }
}

function get_lifestyle_data(lat, lng) {
    var url = 'https://kwapi.kweather.co.kr/v1/gis/geo/loctoaddr?lat=' + lat + '&lon=' + lng
    fetch(url, {
        "method": "GET",
        "headers": {
            "auth": "kweather-test"
        }
    })
        .then(e => e.json())
        .then(d => {
            if (d.data != null) {
                var hangCd = d.data.hang_cd
                var hang_nm = d.data.sido_nm + " " + d.data.sg_nm + "</br>" + d.data.emd_nm
                $('#current_location').html(hang_nm)
                var dt = new Date()
                var d_s = dt.getFullYear() + (dt.getMonth() + 1).toString().padStart(2, '0') + dt.getDate().toString().padStart(2, '0')
                var dt = new Date(dt.getTime() + 604800000)
                var d_e = dt.getFullYear() + (dt.getMonth() + 1).toString().padStart(2, '0') + dt.getDate().toString().padStart(2, '0')
                hangCd = 11110000
                fetch(`https://kwapi.kweather.co.kr/kweather/lifestyle/date?hangCd=${hangCd}&startDate=${d_s}&endDate=${d_e}`, {
                    headers: {
                        "auth": "kweather-test"
                    }
                })
                    // .then(j => j.json())
                    // .then(d => console.log(d))
            } else {
                $('#current_location').html("")
            }
        })
        
}

//하단 상세보기를 다루는 함수
function show_detail_data(e, type = 0) {        // type 위치검색 : 0, 지도선택 : 1, 마커선택 : 2
    var dbox = $('#detail_box')[0]
    if (dbox.style.visibility != 'visible') {
        get_lifestyle_data(e.latlng.lat, e.latlng.lng)
        dbox.style.visibility = 'visible'
        fill_detail_table(type)
        dbox.style.height = 'auto';
    } else {
        get_lifestyle_data(e.latlng.lat, e.latlng.lng)
    }
}

//지도에 표시된 핀을 업데이트 하기 위한 메소드
function update_on_map_info() {
    if (on_map_info != undefined) {
        var latlng = on_map_info._latlng
        map.removeLayer(on_map_info)
        var point = map.latLngToContainerPoint(latlng)
        var value = ""
        if (current_state.heatmap_index < 2) {
            value = Math.round(heatmap.getValue(point.x, point.y)) + "µg/m³"
        } else if (current_state.heatmap_index == 2) {
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
                <svg class = "float-end" id = "on_map_info_close" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg> 
                ${value}
                </div>`,
                className: 'display-none'
            })
        })
            .addTo(map)
            .on('click', (e) => {
                if (e.originalEvent.path[0].id == "on_map_info_close" || e.originalEvent.path[1].id == "on_map_info_close") {
                    map.removeLayer(on_map_info)
                    on_map_info = null
                }
            })
    }
}

//줌 레벨에 따라 달라지는 마커 이벤트

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// 동별 미세먼지 pm10 버튼 이벤트 처리
heatmap_layer[0].addEventListener('click', () => {
    if (current_state.heatmap_index != 0) {
        heatmap_layer.forEach(d => {
            d.checked = false
        })
        heatmap_layer[0].checked = true
        current_state.heatmap_index = 0
        update_detail_box_button()
        heatmap.set_showheat(true)
        heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "./image/heat_bar_pm10.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(0)
        }
    } else {
        heatmap.toggleHeatMap()
        current_state.heatmap_index = 2
    }
})

// 동별 미세먼지 pm25 버튼 이벤트 처리
heatmap_layer[1].addEventListener('click', () => {

    if (current_state.heatmap_index != 1) {
        heatmap_layer.forEach(d => {
            d.checked = false
        })
        heatmap_layer[1].checked = true
        current_state.heatmap_index = 1
        update_detail_box_button()
        heatmap.set_showheat(true)
        heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "./image/heat_bar_pm10.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(1)
        }
    } else {
        heatmap.toggleHeatMap()
        current_state.heatmap_index = 2
    }
})

// 온도 버튼 이벤트 처리
heatmap_layer[2].addEventListener('click', () => {
    if (current_state.heatmap_index != 2) {
        heatmap_layer.forEach(d => {
            d.checked = false
        })
        heatmap_layer[2].checked = true
        current_state.heatmap_index = 2
        update_detail_box_button()
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
        current_state.heatmap_index = 2
    }
})

// 습도 버튼 이벤트 처리
heatmap_layer[3].addEventListener('click', () => {
    if (current_state.heatmap_index != 3) {
        heatmap_layer.forEach(d => {
            d.checked = false
        })
        heatmap_layer[3].checked = true
        current_state.heatmap_index = 3
        update_detail_box_button()
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
        current_state.heatmap_index = 2
    }
})

//iot, 국가관측망 선택 버튼 이벤트 처리
point_layer[0].on('click', () => {    
    if (point_layer[0][0].checked){
        current_state.pointmap_index = 0
        pointmap.update_point_map(current_state.pointmap_index)
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[0][0].checked = true
    } else {        
        current_state.pointmap_index = -1
        pointmap.remove_overlay_image()
    }
    
})

//iot 관측망 선택 버튼 이벤트 처리
point_layer[1].on('click', () => {
    if (point_layer[1][0].checked){
        current_state.pointmap_index = 1
        pointmap.update_point_map(current_state.pointmap_index)
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[1][0].checked = true
    } else {
        current_state.pointmap_index = -1
        pointmap.remove_overlay_image()
    }
})

//국가관측망 선택 버튼 이벤트 처리
point_layer[2].on('click', () => {
    pointmap.remove_overlay_image()
    if (point_layer[2][0].checked){
        current_state.pointmap_index = 2
        pointmap.update_point_map(current_state.pointmap_index)
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[2][0].checked = true
    } else {
        current_state.pointmap_index = -1
        pointmap.remove_overlay_image()
    }
})

//유인관측망 선택 버튼 이벤트 처리
point_layer[3].on('click', () => {
    pointmap.remove_overlay_image()
    if (point_layer[3][0].checked){        
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[3][0].checked = true
    }
})

//aws망 선택 버튼 이벤트 처리
point_layer[4].on('click', () => {
    if (point_layer[4][0].checked){
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[4][0].checked = true
    } else {
        pointmap.remove_overlay_image()
    }
})

// 바람 선택 이벤트 처리
$('#play_wind').on('click', () => {
    windmap.toggleWindLayer()
})

//재생 버튼 이벤트 처리
$('#play').on('click', () => {
    var play_btn = $('#play')[0]
    var knob = $('#knob')
    var current_time = $('#current_time')
    if (play_btn.children[0].id == "play_btn") {
        play_btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" class="bi bi-pause-fill" viewBox="0 0 16 16">
            <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
        </svg>
        `
        Interval = setInterval(() => {
            if (parseInt(knob.css('left')) >= 480) {
                if (current_state.is_playing) {
                    var tmp = 24
                    if (current_state.time_index != tmp) {
                        current_state.time_index = tmp
                        map_update()
                        current_time.text(current_state.map.current_time_str)
                    }
                    clearInterval(Interval)
                    current_state.is_playing = false
                    current_time.css({
                        "transition": "none"
                    })
                    play_btn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="30" height="30" fill="white" class="bi bi-play-fill" viewBox="0 0 16 16">
                    <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                    </svg>   
                    `
                } else {
                    knob.css({
                        "left": "0px"
                    })
                    map_update(current_state.time_index)
                    if (on_map_info != undefined) {
                        update_on_map_info()
                    }
                }
            } else {
                current_state.is_playing = true
                knob.css({
                    "left": (parseFloat(knob.css('left')) + 1) + "px"
                })
                current_time.css({
                    "left": (parseFloat(knob.css('left')) - 60) + "px",
                    "visibility": "visible",
                    "transition": "left .1s ease"
                })
                var tmp = Math.round((parseFloat(knob.css('left')) / 480) / 0.0416667)
                if (current_state.time_index != tmp) {
                    current_state.time_index = tmp
                    map_update()
                    current_time.text(current_state.map.current_time_str)
                }
                if (on_map_info != undefined) {
                    update_on_map_info()
                }
            }
        }, 100)
    } else {
        play_btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="30" height="30" fill="white" class="bi bi-play-fill" viewBox="0 0 16 16">
        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
      </svg>      
        `
        current_time.css({
            "transition": "none"
        })
        clearInterval(Interval)
        current_state.is_playing = false
    }
})

//skip_start 버튼 이벤트 처리
$('#skip_start_btn').on('click', () => {
    if (current_state.is_playing) {
        return;
    }
    var knob = $('#knob')
    var current_time = $('#current_time')
    var tmp = Math.floor((parseFloat(knob.css('left')) / 480) / 0.0416667)
    if (tmp >= 0) {
        knob.css({
            'left': (20 * tmp) + 'px'
        })
        current_time.css({
            "left": ((20 * tmp) - 60) + "px",
            "visibility": "visible"
        })
        current_state.time_index = tmp
        set_state(tmp * 3600000)
        current_time.text(current_state.map.current_time_str)
        map_update(current_state.time_index)
        if (on_map_info != undefined) {
            update_on_map_info()
        }
    }
})

//skip_end 버튼 이벤트 처리
$('#skip_end_btn').on('click', () => {
    if (current_state.is_playing) {
        return;
    }
    var knob = $('#knob')
    var current_time = $('#current_time')
    var tmp = Math.round((parseFloat(knob.css('left')) / 480) / 0.0416667)
    if (tmp < 24) {
        tmp += 1
        knob.css({
            'left': (20 * tmp) + 'px'
        })
        current_time.css({
            "left": ((20 * tmp) - 60) + "px",
            "visibility": "visible"
        })
        current_state.time_index = tmp
        set_state(tmp * 3600000)
        current_time.text(current_state.map.current_time_str)
        map_update(current_state.time_index)
        if (on_map_info != undefined) {
            update_on_map_info()
        }
    }
})

//지도 클릭 이벤트
map.on('click', (e) => {
    if (on_map_info != undefined) {
        map.removeLayer(on_map_info)
    }
    current_state.show_detail_table = true
    update_detail_box_button()
    show_detail_data(e, current_state.heatmap_index)
    var value = ""
    if (current_state.heatmap_index < 2) {
        value = Math.round(heatmap.getValue(e.containerPoint.x, e.containerPoint.y)) + "µg/m³"
    } else if (current_state.heatmap_index == 2) {
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
            <svg class = "float-end" id = "on_map_info_close" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>      
            ${value}                                       
            </div>`,
            className: 'display-none'
        })
    })
        .addTo(map)
        .on('click', (e) => {
            if (e.originalEvent.path[0].id == "on_map_info_close" || e.originalEvent.path[1].id == "on_map_info_close") {
                map.removeLayer(on_map_info)
                on_map_info = null
            }
        })
    var tmp = pointmap.is_marker(e.containerPoint)
    console.log(tmp)
})

//하단 상세 보기 페이지를 닫는 함수
$('#close_detail_box').on('click', () => {
    detail_table.style.height = "0px"
    $('#detail_box').css({
        "visibility": "hidden",
        "height": "0px"
    })
    $('#detail_table').html('')
    current_state.show_detail_table = false
})

//하단 상세보기 미세먼지 버튼 이벤트
$('#dust_button').on('click', () => {
    $('#weather_button').addClass('btn-light')
    $('#weather_button').removeClass('btn-primary')
    $('#dust_button').addClass('btn-primary')
    $('#dust_button').removeClass('btn-light')
})

//하단 상세보기 날씨 버튼 이벤트
$('#weather_button').on('click', () => {
    $('#weather_button').removeClass('btn-light')
    $('#weather_button').addClass('btn-primary')
    $('#dust_button').removeClass('btn-primary')
    $('#dust_button').addClass('btn-light')
})

//좌상단 검색필드 검색버튼누를 때 이벤트
$('#search_btn').on('click', () => {
    update_detail_box_button()
    fill_detail_table(current_state.heatmap_index)
    var value = $('#search_field').val();
    $('#detail_box').css({
        "visibility": "visible",
        "height": "auto"
    })
    var hand_cd = $('#cities [value="' + value + '"]').data('value')
    fetch(`https://kwapi.kweather.co.kr/v1/gis/geo/hangaddr?hangCd=${hand_cd}`, {
        "method": "GET",
        "headers": {
            "auth": "kweather-test"
        }
    })
        .then(e => e.json())
        .then(d => {
            var hang_nm = d.data.sido_nm + " " + d.data.sg_nm + "</br>" + d.data.emd_nm
            $('#current_location').html(hang_nm)
            var lat = d.data.lat
            var lng = d.data.lon
            map.flyTo(L.latLng(lat, lng), 13)
        })
})

$('#search_field').on('propertychange change keyup paste input', (e) => {
    var value = e.currentTarget.value
    value = value.split(' ')[value.split(' ').length - 1]
    var url = 'https://kwapi.kweather.co.kr/v1/gis/geo/findaddr?name=' + value
    fetch(url, {
        "method": "GET",
        "headers": {
            "auth": "kweather-test"
        }
    })
        .then(e => e.json())
        .then(d => {
            if (d != null) {
                $('#cities').html('')
                d.data.slice(0, 20).forEach(i => {
                    var el = `<option data-value='${i.hang_cd}' value='${i.sido_nm} ${i.sg_nm} ${i.emd_nm}'></option>`
                    $('#cities').append(el)
                })


            }
        })
})

$('#dust_button').on('click', (e) => {
    fill_detail_table(1)
})

$('#weather_button').on('click', () => {
    fill_detail_table(2)
})
//현재 위치로 이동 이벤트
$('#move_to_current_location_btn').on('click', () => {
    if (navigator.geolocation) {
        //위치 정보를 얻기
        navigator.geolocation.getCurrentPosition(function (pos) {
            map.flyTo(L.latLng(pos.coords.latitude, pos.coords.longitude), 14);
        });
    } else {
        alert("이 브라우저에서는 현재위치찾기가 지원되지 않습니다.")
    }
})

//날짜 타임라인바 컨트롤 이벤트들
$('#knob').on('mousedown', (e) => {
    if (!current_state.is_playing) {
        current_state.knob_drag = true
    }
})

//날짜 타임라인바 컨트롤 이벤트들
window.addEventListener('mouseup', (e) => {
    if (current_state.knob_drag && !current_state.is_playing) {
        current_state.knob_drag = false
        $('#knob').css({
            "transition": "left .1s ease"
        })
        current_state.time_index = Math.floor((parseFloat(document.getElementById('knob').style.left) / 480) / 0.0416667)
        map_update(current_state.time_index)
        if (on_map_info != undefined) {
            update_on_map_info()
        }
    }
})

//날짜 타임라인바 컨트롤 이벤트들
window.addEventListener('mousemove', (e) => {
    var current_time = $('#current_time')
    if (current_state.knob_drag) {
        if (e.x < 612 && e.x > 130) {
            $('#knob').css({
                "transition": "none"
            })
            $('#knob')[0].style.left = (e.x - 130) + "px"
            current_time.css({
                "left": (parseFloat($('#knob').css('left')) - 60) + "px",
                "visibility": "visible"
            })
            var tmp = Math.floor((parseFloat($('#knob').css('left')) / 480) / 0.0416667)
            if (current_state.time_index != tmp) {
                current_state.time_index = tmp
                set_state(tmp * 3600000)
            }
            current_time.text(current_state.map.current_time_str)
        }
    }
})

window.onload = function () {
    map_update()
    get_point_map()
}

//맵 이동시마다 실행되는 이벤트
map.on('moveend', (e) => {
    wind_data = []
    heat_data = []
    map_update(current_state.time_index)
})