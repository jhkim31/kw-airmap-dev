import { HeatMap as HeatMap } from './layer/Heatmap.js';
import { WindMap as WindMap } from './layer/Flowmap.js'
import { PointMap as PointMap } from './layer/Pointmap.js'

import * as core from './lib/core.js'
import * as event from './lib/event.js'

window.map = L.map('map', {
    "maxBounds": L.latLngBounds([[
        [32, 120],
        [44, 132]
    ]]),
    "maxBoundsViscosity": 1.0
    
})
    .setView([37, 127], 10)

window.map.setMinZoom(5)

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

window.heatmap = new HeatMap(document.getElementById("heatmap"))
window.windmap = new WindMap(document.getElementById('windmap'))
window.pointmap = new PointMap(document.getElementById('pointmap'))

window.current_state = {
    "is_mobile": false,
    "heatmap_index": 2,                 // 0 : pm10, 1 : pm25, 2 : t, 3 : h
    "pointmap_index": -1,
    "time_index": 24,
    "timestamp": 0,
    "show_detail_table": false,
    "knob_drag": false,
    "is_playing": false,
    // "last_aws_marker": null,
    "map": {
        "current_time": 0,
        "current_time_str": "",
        "latGap": 0,
        "lngGap": 0,
        "maxlat": 0,
        "minlat": 0,
        "maxlng": 0,
        "minlng": 0,
        "gridX": 0,
        "gridY": 0
    },
    "Interval": 0
}

window.data = {
    "model_data": {
        "wind_data": [],
        "heat_data": [],           //0 : pm10 /    1 : pm25 /   2 : t /    3 : h    
    },
    "post_data": {},
    "num_observ_network": {
        "iot_network": 0,
        "national_network": 0,
        "shko_network": 0,
        "aws_network": 0
    },
    "observ_network": {
        "iot_network_list": [],
        "national_network_list": [],
        "shko_network_list": [],
        "aws_network_list": []
    },
    "forecast_data": {
        "lifestyle_data": {},
        "dust_data": {}
    }
}

window.on_map_info = null;

if (window.location.href.includes('mobile')) {
    current_state.is_mobile = true;
}

window.onload = async function () {
    core.init_overlay_map()

    if (current_state.is_mobile) {
        $('#timeline_control_box').css({
            'width': window.innerWidth + 'px'
        })
        $('#date_progress').css({
            'width': (window.innerWidth - 120) + 'px'
        })
    }
}

event.button_event()
event.global_event()