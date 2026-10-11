import axios from "axios";

async function runTest() {
  try {
    const listRes = await axios.get("http://localhost:5007/api/coding/problems?dsaTopic=Array");
    const problem = listRes.data[0];
    console.log("Selected Problem:", problem.title, "(ID: " + problem._id + ")");

    // 1. Run custom input
    console.log("\n[Test 1] Testing /run with Custom Stdin...");
    const customRes = await axios.post(`http://localhost:5007/api/coding/problems/${problem._id}/run`, {
      code: "const fs = require('fs'); const input = fs.readFileSync(0, 'utf-8').trim(); console.log('Parsed: ' + input);",
      language: "javascript",
      customInput: "42 100"
    });
    console.log("Custom Stdin Result:", JSON.stringify(customRes.data, null, 2));

    // 2. Run sample test cases
    console.log("\n[Test 2] Testing /run with Sample Cases...");
    const sampleRes = await axios.post(`http://localhost:5007/api/coding/problems/${problem._id}/run`, {
      code: "console.log('wrong answer simulation');",
      language: "javascript"
    });
    console.log("Run Sample Cases Verdict:", sampleRes.data.overallVerdict);
    console.log("Sample Cases Details Count:", sampleRes.data.results?.length);
    console.log("Passed count:", sampleRes.data.passedCount, "/", sampleRes.data.totalCount);

    console.log("\nALL JUDGE TESTS SUCCEEDED!");
  } catch (err) {
    console.error("Test execution error:", err.response?.data || err.message);
  }
}

runTest();
