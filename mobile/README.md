# 모바일 적용시 주의사항

## 1. 수정 코드 부분.

### event > global_event.js > window.onload
```
$('#timeline_control_box').css({
    'width': window.innerWidth + 'px'
})
$('#date_progress').css({
    'width': (window.innerWidth - 120) + 'px'
})
```
추가
### event > button_event.js > close_detail_box
`$('#mobile_overlay').show()` 추가

### event > global_event.js > map.on('click')
```
$('#control_box').hide()
$('#mobile_overlay').hide()
```
추가

### fill table 공통
`//$('#info_box').width($('#detail_table1').width() + $('#detail_table2').width() + 32)`
info_box 크기 조절 부분 삭제