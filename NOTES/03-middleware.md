
[미들웨어]

요청-응답 '사이'에 실행되는 함수.
(그러므로 미들웨어 안에서 res.send나 res.render 등으로 뭐라도 '응답'을 해버리면 거기서 끝나버리므로 안됨)

express.static  express.json  express.urlencoded
얘네들 다 익스프레스의 빌트인 미들웨어임.

-----------------------------
# 방법 1

모든 url 접속시 공통적으로 수행해야하는 작업(로그인여부 체크, 시간띄우기 등)은
미들웨어 함수를 만들어 app.get(‘/url’, [함수명1, 함수명2], (req, res)=>{ })
이런식으로 주소와 콜백함수 사이에 넣어주면 됨.
여러개이면 배열로 가능

위 경우의 미들웨어 정의방법 :

    function 함수명(req, res, next) {    // 3번째 파라미터가 핵심.
        console.log("MY MIDDLEWARE");
        return next();                  // next()라는 녀석이 있어야 다음미들웨어로 넘어가든가 응답으로 넘어가든가 함.
    }

-----------------------------
# 방법 2

근데 저것도 API가 수백개면 번거로우니까 그냥
서버파일 위쪽부분에 app.use(‘/적용할url’, 미들웨어함수명) 이렇게 해줘도 됨.
해당 app.use밑에 있는 모든 route핸들러들에 적용됨

위 경우의 미들웨어 정의방법 :

    app.use((req, res, next) => {
        req.requestTime = Date.now();   // 만약 이렇게 해둔다면, 이하 모든 라우트핸들러에서 req.requestTime를 쓸수있다. (옵젝 데코레이팅)
        console.log("FIRST MIDDLEWARE")
        next();
        // 만약 이렇게 next()에다가 return을 안 붙이고 그 밑에 코드를 더 쓴다면,
        // 다음 미들웨어를 실행시키고나서 아래 코드도 계속 실행.. (이딴식으로 사용하는 사람은 없긴함==)
        console.log("FIRST MIDDLEWARE - after next()")
    })
    app.use((req, res, next) => {
        console.log("SECOND MIDDLEWARE")
        return next();
    })
    app.use((req, res, next) => {
        console.log("THIRD MIDDLEWARE")
        return next();   // 이 다음에는 미들웨어가 더이상 없으므로 응답으로 넘어감.
    })

    (실행시키려는 순서대로 작성)


만약 특정URL+모든하위URL / 특정문구가포함된URL 등등
(정규표현식으로 url지정하는 방법은 https://expressjs.com/en/5x/api.html#app.use 참고)
특정조건을 만족하는 URL로 들어온 요청에만 미들웨어를 실행시키고 싶다면

    app.use('/dogs', (req, res, next) => {   // /dogs로 시작하는 URL들에만 적용되는 미들웨어.
        console.log("I LOVE DOGS")
        next();
    })


-----------------------------

참고로 라우트핸들러들 맨 밑에 app.use를 이용해서
아무 url도 매칭되지 않는 경우 응답할 내용을 정의할 수 있음.

    app.use((req, res) => {
        res.status(404).send('NOT FOUND!');   // 이렇게 상태코드도 지정가능.
    })


-----------------------------
# pre/post

pre, post 에 대해서는 datamodel.txt 참고