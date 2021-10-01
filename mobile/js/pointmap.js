var PointMap = function (_canvas){
    var point_config = {}
    var iot_network_list = []
    var national_network_list = []
    var soko_network_list = []
    var aws_network_list = []
    window.marker_position_list = []
    var cn = _canvas
    cn.width = window.innerWidth
    cn.height = window.innerHeight
    var overlayImage = null
    var c = cn.getContext('2d');

    this.set_data = function (iot, national, soko, aws) {
        iot_network_list = iot
        national_network_list = national
        soko_network_list = soko
        aws_network_list = aws
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
                        "type" : "iot",
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
                        "type" : "national",
                        "deviceType" : d.deviceType,
                        "serial" : d.serial,
                        "point" : [point.x, point.y, point.x + 10, point.y + 10]
                    }
                )                
            }
        })
    }

    function draw_soko_network(){
        soko_network_list.forEach(d => {            
            c.fillStyle = 'purple'
            var point = map.latLngToContainerPoint(d._latlng)            
            if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height){
                c.fillRect(point.x, point.y, 10,10)          
                marker_position_list.push(
                    {
                        "type" : "soko",
                        "areaname" : d.areaname,
                        "point" : [point.x, point.y, point.x + 10, point.y + 10]
                    }
                )                
            }
        }) 
    }

    function draw_aws_network(){
        aws_network_list.forEach(d => {            
            c.fillStyle = 'black'
            var point = map.latLngToContainerPoint(d._latlng)            
            if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height){
                c.beginPath();
                c.arc(point.x, point.y, 7,0, Math.PI * 2, true)        
                c.fill()  
                c.closePath();  
                marker_position_list.push(
                    {
                        "type" : "aws",
                        "areaname" : d.areaname,
                        "point" : [point.x - 7, point.y - 7, point.x + 7, point.y + 7]
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
        if (pointmap_index == 0){       //
            marker_position_list = []
            draw_iot_network()
            draw_national_network()
        } else if(pointmap_index == 1) {
            marker_position_list = []
            draw_iot_network()
        } else if (pointmap_index == 2){
            marker_position_list = []
            draw_national_network()
        } else if (pointmap_index == 3){
            marker_position_list = []
            draw_soko_network()            
        } else if (pointmap_index == 4){
            marker_position_list = []
            draw_aws_network()
        }
        overlayImage = L.imageOverlay(cn.toDataURL(), map.getBounds(), { opacity: 0.9 }).addTo(map)
    }

    this.is_marker = function(point){
        var marker_serial = null
        marker_position_list.forEach(d => {
            if (point.x >= d.point[0] && point.x <= d.point[2] && point.y >= d.point[1] && point.y <= d.point[3]){
                if (d.serial) {
                    marker_serial = d.serial + "<br>" + d.type
                } else if (d.areaname){
                    marker_serial = d.areaname + "<br>" + d.type
                    if (d.type == 'aws'){
                        c.beginPath();
                        c.fillStyle = 'white'
                        c.arc(d.point[0] + 7, d.point[1] + 7, 7,0, Math.PI * 2, true)        
                        c.fill()  
                        c.closePath();
                    }
                }                
            }
        })
        return marker_serial
    }
    
}
export {PointMap}