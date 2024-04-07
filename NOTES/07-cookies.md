
## [쿠키]

쿠키는 브라우저에 저장되는 '파일'임.
브라우저를 꺼도 쿠키파일을 삭제하거나 개발자가 설정한 기간이 만료되지 않는 한 유지됨.
그러므로 중요한 정보는 저장 X
쿠키에는 추적tracking 기능도 있는데 이거때문에 문제와 갈등이 생기기도..-_-?자세한내용은모름

참고로 유저가 브라우저개발자도구에서 쿠키내용을 수정해 보낼수도있음..
그래서 회수한쿠키가 내가보낸쿠키가 맞는지 확인하기위해 서명된 쿠키를 사용. 
쿠키서명은 일치여부 확인이 목적이지 내용을 숨기거나 암호화하는건 아님.


-----------------------------

### 쿠키 파서

npm i cookie-parser
const cookieParser = require('cookie-parser')

앱이 사용자에게 전송한 쿠키는 이후 사용자의 모든 요청에 포함됨.
그렇게 다시 돌려받은 쿠키내용을 옵젝형태로 보려면 parser가 필요함.


app.use(cookieParser('for_secret_cookies'))

이제 모든라우트의 요청에 req.cookies 라는 프로퍼티가 포함될거임.
괄호안은 서명된 쿠키를 만들 때 쓰는 비밀키같은거임.. 만약 내가 저 키를 변경한다면 기존의 모든 서명된쿠키들은 무효화됨.
만약 HMAC(해시기반메시지인증코드)으로 서명하려면 cookie-signature라는 패키지 필요..
https://github.com/tj/node-cookie-signature/blob/master/index.js 참고.


-----------------------------

### 쿠키 서명/전송/회수/삭제

유저가 이 경로로 접속하면 쿠키를 만들어 보내줄거임.
그런데 쿠키를 받은 유저가 브라우저개발자도구에서 쿠키내용을 수정해 보낼수도있음..
그래서 회수한쿠키가 내가보낸쿠키가 맞는지 확인하기위해 서명된 쿠키를 사용.
서명여부 등 쿠키생성옵션은 https://expressjs.com/en/4x/api.html#res.cookie 참고.

    app.get('/sendcookie', (req, res) => {

        res.cookie('name', 'Daisy');                  // 이름 쿠키
        res.cookie('breed', 'Pinemarten');            // 종 쿠키
        res.cookie('grade', 'B+', { signed: true })   // 등급 쿠키 (signed cookie - 이 쿠키에만 서명함.)

        res.send('OK WE SENT YOU A COOKIE!')
    })


유저가 이 경로로 접속하면 회수한 쿠키내용을 화면에 띄워주고 쿠키를 삭제하자.
비서명쿠키와 서명쿠키는 req의 서로다른프로퍼티에 들어있음.

    app.get('/retrievecookie', (req, res) => {

        const { name='No-name', breed='No-breed' } = req.cookies;   // 쿠키가 없는 유저일 수도 있으니 디폴트값 설정
        const { grade='No-grade' } = req.signedCookies;   // 서명된 쿠키는 별도의 프로퍼티에 들어있음. 만약 개발자도구 등에서 조작된 값이 회수되었다면 grade는 비어있게 되어 디폴트값이 들어감.
        
        res.clearCookie('name')
        res.clearCookie('breed')
        res.clearCookie('grade')

        res.send(`Hello, ${name} the ${breed}! Your grade: ${grade}`)
    })