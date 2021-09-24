var PointMap = function (_canvas){
    var point_config = {}
    var iot_network_list = []
    var national_network_list = []
    window.marker_position_list = []
    var cn = _canvas
    cn.width = window.innerWidth
    cn.height = window.innerHeight
    var overlayImage = null
    var c = cn.getContext('2d');

    this.set_data = function (config, iot, national) {
        point_config = config
        iot_network_list = iot
        national_network_list = national
        cn.width = window.innerWidth
        cn.height = window.innerHeight        
    }

    function clear_canvas(){
        c.clearRect(0,0,cn.width, cn.height)
    }

    this.remove_overlay_image = function(){
        if (overlayImage != null) {
            overlayImage.remove()
        }
    }
    function draw_iot_network(){
        iot_network_list.forEach(d => {            
            c.fillStyle = 'blue'
            var point = map.latLngToContainerPoint(d._latlng)            
            if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height){
                c.fillRect(point.x, point.y, 10,10)          
                marker_position_list.push(
                    {
                        "deviceType" : d.deviceType,
                        "serial" : d.serial,
                        "point" : [point.x, point.y, point.x + 10, point.y + 10]
                    }
                )                
            }
        }) 
    }
    
    function draw_national_network(){
        national_network_list.forEach(d => {
            c.fillStyle = 'green'
            var point = map.latLngToContainerPoint(d._latlng)            
            if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height){
                c.fillRect(point.x, point.y, 10, 10)          
                marker_position_list.push(
                    {
                        "deviceType" : d.deviceType,
                        "serial" : d.serial,
                        "point" : [point.x, point.y, point.x + 10, point.y + 10]
                    }
                )                
            }
        })
    }
    
    this.update_point_map = function(pointmap_index){
        clear_canvas()        
        if (overlayImage != null) {
            overlayImage.remove()
        } 
        if (pointmap_index == 0){
            marker_position_list = []
            draw_iot_network()
            draw_national_network()
        } else if(pointmap_index == 1) {
            marker_position_list = []
            draw_iot_network()
        } else if (pointmap_index == 2){
            marker_position_list = []
            draw_national_network()
        } else {
            // draw_national_network()
        }        
        overlayImage = L.imageOverlay(cn.toDataURL(), map.getBounds(), { opacity: 0.9 }).addTo(map)
    }

    this.is_marker = function(point){
        var marker_serial = null
        marker_position_list.forEach(d => {
            if (point.x >= d.point[0] && point.x <= d.point[2] && point.y >= d.point[1] && point.y <= d.point[3]){
                marker_serial = d.serial
            }
        })
        return marker_serial
    }
    
}
export {PointMap}