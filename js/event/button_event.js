import * as lib from '../lib/lib.js'
import * as fill_table from '../lib/fill_table.js'

function button_event(){
    var heatmap_layer = [$('#show_pm10')[0], $('#show_pm25')[0], $('#show_t')[0], $('#show_h')[0]]
    var point_layer = [$('#iot_national_network'), $('#iot_network'), $('#national_network'), $('#manned_network'), $('#aws_network')]
    
    
    /*
    heatmap_layer event
    */


    /*
    동별 미세먼지 pm10 버튼 이벤트 처리
    */
    heatmap_layer[0].addEventListener('click', () => {            
        if (heatmap_layer[0].checked == true) {
            //버튼 설정
            heatmap_layer.forEach(d => {
                d.checked = false
            })
            heatmap_layer[0].checked = true

            /*
            heatmap_index를 0(pm10)으로 설정 후 데이터들을 세팅(적용)한다.
            만약 on_map_info 마커가 표출된 상태라면 해당 값을 알맞게 세팅해줌.
            만약 하단 상세보기가 표출된 상태라면 값을 알맞게 세팅해준다
            */
            current_state.heatmap_index = 0
            lib.update_detail_box_button()
            heatmap.set_showheat(true)
            heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
            document.getElementById("heat_bar").src = "image/heat_bar_pm10.png";
            if (on_map_info != undefined) {
                lib.update_on_map_info()
            }
            if (current_state.show_detail_table) {
                fill_table.model(current_state.heatmap_index)
            }
        } else {
            //만약 pm10이 선택된 상태였다면, heatmap을 끈다. 이후 heatmap_index를 2(초기값)으로 세팅함.
            heatmap.toggle_heatmap()
            current_state.heatmap_index = 2
        }
    })
    
    /*
    동별 미세먼지 pm25 버튼 이벤트 처리
    */
    heatmap_layer[1].addEventListener('click', () => {
        if (heatmap_layer[1].checked == true) {
            heatmap_layer.forEach(d => {
                d.checked = false
            })
            heatmap_layer[1].checked = true
            current_state.heatmap_index = 1
            lib.update_detail_box_button()
            heatmap.set_showheat(true)
            heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
            document.getElementById("heat_bar").src = "image/heat_bar_pm10.png";
            if (on_map_info != undefined) {
                lib.update_on_map_info()
            }
            if (current_state.show_detail_table) {
                fill_table.model(current_state.heatmap_index)
            }
        } else {
            heatmap.toggle_heatmap()
            current_state.heatmap_index = 2
        }
    })
    
    /*
    온도 버튼 이벤트 처리
    */
    heatmap_layer[2].addEventListener('click', () => {
        if (heatmap_layer[2].checked == true) {
            heatmap_layer.forEach(d => {
                d.checked = false
            })
            heatmap_layer[2].checked = true
            current_state.heatmap_index = 2
            lib.update_detail_box_button()
            heatmap.set_showheat(true)
            heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
            document.getElementById("heat_bar").src = "image/heat_bar_t.png";
            if (on_map_info != undefined) {
                lib.update_on_map_info()
            }
            if (current_state.show_detail_table) {
                fill_table.model(current_state.heatmap_index)
            }
        } else {
            heatmap.toggle_heatmap()
            current_state.heatmap_index = 2
        }
    })
    
    /*
    습도 버튼 이벤트 처리
    */
    heatmap_layer[3].addEventListener('click', () => {
        if (heatmap_layer[3].checked == true) {
            heatmap_layer.forEach(d => {
                d.checked = false
            })
            heatmap_layer[3].checked = true
            current_state.heatmap_index = 3
            lib.update_detail_box_button()
            heatmap.set_showheat(true)
            heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
            document.getElementById("heat_bar").src = "image/heat_bar_h.png";
            if (on_map_info != undefined) {
                lib.update_on_map_info()
            }
            if (current_state.show_detail_table) {
                fill_table.model(current_state.heatmap_index)
            }
        } else {
            heatmap.toggle_heatmap()
            current_state.heatmap_index = 2
        }
    })
    

    /*
    point_layer event
    */


    /*
    iot, 국가관측망 선택 버튼 이벤트 처리
    */
    point_layer[0].on('click', () => {
        if (point_layer[0][0].checked) {            
            //우하단 관측망 개수 설정.            
            var comment = `Iot측정소 : ${data.num_observ_network.iot_network}개   국가측정소 : ${data.num_observ_network.national_network}개` 
            $('#num_stations').text(comment)


            current_state.pointmap_index = 0
            pointmap.update_point_map(current_state.pointmap_index)
            point_layer.forEach(d => {
                d[0].checked = false
            })
            point_layer[0][0].checked = true
        } else {
            //만약 iot+ national이 선택된 상태였다면, 인덱스를 -1로 세팅하고, 오버레이된 이미지를 지운다.
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    
    })
    
    /*
    iot 관측망 선택 버튼 이벤트 처리
    */
    point_layer[1].on('click', () => {
        if (point_layer[1][0].checked) {
            var comment = `Iot측정소 : ${data.num_observ_network.iot_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 1
            pointmap.update_point_map(current_state.pointmap_index)
            point_layer.forEach(d => {
                d[0].checked = false
            })
            point_layer[1][0].checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })
    
    /*
    국가관측망 선택 버튼 이벤트 처리
    */
    point_layer[2].on('click', () => {
        pointmap.remove_overlay_image()
        if (point_layer[2][0].checked) {
            var comment = `국가측정소 : ${data.num_observ_network.national_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 2
            pointmap.update_point_map(current_state.pointmap_index)
            point_layer.forEach(d => {
                d[0].checked = false
            })
            point_layer[2][0].checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })
    
    /*
    유인관측망 선택 버튼 이벤트 처리
    */
    point_layer[3].on('click', () => {
        pointmap.remove_overlay_image()
        if (point_layer[3][0].checked) {
            var comment = `유인관측망 : ${data.num_observ_network.shko_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 3
            pointmap.update_point_map(current_state.pointmap_index)
            point_layer.forEach(d => {
                d[0].checked = false
            })
            point_layer[3][0].checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })
    
    /*
    aws망 선택 버튼 이벤트 처리
    */
    point_layer[4].on('click', () => {
        pointmap.remove_overlay_image()
        if (point_layer[4][0].checked) {
            var comment = `무인관측소 : ${data.num_observ_network.aws_network}개` 
            $('#num_stations').text(comment)
            current_state.pointmap_index = 4
            pointmap.update_point_map(current_state.pointmap_index)
            point_layer.forEach(d => {
                d[0].checked = false
            })
            point_layer[4][0].checked = true
        } else {
            $('#num_stations').text('')
            current_state.pointmap_index = -1
            pointmap.remove_overlay_image()
        }
    })
    
    
    
    /*
    바람 선택 이벤트 처리
    */
    $('#play_wind').on('click', () => {
        windmap.toggle_wind_layer()
    })
    
    /*
    타임라인 슬라이드바 드래그를 위한 플래그 설정 이벤트
    */
    $('#knob').on('mousedown', (e) => {
        if (!current_state.is_playing) {
            current_state.knob_drag = true
        }
    })
    
    /*
    재생 버튼 이벤트 처리
    */
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
                            lib.model_init()
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
                        lib.model_init()
                        if (on_map_info != undefined) {
                            lib.update_on_map_info()
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
                        lib.model_init()
                        current_time.text(current_state.map.current_time_str)
                    }
                    if (on_map_info != undefined) {
                        lib.update_on_map_info()
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
            lib.set_current_state(tmp * 3600000)
            current_time.text(current_state.map.current_time_str)
            lib.model_init()
            if (on_map_info != undefined) {
                lib.update_on_map_info()
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
            lib.set_current_state(tmp * 3600000)
            current_time.text(current_state.map.current_time_str)
            lib.model_init()
            if (on_map_info != undefined) {
                lib.update_on_map_info()
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
        fill_table.model(1)
    })
    
    /*
    하단 상세보기 날씨 버튼 이벤트
    */
    $('#weather_button').on('click', () => {
        fill_table.model(2)
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
        lib.update_detail_box_button()
        fill_table.model(current_state.heatmap_index)
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

export {button_event}

