

# GeoJSON

Geo데이터는 GeoJSON으로 전송하는게 표준.
아래와 같이 생겼음..

    {
        "type": "Point",
        "coordinates": [126.740433125801, 37.5388442]
    }

몽고DB는 아예 GeoJSON을 위한 특별한 메서드 등이 있음..
지리데이터 필드는 꼭 저 형태로 저장할 것.
https://www.mongodb.com/docs/manual/reference/geojson/
타입이 꼭 Point만 있는건 아니니까 Docs 한번 훑어보셈

몽구스에서 GeoJSON이 들어갈 필드의 스키마는 이렇게 설정함.
https://mongoosejs.com/docs/geojson.html

    location: {
        type: {
            type: String,      // { location: { type: String } } 이렇게 하지 말라고 함.
            enum: ['Point'],   // 이 DB에서 type값은 늘 'Point'만 쓸거라는 의미.
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }



-----------------------------


지도 관련 API서비스는 구글맵, 오픈스트릿, 맵박스 등등 있음.. 아래 비교글 참고
https://relevant.software/blog/choosing-a-map-amapbox-google-maps-openstreetmap/

강의에서는 MapBox 사용.
Cloudinary 썼을때처럼 크레덴셜은 따로 .env에 작성함.
근데 mapbox-gl 써서 지도띄울때 시크릿토큰은 안되고 퍼블릭토큰만 된다고 오류뜸..뭐지?


[지도넣기]


Docs튜토리얼 따라서 mapbox-gl-geocoder 로 했음
https://docs.mapbox.com/help/tutorials/local-search-geocoding-api/ 튜토리얼
요청수에 따라 과금될수있으니 https://www.mapbox.com/pricing/#search 참고

    npm i mapbox-gl

그리고 튜토리얼에 있는 예시대로 필요한 코드 넣으면 됨..
지도표시/마커표시/지오코더/API 샘플 maptest.ejs에 넣어놨음.


[Geo코딩]


forward geocoding : 지리정보(주소,지명 등)를 좌표로 변환
reverse geocoding : 좌표를 지리정보로 변환
난 지도에 표시할 [경도, 위도] 좌표가 필요한거니까 포워드지오코딩 해야함.


# 방법1 : API URL로 요청

검색어를 넣어 요청하면 좌표가 들어있는 응답을 주는 맵박스의 서치API 이용..
https://docs.mapbox.com/help/getting-started/geocoding/
https://docs.mapbox.com/api/search/geocoding/#forward-geocoding

언어는 ko, 검색범위는 kr, 검색어종류는 address
내가 필요한 조건을 쿼리스트링으로 달아서 완성한 URL로 GET요청하면..
    
    https://api.mapbox.com/geocoding/v5/mapbox.places/계산새로.json?types=address&language=ko&country=kr&access_token=pk.eyJ1IjoibmlsbGEtdmEiLCJhIjoiY2xyamhvMXhsMDNmajJxcGZsa3h4M3Y0MSJ9.lNVDRd1ILNdJQj3AY1k-tw
        
결과데이터.features[0].geometry 안에 GeoJSON이 들어있다.

    {
        "type": "Point",
        "coordinates": [126.740433125801, 37.5388442]   (우리동네 좌표임)
    }

저 좌표값을 이용해서 지도에 마커표시하면 됨.
그런데 GeoJSON의 좌표값은 경도,위도 순서임! GeoJSON을 이용하는 API, 패키지메서드 등은 상관없지만,
구글지도에선 두 값을 바꿔 입력해야함! 구글맵은 사람들에게 익숙한 위도,경도 순을 이용하므로..


# 방법2 : JS-SDK의 Geocoding서비스 이용

서버쪽에서 코드짜기에는 맵박스Node클라이언트인 js-sdk 쓰는게 나음
URL로 요청하는것보다는 메서드로 하는게 편하니까..

강의에서처럼 mapbox-javascript-sdk 를 써서 하자..
https://github.com/mapbox/mapbox-sdk-js 참고

    npm install @mapbox/mapbox-sdk

https://github.com/mapbox/mapbox-sdk-js/blob/main/docs/services.md 여기보면
제공하는 서비스 종류 엄청많음.. 그중 내가 사용할 서비스는 "geocoding"임.
지도필요한 라우트가 있는 컨트롤러 파일에서 서비스명에 "geocoding" 넣어서 아래코드작성

    const mbx서비스명 = require('@mapbox/mapbox-sdk/services/서비스명');
    const 서비스client들어갈변수명 = mbx서비스명({ accessToken: MY_ACCESS_TOKEN });

그리고 서비스 Docs에 있는대로 따라하면됨.. Doc에서는 변수명을 geocodingClient라고 지었군..


[Cluster맵]


예시코드 보고 수정해서 적용하셈..

기본 클러스터 :
https://docs.mapbox.com/mapbox-gl-js/example/cluster/

카테고리로 나눈 클러스터:
https://docs.mapbox.com/mapbox-gl-js/example/cluster-html/




