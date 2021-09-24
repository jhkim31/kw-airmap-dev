var WindMap = function (_canvas) {

    var wind_config = {}

    window.cn = _canvas
    cn.width = window.innerWidth
    cn.height = window.innerHeight
    var c = cn.getContext('2d');
    var a = []
    var cnx = cn.width - 1
    var cny = cn.height - 1
    var grid = []
    var animationId
    var showWind = true
    window.wind_status = {
        zoom : 10,
        speed : 0.5,
        opacity : 0.1,
        count : 1000
    }
        
    function buildobj(i) {            
        var maxBounds = map.getBounds()
        var latLng = L.latLng(getRandomArbitrary(maxBounds._southWest.lat, maxBounds._northEast.lat), getRandomArbitrary(maxBounds._southWest.lng, maxBounds._northEast.lng))        
        var point = map.latLngToContainerPoint(latLng)
        a[i] = new wind(point.x, point.y, latLng, i, animationId + getRandomArbitrary(50, 250))      
    }

    function removeObj(index) {
        var latLng = L.latLng(getRandomArbitrary(wind_config.minlat, wind_config.maxlat), getRandomArbitrary(wind_config.minlng, wind_config.maxlng))        
        var point = map.latLngToContainerPoint(latLng)

        a[index].x = point.x
        a[index].y = point.y
        a[index].latitude = latLng.lat
        a[index].longitude = latLng.lng
        a[index].endFrame = animationId + getRandomArbitrary(50, 250)
        return 0;
    }

    function wind(x, y, latlng, index, endFrame) {
        this.index = index
        this.x = x;
        this.y = y;
        this.latitude = latlng.lat;
        this.longitude = latlng.lng;
        this.endFrame = endFrame

        this.windMove = function () {
            if (this.x > window.innerWidth || this.x < 0 || this.y > window.innerHeight || this.y < 0) {
                return removeObj(this.index)
            } else {
                if (animationId > this.endFrame) {
                    removeObj(this.index)
                }
                const ls = {
                    x: this.x,
                    y: this.y
                };
                var nextVec = getVector(this.latitude, this.longitude)
                this.x = ls.x + nextVec[0] * wind_status.speed
                this.y = ls.y + nextVec[1] * wind_status.speed

                var point = L.point(this.x, this.y)
                var latLng = map.containerPointToLatLng(point)
                this.latitude = latLng.lat

                this.longitude = latLng.lng

                c.beginPath();
                c.lineWidth = 3;
                c.strokeStyle = "white"
                c.moveTo(ls.x, ls.y);
                c.lineTo(this.x, this.y);
                c.stroke();
                c.closePath();                
            }
        }
    }

    function getVector(latitude, longitude) {
        if (latitude <= wind_config.minlat || latitude >= wind_config.maxlat) return [0, 0, 0]
        if (longitude <= wind_config.minlng || longitude >= wind_config.maxlng) return [0, 0, 0]

        try{
        var gridn = selectGrid(latitude, longitude);
        var g00 = grid[gridn[0]][gridn[1]]
        var g10 = grid[gridn[0]][gridn[1] + 1]
        var g01 = grid[gridn[0] + 1][gridn[1]]
        var g11 = grid[gridn[0] + 1][gridn[1] + 1]
        } catch {
            // debugger;
        }

        return interpolate(latitude, longitude, g00, g10, g01, g11, gridn)
    }

    function selectGrid(latitude, longitude) {

        var gridlat = Math.floor((wind_config.maxlat - latitude) / wind_config.latGap)
        var gridlng = Math.floor((longitude - wind_config.minlng) / wind_config.lngGap)
        return [gridlat, gridlng]
    }

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

    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    var anim = function () {
        if (showWind) {            
            animationId = requestAnimationFrame(anim)
            c.save()
            c.fillStyle = `rgba(255,255,255,${wind_status.opacity})`
            c.globalCompositeOperation = 'destination-out';
            c.fillRect(0, 0, cn.width, cn.height);
            c.restore()
            a.forEach(function (e, i) {
                e.windMove();
            });
        }
    }

    this.startAnim = function () {
        this.stopAnim()
        build()
        anim()
    }

    this.stopAnim = function () {
        if (showWind) {
            cancelAnimationFrame(animationId)
            c.clearRect(0, 0, cn.width, cn.height);
        }
    }

    this.toggleWindLayer = () => {
        if (showWind) {
            a = []
            this.stopAnim()
            showWind = false
        } else {
            showWind = true;
            this.startAnim()
        }
    }

    this.set_data = function (config, wind_data) {        
        wind_status.zoom = map.getZoom();
        wind_status.speed = 0.5 * (1.2 ** (wind_status.zoom - 10))
        if (wind_status.speed > 0.5){
            wind_status.speed = 0.5
        }
        cn.width = window.innerWidth
        cn.height = window.innerHeight
        cnx = cn.width - 1
        cny = cn.height - 1
        wind_config = config
        grid = wind_data
        build()
    }

    function build() {
        for (var i = 0; i < wind_status.count; i++) {
            buildobj(i)
        }
    }
}

export { WindMap }