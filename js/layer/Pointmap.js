var PointMap = function (_canvas) {
    var iot_network_list = []           // iot관측망 
    var national_network_list = []      // 국가 관측망 
    var shko_network_list = []          // 유인 관측망 
    var aws_network_list = []           // 무인 관측망 
    var marker_position_list = []       // 현재 화면에 표출된 관측망들의 좌표값을 가진 리스트
    var cn = _canvas    
    var overlayImage = null
    var c = cn.getContext('2d');
    var marker = []                     //사용할 마커 이미지 배열 (샘플 입니다.)
    var pointmap_index

    /*
    포인트 맵을 초기화 합니다.
    각 데이터들을 받습니다.
    포인트 맵의 경우 데이터를 모두 가지고 있으면서, 
    현재 화면에 보이는 범위만 표현을 하게 됩니다.
    */
    this.init = function (iot, national, shko, aws, _pointmap_index) {
        pointmap_index = _pointmap_index
        iot_network_list = iot
        national_network_list = national
        shko_network_list = shko
        aws_network_list = aws
        cn.width = window.innerWidth
        cn.height = window.innerHeight

        var icon1 = new Image()
        icon1.src = 'image/m1_iot.png'
        marker.push(icon1)

        var icon2 = new Image()
        icon2.src = 'image/m1_nat.png'
        marker.push(icon2)

        var icon3 = new Image()
        icon3.src = 'image/m2_iot.png'
        marker.push(icon3)

        var icon4 = new Image()
        icon4.src = 'image/m2_nat.png'
        marker.push(icon4)

    }

    /*
    point map을 업데이트 합니다.
    표출할 인덱스(타입)에 따라 모든 마커를 지우고 해당 마커를 표출합니다.
    0 : iot + national
    1 : iot
    2 : national
    3 : shko
    4 : aws
    */
    this.set_data = function (_pointmap_index) {
        pointmap_index = _pointmap_index
        clear_canvas()
        if (overlayImage != null) {
            overlayImage.remove()
        }
        if (pointmap_index == 0) {      
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
            draw_shko_network()
        } else if (pointmap_index == 4) {
            marker_position_list = []
            draw_aws_network()
        }
        //현재 캔버스를 이미지로 만들고 표출합니다.
        draw_canvas()
    }

    function draw_canvas(){
        overlayImage = L.imageOverlay(cn.toDataURL(), map.getBounds(), { opacity: 0.9 }).addTo(map)
    }

    /*
    캔버스를 모두 지웁니다.
    */
    function clear_canvas() {
        c.clearRect(0, 0, cn.width, cn.height)
    }

    /*
    표출된 overlay가 있다면 지웁니다.
    */
    this.remove_overlay_image = function () {
        if (overlayImage != null) {
            overlayImage.remove()
            overlayImage = null
        }
    }

    /*
    값에 따라 마커의 색을 지정합니다.
    */
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

    /*
    값에 따라 마커의 텍스트를 지정합니다 (IOT, 국가 관측망에서 사용.)
    */
    function select_marker_text(value) {
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

    /*
    Zoom Level에 따라 마커를 표출합니다.
    iot의 경우 Zoom Level에 따라 다른 마커를 그립니다.
    현재 화면 경계 내에 있는 마커들만 표출합니다.
    */
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
                var text = select_marker_text(d.pm10)
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

    /*
    Zoom Level에 따라 마커를 표출합니다.
    국가 관측망의 경우 Zoom Level에 따라 다른 마커를 그립니다.
    현재 화면 경계 내에 있는 마커들만 표출합니다.
    */
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
                var text = select_marker_text(d.pm10)
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

    /*
    유인 관측소 마커를 표출합니다.
    현재 화면 경계 내에 있는 마커들만 표출합니다.
    */
    function draw_shko_network() {
        shko_network_list.forEach(d => {
            c.fillStyle = 'purple'
            var point = map.latLngToContainerPoint(d._latlng)
            if (point.x > 0 && point.x < cn.width && point.y > 0 && point.y < cn.height) {
                c.fillRect(point.x, point.y, 10, 10)
                marker_position_list.push(
                    {
                        "type": "shko",
                        "areaname": d.areaname,
                        "point": [point.x, point.y, point.x + 10, point.y + 10],
                        "areacode" : d.areacode
                    }
                )
            }
        })
    }

    /*
    무인 관측소 마커를 표출합니다.
    현재 화면 경계 내에 있는 마커들만 표출합니다.
    */
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
                        "point": [point.x - 7, point.y - 7, point.x + 7, point.y + 7],
                        "areacode" : d.areacode
                    }
                )
            }
        })
    }

    /*
    point : 화면상의 x,y 좌표
    해당 point가 마커인지 확인합니다.
    해당 point가 마커라면 설명과 마커의 타입을 리턴합니다.
    */
    this.is_marker = function (point) {
        var marker_description = null
        if (overlayImage != null){
            marker_position_list.forEach(d => {
                if (point.x >= d.point[0] && point.x <= d.point[2] && point.y >= d.point[1] && point.y <= d.point[3]) {
                    if (d.serial) {
                        marker_description = [d.serial + "<br>" + d.type, d.type]
                    } else if (d.areaname) {
                        marker_description = [d.areaname + "<br>" + d.type, d.type, d.areacode]
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
        } 
        return marker_description
    }
}
export { PointMap }