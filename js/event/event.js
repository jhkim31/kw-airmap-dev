heatmap_layer[0].addEventListener('click', () => {
    if (current_state.heatmap_index != 0) {
        heatmap_layer.forEach(d => {
            d.checked = false
        })
        heatmap_layer[0].checked = true
        current_state.heatmap_index = 0
        update_detail_box_button()
        heatmap.set_showheat(true)
        heatmap.set_data(current_state.map, data.model_data.heat_data[current_state.time_index][current_state.heatmap_index], current_state.heatmap_index)
        document.getElementById("heat_bar").src = "image/heat_bar_pm10.png";
        if (on_map_info != undefined) {
            update_on_map_info()
        }
        if (current_state.show_detail_table) {
            fill_detail_table(current_state.heatmap_index)
        }
    } else {
        heatmap.toggleHeatMap()
        current_state.heatmap_index = 2
    }
})