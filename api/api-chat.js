const express = require('express');
const router = express.Router();


router.get("/chat", (req, res) => {
    res.end("this is chat2!");
});

router.get("/chat/hello", (req, res) => {
    res.end("hello chat!");
});

module.exports = router;