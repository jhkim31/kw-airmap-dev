import { heatData as heatData } from './data.js'

var HeatMap = function () {
    var heat_config = {}
    var initLat;
    var initLng
    var grid = []
    var canvas = document.getElementById('heatmap')
    var ctx = canvas.getContext('2d')
    var showHeat = false

    this.init = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        readGrid()
        drawCanvas()
    }

    function readGrid() {
        var a = L.point(map.getSize().x + 70, -70)
        initLat = map.containerPointToLatLng(a).lat;
        initLng = map.containerPointToLatLng(a).lng;

        heat_config.latGap = map.containerPointToLatLng(a).lat - map.getBounds()._northEast.lat;
        heat_config.lngGap = map.containerPointToLatLng(a).lng - map.getBounds()._northEast.lng;
        heat_config.maxlat = initLat;
        heat_config.maxlng = initLng;
        heat_config.gridX = Math.ceil(map.getSize().x / 70) + 2
        heat_config.gridY = Math.ceil(map.getSize().y / 70) + 2
        heat_config.minlng = initLng - heat_config.lngGap * heat_config.gridX
        heat_config.minlat = initLat - heat_config.latGap * heat_config.gridY

        console.log(heat_config)

        var url = `http://localhost:4500/heat?gridX=${heat_config.gridX}&gridY=${heat_config.gridY}&latGap=${heat_config.latGap}&lngGap=${heat_config.lngGap}&maxlat=${heat_config.maxlat}&maxlng=${heat_config.maxlng}&minlat=${heat_config.minlat}&minlng=${heat_config.minlng}`
        console.log(url)
        fetch(url)
            .then(e => e.json())
            .then(d => {
                console.log(d)
                grid = d
                drawCanvas();
            })  
    }

    function drawCanvas() {
        if (showHeat) {
            var pixelGap = 10
            var value = 0;
            for (var i = 0; i < canvas.height / pixelGap; i++) {
                for (var j = 0; j < canvas.width / pixelGap; j++) {
                    var x = pixelGap * j;
                    var y = pixelGap * i;
                    value = getValue(x, y).toFixed(3);
                    if (value < 10) {
                        ctx.fillStyle = "rgb(70, 86, 207)"
                    } else if (value < 20) {
                        ctx.fillStyle = "rgb(70, 132, 207)"
                    } else if (value < 30) {
                        ctx.fillStyle = "rgb(70, 173, 207)"
                    } else if (value < 40) {
                        ctx.fillStyle = "rgb(48, 166, 107)"
                    } else if (value < 50) {
                        ctx.fillStyle = "rgb(69, 217, 99"
                    } else if (value < 60) {
                        ctx.fillStyle = "rgb(113, 217, 69)"
                    } else if (value < 70) {
                        ctx.fillStyle = "rgb(185, 217, 69)"
                    } else if (value < 80) {
                        ctx.fillStyle = "rgb(210, 217, 69)"
                    } else if (value < 90) {
                        ctx.fillStyle = "rgb(217, 178, 69)"
                    } else if (value < 100) {
                        ctx.fillStyle = "rgb(217, 86, 69)"
                    } else {
                        ctx.fillStyle = "rgb(70, 173, 207)"
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

        if (latitude <= heat_config.minlat || latitude >= heat_config.maxlat) return 10
        if (longitude <= heat_config.minlng || longitude >= heat_config.maxlng) return 10

        var gridn = selectGrid(latitude, longitude);
        var g00 = grid[gridn[0]][gridn[1]]
        var g10 = grid[gridn[0]][gridn[1] + 1]
        var g01 = grid[gridn[0] + 1][gridn[1]]
        var g11 = grid[gridn[0] + 1][gridn[1] + 1]

        return interpolate(latitude, longitude, g00, g10, g01, g11)
    }

    function selectGrid(latitude, longitude) {

        var gridlat = Math.floor((heat_config.maxlat - latitude) / heat_config.latGap)
        var gridlng = Math.floor((longitude - heat_config.minlng) / heat_config.lngGap)

        return [gridlat, gridlng]
    }

    var interpolate = function (latitude, longitude, g00, g10, g01, g11) {
        var x = (longitude % heat_config.latGap) * (1 / heat_config.latGap)

        var d1 = x
        var d2 = 1 - x

        var x1_vector_x
        var x2_vector_x
        try {
            x1_vector_x = d1 * g10 + d2 * g00
            x2_vector_x = d1 * g11 + d2 * g01
        } catch (error) {
            debugger;
        }
        var y = (latitude % heat_config.lngGap) * (1 / heat_config.lngGap)
        var d4 = y
        var d3 = 1 - y
        var result_vector_x = d3 * x2_vector_x + d4 * x1_vector_x
        return result_vector_x
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
    map.on('move', () => {
        // readGrid()
        drawCanvas();
    })

    map.on('moveend', () => {
        readGrid()
    })

    map.on('click', (e) => {
        console.log(getValue(e.layerPoint))
    })
}

export { HeatMap }