
// console.log(campground);

// 지도 설정
mapboxgl.accessToken = mapboxToken;  // 튜토리얼에 쓰인 퍼블릭토큰 그냥 가져다씀;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: campground.geometry.coordinates,
    zoom: 8
});

// 확대축소 컨트롤러 추가
map.addControl(new mapboxgl.NavigationControl());

// 지도에 마커,마커팝업 추가
const marker = new mapboxgl.Marker()
    .setLngLat(campground.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 22, closeOnClick: true, closeOnMove: true, closeButton: false })
          .setHTML(
            `<p style="font-family: Rubik, 'IBM Plex Sans KR', 'Noto Sans Korean'; text-align: center;">⛺<br><button class="btn btn-sm btn-light">${campground.title}</button><br>${campground.location}</p>`
          )
      )
    .addTo(map);
