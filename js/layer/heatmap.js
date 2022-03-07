var HeatMap = function (_canvas) {
    var heat_config = {}    //환경설정
    var grid = []   //기상 데이터 (gridx, gridy, 4)
    window.canvas = _canvas     //캔버스
    var ctx = canvas.getContext('2d')      
    var show_heat = true        //표출 플래그
    var overlayImage = null     //overlay된 이미지(이미지로 구현)
    var overlay_type = 3        //overlay될 타입 (0 : pm10, 1 : pm25, 2 : 온도, 3 : 습도)

   
   
    this.init = function(config, heat_data, _overlay_type){
        this.set_data(config, heat_data, _overlay_type)
    }
    /*
    환경 설정 값과(좌표 경계, grid size등), 
    데이터(pm10, pm25, 온도, 습도 4개의 레이어),
    데이터 인덱스(4개의 데이터중 어떤 데이터를 표출할지),
    그외 표출할 크기를 지정합니다.
    모든 설정이 끝나면 this.draw_canvas() 메소드를 호출해 데이터를 시각화 합니다.
    */
    this.set_data = function (config, heat_data, _overlay_type) {
        heat_config = config
        grid = heat_data
        console.log(grid)
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        overlay_type = _overlay_type
        this.draw_canvas()
    }

    /*
    표출 플래그가 true일때 실행
    overlay type에 맞춰 데이터를 표출함.
    */    
    this.draw_canvas = () => {
        if (show_heat) {
            if (overlayImage != null) {
                overlayImage.remove()
            }
            var pixelGap = 8        //시각화 할 셀의 크기 (8, 8)px
            var value = 0;
            for (var i = 0; i < canvas.height / pixelGap; i++) {
                for (var j = 0; j < canvas.width / pixelGap; j++) {
                    var x = pixelGap * j;
                    var y = pixelGap * i;
                    value = this.get_value(x + 4, y + 4).toFixed(3);                    
                    if (value == 999) {
                        continue;
                    }
                    //overlay type에 따라 value를 재조정
                    switch (overlay_type) {
                        case 0:         //pm10
                            value = value
                            break
                        case 1:         //pm25
                            value = value
                            break;
                        
                        case 2:         //t
                            value = (parseFloat(value) + 20) * 1.6667       //온도의 경우 -20 ~ 40도까지의 스펙트럼을 가지는 값을 ,0 ~ 100의 값으로 재조정한다.
                            break;
                        case 3:         //h
                            value = (100 - value)                       //습도의 경우 계산 편의를 위해 값을 뒤집어 주었음.
                            break
                    }
                    var r, g, b;
                    /*
                    여기는 해당 value에 맞는 RGB값을 계산하여 표출해주는 부분입니다.
                    온도가 아닌경우 4단계로 구분하여 값을 계산
                    온도일경우 6단계로 구분하여 값을 계산합니다.
                    */
                    if (overlay_type != 2) {
                        if (value < 25) {   //푸른색 ~ 하늘색
                            r = 0;
                            g = value * 10;
                            b = 250;
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else if (value < 50) {        //하늘색 ~ 초록색
                            r = 0;
                            g = 250;
                            b = 250 - (value - 25) * 10
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else if (value < 75) {        //초록색 ~ 노란색
                            r = (value - 50) * 10
                            g = 250;
                            b = 0
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else if (value < 100) {       //노란색 ~ 빨간색
                            r = 250;
                            g = 250 - (value - 75) * 10;
                            b = 0;
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else {                        //해당 범위를 넘어가면(오류값이라고 생각되면) 검은색
                            ctx.fillStyle = `rgb(0,0,0)`
                        }
                        ctx.fillRect(x, y, pixelGap, pixelGap);
                    } else {
                        if (value < 16.667){        // -20 ~ -10        보라 ~ 파란색
                            value = value * 9;
                            r = 150 - value;
                            g = 0;
                            b = 250;
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else if (value < 33.334) {    //-10 ~ 0       파란색 ~ 하늘색
                            value = (value - 16.667) * 15
                            r = 0;
                            g = value;
                            b = 250;
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else if (value < 50) {        //0 ~ 10        하늘색 ~ 초록색
                            value = (value - 33.334) * 15
                            r = 0;
                            g = 250;
                            b = 250 - value
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else if (value < 66.667) {    //10 ~ 20       초록색 ~ 노란색
                            value = (value - 50) * 15
                            r = value
                            g = 250;
                            b = 0
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else if (value < 83.335) {    //20 ~ 30       노란색 ~ 빨간색
                            value = (value - 66.667) * 15
                            r = 250;
                            g = 250 - value
                            b = 0;
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else if (value < 100){        //30 ~ 40       //빨간색 ~ 검붉은색
                            value = (value - 83.335) * 10
                            r = 250 - value;
                            g = 0
                            b = 0;
                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                        } else {
                            ctx.fillStyle = `rgb(0,0,0)`
                        }
                        ctx.fillRect(x, y, pixelGap, pixelGap);
                    }                    
                }
            }
            overlayImage = L.imageOverlay(canvas.toDataURL(), map.getBounds(), { opacity: 0.4 }).addTo(map)
        }
    }

    /*
    화면에 보이는 지도상의 x,y 좌표에서의 값을 얻어옵니다.
    */
    this.get_value = function (x, y) {
        /*
        x,y 좌표를 위경도로 변환합니다.
        */
        var point = L.point(x, y)
        var latitude = map.containerPointToLatLng(point).lat
        var longitude = map.containerPointToLatLng(point).lng
        
        //범위를 벗어나면 999를 리턴합니다.
        if (latitude <= heat_config.minlat || latitude >= heat_config.maxlat) return 999
        if (longitude <= heat_config.minlng || longitude >= heat_config.maxlng) return 999

        /*
        해당 좌표에게 영향을 주는 4개의 그리드를 선택해 보간값을 리턴합니다        
        g00 : 해당 좌표에 영향을 주는 좌상단 그리드
        g10 : 해당 좌표에 영향을 주는 우상단 그리드
        g01 : 해당 좌표에 영향을 주는 좌하단 그리드
        g11 : 해당 좌표에 영향을 주는 우하단 그리드

        g00-------g10
        |   p      |
        |          |
        |          |
        g01-------g11
        */
        var gridn = select_grid(latitude, longitude);
        var g00 = grid[gridn[0]][gridn[1]]
        var g10 = grid[gridn[0]][gridn[1] + 1]
        var g01 = grid[gridn[0] + 1][gridn[1]]
        var g11 = grid[gridn[0] + 1][gridn[1] + 1]

        return interpolate(latitude, longitude, g00, g10, g01, g11, gridn)
    }

    /*
    현재 좌표에게 영향을 주는 그리드의 인덱스를 리턴합니다
    */
    function select_grid(latitude, longitude) {        
        
        var gridlat = Math.floor((heat_config.maxlat - latitude) / heat_config.latGap)
        var gridlng = Math.floor((longitude - heat_config.minlng) / heat_config.lngGap)

        return [gridlat, gridlng]
    }

    /*
    4개의 그리드와 좌표값을 통해 현재 좌표값에서의 데이터를 보간합니다.
    bilinear interpolation 사용 (약간의 손실이 있을 수 있습니다.)
    */
    var interpolate = function (latitude, longitude, g00, g10, g01, g11, gridn) {
        /*
        x, y : 해당 좌표가 그리드 내에서 어느 정도 비율로 존재하는지 계산합니다 [0,1]
        g00-------g10
        |          |
        |          |
        |  p       |
        g01-------g11
        위의 예시라면 x : 0.2, y : 0.8 정도의 값이 나옵니다.
        해당 비율만큼 bilinear interpolation을 통해 계산합니다.
        */
        var x = (longitude - (heat_config.minlng + gridn[1] * heat_config.lngGap)) * (1 / heat_config.lngGap)
        
        var d1 = x
        var d2 = 1 - x

        var x1_vector_x
        var x2_vector_x
        try {
            x1_vector_x = d1 * g10 + d2 * g00
            x2_vector_x = d1 * g11 + d2 * g01
        } catch (error) {
            console.log(error)
        }
        var y = (heat_config.maxlat - gridn[0] * heat_config.latGap - latitude) * (1 / heat_config.latGap)
        var d3 = y
        var d4 = 1 - y
        var result_vector_x = d3 * x2_vector_x + d4 * x1_vector_x
        return result_vector_x
    }
    /*
    set 표출 플래그
    */
    this.set_showheat = function (bool) {
        show_heat = bool
    }

    /*
    get 표출 플래그
    */
    this.get_showheat = function () {
        return show_heat
    }

    /*
    heatmap을 끄고 켭니다.
    */

    this.show_heatmap = () => {
        show_heat = true
        this.draw_canvas();
    }

    this.hide_heatmap = () => {
        show_heat = !show_heat
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (overlayImage != null) {
            overlayImage.remove()
        }
    }
}

export { HeatMap }