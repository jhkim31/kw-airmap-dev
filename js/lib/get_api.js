import * as convert from './convert.js'
import * as lib from './lib.js'
async function point_map_data() {
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
async function model_data() {
    var res_data = []
    /*    
    현재 상태를 재정의 하고 현재 상태를 기반으로 데이터를 받아옴
    받아온 데이터는 converting을 거쳐 사용하기 편하게 바꿔서 리턴함.
    */    
    lib.set_current_state(current_state.time_index * 3600000)
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
            var converting_data = convert.data_one_time(d.data[0])
            res_data = converting_data
        })

    return res_data
}

//행정동 정보를 받아오는 함수
async function hang_data(lat,lng){
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
async function lifestyle_data(hang_cd){
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
        res_data = convert.lifestyle_data(d, hang_cd)
    })

    return res_data
}

async function aws_station_data(areacode){
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

async function shko_station_data(areacode){
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

export {aws_station_data, model_data, point_map_data, hang_data, lifestyle_data, shko_station_data}