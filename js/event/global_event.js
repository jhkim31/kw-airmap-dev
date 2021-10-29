import * as lib from '../lib/lib.js'
import * as fill_table from '../lib/fill_table.js'

function global_event(){
    /*
    슬라이드바를 드래그할때 실행될 이벤트.
    */
    window.addEventListener('mousemove', (e) => {
        var current_time = $('#current_time')
        if (current_state.knob_drag) {
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
                    lib.set_current_state(tmp * 3600000)
                }
                current_time.text(current_state.map.current_time_str)
            }
        }
    })

    /*
    마우스를땔때 실행되는 이벤트,
    만약 knob을 드래고 하고 있던 중이였을때만 활성화됨.
    */
    window.addEventListener('mouseup', (e) => {
        if (current_state.knob_drag && !current_state.is_playing) {
            current_state.knob_drag = false
            $('#knob').css({
                "transition": "left .1s ease"
            })
            current_state.time_index = Math.floor((parseFloat(document.getElementById('knob').style.left) / 480) / 0.0416667)
            lib.model_init()
            if (on_map_info != undefined) {
                lib.update_on_map_info()
            }
        }
    })

    /*
    맵 이동시마다 실행되는 이벤트
    */
    map.on('moveend', (e) => {
        data.model_data.wind_data = []
        data.model_data.heat_data = []
        lib.model_init()
    })

    /*
    지도 클릭 이벤트
    */
    map.on('click', async (e) => {
        if (current_state.is_mobile){
            $('#control_box').hide()
            $('#mobile_overlay').hide()
        }
        
        if (on_map_info != undefined) {
            map.removeLayer(on_map_info)
        } 
        
        var value = lib.get_value(e.containerPoint.x, e.containerPoint.y)
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

                fill_table.show_detail_data(e.latlng.lat, e.latlng.lng)
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
                fill_table.show_detail_data(e.latlng.lat, e.latlng.lng, is_marker[1], is_marker[2])
        }
    })

    window.onload = async function () {
        lib.model_init()
        lib.pointmap_init()

        if(current_state.is_mobile){
            $('#timeline_control_box').css({
                'width': window.innerWidth + 'px'
            })
            $('#date_progress').css({
                'width': (window.innerWidth - 120) + 'px'
            })
        }
    }
}

export {global_event}