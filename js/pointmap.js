var PointMap = function (_canvas){
    var point_config = {}
    var iot_network_list = []
    var national_network_list = []
    var cn = _canvas
    cn.width = window.innerWidth
    cn.height = window.innerHeight
    var overlayImage = null
    var c = cn.getContext('2d');

    this.set_data = function (config, iot, national) {
        console.log('!')
        point_config = config
        iot_network_list = iot
        national_network_list = national
        cn.width = window.innerWidth
        cn.height = window.innerHeight        
        this.drawCanvas()
    }

    this.drawCanvas = function(){
        c.fillRect(12,40,10,10)
        if (overlayImage != null) {
            overlayImage.remove()
        }    
        iot_network_list.forEach(d => {
            c.fillStyle = 'black'
            var point = map.latLngToContainerPoint(d._latlng)
            if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height){
                c.fillRect(point.x, point.y, 10,10)                          
            }
        })
        overlayImage = L.imageOverlay(cn.toDataURL(), map.getBounds(), { opacity: 0.9 }).addTo(map)
    }
}
export {PointMap}