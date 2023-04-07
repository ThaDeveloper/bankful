import express from "express";
import * as dotenv from "dotenv";
import { scrapOkra } from "./scrapper";
import { init as dbConnect } from "./mongodb";

dotenv.config();
const app = express();
const port = process.env.PORT ?? 3001;


app.get("/", async (req, res) => {
  const {db, client } = await  dbConnect();

  await scrapOkra(db)
  .then(() =>{
    console.log("Done")
  })
  .catch(console.error)
  .finally(() => client.close());
  
  res.send({
    message: "Succefully scrapped and added to db."
  });
});

app.listen(port, () => {
  return console.log(`Listening at http://localhost:${port}`);
});