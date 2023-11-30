import express from 'express'
import { CreatePoll } from "../controllers/poll.js"
import { GetDetailPoll } from "../controllers/poll.js"
import { VotePoll } from "../controllers/poll.js"
import { DeletePoll } from "../controllers/poll.js"
import formData from 'express-form-data'

const router = express.Router();
router.post("/CreatePoll", formData.parse(), CreatePoll)
router.post("/GetDetailPoll", formData.parse(), GetDetailPoll)
router.post("/VotePoll", formData.parse(), VotePoll)
router.delete("/DeletePoll", formData.parse(), DeletePoll)

module.exports = router;