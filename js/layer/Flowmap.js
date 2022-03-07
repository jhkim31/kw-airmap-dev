var WindMap = function (_canvas) {
    var wind_config = {}           
    window.cn = _canvas 
    var c = cn.getContext('2d');
    var winds = []                 
    var wind_data = []                  
    var animationId                
    var showWind = true            
    var wind_status = {            
        zoom : 10,                 
        speed : 0.5,               
        opacity : 0.1,             
        count : 1000               
    }
   
    this.init = function (config, _wind_data) {        
        this.set_data(config, _wind_data)
        make_winds()
    } 

    this.set_data = function(config, _wind_data){
        stop_anim()
        wind_status.zoom = map.getZoom();
        wind_status.speed = 0.5 * (1.2 ** (wind_status.zoom - 10))
        if (wind_status.speed > 0.5){
            wind_status.speed = 0.5
        } 
        cn.width = window.innerWidth
        cn.height = window.innerHeight
        wind_config = config
        wind_data = _wind_data
        start_anim()
    }

    function make_winds() {
        for (var i = 0; i < wind_status.count; i++) {
            make_wind_object(i)
        }
    }

    function make_wind_object(index) {            
        var maxBounds = map.getBounds()
        var latLng = L.latLng(get_random_value(maxBounds._southWest.lat, maxBounds._northEast.lat), get_random_value(maxBounds._southWest.lng, maxBounds._northEast.lng))        
        var point = map.latLngToContainerPoint(latLng)
        winds[index] = new wind(point.x, point.y, latLng, index, animationId + get_random_value(50, 250))      
    }

    function wind(x, y, latlng, index, endFrame) {
        this.index = index
        this.x = x;
        this.y = y;
        this.latitude = latlng.lat;
        this.longitude = latlng.lng;
        this.endFrame = endFrame

        this.wind_move = function () {
            if (this.x > window.innerWidth || this.x < 0 || this.y > window.innerHeight || this.y < 0) {        
                return make_wind_object(this.index)
            } else {
                if (animationId > this.endFrame) {               
                    make_wind_object(this.index)
                }
                var last_position = {                            
                    x: this.x,
                    y: this.y
                }
                var nextVec = get_vector(this.latitude, this.longitude) 
                this.x = last_position.x + nextVec[0] * wind_status.speed       
                this.y = last_position.y + nextVec[1] * wind_status.speed

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

    function get_vector(latitude, longitude) {
        
        if (latitude <= wind_config.minlat || latitude >= wind_config.maxlat) return [0, 0, 0]
        if (longitude <= wind_config.minlng || longitude >= wind_config.maxlng) return [0, 0, 0]

        try{
            
            var gridn = select_grid(latitude, longitude);
            var g00 = wind_data[gridn[0]][gridn[1]]
            var g10 = wind_data[gridn[0]][gridn[1] + 1]
            var g01 = wind_data[gridn[0] + 1][gridn[1]]
            var g11 = wind_data[gridn[0] + 1][gridn[1] + 1]
        } catch (error){
            
        }

        return interpolate(latitude, longitude, g00, g10, g01, g11, gridn)
    }

    function select_grid(latitude, longitude) {

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

    function get_random_value(min, max) {
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
            winds.forEach(function (e, i) {
                try{
                    e.wind_move();
                } catch(error) {
                    
                }
            });
        }
    }

    var start_anim = function () {
        make_winds()
        anim()
    }

    var stop_anim = function () {
        if (showWind) {
            cancelAnimationFrame(animationId)
            c.clearRect(0, 0, cn.width, cn.height);
            winds = []
        }
    }

    this.show_windmap = () => {
        stop_anim()
        showWind = true;
        start_anim()
    }

    this.hide_windmap = () => {
        winds = []
        stop_anim()
        showWind = false
    }
}

export { WindMap }