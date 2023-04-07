import express from "express";
import { scrapOkra } from "./scrapper";

const app = express();
const port = process.env.PORT ?? 3001;

app.get("/", async (req, res) => {
  await scrapOkra()
  res.send("Very bankful!");
});

app.listen(port, () => {
  return console.log(`Listening at http://localhost:${port}`);
});