// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();

// (async () => {
//   try {
//     const res = await axios.get("https://judge0-ce.p.rapidapi.com/about", {
//       headers: {
//         "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//         "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
//       },
//     });
//     console.log(res.data);
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//   }
// })();



import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const response = await axios.post(
  `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
  {
    language_id: 71, // Python 3
    source_code: 'print("Hello World")',
    stdin: ""
  },
  {
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
      "X-RapidAPI-Host": process.env.JUDGE0_API_HOST,
    },
  }
);

console.log(response.data);
console.log(process.env.JUDGE0_API_URL);
console.log(process.env.JUDGE0_API_KEY);
console.log(process.env.JUDGE0_API_HOST);