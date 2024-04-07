
DB에 이미지도 저장될까? :

몽고DB에는 기본적으로 텍스트데이터만 저장할수있다
(BSON의 도큐별 용량한도가 16메가라는 것부터가 한계임..)
물론 몽고에도 GridFS를 써서 이미지같은걸 저장할 수는 있다고 함.

하지만 개발자들은 주로 cloudinary나 AWS같은 웹서비스를 이용,
거기에 비텍스트데이터(이미지,영상 등) 파일을 업로드하고
DB에는 파일의 주소만 저장하는 방식을 쓴다고 함.

cloudinary API Docs 참고.. 기능 엄청많음ㄷㄷ
https://cloudinary.com/documentation/transformation_reference

(개발중에는 로컬의 디스크/메모리에 저장할 수도 있지만.. 프로덕션용으로는 부적절)


-----------------------------

[파일인풋]

# HTML Form에서 파일입력

폼에 로컬파일을 선택해 입력할수있게 하려면  

    form태그 - enctype="multipart/form-data"
    input태그 - type="file" multiple(여러개입력허용시)

그런데 폼제출해서 req.body 출력해보면 {} 이렇게 비어있음.
인코딩타입이 multipart/form-data인 경우
폼으로부터 전송된 데이터를 파싱하는 절차가 필요하기 때문..



[파싱&업로드]

# Multer

multipart폼데이터 파싱 및 업로드를 위해 많이쓰이는 패키지가 Multer임.
https://www.npmjs.com/package/multer 참고

    npm i multer

멀터는 내장-body파싱-미들웨어 같은 역할로, req에 옵젝몇가지를 추가해줌.
이제 폼입력값중 텍스트는 req.body 에,
업로드한파일은 req.file / req.files (multiple지정시) 에 들어있게 됨.
아래 코드는 업로드용라우트핸들러가 있는 파일에 쓰면 됨

    const multer = require('multer')
    const upload = multer({ dest: 'uploads/' })   // 업로드 설정 - 로컬 폴더(프젝디렉토리 안에 만든)에 저장 시

위에서 설정한 upload의 미들웨어는 업로드를 수행할 라우트에 적용하면 됨
multiple이 아닌 경우 upload.single(), req.file 사용
multiple인 경우 upload.array(), req.files 사용

    app.post('/create', upload.single('file인풋태그의name속성값'), (req, res) => {
        console.log(req.body, req.file)
    })

    app.post('/create', upload.array('file인풋태그의name속성값'), (req, res) => {
        console.log(req.body, req.files)
    })


# Multer-Storage-Cloudinary

Multer를 쓰면서 업로드장소가 Cloudinary인 경우 이 저장엔진을 쓰면 편함.
https://www.npmjs.com/package/multer-storage-cloudinary 참고
(다른 저장웹서비스를 쓰고있다면 그에 맞는 다른 패키지 쓰면 되는듯)

    npm i cloudinary  (cloudinary도 설치되어있어야 함)
    npm i multer-storage-cloudinary


아래 코드는 cloudinary용 폴더를 따로 만들어서 그 안의 index.js파일에 작성하자..

    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({                        // 내 Cloudinary계정 연결
        cloud_name: CLOUDINARY_CLOUD_NAME,     // 환경변수로 정의해놓은 크레덴셜들..
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    })

    const storage = new CloudinaryStorage({    // 저장엔진한테 내앱과연결한cloudinary, 저장소내저장폴더명, 허용포맷 등 설정
        cloudinary: cloudinary,
        params: {
            folder: 'Campgrounds',
            allowedFormats: ['jpg', 'jpeg', 'png']
        }
    })

    module.exports = { cloudinary, storage };


라우트핸들러있는 파일로 돌아와서 multer의 업로드설정을 바꿔줌

    const { storage } = require('../cloudinary')
    const upload = multer({ storage, limits: { files: 5, fileSize: 1024*1024*5 } })   // 업로드 설정 - cloudinary에 저장 시 (제한조건은 파일5개, 5MB)

이제 req.file / req.files 안에는 업로드한 파일별로 옵젝이 들어있는데,
fieldname(name속성값), originalname(원본파일명), path(저장한파일의CloudinaryURL), filename(랜덤문자열,ID로이용)
등의 키-값쌍들이 포함되어있음.
라우트핸들러 콜백에서 저 값들 중 무엇을 꺼내다가 DB에 어떻게 넣을지 작업하면 됨.



[궁금한점]

# 몽구스스키마, joi스키마 수정필요

몽고DB에는 어차피 문자열만 넣을거니까 별 문제 없는데..
조이스키마는 어떻게 작성해야하는거임?==
req.files에 들어가는 필드는 제외하고 req.body에 들어가는 필드만 작성해야하나??

# 업로드미들웨어와 유효성검사미들웨어 순서 문제

multer 파서는 파싱과 업로드를 동시에 한다는 게 문제인데..
파싱된 req.body가 있어야만 유효성검사가 가능하므로
multer미들웨어 뒤에 유효성검사미들웨어를 넣어야 작동함..
근데 누가 유효성검사 전에 업로드를 완료하는 식으로 코드를 짬??==
이부분에 대해서는 다른방법을 찾아봐야할듯.
