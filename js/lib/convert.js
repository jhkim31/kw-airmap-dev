/*
서버에서 넘어온 모델 데이터를 사용할 수 있게 배열로 만들어 리턴하는 함수
*/
function data_one_time(json_data) {
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

/*
lifestyle_data를 사용할 수 있게 컨버팅 한다.
*/
function lifestyle_data(d, hangCd) {
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

export {data_one_time, lifestyle_data}