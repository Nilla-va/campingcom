
[에러처리]

Express에는 내장된 디폴트에러처리기가 있음
https://expressjs.com/en/guide/error-handling.html 참고
라우트핸들러, 미들웨어 등에서 오류발생시 디폴트에러핸들러가 작동함.

아무 에러처리 안했을때 기본적으로 뜨는 에러화면이 express가 제공하는 에러화면임.
상태코드는 err.status 또는 err.statusCode로부터 가져와서 res.statusCode에 세팅함.
4xx나 5xx를 벗어나는 상태코드인 경우 500코드로 통일해서 표시.
err.stack으로부터 스택추적 내용을 띄워줌 (개발모드에서만 보인다고 함?)

-----------------------------

아래 값들 활용해보셈..

err.status / err.statusCode
res.statusCode
res.statusMessage
err.stack
err.headers
err.name (이건 특히 mongoose가 발생시킨 오류가 어떤종류의 오류인지 확인하고 오류별로 다르게 처리할때 유용)

-----------------------------

커스텀 에러,
익스프레스가 처리해주지 않는 에러,
몽구스가 발생시킨 에러
처리하기!

(참고로 익스프레스는 유연하기 때문에 에러처리방법이 한둘이 아님.. 장점이자단점
그냥 내가 원하는 대로 하셈; 아님 Docs참고해서 그 패턴을 따르든가;
보통 사용자한테 보여줄 내용은 상태코드랑 메시지가 다임.
어디론가로 리다이렉트 할수도 있고..)


# 단순 에러 던지기 :

    throw new Error('message')   <-- 익스프레스가 알아서 캐치함.


# 커스텀에러 던지기 :

    class AppError extends Error {
        constructor(status, message) {
            super();
            this.status = status;
            this.message = message;
        }
    }
    위처럼 Error를 상속하는 커스텀에러클래스 작성해서 export/import 하고 아래처럼 던짐
    throw new AppError(401, 'message')   <-- 이것도 Error를 상속한거니까 익스프레스가 알아서 캐치함.


# Async함수(라우트핸들러나 미들웨어에 의해 발동된) 내에서 에러처리 :

    DB조작함수 및 각종API들은 거의 다 async이기 때문에 중요한 내용임..

    직접 에러 던지기 :

        비동기함수인 경우는 그냥 throw new AppError(~) 하면 안되고,
        return next(new AppError(~)) 해줘야 동기함수에서랑 같은 결과를 얻을 수 있음.
        (return이 없다면 next아래에 있는 코드들이 계속 실행돼서 다른 오류가 또 뜰수도있음;)

    DB나 API등이 발생시킨 에러 가져와 처리하기 :

        거의 모든 비동기함수는 그 안에서 try-catch 를 통해 처리해야함.
            try { 비동기 코드들~ }
            catch (e) { next(e) }
        이게 제일 기본형태임.
        (참고로 try{ } 안에서 커스텀에러 등 던지려면 원래대로 throw 쓰셈.. return next() 말고..)
    
        그런데 모든비동기에 try-catch처리하기 귀찮으니까 함수를 따로 만드는것도 좋음.
        function wrapAsync(fn) {
            return function (req, res, next) {
                fn(req, res, next).catch(err => next(err))
            }
        }
        사용은 아래처럼.
        app.get('/products/:id', wrapAsync(async (req, res, next) => {  // next파라미터 추가해줘야함
            const product = await Product.findById(req.params.id);
            if (!product) {
                throw new AppError(404, 'Product Not Found😞');
            }
            res.render('products/show', { product })
        }))
        근데 이것마저도 귀찮아서 익스프레스5에서는 자동처리해줄예정(?) 아직까진 베터버전인듯
        강의듣고있는 2024.1 현재 익스프레스4.18.1


# 모든url공통 에러처리미들웨어 작성 :

    만약 특정 라우트에 에러던지는 미들웨어가 따로 있다면 거길 먼저 거친다음 err정보를 가지고 여기로 넘어옴.

    app.use((err, req, res, next) => {
        console.log('**********************ERROR**********************')

        // 커스텀에러클래스(status와 message를 가지는) 만들어서 라우트핸들러 내에서 에러를 던진 후 이 미들웨어로 넘어온 거라면?
        const { status = 500, message = 'Something Went Wrong!' } = err;   // 이렇게 구조분해하고 커스텀에러클래스를 사용하지 않은 라우트들을 위해 디폴트값도 설정한 후
        res.status(status).send(message);   // 응답처리.

        // res.status(500).send('<h1>🤨🤨🤨 WE GOT AN ERROR!!!</h1>')  // 뭐라도 응답해버리면 이걸로 에러처리는 끝.
        // next(err)  // 만약 마지막에 이렇게 한다면, 에러내용이 디폴트에러핸들러로 넘어감.
    })

    저렇게 4개의 파라미터가 있어야 에러처리미들웨어로 인식됨.
    라우터들 맨 아래에다 둬야 적용됨.


# 몽구스가 발생시킨 에러 종류별로 처리 :

    const handleValidationErr = err => {
        console.dir(err)  // 이 내용도 한번 쭉 보셈.
        return new Error(400, 'Validation Failed... ${err.message}');
    }
    에러종류별로 위와같은 처리함수 만들어놓고 아래처럼 미들웨어에서 사용.
    app.use((err, req, res, next) => {
        console.log(err.name)
        if (err.name === 'ValidationError') { err = handleValidationErr(err) }
        next(err)
    })