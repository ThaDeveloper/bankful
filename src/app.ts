import * as dotenv from "dotenv";
import { scrapOkra } from "./scrapper";
import { init as dbConnect } from "./mongodb";

dotenv.config();
const port = process.env.PORT ?? 3001;
const hostname = process.env.HOSTNAME ?? "localhost";
const http = require("http");


const server = http.createServer(async (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  const { db, client } = await dbConnect();

  await scrapOkra(db)
    .then(() => {
      console.log("Done");
    })
    .catch(console.error)
    .finally(() => client.close());

  res.end(JSON.stringify({
    message: "Succefully scrapped and added to db."
  }));
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
