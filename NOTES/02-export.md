
[export/import]

노드 배우기 전, html파일에 js파일 여러개 연결해놓고 쓰던 때에는
링크순서만 제대로 지켰다면 그냥 서로의 변수함수에 다 접근할 수 있었는데,
노드시스템은 완전히 달라서
하나의 파일에서 공유가 되는부분과 안되는부분을 특정해 지정할 수 있다.

참고로..
exports / require : commonJS
export / import : ES6 신문법

require에 비해 import가 좋은 이유 :
모듈의 필요한 부분만 골라 가져올수있고 성능도 더 좋고 메모리도 절약됨


-----------------------------
# 내보내는 파일에서 (예: math.js)

아래처럼 함수2개와 상수1개가 있다고 치자.

const add = (x, y) => x + y;
const PI = 3.14159;
const square = x => x * x;


1. 각각 내보내기.

exports.square = square;   // 3개 중 2개만 내보내자.
exports.PI = PI;

원래는 아래가 full구문인데 줄여서 exports만 써도 됨. (기본예약어는 아니라서 저걸 변수로 써버리면 기능상실)
module.exports.add = add;
module.exports.PI = PI;
module.exports.square = square;


2. 오브젝트로 만들어서 한번에 내보내기.

module.exports = {   // "module.exports" 자체가 빈 오브젝트거든.
    add: add,
    pi: PI,
    square: square
}

export { add, PI as pi, square }   // ES6 구문을 써서 이렇게 해도 똑같음.


3. 디렉토리를 통째로 내보내기.

그러려면 파일들있는곳에 먼저 "index.js"라는 특별한파일을 만들어야함. 일종의 엔트리포인트.
const blue = require('./blue')
const sadie = require('./sadie')      // 그 안에서 먼저 개별파일들의 exports들을 require해오고 (당연히 각파일들 내에서 exports하고있겠지?)
const janet = require('./janet')
module.exports = [blue, sadie, janet]    // 배열에 넣고 exports해줌


4. default로 내보내기

ES6 구문으로 하나의 식별자를 대표로 내보낼수있음 (함수or클래스만 가능)
export default 함수명;
export default 클래스명;
export default { someFunc: ()=>{console.log('um..')} };  // 이렇게도 됨(!)



-----------------------------
# 가져오는 파일에서 (예: app.js)

const { pi, square } = require('./math')    // "파일경로" 잘 써주기, .js는 필요없음
console.log(pi)
console.log(square(9))

const cats = require('./shelter')    // "디렉토리경로" 잘 써주기.
console.log("REQUIRED AN ENTIRE DIRECTORY!", cats)


require 말고 import로 가져오면 모듈의 필요한 부분만 선택해서 가져올 수 있다.

각각 내보낸경우
import square from './math';            // 디폴트하나
import { pi, square } from './math';    // 여러개
import * from './math';                 // 전부

디폴트로 내보냈다면 새로운이름으로 가져오기도 됨. 보통은 똑같이 가져오지만..
import newName from './some/path';

