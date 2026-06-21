import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

(async () => {
  try {
    const res = await axios.get("https://judge0-ce.p.rapidapi.com/about", {
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();
