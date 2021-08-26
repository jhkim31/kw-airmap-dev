import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'
import { config as config } from '../config.js'
import { heatData as point_list } from './data.js'
import { dust_forecast as dust_forecast } from './table.js'
import { weather_forecast as weather_forecast } from './table.js'

window.map = L.map('map', {
    // zoomControl : false,
    // maxBounds : [[30, 120], [42, 132]]
})
    .setView([37, 128], 8)
map.setMinZoom(5)

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png').addTo(map);

var heatmap = new HeatMap(document.getElementById("heatmap"))
var windmap = new WindMap(document.getElementById('windmap'))
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
    "resizing": false,
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
var marker_detail_popup = null
var count = 0
var layer = 1
var iot_bit = 0

var post_data = {}
var heatmap_layer = [$('#show_pm10')[0], $('#show_pm25')[0], $('#show_t')[0], $('#show_h')[0]]
var point_layer = [$('#iot_national_network'), $('#iot_network'), $('#national_network'), $('#manned_network'), $('#aws_network')]

var iot_network_list = []
var national_network_list = []
var aws_network_list = []

var manned_level1_network_list = []
var manned_level2_network_list = []
var manned_level3_network_list = []



//마커 아이콘
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

var icon5 = L.divIcon({
    html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-circle-fill" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="8"/>
    </svg>
    `,
    className: 'display-none'
})

var icon6 = L.divIcon({
    html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-circle-fill" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="8"/>
    </svg>
    `,
    className: 'display-none'
})


//마커 초기 세팅 (이벤트등)
point_list.forEach(d => {
    if (count % 5 == 0) {
        if (layer >= 1) {
            manned_level1_network_list.push(
                L.marker([d.latitude, d.longitude], { icon: icon4, id: count })
                    .on('click', (e) => {
                        (e)
                        show_detail_data(e)
                    })
            )
        }
        if (layer >= 2) {
            manned_level2_network_list.push(L.marker([d.latitude, d.longitude], { icon: icon4, id: count })
                .on('click', (e) => {
                    (e)
                    show_detail_data(e)
                })
            )
        }
        if (layer >= 3) {
            manned_level3_network_list.push(L.marker([d.latitude, d.longitude], { icon: icon4, id: count })
                .on('click', (e) => {
                    (e)
                    show_detail_data(e)
                })
            )
            layer = 0
        }
        layer++
        count++
    } else if (count % 7 == 0) {
        aws_network_list.push(L.marker([d.latitude, d.longitude], { icon: icon5, id: count })
            .on('click', (e) => {
                e.sourceTarget.setIcon(icon6)
                if (current_state.last_aws_marker != undefined) {
                    current_state.last_aws_marker.setIcon(icon5)
                }
                current_state.last_aws_marker = e.sourceTarget
                show_detail_data(e)
                show_marker_detail_popup(e, 1)
            })
        )
        count++;
    } else {
        if (iot_bit == 0) {
            iot_bit = 1
            iot_network_list.push(L.marker([d.latitude, d.longitude], {
                icon: icon1,
                id: count
            })
                .on('click', (e) => {
                    show_detail_data(e)
                    show_marker_detail_popup(e)
                })
            )
            count++
        } else {
            iot_bit = 0
            national_network_list.push(L.marker([d.latitude, d.longitude], {
                icon: icon1,
                id: count
            })
                .on('click', (e) => {
                    (e)
                    if (map.getZoom() <= 11) {
                        show_detail_data(e)
                        show_marker_detail_popup(e)
                    }
                })
            )
        }
    }
})

//맵이 이동할때마다 매번 새롭게 boundary값을 정하는 함수
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

    var t = new Date(new Date().getTime() - 86400000 + delta)       //현재는 시간을 임의로 고정시킴.
    // var t = new Date(1628262000000 + delta)
    current_state.map.current_time = t
    var year = t.getYear() + 1900
    var month = t.getMonth() + 1
    var date = t.getDate()
    var hour = t.getHours()
    var currentTime = `${year}/${month}/${date} ${hour}:00`
    current_state.map.current_time_str = currentTime
    current_state.timestamp = new Date(currentTime).getTime()
    post_data = {
        "requestTime": current_state.timestamp,
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

//서버에서 넘어온 json데이터를 사용할 수 있게 배열로 만들어 리턴하는 함수
function convert_data_one_time(json_data) {
    var one_timestamp = []   
    var return_wind_data = []
    var return_pm10_data = []
    var return_pm25_data = []
    var return_h_data = []
    var return_t_data = []
    json_data.data.forEach(a => {
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

//히트맵, 플로우맵들을 현재 상태로 데이터를 받아와 업데이트 하는 함수
function map_update() {
    windmap.stopAnim()
    set_state(current_state.time_index * 3600000)
    var url = `http://${config.host}/test3`
    if (wind_data[current_state.time_index] == undefined) {                
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
                wind_data[current_state.time_index] = []
                heat_data[current_state.time_index] = []
                var converting_data = convert_data_one_time(d[0])                
                wind_data[current_state.time_index].push(converting_data[0])
                heat_data[current_state.time_index].push(converting_data[1])        //pm10
                heat_data[current_state.time_index].push(converting_data[2])        //pm25
                heat_data[current_state.time_index].push(converting_data[3])        //t
                heat_data[current_state.time_index].push(converting_data[4])        //h

                windmap.set_data(current_state.map, wind_data[current_state.time_index][0])
                heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
                windmap.startAnim()
            })
    } else {
        windmap.set_data(current_state.map, wind_data[current_state.time_index][0])
        heatmap.set_data(current_state.map, heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
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

//모든 마커 삭제
function remove_all_marker() {
    iot_network_list.forEach(d => {
        map.removeLayer(d)
    })
    national_network_list.forEach(d => {
        map.removeLayer(d)
    })
    manned_level3_network_list.forEach(d => {
        map.removeLayer(d)
    })
    manned_level2_network_list.forEach(d => {
        map.removeLayer(d)
    })
    manned_level1_network_list.forEach(d => {
        map.removeLayer(d)
    })
    aws_network_list.forEach(d => {
        map.removeLayer(d)
    })

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

//하단 상세보기를 다루는 함수
function show_detail_data(e, type = 0) {        // type 위치검색 : 0, 지도선택 : 1, 마커선택 : 2
    var dbox = $('#detail_box')[0]
    if (dbox.style.visibility != 'visible') {
        $('#current_location').text(e.latlng.lat.toFixed(3) + ',' + e.latlng.lng.toFixed(3))
        dbox.style.visibility = 'visible'
        fill_detail_table(type)
        dbox.style.height = 'auto';
    } else {
        document.getElementById('current_location').innerText = e.latlng.lat.toFixed(3) + ',' + e.latlng.lng.toFixed(3)
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

function show_marker_detail_popup(e, kind = 0) { // kind  0 : 실외공기관측망, 1: aws
    if (marker_detail_popup != undefined) {
        map.removeLayer(marker_detail_popup)
    }
    var p = e.containerPoint
    var left_delta = 0;
    if (p.x < window.innerWidth / 2) {
        left_delta = 50
    } else {
        left_delta = -200
    }
    marker_detail_popup = L.marker(e.latlng, {
        icon: L.divIcon({
            html: `
            <div style = "position:absolute;background:white; border-radius:5px; width:120px; height:70px; top:-72px; left:${left_delta}px; font-size:17px;">
            <svg class = "float-end" id = "marker_detail_close" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
            ${"마커 선택시 뜨는 팝업입니다."}            
            </div>`,
            className: 'display-none'
        })
    })
        .addTo(map)
        .on('click', (click_e) => {
            if (click_e.originalEvent.path[0].id == "marker_detail_close" || click_e.originalEvent.path[1].id == "marker_detail_close") {
                map.removeLayer(marker_detail_popup)
                if (kind == 1) {
                    e.sourceTarget.setIcon(icon5)
                }
            }
        })
}

//줌 레벨에 따라 달라지는 마커 이벤트
function change_marker() {
    if (current_state.pointmap_index >= 0) {
        if (map.getZoom() > 11) {
            if (current_state.pointmap_index == 0) {
                iot_network_list.forEach(d => {
                    d.setIcon(icon3)
                })
                national_network_list.forEach(d => {
                    d.setIcon(icon3)
                })
            } else if (current_state.pointmap_index == 1) {
                iot_network_list.forEach(d => {
                    d.setIcon(icon3)
                })
            } else if (current_state.pointmap_index == 2) {
                national_network_list.forEach(d => {
                    d.setIcon(icon3)
                })
            } else if (current_state.pointmap_index == 3) {
                remove_all_marker()
                manned_level1_network_list.forEach(d => {
                    d.addTo(map)
                })
            }
        } else if (map.getZoom() > 8) {
            if (current_state.pointmap_index == 0) {
                iot_network_list.forEach(d => {
                    d.setIcon(icon2)
                })
                national_network_list.forEach(d => {
                    d.setIcon(icon2)
                })
            } else if (current_state.pointmap_index == 1) {
                iot_network_list.forEach(d => {
                    d.setIcon(icon2)
                })
            } else if (current_state.pointmap_index == 2) {
                national_network_list.forEach(d => {
                    d.setIcon(icon2)
                })
            } else if (current_state.pointmap_index == 3) {
                remove_all_marker()
                manned_level2_network_list.forEach(d => {
                    d.addTo(map)
                })
            }
        } else {
            if (current_state.pointmap_index == 0) {
                iot_network_list.forEach(d => {
                    d.setIcon(icon1)
                })
                national_network_list.forEach(d => {
                    d.setIcon(icon1)
                })
            } else if (current_state.pointmap_index == 1) {
                iot_network_list.forEach(d => {
                    d.setIcon(icon1)
                })
            } else if (current_state.pointmap_index == 2) {
                national_network_list.forEach(d => {
                    d.setIcon(icon1)
                })
            } else if (current_state.pointmap_index == 3) {
                remove_all_marker()
                manned_level3_network_list.forEach(d => {
                    d.addTo(map)
                })
            }
        }
    }
}

//좌상단 검색필드 검색버튼누를 때 이벤트
$('#search_btn').on('click', () => {
    update_detail_box_button()
    fill_detail_table(current_state.heatmap_index)
    var value = $('#search_field').val();
    $('#detail_box').css({
        "visibility": "visible",
        "height": "auto"
    })
    var addr = $('#cities [value="' + value + '"]').data('value')
    fetch(`https://kwapi.kweather.co.kr/v1/gis/geo/addrtoloc?addr=${addr}`, {
        "method" : "GET", 
        "headers" : {
            "auth" : "kweather-test"
        }        
    })
    .then(e => e.json())
    .then(d => {
        var lat = d.data[0].lat
        var lng = d.data[0].lon
        console.log(d.data[0])
        map.flyTo(L.latLng(lat, lng), 13)
    })
})

$('#dust_button').on('click', (e) => {
    fill_detail_table(1)
})

$('#weather_button').on('click', () => {
    fill_detail_table(2)
})

//현재 위치로 이동 이벤트
$('#move_to_current_location').on('click', () => {
    if (navigator.geolocation) {
        //위치 정보를 얻기
        navigator.geolocation.getCurrentPosition(function (pos) {
            map.flyTo(L.latLng(pos.coords.latitude, pos.coords.longitude), 10);
        });
    } else {
        alert("이 브라우저에서는 현재위치찾기가 지원되지 않습니다.")
    }
})



//맵 이동시마다 실행되는 이벤트

window.onload = function () {
    map_update()
    $('#timeline_control_box').css({
        'width': window.innerWidth + 'px'
    })
    $('#date_progress').css({
        'width': (window.innerWidth - 120) + 'px'
    })
}

//컨트롤러에서 선택시 이벤트 처리 0
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

//컨트롤러에서 선택시 이벤트 처리 1
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

//컨트롤러에서 선택시 이벤트 처리 2
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

//컨트롤러에서 선택시 이벤트 처리 3
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

//iot, 국가관측망 선택
point_layer[0].on('click', () => {
    remove_all_marker()
    if (current_state.pointmap_index != 0) {
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[0][0].checked = true
        current_state.pointmap_index = 0

        if (map.getZoom() > 11) {
            iot_network_list.forEach(d => {
                d.setIcon(icon3).addTo(map)
            })
            national_network_list.forEach(d => {
                d.setIcon(icon3).addTo(map)
            })
        } else if (map.getZoom() > 8) {
            iot_network_list.forEach(d => {
                d.setIcon(icon2).addTo(map)
            })
            national_network_list.forEach(d => {
                d.setIcon(icon2).addTo(map)
            })
        } else {
            iot_network_list.forEach(d => {
                d.setIcon(icon1).addTo(map)
            })
            national_network_list.forEach(d => {
                d.setIcon(icon1).addTo(map)
            })
        }
    } else {
        current_state.pointmap_index = -1
        remove_all_marker()
    }
})

//iot 관측망 선택
point_layer[1].on('click', () => {
    remove_all_marker()
    if (current_state.pointmap_index != 1) {
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[1][0].checked = true
        current_state.pointmap_index = 1

        if (map.getZoom() > 11) {
            iot_network_list.forEach(d => {
                d.setIcon(icon3).addTo(map)
            })
        } else if (map.getZoom() > 8) {
            iot_network_list.forEach(d => {
                d.setIcon(icon2).addTo(map)
            })
        } else {
            iot_network_list.forEach(d => {
                d.setIcon(icon1).addTo(map)
            })
        }
    } else {
        current_state.pointmap_index = -1
        remove_all_marker()
    }
})

//국가관측망 선택
point_layer[2].on('click', () => {
    remove_all_marker()
    if (current_state.pointmap_index != 2) {
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[2][0].checked = true
        current_state.pointmap_index = 2

        if (map.getZoom() > 11) {
            national_network_list.forEach(d => {
                d.setIcon(icon3).addTo(map)
            })
        } else if (map.getZoom() > 8) {
            national_network_list.forEach(d => {
                d.setIcon(icon2).addTo(map)
            })
        } else {
            national_network_list.forEach(d => {
                d.setIcon(icon1).addTo(map)
            })
        }
    } else {
        current_state.pointmap_index = -1
        remove_all_marker()
    }
})

//유인관측망 선택
point_layer[3].on('click', () => {
    remove_all_marker()
    if (current_state.pointmap_index != 3) {
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[3][0].checked = true
        current_state.pointmap_index = 3

        if (map.getZoom() > 11) {
            manned_level1_network_list.forEach(d => {
                d.addTo(map)
            })
        } else if (map.getZoom() > 8) {
            manned_level2_network_list.forEach(d => {
                d.addTo(map)
            })
        } else {
            manned_level3_network_list.forEach(d => {
                d.addTo(map)
            })
        }
    } else {
        current_state.pointmap_index = -1
        remove_all_marker()
    }
})

//aws망 선택
point_layer[4].on('click', () => {
    remove_all_marker()
    if (current_state.pointmap_index != 4) {
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[4][0].checked = true
        current_state.pointmap_index = 4

        aws_network_list.forEach(d => {
            d.addTo(map)
        })
    } else {
        current_state.pointmap_index = -1
        remove_all_marker()
    }
})

//컨트롤러에서 선택시 이벤트 처리 5
$('#play_wind').on('click', () => {
    windmap.toggleWindLayer()
})

//재생 버튼 눌를 시 이벤트 처리
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
            if (parseInt(knob[0].style.left) >= 100) {
                if (current_state.is_playing) {
                    var tmp = Math.floor(parseFloat(knob[0].style.left) / 4.166667)
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
                        "left": "0%"
                    })
                    map_update(current_state.time_index)
                    if (on_map_info != undefined) {
                        update_on_map_info()
                    }
                }
            } else {
                current_state.is_playing = true
                knob.css({
                    "left": (parseFloat(knob[0].style.left) + 0.2) + "%"
                })
                current_time.css({
                    "left": ($('#knob').offset().left - 80) + "px",
                    "visibility": "visible",
                    "transition": "left .1s ease"
                })
                var tmp = Math.round(parseFloat(knob[0].style.left) / 4.166667)
                if (current_state.time_index != tmp) {
                    current_state.time_index = tmp
                    map_update()
                    current_time.text(current_state.map.current_time_str)
                }
                if (on_map_info != undefined) {
                    update_on_map_info()
                }
            }
        }, 50)
    } else {
        play_btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="30" height="30" fill="white" class="bi bi-play-fill" viewBox="0 0 16 16">
        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
      </svg>      
        `
        knob.css({
            "transition": "none"
        })
        current_time.css({
            "transition": "none"
        })
        clearInterval(Interval)
        current_state.is_playing = false
    }
})

$('#skip_start_btn').on('click', () => {
    if (current_state.is_playing) {
        return;
    }
    var knob = $('#knob')
    var current_time = $('#current_time')
    var tmp = Math.round(parseFloat(knob[0].style.left) / 4.166667)
    if (tmp > 0) {
        tmp -= 1
        knob.css({
            'left': (4.16666667 * tmp) + '%'
        })
        current_time.css({
            "left": ($('#knob').offset().left - 80) + "px",
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

$('#skip_end_btn').on('click', () => {
    if (current_state.is_playing) {
        return;
    }
    var knob = $('#knob')
    var current_time = $('#current_time')
    var tmp = Math.round(parseFloat(knob[0].style.left) / 4.166667)
    if (tmp < 24) {
        tmp += 1
        knob.css({
            'left': (4.16666667 * tmp) + '%'
        })
        current_time.css({
            "left": ($('#knob').offset().left - 80) + "px",
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

map.on('moveend', (e) => {
    ('moveend')
    wind_data = []
    heat_data = []
    map_update(current_state.time_index)
    change_marker()
})


$('.dust_std_select').on('click', (e) => {
    (e)
})


//맵 클릭 이벤투
map.on('click', (e) => {
    $('#mobile_overlay').hide()
    $('#control_box').hide()
    if (on_map_info != undefined) {
        map.removeLayer(on_map_info)
    }
    current_state.show_detail_table = true
    // update_detail_box_button()
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
})

//하단 상세 보기 페이지를 닫는 함수
$('#close_detail_box').on('click', () => {
    $('#mobile_overlay').show()
    detail_table.style.height = "0px"
    $('#detail_box').css({
        "visibility": "hidden",
        "height": "0px"
    })
    $('#detail_table').html('')
    current_state.show_detail_table = false
    update_detail_box_button()
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

$('#search_box_close').on('click', () =>{    
    $('#mobile_overlay').show()
    $("#search_box").hide()
})

$("#mobile_search").on('click', () => {
    $('#mobile_overlay').hide()
    $("#search_box").show()
})

$('#mobile_menu').on('click', () => {
    $('#mobile_overlay').hide()
    $('#control_box').show()
})

$('#control_box_close_btn').on('click', () => {
    $('#mobile_overlay').show()
    $('#control_box').hide()
})