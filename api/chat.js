import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.end("this is chat!");
});

export default router;