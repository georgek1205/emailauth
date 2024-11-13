import {db} from '../config/db.js'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import dotenv from "dotenv"
dotenv.config()

// Nodemailer 설정
const smtpTransport = nodemailer.createTransport({
    service: "Naver",
    auth: {
      user: process.env.user, // 자신의 네이버 이메일 주소
      pass: process.env.pass, // 자신의 네이버 이메일 비밀번호
    },
  });


// 메모리 내 임시 저장소 (이메일과 인증 코드를 저장하는 객체)
const verificationCodes = {};

// 인증 코드 생성 함수
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 숫자 코드
}

// 인증 코드 발송 API
export const sendVerificationCode =  async(req, res) => {

  try {
      const { email } = req.body;
    
      if (!email) {
        return res.status(400).json({ ok: false, msg: "이메일 주소를 입력해 주세요." });
      }
    
      const verificationCode = generateVerificationCode();
      const expires = Date.now() + 10 * 60 * 1000; // 유효기간: 10분 후
    
      // 코드와 만료 시간 저장
      verificationCodes[email] = { code: verificationCode, expires };
      // verificationCodes = {
      //   "user@example.com": { code: "123456", expires: 1680000000000 }
      // }; 형태로 저장
    
      const mailOptions = {
        from: process.env.user,
        to: email,
        subject: "Your Email Verification Code",
        text: `Your verification code is ${verificationCode}. This code will expire in 10 minutes.`,
      };

      const response = await smtpTransport.sendMail(mailOptions);

      console.log("메일 전송 성공:", response);
      return res.json({ ok: true, msg: "메일 전송에 성공하였습니다." });
    
  } catch (err) {
      console.error("메일 전송 실패:", err);
      return res.status(500).json({ ok: false, msg: "메일 전송에 실패하였습니다." });
  }
};


// 인증 코드 검증 API
export const verifyCode = async(req, res) => {

  try {
      const { email, code } = req.body;
    
      if (!email || !code) {
        return res.status(400).json({ ok: false, msg: "이메일과 인증 코드를 입력해 주세요." });
      }
    
      const record = verificationCodes[email];
      if (!record) {
        return res.status(400).json({ ok: false, msg: "인증 코드가 존재하지 않습니다." });
      }
    
      const { code: storedCode, expires } = record;
    
      if (Date.now() > expires) {
        delete verificationCodes[email];
        return res.status(400).json({ ok: false, msg: "인증 코드가 만료되었습니다." });
      }
    
      if (storedCode !== code) {
        return res.status(400).json({ ok: false, msg: "인증 코드가 일치하지 않습니다." });
      }
    

      // 인증 성공 후, 비번 암호화 후 저장
      verificationCodes[email].verified = true
      return res.json({ ok: true, msg: "인증에 성공하였습니다. 회원가입을 위해 정보를 제출하세요" });
  
    } catch (err) {
      console.error("인증 코드 검증 중 오류: ", err)
      return res.status(500).json({ok: false, msg: "서버 오류로 인증 코드 검증에 실패"})
  }
    
    
};

export const signUp = async(req, res) => {
    try {
      const {email, password, name, date} = req.body;
    
      //request값들 검증
      if(!email || !password || !name || !date){
        return res.status(400).json({ok : false, msg : "회원가입 정보를 제대로 입력 해주세요"});
      }

      //verifyCode에서 인증유/무 속성 체크
      const record = verificationCodes[email];
      if(!record || !record.verified){
        return res.status(400).json({ok : false, msg : "이메일 인증이 필요합니다"});
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const query = 'INSERT INTO loginfo (USERNAME, PASSWORD, NAME, BIRTHDAY) VALUES (?, ?, ?, ?)';
      await db.query(query, [email, hashedPassword, name, date]);
      delete verificationCodes[email];

      res.json({ok: true, msg: "회원가입 성공"});

    } catch (err) {
      console.error('사용자 정보 저장 실패: ', err);
      return res.status(500).json({ok: false, msg: "서버 오류로 인해 데이터베이스에 사용자 정보 저장 실패"});
    }

};

export const logIn = async(req, res) => {
    try {
      const {email, password} = req.body;

      if(!email || !password){
        return res.status(400).json({ok: false, msg: '이메일과 비밀번호를 입력하세요'});
      }

      const query = 'SELECT * FROM loginfo WHERE USERNAME = ?';
      const [results] = await db.query(query, [email]);

      if (results.length === 0){
        return res.status(400).json({ok: false, msg: '이메일 또는 비밀번호가 일치하지 않습니다'})
      }

      const user = results[0];
      console.log(user)
      //조회시 여러 쿼리가 나올수있기때문에 최상단에 조회되는 쿼리
      const isMatch = await bcrypt.compare(password, user.PASSWORD);

      if(!isMatch){
        return res.status(400).json({ok: false, msg: '이메일 또는 비밀번호가 일치하지 않습니다.'})
      }

      res.json({ ok: true, msg: '로그인 성공!', user: {email: user.USERNAME, name: user.NAME, birth: BIRTHDAY}});

    } catch (err) {
        console.error('사용자 조회 실패', err);
        return res.status(500).json({ok: false, msg: '로그인에 실패 하였습니다'});

    }
};