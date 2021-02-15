import {gridData} from "./data.js"
window.Windmap = function (map, minlat, maxlat, minlng, maxlng, gap) {

    var map = map;
    var mapProjection = map.getProjection()


    var minlat = minlat
    var maxlat = maxlat
    var minlng = minlng
    var maxlng = maxlng
    var gap = gap
    var latgap = (maxlat * 10 - minlat * 10) / 10
    var lnggap = (maxlng * 10 - minlng * 10) / 10
    
    var canvas = document.getElementById('windmap')              // 캔버스 객체
    var ctx = canvas.getContext('2d');                        // 캔버스
    var a = []                                          // 바람 하나하나 객체의 배열
    var cnx;                                            // 캔버스 width
    var cny;                                            // 캔버스 height
    var grid = []                                       // 위도 경도에 따른 그리드 배열
    var currentFrame = 0                                // 애니메이션의 현재 프레임
    var animationId                                     // 애니메이션 아이디 (정지시 필요)

    var showWind = false
    var windCount = 1000;               //default
    var showSpeed = 1;                       //default



    

    //페이지 resize시 실행
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        cnx = canvas.width - 1
        cny = canvas.height - 1
    })

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
        var point = new kakao.maps.Point(x, y)
        a[i] = new wind(x, y, mapProjection.coordsFromContainerPoint(point).Ma, mapProjection.coordsFromContainerPoint(point).La, i, currentFrame)
    }

    //특정 인덱스 바람 객체 삭제
    function removeObj(index) {
        buildobj(index)
        return 0;
    }

    //바람 객체 클래스
    function wind(x, y, latitude, longitude, index, frame) {
        this.index = index                              // 객체배열에서 인덱스(삭제시 필요)
        this.x = x;                                     // 화면에서의 x 좌표
        this.y = y;                                     // 화면에서의 y 좌표
        this.latitude = latitude;                       // 지도에서의 위도
        this.longitude = longitude;                     // 지도에서의 경도
        this.frame = frame                              // 생성될 당시 프레임
        //바람 객체 이동 함수 (현재 좌표의 벡터를 받아 그 벡터 방향으로 이동)    
        this.windMove = function () {

            if (this.x > cnx || this.y > cny || this.x < 0 || this.y < 0) {                 //만약 캔버스 범위를 벗어나면 삭제
                return removeObj(this.index)
            } else {
                if (currentFrame - this.frame > getRandomArbitrary(100, 250)) {             // 100프레임 (1 ~ 2초) 에서 250프레임 (4초정도) 지나면 삭제
                    removeObj(this.index)
                }
                const ls = {                                                                // 이동을 위한 현재 위치 기록
                    x: this.x,
                    y: this.y
                };

                var nextVec = getVector(this.latitude, this.longitude)                          // 현재 좌표에서 벡터 계산
                this.x = ls.x + nextVec[0] * showSpeed                                                  // 현재 좌표에서 벡터만큼 이동                                                                                                      
                this.y = ls.y + nextVec[1] * showSpeed                                            // 현재 좌표에서 벡터만큼 이동                                                                                                      

                var point = new kakao.maps.Point(this.x, this.y)
                this.latitude = mapProjection.coordsFromContainerPoint(point).Ma               // 이동한 만큼 다시 현재 위치 계산
                this.longitude = mapProjection.coordsFromContainerPoint(point).La              // 이동한 만큼 다시 현재 위치 계산

                ctx.beginPath();
                ctx.lineWidth = 2;
                if (Object.keys(colorPicker).length != 0) {
                    if (nextVec[2] > 7) {
                        ctx.strokeStyle = colorPicker.speed7.color;
                    } else if (nextVec[2] > 5) {
                        ctx.strokeStyle = colorPicker.speed5.color;
                    } else if (nextVec[2] > 3) {
                        ctx.strokeStyle = colorPicker.speed3.color;
                    } else if (nextVec[2] > 1) {
                        ctx.strokeStyle = colorPicker.speed1.color;
                    } else {
                        ctx.strokeStyle = colorPicker.speed0.color;
                    }
                }
                ctx.moveTo(ls.x, ls.y);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
                ctx.closePath();

                //기록한 현재 위치와 바뀐 위치까지 그림.
            }
        }
    }

    function getVector(latitude, longitude) {
        if (latitude <= minlat || latitude >= maxlat) return [0, 0, 0]             // 만약 위도 33 이하, 38 이상이면 1, -1 벡터 리턴
        if (longitude <= minlng || longitude >= maxlng) return [0, 0, 0]         // 만약 경도 124 이하, 130 이상이면 1, -1 벡터 리턴

        var gridn = selectGrid(latitude, longitude);                            // 현재 벡터에서 그리드 계산
        var g00 = grid[gridn[0]][gridn[1]]
        var g10 = grid[gridn[0]][gridn[1] + 1]
        var g01 = grid[gridn[0] + 1][gridn[1]]
        var g11 = grid[gridn[0] + 1][gridn[1] + 1]
        // 현재 좌표를 감싸는 네(4) 그리드 계산

        return interpolate(latitude, longitude, g00, g10, g01, g11, gridn)      // 4 그리드로 보간값 구해서 리턴
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
        var x1_vector_y
        var x2_vector_x
        var x2_vector_y
        try {
            x1_vector_x = d1 * g10[0] + d2 * g00[0]
            x1_vector_y = d1 * g10[1] + d2 * g00[1]
            x2_vector_x = d1 * g11[0] + d2 * g01[0]
            x2_vector_y = d1 * g11[1] + d2 * g01[1]
        } catch (error) {
            debugger;
        }


        var y = (latitude % gap) * (1 / gap)
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
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        cnx = canvas.width - 1
        cny = canvas.height - 1
        var count = 0;
        for (var i = 0; i < ((latgap * 10) / (gap * 10)) + 1; i++) {
            grid[i] = []
            for (var j = 0; j < ((lnggap * 10) / (gap * 10)) + 1; j++) {
                grid[i][j] = []
                grid[i][j][0] = gridData[count++]
                grid[i][j][1] = gridData[count++]
                grid[i][j][2] = count / 2
            }
        }
        alert("준비가 완료되었습니다.")
    }

    //min, max 랜덤값 리턴
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    // 애니메이션 생성
    function anim() {
        currentFrame++
        animationId = requestAnimationFrame(anim)
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        a.forEach(function (e, i) {
            e.windMove();
        });
    }

    //에니메이션 정지
    function stopAnim() {
        cancelAnimationFrame(animationId)
    }

    

    this.toggleWindLayer = () => {
        if (showWind) {
            a = []
            stopAnim()
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            cnx = canvas.width - 1
            cny = canvas.height - 1
            showWind = !showWind
        } else {
            build()
            anim()
            showWind = !showWind
        }
    }

    var colorPicker = {}
    this.addControler = () => {
        document.getElementById('category').innerHTML += 
        `         
            <div id="speed7">
                <input type="color" id="picker7" name="head" value="#ff0000"> speed > 7m/s
            </div>
            <div id="speed5">
                <input type="color" id="picker5" name="head" value="#ff4600"> speed > 5m/s
            </div>
            <div id="speed3">
                <input type="color" id="picker3" name="head" value="#ff6400"> speed > 3m/s
            </div>
            <div id="speed1">
                <input type="color" id="picker1" name="head" value="#ff8C00"> speed > 1m/s
            </div>
            <div id="speed0">
                <input type="color" id="picker0" name="head" value="#000000"> speed &lt; 1m/s
            </div>
            <input type="range" min="1" max="1500" value="1000" id="range1">
            <div id="windCount"></div>
            <input type="range" min="0" max="2.0" value="1.0" id="range2" step="0.1">
            <div id="showSpeed"></div>
            <div id="windSpeed"></div>
        `

        colorPicker.speed7 = {
            "dom": document.getElementById('speed7'),
            "color": "",
            "picker": document.getElementById('picker7')
        }
        colorPicker.speed5 = {
            "dom": document.getElementById('speed5'),
            "color": "",
            "picker": document.getElementById('picker5')
        }
        colorPicker.speed3 = {
            "dom": document.getElementById('speed3'),
            "color": "",
            "picker": document.getElementById('picker3')
        }
        colorPicker.speed1 = {
            "dom": document.getElementById('speed1'),
            "color": "",
            "picker": document.getElementById('picker1')
        }
        colorPicker.speed0 = {
            "dom": document.getElementById('speed0'),
            "color": "",
            "picker": document.getElementById('picker0')
        }

        colorPicker.speed7.color = colorPicker.speed7.picker.value
        colorPicker.speed7.dom.style.backgroundColor = colorPicker.speed7.color

        colorPicker.speed5.color = colorPicker.speed5.picker.value
        colorPicker.speed5.dom.style.backgroundColor = colorPicker.speed5.color

        colorPicker.speed3.color = colorPicker.speed3.picker.value
        colorPicker.speed3.dom.style.backgroundColor = colorPicker.speed3.color

        colorPicker.speed1.color = colorPicker.speed1.picker.value
        colorPicker.speed1.dom.style.backgroundColor = colorPicker.speed1.color

        colorPicker.speed0.color = colorPicker.speed0.picker.value
        colorPicker.speed0.dom.style.backgroundColor = colorPicker.speed0.color

        colorPicker.speed7.picker.addEventListener("input", e => {
            colorPicker.speed7.color = e.target.value
            colorPicker.speed7.dom.style.backgroundColor = colorPicker.speed7.color
        }, false)

        colorPicker.speed5.picker.addEventListener("input", e => {
            colorPicker.speed5.color = e.target.value
            colorPicker.speed5.dom.style.backgroundColor = colorPicker.speed5.color

        }, false)

        colorPicker.speed3.picker.addEventListener("input", e => {
            colorPicker.speed3.color = e.target.value
            colorPicker.speed3.dom.style.backgroundColor = colorPicker.speed3.color
        }, false)

        colorPicker.speed1.picker.addEventListener("input", e => {
            colorPicker.speed1.color = e.target.value
            colorPicker.speed1.dom.style.backgroundColor = colorPicker.speed1.color
        }, false)

        colorPicker.speed0.picker.addEventListener("input", e => {
            colorPicker.speed0.color = e.target.value
            colorPicker.speed0.dom.style.backgroundColor = colorPicker.speed0.color
        }, false)

        var windCountDiv = document.getElementById('windCount');
        var gauge = document.getElementById('range1')
        windCount = document.getElementById("range1").value
        windCountDiv.innerHTML = "바람 밀도 : " + gauge.value
    
        var showSpeedDiv = document.getElementById("showSpeed");
        var gauge2 = document.getElementById("range2");
        showSpeed = document.getElementById("range2").value
        showSpeedDiv.innerHTML = "바람 속도 : " + gauge2.value        
    
        gauge.oninput = function () {
            windCountDiv.innerHTML = "바람 밀도 : " + this.value
            windCount = this.value
            build();
        }    

        gauge2.oninput = function () {
            showSpeedDiv.innerHTML = "바람 속도 : " + this.value
            showSpeed = this.value
        }

        document.getElementById('map').addEventListener('click', e => {
            var point = new kakao.maps.Point(e.pageX, e.pageY)
            console.log(point, mapProjection.coordsFromContainerPoint(point))
            var windSpeed = document.getElementById('windSpeed')
            var vector = getVector(mapProjection.coordsFromContainerPoint(point).Ma, mapProjection.coordsFromContainerPoint(point).La)
            windSpeed.innerHTML =
                `${mapProjection.coordsFromContainerPoint(point).Ma.toFixed(3)}, ${mapProjection.coordsFromContainerPoint(point).La.toFixed(3)}, 
            vector : ${vector[0].toFixed(3)}, ${vector[1].toFixed(3)} scale: ${vector[2].toFixed(3)}m/s zoomLevel: ${map.getLevel()}`
        })
    }

    kakao.maps.event.addListener(map, 'drag', () => {
        if (showWind){
            stopAnim();
            ctx.clearRect(0,0,canvas.width, canvas.height)            
        }
    })

    kakao.maps.event.addListener(map, 'dragend', () => {
        if (showWind) {
            build()
            anim()
        }
    })
}

