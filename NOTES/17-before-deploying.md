

배포 전에 몇가지 설정을 바꿔줘야함


-----------------------------

[클라우드DB]


Database서버를 집컴으로 할수는없으니.. 클라우드서비스를 써보자
MongoDB Atlas 가입하고 사용설정하는건 예전에 해봄.


# before: 로컬 몽고 접속

    const dbUrl = 'mongodb://127.0.0.1:27017/yelp-camp';
    await mongoose.connect(dbUrl, {});


# after: 클라우드 몽고 접속

    // 먼저 .env파일에 DB연결url 환경변수 등록
    DB_URL=mongodb+srv://admin:<admin의비밀번호>@cluster0.jmdnetw.mongodb.net/<데이터베이스명>?retryWrites=true&w=majority

    const dbUrl = process.env.DB_URL;
    await mongoose.connect(dbUrl, { serverApi: { version: '1', strict: true, deprecationErrors: true } });



[세션저장소]


개발중에는 세션정보가 메모리에 저장되는게 디폴트였는데
프로덕션환경에서는 그렇게 할 수 없으니 Mongo의 세션저장소를 써보자


# before: 메모리저장소 사용

    const sessionConfig = {  // resave랑 saveUninitialized는 내가 쓰는 세션저장소에 따라 설정을 다르게해야할거임..
        secret: 'key_for_signed_sessioncookies',
        resave: false,
        saveUninitialized: true,
        cookie: {
            name: 'session',   // 디폴트이름이 connect.sid인데 다른이름으로 바꿔놓는게 조금이라도 더 안전하니까..
            httpOnly: true,   // 간단한 보안설정, 클라이언트측 스크립트로 쿠키접근 못하게 막음 (해커가 크로스사이트스크립팅 결함을 이용해 어떤사용자를 쿠키/    세션정보요구하는 나쁜URL로 유인해도 브라우저가 서드파티에 쿠키를 노출하지 않음)
            // secure: true,   // 나중에 배포할때 켜야함
            expires: Date.now() + 1000*60*60*24*7,  // 단위가 밀리초라서.. 일주일을 저렇게 나타냄..
            maxAge: 1000*60*60*24*7
        }
    }
    app.use(session(sessionConfig))


# after: 몽고 세션저장소 사용

connect-mongo 패키지 :
MongoDB session store for Connect/Express written in Typescript.
자세한 옵션은 https://www.npmjs.com/package/connect-mongo 참고

    npm i connect-mongo   (express-session도 설치되어있어야함)

    const MongoStore = require('connect-mongo')   // express-session도 임포트


그리고 app.use를 원하는 옵션대로 아래처럼 작성함.

  - 가장 기본형태

    app.use(session({
        store: MongoStore.create({
            mongoUrl: dbUrl         // MongoDB 연결할때 사용한 url
            ttl: 14 * 24 * 3600     // 커넥트몽고는 만약 세션쿠키에 만료날짜가 있으면 그걸 이용, 없으면 이 ttl옵션값을 이용(작성안하면 디폴트는 14일)
        })
    }));

  - 페이지새로고침 시마다 모든세션을 재저장하지 않고 "Lazy"세션업뎃 하려면 아래 3가지 이용

    app.use(session({
        secret: 'keyboard cat',
        saveUninitialized: false,     // 뭔가 저장되기 전까진 세션을 생성하지 않음
        resave: false,                // 뭔가 수정되기 전까진 세션을 재저장하지 않음
        store: MongoStore.create({
            mongoUrl: dbUrl,
            touchAfter: 24 * 3600       // (= 초단위라서 24시간을 의미) 그래도 이 간격마다는 재저장함
        })
    }));

  - 만약 secret이 아주 민감한정보라면 암호화가능

    app.use(session({
        store: MongoStore.create({
            mongoUrl: dbUrl,
            crypto: {
                secret: 'keyboard cat'   // 여기에 넣으면 됨
            }
        })
    }));

프젝사이트 접속 후 몽고DB 확인해보면 sessions 컬렉션이 생성되어 있는걸 볼수있음.

