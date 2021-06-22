import { HeatMap as HeatMap } from './heatmap.js';
import { WindMap as WindMap } from './windmap.js'
import {windData as windData} from './data.js'
import {heatData as heatData} from './data.js'

console.log(windData)
console.log(heatData)

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

window.request_api = function(bounds){
    
}
