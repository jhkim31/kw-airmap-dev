import * as core from './core.js'

function global_event() {

    window.addEventListener('mousemove', (e) => {
        if (current_state.knob_drag) {
            var current_time = $('#current_time')
            if (e.x < 612 && e.x > 130) {
                $('#knob').css({
                    "transition": "none"
                })
                $('#knob')[0].style.left = (e.x - 130) + "px"
                current_time.css({
                    "left": (parseFloat($('#knob').css('left')) - 60) + "px",
                    "visibility": "visible"
                })
                var tmp = Math.floor((parseFloat($('#knob').css('left')) / 480) / 0.0416667)
                if (current_state.time_index != tmp) {
                    current_state.time_index = tmp
                    core.set_current_state(tmp * 3600000)
                }
                current_time.text(current_state.map.current_time_str)
            }
        }
    })

    /*
    마우스를땔때 실행되는 이벤트,
    knob을 드래고 하고 있던 중이였을때만 활성화됨.
    */
    window.addEventListener('mouseup', (e) => {
        if (current_state.knob_drag && !current_state.is_playing) {
            current_state.knob_drag = false
            $('#knob').css({
                "transition": "left .1s ease"
            })
            current_state.time_index = Math.floor((parseFloat(document.getElementById('knob').style.left) / 480) / 0.0416667)
            core.set_overlay_map()
            
            if (on_map_info != undefined) {
                core.update_on_map_info()
            }
        }
    })

    /*
    맵 이동시마다 실행되는 이벤트
    */
    map.on('moveend', async function(){
        data.model_data.wind_data = []
        data.model_data.heat_data = []
        core.set_overlay_map()
        
    })

    /*
    지도 클릭 이벤트
    */
    map.on('click', async (e) => {
        if (current_state.is_mobile) {
            $('#control_box').hide()
            $('#mobile_overlay').hide()
        }

        if (on_map_info != undefined) {
            map.removeLayer(on_map_info)
        }

        var value = core.get_value(e.containerPoint.x, e.containerPoint.y)
        console.log(value)
        var is_marker = pointmap.is_marker(e.containerPoint)

        if (is_marker == null) {
            on_map_info = on_map_info = L.marker([e.latlng.lat, e.latlng.lng], {
                icon: L.divIcon({
                    html: `
                    <div style = "position:absolute;background:white; border-radius:5px; width:100px; height:30px; top:-72px; left:2px; font-size:17px;">
                    <div style = "background:white; position:absolute; width:5px; height:55px; top:28px;">
                    </div>
                    <svg class = "float-end" id = "on_map_info_close" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>      
                    ${value}                                       
                    </div>`,
                    className: 'display-none'
                })
            })
                .addTo(map)
                .on('click', (e) => {
                    if (e.originalEvent.path[0].id == "on_map_info_close" || e.originalEvent.path[1].id == "on_map_info_close") {
                        map.removeLayer(on_map_info)
                        on_map_info = null
                    }
                })

            core.show_detail_data(e.latlng.lat, e.latlng.lng)
        } else {
            on_map_info = on_map_info = L.marker([e.latlng.lat, e.latlng.lng], {
                icon: L.divIcon({
                    html: `
                    <div style = "position:absolute;background:white; border-radius:5px; width:100px; height:30px; top:-72px; left:2px; font-size:10px;">
                    <div style = "background:white; position:absolute; width:5px; height:55px; top:28px;">
                    </div>
                    <svg class = "float-end" id = "on_map_info_close" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>      
                    ${is_marker[0]} : 마커입니다                                       
                    </div>`,
                    className: 'display-none'
                })
            })
                .addTo(map)
                .on('click', (e) => {
                    if (e.originalEvent.path[0].id == "on_map_info_close" || e.originalEvent.path[1].id == "on_map_info_close") {
                        map.removeLayer(on_map_info)
                        on_map_info = null
                    }
                })
            core.show_detail_data(e.latlng.lat, e.latlng.lng, is_marker[1], is_marker[2])
        }
    })
}


function button_event(){
    var pm10_btn = $('#show_pm10')[0]
    var pm25_btn = $('#show_pm25')[0]
    var temperature_btn = $('#show_t')[0]
    var humidity_btn = $('#show_h')[0]
    var iot_national_btn = $('#iot_national_network')[0]
    var iot_btn = $('#iot_network')[0]
    var national_btn = $('#national_network')[0]
    var shko_btn = $('#shko_network')[0]
    var aws_btn = $('#aws_network')[0]

    function turnoff_all_heatmap_button(){
        pm10_btn.checked = false
        pm25_btn.checked = false
        humidity_btn.checked = false
        temperature_btn.checked = false
    }

    function turnoff_all_pointmap_button(){
        iot_national_btn.checked = false
        iot_btn.checked = false
        national_btn.checked = false
        shko_btn.checked = false
        aws_btn.checked = false
    }

    pm10_btn.addEventListener('click', () => {            
        if (pm10_btn.checked == true) {
            turnoff_all_heatmap_button()
            pm10_btn.checked = true
            current_state.heatmap_index = 0
            core.update_detail_box_button()
            heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
            heatmap.show_heatmap()
            document.getElementById("heat_bar").src = "image/heat_bar_pm10.png";
            if (on_map_info != undefined) {
                core.update_on_map_info()
            }
            if (current_state.show_detail_table) {
                core.make_detail_table_model(current_state.heatmap_index)
            }
        } else {
            heatmap.hide_heatmap()
            current_state.heatmap_index = 2
        }
    })
    
    pm25_btn.addEventListener('click', () => {
        if (pm25_btn.checked == true) {
            turnoff_all_heatmap_button()
            pm25_btn.checked = true
            current_state.heatmap_index = 1
            core.update_detail_box_button()
            heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
            heatmap.show_heatmap()
            document.getElementById("heat_bar").src = "image/heat_bar_pm10.png";
            if (on_map_info != undefined) {
                core.update_on_map_info()
            }
            if (current_state.show_detail_table) {
                core.make_detail_table_model(current_state.heatmap_index)
            }
        } else {
            heatmap.hide_heatmap()
            current_state.heatmap_index = 2
        }
    })
    
    temperature_btn.addEventListener('click', () => {
        if (temperature_btn.checked == true) {
            turnoff_all_heatmap_button()
            temperature_btn.checked = true
            current_state.heatmap_index = 2
            core.update_detail_box_button()
            heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
            heatmap.show_heatmap()
            document.getElementById("heat_bar").src = "image/heat_bar_t.png";
            if (on_map_info != undefined) {
                core.update_on_map_info()
            }
            if (current_state.show_detail_table) {
                core.make_detail_table_model(current_state.heatmap_index)
            }
        } else {
            heatmap.hide_heatmap()
            current_state.heatmap_index = 2
        }
    })

    humidity_btn.addEventListener('click', () => {
        if (humidity_btn.checked == true) {
            turnoff_all_heatmap_button()
            humidity_btn.checked = true
            current_state.heatmap_index = 3
            core.update_detail_box_button()
            heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
            heatmap.show_heatmap()
            document.getElementById("heat_bar").src = "image/heat_bar_h.png";
            if (on_map_info != undefined) {
                core.update_on_map_info()
            }
            if (current_state.show_detail_table) {
                core.make_detail_table_model(current_state.heatmap_index)
            }
        } else {
            heatmap.hide_heatmap()
            current_state.heatmap_index = 2
        }
    })

    iot_national_btn.addEventListener('click', () => {
        if (iot_national_btn.checked) {                     
            var comment = `Iot측정소 : ${data.num_observ_network.iot_network}개    국가측정소 : ${data.num_observ_network.national_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 0
            pointmap.set_data(current_state.pointmap_index)
            turnoff_all_pointmap_button()
            iot_national_btn.checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })
    
    iot_btn.addEventListener('click', () => {
        if (iot_btn.checked) {
            var comment = `Iot측정소 : ${data.num_observ_network.iot_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 1
            pointmap.set_data(current_state.pointmap_index)
            turnoff_all_pointmap_button()
            iot_btn.checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })
    
    national_btn.addEventListener('click', () => {
        pointmap.remove_overlay_image()
        if (national_btn.checked) {
            var comment = `국가측정소 : ${data.num_observ_network.national_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 2
            pointmap.set_data(current_state.pointmap_index)
            turnoff_all_pointmap_button()
            national_btn.checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })
    
    shko_btn.addEventListener('click', () => {
        pointmap.remove_overlay_image()
        if (shko_btn.checked) {
            var comment = `유인관측망 : ${data.num_observ_network.shko_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 3
            pointmap.set_data(current_state.pointmap_index)
            turnoff_all_pointmap_button()
            shko_btn.checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })

    aws_btn.addEventListener('click', () => {
        pointmap.remove_overlay_image()
        if (aws_btn.checked) {
            var comment = `무인관측소 : ${data.num_observ_network.aws_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 4
            pointmap.set_data(current_state.pointmap_index)
            turnoff_all_pointmap_button()
            aws_btn.checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })
    
    
    $('#play_wind').on('click', () => {
        if ($('#play_wind')[0].checked == true) {
            windmap.show_windmap()
        } else {
            windmap.hide_windmap()
        }
        
    })

    $('#knob').on('mousedown', (e) => {
        if (!current_state.is_playing) {
            current_state.knob_drag = true
        }
    })
    
    $('#play').on('click', () => {
        var play_btn = $('#play')[0]
        var knob = $('#knob')
        var current_time = $('#current_time')
        if (play_btn.children[0].id == "play_btn") {
            /*
            재생 버튼을 활성화 시키면, 재생 버튼의 모양을 일시 정지 모양으로 바꾸고,
            정해진 속도로 슬라이드바 진행.
            */
            play_btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" class="bi bi-pause-fill" viewBox="0 0 16 16">
                <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
            </svg>
            `
            current_state.Interval = setInterval(() => {
                if (parseInt(knob.css('left')) >= 480) {       
                    //슬라이드바 맨끝에 있을때                     
                    if (current_state.is_playing) {
                        /*
                        슬라이드바가 진행하다가 끝까지 도착시                    
                        진행되던 interval을 멈춘다.
                        */
                        var tmp = 24
                        if (current_state.time_index != tmp) {
                            current_state.time_index = tmp
                            core.set_overlay_map()
                            
                            current_time.text(current_state.map.current_time_str)
                        }
                        clearInterval(current_state.Interval)
                        current_state.is_playing = false
                        current_time.css({
                            "transition": "none"
                        })
                        play_btn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="30" height="30" fill="white" class="bi bi-play-fill" viewBox="0 0 16 16">
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                        </svg>   
                        `
                    } else {
                        /*
                        슬라이드바가 현재 시간에 정지된 상태로 있을때,
                        재생 버튼을 눌러 24시간 전부터 재생하도록 해주는 함수.
                        */
                        knob.css({
                            "left": "0px"
                        })
                        core.set_overlay_map()
                        
                        if (on_map_info != undefined) {
                            core.update_on_map_info()
                        }
                    }
                } else {
                    /*
                    슬라이드바가 맨끝이 아닐때

                    슬라이드 바를 0.1초마다 일정 범위만큼 이동시킴.                    
                    */

                    
                    current_state.is_playing = true
                    knob.css({
                        "left": (parseFloat(knob.css('left')) + 1) + "px"
                    })
                    current_time.css({
                        "left": (parseFloat(knob.css('left')) - 60) + "px",
                        "visibility": "visible",
                        "transition": "left .1s ease"
                    })
                    var tmp = Math.round((parseFloat(knob.css('left')) / 480) / 0.0416667)
                    //슬라이드바를 24개로 나누어 일정 범위를 넘어서면 다음 시점으로 모델 데이터를 업데이트 해준다.
                    if (current_state.time_index != tmp) {
                        current_state.time_index = tmp
                        core.set_overlay_map()
                        
                        current_time.text(current_state.map.current_time_str)
                    }
                    if (on_map_info != undefined) {
                        core.update_on_map_info()
                    }
                }
            }, 100)
        } else {
            //재생중일때는 인터벌을 멈추고, 세팅들을 초기화 한다.
            play_btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" id = "play_btn" width="30" height="30" fill="white" class="bi bi-play-fill" viewBox="0 0 16 16">
            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
          </svg>      
            `
            current_time.css({
                "transition": "none"
            })
            clearInterval(current_state.Interval)
            current_state.is_playing = false
        }
    })
    
    /*
    skip_start 버튼 이벤트 처리
    */
    $('#skip_start_btn').on('click', () => {
        if (current_state.is_playing) {
            return;
        }
        var knob = $('#knob')
        var current_time = $('#current_time')
        var tmp = Math.floor((parseFloat(knob.css('left')) / 480) / 0.0416667)
        if (tmp >= 0) {
            knob.css({
                'left': (20 * tmp) + 'px'
            })
            current_time.css({
                "left": ((20 * tmp) - 60) + "px",
                "visibility": "visible"
            })
            current_state.time_index = tmp
            core.set_current_state(tmp * 3600000)
            current_time.text(current_state.map.current_time_str)
            core.set_overlay_map()
            
            if (on_map_info != undefined) {
                core.update_on_map_info()
            }
        }
    })
    
    /*
    skip_end 버튼 이벤트 처리
    */
    $('#skip_end_btn').on('click', () => {
        if (current_state.is_playing) {
            return;
        }
        var knob = $('#knob')
        var current_time = $('#current_time')
        var tmp = Math.round((parseFloat(knob.css('left')) / 480) / 0.0416667)
        if (tmp < 24) {
            tmp += 1
            knob.css({
                'left': (20 * tmp) + 'px'
            })
            current_time.css({
                "left": ((20 * tmp) - 60) + "px",
                "visibility": "visible"
            })
            current_state.time_index = tmp
            core.set_current_state(tmp * 3600000)
            current_time.text(current_state.map.current_time_str)
            core.set_overlay_map()
            
            if (on_map_info != undefined) {
                core.update_on_map_info()
            }
        }
    })
    
    
    /*
    하단 상세 보기 페이지를 닫는 함수
    */
    $('#close_detail_box').on('click', () => {
        $('#detail_box').css({
            "visibility": "hidden",
            "height": "0px"
        })
        
        $('#detail_table1').html('')
        $('#detail_table2').html('')
        current_state.show_detail_table = false
        if(current_state.is_mobile){
            $('#mobile_overlay').show()
        }    
    })
    
    /*
    하단 상세보기 미세먼지 버튼 이벤트
    */
    $('#dust_button').on('click', () => {    
        core.make_detail_table_model(1)
    })
    
    /*
    하단 상세보기 날씨 버튼 이벤트
    */
    $('#weather_button').on('click', () => {
        core.make_detail_table_model(2)
    })
    
    /*
    현재 위치로 이동 이벤트
    */
    $('#move_to_current_location_btn').on('click', () => {
        if (navigator.geolocation) {
            //위치 정보를 얻기
            navigator.geolocation.getCurrentPosition(function (pos) {
                map.flyTo(L.latLng(pos.coords.latitude, pos.coords.longitude), 14);
            });
        } else {
            alert("이 브라우저에서는 현재위치찾기가 지원되지 않습니다.")
        }
    })


    /*
    search_field가 바뀔때 질의를 날리는 이벤트
    */
    $('#search_field').on('propertychange change keyup paste input', function(e){
        var value = e.currentTarget.value
        value = value.split(' ')[value.split(' ').length - 1]
        var url = 'https://kwapi.kweather.co.kr/v1/gis/geo/findaddr?name=' + value
        fetch(url, {
            "method": "GET",
            "headers": {
                "auth": "kweather-test"
            }
        })
            .then(e => e.json())
            .then(d => {
                if (d != null) {
                    $('#cities').html('')
                    d.data.slice(0, 20).forEach(i => {
                        var el = `<option data-value='${i.hang_cd}' value='${i.sido_nm} ${i.sg_nm} ${i.emd_nm}'></option>`
                        $('#cities').append(el)
                    })
    
    
                }
            })
    })
    
    
    /*
    좌상단 검색필드 검색버튼누를 때 이벤트
    */
    $('#search_btn').on('click', () => {
        core.update_detail_box_button()
        core.make_detail_table_model(current_state.heatmap_index)
        var value = $('#search_field').val();
        $('#detail_box').css({
            "visibility": "visible",
            "height": "auto"
        })
        
        var hand_cd = $('#cities [value="' + value + '"]').data('value')
        fetch(`https://kwapi.kweather.co.kr/v1/gis/geo/hangaddr?hangCd=${hand_cd}`, {
            "method": "GET",
            "headers": {
                "auth": "kweather-test"
            }
        })
            .then(e => e.json())
            .then(d => {
                var hang_nm = d.data.sido_nm + " " + d.data.sg_nm + "</br>" + d.data.emd_nm
                $('#current_location').html(hang_nm)
                var lat = d.data.lat
                var lng = d.data.lon
                map.flyTo(L.latLng(lat, lng), 13)
            })
    })    

    /*
    추가 모바일 버전에서 필요한 이벤트
    */
    if (current_state.is_mobile){
        $('#search_box_close').on('click', () =>{    
            $('#mobile_overlay').show()
            $("#search_box").hide()
        })
        
        $("#mobile_search").on('click', () => {
            $('#mobile_overlay').hide()
            $("#search_box").show()
        })
        
        $('#mobile_menu').on('click', () => {
            $('#mobile_overlay').hide()
            $('#control_box').show()
        })
        
        $('#control_box_close_btn').on('click', () => {
            $('#mobile_overlay').show()
            $('#control_box').hide()
        })
    }
}

export { button_event, global_event }

