import express from 'express'
import {sendVerificationCode, verifyCode, signUp, logIn} from '../controller/verificationController.js'
const router = express.Router()

//컨트롤러 처리1
router.post("/send-verification-code", sendVerificationCode)
//컨트롤러 처리1
router.post("/verify-code", verifyCode)
//컨트롤러 처리3
router.post("/sign-up", signUp)
//컨트롤러 처리4
router.post("/login", logIn)



export default router;