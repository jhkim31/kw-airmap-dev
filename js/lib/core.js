import {dust_forecast as dust_forecast} from '../table.js'

//convert
function convert_model_data_to_matrix(json_data) {
    /*
    json으로 넘어온 모델 데이터를 2d matrix형태로 바꾸어 리턴함.
    */
    
    var wind_matrix_data = []
    var pm10_matrix_data = []
    var pm25_matrix_data = []
    var h_matrix_data = []
    var t_matrix_data = []

    json_data.data.reverse().forEach(row_data => {     //리턴되는 데이터가 구현 방법의 역순으로 오기 때문에 resverse해줌
        var wind_row_data = []
        var pm10_row_data = []
        var pm25_row_data = []
        var t_row_data = []
        var h_row_data = []
        row_data.forEach(item => {
            wind_row_data.push([item.wx, item.wy])
            pm10_row_data.push(item.pm10)
            pm25_row_data.push(item.pm25)
            h_row_data.push(item.h)
            t_row_data.push(item.t)
        })
        wind_matrix_data.push(wind_row_data)
        pm10_matrix_data.push(pm10_row_data)
        pm25_matrix_data.push(pm25_row_data)
        h_matrix_data.push(h_row_data)
        t_matrix_data.push(t_row_data)
    })

    return [wind_matrix_data, pm10_matrix_data, pm25_matrix_data, t_matrix_data, h_matrix_data]
}

function convert_lifestyle_data_to_table_data(json_data, hangCd) {
    /*
    lifestyle데이터를 하단 상세보기 표에서 사용할 수 있도록 가공하여 리턴.
    */
    var lifestyle_data = json_data.data[hangCd][Object.keys(json_data.data[hangCd])[0]]

    var converting_data = []
    var index = 0
    for (var forecast_date in lifestyle_data) {
        console.log(forecast_date)
        if (index < 3) {        // 3일까지는 자세한 정보 표시
            var forecast_data = []
            var shko_list = []
            shko_list.push(lifestyle_data[forecast_date].WTEXT06)
            shko_list.push(lifestyle_data[forecast_date].WTEXT12)
            shko_list.push(lifestyle_data[forecast_date].WTEXT18)
            shko_list.push(lifestyle_data[forecast_date].WTEXT24)

            forecast_data.push(shko_list)
            forecast_data.push(lifestyle_data[forecast_date].RAINPROB.split(','))
            forecast_data.push(lifestyle_data[forecast_date].RAINFALL.split(','))
            forecast_data.push(lifestyle_data[forecast_date].TEMP.split(','))
            forecast_data.push(lifestyle_data[forecast_date].WDIR8.split(','))
            forecast_data.push(lifestyle_data[forecast_date].WSPDL.split(','))
            forecast_data.push(lifestyle_data[forecast_date].HUMI.split(','))

            converting_data.push(forecast_data)
        } else {                // 4일 부터는 간략한 정보 표시
            var forecast_data = []
            var shko_list = []
            shko_list.push(lifestyle_data[forecast_date].AM_WTEXT)
            shko_list.push(lifestyle_data[forecast_date].PM_WTEXT)
            forecast_data.push(shko_list)

            shko_list = []
            shko_list.push(lifestyle_data[forecast_date].MINTEMP)
            shko_list.push(lifestyle_data[forecast_date].MAXTEMP)
            forecast_data.push(shko_list)

            shko_list = []
            shko_list.push(lifestyle_data[forecast_date].AM_RAINP)
            shko_list.push(lifestyle_data[forecast_date].PM_RAINP)
            forecast_data.push(shko_list)

            converting_data.push(forecast_data)
        }
        index++
    }
    return converting_data.slice(0, 7)
}

//get api
async function get_point_map_data_async() {
    var point_map_data = {}
    /*    
    point map 에 대한 데이터를 받아온다.
    이 함수에서는 병렬로 4개의 데이터를 빠르게 받아옴.
    받아온 데이터는 data.observ_network 에 저장
    모든 데이터(IOT, 국가관측망, shko aws)를 받아오기까지 기다린 후
    모든 데이터를 받아오면 받은 데이터들을 리턴한다.
    */
    var headers = {
        "Content-Type": "application/json",
        "auth": "kweather-test"
    }
    var url = 'https://kwapi.kweather.co.kr/v1/air/stations?type=all'   //IOT, 국가관측망
    var iot_national_promise = fetch(url, {
        "headers": headers
    })
        .then(d => d.json())
        .then(d => {
            var national_list = []
            var iot_list = []
            d.data.forEach(i => {
                if (i.deviceType == "AK") {
                    national_list.push(
                        {
                            "_latlng": [i.latlng.lat, i.latlng.lon],
                            "serial": i.serial,
                            "deviceType": i.deviceType,
                            "pm10": i.pm10,
                            "pm25": i.pm25
                        }
                    )
                    data.num_observ_network.national_network++
                } else {
                    iot_list.push(
                        {
                            "_latlng": [i.latlng.lat, i.latlng.lon],
                            "serial": i.serial,
                            "deviceType": i.deviceType,
                            "pm10": i.pm10,
                            "pm25": i.pm25
                        }
                    )
                    data.num_observ_network.iot_network++
                }
            })
            point_map_data.nat_data = national_list
            point_map_data.iot_data = iot_list
        })

    var url = 'https://kwapi.kweather.co.kr/v1/kma/shko/stations'   //유인관측소
    var shko_promise = fetch(url, {
        "headers": headers
    })
        .then(d => d.json())
        .then(d => {
            var shko_list = []
            d.data.forEach(station => {
                shko_list.push({
                    "_latlng": [station.lat, station.lon],
                    "areaname": station.areaname,
                    "icon": station.icon40,
                    "wtext": station.wtext,
                    "areacode": station.areacode,
                    "temp": station.temp
                })
                data.num_observ_network.shko_network++
            })
            point_map_data.shko_data = shko_list
        })

    var url = 'https://kwapi.kweather.co.kr/v1/kma/aws/stations'   //aws 무인관측소
    var aws_promise = fetch(url, {
        "headers": headers
    })
        .then(e => e.json())
        .then(d => {
            var aws_list = []
            d.data.forEach(station => {                
                aws_list.push({
                    "_latlng": [station.lat, station.lon],
                    "areaname": station.areaname,
                    "icon": station.icon40,
                    "wtext": station.wtext,
                    "areacode": station.areacode,
                    "temp": station.temp
                })
                data.num_observ_network.aws_network++
            })
            point_map_data.aws_data = aws_list
        })

    await Promise.all([iot_national_promise, shko_promise, aws_promise])
    return point_map_data
}

async function get_model_data_async() {
    var point_map_data = []
    /*    
    현재 상태를 재정의 하고 현재 상태를 기반으로 데이터를 받아옴
    받아온 데이터는 converting을 거쳐 사용하기 편하게 바꿔서 리턴함.
    */
    set_current_state(current_state.time_index * 3600000)
    var url = 'https://kwapi.kweather.co.kr/v1/klps/model/data'
    var headers = {
        "Content-Type": "application/json",
        "auth": "kweather-test"
    }

    await fetch(url, {
        "method": "POST",
        "headers": headers,
        "body": JSON.stringify(data.post_data)
    })
        .then(e => e.json())
        .then(d => {
            var converting_data = convert_model_data_to_matrix(d.data[0])
            point_map_data = converting_data
        })

    return point_map_data
}

async function get_hang_data_async(lat, lng) {
    /*
    lat, lng 좌표값을 통해 해당 좌표의 행정 코드를 리턴한다
    return [hang_cd, hang_sido, hang_sg, hang_emd]
    * hang_cd : 행정동 코드
    * hang_sido : 행정동 (도)이름
    * hang_sg : 행정동 (시군) 이름
    * hang_emd : 행정동 (읍면동) 이름
    */
    var point_map_data = []
    var url = 'https://kwapi.kweather.co.kr/v1/gis/geo/loctoaddr?lat=' + lat + '&lon=' + lng
    await fetch(url, {
        "method": "GET",
        "headers": {
            "auth": "kweather-test"
        }
    })
        .then(e => e.json())
        .then(d => {
            if (d.data != null) {
                var hang_cd = d.data.hang_cd
                hang_cd = 11110000 //현재 다른 행정동 코드는 개발중
                point_map_data.push(hang_cd)
                point_map_data.push(d.data.sido_nm)
                point_map_data.push(d.data.sg_nm)
                point_map_data.push(d.data.emd_nm)
            }
        })

    return point_map_data
}

async function get_lifestyle_data_async(hang_cd) {
    /*
    lifestyle_data란 
    시간별 강수량, 강수확률, 구름량, 온.습도 등... 다양한 데이터들.
    행정동 코드를 통해 얻은 lifestyle data들을 사용할 수 있게 컨버팅해서 리턴함    
    */
    var point_map_data = []
    var dt = new Date()
    var d_s = dt.getFullYear() + (dt.getMonth() + 1).toString().padStart(2, '0') + dt.getDate().toString().padStart(2, '0')
    var dt = new Date(dt.getTime() + 604800000)
    var d_e = dt.getFullYear() + (dt.getMonth() + 1).toString().padStart(2, '0') + dt.getDate().toString().padStart(2, '0')

    await fetch(`https://kwapi.kweather.co.kr/kweather/lifestyle/date?hangCd=${hang_cd}&startDate=${d_s}&endDate=${d_e}`, {
        headers: {
            "auth": "kweather-test"
        }
    })
        .then(j => j.json())
        .then(d => {
            console.log(d)
            point_map_data = convert_lifestyle_data_to_table_data(d, hang_cd)
        })

    return point_map_data
}

async function get_aws_station_data_async(areacode) {
    var url = 'https://kwapi.kweather.co.kr/v1/kma/aws/stationWeather/' + areacode
    var aws_station_list = []
    await fetch(url, {
        "headers": {
            "Content-Type": "application/json",
            "auth": "kweather-test"
        }
    })
        .then(e => e.json())
        .then(d => {
            d.data.forEach(item => {
                var date_str = ''
                date_str += item.dt.slice(0, 4)
                date_str += '-'
                date_str += item.dt.slice(4, 6)
                date_str += '-'
                date_str += item.dt.slice(6, 8)
                date_str += 'T'
                date_str += item.dt.slice(8, 10)
                date_str += ':00'

                var shko_list = {
                    "time": new Date(date_str),
                    "icon40": item.icon40,
                    "temp": item.temp,
                    "humi": item.humi,
                    "rain": item.rain,
                    "wdirk": item.wdirk,
                    "wspeed": item.wspeed
                }
                aws_station_list.push(shko_list)
            })
            aws_station_list.reverse()
        })
    return aws_station_list
}

async function get_shko_station_data_async(areacode) {
    var url = 'https://kwapi.kweather.co.kr/v1/kma/shko/stationWeather/' + areacode
    var shko_station_list = []
    await fetch(url, {
        "headers": {
            "Content-Type": "application/json",
            "auth": "kweather-test"
        }
    })
        .then(e => e.json())
        .then(d => {
            d.data.forEach(item => {
                var date_str = ''
                date_str += item.dt.slice(0, 4)
                date_str += '-'
                date_str += item.dt.slice(4, 6)
                date_str += '-'
                date_str += item.dt.slice(6, 8)
                date_str += 'T'
                date_str += item.dt.slice(8, 10)
                date_str += ':00'

                var shko_list = {
                    "time": new Date(date_str),
                    "icon40": item.icon40,
                    "temp": item.temp,
                    "humi": item.humi,
                    "rain": item.rain,
                    "wdirk": item.wdirk,
                    "wspeed": item.wspeed
                }
                 shko_station_list .push(shko_list)
            })
             shko_station_list .reverse()
        })

    return  shko_station_list
}

//ui
function update_detail_box_button(type = -1) {
    /*
    이 함수가 실행되면, 하단의 버튼을 현재 상황에 맞게 바꿔줌    
    */
    if (type > 1) {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('light', 'primary')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('primary', 'light')
    } else if (type > -1) {
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

function get_value(x, y) {
    /*
    해당 좌표에서 heatmap 값을 받아와 단위를 붙여 리턴해줌
    */
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

function set_overlay_map() {
    /*
    모든 overlay 맵 업데이트
    */    
    windmap.init(current_state.map, data.model_data.wind_data[current_state.time_index])
    heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
    pointmap.update_point_map(current_state.pointmap_index)
    
}

async function model_init() {
    var model_data2 = await get_model_data_async()
    data.model_data.wind_data[current_state.time_index] = model_data2[0]
    data.model_data.heat_data[current_state.time_index] = model_data2.slice(1, 5)
    set_overlay_map()
}

async function pointmap_init() {
    var point_map_data2 = await get_point_map_data_async()
    console.log(point_map_data2)
    data.observ_network.national_network_list = point_map_data2.nat_data
    data.observ_network.iot_network_list = point_map_data2.iot_data
    data.observ_network.shko_network_list = point_map_data2.shko_data
    data.observ_network.aws_network_list = point_map_data2.aws_data

    pointmap.init(data.observ_network.iot_network_list, data.observ_network.national_network_list, data.observ_network.shko_network_list, data.observ_network.aws_network_list)
}

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

    var shko_list = 24 - current_state.time_index
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
        "period": `${shko_list},${shko_list}`
    }
}

function shko(shko_data){
    $('#weather_button').hide()
    $('#dust_button').hide()
    var detail_table1 = $('#detail_table1')
    var detail_table2 = $('#detail_table2')
    detail_table1[0].style.height = "240px"
    detail_table2[0].style.height = "240px"
    detail_table1.html('')
    detail_table2.html('')

    var today_col = shko_data[0].time.getHours()
    var yesterday_col = 24 - today_col

    var table2_first_row = `<tr class = "table_header"><td>날짜</td>`
    table2_first_row += `<td colspan="${yesterday_col}">${shko_data[0].time.getDate()}일</td>`
    table2_first_row += `<td colspan="${today_col}">${shko_data[23].time.getDate()}일</td>`
    table2_first_row += `</tr>`
    detail_table2.append(table2_first_row)

    var table2_row = `<tr class = "table_header"><td>시간</td>`
    shko_data.forEach(d => {
        var h = d.time.getHours()
        table2_row += `<td>${h}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>기온</td>`
    shko_data.forEach(d => {
        var item = d.temp
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>습도</td>`
    shko_data.forEach(d => {
        var item = d.humi
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>강수량</td>`
    shko_data.forEach(d => {
        var item = d.rain
        if (item == null){
            item = '-'
        }
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>풍량</td>`
    shko_data.forEach(d => {
        var item = d.wdirk
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>풍속</td>`
    shko_data.forEach(d => {
        var item = d.wspeed
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    $('#detail_scroll_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    if (!current_state.is_mobile){
        $('#info_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    }    
}

function aws(aws_data){
    $('#weather_button').hide()
    $('#dust_button').hide()
    var detail_table1 = $('#detail_table1')
    var detail_table2 = $('#detail_table2')
    detail_table1[0].style.height = "240px"
    detail_table2[0].style.height = "240px"
    detail_table1.html('')
    detail_table2.html('')

    var today_col = aws_data[0].time.getHours() + 1
    var yesterday_col = 24 - today_col

    var table2_first_row = `<tr class = "table_header"><td>날짜</td>`
    table2_first_row += `<td colspan="${today_col}">${aws_data[0].time.getDate()}일</td>`
    table2_first_row += `<td colspan="${yesterday_col}">${aws_data[23].time.getDate()}일</td>`
    table2_first_row += `</tr>`
    detail_table2.append(table2_first_row)

    var table2_row = `<tr class = "table_header"><td>시간</td>`
    aws_data.forEach(d => {
        var h = d.time.getHours()
        table2_row += `<td>${h}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>기온</td>`
    aws_data.forEach(d => {
        var item = d.temp
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>습도</td>`
    aws_data.forEach(d => {
        var item = d.humi
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>강수량</td>`
    aws_data.forEach(d => {
        var item = d.rain
        if (item == null){
            item = '-'
        }
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>풍량</td>`
    aws_data.forEach(d => {
        var item = d.wdirk
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>풍속</td>`
    aws_data.forEach(d => {
        var item = d.wspeed
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    $('#detail_scroll_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    if (!current_state.is_mobile){
        $('#info_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    }
    

}

function model(type) {
    update_detail_box_button(type)   
    $('#weather_button').show()
    $('#dust_button').show()
    var forecast_data = type >= 2 ? data.forecast_data.lifestyle_data : data.forecast_data.dust_data 
    var header = ['강수확률 (%)', '강수량 (mm)', '기온(C)', '풍향(8)', '풍속 (m/s)', '습도(%)']
    var detail_table1 = $('#detail_table1')
    var detail_table2 = $('#detail_table2')
    detail_table1[0].style.height = "240px"
    detail_table2[0].style.height = "240px"
    detail_table1.html('')
    detail_table2.html('')

    if (type < 2) {       // 미세먼지일때, 현재 미세먼지 api가 어떻게 정의되어 있는지 몰라 구현하지 못함.
        detail_table2.html(dust_forecast)
    } else {              // 기상 상황일때
        var today = new Date().getTime()
        var table1_first_row = `<tr class = "table_header"><td>날짜</td>`
        var shko_list = ['오늘', '내일', '모레']
        for (var i = 0; i < 3; i++) {
            table1_first_row += `<td colspan="24">${shko_list[i]} ${new Date(today + 86400000 * i).getMonth() + 1 + '/' + new Date(today + 86400000 * i).getDate()}</td>`
        }
        table1_first_row += `</tr>`
        detail_table1.append(table1_first_row)  // table1 first_row

        var table1_second_row1 = `<tr class = "table_header"><td rowspan="2" >예보</td>`
        for (var i = 0; i < 3; i++) {
            table1_second_row1 += '<td colspan="6">새벽</td><td colspan="6">아침</td><td colspan="6">낯</td><td colspan="6">저녁</td>'
        }
        table1_second_row1 += `</tr>`
        detail_table1.append(table1_second_row1)  // table1 second_row1

        var table1_second_row2 = `<tr>`
        for (var i = 0; i < 3; i++) {
            var forecast_data = forecast_data[i]
            forecast_data[0].forEach(d => {
                table1_second_row2 += `<td colspan="6">${d}</td>`
            })
        }
        table1_second_row2 += '</tr>'
        detail_table1.append(table1_second_row2)  // table1 second_row2

        var table1_third_row = `<tr><td class = "table_header">시간</td>`
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 24; j++) {
                table1_third_row += `<td>${j}</td>`
            }
        }
        table1_third_row += '</tr>'
        detail_table1.append(table1_third_row)      //table1 3th row

        var table1_4th_row = `<tr><td class = "table_header">날씨</td>`
        for (var i = 0; i < 3; i++) {
            var forecast_data = forecast_data[i]
            for (var j = 0; j < 24; j++) {
                table1_4th_row += '<td> </td>'
            }
        }
        table1_4th_row += '</tr>'
        detail_table1.append(table1_4th_row)        //table1 4th row

        for (var i = 1; i <= 6; i++) {
            var row = `<tr><td class = "table_header">${header[i - 1]}</td>`
            for (var j = 0; j < 3; j++) {
                forecast_data[j][i].forEach(d => {
                    row += `<td>${d}</td>`
                })
            }
            row += '</tr>'
            detail_table1.append(row)
        }



        var table2_first_row = `<tr class = "table_header"><td rowspan = '2'>날짜</td>`
        for (var i = 3; i < 7; i++) {
            table2_first_row += `<td colspan="2">${new Date(today + 86400000 * i).getMonth() + 1 + '/' + new Date(today + 86400000 * i).getDate()}</td>`
        }
        table2_first_row += `</tr>`
        detail_table2.append(table2_first_row)    // table2 first_row

        var table2_second_row1 = `<tr class = "table_header">`
        for (var i = 3; i < 7; i++) {
            table2_second_row1 += '<td>오전</td><td>오후</td>'
        }
        table2_second_row1 += `</tr>`
        detail_table2.append(table2_second_row1)  // table2 second_row1

        var table2_third_row = `<tr><td class = "table_header">날씨</td>`
        for (var i = 3; i < 7; i++) {
            table2_third_row += `<td>${forecast_data[i][0][0]}</td><td>${forecast_data[i][0][1]}</td>`
        }
        table2_third_row += '</tr>'
        detail_table2.append(table2_third_row)        //table2 third row

        var table2_4th_row = `<tr><td class = "table_header">최저/최고(C)</td>`        
        for (var i = 3; i < 7; i++) {
            table2_4th_row += `<td colspan="2">${forecast_data[i][1][0]}/${forecast_data[i][1][1]}</td>`
        }
        table2_4th_row += '</tr>'
        detail_table2.append(table2_4th_row)        //table2 third row

        var table2_4th_row = `<tr><td class = "table_header">강수확률 (%)</td>`        
        for (var i = 3; i < 7; i++) {
            table2_4th_row += `<td>${forecast_data[i][2][0]}</td><td>${forecast_data[i][2][1]}</td>`
        }
        table2_4th_row += '</tr>'
        detail_table2.append(table2_4th_row)        //table2 third row
    }

    $('#detail_scroll_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    var width = Math.min($('#bottom_box').width(), $('#detail_table1').width() + $('#detail_table2').width() + 32)
    if (!current_state.is_mobile){
        $('#info_box').width(width)
    }    
}

async function show_detail_data(lat, lng, is_marker=null, areacode = 0) { 
    var hang_data = await get_hang_data_async(lat, lng)    
    var dbox = $('#detail_box')[0]  
    $('#current_location').text(`${hang_data[1]} ${hang_data[2]} ${hang_data[3]}`)
    if (is_marker){     //마커인경우
        if (is_marker == 'iot'){
            //api 없음
        }else if (is_marker == 'national'){
            //api 없음
        } else if (is_marker == 'shko'){            
            var item = await get_shko_station_data_async(areacode)
            shko(item)
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        } else if (is_marker == 'aws'){
            var item = await get_aws_station_data_async(areacode)
            aws(item)
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        }
        
    } else {
        if (hang_data.length > 0){          //내륙
            data.forecast_data.lifestyle_data = await get_lifestyle_data_async(hang_data[0])
            model(current_state.heatmap_index)                  
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        } else {          
            dbox.style.visibility = 'hidden'
            dbox.style.height = '0px';                  
        }   
    }      
}
export { convert_model_data_to_matrix, convert_lifestyle_data_to_table_data }
export { shko, aws, model, show_detail_data }
export { get_aws_station_data_async, get_model_data_async, get_point_map_data_async, get_hang_data_async, get_lifestyle_data_async, get_shko_station_data_async }
export { update_detail_box_button, get_value, model_init, pointmap_init, update_on_map_info, set_current_state }