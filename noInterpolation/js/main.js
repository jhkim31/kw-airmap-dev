import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap} from './windmap.js';

window.map = L.map('map').setView([36, 128], 8);
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var heatmap = new HeatMap()
var windmap = new WindMap(30, 44, 118, 134, 0.5);

window.onload = function () {
    heatmap.init();
    windmap.init();
}

document.getElementById('showHeatMap').addEventListener('click', heatmap.toggleHeatMap)
document.getElementById('playWind').addEventListener('click', windmap.toggleWindLayer)
document.getElementById('goToSeoul').addEventListener('click', () => {map.flyTo(L.latLng(37.552359, 126.987987))})
document.getElementById('goToBusan').addEventListener('click', () => {map.flyTo(L.latLng(35.143470, 129.081928))})



