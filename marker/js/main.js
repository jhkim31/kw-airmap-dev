
window.map = L.map('map').setView([36, 128], 8);
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png').addTo(map);

var icon1 = L.icon({
    iconUrl: '../image/marker1.png',
    iconSize:[30,30]
})

var icon2 = L.icon({
    iconUrl: '../image/marker2.png',
    iconSize:[30,30]
})

var icon3 = L.icon({
    iconUrl: '../image/marker3.png',
    iconSize:[30,30]
})

var icon4 = L.icon({
    iconUrl: '../image/marker4.png',
    iconSize:[30,30]
})

var markerList = [] 
var level1MarkerList = []
var level2MarkerList = []
var level3MarkerList = []
for(var i = 36; i < 38; i += 0.6){
    for (var j = 126; j <= 128; j += 0.6){
        markerList.push(L.marker([i,j], {icon : icon2}).addTo(map));
    }
}

for(var i = 34; i < 38; i += 0.5){
    for (var j = 126; j <= 130; j += 0.5){        
        if (j % 2 == 0 && i % 2 == 0){ 
            level3MarkerList.push(L.marker([i,j], {icon : icon4}).addTo(map));
        }
        if (j % 1 == 0 && i % 1 == 0){
            level2MarkerList.push(L.marker([i,j], {icon : icon4}).addTo(map));
        }
        
        level1MarkerList.push(L.marker([i,j], {icon : icon4}));
        
    }
}

map.on('zoomend', e => {    
    if (e.sourceTarget._zoom > 9){
        markerList.forEach(d => {
            d.setIcon(icon3)
        })
        level3MarkerList.forEach(d => {
            map.removeLayer(d)
        })
        level2MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level1MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level1MarkerList.forEach(d => {
            d.addTo(map)
        })
    } else if (e.sourceTarget._zoom > 7) { 
        markerList.forEach(d => {
            d.setIcon(icon2)
        })
        level3MarkerList.forEach(d => {
            map.removeLayer(d)
        })
        level2MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level1MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level2MarkerList.forEach(d => {
            d.addTo(map)
        })
    } else {
        markerList.forEach(d => {
            d.setIcon(icon1)
        })
        level3MarkerList.forEach(d => {
            map.removeLayer(d)
        })
        level2MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level1MarkerList.forEach(d => {
            map.removeLayer(d)
        })        
        level3MarkerList.forEach(d => {
            d.addTo(map)
        })    
    }
})



