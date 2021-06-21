import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'

var southWest = L.latLng(30, 118),
    northEast = L.latLng(44, 134),
    bounds = L.latLngBounds(southWest, northEast)
window.map = L.map('map')
    .setView([36, 128], 8)
    .setMaxBounds(bounds);
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var heatmap = new HeatMap()
var windmap = new WindMap();

window.onload = function () {
    heatmap.init();
    windmap.init();
}

document.getElementById('showHeatMap').addEventListener('click', heatmap.toggleHeatMap)
document.getElementById('playWind').addEventListener('click', windmap.toggleWindLayer)



