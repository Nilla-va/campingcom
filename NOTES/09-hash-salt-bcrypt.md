
[인증구현]

Authentication vs Authorization
인증과 권한의 개념에 대해서는 자바 스프링시큐리티 강의에서 배웠음 이미..


-----------------------------

# Hashes

해시함수 자체를 깊이 파는건 웹개발이 목적인 우리한텐 부적합..
해시의 개념과 아래 흐름만 알아두자
임의의크기의입력값(keys) ---> 해시함수(hash function) ---> 고정된크기의출력값(hashes)

해시함수는 단순한 것에서부터 매우복잡한 것까지 다양하지만 (우린 이미 SHA-256 써봤음),
비밀번호를 암호화하는 용도로 쓰고자 한다면 아래사항은 충족해야함.

    Cryptographic Hash Functions :
    1. 역추정할수없는 단방향one-way함수여야함 (단방향의 아주간단한 예가 절대값임)
    2. 입력값이 아주조금만 달라져도 출력값은 매우 크게 변해야함
    3. 결정론적 성질 - 입력값이 동일하면 출력값도 같아야함
    4. 서로 다른 입력값이 동일한 출력값으로 해시될 확률이 매우매우매우극히 낮아야함
    5. 느려야함 (해시되는 속도를 일부러 느리게 조정해서 침입자가 몇천만몇십억개의 암호를 해시시도하는 속도를 늦춤)


# Salts

내가 해커라고 치고, 데이터베이스에 침입해 암호화된 비밀번호 목록을 얻었다고 하자.
암호화 전의 비밀번호들을 알아내려면?

    먼저 비밀번호로 쓰일만한 모든 문자열에 대해 해시값을 미리 계산해놓는다.
    (이 데이터베이스가 무슨 해시함수를 써서 암호화했는지 알아낼 것도 없는게..
    pw암호화용 해시알고리즘은 사실 몇개없어서 그냥 거의 모든 사이트가 bcrypt를 쓴다고 보면 되기 때문;)

    그리고 데이터베이스에서 내가계산해놓은값과 일치하는값들을 발견하면 걔네들은 털린거임..-_-;

해시값 하나만 보고는 비밀번호를 역추정할 수 없지만, 방대한 목록을 가진 경우 위와같이 일부를 알아낼수있다.
생각보다 훨씬 많은 사람들이 매우단순한 비밀번호를 사용하고, 매우많은사람들이 서로 똑같은 비밀번호를 쓰기 때문에
(검색해보면 많이 쓰이는 비밀번호 순위와 사용비율에 대한 통계자료까지 돌아다님;) 치명적임.
그래서 추가적인 보안장치가 필요한데, 그게 salt임

비밀번호문자열에 '랜덤'문자열을 뿌려준다음(그래서 소금임-_-?) 해시하는거임.
그러면 똑같은 비밀번호를 써도 해시값은 전부 다르게 되어 위 방법으로 역추정이 어려워짐. (salt값을 알더라도!)
데이터베이스에는 hash값과 함께 salt값도 같이 저장되어야 함.
그래야 auth절차에서 입력받은비번에 salt값을 더해 해시결과를 비교해서 맞는지 틀린지 확인할수있음..


-----------------------------

# bcrypt

패스워드 암호화용으로 사용되는 해시알고리즘은 사실 몇개없음.
제일 흔한게 bcrypt(비-크립트)인데, 거의 모든 프로그래밍언어에서 구현되어있음.

bcrypt로 비밀번호 암호화하게 해주는 노드패키지로는 2가지가 있는데,
bcrypt는 노드가 대상인 서버사이드js로 작성돼서 브라우저에서 실행 X
bcryptjs는 js코드로만 쓰여서 브라우저에서도 실행된다고 함. 근데 지금 우린 필요없음

npm i bcrypt
const bcrypt = require('bcrypt')


비밀번호문자열과 해시속도값(12가 적당.. 숫자가 17만 되어도 꽤 느려짐ㄷㄷ)만 넣어주면
패키지가 알아서 salt뿌려서 해시해줌.
우리가 따로 DB에 salt를 저장할 필요도 없음. 그냥 암호화된 결과값만 저장하면 됨.
기억해야할 메서드는 2개임. hash()와 compare() .. 둘다 비동기로 써야함!

    const hashPassword = async (pw) => {
        const salt = await bcrypt.genSalt(12);   // 원하는 속도로 salt생성하고 해시값 얻기
        console.log(salt);
        const hash = await bcrypt.hash(pw, salt);
        console.log(hash);

    //  const hash = await bcrypt.hash(pw, 12)   // salt값을 따로 보고싶은게 아니라면 이렇게 한줄로 처리할수도있음.
    }

    const login = async (pw, hashedPw) => {
        const result = await bcrypt.compare(pw, hashedPw);   // 일치하면 true 반환
        if (result) {
            console.log('LOGGED YOU IN! SUCCESSFUL MATCH!')
        } else {
            console.log('INCORRECT!')
        }
    }
