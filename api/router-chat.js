const express = require('express');
const router = express.Router();

router.get("/api/router-chat", (req, res) => {
    res.end("this is chat2!");
});

// middleware that is specific to this router
router.use((req, res, next) => {
    console.log('Time: ', Date.now())
    next()
})
// define the home page route
router.get('/', (req, res) => {
    res.send('Birds home page')
})

router.get("/hello", (req, res) => {
    res.end("hello chat!");
});

module.exports = router;