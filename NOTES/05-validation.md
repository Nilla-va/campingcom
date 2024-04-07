
[유효성검사]

클라이언트측/서버측에서 각각 유효성검사가 필요함.

-----------------------------

# Client-Side Validation

클라측 유효성검사는 부트스트랩에서 제공하는 코드 가져다 썼음.
(layout파일에 넣어놓고 new와 edit파일의 폼에 적용시킴,
기본브라우저유효성검사 끄기 위해 폼에 novalidate 써줌)

부트스트랩의 validation은 형식을 검사하는건 아니고..
비어있는 입력칸이 하나라도 있으면 폼 제출을 막고
사용자가 알수있도록 화면에 예쁘게 피드백해주는거임.

나중에 정규표현식, 길이 등 제약조건 추가한 후에는
부트스트랩의 css는 이용하되 클래스추가삭제 조건을 커스터마이징 했음
(validateFormUser.js 참고)

-----------------------------

근데 저렇게 해놔봐야.. AJAX, postman같은걸로 post요청하면 그냥 뚫림;
텅빈데이터 등등이 DB에 저장되어 버리는거임.
그래서 서버측 유효성검사가 더 중요함.

-----------------------------

# Server-Side Validation

서버측 유효성검사는 직접 코드짜면 헬임;
스키마 하나에도 수많은 필드가 있는데 하나하나 에러처리하려면 너무 힘드니까
많이 쓰이는 joi라는 라이브러리를 설치해서 썼음.
https://joi.dev/api/?v=17.9.1#introduction


(app.js에서 사용예시 긁어옴)

    app.post('/campgrounds', wrapAsync(async (req, res, next) => {

        /*
        if (!req.body.campground) throw new ExpressError(400, 'Invalid Campground Data.');
        if (!req.body.campground.title) {}
        if (!req.body.campground.location) {}
        ...
        이걸 항목마다 다 하고있을수는 없으니, joi라는 라이브러리를 쓸거임. */

        const campgroundSchema = Joi.object({ 
            campground: Joi.object({  // new.ejs 파일에서 인풋들의 name속성을 그룹화했으므로 그룹이름으로 옵젝이 하나 더 필요함.
                title: Joi.string().required(),
                location: Joi.string().required(),
                image: Joi.string().required(),
                price: Joi.number().required().min(0),
                description: Joi.string().required()
            }).required()  // 이 스키마는 몽고DB랑 아무상관 없음-_-;
        })

        const result = campgroundSchema.validate(req.body);    // 유효성검사대상으로는 req.body를 넣어주면 됨.
        console.log(result);  // 저 result출력해보면 { value: {}, error: {_original: {}, details: []} } 이런 구조로 되어있으므로 적절히 이용하자.

        // 음.. details안에 Object들이 배열로 들어있어서 각 에러메시지를 끄집어내려면 아래처럼 해야함.
        const { error } = campgroundSchema.validate(req.body);
        if (error) {
            const msg = error.details.map(obj => obj.message).join(', '); // 각 Object로부터 에러메시지들을 꺼내서 하나로 합침
            throw new ExpressError(400, msg);
        }

        // 위 유효성검사를 통과해야 아래 코드로 넘어가는거임.

        const campground = new Campground(req.body.campground);   // new.ejs 파일에서 인풋들의 name속성을 그룹화했으므로 req.body만 쓰면 안됨.
        await campground.save();
        res.redirect(`/campgrounds/${campground._id}`);

    }))

(나중에 middleware.js, validationSchemas.js 로 다 옮겼음)
