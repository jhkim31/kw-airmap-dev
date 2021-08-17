import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'
import { config as config } from '../config.js'
import { heatData as point_list } from './data.js'
import {dust_forecast as dust_forecast} from './table.js'
import {weather_forecast as weather_forecast} from './table.js'

window.map = L.map('map')
    .setView([37, 128], 8)
map.setMinZoom(5)

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var heatmap = new HeatMap(document.getElementById("heatmap"))
var windmap = new WindMap(document.getElementById('windmap'))
var current_state = {
    "heatmap_index": 2,
    "time_index": 0,
    "show_marker": false,
    "show_detail_table": false,
    "knob_move" : false,
    "show_date_timeline" : false,
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
var on_map_info = null;

var post_data = {}
var heatmap_layer = [$('#show_pm10')[0], $('#show_pm25')[0], $('#show_t')[0], $('#show_h')[0]]
var markerList = []
var level1MarkerList = []
var level2MarkerList = []
var level3MarkerList = []


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

    // var t = new Date(new Date().getTime() + delta)       현재는 시간을 임의로 고정시킴.
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

//서버에서 넘어온 json데이터를 사용할 수 있게 배열로 만들어 리턴하는 함수
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


//히트맵, 플로우맵들을 현재 상태로 업데이트 하는 함수
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

//컨트롤러에서 선택시 이벤트 처리 0
heatmap_layer[0].addEventListener('click', () => {
    if (current_state.heatmap_index != 0) {
        heatmap_layer[1].checked = false
        heatmap_layer[2].checked = false
        heatmap_layer[3].checked = false
        current_state.heatmap_index = 0
        update_detail_box_button()
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

//컨트롤러에서 선택시 이벤트 처리 1
heatmap_layer[1].addEventListener('click', () => {

    if (current_state.heatmap_index != 1) {
        heatmap_layer[0].checked = false
        heatmap_layer[2].checked = false
        heatmap_layer[3].checked = false
        current_state.heatmap_index = 1
        update_detail_box_button()
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

//컨트롤러에서 선택시 이벤트 처리 2
heatmap_layer[2].addEventListener('click', () => {
    if (current_state.heatmap_index != 2) {
        heatmap_layer[0].checked = false
        heatmap_layer[1].checked = false
        heatmap_layer[3].checked = false
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
    }
})

//컨트롤러에서 선택시 이벤트 처리 3
heatmap_layer[3].addEventListener('click', () => {
    if (current_state.heatmap_index != 3) {
        heatmap_layer[0].checked = false
        heatmap_layer[1].checked = false
        heatmap_layer[2].checked = false
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
    }
})

//컨트롤러에서 선택시 이벤트 처리 4
$('#IoT_network').on('click', () => {
    current_state.show_marker = $('#IoT_network')[0].checked
    if (current_state.show_marker) {
        appear_marker()
    } else {
        remove_marker()
    }
})

//컨트롤러에서 선택시 이벤트 처리 5
$('#play_wind').on('click', () => {
    windmap.toggleWindLayer()
})

//날짜 타임라인 이벤트 처리
$('#date_progress').on('click', (e) => {
    var x = $('#date_progress')[0].offsetWidth
    var y = e.clientX - $('#date_progress')[0].offsetLeft
    $('#knob').css({
        "left" : ((y / x) * 480 - 10) + "px"
    })
    current_state.time_index = Math.floor((parseFloat($('#knob').css('left')) / 480) / 0.0416667)
    map_update(current_state.time_index)
    if (on_map_info != undefined) {
        update_on_map_info()
    }
})

//재생 버튼 눌를 시 이벤트 처리
$('#play').on('click', () => {
    var play_btn = $('#play')[0]
    var knob = $('#knob')
    if (play_btn.children[0].id == "play_btn") {
        play_btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" class="bi bi-pause-fill" viewBox="0 0 16 16">
            <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
        </svg>
        `
        Interval = setInterval(() => {
            knob.css({
                "left" : (parseFloat(knob.css('left')) + 2) + "px"
            })
            if (parseInt(knob.css('left')) > 480) {
                play_btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="30" height="30" fill="white" class="bi bi-play-fill" viewBox="0 0 16 16">
                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                </svg>   
                `
                clearInterval(Interval)
                knob.css({
                    "left" : "0px"
                })
                current_state.time_index = 0
                map_update(current_state.time_index)
                if (on_map_info != undefined) {
                    update_on_map_info()
                }
            }
            var tmp = Math.floor((parseFloat(knob.css('left')) / 480) / 0.0416667)
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
        <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="30" height="30" fill="white" class="bi bi-play-fill" viewBox="0 0 16 16">
        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
      </svg>      
        `
        clearInterval(Interval)
    }
})

//하단 상세 보기의 표를 채워주는 함수
function fill_detail_table(type = 0) {
    var detail_table = document.getElementById('detail_table')
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

//맵 클릭시 핀을 띄워주기 위한 메소드
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
                ${value}
                </div>`,
                className: 'display-none'
            })
        }).addTo(map)
    }
}

//맵 클릭 이벤투
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
            ${value}
            </div>`,
            className: 'display-none'
        })
    }).addTo(map)
})

//하단 상세 보기 페이지를 닫는 함수
$('#close_detail_box').on('click', () => {
    $('#detail_box').css({
        "visibility" : "hidden",
        "height" : "0px"
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

//마커 초기 세팅
var count = 0
var layer = 1
point_list.forEach(d => {
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

//줌 레벨에 따라 달라지는 마커 이벤트
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

//마커를 보여주는 함수
function appear_marker() {
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

//마커를 화면에서 지우는 함수
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

//좌상단 검색필드 검색버튼누를 때 이벤트
$('#search_btn').on('click', () => {
    update_detail_box_button()
    fill_detail_table(current_state.heatmap_index)
    var value = $('#search_field').val();
    $('#detail_box').css({
        "visibility" : "visible",
        "height" : "auto"
    })
    map.flyTo(L.latLng($('#cities [value="' + value + '"]').data('value').split(',')), 10)
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

//날짜 타임라인바 컨트롤 이벤트들
$('#knob').on('mousedown', (e) => {
    current_state.knob_move = true
})

//날짜 타임라인바 컨트롤 이벤트들
window.addEventListener('mouseup', (e) => {
    if (current_state.knob_move) {
        current_state.knob_move = false
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
    if (current_state.knob_move) {
        $('#knob').css({
            "transition": "none"
        })
        $('#knob')[0].style.left = (e.x - 130) + "px"
    }

})

window.onload = function () {
    map_update()
}

//맵 이동시마다 실행되는 이벤트
map.on('moveend', (e) => {
    wind_data = []
    heat_data = []
    map_update(current_state.time_index)
    change_marker()
})