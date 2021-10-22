import { HeatMap as HeatMap } from './layer/heatmap.js';
import { WindMap as WindMap } from './layer/windmap.js'
import { PointMap as PointMap } from './layer/pointmap.js'
import {dust_forecast as dust_forecast} from './table.js'
import * as aaa from "./lib/config.js"
console.log(aaa.a)
window.map = L.map('map', {
    "maxBounds": L.latLngBounds([[
        [32, 120],
        [44, 132]
    ]])
})
    .setView([37, 127], 10)
map.setMinZoom(5)

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

window.heatmap = new HeatMap(document.getElementById("heatmap"))
window.windmap = new WindMap(document.getElementById('windmap'))
window.pointmap = new PointMap(document.getElementById('pointmap'))

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
    },
    "Interval": 0
}

window.data = {
    "model_data" : {
        "wind_data": [],
        "heat_data": [],           //0 : pm10 /    1 : pm25 /   2 : t /    3 : h    
    },    
    "wind_data" : [],
    "heat_data" : [],
    "post_data": {},
    "num_observ_network" : {
        "iot_network" : 0,
        "national_network": 0,
        "shko_network" : 0,
        "aws_network" : 0
    },
    "observ_network" : {
        "iot_network_list" : [],
        "national_network_list": [],
        "shko_network_list" : [],
        "aws_network_list" : []
    },
    "forecast_data" : {
        "lifestyle_data" : {},
        "dust_data" : {}
    },
    "current_point_nm" : ""    
}

window.heatmap_layer = [$('#show_pm10')[0], $('#show_pm25')[0], $('#show_t')[0], $('#show_h')[0]]
window.point_layer = [$('#iot_national_network'), $('#iot_network'), $('#national_network'), $('#manned_network'), $('#aws_network')]

window.on_map_info = null;

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

$('#search_field').on('propertychange change keyup paste input', function(e){
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

//현재 상태를 current_state 변수에 저장.
function set_current_state(delta = 0) {
    /*
    지도의 boundary, gap 시간등을 세팅해
    해당 값들로 post_data까지 만들음.
    */
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

//////////////get data from ajax 
/////////////
/////////////

//pointmap 데이터를 받아오는 함수
async function get_point_map_data() {
    var res_data = {}
    /*    
    point map 에 대한 데이터를 받아온다.
    이 함수에서는 병렬로 4개의 데이터를 빠르게 받아옴.
    받아온 데이터는 data.observ_network 에 저장
    모든 데이터(IOT, 국가관측망, shko aws)를 받아오기까지 기다린 후
    모든 데이터를 받아오면 point map을 initialize함
    */  
    var url = 'https://kwapi.kweather.co.kr/v1/air/stations?type=all'   //IOT, 국가관측망
    var pm1 = fetch(url, {
        "headers": {
            "Content-Type": "application/json",
            "auth": "kweather-test"
        }
    })
        .then(e => e.json())
        .then(d => {
            var tmp1 = []
            var tmp2 = []
            d.data.forEach(i => {
                if (i.deviceType == "AK") {
                    tmp1.push(
                        {
                            "_latlng": [i.latlng.lat, i.latlng.lon],
                            "serial": i.serial,
                            "deviceType": i.deviceType,
                            "pm10" : i.pm10,
                            "pm25" : i.pm25
                        }
                    )
                    data.num_observ_network.national_network++
                } else {
                    tmp2.push(
                        {
                            "_latlng": [i.latlng.lat, i.latlng.lon],
                            "serial": i.serial,
                            "deviceType": i.deviceType,
                            "pm10" : i.pm10,
                            "pm25" : i.pm25
                        }
                    )
                    data.num_observ_network.iot_network++
                }
            })
            res_data.nat_data = tmp1
            res_data.iot_data = tmp2
            // data.observ_network.national_network_list = tmp1
            // data.observ_network.iot_network_list = tmp2
        })

    var url = 'https://kwapi.kweather.co.kr/v1/kma/shko/stations'   //유인관측소
    var pm2 = fetch(url, {
        "headers": {
            "Content-Type": "application/json",
            "auth": "kweather-test"
        }
    })
    .then(e => e.json())
    .then(d => {
        var tmp = []
        d.data.forEach(station => {
            data.num_observ_network.shko_network++
            tmp.push({
                "_latlng" : [station.lat, station.lon],
                "areaname" : station.areaname,
                "icon" : station.icon40,
                "wtext" : station.wtext,
                "areacode" : station.areacode,
                "temp" : station.temp
            })
        })
        res_data.shko_data = tmp
        // data.observ_network.shko_network_list = tmp
    })

    var url = 'https://kwapi.kweather.co.kr/v1/kma/aws/stations'   //aws 무인관측소
    var pm3 = fetch(url, {
        "headers": {
            "Content-Type": "application/json",
            "auth": "kweather-test"
        }
    })
    .then(e => e.json())
    .then(d => {
        var tmp = []
        d.data.forEach(station => {
            data.num_observ_network.aws_network++
            tmp.push({
                "_latlng" : [station.lat, station.lon],
                "areaname" : station.areaname,
                "icon" : station.icon40,
                "wtext" : station.wtext,
                "areacode" : station.areacode,
                "temp" : station.temp

            })
        })
        res_data.aws_data = tmp
        // data.observ_network.aws_network_list = tmp
    })
    await Promise.all([pm1, pm2, pm3])
    
    return res_data
}

//히트맵, 플로우맵 데이터를 받아오는 함수
async function get_model_data() {
    var res_data = []
    /*    
    현재 상태를 재정의 하고 현재 상태를 기반으로 데이터를 받아옴
    받아온 데이터는 converting을 거쳐 사용하기 편하게 바꿔서 리턴함.
    */    
    set_current_state(current_state.time_index * 3600000)
    var url = 'https://kwapi.kweather.co.kr/v1/klps/model/data'
    await fetch(url, {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json",
            "auth": "kweather-test"
        },
        "body": JSON.stringify(data.post_data)
    })
        .then(e => e.json())
        .then(d => {
            var converting_data = convert_data_one_time(d.data[0])
            res_data = converting_data
        })

    return res_data
}

//행정동 정보를 받아오는 함수
async function get_hang_data(lat,lng){
    /*
    lat, lng 좌표값을 통해 해당 좌표의 행정 코드를 리턴한다
    return [hang_cd, hang_sido, hang_sg, hang_emd]
    * hang_cd : 행정동 코드
    * hang_sido : 행정동 (도)이름
    * hang_sg : 행정동 (시군) 이름
    * hang_emd : 행정동 (읍면동) 이름
    */
    var res_data = []
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
            res_data.push(hang_cd)
            res_data.push(d.data.sido_nm)
            res_data.push(d.data.sg_nm)
            res_data.push(d.data.emd_nm)
        }
    })

    return res_data
}

//기상정보를 가져오는 함수.
async function get_lifestyle_data(hang_cd){
    /*
    lifestyle_data란 
    시간별 강수량, 강수확률, 구름량, 온.습도 등... 다양한 데이터들.
    행정동 코드를 통해 얻은 lifestyle data들을 사용할 수 있게 컨버팅해서 리턴함    
    */
    var res_data = []
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
        res_data = convert_lifestyle_data(d, hang_cd)
    })

    return res_data
}

async function get_aws_station_data(areacode){
    var url = 'https://kwapi.kweather.co.kr/v1/kma/aws/stationWeather/' + areacode
    var res_data = []
    await fetch(url,{
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

            var tmp = {
                "time" : new Date(date_str),
                "icon40" : item.icon40,
                "temp" : item.temp,
                "humi" : item.humi,
                "rain" : item.rain,
                "wdirk" : item.wdirk,
                "wspeed" : item.wspeed
            }
            res_data.push(tmp)            
        })
        res_data.reverse()
    })

    return res_data
}

async function get_shko_station_data(areacode){
    var url = 'https://kwapi.kweather.co.kr/v1/kma/shko/stationWeather/' + areacode
    var res_data = []
    await fetch(url,{
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

            var tmp = {
                "time" : new Date(date_str),
                "icon40" : item.icon40,
                "temp" : item.temp,
                "humi" : item.humi,
                "rain" : item.rain,
                "wdirk" : item.wdirk,
                "wspeed" : item.wspeed
            }
            res_data.push(tmp)            
        })
        res_data.reverse()
    })

    return res_data
}

//지도의 좌표에서 현재 layer에 맞는 값을 리턴 ex) 온도면 온도, 습도면 습도 리턴.
function get_value(x, y){
    var value = ""
    if (current_state.heatmap_index < 2) {
        value = Math.round(heatmap.getValue(x, y)) + "µg/m³"
    } else if (current_state.heatmap_index == 2) {
        value = heatmap.getValue(x, y).toFixed(1) + "℃"
    } else {
        value = heatmap.getValue(x, y).toFixed(1) + "%"
    }

    return value
}

//heat, flow data를 받아오고 받아온 후 각 지도들을 초기화함
async function model_data_initialize(){
    var model_data = await get_model_data()
    data.model_data.wind_data[current_state.time_index] = model_data[0]
    data.model_data.heat_data[current_state.time_index] = model_data.slice(1,5)                
    map_update()
}

//pointmap 데이터를 받아오고 받아온 후 pointmap 초기화
async function pointmap_initialize(){
    var point_map_data = await get_point_map_data()
    console.log(point_map_data)
    data.observ_network.national_network_list = point_map_data.nat_data
    data.observ_network.iot_network_list = point_map_data.iot_data
    data.observ_network.shko_network_list = point_map_data.shko_data
    data.observ_network.aws_network_list= point_map_data.aws_data

    pointmap.init(data.observ_network.iot_network_list, data.observ_network.national_network_list, data.observ_network.shko_network_list, data.observ_network.aws_network_list)
}

//서버에서 넘어온 json데이터를 사용할 수 있게 배열로 만들어 리턴하는 함수
function convert_data_one_time(json_data) {
    /*
        parameter -----
        json_data : timestamp, data로 구성
            timestamp : 해당 데이터의 시간
            data : gridX, gridY 크기의 2차원 json matrix
                   원소는 다음과 같음
                   {
                        "latlng": {
                            "lat": 37.5,
                            "lng": 126.3
                        },
                        "pm10": 12,
                        "pm25": 5,
                        "wx": -2.4097,
                        "wy": 0.7723,
                        "wd": 107.5,
                        "ws": 2.6,
                        "t": 22,
                        "h": 63
                    } 
        ---------------
        json으로 넘어온 데이터를 사용하기 편하게 각 종류별로 
        2차원 리스트로 만들어 리턴해줌

        return -------
            wind_data : (gridy, gridx, 2)

            pm10, pm25, h, t : (gridy, gridx)
        [wind_data, pm10, pm25, h, t]
        --------------
    */
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

//lifestyle_data를 사용할 수 있게 컨버팅 한다.
function convert_lifestyle_data(d, hangCd) {
    var lifestyle_data = d.data[hangCd]
    lifestyle_data = lifestyle_data[[Object.keys(lifestyle_data)[0]]]
    var return_data = []
    var index = 0
    for (var key in lifestyle_data) {
        if (index < 3) {
            var forecast = []

            var tmp = []

            tmp.push(lifestyle_data[key].WTEXT06)
            tmp.push(lifestyle_data[key].WTEXT12)
            tmp.push(lifestyle_data[key].WTEXT18)
            tmp.push(lifestyle_data[key].WTEXT24)
            forecast.push(tmp)

            forecast.push(lifestyle_data[key].RAINPROB.split(','))
            forecast.push(lifestyle_data[key].RAINFALL.split(','))
            forecast.push(lifestyle_data[key].TEMP.split(','))
            forecast.push(lifestyle_data[key].WDIR8.split(','))
            forecast.push(lifestyle_data[key].WSPDL.split(','))
            // forecast.push(lifestyle_data[key].WSPDS.split(','))
            forecast.push(lifestyle_data[key].HUMI.split(','))

            return_data.push(forecast)
        } else {
            var forecast = []

            var tmp = []
            tmp.push(lifestyle_data[key].AM_WTEXT)
            tmp.push(lifestyle_data[key].PM_WTEXT)
            forecast.push(tmp)

            var tmp = []
            tmp.push(lifestyle_data[key].MINTEMP)
            tmp.push(lifestyle_data[key].MAXTEMP)
            forecast.push(tmp)

            var tmp = []
            tmp.push(lifestyle_data[key].AM_RAINP)
            tmp.push(lifestyle_data[key].PM_RAINP)
            forecast.push(tmp)

            return_data.push(forecast)
        }
        index++

    }
    return return_data.slice(0, 7)
}

//행정동 데이터를 받아와, 하단 상세표를 표기함.
async function show_detail_data(lat, lng, is_marker=null, areacode = 0) { 
    var hang_data = await get_hang_data(lat, lng)
    var dbox = $('#detail_box')[0]  

    if (is_marker){     //마커인경우
        if (is_marker == 'iot'){
            //api 없음
        }else if (is_marker == 'national'){
            //api 없음
        } else if (is_marker == 'shko'){            
            var item = await get_shko_station_data(areacode)
            fill_shko_table(item)
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        } else if (is_marker == 'aws'){
            var item = await get_aws_station_data(areacode)
            fill_aws_table(item)
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        }
        
    } else {
        if (hang_data.length > 0){          //내륙
            data.forecast_data.lifestyle_data = await get_lifestyle_data(hang_data[0])
            fill_detail_table(current_state.heatmap_index)                  
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        } else {          
            dbox.style.visibility = 'hidden'
            dbox.style.height = '0px';                  
        }   
    }      
}

function fill_shko_table(shko_data){
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

    var table1_first_row = `<tr class = "table_header"><td>날짜</td>`
    table1_first_row += `<td colspan="${yesterday_col}">${shko_data[0].time.getDate()}일</td>`
    table1_first_row += `<td colspan="${today_col}">${shko_data[23].time.getDate()}일</td>`
    table1_first_row += `</tr>`
    detail_table1.append(table1_first_row)

    var table1_row = `<tr class = "table_header"><td>시간</td>`
    shko_data.forEach(d => {
        var h = d.time.getHours()
        table1_row += `<td>${h}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>기온</td>`
    shko_data.forEach(d => {
        var item = d.temp
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>습도</td>`
    shko_data.forEach(d => {
        var item = d.humi
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>강수량</td>`
    shko_data.forEach(d => {
        var item = d.rain
        if (item == null){
            item = '-'
        }
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>풍량</td>`
    shko_data.forEach(d => {
        var item = d.wdirk
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>풍속</td>`
    shko_data.forEach(d => {
        var item = d.wspeed
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

}

function fill_aws_table(aws_data){
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

    var table1_first_row = `<tr class = "table_header"><td>날짜</td>`
    table1_first_row += `<td colspan="${today_col}">${aws_data[0].time.getDate()}일</td>`
    table1_first_row += `<td colspan="${yesterday_col}">${aws_data[23].time.getDate()}일</td>`
    table1_first_row += `</tr>`
    detail_table1.append(table1_first_row)

    var table1_row = `<tr class = "table_header"><td>시간</td>`
    aws_data.forEach(d => {
        var h = d.time.getHours()
        table1_row += `<td>${h}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>기온</td>`
    aws_data.forEach(d => {
        var item = d.temp
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>습도</td>`
    aws_data.forEach(d => {
        var item = d.humi
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>강수량</td>`
    aws_data.forEach(d => {
        var item = d.rain
        if (item == null){
            item = '-'
        }
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>풍량</td>`
    aws_data.forEach(d => {
        var item = d.wdirk
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)

    var table1_row = `<tr><td>풍속</td>`
    aws_data.forEach(d => {
        var item = d.wspeed
        table1_row += `<td>${item}</td>`
    })
    table1_row += '</tr>'
    detail_table1.append(table1_row)
}



//하단 상세 보기의 표를 채워주는 함수 
function fill_detail_table(type) {
    update_detail_box_button()   
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

    if (type < 2) {       // 미세먼지일때
        detail_table1.html(dust_forecast)
    } else {              // 기상 상황일때
        var today = new Date().getTime()
        var table1_first_row = `<tr class = "table_header"><td>날짜</td>`
        for (var i = 0; i < 3; i++) {
            table1_first_row += `<td colspan="24">오늘 ${new Date(today + 86400000 * i).getMonth() + 1 + '/' + new Date(today + 86400000 * i).getDate()}</td>`
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
            var forecast = forecast_data[i]
            forecast[0].forEach(d => {
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
            var forecast = forecast_data[i]
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

    $('#detail_scroll_box').width($('#detail_table1').width() + $('#detail_table2').width() + 35)
}



//지도 위의 핀(클릭지점)을 업데이트 시
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

//하단에 있는 날씨, 미세먼지의 버튼을 현재 상황에 맞게 업데이트 해주는 함수
function update_detail_box_button() {
    /*
    이 함수가 실행되면, 하단의 버튼을 현재 상황에 맞게 바꿔줌    
    */
    if (current_state.heatmap_index < 2) {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('primary', 'light')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('light', 'primary')
    } else {
        document.getElementById('weather_button').className = document.getElementById('weather_button').className.replace('light', 'primary')
        document.getElementById('dust_button').className = document.getElementById('dust_button').className.replace('primary', 'light')
    }
}

//모든 overlay 맵 업데이트
function map_update(){
    windmap.stopAnim()
    windmap.init(current_state.map, data.model_data.wind_data[current_state.time_index])
    heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
    pointmap.update_point_map(current_state.pointmap_index)
    windmap.startAnim()
}

///Event
///
///

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
        heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "image/heat_bar_pm10.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(current_state.heatmap_index)
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
        heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "image/heat_bar_pm10.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(current_state.heatmap_index)
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
        heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "image/heat_bar_t2.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(current_state.heatmap_index)
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
        heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "image/heat_bar_h.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(current_state.heatmap_index)
        }
    } else {
        heatmap.toggleHeatMap()
        current_state.heatmap_index = 2
    }
})

//iot, 국가관측망 선택 버튼 이벤트 처리
point_layer[0].on('click', () => {
    if (point_layer[0][0].checked) {
        var comment = `Iot측정소 : ${data.num_observ_network.iot_network}개   국가측정소 : ${data.num_observ_network.national_network}개` 
        $('#num_stations').text(comment)
        current_state.pointmap_index = 0
        pointmap.update_point_map(current_state.pointmap_index)
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[0][0].checked = true
    } else {
        $('#num_stations').text('')
        current_state.pointmap_index = -1
        pointmap.remove_overlay_image()
    }

})

//iot 관측망 선택 버튼 이벤트 처리
point_layer[1].on('click', () => {
    if (point_layer[1][0].checked) {
        var comment = `Iot측정소 : ${data.num_observ_network.iot_network}개` 
        $('#num_stations').text(comment)
        current_state.pointmap_index = 1
        pointmap.update_point_map(current_state.pointmap_index)
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[1][0].checked = true
    } else {
        $('#num_stations').text('')
        current_state.pointmap_index = -1
        pointmap.remove_overlay_image()
    }
})

//국가관측망 선택 버튼 이벤트 처리
point_layer[2].on('click', () => {
    pointmap.remove_overlay_image()
    if (point_layer[2][0].checked) {
        var comment = `국가측정소 : ${data.num_observ_network.national_network}개` 
        $('#num_stations').text(comment)
        current_state.pointmap_index = 2
        pointmap.update_point_map(current_state.pointmap_index)
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[2][0].checked = true
    } else {
        $('#num_stations').text('')
        current_state.pointmap_index = -1
        pointmap.remove_overlay_image()
    }
})

//유인관측망 선택 버튼 이벤트 처리
point_layer[3].on('click', () => {
    pointmap.remove_overlay_image()
    if (point_layer[3][0].checked) {
        var comment = `유인관측망 : ${data.num_observ_network.shko_network}개` 
        $('#num_stations').text(comment)
        current_state.pointmap_index = 3
        pointmap.update_point_map(current_state.pointmap_index)
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[3][0].checked = true
    } else {
        $('#num_stations').text('')
        current_state.pointmap_index = -1
        pointmap.remove_overlay_image()
    }
})

//aws망 선택 버튼 이벤트 처리
point_layer[4].on('click', () => {
    pointmap.remove_overlay_image()
    if (point_layer[4][0].checked) {
        var comment = `무인관측소 : ${data.num_observ_network.aws_network}개` 
        $('#num_stations').text(comment)
        current_state.pointmap_index = 4
        pointmap.update_point_map(current_state.pointmap_index)
        point_layer.forEach(d => {
            d[0].checked = false
        })
        point_layer[4][0].checked = true
    } else {
        $('#num_stations').text('')
        current_state.pointmap_index = -1
        pointmap.remove_overlay_image()
    }
})

// 바람 선택 이벤트 처리
$('#play_wind').on('click', () => {
    windmap.toggleWindLayer()
})

//날짜 타임라인바 컨트롤 이벤트들
$('#knob').on('mousedown', (e) => {
    if (!current_state.is_playing) {
        current_state.knob_drag = true
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
                set_current_state(tmp * 3600000)
            }
            current_time.text(current_state.map.current_time_str)
        }
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
        model_data_initialize()
        if (on_map_info != undefined) {
            update_on_map_info()
        }
    }
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
        current_state.Interval = setInterval(() => {
            if (parseInt(knob.css('left')) >= 480) {
                if (current_state.is_playing) {
                    var tmp = 24
                    if (current_state.time_index != tmp) {
                        current_state.time_index = tmp
                        model_data_initialize()
                        current_time.text(current_state.map.current_time_str)
                    }
                    clearInterval(current_state.Interval)
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
                    model_data_initialize()
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
                    model_data_initialize()
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
        clearInterval(current_state.Interval)
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
        set_current_state(tmp * 3600000)
        current_time.text(current_state.map.current_time_str)
        model_data_initialize()
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
        set_current_state(tmp * 3600000)
        current_time.text(current_state.map.current_time_str)
        model_data_initialize()
        if (on_map_info != undefined) {
            update_on_map_info()
        }
    }
})


//하단 상세 보기 페이지를 닫는 함수
$('#close_detail_box').on('click', () => {
    $('#detail_box').css({
        "visibility": "hidden",
        "height": "0px"
    })
    $('#detail_table1').html('')
    $('#detail_table2').html('')
    current_state.show_detail_table = false
})

//하단 상세보기 미세먼지 버튼 이벤트
$('#dust_button').on('click', () => {
    $('#weather_button').addClass('btn-light')
    $('#weather_button').removeClass('btn-primary')
    $('#dust_button').addClass('btn-primary')
    $('#dust_button').removeClass('btn-light')
    fill_detail_table(1)
})

//하단 상세보기 날씨 버튼 이벤트
$('#weather_button').on('click', () => {
    $('#weather_button').removeClass('btn-light')
    $('#weather_button').addClass('btn-primary')
    $('#dust_button').removeClass('btn-primary')
    $('#dust_button').addClass('btn-light')
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


//맵 이동시마다 실행되는 이벤트
map.on('moveend', (e) => {
    data.model_data.wind_data = []
    data.model_data.heat_data = []
    model_data_initialize()
})

//지도 클릭 이벤트
map.on('click', async (e) => {
    if (on_map_info != undefined) {
        map.removeLayer(on_map_info)
    } 
    
    var value = get_value(e.containerPoint.x, e.containerPoint.y)
    var is_marker = pointmap.is_marker(e.containerPoint)

    if (is_marker == null) {
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

            show_detail_data(e.latlng.lat, e.latlng.lng)
    } else {
        on_map_info = on_map_info = L.marker([e.latlng.lat, e.latlng.lng], {
            icon: L.divIcon({
                html: `
                <div style = "position:absolute;background:white; border-radius:5px; width:100px; height:30px; top:-72px; left:2px; font-size:10px;">
                <div style = "background:white; position:absolute; width:5px; height:55px; top:28px;">
                </div>
                <svg class = "float-end" id = "on_map_info_close" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>      
                ${is_marker[0]} : 마커입니다                                       
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
            show_detail_data(e.latlng.lat, e.latlng.lng, is_marker[1], is_marker[2])
    }
})

window.onload = async function () {
    model_data_initialize()
    pointmap_initialize()
}