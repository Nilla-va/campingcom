


-----------------------------

[환경변수] (개발단계에서)


# .env 와 dotenv

이미지파일업로드를 위해 cloudinary에 가입하면 API Key 등 크레덴셜들이 생성되는데
내 프로젝트와 연결하기 위해 저 값들을 변수에 저장해야함..
그런데 깃허브등에 프젝올리면 크레덴셜이 노출되므로
따로 환경변수 파일을 만들어 거기에 노출되면 안되는 값들을 모아놓고 깃대상에서 제외.

프젝디렉토리 밑에 .env (앞에 . 붙으면 숨김파일) 파일 생성하고, 환경변수 키-값쌍 작성

    API_KEY=123456789
    API_SECRET=lolololol

저 파일을 내 노드프로젝트가 인식할 수 있게하는 dotenv패키지를 설치하자.
dotenv는 .env 파일의 환경변수들을 process.env 파일에 추가해준다고 함.

    npm i dotenv

이 작업은 개발모드일때 필요한거니까 아래처럼 if문 안에 넣어서 임포트.
(프로덕션환경에서는 환경변수를 파일에 저장하는게 아니고 다른방식쓴다고 나중에 배운다함)

    if (process.env.NODE_ENV !== 'production') {
        require('dotenv').config();
    }

이제 process.env.API_KEY  process.env.API_SECRET 이런형태로 변수값을 쓸수있음.