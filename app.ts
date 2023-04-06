import express from "express";

const app = express();
const port = process.env.PORT ?? 3001;

app.get("/", async (req, res) => {
  res.send("Very bankful!");
});

app.listen(port, () => {
  return console.log(`Listening at http://localhost:${port}`);
});