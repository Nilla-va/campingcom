
SSE :
Server-Sent Events
웹소켓이 양방향인 것과 달리 서버쪽에서 일방적으로 데이터전송.

원래 HTTP 요청은 1회 요청하면 1회 응답하고 연결이 끊어지는데,
헤더설정을 통해 연결을 끊지 않고 유지한 상태로 서버에서 응답을 계속 보낼 수 있음.

몽고DB에도 DB변동을 감시하다가 변동포착시 변화에대한 데이터를 보내주는 기능이 있는데,
그걸 change stream 이라고 부름


-----------------------------

이 프로젝트에는 쓸일이 없을거같아서 예시코드만 가져옴..


[SSE만들기]


# 서버사이드 :

    // SSE 엔드포인트
    app.get('/sse', (req, res) => {

    // 코딩애플예시

        res.writeHead(200, {
            'Connection': 'keep-alive',   // 응답후에도 끊기지 않음!
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
        })

        res.write('데이터')     // write로 원할때마다 클라이언트에 데이터전송 가능.

        res.write('event: 이벤트명\n')   // 만약 정확히 이 양식으로 작성하면
        res.write('data: 데이터\n\n')    // SSE를 수신하는 클라쪽에서 저 이벤트를 리슨가능.
                      // 데이터자리에는 따옴표없이 문자열이나 JSON으로 바꾼 어레이,옵젝 등(예: {"a": "abc"}) 넣으면 됨
     
    // GPT예시

        // 이벤트 발생 시마다 클라이언트에 메시지 전송 (예: 1초마다)
        const intervalId = setInterval(() => {
            res.write('데이터')
        }, 1000);
    
        // 클라이언트 연결 종료 시 clearInterval
        req.on('close', () => {
           clearInterval(intervalId);
        });

    });


# 클라이언트사이드 :
 
    <script>

    // 코딩애플예시

        // 이벤트소스 객체 생성후
        const eventSource = new EventSource('/sse');     // (sse라우트로 GET요청을 보내는 특수한 문법이라고 생각하면됨..)

        // 이벤트리스너 붙이기
        eventSource.addEventListener('이벤트명', function (e) {
            console.log(e.data)     // e.data 안에 저 이벤트명을 붙여 전송한 데이터가 들어있다.
        })

    // GPT예시

        // SSE 메시지 수신 시 처리
        eventSource.onmessage = (event) => {
            const message = document.createElement('p');
            message.textContent = event.data;
            sseMessages.appendChild(message);
        };
  
        // SSE 에러 처리
        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            eventSource.close();
        };

    </script>



[몽고DB-체인지스트림]


# 서버사이드 :

체인지스트림을 생성하는것 자체는
특정라우트로 요청보낼때마다 작동시키는것보다
서버실행하고DB연결하는 그부분에 넣어두고 한번만 실행되게 하는게 나음.

    async function main() {
        await mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {});
        console.log("DATABASE CONNECTED :D")

        // 감시조건 설정
        let option = [
            { $match: { operationType: 'insert' } }
        ]

        // post컬렉션에 대해 위 조건에 해당하는 DB변동을 감시watch하는 체인지스트림 생성
        let changeStream = db.collection('post').watch(option)

    }

그러고나서 SSE를 보내는 역할을 맡은 라우터핸들러에서
위에서 생성해둔 체인지스트림에 이벤트리스너를 붙여 보낼데이터 설정

    // SSE 엔드포인트
    app.get('/sse', (req, res) => {

        // 위에서 생성해둔 체인지스트림에 체인지이벤트리스너 붙여주기
        changeStream.on('change', (result) => {

            console.log(result)
            console.log(result.fullDocument)

            res.write('event: newPost\n')
            res.write(`data: ${JSON.stringify(result.fullDocument)}\n\n`)
        })

    });


# 클라이언트사이드 :

    <script>

        const eventSource = new EventSource('/sse');

        eventSource.addEventListener('newPost', function (e) {
            console.log(e.data)     // e.data 안에 저 이벤트명을 붙여 전송한 데이터가 들어있다.
            let data = JSON.parse(e.data)

            document.querySelector('글목록').insertAdjacentHTML('afterbegin', `<div>${data.title}</div>`)   // SSE로 받은 데이터 뷰페이지에 띄우기
        })

    </script>
