
// 지도 설정
mapboxgl.accessToken = mapboxToken;  // 튜토리얼에 쓰인 퍼블릭토큰 그냥 가져다씀;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-92.3141, 37.6417],
    zoom: 3.3,
    minZoom: 2,
    maxZoom: 10
});

// 확대축소 컨트롤러 추가
map.addControl(new mapboxgl.NavigationControl());

// 클러스터 매핑
map.on('load', () => {

    map.addSource('campgrounds', {
        type: 'geojson',
        data: mapData,        // 내가 서버에서 보낸 데이터가 여기로 들어감
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    });

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#97c5bf',
                6,
                '#c2e2de',
                12,
                '#f8e6b9'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                6,
                31,
                12,
                40
            ]
        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'campgrounds',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#44919b',
            'circle-radius': 7,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('campgrounds').getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
                if (err) return;

                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    map.on('mouseenter', 'unclustered-point', (e) => {

        const coordinates = e.features[0].geometry.coordinates.slice();

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup({ offset: 7, closeOnClick: true, closeOnMove: true, closeButton: false })
            .setLngLat(coordinates)
            .setHTML(
                `<p style="font-family: Rubik, 'IBM Plex Sans KR', 'Noto Sans Korean'; text-align: center;">
                ⛺
                <br>
                <a class="btn btn-sm btn-info" style="min-width: 100px;" href="/campgrounds/${e.features[0].properties.id}">${e.features[0].properties.title}</a>
                <br>
                ${e.features[0].properties.location}
                <br>
                ⭐${e.features[0].properties.avgRating.toFixed(1)}&nbsp;&nbsp;|&nbsp;&nbsp;$${e.features[0].properties.price}/night &nbsp;
                </p>`
            )
            .addTo(map);

    });

    map.on('click', 'unclustered-point', (e) => {

        const coordinates = e.features[0].geometry.coordinates.slice();

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup({ offset: 7, closeOnClick: true, closeOnMove: true, closeButton: false })
            .setLngLat(coordinates)
            .setHTML(
                `<p style="font-family: Rubik, 'IBM Plex Sans KR', 'Noto Sans Korean'; text-align: center;">
                ⛺
                <br>
                <a class="btn btn-sm btn-info" style="min-width: 100px;" href="/campgrounds/${e.features[0].properties.id}">${e.features[0].properties.title}</a>
                <br>
                ${e.features[0].properties.location}
                <br>
                ⭐${e.features[0].properties.avgRating.toFixed(1)}&nbsp;&nbsp;|&nbsp;&nbsp;$${e.features[0].properties.price}/night &nbsp;
                </p>`
            )
            .addTo(map);

    });

    map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
    });

});
