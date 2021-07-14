var HeatMap = function () {
    var heat_config = {}
    var grid = []
    var canvas = document.getElementById('heatmap')
    var ctx = canvas.getContext('2d')
    var showHeat = false

    this.set_data = function(config, heat_data){
        heat_config = config
        grid = heat_data
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        this.drawCanvas()
    }

    this.drawCanvas = function() {
        if (showHeat) {
            var pixelGap = 10
            var value = 0;
            for (var i = 0; i < canvas.height / pixelGap; i++) {
                for (var j = 0; j < canvas.width / pixelGap; j++) {
                    var x = pixelGap * j;
                    var y = pixelGap * i;
                    value = getValue(x + 5, y + 5).toFixed(3);            
                    // if (value < 10){
                    //     ctx.fillStyle = "rgb(70, 86, 207)"
                    // } else if (value < 20) {
                    //     ctx.fillStyle = "rgb(70, 132, 207)"
                    // } else if (value < 30){
                    //     ctx.fillStyle = "rgb(70, 173, 207)"
                    // } else if (value < 40){
                    //     ctx.fillStyle = "rgb(48, 166, 107)"
                    // } else if (value < 50){
                    //     ctx.fillStyle = "rgb(69, 217, 99"
                    // } else if(value < 60){
                    //     ctx.fillStyle = "rgb(113, 217, 69)"
                    // } else if (value < 70){
                    //     ctx.fillStyle = "rgb(185, 217, 69)"
                    // } else if (value < 80){
                    //     ctx.fillStyle = "rgb(210, 217, 69)"
                    // } else if (value < 90){
                    //     ctx.fillStyle = "rgb(217, 178, 69)"
                    // } else if (value < 100){
                    //     ctx.fillStyle = "rgb(217, 86, 69)"
                    // } else {
                    //     ctx.fillStyle = "rgb(217, 86, 69)"
                    // }
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
                    if (value == 0){
                        ctx.fillStyle = `rgb(250,250,250)`
                    }
                    ctx.fillRect(x, y, pixelGap, pixelGap);

                }
            }
        }
    }

    function getValue(x, y) {
        var point = L.point(x, y)
        var latitude = map.containerPointToLatLng(point).lat
        var longitude = map.containerPointToLatLng(point).lng

        if (latitude <= heat_config.minlat || latitude >= heat_config.maxlat) return 0
        if (longitude <= heat_config.minlng || longitude >= heat_config.maxlng) return 0

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
            debugger;
            console.log(error)
        }
        var y = (heat_config.maxlat - gridn[0] * heat_config.latGap - latitude) * (1 / heat_config.latGap)
        var d3 = y
        var d4 = 1 - y
        var result_vector_x = d3 * x2_vector_x + d4 * x1_vector_x
        return result_vector_x
    }

    this.toggleHeatMap = () => {
        if (showHeat) {
            showHeat = !showHeat
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            showHeat = !showHeat
            this.drawCanvas();
        }
    }
    map.on('click', (e) => {
        console.log(getValue(e.containerPoint).toFixed(1))
    })

    // map.on('mousemove', e => {
    //     document.getElementById('mouseOverlay2').style.left = (e.containerPoint.x + 10)+"px"
    //     document.getElementById('mouseOverlay2').style.top = (e.containerPoint.y - 35)+"px"
    //     document.getElementById('mouseOverlay2').innerText = 
    //     ` ${e.latlng.lat.toFixed(2)} , ${e.latlng.lng.toFixed(2)}\n` + getValue(e.containerPoint.x, e.containerPoint.y).toFixed(1)        
    // })
}

export { HeatMap }