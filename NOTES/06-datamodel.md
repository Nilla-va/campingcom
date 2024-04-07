
## [데이터모델]


### 데이터 관계

one to few  (예: 유저와 그 유저의 배송지주소)
one to many  (예: 대학교와 그 학교의 학생)
one to 'bajillions(or squillions)'  (예: 어떤 고인물유저의 수십년간의 게시글들, 앞으로도 무한히 늘어날 수 있음)


-----------------------------

### 모델링하는 여러 방법들

=> 몽고는 RDB에 비해 자유도가 매우 높아
똑같은 데이터를 구조화하는 방법이 너무 다양해서
선배개발자들이 경험을 통해 만들어둔 틀? 원칙?을 참고할 필요가 있다.
핵심기준은 '액세스 패턴'임. 그 데이터로 무슨 작업을 할건지가 관건인거임.
또 앱수준에서의 조인도
https://www.mongodb.com/blog/post/6-rules-of-thumb-for-mongodb-schema-design 참고.


1. 모델분리 없이, 모델의 필드 안에 하위옵젝들을 직접 임베드

    일반적으로 1 to few 의 경우 적합하지만 더 중요한 판단기준은
    모델을 따로 분리해도 써먹을 일이 없는 경우만 직접 임베드 하라는거임.
    few지만 별도의 엔티티로 접근해야할 일이 있는 경우라면 임베드X.
    참고로 few는 최대 몇백개를 말함..

2. 부모모델의 필드 안에서 자식모델들을 옵젝ID로 참조

    부모모델의 필드 안에 자식모델옵젝ID들이 배열안에 쭉 들어가있는거임.
    1 to 수천 정도까지는 괜찮.. 그거 넘어가면 걍 3번으로 넘어가셈.
    배열이 무한정 길어지는 상황은 항상 피하라고..

    자식옵젝을 삭제하더라도
    부모옵젝한테 자식옵젝ID는 그대로 남아있기 때문에 부모도 따로 업뎃해줘야함.

3. 부모모델의 옵젝ID를 자식모델이 참조

    자식이 너무 많으면 부모필드에 너무 긴 배열이 생기므로
    자식한테 부모옵젝ID를 넣어주는게 나음
    자식옵젝 삭제할때 부모한테서 자식옵젝ID를 따로 삭제할 필요도 없음.

4. A모델과 B모델이 서로의 옵젝ID로 양방향참조

    양쪽모델 모두에 독립적으로 접근 및 참조데이터 소환이 자주 필요한 경우
    또는 두 모델이 부모자식관계가 아니고 다대다 관계인 경우

5. 비정규화(de-normalize), 똑같은데이터를 A모델과 B모델에 중복저장

    데이터를 수정할 일은 거의 없지만 매우 자주 접근해야하는 필드인 경우는
    정규화를 포기하고 필요한 모델들에 각각 중복 저장하는 것도 하나의 방법임.

    이건 모델과 모델을 '연결'하는게 아님.
    데이터 수정시에도 중복된곳들 다 수정해야함. 한번에 업뎃 불가.
    비정규화도 1→many 쪽으로 하거나 many→1 쪽으로 할수있다고 함.
    (비정규화는 공부할게많음.. 이건 나중에 블로그 정독해보셈)


-----------------------------

### 모델과 모델 연결하기

옵젝ID로 다른 모델을 참조하는 방법


먼저 스키마만드는 단계에서 다른모델을 참조할 필드를 
{ type: mongoose.Schema.Types.ObjectId, ref: '참조할모델명' } 이렇게 설정함.

    const mongoose = require('mongoose');
    const { Schema } = mongoose;

    const personSchema = Schema({
      _id: Schema.Types.ObjectId,
      name: String,
      age: Number,
      stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
    });

    const storySchema = Schema({
      author: { type: Schema.Types.ObjectId, ref: 'Person' },
      title: String,
      fans: [{ type: Schema.Types.ObjectId, ref: 'Person' }]
    });

    const Story = mongoose.model('Story', storySchema);
    const Person = mongoose.model('Person', personSchema);


실제데이터를 가지고 모델A옵젝 필드에 모델B옵젝을 넣을 때는
모델B옵젝의 옵젝ID만 가져와서 넣어도 되고,
모델B옵젝 자체를 넣더라도 DB조회해보면 알아서 옵젝ID만 들어가있음.
스키마 만들때 참조필드로 설정을 해놨기 때문에..

    const author = new Person({
      _id: new mongoose.Types.ObjectId(),
      name: 'Ian Fleming',
      age: 50
    });

    await author.save();

    const story1 = new Story({
      title: 'Casino Royale',
      author: author._id   // 이 경우는 옵젝ID만 가져와서 넣은거임.
    });

    await story1.save();


### POPULATE

(채워넣기 정도의 의미로 보면 될 듯;)

mongosh로 find해보면, 참조필드에는 다른모델옵젝의 옵젝id들만 보이는데,
만약 옵젝id만 있는게 아니라 옵젝자체를 넣어 가져오고싶다면
populate('채울필드명') 메서드를 체이닝해주면 됨.
만약 옵젝전체가 아니라 그 중 특정필드만 넣어 가져오고싶다면
populate('채울필드명, '하위필드명') 이렇게 다음파라미터 이용.
https://mongoosejs.com/docs/populate.html 참고.

    const story = await Story.findOne({ title: 'Casino Royale' })
        .populate('author')   // 이제 author필드에는 작가옵젝의 옵젝id만 보이는게 아니라 작가옵젝자체가 보임.
        .exec();
    console.log('The author is %s', story.author.name);  // prints "The author is Ian Fleming"

만약 sub-document에도 채워넣어야할 필드가 있다면?

    const campground = await Campground.findById(req.params.id)
        .populate('author')   // author필드를 유저옵젝으로 채움.
        .populate({ path: 'reviews', populate: { path: 'author', select: '_id username' } });   // reviews필드를 리뷰옵젝들로 채우고,
        // 각 리뷰옵젝 내의 author필드도 유저옵젝으로 채우되 id와 username으로만 채움
        // select에는 채워넣고싶은 필드명들을 ''안에 띄어쓰기로 구분해 넣음.


-----------------------------

### 연결된 모델이 있는 경우의 DELETE

만약 특정 유저를 삭제한다면 그 유저의 게시글,댓글 등등을 함께 삭제해야할 수 있다.
방법은 2가지임.

1. 
내가 직접 코드를 써서
이 컬렉션에서 조건걸고 삭제, 저 컬렉션에서도 조건걸고 삭제, ... 하기
이 방식도 나쁘지 않음.

또는

2. 
몽구스가 제공하는 pre/post 미들웨어 이용.
특정 미들웨어의 전/후에 실행할 내용을 정의할 수 있음.
스키마명.pre('미들웨어명', async ()=>{})
스키마명.post('미들웨어명', async ()=>{})
(models폴더의 user.js, campground.js 파일내용 참고)


근데 좀 사용이 복잡하다고 느낄수도 있음.

만약 내가 findByIdAndDelete(유저옵젝ID)를 하면서
그 유저와 관련된 다른모델의 옵젝들을 같이 삭제하려는 상황이라면?
일단 나는 위 메서드에서 반환된 삭제된옵젝을 이용할거기 때문에 post를 써야함.

그런데 이때 '미들웨어명' 자리에 findByIdAndDelete 를 쓰면 안되고
findOneAndDelete 를 써줘야함.. 왜냐면
findByIdAndDelete(id) 는 사실 '기본'쿼리미들웨어가 아니라,
findOneAndDelete({_id: id}) 이라는 '기본'쿼리미들웨어의 축약형태일뿐이기 때문임.
'기본'미들웨어 목록은 https://mongoosejs.com/docs/middleware.html 참고.

아래 코드는 userSchema스키마 정의코드와 User모델 생성코드 사이에 작성했음
(해당 모델파일에서 Post모델 임포트 해야함)

    userSchema.post('findOneAndDelete', async function (user) {   // 삭제된유저데이터가 넘어옴
        if (user.posts.length) {                                  // 그 유저가 작성한 게시글이 존재한다면
            await Post.deleteMany( { _id: {$in: user.posts} } )   // 그 게시글배열의 옵젝id와 일치하는 게시글 전부 posts컬렉션으로부터 삭제.
            // 위 삭제결과를 const res로 받으면 그 안에 삭제개수가 들어있음
        }
    })


-----------------------------

쿼리 연산자 ($ls 등등) 목록
https://www.mongodb.com/docs/manual/reference/operator/query/#std-label-query-selectors

업뎃 연산자 ($set 등등) 목록
https://www.mongodb.com/docs/manual/reference/operator/update/