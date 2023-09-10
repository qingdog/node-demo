const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    res.end("this is chat!");
});
router.get("/api/api-chat", (req, res) => {
    res.end("this is chat2!");
});
router.get("/hello", (req, res) => {
    res.end("hello chat!");
});

module.exports = router;