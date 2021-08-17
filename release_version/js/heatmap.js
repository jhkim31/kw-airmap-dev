var HeatMap = function (_canvas) {
    var heat_config = {}
    var grid = []
    window.canvas = _canvas
    var ctx = canvas.getContext('2d')
    var showHeat = true
    var overlayImage = null
    var overlay_type = 3
    

    this.set_data = function(config, heat_data, _overlay_type){
        heat_config = config
        grid = heat_data
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        overlay_type = _overlay_type
        // overlay_type = 2
        this.drawCanvas()
    }

    this.drawCanvas = function() {
        if (showHeat) {
            if (overlayImage != null){
                overlayImage.remove()
            }
            var pixelGap = 8
            var value = 0;
            for (var i = 0; i < canvas.height / pixelGap; i++) {
                for (var j = 0; j < canvas.width / pixelGap; j++) {
                    var x = pixelGap * j;
                    var y = pixelGap * i;
                    value = this.getValue(x + 4, y + 4).toFixed(3);    
                    if(value == 999){
                        continue;
                    }
                    switch(overlay_type){
                        case 0:         //pm10
                            value = value
                            break
                        case 1:         //pm25
                            value = value
                            break;
                        case 2:         //t
                            value = (value) * 2.5
                            break;
                        case 3:
                            value = 100 - value
                            break
                    }
                    var r,g,b;
                    if (value < 25){
                        r = 0;
                        g = value * 10;
                        b = 250;                        
                        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                    } else if (value < 50){
                        r = 0;
                        g = 250;
                        b = 250 - (value - 25) * 10
                        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                    } else if (value < 75){
                        r = (value - 50) * 10
                        g = 250;
                        b = 0
                        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                    } else if (value < 100) {
                        r = 250;
                        g = 250 - (value - 75) * 10;
                        b = 0;
                        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
                    } else {                        
                        ctx.fillStyle = `rgb(250,0,0)`
                    }
                    switch(overlay_type){
                        case 0:
                        case 1:
                        case 2:
                            if (value != 0){
                                ctx.fillRect(x, y, pixelGap, pixelGap);
                            }
                            break
                        case 3:
                            ctx.fillRect(x, y, pixelGap, pixelGap);
                            break;
                    }   
                }
            }
            overlayImage = L.imageOverlay(canvas.toDataURL(), map.getBounds(), {opacity: 0.5}).addTo(map)
        }
    }

    this.getValue = function(x, y) {
        var point = L.point(x, y)
        var latitude = map.containerPointToLatLng(point).lat
        var longitude = map.containerPointToLatLng(point).lng

        if (latitude <= heat_config.minlat || latitude >= heat_config.maxlat) return 999
        if (longitude <= heat_config.minlng || longitude >= heat_config.maxlng) return 999

        var gridn = selectGrid(latitude, longitude);
        var g00 = grid[gridn[0]][gridn[1]]
        var g10 = grid[gridn[0]][gridn[1] + 1]
        var g01 = grid[gridn[0] + 1][gridn[1]]
        var g11 = grid[gridn[0] + 1][gridn[1] + 1]

        return interpolate(latitude, longitude, g00, g10, g01, g11, gridn)
    }

    function selectGrid(latitude, longitude) {

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

    this.set_showheat = function(bool){
        showHeat = bool
    }
    this.get_showheat = function(){
        return showHeat
    }

    this.toggleHeatMap = () => {
        if (showHeat) {
            showHeat = !showHeat
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (overlayImage != null){
                overlayImage.remove()
            }
        } else {
            showHeat = !showHeat
            this.drawCanvas();
        }
    }
    // map.on('click', (e) => {
    //     if(document.getElementById('showHeatMap').checked){
    //         console.log(e.latlng)
    //         console.log(getValue(e.containerPoint).toFixed(3))
    //     }        
    // })
}

export { HeatMap }