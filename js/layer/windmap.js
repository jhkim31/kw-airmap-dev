var WindMap = function (_canvas) {
    var wind_config = {}            // 환경 변수
    window.cn = _canvas 
    var c = cn.getContext('2d');
    var winds = []                      // 바람 객체들의 리스트
    var grid = []                       // 풍향 데이터  (gridx, gridy, (x,y))
    var animationId                     // 애니메이션을 위한 값
    var showWind = true                 // wind map 표출 플래그
    var wind_status = {                 // wind 설정값.
        zoom : 10,                      // 초기 zoom
        speed : 0.5,                    // 스피드 계수
        opacity : 0.1,                  // 투명도 (꼬리와 관련)
        count : 1000                    // 개수
    }
   
    /*
    해당 인덱스의 바람 객체를 만드는 함수
    현재 화면내의 무작위 좌표에서 바람 객체를 만든다.
    */
    function make_wind(i) {            
        var maxBounds = map.getBounds()
        var latLng = L.latLng(getRandomArbitrary(maxBounds._southWest.lat, maxBounds._northEast.lat), getRandomArbitrary(maxBounds._southWest.lng, maxBounds._northEast.lng))        
        var point = map.latLngToContainerPoint(latLng)
        winds[i] = new wind(point.x, point.y, latLng, i, animationId + getRandomArbitrary(50, 250))      
    }

    /*
    현재 바람 객체를 없앤 후 새로운 좌표에서 바람 객체를 만든다.
    바람 객체가 live time을 지났거나, 
    화면을 넘어갔을때 실행됨.
    */
    function remove_wind(index) {
        var latLng = L.latLng(getRandomArbitrary(wind_config.minlat, wind_config.maxlat), getRandomArbitrary(wind_config.minlng, wind_config.maxlng))        
        var point = map.latLngToContainerPoint(latLng)

        winds[index].x = point.x
        winds[index].y = point.y
        winds[index].latitude = latLng.lat
        winds[index].longitude = latLng.lng
        winds[index].endFrame = animationId + getRandomArbitrary(50, 150)
        return 0;
    }

    /*
    바람 객체를 정의한다
    */
    function wind(x, y, latlng, index, endFrame) {
        /*
        화면상 x,y좌표,
        위경도,
        바람의 index,
        live time을 설정
        live time : 현재 프레임이 50이고, endFrame이 80이면 30프레임(0.5초)뒤에 사라짐.
        */
        this.index = index
        this.x = x;
        this.y = y;
        this.latitude = latlng.lat;
        this.longitude = latlng.lng;
        this.endFrame = endFrame

        this.wind_move = function () {
            /*
            현재 좌표에서의 풍향을 계산하여 해당 풍향만큼 이동시킨다.
            ex) 
            현재 10,10 에서 풍향이 (4m/s, 9m/s)일경우 
            이동할 좌표는 (10 + 4 * speed계수, 10 + 9 * speed계수)가 된다
            */
            if (this.x > window.innerWidth || this.x < 0 || this.y > window.innerHeight || this.y < 0) {        //화면을 넘어갔으면 바람 객체 삭제 후 재생성
                return remove_wind(this.index)
            } else {
                if (animationId > this.endFrame) {                  //live time을 넘어갔을 경우 삭제 후 재생성
                    remove_wind(this.index)
                }
                var last_position = {                               // 현재 좌표 저장
                    x: this.x,
                    y: this.y
                }
                var nextVec = get_vector(this.latitude, this.longitude)        // 현재 좌표에서 풍향값 계산
                this.x = last_position.x + nextVec[0] * wind_status.speed       
                this.y = last_position.y + nextVec[1] * wind_status.speed


                /*
                이동할 좌표를 구한 후 선을 그린다.
                */
                var point = L.point(this.x, this.y)
                var latLng = map.containerPointToLatLng(point)
                this.latitude = latLng.lat

                this.longitude = latLng.lng

                c.beginPath();
                c.lineWidth = 3;
                c.strokeStyle = "white"
                c.moveTo(last_position.x, last_position.y);
                c.lineTo(this.x, this.y);
                c.stroke();
                c.closePath();                
            }
        }
    }

    /*
    현재 좌표에서의 풍향값(x, y)를 보간값을 통해 구한다.
    */
    function get_vector(latitude, longitude) {
        //범위를 벗어나면 0,0
        if (latitude <= wind_config.minlat || latitude >= wind_config.maxlat) return [0, 0, 0]
        if (longitude <= wind_config.minlng || longitude >= wind_config.maxlng) return [0, 0, 0]

        try{
            // heat map과 유사함.
            var gridn = select_grid(latitude, longitude);
            var g00 = grid[gridn[0]][gridn[1]]
            var g10 = grid[gridn[0]][gridn[1] + 1]
            var g01 = grid[gridn[0] + 1][gridn[1]]
            var g11 = grid[gridn[0] + 1][gridn[1] + 1]
        } catch {
            // debugger;
        }

        return interpolate(latitude, longitude, g00, g10, g01, g11, gridn)
    }

    /*
    현재 좌표에게 영향을 주는 그리드의 인덱스를 리턴합니다
    */
    function select_grid(latitude, longitude) {

        var gridlat = Math.floor((wind_config.maxlat - latitude) / wind_config.latGap)
        var gridlng = Math.floor((longitude - wind_config.minlng) / wind_config.lngGap)
        return [gridlat, gridlng]
    }

    /*
    4개의 그리드와 좌표값을 통해 현재 좌표값에서의 데이터를 보간합니다.
    bilinear interpolation 사용 (약간의 손실이 있을 수 있습니다.)
    */
    var interpolate = function (latitude, longitude, g00, g10, g01, g11, gridn) {
        var x = (longitude - (wind_config.minlng + gridn[1] * wind_config.lngGap)) * (1 / wind_config.lngGap)
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
            
            console.log(error)
        }
        var y = (wind_config.maxlat - gridn[0] * wind_config.latGap - latitude) * (1 / wind_config.latGap)
        var d3 = y
        var d4 = 1 - y
        var result_vector_x = d3 * x2_vector_x + d4 * x1_vector_x
        var result_vector_y = d3 * x2_vector_y + d4 * x1_vector_y
        var result_vector_scale = Math.sqrt(result_vector_x * result_vector_x + result_vector_y * result_vector_y)

        var result_vector = [result_vector_x, result_vector_y, result_vector_scale]
        return result_vector
    }

    /*
    min, max사이 랜덤 값을 추출하기 위한 함수
    */
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    /*
    애니메이션을 위한 함수
    프레임에 맞춰 애니메이션을 실행한다.
    매 프레임마다 바람 객체가 각각 좌표에서의 풍향만큼 이동을 함.
    */
    var anim = function () {
        if (showWind) {            
            animationId = requestAnimationFrame(anim)
            c.save()
            c.fillStyle = `rgba(255,255,255,${wind_status.opacity})`
            c.globalCompositeOperation = 'destination-out';
            c.fillRect(0, 0, cn.width, cn.height);
            c.restore()
            winds.forEach(function (e, i) {
                e.wind_move();
            });
        }
    }

    /*
    애니메이션을 시작하는 함수.
    안전성을 위해 애니메이션을 멈춘 후 
    바람 객체들을 생성 => 애니메이션을 실행함
    */
    var start_anim = function () {
        stop_anim()
        build()
        anim()
    }

    /*
    애니메이션을 멈춘다.
    */
    var stop_anim = function () {
        if (showWind) {
            cancelAnimationFrame(animationId)
            c.clearRect(0, 0, cn.width, cn.height);
        }
    }

    /*
    애니메이션을 토글시킨다.
    */
    this.toggle_wind_layer = () => {        
        if (showWind) {
            // 만약 애니메이션이 표출되고 있었다면, 바람 객체들을 모두 없애고, 애니메이션을 멈춤
            winds = []
            stop_anim()
            showWind = false
        } else {
            // 만약 표출되고 있는 상태가 아니라면, 애니메이션 실행.
            showWind = true;
            start_anim()
        }
    }

    /*
    환경 값 초기화 함수 및 업데이트 함수다.    
    */
    this.init = function (config, wind_data) {        
        set(config, wind_data)
        build()
    }

    var set = function(config, wind_data){
        stop_anim()
        wind_status.zoom = map.getZoom();
        /*
        zoom level마다 바람 객체의 속도가 다르게 보이는 문제를 해결하기 위해 넣은 식임.
        모든 zoom level에서 비슷한 속도로 보이게 한다.
        */
        wind_status.speed = 0.5 * (1.2 ** (wind_status.zoom - 10))
        if (wind_status.speed > 0.5){
            wind_status.speed = 0.5
        }
        
        cn.width = window.innerWidth
        cn.height = window.innerHeight
        wind_config = config
        grid = wind_data
        start_anim()
    }

    function build() {
        for (var i = 0; i < wind_status.count; i++) {
            make_wind(i)
        }
    }
}

export { WindMap }