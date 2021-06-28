
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

var markerList = [] 
for(var i = 36; i < 38; i += 0.5){
    for (var j = 126; j <= 128; j += 0.5){
        markerList.push(L.marker([i,j], {icon : icon2}).addTo(map));
    }
}

map.on('zoomend', e => {    
    if (e.sourceTarget._zoom > 11){
        markerList.forEach(d => {
            d.setIcon(icon3)
        })
    } else if (e.sourceTarget._zoom > 7) { 
        markerList.forEach(d => {
            d.setIcon(icon2)
        })
    } else {
        markerList.forEach(d => {
            d.setIcon(icon1)
        })
    }
})



