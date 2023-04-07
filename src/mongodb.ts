import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();
const password = process.env.MONGO_PASSWORD;
const connectionString = `mongodb+srv://okra_takehome:${password}@okra-takehome.nopar.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


export const init = async() => {
  // Conect to db
  const client = new MongoClient(connectionString);
  await client.connect();
  console.log("Connected successfully to mongodb server");
  const db = client.db("myFirstDatabase");

  return {db, client};
}