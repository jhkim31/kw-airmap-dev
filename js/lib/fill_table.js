import * as lib from './lib.js'
import * as get_api from './get_api.js'
import {dust_forecast as dust_forecast} from '../table.js'

function shko(shko_data){
    $('#weather_button').hide()
    $('#dust_button').hide()
    var detail_table1 = $('#detail_table1')
    var detail_table2 = $('#detail_table2')
    detail_table1[0].style.height = "240px"
    detail_table2[0].style.height = "240px"
    detail_table1.html('')
    detail_table2.html('')

    var today_col = shko_data[0].time.getHours()
    var yesterday_col = 24 - today_col

    var table2_first_row = `<tr class = "table_header"><td>날짜</td>`
    table2_first_row += `<td colspan="${yesterday_col}">${shko_data[0].time.getDate()}일</td>`
    table2_first_row += `<td colspan="${today_col}">${shko_data[23].time.getDate()}일</td>`
    table2_first_row += `</tr>`
    detail_table2.append(table2_first_row)

    var table2_row = `<tr class = "table_header"><td>시간</td>`
    shko_data.forEach(d => {
        var h = d.time.getHours()
        table2_row += `<td>${h}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>기온</td>`
    shko_data.forEach(d => {
        var item = d.temp
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>습도</td>`
    shko_data.forEach(d => {
        var item = d.humi
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>강수량</td>`
    shko_data.forEach(d => {
        var item = d.rain
        if (item == null){
            item = '-'
        }
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>풍량</td>`
    shko_data.forEach(d => {
        var item = d.wdirk
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>풍속</td>`
    shko_data.forEach(d => {
        var item = d.wspeed
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    $('#detail_scroll_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    if (!current_state.is_mobile){
        $('#info_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    }    
}

function aws(aws_data){
    $('#weather_button').hide()
    $('#dust_button').hide()
    var detail_table1 = $('#detail_table1')
    var detail_table2 = $('#detail_table2')
    detail_table1[0].style.height = "240px"
    detail_table2[0].style.height = "240px"
    detail_table1.html('')
    detail_table2.html('')

    var today_col = aws_data[0].time.getHours() + 1
    var yesterday_col = 24 - today_col

    var table2_first_row = `<tr class = "table_header"><td>날짜</td>`
    table2_first_row += `<td colspan="${today_col}">${aws_data[0].time.getDate()}일</td>`
    table2_first_row += `<td colspan="${yesterday_col}">${aws_data[23].time.getDate()}일</td>`
    table2_first_row += `</tr>`
    detail_table2.append(table2_first_row)

    var table2_row = `<tr class = "table_header"><td>시간</td>`
    aws_data.forEach(d => {
        var h = d.time.getHours()
        table2_row += `<td>${h}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>기온</td>`
    aws_data.forEach(d => {
        var item = d.temp
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>습도</td>`
    aws_data.forEach(d => {
        var item = d.humi
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>강수량</td>`
    aws_data.forEach(d => {
        var item = d.rain
        if (item == null){
            item = '-'
        }
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>풍량</td>`
    aws_data.forEach(d => {
        var item = d.wdirk
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    var table2_row = `<tr><td>풍속</td>`
    aws_data.forEach(d => {
        var item = d.wspeed
        table2_row += `<td>${item}</td>`
    })
    table2_row += '</tr>'
    detail_table2.append(table2_row)

    $('#detail_scroll_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    if (!current_state.is_mobile){
        $('#info_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    }
    

}

//하단 상세 보기의 표를 채워주는 함수 
function model(type) {
    lib.update_detail_box_button(type)   
    $('#weather_button').show()
    $('#dust_button').show()
    var forecast_data = type >= 2 ? data.forecast_data.lifestyle_data : data.forecast_data.dust_data 
    var header = ['강수확률 (%)', '강수량 (mm)', '기온(C)', '풍향(8)', '풍속 (m/s)', '습도(%)']
    var detail_table1 = $('#detail_table1')
    var detail_table2 = $('#detail_table2')
    detail_table1[0].style.height = "240px"
    detail_table2[0].style.height = "240px"
    detail_table1.html('')
    detail_table2.html('')

    if (type < 2) {       // 미세먼지일때
        detail_table2.html(dust_forecast)
    } else {              // 기상 상황일때
        var today = new Date().getTime()
        var table1_first_row = `<tr class = "table_header"><td>날짜</td>`
        var tmp = ['오늘', '내일', '모레']
        for (var i = 0; i < 3; i++) {
            table1_first_row += `<td colspan="24">${tmp[i]} ${new Date(today + 86400000 * i).getMonth() + 1 + '/' + new Date(today + 86400000 * i).getDate()}</td>`
        }
        table1_first_row += `</tr>`
        detail_table1.append(table1_first_row)  // table1 first_row

        var table1_second_row1 = `<tr class = "table_header"><td rowspan="2" >예보</td>`
        for (var i = 0; i < 3; i++) {
            table1_second_row1 += '<td colspan="6">새벽</td><td colspan="6">아침</td><td colspan="6">낯</td><td colspan="6">저녁</td>'
        }
        table1_second_row1 += `</tr>`
        detail_table1.append(table1_second_row1)  // table1 second_row1

        var table1_second_row2 = `<tr>`
        for (var i = 0; i < 3; i++) {
            var forecast = forecast_data[i]
            forecast[0].forEach(d => {
                table1_second_row2 += `<td colspan="6">${d}</td>`
            })
        }
        table1_second_row2 += '</tr>'
        detail_table1.append(table1_second_row2)  // table1 second_row2

        var table1_third_row = `<tr><td class = "table_header">시간</td>`
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 24; j++) {
                table1_third_row += `<td>${j}</td>`
            }
        }
        table1_third_row += '</tr>'
        detail_table1.append(table1_third_row)      //table1 3th row

        var table1_4th_row = `<tr><td class = "table_header">날씨</td>`
        for (var i = 0; i < 3; i++) {
            var forecast = forecast_data[i]
            for (var j = 0; j < 24; j++) {
                table1_4th_row += '<td> </td>'
            }
        }
        table1_4th_row += '</tr>'
        detail_table1.append(table1_4th_row)        //table1 4th row

        for (var i = 1; i <= 6; i++) {
            var row = `<tr><td class = "table_header">${header[i - 1]}</td>`
            for (var j = 0; j < 3; j++) {
                forecast_data[j][i].forEach(d => {
                    row += `<td>${d}</td>`
                })
            }
            row += '</tr>'
            detail_table1.append(row)
        }



        var table2_first_row = `<tr class = "table_header"><td rowspan = '2'>날짜</td>`
        for (var i = 3; i < 7; i++) {
            table2_first_row += `<td colspan="2">${new Date(today + 86400000 * i).getMonth() + 1 + '/' + new Date(today + 86400000 * i).getDate()}</td>`
        }
        table2_first_row += `</tr>`
        detail_table2.append(table2_first_row)    // table2 first_row

        var table2_second_row1 = `<tr class = "table_header">`
        for (var i = 3; i < 7; i++) {
            table2_second_row1 += '<td>오전</td><td>오후</td>'
        }
        table2_second_row1 += `</tr>`
        detail_table2.append(table2_second_row1)  // table2 second_row1

        var table2_third_row = `<tr><td class = "table_header">날씨</td>`
        for (var i = 3; i < 7; i++) {
            table2_third_row += `<td>${forecast_data[i][0][0]}</td><td>${forecast_data[i][0][1]}</td>`
        }
        table2_third_row += '</tr>'
        detail_table2.append(table2_third_row)        //table2 third row

        var table2_4th_row = `<tr><td class = "table_header">최저/최고(C)</td>`        
        for (var i = 3; i < 7; i++) {
            table2_4th_row += `<td colspan="2">${forecast_data[i][1][0]}/${forecast_data[i][1][1]}</td>`
        }
        table2_4th_row += '</tr>'
        detail_table2.append(table2_4th_row)        //table2 third row

        var table2_4th_row = `<tr><td class = "table_header">강수확률 (%)</td>`        
        for (var i = 3; i < 7; i++) {
            table2_4th_row += `<td>${forecast_data[i][2][0]}</td><td>${forecast_data[i][2][1]}</td>`
        }
        table2_4th_row += '</tr>'
        detail_table2.append(table2_4th_row)        //table2 third row
    }

    $('#detail_scroll_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)
    var width = Math.min($('#bottom_box').width(), $('#detail_table1').width() + $('#detail_table2').width() + 32)
    if (!current_state.is_mobile){
        $('#info_box').width(width)
    }    
}

async function show_detail_data(lat, lng, is_marker=null, areacode = 0) { 
    var hang_data = await get_api.hang_data(lat, lng)    
    var dbox = $('#detail_box')[0]  
    $('#current_location').text(`${hang_data[1]} ${hang_data[2]} ${hang_data[3]}`)
    if (is_marker){     //마커인경우
        if (is_marker == 'iot'){
            //api 없음
        }else if (is_marker == 'national'){
            //api 없음
        } else if (is_marker == 'shko'){            
            var item = await get_api.shko_station_data(areacode)
            shko(item)
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        } else if (is_marker == 'aws'){
            var item = await get_api.aws_station_data(areacode)
            aws(item)
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        }
        
    } else {
        if (hang_data.length > 0){          //내륙
            data.forecast_data.lifestyle_data = await get_api.lifestyle_data(hang_data[0])
            model(current_state.heatmap_index)                  
            dbox.style.visibility = 'visible'
            dbox.style.height = 'auto';  
        } else {          
            dbox.style.visibility = 'hidden'
            dbox.style.height = '0px';                  
        }   
    }      
}

export {shko, aws, model, show_detail_data}