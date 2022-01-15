const dotenv = require("dotenv");
dotenv.config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(
  "mongodb+srv://webdevbro:t3l3cast3r@cluster0.mnxty.mongodb.net/jsfriends?retryWrites=true&w=majority",
);

async function start() {
  await client.connect();
  module.exports = client;
  const app = require("./app");
  app.listen(process.env.PORT || 5000, () => {
    console.log("Database connected on port 5000");
  });
}

start();
