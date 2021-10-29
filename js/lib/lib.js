import * as get_api from './get_api.js'
/*
하단에 있는 날씨, 미세먼지의 버튼을 현재 상황에 맞게 업데이트 해주는 함수
*/
function update_detail_box_button(type = -1) {
    /*
    이 함수가 실행되면, 하단의 버튼을 현재 상황에 맞게 바꿔줌    
    */
    if (type > 1) {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('light', 'primary')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('primary', 'light')        
    } else if (type > -1){
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('primary', 'light')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('light', 'primary')
    } else if (current_state.heatmap_index < 2) {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('primary', 'light')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('light', 'primary')
    } else {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('light', 'primary')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('primary', 'light')
    }
}

/*
해당 좌표에서 heatmap 값을 받아와 단위를 붙여 리턴해줌
*/
function get_value(x, y) {
    var value = ""
    if (current_state.heatmap_index < 2) {
        value = Math.round(heatmap.get_value(x, y)) + "µg/m³"
    } else if (current_state.heatmap_index == 2) {
        value = heatmap.get_value(x, y).toFixed(1) + "℃"
    } else {
        value = heatmap.get_value(x, y).toFixed(1) + "%"
    }
    return value
}

/*
모든 overlay 맵 업데이트
*/
function map_update() {
    windmap.stop_anim()
    windmap.init(current_state.map, data.model_data.wind_data[current_state.time_index])
    heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
    pointmap.update_point_map(current_state.pointmap_index)
    windmap.start_anim()
}

/*
모델 데이터를 받아와 변수들을 초기화 시켜준다
*/
async function model_init() {
    var model_data = await get_api.model_data()
    data.model_data.wind_data[current_state.time_index] = model_data[0]
    data.model_data.heat_data[current_state.time_index] = model_data.slice(1, 5)
    map_update()
}

/*
pointmap 데이터를 받아오고 받아온 후 pointmap 초기화
*/
async function pointmap_init() {
    var point_map_data = await get_api.point_map_data()
    console.log(point_map_data)
    data.observ_network.national_network_list = point_map_data.nat_data
    data.observ_network.iot_network_list = point_map_data.iot_data
    data.observ_network.shko_network_list = point_map_data.shko_data
    data.observ_network.aws_network_list = point_map_data.aws_data

    pointmap.init(data.observ_network.iot_network_list, data.observ_network.national_network_list, data.observ_network.shko_network_list, data.observ_network.aws_network_list)
}

/*
해당 함수는 지도 클릭 이벤트시 호출되며, 지도에 알맞은 마커를 표출한다.
*/
function update_on_map_info() {
    if (on_map_info != undefined) {
        var latlng = on_map_info._latlng
        map.removeLayer(on_map_info)
        var point = map.latLngToContainerPoint(latlng)
        var value = get_value(point.x, point.y)

        on_map_info = L.marker(latlng, {
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

/*
현재 상황을 정의한다.
*/
function set_current_state(delta = 0) {
    /*
    지도의 boundary, gap 시간등을 세팅해
    해당 값들로 post_data까지 만들음.
    */

    //지도의 zoom에 따른 grid cell size 정의
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

    // 화면 경계 정의
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


    // 쿼리를 날릴 시간 정의
    var t = new Date(new Date().getTime() - 86400000 + delta)
    current_state.map.current_time = t
    var year = t.getYear() + 1900
    var month = t.getMonth() + 1
    var date = t.getDate()
    var hour = t.getHours()
    var currentTime = `${year}/${month}/${date} ${hour}:00`

    current_state.map.current_time_str = currentTime
    current_state.timestamp = new Date(currentTime).getTime()

    var tmp = 24 - current_state.time_index
    data.post_data = {
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

export { update_detail_box_button, get_value, model_init, pointmap_init, update_on_map_info, set_current_state }