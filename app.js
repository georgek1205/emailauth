import express from 'express'
import emailverifyRoute from './routes/emailverifyRoute.js'

const app = express()
const PORT = 3000
app.use(express.json());


//라우터 처리; 미들웨어 app.use()로 라우터 엔트리를 '/email'로 작성했기 때문에
//내부의 모든 주소는 '/user'이후로 간주한다.
app.use("/email", emailverifyRoute);

// 서버 시작
app.listen(PORT, () => {
  console.log("서버가 http://localhost:3000 에서 실행 중입니다.");
});
