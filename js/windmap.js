var WindMap = function () {
    //initialize
    var wind_config = {}

    var cn = document.getElementById('windmap')
    cn.width = window.innerWidth
    cn.height = window.innerHeight
    var c = cn.getContext('2d');
    var a = []
    var cnx = cn.width - 1
    var cny = cn.height - 1
    var grid = []
    var animationId
    var showWind = false
    var windCount = 500;
    var showSpeed = 1;

    //initialize

    function buildobj(i) {
        var x = getRandomArbitrary(0, cnx)
        var y = getRandomArbitrary(0, cny)
        var point = L.point(x, y)
        a[i] = new wind(x, y, map.containerPointToLatLng(point).lat, map.containerPointToLatLng(point).lng, i, animationId + getRandomArbitrary(60, 250))
    }

    function removeObj(index) {
        buildobj(index)
        return 0;
    }

    function wind(x, y, latitude, longitude, index, endFrame) {
        this.index = index
        this.x = x;
        this.y = y;
        this.latitude = latitude;
        this.longitude = longitude;
        this.endFrame = endFrame

        this.windMove = function () {
            if (this.x > cnx || this.y > cny || this.x < 0 || this.y < 0) {
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
                this.x = ls.x + nextVec[0] * showSpeed
                this.y = ls.y + nextVec[1] * showSpeed

                var point = L.point(this.x, this.y)

                this.latitude = map.containerPointToLatLng(point).lat

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
        if (latitude <= wind_config.minlat || latitude >= wind_config.maxlat) return [0, 0, 0]
        if (longitude <= wind_config.minlng || longitude >= wind_config.maxlng) return [0, 0, 0]

        var gridn = selectGrid(latitude, longitude);
        var g00 = grid[gridn[0]][gridn[1]]
        var g10 = grid[gridn[0]][gridn[1] + 1]
        var g01 = grid[gridn[0] + 1][gridn[1]]
        var g11 = grid[gridn[0] + 1][gridn[1] + 1]

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
            console.log("error", error)
            debugger;
            console.log(error)
        }
        // var y = (latitude % wind_config.latGap) * (1 / wind_config.latGap)
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
            c.fillStyle = "rgba(255, 255, 255,0.3 )"
            c.fillRect(0, 0, cn.width, cn.height);
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
        cn.width = window.innerWidth
        cn.height = window.innerHeight
        cnx = cn.width - 1
        cny = cn.height - 1
        wind_config = config
        grid = wind_data
        build()
    }

    function build() {
        for (var i = 0; i < windCount; i++) {
            buildobj(i)
        }
    }

    map.on('click', (e) => {
        console.log(getVector(e.latlng.lat, e.latlng.lng)[0].toFixed(1),getVector(e.latlng.lat, e.latlng.lng)[1].toFixed(1) )
    })

    // map.on('mousemove', e => {
    //     document.getElementById('mouseOverlay').style.left = (e.containerPoint.x + 10)+"px"
    //     document.getElementById('mouseOverlay').style.top = (e.containerPoint.y + 10)+"px"
    //     document.getElementById('mouseOverlay').innerText = 
    //     getVector(e.latlng.lat, e.latlng.lng)[0].toFixed(1) + "," +  getVector(e.latlng.lat, e.latlng.lng)[1].toFixed(1) 
    // })
}

export { WindMap }