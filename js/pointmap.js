var PointMap = function (_canvas) {
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
    var marker = []

    this.init = function (iot, national, soko, aws) {
        iot_network_list = iot
        national_network_list = national
        soko_network_list = soko
        aws_network_list = aws
        cn.width = window.innerWidth
        cn.height = window.innerHeight

        var icon1 = new Image()
        icon1.src = '../image/m1_iot.png'
        marker.push(icon1)

        var icon2 = new Image()
        icon2.src = '../image/m1_nat.png'
        marker.push(icon2)

        var icon3 = new Image()
        icon3.src = '../image/m2_iot.png'
        marker.push(icon3)

        var icon4 = new Image()
        icon4.src = '../image/m2_nat.png'
        marker.push(icon4)

    }

    function clear_canvas() {
        c.clearRect(0, 0, cn.width, cn.height)
    }

    this.remove_overlay_image = function () {
        if (overlayImage != null) {
            overlayImage.remove()
        }
    }

    function select_fill_color(value) {
        if (value == undefined) {
            return 'gray'
        } else if (value < 15) {
            return 'cyan'
        } else if (value < 25) {
            return 'lightgreen'
        } else if (value < 50) {
            return 'orange'
        } else {
            return 'red'
        }
    }

    function select_marker(value) {
        if (value == undefined) {
            return 'Null'
        } else if (value < 15) {
            return '좋음'
        } else if (value < 25) {
            return '보통'
        } else if (value < 50) {
            return '나쁨'
        } else {
            return '매우나쁨'
        }
    }

    function draw_iot_network() {
        var zoom = map.getZoom()
        if (zoom < 13) {
            iot_network_list.forEach(d => {
                c.fillStyle = select_fill_color(parseInt(d.pm10))
                var point = map.latLngToContainerPoint(d._latlng)
                if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                    c.fillRect(point.x, point.y, 10, 10)
                    marker_position_list.push(
                        {
                            "type": "iot",
                            "deviceType": d.deviceType,
                            "serial": d.serial,
                            "point": [point.x, point.y, point.x + 10, point.y + 10]
                        }
                    )
                }
            })
        } else if (zoom < 16) {
            iot_network_list.forEach(d => {
                var point = map.latLngToContainerPoint(d._latlng)
                if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                    c.drawImage(marker[0], point.x, point.y, 20, 20);
                    marker_position_list.push(
                        {
                            "type": "iot",
                            "deviceType": d.deviceType,
                            "serial": d.serial,
                            "point": [point.x, point.y, point.x + 20, point.y + 20]
                        }
                    )
                }
            })
        } else {
            iot_network_list.forEach(d => {
                var point = map.latLngToContainerPoint(d._latlng)
                var text = select_marker(d.pm10)
                if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                    c.fillStyle = "white";
                    c.fillRect(point.x, point.y, 80, 40)                    
                    c.drawImage(marker[2], point.x + 45, point.y + 2, 35, 35);
                    c.font = '11px malgun gothic';
                    c.fillStyle = "black"
                    c.fillText(text, point.x + 5, point.y + 15);
                    c.fillText(`${d.pm10}㎍/㎥`, point.x + 5, point.y + 30);
                    marker_position_list.push(
                        {
                            "type": "iot",
                            "deviceType": d.deviceType,
                            "serial": d.serial,
                            "point": [point.x, point.y, point.x + 80, point.y + 40]
                        }
                    )
                }
            })
        }
    }

    function draw_national_network() {
        var zoom = map.getZoom()
        if (zoom < 13) {
            national_network_list.forEach(d => {
                c.fillStyle = select_fill_color(parseInt(d.pm10))
                var point = map.latLngToContainerPoint(d._latlng)
                if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                    c.fillRect(point.x, point.y, 10, 10)
                    marker_position_list.push(
                        {
                            "type": "national",
                            "deviceType": d.deviceType,
                            "serial": d.serial,
                            "point": [point.x, point.y, point.x + 10, point.y + 10]
                        }
                    )
                }
            })
        } else if (zoom < 16) {
            national_network_list.forEach(d => {
                var point = map.latLngToContainerPoint(d._latlng)
                if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                    c.drawImage(marker[1], point.x, point.y, 20, 20);
                    marker_position_list.push(
                        {
                            "type": "iot",
                            "deviceType": d.deviceType,
                            "serial": d.serial,
                            "point": [point.x, point.y, point.x + 20, point.y + 20]
                        }
                    )
                }
            })
        } else {
            national_network_list.forEach(d => {
                var point = map.latLngToContainerPoint(d._latlng)
                var text = select_marker(d.pm10)
                if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                    c.fillStyle = "white";
                    c.fillRect(point.x, point.y, 80, 40)                    
                    c.drawImage(marker[3], point.x + 45, point.y + 2, 35, 35);
                    c.font = '11px malgun gothic';
                    c.fillStyle = "black"
                    c.fillText(text, point.x + 5, point.y + 15);
                    c.fillText(`${d.pm10}㎍/㎥`, point.x + 5, point.y + 30);
                    marker_position_list.push(
                        {
                            "type": "iot",
                            "deviceType": d.deviceType,
                            "serial": d.serial,
                            "point": [point.x, point.y, point.x + 80, point.y + 40]
                        }
                    )
                }
            })
        }
    }


    function draw_soko_network() {
        soko_network_list.forEach(d => {
            c.fillStyle = 'purple'
            var point = map.latLngToContainerPoint(d._latlng)
            if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                c.fillRect(point.x, point.y, 10, 10)
                marker_position_list.push(
                    {
                        "type": "soko",
                        "areaname": d.areaname,
                        "point": [point.x, point.y, point.x + 10, point.y + 10]
                    }
                )
            }
        })
    }

    function draw_aws_network() {
        aws_network_list.forEach(d => {
            c.fillStyle = 'black'
            var point = map.latLngToContainerPoint(d._latlng)
            if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                c.beginPath();
                c.arc(point.x, point.y, 7, 0, Math.PI * 2, true)
                c.fill()
                c.closePath();
                marker_position_list.push(
                    {
                        "type": "aws",
                        "areaname": d.areaname,
                        "point": [point.x - 7, point.y - 7, point.x + 7, point.y + 7]
                    }
                )
            }
        })
    }

    this.update_point_map = function (pointmap_index) {
        clear_canvas()
        if (overlayImage != null) {
            overlayImage.remove()
        }
        if (pointmap_index == 0) {       //
            marker_position_list = []
            draw_iot_network()
            draw_national_network()
        } else if (pointmap_index == 1) {
            marker_position_list = []
            draw_iot_network()
        } else if (pointmap_index == 2) {
            marker_position_list = []
            draw_national_network()
        } else if (pointmap_index == 3) {
            marker_position_list = []
            draw_soko_network()
        } else if (pointmap_index == 4) {
            marker_position_list = []
            draw_aws_network()
        }
        overlayImage = L.imageOverlay(cn.toDataURL('', 1.0), map.getBounds(), { opacity: 0.9 }).addTo(map)
    }

    this.is_marker = function (point) {
        var marker_serial = null
        marker_position_list.forEach(d => {
            if (point.x >= d.point[0] && point.x <= d.point[2] && point.y >= d.point[1] && point.y <= d.point[3]) {
                if (d.serial) {
                    marker_serial = d.serial + "<br>" + d.type
                } else if (d.areaname) {
                    marker_serial = d.areaname + "<br>" + d.type
                    if (d.type == 'aws') {
                        c.beginPath();
                        c.fillStyle = 'white'
                        c.arc(d.point[0] + 7, d.point[1] + 7, 7, 0, Math.PI * 2, true)
                        c.fill()
                        c.closePath();
                    }
                }
            }
        })
        return marker_serial
    }

}
export { PointMap }