
## [인증구현-Passport]

앞에서는 bcrypt를 이용해 직접 인증절차를 만들어봤는데,
이제 원리는 아니까 노드용 Auth라이브러리인 Passport를 이용하자..
직접 짜는 것보다 훨씬 쉽게 구현할 수 있고
로컬아이디비번으로인증, JWT(json web tokens)인증, 구글/페북/깃허브계정으로인증 등등
인증전략 선택도 가능. https://www.passportjs.org/packages/ 참고.

Local username-password 방식을 쓴다면,
패스포트-로컬에 특화된 몽구스를 같이 써보자.
https://www.npmjs.com/package/passport-local-mongoose
https://github.com/saintedlama/passport-local-mongoose 참고.


-----------------------------

## [passport] [passport-local-mongoose]


### 메인 파일에서

express와 express-session은 이미 설치되어있다고 치고

    npm i passport
    npm i passport-local
    npm i passport-local-mongoose

    const passport = require('passport')
    const localStrategy = require('passport-local')


그리고 app.use에 패스포트초기화 메서드와 로그인유지세션을쓰기위한 메서드 넣어줌..
(주의! 반드시 익스프레스세션의 session()코드 '아래'에 넣어야 로그인세션이 올바른 순서로 저장됨)

    app.use(session(sessionConfig))
    밑에
    app.use(passport.initialize())
    app.use(passport.session())

    const User = require('./models/user');
    passport.use(new LocalStrategy(User.authenticate()))   // 안녕 패스포트, 난 로컬인증을 쓸거고, 인증메서드는 User모델에 있어!
    passport.serializeUser(User.serializeUser())           // 그리고 직렬화(세션에저장)메서드도 User모델에 있어!
    passport.deserializeUser(User.deserializeUser())       // 역직렬화(저장한거꺼내옴)메서드도 User모델에..-_-


아래 모델파일에서 패스포트-로컬 몽구스가 자동으로 만들어준 메서드들을 위와같이 패스포트한테 등록해줌.



### 모델 파일에서

패스포트-로컬 몽구스를 쓰면 스키마 생성방식도 달라짐.

    const mongoose = require('mongoose')
    const Schema = mongoose.Schema
    const passportLocalMongoose = require('passport-local-mongoose')   // ⭐패스포트-로컬에 특화된 몽구스

    const userSchema = new Schema({
        email: {
            type: String,
            required: true,
            unique: true,   // 유효성검사 미들웨어가 있다고해도 이 설정이 쓰이지는 않는다고 함..(그게 뭔소리임?-_-??)
        }
    })

    userSchema.plugin(passportLocalMongoose)

스키마정의부분에서는 이메일필드만 생성하고, 그다음 플러그인 코드를 쓰면,
PL몽구스가 내 스키마에 username, hash(암호화한비번), salt필드를 알아서 추가해줌
(참고로 bcrypt말고 Pbkdf2라는 해시알고리즘을 써서 암호화한다고함. 플랫폼에독립적인 알고리즘이래..)

username중복여부확인 등 static메서드들도 추가해줌
메서드목록: authenticate(), serializeUser(), deserializeUser(), register(user, password, cb), findByUsername(), createStrategy()
https://github.com/saintedlama/passport-local-mongoose 참고.

아무튼 이래서 배우는사람입장에선 passport부터 쓰는게 안좋다는거임.. 과정이 다 숨겨져있어서



### 라우터 파일에서

라우트를 분리한 경우 여기에도 패스포트 임포트해줘야함.
패스포트-로컬 몽구스가 정적메서드들을 추가해놓은 User모델도 임포트.

    const passport = require('passport')
    const User = require('../models/user')


회원가입폼 작성후 전송 시 :
핵심은 register메서드임. 폼으로부터 입력받은 비밀번호를 알아서 salt+hash처리 해서 DB에 넣어주고,
이미 존재하는 유저네임 또는 이메일인 경우 패스포트가 알아서 오류도 발생시켜주므로 우리는 캐치해서 쓰기만하면 됨.
회원가입 완료 시 자동으로 로그인까지 되게 하려면 패스포트가 제공하는 로그인메서드 req.login(user옵젝, 콜백) 사용.

    router.post('/register', wrapAsync(async (req, res) => {

        // 이미 wrapAsync로 감쌌지만.. '이미사용중'오류의 경우 공통에러화면으로 넘어가게하고싶지 않으므로 또 try-catch함..
        try {
            const { email, username, password } = req.body.user;
            const user = new User({ email, username });                  // 일단 비밀번호는 빼고 유저도큐생성
            const registeredUser = await User.register(user, password);  // 생성한인스턴스와 비밀번호를 넣어 register메서드 사용

            // 회원가입 완료 시 자동으로 로그인까지 되게 하려면?
            req.login(registeredUser, (err) => {   // 방금register한 유저옵젝과 로그인에 이어 수행할 작업을 콜백형태로 넣음.
                if (err) return next(err);
                req.flash('success', 'Welcome to CAMPGROUNDS!')
                res.redirect('/campgrounds')
            })

        } catch (error) {
            req.flash('danger', error.message)   // 저기에는 패스포트가 만들어준 오류메시지가 들어있음
            res.redirect('/register')
        }
    }))


로그인폼 채워서 전송 시 :
패스포트의 인증절차 수행해주는 미들웨어passport.authenticate() 를 여기 넣어줌.
폼으로부터 입력받은 정보로 DB에 존재하는 사용자인지, 비번은 일치하는지 등 확인해줌.
존재하지않는사용자, 비번불일치 등 인증실패시 flash 쓰려면 내가 설정해둔 키이름 중 하나 지정해주면 됨
passport.authenticate는 인증이 완료되면 req.login()을 자동으로 호출해서 로그인시킴.

    router.post('/login', passport.authenticate('local', { failureFlash: {type: 'danger'}, failureRedirect: '/login' }), (req, res) => {
        req.flash('success', 'Welcome back!')
        res.redirect('/campgrounds')
    })

    만약 로그인 시 로그인직전의 페이지로 돌아가게 하고 싶다면, 아래와 같이
    req.session에 저장한 url을 다른곳에 저장해두는 미들웨어를 만들어 먼저 실행 --> authenticate를 실행 --> 저장된url로 리디렉트.

    router.post('/login',
                [ storeReturnTo, passport.authenticate('local', { failureFlash: {type: 'danger'}, failureRedirect: '/login' }) ],
                (req, res) => {
        req.flash('success', 'Welcome back!')
        const redirectUrl = res.locals.returnTo || '/campgrounds';
        res.redirect(redirectUrl);
    })


로그아웃 시 :
패스포트가 제공하는 로그아웃메서드 req.logout(콜백) 이용.

    router.get('/logout', (req, res) => {
        req.logout((err) => {   // 로그아웃에 이어 수행할 작업을 콜백형태로 넣음.
            if (err) {
                return next(err)
            }
            req.flash('success', 'Goodbye!')
            res.redirect('/campgrounds')
        })
    })


-----------------------------

## [미들웨어들]


여러 라우터파일에 공통적용될만한 미들웨어들은
메인파일 맨 위에 두거나..
middleware.js에 따로 모아두고 각라우터파일에서 필요한 미들웨어명만 임포트.


### 현재로그인된사용자

req.user옵젝에는 로그인된 사용자의 데이터(비번은제외)가 들어있음. 로그아웃상태라면 undefined
모든 라우트에 플래시메시지 전달하는 데 썼던 그 미들웨어에
현재 로그인된 사용자의 정보도 같이 넣어 전달하면 편함..

    app.use((req, res, next) => {
        res.locals.success = req.flash('success')
        res.locals.warning = req.flash('warning')
        res.locals.danger = req.flash('danger')
        res.locals.currentUser = req.user;   // 이제 모든 뷰페이지에서 <%= currentUser %> 로 현재사용자정보를 꺼내쓸수있음.
        next();
    })


### 로그인확인

req.isAuthenticated()로 로그인한(=인증된) 상태인지 확인 후, 미인증상태라면
현재머물던페이지 url을 세션에 저장해놓고 로그인페이지로 리디렉트시키는 미들웨어

    module.exports.isLoggedIn = (req, res, next) => {

        if (!req.isAuthenticated()) {    // 로그인한상태인지(=인증된사용자인지) 확인하는 코드.
            req.session.returnTo = req.originalUrl    // 현재페이지의 url을 세션에 저장.
            req.flash('warning', 'You must be signed in!')
            return res.redirect('/login')
        }
        next();   // 미들웨어로 따로 뺀 경우 꼭 필요함..
    }


### 이전페이지기억

(이 미들웨어는 사실 저 위에있는 로그인확인 미들웨어와 이어지는 내용임.)

로그인 시 직전에 머물던 페이지로 돌아가기위해 세션정보 저장해두는 미들웨어
passport.authenticate()가 보안개선을 하면서, 로그인 후 세션을 지우도록 변경됨.. 그래서
req.session에 저장해놓은 url을 사용하지 못하기 때문에 미리 res.locals에 저장해둬야만
그 url을 가져와 거기로 리디렉트 할수있음.

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;   // 세션에 저장했던 값을 res.locals에 저장
    }
    next();
}


-----------------------------

## [serialize란?]

직렬화(Serialize) :
프로그램의 object에 담긴 데이터를 어떤 외부 파일에 write 및 전송하는 것
 
역직렬화(Deserialize) :
어떤 외부 파일의 데이터를 프로그램 내의 object로 read 해오는 것

네트워크 통신에서 객체 또는 클래스 직렬화의 의미는 다음과 같다.

상대 호스트와 데이터를 주고 받을 때 데이터의 종류는 int, double 과 같은 기본 타입일 수도 있지만, 포인터 타입을 가질 수도 있다. 또한 바이트가 연속적이지 않은 NON-POD 타입일 수 있다.(i.e. 가상 함수 또는 vector를 멤버로 가지는 클래스 타입 등) 기본 타입은 그 값 그대로 유효하지만 포인터 타입은 그렇지 않다. 포인터 타입은 어떤 유효한 값에 대한 주소를 가지는데, 이는 자신의 컴퓨터의 메모리 주소에 해당하기 때문에 상대방의 동일한 주소에도 동일한 값이 들어 있다고 확신할 수 없다. 따라서 포인터를 그대로 넘기면 이상한 값을 가리키게 될 수 있다. 클래스 타입도 마찬가지다.

이러한 이유로 데이터를 그대로 전송하지 않고, 전송할 데이터들을 하나의 버퍼에 연속된 비트 단위로 길게 나열하여 연속으로 저장하는 방식을 객체 직렬화라고 한다. 직렬화된 버퍼를 수신하면 다시 객체의 각 멤버 타입에 맞게 분리(역직렬화)하여 데이터를 복구한다.
