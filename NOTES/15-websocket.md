
WebSocket :
SSE가 단방향인 것과 달리 서버와 클라이언트 간에 양방향 데이터전송.


-----------------------------

[socket.io]


Socket.io 연결은 웹소켓뿐만아니라 다른 low-level 트랜스포트들과도 설정가능.

- HTTP long-polling
- WebSocket
- WebTransport


# WebSocket과의 관계

아래는 GPT설명
웹 소켓은 HTML5에서 도입된 프로토콜로, 양방향 통신을 지원하는 표준화된 프로토콜입니다. 반면에
Socket.IO는 웹 소켓을 기반으로 한 라이브러리로, 실시간 양방향 통신을 단순화하고 보다 많은 기능을 제공합니다.

프로토콜 :

  - 웹 소켓:
    웹 소켓은 표준화된 프로토콜로, RFC 6455에 정의되어 있습니다. 
  - Socket.IO:
    Socket.IO는 웹 소켓을 기반으로 하지만, 더 많은 기능을 제공하기 위해 여러 프로토콜을 사용합니다.
    처음에는 웹 소켓을 사용하고, 만약 웹 소켓이 지원되지 않을 경우에는 폴백(fallback) 기술을 사용하여
    다른 트랜스포트(예: 폴링)을 선택합니다.

기능 :

  - 웹 소켓:
    기본적인 양방향 통신을 지원하며, 메시지를 전송하는 데에 중점을 둡니다.
  - Socket.IO:
    다양한 기능을 제공하며, 실시간 양방향 통신 외에도
    방(Room), 이름 공간(Namespace), 중복 접속 방지 등의 기능을 포함하고 있습니다.
  
호환성 :
  
  - 웹 소켓:
    모던 브라우저와 다수의 서버에서 기본적으로 지원됩니다.
  - Socket.IO:
    웹 소켓을 지원하지 않는 환경에서도 동작할 수 있도록 다양한 트랜스포트 기술을 사용하므로 더 높은 호환성을 제공합니다.
    Socket.IO는 웹 소켓을 기반으로 하지만, 훨씬 유연하고 기능이 풍부한 라이브러리로,
    특히 웹 소켓이 지원되지 않는 환경에서도 적용할 수 있습니다.
    따라서 프로젝트의 요구 사항에 따라 웹 소켓이나 Socket.IO 중에서 선택할 수 있습니다.


# 상황별 Emit/Listen/Broadcast 그리고 Rooms 기능

지금 당장 쓸일이 없어서.. 나중에 필요하면 공부하셈-_-;

    https://socket.io/docs/v4/emitting-events/
    https://socket.io/docs/v4/listening-to-events/
    https://socket.io/docs/v4/broadcasting-events/    예: 서버로 전송한유저 뺴고 나머지 유저에게만 emit하고싶을때
    https://socket.io/docs/v4/rooms/                  예: 회원기능있는 앱에서 특정유저들간에만 양방향소통이 필요할때
    https://socket.io/docs/v4/server-socket-instance/#socketrooms


-----------------------------

[채팅구현]


로그인,사용자인증 고려하지않은 룸도없는 매우간단한채팅박스 예시
Mongoose X Socket.io 조합
노드,익스프레스,http,바디파서,부트스트랩,제이쿼리 쓴다는 전제


# 서버사이드 :

socket.io / http 패키지 :

    npm install socket.io http  (-s는 왜?)

    const { createServer } = require("http");
    const { Server } = require("socket.io");
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, { /* options */ });    // https://socket.io/docs/v4/server-options/ 옵션참조.

    io.on("connection", (socket) => {     // ⭐어떤유저가 socket에 연결하면 인지함
        console.log(socket.id);           // 그 연결에 배정된 ID 확인가능
    });

    httpServer.listen(3000);
    
    app.listen(3000, () => {    // 주의!! 이제 내가원래쓰던 이 코드는 더이상 작동하지 않는다.
        console.log('Serving on port 3000')
    })

채팅메시지 몽구스스키마 :

    const Message = mongoose.model('Message', { name: String, message: String })

라우트핸들러 :

    // 모든메시지 GET
    app.get('/messages', (req, res) => {
        Message.find({},(err, messages)=> {
          res.send(messages);
        })
    })

    // 새메시지 POST
    app.post('/messages', (req, res) => {
        const message = new Message(req.body);
        message.save((err) =>{              // DB에 새메시지 저장한 뒤..
            if(err) sendStatus(500);
            io.emit('message', req.body);   // ⭐웹소켓에 연결되어있는 모든 유저들에게 'message'라는 이름표붙여 내보내기
            res.sendStatus(200);
        })
    })


# 클라이언트사이드:

채팅창 레이아웃 :

    <div class="container">
        <br>
        <div class="jumbotron">
            <h1 class="display-4">Send Message</h1>
            <br>
            <input id = "name" class="form-control" placeholder="Name">
            <br>
            <textarea id = "message" class="form-control" placeholder="Your Message Here"></textarea>
            <br>
            <button id="send" class="btn btn-success">Send</button>
        </div>
        <div id="messages">
            <!-- 여기는 주고받은 메시지들이 출력되는 div -->
        </div>
    </div>

아이폰스타일 챗박스는 아래 코드펜 참고
https://codepen.io/adobewordpress/pen/wGGMaV


스크립트 :

    <script src="/socket.io/socket.io.js"></script>   // socket.io 임포트

    <script>

        // 웹소켓에 연결
        const socket = io();
        // const socket = io("/admin");  // 이런식으로 특정 네임스페이스만 쓰는것도 가능

        // 참고: 만약 서버랑 프론트랑 도메인이 다르면, 서버도메인 넣어서 연결
        const socket = io("https://server-domain.com");  
        const socket = io("https://server-domain.com/admin");

        // 참고: 각각의 새 연결은 20글자의 랜덤id를 배정받음.. socket.id로 확인가능
        socket.on('connect', () => {
            console.log(socket.id);
        })

        // ⭐'message'라는 이름표붙은 데이터를 받으면 addMessages함수 실행
        socket.on('message', addMessages)

        // 참고: 반대로 서버에게 이름표붙여 데이터를 보내려면
        socket.emit('greeting', 'hello');    // 참고로 SSE와 달리 배열,옵젝 등 보낼 때 JSON.stringify할 필요 없음!

        ---------

        // 전송버튼 누르면 서버한테 작성한메시지 보내고 모든메시지 받아오는 함수 실행
        $(() => {
            $("#send").click(() => {
                sendMessage({
                    name: $("#name").val(), 
                    message:$("#message").val()});
                })
            getMessages()
        })

        // 뷰페이지에 메시지를 추가로 띄워주는 함수
        function addMessages(message) {
            $("#messages").append(`
                <h4> ${message.name} </h4>
                <p>  ${message.message} </p>
            `)
        }

        // 서버로부터 모든메시지 받아와서 각각에 대해 뷰페이지출력 함수 실행
        function getMessages() {
            $.get('http://localhost:3000/messages', (data) => {
                data.forEach(addMessages);
            })
        }

        // 서버한테 작성한메시지 전송하는 함수
        function sendMessage(message) {
            $.post('http://localhost:3000/messages', message)
        }

    </script>






