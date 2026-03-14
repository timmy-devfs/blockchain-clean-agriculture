import express from "express";

const app = express();

app.listen(8090, () => {
  console.log("Blockchain service is running on port 8090");
});