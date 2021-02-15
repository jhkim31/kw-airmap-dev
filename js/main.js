var container = document.getElementById('map');                 //지도를 그릴 element
var options = {
    center: new kakao.maps.LatLng(37.151198243701934, 128.22723681773422),
    level: 12
};                                                              //지도의 설정 정보

var map = new kakao.maps.Map(container, options);               // container element에 맵 객체 생성

var windmap = new Windmap(map, 31, 44, 115, 138, 0.5);
var dustmap = new dustMap(map);

window.onload = () => {
    windmap.init();
    dustmap.init();
}


windmap.addControler();


document.getElementById('playWind').addEventListener('click', windmap.toggleWindLayer)
document.getElementById('showtemp').addEventListener('click', dustmap.toggleHeatmapLayer)


