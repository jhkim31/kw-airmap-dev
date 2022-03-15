var HeatMap = function (_canvas) {
    var heat_config = {}    
    var grid = []   
    window.canvas = _canvas     
    var ctx = canvas.getContext('2d')      
    var show_heat = true        
    var overlayImage = null     
    var overlay_type = 3        //overlay될 타입 (0 : pm10, 1 : pm25, 2 : 온도, 3 : 습도)

    this.init = function(config, heat_data, _overlay_type){
        this.set_data(config, heat_data, _overlay_type)
    }

    this.set_data = function (config, heat_data, _overlay_type) {
        heat_config = config
        grid = heat_data
        console.log(grid)
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        overlay_type = _overlay_type
        this.draw_canvas()
    }

    this.draw_canvas = () => {
        if (show_heat) {
            if (overlayImage != null) {
                overlayImage.remove()
            }
            var cell_size = 8        //시각화 할 셀의 크기 (8, 8)px
            var value = 0;
            for (var i = 0; i < canvas.height / cell_size; i++) {
                for (var j = 0; j < canvas.width / cell_size; j++) {
                    var x = cell_size * j;
                    var y = cell_size * i;
                    value = this.get_value(x + 4, y + 4).toFixed(3);                    
                    if (value == 999) {
                        continue;
                    }                    
                    switch (overlay_type) { //overlay type에 따라 value를 재조정
                        case 0:         //pm10
                            value = value
                            break
                        case 1:         //pm25
                            value = value
                            break;
                        
                        case 2:         //t
                            //온도의 경우 -20 ~ 40도까지의 스펙트럼을 가지는 값을 ,0 ~ 100의 값으로 재조정한다.
                            value = (parseFloat(value) + 20) * 1.6667       
                            break;
                        case 3:         //h
                            //습도의 경우 계산 편의를 위해 값을 뒤집어 주었음.
                            value = (100 - value)                       
                            break
                    }
                    var r, g, b;

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
                        ctx.fillRect(x, y, cell_size, cell_size);
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
                        ctx.fillRect(x, y, cell_size, cell_size);
                    }                    
                }
            }
            overlayImage = L.imageOverlay(canvas.toDataURL(), map.getBounds(), { opacity: 0.4 }).addTo(map)
        }
    }

    this.get_value = function (x, y) {
        var point = L.point(x, y)
        var latitude = map.containerPointToLatLng(point).lat
        var longitude = map.containerPointToLatLng(point).lng
        
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

    function select_grid(latitude, longitude) {        
        var gridlat = Math.floor((heat_config.maxlat - latitude) / heat_config.latGap)
        var gridlng = Math.floor((longitude - heat_config.minlng) / heat_config.lngGap)
        return [gridlat, gridlng]
    }

    
    var interpolate = function (latitude, longitude, g00, g10, g01, g11, gridn) {
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

    this.set_showheat = function (bool) {
        show_heat = bool
    }

    this.get_showheat = function () {
        return show_heat
    }

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