
## [세션]

쿠키가 client-side 데이터저장이라면(사용자의 브라우저 파일에 저장),
세션은 server-side 데이터저장으로(서버에 저장), 원래 stateless인 HTTP를 stateful하게 만든다.
그렇지만 데이터를 영구적으로 저장하는 DB와는 다름.. 완전 별개 개념임.
아직 안 배운 Redis(데이터단기저장DB..?)와는 비슷하다고 함.

(참고로 익스프레스세션 사용시 세션데이터가 메모리저장소를 이용하는게 디폴트인데,
메모리는 프로덕션용 앱의 저장소로 쓰기엔 불안정함.. 메모리 누수 등등
프로덕션용으로는 Redis나 세션용몽고DB 등 메모리가 아닌 다른저장소에 저장하도록
익스프레스세션을 따로 설정해줘야 한다고 함. 아래 문서링크 참고)

세션 왜 씀??
쿠키는 도메인별 쿠키개수, 쿠키하나당 저장가능한 정보량에 제한이 있고
브라우저에 저장되므로 서버측에 저장하는것만큼 안전하지가 않음

세션 작동방식.
예를 들어 비로그인상태에서 장바구니데이터 유지하기.
서버는 사이트에 접속한 사용자의 브라우저에게 세션ID를 쿠키로 보냄. (아무튼 쿠키도 같이 씀!)
브라우저에 저장되는건 세션을 여는 ID와 키뿐임.
장바구니담기 요청시 서버는 회수한쿠키에서 세션ID를 확인하고 서버에 데이터 저장.
장바구니페이지 요청시 서버는 회수한쿠키에서 세션ID를 확인하고 서버로부터 데이터 꺼내 출력.
비로그인 상태에서 장바구니에 담은 상품은 세션유지기간만큼만 유지되는거임.
결제하기 요청시 이제는 로그인하라고 띄우는 식..


-----------------------------

### express-session

npm i express-session  (참고로 버전1.5.0부터는 쿠키파서 없어도 익스프레스세션 쓸수있다고함)
const session = require('express-session')

익스프레스를 쓰는 상황에서 세션을 쓰려면 express-session이 필요함.
express-session 환경설정은 프로덕션,보안,앱환경설정과 관련해서 중요하지만
내용이 어려워서 일단은 깊이 들어가진 않는다고 함-_-;
https://expressjs.com/en/resources/middleware/session.html 참고.


    const sessionConfig = {  // resave랑 saveUninitialized는 내가 쓰는 세션저장소에 따라 설정을 다르게해야할거임..
        secret: 'key_for_signed_sessioncookies',
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,   // 간단한 보안설정, 클라이언트측 스크립트로 쿠키접근 못하게 막음 (어떤사용자가 크로스사이트스크립팅 결함을 이용해 어떤링크에 접근하려고 해도 브라우저가 서드파티에 쿠키를 노출하지 않음)
            expires: Date.now() + 1000*60*60*24*7,   // 단위가 밀리초라서.. 일주일을 저렇게 나타냄..
            maxAge: 1000*60*60*24*7
        }
    }

    app.use(session(sessionConfig))


위와같이 세션 미들웨어를 이용하면 따로 쿠키생성및전송코드 쓰지 않아도
어떤라우트로 요청들어오든 자동으로 세션ID(connect.sid)생성해서 서명쿠키에 넣어 브라우저로 전송
(물론 최초전송 후에는 요청시마다 쿠키가 회수될테니 새로 쿠키를 생성하지 않음)

(근데 저 자동생성된 쿠키가 세션쿠키(브라우저닫으면삭제되는)인 건 맞음?-_-?? 강의 더 들어봐야할듯;)



### 세션에 데이터 저장 및 꺼내오기

세션을 이용해서 유저가 이 페이지에 접속한 횟수를 띄워주자.
사용자는 이 페이지가 열리기 전 이미 쿠키를 받기 때문에, req.session 안에는 sid가 들어있음.
req.session.프로퍼티명 을 통해 해당sid에 대해 데이터 저장 및 꺼내오기 가능.

    app.get('/viewcount', (req, res) => {

        if (req.session.count) {
            req.session.count += 1;
        } else {
            req.session.count = 1;     // req.session에 들어있는 세션ID와 일치하는 곳에 count라는 속성과 값을 저장.
        }

        res.send(`You have viewed this page ${req.session.count} times.`)
    })


### 세션데이터 삭제 및 세션파괴

(저렇게 생긴 문법이 있다고??ㄷ).. 근데 아무튼 저렇게하면 저장된 해당데이터 삭제됨

    delete req.session.속성명

세션자체를 파괴하려면

    req.session.destroy(function(err) {
        // cannot access session here
    })


-----------------------------

## [플래시]


### connect-flash

플래시는 메시지를 저장하기 위해 쓰이는 세션 안의 특별한 영역임.
주로 redirect와 조합해 사용자에게 메시지를 출력해 내보내는 데 사용.
특정동작(예: 로그인,로그아웃,폼제출 등)이 끝나고 다른페이지로 리디렉트하기 전에 저장,
리디렉트된 뷰페이지에서 메시지를 꺼내 사용. (1회성이라서 새로고침하면 더이상 메시지 표시 X)

express-flash 패키지도 있지만 강의에서는 connect-flash 패키지 쓰고있음.

npm i connect-flash
const flash = require('connect-flash')
app.use(flash())  // 이제 모든 라우트에 대한 요청에 req.flash() 메서드가 포함됨.

    app.get('/register', (req, res) => {
        const { username = 'Anonymous' } = req.query;
        req.session.username = username;    // 쿼리스트링으로 받은값을 세션에 저장.
        req.flash('success', "SEE HOW SUCCESSFULLY WE GOT YOUR NAME! :D")    // 플래시에 메시지저장
        res.redirect('/greet')
    })

    app.get('/greet', (req, res) => {
        const { username } = req.session;    // 세션에 저장한 값 꺼내오기.
        res.send(`<h1>Welcome Back, ${username}!</h1> ${req.flash('success')[0] ?? ''}`)   // 플래시에 저장한 메시지 꺼내기 (헛; 다트에서 배운 문법 여기도 먹힘)
    })


### res.locals

만약 단순히 res.send() 로 플래시메시지를 출력하는게 아니라
res.render()로 뷰페이지에서 플래시메시지를 받아 렌더링하게 할거라면
매번 저 메서드 안에 옵젝으로 메시지변수를 넣어줘야해서 귀찮음..

그래서 res.locals를 이용하면 편함.
res.locals.msg = req.flash('키이름') 이런 식으로 저장하면
한번의 요청-응답 주기 내에서만 저장값이 유지됨.

res.locals코드는 app.use()안에 넣어 공용미들웨어로 만들어놓고
(익스프레스라우터 사용중이라면 라우터파일들 use한 곳보다 위에 넣어야 함!!)
메시지가 필요한 모든 뷰페이지에 partial로 <%= msg %> 넣어 받으면 됨.

    app.use((req, res, next) => {
        res.locals.messages = req.flash('success')
        next()
    })

    (참고로 아래처럼 그냥 res.send로 출력한다면 msg가 아니라 res.locals.msg로 꺼냄)

    app.get('/greet', (req, res) => {
        const { username } = req.session;    // 세션에 저장한 값 꺼내오기.
        res.send(`<h1>Welcome Back, ${username}!</h1> ${res.locals.messages}`)   // 미들웨어를 통해 res.locals에 저장해둔 플래시메시지 꺼내기 (이때는 ??연산자 없어도 undefined안뜸)
    })