import { windData as windData } from './data.js'

var WindMap = function () {
    var wind_config = {}

    var cn = document.getElementById('windmap')         // 캔버스 객체
    var c = cn.getContext('2d');                        // 캔버스
    var a = []                                          // 바람 하나하나 객체의 배열
    var cnx;                                            // 캔버스 width
    var cny;                                            // 캔버스 height
    window.grid = []                                       // 위도 경도에 따른 그리드 배열
    var currentFrame = 0                                // 애니메이션의 현재 프레임
    var animationId                                     // 애니메이션 아이디 (정지시 필요)
    this.showWind = false
    var windCount = 1000;                   //default
    var showSpeed = 1;                       //default
    var initLat
    var initLng


    //페이지 resize시 실행
    window.onresize = () => {
        cn.width = window.innerWidth
        cn.height = window.innerHeight
        cnx = cn.width - 1
        cny = cn.height - 1
    }

    function build() {
        a = [];
        for (var i = 0; i < windCount; i++) {
            buildobj(i)
        }
    }

    //바람 객체 생성 (실제 인스턴스 생성)
    function buildobj(i) {
        var x = getRandomArbitrary(0, cnx)
        var y = getRandomArbitrary(0, cny)
        var point = L.point(x, y)
        a[i] = new wind(x, y, map.containerPointToLatLng(point).lat, map.containerPointToLatLng(point).lng, i, animationId + getRandomArbitrary(60, 250))
    }

    //특정 인덱스 바람 객체 삭제
    function removeObj(index) {
        buildobj(index)
        return 0;
    }

    //바람 객체 클래스
    function wind(x, y, latitude, longitude, index, endFrame) {
        this.index = index                              // 객체배열에서 인덱스(삭제시 필요)
        this.x = x;                                     // 화면에서의 x 좌표
        this.y = y;                                     // 화면에서의 y 좌표
        this.latitude = latitude;                       // 지도에서의 위도
        this.longitude = longitude;                     // 지도에서의 경도
        this.endFrame = endFrame                              // 생성될 당시 프레임
        //바람 객체 이동 함수 (현재 좌표의 벡터를 받아 그 벡터 방향으로 이동)    
        this.windMove = function () {
            if (this.x > cnx || this.y > cny || this.x < 0 || this.y < 0) {                 //만약 캔버스 범위를 벗어나면 삭제
                return removeObj(this.index)
            } else {
                if (animationId > this.endFrame) {             // 100프레임 (1 ~ 2초) 에서 250프레임 (4초정도) 지나면 삭제
                    removeObj(this.index)
                }
                const ls = {                                                                // 이동을 위한 현재 위치 기록
                    x: this.x,
                    y: this.y
                };

                var nextVec = getVector(this.latitude, this.longitude)                          // 현재 좌표에서 벡터 계산
                this.x = ls.x + nextVec[0] * showSpeed                                                  // 현재 좌표에서 벡터만큼 이동                                                                                                      
                this.y = ls.y + nextVec[1] * showSpeed                                            // 현재 좌표에서 벡터만큼 이동                                                                                                      

                var point = L.point(this.x, this.y)

                this.latitude = map.containerPointToLatLng(point).lat               // 이동한 만큼 다시 현재 위치 계산

                this.longitude = map.containerPointToLatLng(point).lng

                c.beginPath();
                c.lineWidth = 2.2;
                c.strokeStyle = "black"

                c.moveTo(ls.x, ls.y);
                c.lineTo(this.x, this.y);
                c.stroke();
                c.closePath();
            }
        }
    }

    function getVector(latitude, longitude) {
        if (latitude <= wind_config.minlat || latitude >= wind_config.maxlat) return [0, 0, 0]             // 만약 위도 33 이하, 38 이상이면 1, -1 벡터 리턴
        if (longitude <= wind_config.minlng || longitude >= wind_config.maxlng) return [0, 0, 0]         // 만약 경도 124 이하, 130 이상이면 1, -1 벡터 리턴

        var gridn = selectGrid(latitude, longitude);                            // 현재 벡터에서 그리드 계산
        var g00 = grid[gridn[0]][gridn[1]]
        var g10 = grid[gridn[0]][gridn[1] + 1]
        var g01 = grid[gridn[0] + 1][gridn[1]]
        var g11 = grid[gridn[0] + 1][gridn[1] + 1]

        return interpolate(latitude, longitude, g00, g10, g01, g11)      // 4 그리드로 보간값 구해서 리턴
    }

    //위도와 경도를 가지고 적절한 그리드 리턴 (경도 0.25 단위 , 위도 0.25 단위로 쪼개어져 있음.)
    function selectGrid(latitude, longitude) {

        var gridlat = Math.floor((wind_config.maxlat - latitude) / wind_config.latGap)
        var gridlng = Math.floor((longitude - wind_config.minlng) / wind_config.lngGap)
        return [gridlat, gridlng]
    }

    //위도 경도. 그리드로 보간값 계산
    var interpolate = function (latitude, longitude, g00, g10, g01, g11) {
        var x = (longitude % wind_config.lngGap) * (1 / wind_config.lngGap)

        var d1 = x
        var d2 = 1 - x

        var x1_vector_x
        var x1_vector_y
        var x2_vector_x
        var x2_vector_y
        try {
            x1_vector_x = d1 * g10[0] + d2 * g00[0]
            x1_vector_y = d1 * g10[1] + d2 * g00[1]
            x2_vector_x = d1 * g11[0] + d2 * g01[0]
            x2_vector_y = d1 * g11[1] + d2 * g01[1]
        } catch (error) {
            console.log("error", error)
            debugger;
        }


        var y = (latitude % wind_config.latGap) * (1 / wind_config.latGap)
        var d4 = y
        var d3 = 1 - y

        var result_vector_x = d3 * x2_vector_x + d4 * x1_vector_x
        var result_vector_y = d3 * x2_vector_y + d4 * x1_vector_y
        var result_vector_scale = Math.sqrt(result_vector_x * result_vector_x + result_vector_y * result_vector_y)

        var result_vector = [result_vector_x, result_vector_y, result_vector_scale]
        return result_vector                //보간값 리턴
    }
    // 위.경도 그리드값 읽어오기
    this.init = () => {
        cn.width = window.innerWidth
        cn.height = window.innerHeight
        cnx = cn.width - 1
        cny = cn.height - 1
        readGrid()
        build()
    }

    function readGrid() {

        var a = L.point(map.getSize().x + 70, -70)
        initLat = map.containerPointToLatLng(a).lat;
        initLng = map.containerPointToLatLng(a).lng;

        wind_config.latGap = map.containerPointToLatLng(a).lat - map.getBounds()._northEast.lat;
        wind_config.lngGap = map.containerPointToLatLng(a).lng - map.getBounds()._northEast.lng;
        wind_config.maxlat = initLat;
        wind_config.maxlng = initLng;
        wind_config.gridX = Math.ceil(map.getSize().x / 70) + 2
        wind_config.gridY = Math.ceil(map.getSize().y / 70) + 2
        wind_config.minlng = initLng - wind_config.lngGap * wind_config.gridX
        wind_config.minlat = initLat - wind_config.latGap * wind_config.gridY

        console.log(wind_config)
        var url = `http://localhost:4500/wind?gridX=${wind_config.gridX}&gridY=${wind_config.gridY}&latGap=${wind_config.latGap}&lngGap=${wind_config.lngGap}&maxlat=${wind_config.maxlat}&maxlng=${wind_config.maxlng}&minlat=${wind_config.minlat}&minlng=${wind_config.minlng}`
        console.log(url)
        fetch(url)
            .then(e => e.json())
            .then(d => {
                console.log(d)
                grid = d

            })
    }

    //min, max 랜덤값 리턴
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    // 애니메이션 생성
    function anim() {
        animationId = requestAnimationFrame(anim)
        c.fillStyle = "rgba(255, 255, 255,0.3 )"
        c.fillRect(0, 0, cn.width, cn.height);
        a.forEach(function (e, i) {
            e.windMove();
        });
    }

    //에니메이션 정지
    function stopAnim() {
        cancelAnimationFrame(animationId)
        c.clearRect(0, 0, cn.width, cn.height);
    }

    this.toggleWindLayer = () => {
        if (this.showWind) {
            a = []
            stopAnim()
            this.showWind = false
        } else {
            build();
            anim()
            this.showWind = true;
        }
    }

    map.on('move', () => {
        if (this.showWind) {
            stopAnim();
        }
    })

    map.on('moveend', () => {
        readGrid()
        build()
        console.log('moveend')
        if (this.showWind) {
            stopAnim();
            anim()
        }
    })
    map.on('zoomend', () => {
        readGrid()
        build()
    })
}

export { WindMap }