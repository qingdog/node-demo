const express = require('express');
const router = express.Router();

router.get("/chat", (req, res) => {
    res.end("this is chat!");
});

module.exports = router;