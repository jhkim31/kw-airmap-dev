import * as wind from "./windmap.js"
import * as temp from "./dustmap.js"


var options = {
    center: new kakao.maps.LatLng(37.151198243701934, 128.22723681773422),
    level: 12
};                                                              //지도의 설정 정보
window.container = document.getElementById('map');                 //지도를 그릴 element
window.map = new kakao.maps.Map(container, options);               // container element에 맵 객체 생성
window.coordinate = map.getProjection();



window.onload = () => {
    wind.init();
    wind.readGrid();
    temp.init();    
}

window.onresize = () => {
    wind.init();
    temp.init();
}


kakao.maps.event.addListener(map, 'drag', () => {
    if (temp.showTemp){
        temp.drawCanvas();
    }    
    if (wind.showWind){
        wind.stopAnim();
        wind.init();
    }
})

kakao.maps.event.addListener(map, 'dragend', () => {
    if (temp.showTemp) {
        temp.drawCanvas();
    }

    if (wind.showWind) {
        wind.build()
        wind.anim()
    }
})

kakao.maps.event.addListener(map, 'zoom_changed', () => {
    if (temp.showTemp) {
        temp.drawCanvas();
    }    
})


window.addEventListener('click', e => {
    var status = document.getElementById('status');
    var point = new kakao.maps.Point(e.pageX, e.pageY);
    var vector = wind.getVector(coordinate.coordsFromContainerPoint(point).Ma, coordinate.coordsFromContainerPoint(point).La)
    status.innerHTML =
        `${coordinate.coordsFromContainerPoint(point).Ma.toFixed(3)}, ${coordinate.coordsFromContainerPoint(point).La.toFixed(3)}, 
    vector : ${vector[0].toFixed(3)}, ${vector[1].toFixed(3)} scale: ${vector[2].toFixed(3)}m/s zoomLevel: ${map.getLevel()}, pm10Value: ${temp.getValue(e.pageX, e.pageY)}`    
})




