import { stationData } from "./data.js"

function simpleheat(canvas) {
    if (!(this instanceof simpleheat)) return new simpleheat(canvas);

    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;

    this._max = 1;
    this._data = [];
}

simpleheat.prototype = {

    defaultRadius: 25,

    defaultGradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    },

    data: function (data) {
        this._data = data;
        return this;
    },

    max: function (max) {
        this._max = max;
        return this;
    },

    add: function (point) {
        this._data.push(point);
        return this;
    },

    clear: function () {
        this._data = [];
        return this;
    },

    radius: function (r, blur) {
        blur = blur === undefined ? 15 : blur;

        // create a grayscale blurred circle image that we'll use for drawing points
        var circle = this._circle = this._createCanvas(),
            ctx = circle.getContext('2d'),
            r2 = this._r = r + blur;

        circle.width = circle.height = r2 * 2;

        ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
        ctx.shadowBlur = blur;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        return this;
    },

    resize: function () {
        this._width = this._canvas.width;
        this._height = this._canvas.height;
    },

    gradient: function (grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = this._createCanvas(),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
            gradient.addColorStop(+i, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;

        return this;
    },

    draw: function (minOpacity) {
        if (!this._circle) this.radius(this.defaultRadius);
        if (!this._grad) this.gradient(this.defaultGradient);

        var ctx = this._ctx;

        ctx.clearRect(0, 0, this._width, this._height);

        // draw a grayscale heatmap by putting a blurred circle at each data point
        for (var i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];
            ctx.globalAlpha = Math.min(Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity), 1);
            ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
        }

        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        var colored = ctx.getImageData(0, 0, this._width, this._height);
        this._colorize(colored.data, this._grad);
        ctx.putImageData(colored, 0, 0);

        return this;
    },

    _colorize: function (pixels, gradient) {
        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i + 3] * 4; // get gradient color from opacity value

            if (j) {
                pixels[i] = gradient[j];
                pixels[i + 1] = gradient[j + 1];
                pixels[i + 2] = gradient[j + 2];
            }
        }
    },

    _createCanvas: function () {
        if (typeof document !== 'undefined') {
            return document.createElement('canvas');
        } else {
            // create a new canvas instance in node.js
            // the canvas class needs to have a default constructor without any parameter
            return new this._canvas.constructor();
        }
    }
};

window.dustMap = function (map) {

    var stationGap = 0.1
    var coordinate = map.getProjection()
    var drawnStation = []
    var minlat = 31
    var maxlat = 44
    var minlng = 115
    var maxlng = 138
    var lnggap = ((maxlng * 10) - (minlng * 10)) / 10
    var latgap = ((maxlat * 10) - (minlat * 10)) / 10
    var gap = 0.5
    var grid = []
    var canvas = document.getElementById('dustmap')
    var ctx = canvas.getContext('2d')
    var showTemp = false;
    //변수선언================================================================

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        if (showTemp){
            draw();
        }  
    })
    var showOverlay = () => {
        for (var i = 0; i < stationData.length; i++) {
            var content = `
                    <div class ="label" style = "background:white;">                                                    
                    ${stationData[i].stationName}    <br>
                    ${stationData[i].pm10Value}<br>                                            
                    </div>
                `;

            // 커스텀 오버레이가 표시될 위치입니다 
            var position = new kakao.maps.LatLng(stationData[i].latitude, stationData[i].longitude);

            // 커스텀 오버레이를 생성합니다
            var customOverlay = new kakao.maps.CustomOverlay({
                position: position,
                content: content
            });
            customOverlay.setMap(map);
            if (noStationAround(stationData[i].latitude, stationData[i].longitude)) {

                drawnStation.push(stationData[i])
            }
        }
    }

    function noStationAround(latitude, longitude) {
        var x0 = parseFloat(longitude) - stationGap;
        var x1 = parseFloat(longitude) + stationGap;
        var y0 = parseFloat(latitude) + stationGap;
        var y1 = parseFloat(latitude) - stationGap;


        for (var i = 0; i < drawnStation.length; i++) {
            if (y0 > drawnStation[i].latitude && y1 < drawnStation[i].latitude) {
                if (x0 < drawnStation[i].longitude && x1 > drawnStation[i].longitude) {
                    return false;
                }
            }
        }
        return true;
    }

    function showGrid() {
        for (var i = 0; i < latgap / gap; i++) {
            for (var j = 0; j < lnggap / gap; j++) {
                var content = `
            <div class ="label" style = "background: red;">  
                ${grid[i][j][0]}<br>
                ${grid[i][j][1]}<br>                                                  
                ${grid[i][j][2].toFixed(3)}<br>                                            
            </div>
        `;

                // 커스텀 오버레이가 표시될 위치입니다 
                var position = new kakao.maps.LatLng(grid[i][j][0], grid[i][j][1]);

                // 커스텀 오버레이를 생성합니다
                var customOverlay = new kakao.maps.CustomOverlay({
                    position: position,
                    content: content
                });
                customOverlay.setMap(map);
            }
        }
    }

    function selectStations(latitude, longitude) {
        var returnData = []
        var asdf = 1;
        for (var i = 0; i < stationData.length; i++) {
            if (parseFloat(stationData[i].latitude) - asdf < latitude && parseFloat(stationData[i].latitude) + asdf >= latitude) {
                if (parseFloat(stationData[i].longitude) + asdf > longitude && parseFloat(stationData[i].longitude) - asdf < longitude) {
                    returnData.push(stationData[i])
                }
            }
        }
        return returnData

        // return stationData
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
        var countx = 0;
        var county = 0;
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
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
        // showOverlay();
    }



    var getValue = (x, y) => {
        var point = new kakao.maps.Point(x, y)
        var latitude = coordinate.coordsFromContainerPoint(point).Ma
        var longitude = coordinate.coordsFromContainerPoint(point).La
        if (latitude <= minlat || latitude >= maxlat) return 0
        if (longitude <= minlng || longitude >= maxlng) return 0

        var gridn = selectGrid(latitude, longitude);                            // 현재 벡터에서 그리드 계산
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

    function draw() {
        var data = function () {
            var returnData = []
            for (var i = -10; i < canvas.width + 50; i += 20) {
                for (var j = -10; j < canvas.height + 50; j += 20) {
                    var tmp = [i, j, (getValue(i, j) / 10) + 2]
                    returnData.push(tmp);
                }
            }
            return returnData
        }()
        var heat = simpleheat('dustmap').data(data).max(18);
        heat.draw();
    }
    kakao.maps.event.addListener(map, 'drag', () => {
        if (showTemp){
            draw();
        }        
    })

    kakao.maps.event.addListener(map, 'zoom_changed', () => {
        if (showTemp){
            draw();
        }        
    })

    this.toggleHeatmapLayer = () => {
        if (showTemp){
            ctx.clearRect(0,0,canvas.width, canvas.height);
            showTemp = false
        } else {
            draw();
            showTemp = true
        }
    }
}







