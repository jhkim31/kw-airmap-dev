import { heatData as stationData } from './data.js';

var HeatMap = function () {
    //지도의 설정 정보
    var stationGap = 0.1
    var drawnStation = []

    var minlat = 31
    var maxlat = 44
    var minlng = 115
    var maxlng = 138
    var lnggap = ((maxlng * 10) - (minlng * 10)) / 10
    var latgap = ((maxlat * 10) - (minlat * 10)) / 10
    var gap = 0.2
    var grid = []
    var canvas = document.getElementById('heatmap')
    var ctx = canvas.getContext('2d')
    var showHeat = false

    function selectStations(latitude, longitude) {
        var returnData = []
        for (var i = 0; i < stationData.length; i++) {
            if (stationData[i].latitude < latitude && stationData[i].latitude >= latitude - 1) {
                if (stationData[i].longitude > longitude && stationData[i].longitude < longitude + 1) {
                    returnData.push(stationData[i])
                }
            }
        }
        return returnData
    }

    function getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2) {
        function deg2rad(deg) {
            return deg * (Math.PI / 180)
        }

        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lng2 - lng1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function IDWInterpolation(latitude, longitude, stations) {
        var sum1 = 0;
        var sum2 = 0;
        for (var i = 0; i < stations.length; i++) {
            var d = getDistanceFromLatLonInKm(parseFloat(stations[i].latitude), parseFloat(stations[i].longitude), latitude, longitude);
            if (d == NaN) {
                debugger;
                console.log(stations[i])
            }
            sum1 += (stations[i].pm10Value / (d * d));
            sum2 += (1 / (d * d));
        }
        if (sum2 != 0) {
            return sum1 / sum2;
        } else {
            return 0;
        }

    }

    this.init = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        var countx = 0;
        var county = 0;
        for (var j = maxlat; j >= minlat - gap; j -= gap) {
            grid[county] = [];
            for (var i = minlng; i <= maxlng + gap; i += gap) {
                grid[county][countx] = []
                var stationInGrid = selectStations(j, i);
                var v = IDWInterpolation(j, i, stationInGrid);
                grid[county][countx] = [j.toFixed(2), i.toFixed(2), v]
                countx++;
            }
            countx = 0;
            county++;
        }
        drawCanvas()
    }

    function drawCanvas(){
        if (showHeat) {
            var g = 0;
            var r = 0;
            var pixelGap = 10
            var maxValue = 50;
            var minValue = 10;
            var centerValue = (maxValue + minValue) / 2;
            var value = 0;
            for (var i = 0; i < canvas.height / pixelGap; i++) {
                for (var j = 0; j < canvas.width / pixelGap; j++) {
                    var x = pixelGap * j;
                    var y = pixelGap * i;
                    value = getValue(x, y);
                    if (value > centerValue) {
                        r = 255;
                        g = 255 - ((value - centerValue) / (maxValue - centerValue)) * 255
                    } else {
                        g = 255;
                        r = 255 * ((value - minValue) / (centerValue - minValue))
                    }
                    // r = 255;
                    // g = 255 - ((value - minValue) / (maxValue - minValue)) * 255
                    ctx.fillStyle = "rgb(" + r + "," + g + ",0)"
                    ctx.fillRect(x, y, pixelGap, pixelGap);
                }
            }
        }
    }

    function getValue(x, y) {
        var point = L.point(x, y)
        var latitude = map.containerPointToLatLng(point).lat

        var longitude = map.containerPointToLatLng(point).lng

        if (latitude <= minlat || latitude >= maxlat) return 10
        if (longitude <= minlng || longitude >= maxlng) return 10

        var gridn = selectGrid(latitude, longitude);
        var g00 = grid[gridn[0]][gridn[1]]
        var g10 = grid[gridn[0]][gridn[1] + 1]
        var g01 = grid[gridn[0] + 1][gridn[1]]
        var g11 = grid[gridn[0] + 1][gridn[1] + 1]
        // 현재 좌표를 감싸는 네(4) 그리드 계산

        return interpolate(latitude, longitude, g00, g10, g01, g11, gridn)
        // return getRandomArbitrary(20,20);
    }


    //위도와 경도를 가지고 적절한 그리드 리턴 (경도 0.25 단위 , 위도 0.25 단위로 쪼개어져 있음.)
    function selectGrid(latitude, longitude) {

        var gridlng = Math.floor(((longitude * 10 - minlng * 10) / (gap * 10)))
        var gridlat = Math.floor(((maxlat * 10 - latitude * 10) / (gap * 10)))

        return [gridlat, gridlng]
    }

    //위도 경도. 그리드로 보간값 계산
    var interpolate = function (latitude, longitude, g00, g10, g01, g11, gridn) {
        var x = (longitude % gap) * (1 / gap)

        var d1 = x
        var d2 = 1 - x

        var x1_vector_x
        var x2_vector_x
        try {
            x1_vector_x = d1 * g10[2] + d2 * g00[2]
            x2_vector_x = d1 * g11[2] + d2 * g01[2]
        } catch (error) {
            debugger;
        }
        var y = (latitude % gap) * (1 / gap)
        var d4 = y
        var d3 = 1 - y
        var result_vector_x = d3 * x2_vector_x + d4 * x1_vector_x
        return result_vector_x                //보간값 리턴
    }

    this.toggleHeatMap = () => {
        if (showHeat) {
            showHeat = !showHeat
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            showHeat = !showHeat
            drawCanvas();
        }
        
    }


    window.addEventListener('resize', e => {
        drawCanvas();
    })
    
    map.on('move', () => {
        drawCanvas();
    })
}

export { HeatMap }