import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import CodingProblem from "./src/models/CodingProblem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.CODING_MONGO_URI ||
  process.env.MONGO_URI;

const BASIC_CODING_PROBLEMS = [
  // 1. Sum of Two Numbers
  {
    title: "Sum of Two Numbers",
    difficulty: "Basic",
    dsaTopic: "Basics",
    tags: ["Math", "Basics", "Arithmetic"],
    description: "Given two integers A and B, calculate and print their sum.",
    constraints: "-10^9 <= A, B <= 10^9",
    sampleTestCases: [
      { input: "5 7", output: "12", visible: true },
      { input: "-3 10", output: "7", visible: true },
    ],
    testCases: [
      { input: "5 7", output: "12", visible: true },
      { input: "-3 10", output: "7", visible: true },
      { input: "0 0", output: "0", visible: false },
      { input: "-100 -250", output: "-350", visible: false },
      { input: "100000 200000", output: "300000", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const a = BigInt(input[0]);\n  const b = BigInt(input[1]);\n  console.log((a + b).toString());\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    a, b = int(data[0]), int(data[1])\n    print(a + b)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    long long a, b;\n    if (cin >> a >> b) {\n        cout << (a + b) << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long a = sc.nextLong();\n            long b = sc.nextLong();\n            System.out.println(a + b);\n        }\n    }\n}`
    },
    hints: ["Use standard integer addition. Make sure to handle negative values properly."],
    editorial: "Read both integers and compute A + B using 64-bit integer types to prevent overflow.",
    acceptanceRate: 98,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 2. Check Even or Odd
  {
    title: "Check Even or Odd",
    difficulty: "Basic",
    dsaTopic: "Basics",
    tags: ["Math", "Basics", "Conditionals"],
    description: "Given an integer N, determine whether it is Even or Odd. Print 'Even' if N is divisible by 2, otherwise print 'Odd'.",
    constraints: "-10^9 <= N <= 10^9",
    sampleTestCases: [
      { input: "4", output: "Even", visible: true },
      { input: "7", output: "Odd", visible: true },
    ],
    testCases: [
      { input: "4", output: "Even", visible: true },
      { input: "7", output: "Odd", visible: true },
      { input: "0", output: "Even", visible: false },
      { input: "-6", output: "Even", visible: false },
      { input: "-13", output: "Odd", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const n = parseInt(input[0]);\n  console.log(n % 2 === 0 ? 'Even' : 'Odd');\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    print("Even" if n % 2 == 0 else "Odd")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    long long n;\n    if (cin >> n) {\n        cout << (n % 2 == 0 ? "Even" : "Odd") << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long n = sc.nextLong();\n            System.out.println(n % 2 == 0 ? "Even" : "Odd");\n        }\n    }\n}`
    },
    hints: ["Use the modulo operator % to check divisibility by 2."],
    editorial: "If N % 2 == 0, the number is even; otherwise, it is odd.",
    acceptanceRate: 97,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 3. Find Maximum of Three Numbers
  {
    title: "Find Maximum of Three Numbers",
    difficulty: "Basic",
    dsaTopic: "Basics",
    tags: ["Math", "Basics", "Conditionals"],
    description: "Given three integers A, B, and C, determine and print the maximum among them.",
    constraints: "-10^9 <= A, B, C <= 10^9",
    sampleTestCases: [
      { input: "10 25 15", output: "25", visible: true },
      { input: "-5 -1 -10", output: "-1", visible: true },
    ],
    testCases: [
      { input: "10 25 15", output: "25", visible: true },
      { input: "-5 -1 -10", output: "-1", visible: true },
      { input: "7 7 7", output: "7", visible: false },
      { input: "100 50 100", output: "100", visible: false },
      { input: "0 0 -1", output: "0", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 3) return;\n  const [a, b, c] = input.map(Number);\n  console.log(Math.max(a, b, c));\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    a, b, c = map(int, data[:3])\n    print(max(a, b, c))\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <algorithm>\nusing namespace std;\nint main() {\n    long long a, b, c;\n    if (cin >> a >> b >> c) {\n        cout << max({a, b, c}) << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long a = sc.nextLong(), b = sc.nextLong(), c = sc.nextLong();\n            System.out.println(Math.max(a, Math.max(b, c)));\n        }\n    }\n}`
    },
    hints: ["Compare A with B and C, or use the built-in max function."],
    editorial: "Compute max(A, max(B, C)). Time complexity is O(1).",
    acceptanceRate: 96,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 4. Factorial of a Number
  {
    title: "Factorial of a Number",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Recursion", "Loops"],
    description: "Given a non-negative integer N, calculate its factorial (N!). Note: 0! = 1.",
    constraints: "0 <= N <= 18",
    sampleTestCases: [
      { input: "5", output: "120", visible: true },
      { input: "0", output: "1", visible: true },
    ],
    testCases: [
      { input: "5", output: "120", visible: true },
      { input: "0", output: "1", visible: true },
      { input: "1", output: "1", visible: false },
      { input: "7", output: "5040", visible: false },
      { input: "12", output: "479001600", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const n = parseInt(input[0]);\n  let ans = 1n;\n  for (let i = 2n; i <= BigInt(n); i++) ans *= i;\n  console.log(ans.toString());\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    ans = 1\n    for i in range(2, n + 1):\n        ans *= i\n    print(ans)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        long long ans = 1;\n        for (int i = 2; i <= n; i++) ans *= i;\n        cout << ans << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long ans = 1;\n            for (int i = 2; i <= n; i++) ans *= i;\n            System.out.println(ans);\n        }\n    }\n}`
    },
    hints: ["Initialize ans = 1 and multiply all integers from 1 up to N."],
    editorial: "Iterate from 2 up to N and multiply accumulated result. Uses O(N) operations.",
    acceptanceRate: 94,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 5. Check Prime Number
  {
    title: "Check Prime Number",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Number Theory"],
    description: "Given a positive integer N, determine whether N is a prime number. Print 'Yes' if prime, otherwise 'No'.",
    constraints: "1 <= N <= 10^9",
    sampleTestCases: [
      { input: "7", output: "Yes", visible: true },
      { input: "10", output: "No", visible: true },
    ],
    testCases: [
      { input: "7", output: "Yes", visible: true },
      { input: "10", output: "No", visible: true },
      { input: "1", output: "No", visible: false },
      { input: "2", output: "Yes", visible: false },
      { input: "97", output: "Yes", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const n = parseInt(input[0]);\n  if (n <= 1) { console.log('No'); return; }\n  if (n <= 3) { console.log('Yes'); return; }\n  if (n % 2 === 0 || n % 3 === 0) { console.log('No'); return; }\n  for (let i = 5; i * i <= n; i += 6) {\n    if (n % i === 0 || n % (i + 2) === 0) { console.log('No'); return; }\n  }\n  console.log('Yes');\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    if n <= 1:\n        print("No"); return\n    if n <= 3:\n        print("Yes"); return\n    if n % 2 == 0 or n % 3 == 0:\n        print("No"); return\n    i = 5\n    while i * i <= n:\n        if n % i == 0 or n % (i + 2) == 0:\n            print("No"); return\n        i += 6\n    print("Yes")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    long long n;\n    if (!(cin >> n)) return 0;\n    if (n <= 1) { cout << "No\\n"; return 0; }\n    if (n <= 3) { cout << "Yes\\n"; return 0; }\n    if (n % 2 == 0 || n % 3 == 0) { cout << "No\\n"; return 0; }\n    for (long long i = 5; i * i <= n; i += 6) {\n        if (n % i == 0 || n % (i + 2) == 0) {\n            cout << "No\\n"; return 0;\n        }\n    }\n    cout << "Yes\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLong()) return;\n        long n = sc.nextLong();\n        if (n <= 1) { System.out.println("No"); return; }\n        if (n <= 3) { System.out.println("Yes"); return; }\n        if (n % 2 == 0 || n % 3 == 0) { System.out.println("No"); return; }\n        for (long i = 5; i * i <= n; i += 6) {\n            if (n % i == 0 || n % (i + 2) == 0) {\n                System.out.println("No"); return;\n            }\n        }\n        System.out.println("Yes");\n    }\n}`
    },
    hints: ["Numbers <= 1 are not prime. Test divisors up to sqrt(N)."],
    editorial: "A number is prime if it has no divisor between 2 and sqrt(N). Time complexity O(sqrt(N)).",
    acceptanceRate: 91,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 6. Reverse a Number
  {
    title: "Reverse a Number",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Basics", "Digits"],
    description: "Given a non-negative integer N, reverse its digits and print the reversed integer. Any leading zeros in the result should not be printed.",
    constraints: "0 <= N <= 10^9",
    sampleTestCases: [
      { input: "12345", output: "54321", visible: true },
      { input: "1200", output: "21", visible: true },
    ],
    testCases: [
      { input: "12345", output: "54321", visible: true },
      { input: "1200", output: "21", visible: true },
      { input: "0", output: "0", visible: false },
      { input: "7", output: "7", visible: false },
      { input: "1000000009", output: "900000001", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  let n = parseInt(input[0]);\n  let rev = 0;\n  while (n > 0) {\n    rev = rev * 10 + (n % 10);\n    n = Math.floor(n / 10);\n  }\n  console.log(rev);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    rev = 0\n    while n > 0:\n        rev = rev * 10 + (n % 10)\n        n //= 10\n    print(rev)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    long long n;\n    if (cin >> n) {\n        long long rev = 0;\n        while (n > 0) {\n            rev = rev * 10 + (n % 10);\n            n /= 10;\n        }\n        cout << rev << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long n = sc.nextLong();\n            long rev = 0;\n            while (n > 0) {\n                rev = rev * 10 + (n % 10);\n                n /= 10;\n            }\n            System.out.println(rev);\n        }\n    }\n}`
    },
    hints: ["Extract the last digit using n % 10, then divide n by 10."],
    editorial: "Iteratively extract digits from right to left, building rev = rev * 10 + digit. Time O(log10(N)).",
    acceptanceRate: 95,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 7. Palindrome Number Check
  {
    title: "Palindrome Number Check",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Basics", "Digits"],
    description: "Given an integer N, determine if it is a palindrome. Print 'true' if N reads the same backwards as forwards, otherwise 'false'.",
    constraints: "-10^9 <= N <= 10^9",
    sampleTestCases: [
      { input: "121", output: "true", visible: true },
      { input: "-121", output: "false", visible: true },
    ],
    testCases: [
      { input: "121", output: "true", visible: true },
      { input: "-121", output: "false", visible: true },
      { input: "10", output: "false", visible: false },
      { input: "0", output: "true", visible: false },
      { input: "12321", output: "true", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const str = input[0];\n  const rev = str.split('').reverse().join('');\n  console.log(str === rev ? 'true' : 'false');\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    s = data[0]\n    print("true" if s == s[::-1] else "false")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s;\n    if (cin >> s) {\n        string rev = s;\n        reverse(rev.begin(), rev.end());\n        cout << (s == rev ? "true" : "false") << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String s = sc.next();\n            String rev = new StringBuilder(s).reverse().toString();\n            System.out.println(s.equals(rev) ? "true" : "false");\n        }\n    }\n}`
    },
    hints: ["Compare the string representation of the number with its reverse."],
    editorial: "A palindrome number reads identically forward and backward. Negative numbers are not palindromes due to the leading minus sign.",
    acceptanceRate: 94,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 8. Sum of Digits
  {
    title: "Sum of Digits",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Basics", "Digits"],
    description: "Given a non-negative integer N, calculate the sum of its individual digits.",
    constraints: "0 <= N <= 10^18",
    sampleTestCases: [
      { input: "1234", output: "10", visible: true },
      { input: "999", output: "27", visible: true },
    ],
    testCases: [
      { input: "1234", output: "10", visible: true },
      { input: "999", output: "27", visible: true },
      { input: "0", output: "0", visible: false },
      { input: "5", output: "5", visible: false },
      { input: "1000000000", output: "1", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const str = input[0];\n  let sum = 0;\n  for (let ch of str) sum += parseInt(ch);\n  console.log(sum);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    s = data[0]\n    print(sum(int(ch) for ch in s))\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    if (cin >> s) {\n        long long sum = 0;\n        for (char c : s) sum += (c - '0');\n        cout << sum << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String s = sc.next();\n            long sum = 0;\n            for (char c : s.toCharArray()) sum += (c - '0');\n            System.out.println(sum);\n        }\n    }\n}`
    },
    hints: ["Iterate through every character of the number or repeatedly take modulo 10."],
    editorial: "Loop over the digits and accumulate the sum. Runs in O(digits) time.",
    acceptanceRate: 96,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 9. Count Digits in a Number
  {
    title: "Count Digits in a Number",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Basics", "Digits"],
    description: "Given a non-negative integer N, count and print the total number of digits in N.",
    constraints: "0 <= N <= 10^18",
    sampleTestCases: [
      { input: "1567", output: "4", visible: true },
      { input: "0", output: "1", visible: true },
    ],
    testCases: [
      { input: "1567", output: "4", visible: true },
      { input: "0", output: "1", visible: true },
      { input: "9", output: "1", visible: false },
      { input: "1000000", output: "7", visible: false },
      { input: "98765432101234", output: "14", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  console.log(input[0].length);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    print(len(data[0]))\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    if (cin >> s) {\n        cout << s.length() << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            System.out.println(sc.next().length());\n        }\n    }\n}`
    },
    hints: ["The length of the string representation gives the number of digits."],
    editorial: "Either count while dividing by 10, or simply take the length of string input.",
    acceptanceRate: 98,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 10. Check Armstrong Number
  {
    title: "Check Armstrong Number",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Basics", "Digits"],
    description: "An Armstrong number (narcissistic number) of k digits is a number equal to the sum of its digits each raised to the power of k. Given N, print 'Yes' if it is an Armstrong number, otherwise 'No'.",
    constraints: "1 <= N <= 10^9",
    sampleTestCases: [
      { input: "153", output: "Yes", visible: true },
      { input: "123", output: "No", visible: true },
    ],
    testCases: [
      { input: "153", output: "Yes", visible: true },
      { input: "123", output: "No", visible: true },
      { input: "370", output: "Yes", visible: false },
      { input: "371", output: "Yes", visible: false },
      { input: "1634", output: "Yes", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const s = input[0];\n  const k = s.length;\n  let sum = 0n;\n  for (let ch of s) sum += BigInt(Math.pow(parseInt(ch), k));\n  console.log(sum.toString() === s ? 'Yes' : 'No');\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    s = data[0]\n    k = len(s)\n    total = sum(int(c)**k for c in s)\n    print("Yes" if total == int(s) else "No")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\n#include <cmath>\nusing namespace std;\nint main() {\n    string s;\n    if (cin >> s) {\n        int k = s.length();\n        long long sum = 0;\n        for (char c : s) {\n            sum += round(pow(c - '0', k));\n        }\n        cout << (to_string(sum) == s ? "Yes" : "No") << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String s = sc.next();\n            int k = s.length();\n            long sum = 0;\n            for (char c : s.toCharArray()) {\n                sum += Math.round(Math.pow(c - '0', k));\n            }\n            System.out.println(String.valueOf(sum).equals(s) ? "Yes" : "No");\n        }\n    }\n}`
    },
    hints: ["Find the number of digits k, then sum each digit raised to power k."],
    editorial: "Extract each digit, raise it to power k (where k is the count of digits), and compare with original N.",
    acceptanceRate: 91,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 11. Fibonacci Number
  {
    title: "N-th Fibonacci Number",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Dynamic Programming", "Basics"],
    description: "The Fibonacci sequence is defined as F(0) = 0, F(1) = 1, and F(n) = F(n-1) + F(n-2) for n >= 2. Given an integer N, find and print F(N).",
    constraints: "0 <= N <= 30",
    sampleTestCases: [
      { input: "4", output: "3", visible: true },
      { input: "10", output: "55", visible: true },
    ],
    testCases: [
      { input: "4", output: "3", visible: true },
      { input: "10", output: "55", visible: true },
      { input: "0", output: "0", visible: false },
      { input: "1", output: "1", visible: false },
      { input: "20", output: "6765", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const n = parseInt(input[0]);\n  if (n === 0) { console.log(0); return; }\n  if (n === 1) { console.log(1); return; }\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    let c = a + b;\n    a = b;\n    b = c;\n  }\n  console.log(b);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    if n == 0: print(0); return\n    if n == 1: print(1); return\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    print(b)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        if (n == 0) { cout << 0 << "\\n"; return 0; }\n        if (n == 1) { cout << 1 << "\\n"; return 0; }\n        long long a = 0, b = 1;\n        for (int i = 2; i <= n; i++) {\n            long long c = a + b;\n            a = b;\n            b = c;\n        }\n        cout << b << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            if (n == 0) { System.out.println(0); return; }\n            if (n == 1) { System.out.println(1); return; }\n            long a = 0, b = 1;\n            for (int i = 2; i <= n; i++) {\n                long c = a + b;\n                a = b;\n                b = c;\n            }\n            System.out.println(b);\n        }\n    }\n}`
    },
    hints: ["Keep track of the previous two numbers in variables a and b."],
    editorial: "Iterative calculation using two variables runs in O(N) time and O(1) space.",
    acceptanceRate: 92,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 12. GCD and LCM
  {
    title: "GCD and LCM",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Number Theory", "Euclidean Algorithm"],
    description: "Given two positive integers A and B, compute their Greatest Common Divisor (GCD) and Least Common Multiple (LCM). Print them separated by a space: '<GCD> <LCM>'.",
    constraints: "1 <= A, B <= 10^9",
    sampleTestCases: [
      { input: "12 18", output: "6 36", visible: true },
      { input: "5 10", output: "5 10", visible: true },
    ],
    testCases: [
      { input: "12 18", output: "6 36", visible: true },
      { input: "5 10", output: "5 10", visible: true },
      { input: "1 7", output: "1 7", visible: false },
      { input: "100 100", output: "100 100", visible: false },
      { input: "14 21", output: "7 42", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction gcd(a, b) {\n  while (b) { let t = b; b = a % b; a = t; }\n  return a;\n}\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const a = BigInt(input[0]), b = BigInt(input[1]);\n  const g = gcd(a, b);\n  const l = (a * b) / g;\n  console.log(g.toString() + ' ' + l.toString());\n}\nsolve();`,
      python3: `import sys\nimport math\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    a, b = int(data[0]), int(data[1])\n    g = math.gcd(a, b)\n    l = (a * b) // g\n    print(f"{g} {l}")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <numeric>\nusing namespace std;\nlong long gcd_func(long long a, long long b) {\n    while (b) { a %= b; swap(a, b); }\n    return a;\n}\nint main() {\n    long long a, b;\n    if (cin >> a >> b) {\n        long long g = gcd_func(a, b);\n        long long l = (a / g) * b;\n        cout << g << " " << l << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    static long gcd(long a, long b) {\n        while (b != 0) { long t = b; b = a % b; a = t; }\n        return a;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long a = sc.nextLong(), b = sc.nextLong();\n            long g = gcd(a, b);\n            long l = (a / g) * b;\n            System.out.println(g + " " + l);\n        }\n    }\n}`
    },
    hints: ["Use Euclidean algorithm for GCD: gcd(a, b) = gcd(b, a % b). Then LCM = (A * B) / GCD."],
    editorial: "Euclidean algorithm computes GCD in logarithmic steps. LCM is derived from the product formula.",
    acceptanceRate: 93,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 13. Check Leap Year
  {
    title: "Check Leap Year",
    difficulty: "Basic",
    dsaTopic: "Basics",
    tags: ["Math", "Conditionals", "Basics"],
    description: "Given a year Y, determine whether it is a Leap Year. A year is a leap year if it is divisible by 4, except for century years which must also be divisible by 400. Print 'Yes' or 'No'.",
    constraints: "1 <= Y <= 10000",
    sampleTestCases: [
      { input: "2024", output: "Yes", visible: true },
      { input: "1900", output: "No", visible: true },
    ],
    testCases: [
      { input: "2024", output: "Yes", visible: true },
      { input: "1900", output: "No", visible: true },
      { input: "2000", output: "Yes", visible: false },
      { input: "2023", output: "No", visible: false },
      { input: "2400", output: "Yes", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const y = parseInt(input[0]);\n  const isLeap = (y % 400 === 0) || (y % 4 === 0 && y % 100 !== 0);\n  console.log(isLeap ? 'Yes' : 'No');\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    y = int(data[0])\n    is_leap = (y % 400 == 0) or (y % 4 == 0 and y % 100 != 0)\n    print("Yes" if is_leap else "No")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int y;\n    if (cin >> y) {\n        bool isLeap = (y % 400 == 0) || (y % 4 == 0 && y % 100 != 0);\n        cout << (isLeap ? "Yes" : "No") << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int y = sc.nextInt();\n            boolean isLeap = (y % 400 == 0) || (y % 4 == 0 && y % 100 != 0);\n            System.out.println(isLeap ? "Yes" : "No");\n        }\n    }\n}`
    },
    hints: ["Check if (year % 400 == 0) or (year % 4 == 0 and year % 100 != 0)."],
    editorial: "Leap year rules dictate that divisible by 400 is always leap, else divisible by 100 is not, else divisible by 4 is.",
    acceptanceRate: 95,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 14. Sum of First N Natural Numbers
  {
    title: "Sum of First N Natural Numbers",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Basics", "Arithmetic"],
    description: "Given an integer N, calculate the sum of the first N natural numbers (1 + 2 + 3 + ... + N).",
    constraints: "1 <= N <= 10^8",
    sampleTestCases: [
      { input: "5", output: "15", visible: true },
      { input: "10", output: "55", visible: true },
    ],
    testCases: [
      { input: "5", output: "15", visible: true },
      { input: "10", output: "55", visible: true },
      { input: "1", output: "1", visible: false },
      { input: "100", output: "5050", visible: false },
      { input: "1000000", output: "500000500000", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const n = BigInt(input[0]);\n  const ans = (n * (n + 1n)) / 2n;\n  console.log(ans.toString());\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    print((n * (n + 1)) // 2)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    long long n;\n    if (cin >> n) {\n        cout << (n * (n + 1)) / 2 << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long n = sc.nextLong();\n            System.out.println((n * (n + 1)) / 2);\n        }\n    }\n}`
    },
    hints: ["Use Gauss formula: Sum = N * (N + 1) / 2 to compute in O(1) time."],
    editorial: "Gauss sum formula runs in O(1) arithmetic operations with 64-bit integer precision.",
    acceptanceRate: 98,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 15. Power of a Number
  {
    title: "Power of a Number",
    difficulty: "Basic",
    dsaTopic: "Math",
    tags: ["Math", "Basics", "Exponentiation"],
    description: "Given base X and exponent N (both non-negative integers), compute X raised to the power N (X^N).",
    constraints: "0 <= X <= 10, 0 <= N <= 15",
    sampleTestCases: [
      { input: "2 5", output: "32", visible: true },
      { input: "5 0", output: "1", visible: true },
    ],
    testCases: [
      { input: "2 5", output: "32", visible: true },
      { input: "5 0", output: "1", visible: true },
      { input: "3 4", output: "81", visible: false },
      { input: "10 6", output: "1000000", visible: false },
      { input: "0 5", output: "0", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const x = BigInt(input[0]);\n  const n = BigInt(input[1]);\n  console.log((x ** n).toString());\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    x, n = int(data[0]), int(data[1])\n    print(x ** n)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <cmath>\nusing namespace std;\nint main() {\n    long long x, n;\n    if (cin >> x >> n) {\n        long long ans = 1;\n        for (int i = 0; i < n; i++) ans *= x;\n        cout << ans << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long x = sc.nextLong(), n = sc.nextLong();\n            long ans = 1;\n            for (int i = 0; i < n; i++) ans *= x;\n            System.out.println(ans);\n        }\n    }\n}`
    },
    hints: ["Multiply x by itself n times, or use binary exponentiation."],
    editorial: "Compute x^n iteratively or using power functions. Time complexity O(N) or O(log N).",
    acceptanceRate: 94,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 16. Multiplication Table
  {
    title: "Multiplication Table",
    difficulty: "Basic",
    dsaTopic: "Basics",
    tags: ["Math", "Loops", "Basics"],
    description: "Given an integer N, print its multiplication table from 1 to 10. Each line should follow the format: 'N x i = result'.",
    constraints: "1 <= N <= 1000",
    sampleTestCases: [
      { input: "5", output: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50", visible: true },
    ],
    testCases: [
      { input: "5", output: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50", visible: true },
      { input: "2", output: "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const n = parseInt(input[0]);\n  for (let i = 1; i <= 10; i++) {\n    console.log(\`\${n} x \${i} = \${n * i}\`);\n  }\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    for i in range(1, 11):\n        print(f"{n} x {i} = {n * i}")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        for (int i = 1; i <= 10; i++) {\n            cout << n << " x " << i << " = " << (n * i) << "\\n";\n        }\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            for (int i = 1; i <= 10; i++) {\n                System.out.println(n + " x " + i + " = " + (n * i));\n            }\n        }\n    }\n}`
    },
    hints: ["Run a loop from 1 to 10 and print the formatted string."],
    editorial: "Iterate from 1 to 10 and output each product line by line.",
    acceptanceRate: 97,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 17. Find Largest Element in Array
  {
    title: "Find Largest Element in Array",
    difficulty: "Basic",
    dsaTopic: "Array",
    tags: ["Array", "Basics", "Searching"],
    description: "Given an array of N integers, find and print the maximum element in the array.\nThe first line contains N. The second line contains N integers.",
    constraints: "1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9",
    sampleTestCases: [
      { input: "5\n1 8 7 56 90", output: "90", visible: true },
      { input: "3\n-10 -5 -20", output: "-5", visible: true },
    ],
    testCases: [
      { input: "5\n1 8 7 56 90", output: "90", visible: true },
      { input: "3\n-10 -5 -20", output: "-5", visible: true },
      { input: "1\n42", output: "42", visible: false },
      { input: "4\n10 10 10 10", output: "10", visible: false },
      { input: "6\n5 2 9 1 15 3", output: "15", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  const arr = input.slice(1, 1 + n).map(Number);\n  let maxVal = arr[0];\n  for (let i = 1; i < n; i++) if (arr[i] > maxVal) maxVal = arr[i];\n  console.log(maxVal);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    print(max(arr))\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <algorithm>\n#include <vector>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        long long maxVal = -2e18;\n        for (int i = 0; i < n; i++) {\n            long long x; cin >> x;\n            if (i == 0 || x > maxVal) maxVal = x;\n        }\n        cout << maxVal << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long maxVal = sc.nextLong();\n            for (int i = 1; i < n; i++) {\n                long x = sc.nextLong();\n                if (x > maxVal) maxVal = x;\n            }\n            System.out.println(maxVal);\n        }\n    }\n}`
    },
    hints: ["Initialize max with the first element and compare with every subsequent element."],
    editorial: "Single pass over the array keeping track of current maximum. Time O(N), Space O(1).",
    acceptanceRate: 95,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 18. Find Smallest Element in Array
  {
    title: "Find Smallest Element in Array",
    difficulty: "Basic",
    dsaTopic: "Array",
    tags: ["Array", "Basics", "Searching"],
    description: "Given an array of N integers, find and print the minimum (smallest) element in the array.\nThe first line contains N. The second line contains N integers.",
    constraints: "1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9",
    sampleTestCases: [
      { input: "5\n10 20 4 45 99", output: "4", visible: true },
      { input: "4\n-1 -5 -2 -9", output: "-9", visible: true },
    ],
    testCases: [
      { input: "5\n10 20 4 45 99", output: "4", visible: true },
      { input: "4\n-1 -5 -2 -9", output: "-9", visible: true },
      { input: "1\n100", output: "100", visible: false },
      { input: "3\n0 0 0", output: "0", visible: false },
      { input: "5\n9 8 7 6 5", output: "5", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  const arr = input.slice(1, 1 + n).map(Number);\n  let minVal = arr[0];\n  for (let i = 1; i < n; i++) if (arr[i] < minVal) minVal = arr[i];\n  console.log(minVal);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    print(min(arr))\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        long long minVal = 2e18;\n        for (int i = 0; i < n; i++) {\n            long long x; cin >> x;\n            if (i == 0 || x < minVal) minVal = x;\n        }\n        cout << minVal << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long minVal = sc.nextLong();\n            for (int i = 1; i < n; i++) {\n                long x = sc.nextLong();\n                if (x < minVal) minVal = x;\n            }\n            System.out.println(minVal);\n        }\n    }\n}`
    },
    hints: ["Initialize min with the first element and check every element."],
    editorial: "Single linear scan over all elements. Time complexity O(N).",
    acceptanceRate: 96,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 19. Sum of Array Elements
  {
    title: "Sum of Array Elements",
    difficulty: "Basic",
    dsaTopic: "Array",
    tags: ["Array", "Basics", "Sum"],
    description: "Given an integer array of size N, calculate and print the sum of all elements in the array.\nThe first line contains N. The second line contains N integers.",
    constraints: "1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9",
    sampleTestCases: [
      { input: "4\n1 2 3 4", output: "10", visible: true },
      { input: "3\n10 -5 2", output: "7", visible: true },
    ],
    testCases: [
      { input: "4\n1 2 3 4", output: "10", visible: true },
      { input: "3\n10 -5 2", output: "7", visible: true },
      { input: "1\n50", output: "50", visible: false },
      { input: "5\n-10 -20 -30 -40 -50", output: "-150", visible: false },
      { input: "2\n1000000 2000000", output: "3000000", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  let sum = 0n;\n  for (let i = 1; i <= n; i++) sum += BigInt(input[i]);\n  console.log(sum.toString());\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    print(sum(arr))\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        long long sum = 0;\n        for (int i = 0; i < n; i++) {\n            long long x; cin >> x;\n            sum += x;\n        }\n        cout << sum << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long sum = 0;\n            for (int i = 0; i < n; i++) {\n                sum += sc.nextLong();\n            }\n            System.out.println(sum);\n        }\n    }\n}`
    },
    hints: ["Iterate through the array and accumulate the values using a 64-bit integer."],
    editorial: "Sum all elements in a single loop. Time complexity O(N).",
    acceptanceRate: 97,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 20. Count Even and Odd Numbers in Array
  {
    title: "Count Even and Odd Numbers in Array",
    difficulty: "Basic",
    dsaTopic: "Array",
    tags: ["Array", "Basics", "Counting"],
    description: "Given an array of N integers, count how many numbers are even and how many are odd.\nPrint two integers separated by a space: '<evenCount> <oddCount>'.",
    constraints: "1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9",
    sampleTestCases: [
      { input: "5\n1 2 3 4 5", output: "2 3", visible: true },
      { input: "4\n2 4 6 8", output: "4 0", visible: true },
    ],
    testCases: [
      { input: "5\n1 2 3 4 5", output: "2 3", visible: true },
      { input: "4\n2 4 6 8", output: "4 0", visible: true },
      { input: "3\n1 3 5", output: "0 3", visible: false },
      { input: "1\n0", output: "1 0", visible: false },
      { input: "6\n-2 -3 -4 -5 0 7", output: "3 3", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  let even = 0, odd = 0;\n  for (let i = 1; i <= n; i++) {\n    const num = Math.abs(parseInt(input[i]));\n    if (num % 2 === 0) even++; else odd++;\n  }\n  console.log(even + ' ' + odd);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    even = sum(1 for x in arr if x % 2 == 0)\n    odd = n - even\n    print(f"{even} {odd}")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        int even = 0, odd = 0;\n        for (int i = 0; i < n; i++) {\n            long long x; cin >> x;\n            if (x % 2 == 0) even++;\n            else odd++;\n        }\n        cout << even << " " << odd << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int even = 0, odd = 0;\n            for (int i = 0; i < n; i++) {\n                long x = sc.nextLong();\n                if (x % 2 == 0) even++;\n                else odd++;\n            }\n            System.out.println(even + " " + odd);\n        }\n    }\n}`
    },
    hints: ["Check if element % 2 == 0 to determine parity."],
    editorial: "Iterate over elements, increment even or odd counter based on modulo 2. Time O(N).",
    acceptanceRate: 96,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 21. Linear Search
  {
    title: "Linear Search",
    difficulty: "Basic",
    dsaTopic: "Array",
    tags: ["Array", "Searching", "Basics"],
    description: "Given an array of N integers and a target key K, find the 0-based index of the first occurrence of K in the array. If K is not present, print -1.\nThe first line contains N and K. The second line contains N integers.",
    constraints: "1 <= N <= 10^5\n-10^9 <= A[i], K <= 10^9",
    sampleTestCases: [
      { input: "5 7\n1 3 5 7 9", output: "3", visible: true },
      { input: "4 10\n2 4 6 8", output: "-1", visible: true },
    ],
    testCases: [
      { input: "5 7\n1 3 5 7 9", output: "3", visible: true },
      { input: "4 10\n2 4 6 8", output: "-1", visible: true },
      { input: "1 5\n5", output: "0", visible: false },
      { input: "5 2\n2 2 2 2 2", output: "0", visible: false },
      { input: "6 99\n10 20 30 40 50 99", output: "5", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const n = parseInt(input[0]);\n  const k = input[1];\n  const arr = input.slice(2, 2 + n);\n  const idx = arr.indexOf(k);\n  console.log(idx);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n, k = int(data[0]), int(data[1])\n    arr = [int(x) for x in data[2:2+n]]\n    for i in range(n):\n        if arr[i] == k:\n            print(i); return\n    print(-1)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    long long k;\n    if (cin >> n >> k) {\n        int ans = -1;\n        for (int i = 0; i < n; i++) {\n            long long x; cin >> x;\n            if (x == k && ans == -1) ans = i;\n        }\n        cout << ans << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long k = sc.nextLong();\n            int ans = -1;\n            for (int i = 0; i < n; i++) {\n                long x = sc.nextLong();\n                if (x == k && ans == -1) ans = i;\n            }\n            System.out.println(ans);\n        }\n    }\n}`
    },
    hints: ["Iterate through each index from 0 to N-1 and compare each element to K."],
    editorial: "Linear search checks elements one by one. Runs in O(N) time and O(1) extra space.",
    acceptanceRate: 94,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 22. Check If Array is Sorted
  {
    title: "Check If Array is Sorted",
    difficulty: "Basic",
    dsaTopic: "Array",
    tags: ["Array", "Basics", "Sorting"],
    description: "Given an array of N integers, determine if the array is sorted in non-decreasing (ascending) order. Print 'true' if it is sorted, otherwise 'false'.\nThe first line contains N. The second line contains N integers.",
    constraints: "1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9",
    sampleTestCases: [
      { input: "5\n1 2 2 4 5", output: "true", visible: true },
      { input: "4\n5 3 2 1", output: "false", visible: true },
    ],
    testCases: [
      { input: "5\n1 2 2 4 5", output: "true", visible: true },
      { input: "4\n5 3 2 1", output: "false", visible: true },
      { input: "1\n10", output: "true", visible: false },
      { input: "3\n1 5 3", output: "false", visible: false },
      { input: "6\n-10 -5 0 2 2 10", output: "true", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  const arr = input.slice(1, 1 + n).map(Number);\n  for (let i = 1; i < n; i++) {\n    if (arr[i] < arr[i - 1]) { console.log('false'); return; }\n  }\n  console.log('true');\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    for i in range(1, n):\n        if arr[i] < arr[i - 1]:\n            print("false"); return\n    print("true")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<long long> a(n);\n        for (int i = 0; i < n; i++) cin >> a[i];\n        for (int i = 1; i < n; i++) {\n            if (a[i] < a[i - 1]) { cout << "false\\n"; return 0; }\n        }\n        cout << "true\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long prev = sc.nextLong();\n            boolean sorted = true;\n            for (int i = 1; i < n; i++) {\n                long curr = sc.nextLong();\n                if (curr < prev) sorted = false;\n                prev = curr;\n            }\n            System.out.println(sorted ? "true" : "false");\n        }\n    }\n}`
    },
    hints: ["Check if arr[i] >= arr[i-1] for every index i from 1 to N-1."],
    editorial: "Verify that adjacent elements satisfy the non-decreasing condition. Time complexity O(N).",
    acceptanceRate: 93,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 23. Reverse an Array
  {
    title: "Reverse an Array",
    difficulty: "Basic",
    dsaTopic: "Array",
    tags: ["Array", "Basics", "Two Pointers"],
    description: "Given an array of N integers, print the elements in reverse order separated by spaces.\nThe first line contains N. The second line contains N integers.",
    constraints: "1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9",
    sampleTestCases: [
      { input: "5\n1 2 3 4 5", output: "5 4 3 2 1", visible: true },
      { input: "3\n10 20 30", output: "30 20 10", visible: true },
    ],
    testCases: [
      { input: "5\n1 2 3 4 5", output: "5 4 3 2 1", visible: true },
      { input: "3\n10 20 30", output: "30 20 10", visible: true },
      { input: "1\n99", output: "99", visible: false },
      { input: "2\n1 2", output: "2 1", visible: false },
      { input: "4\n-5 0 5 10", output: "10 5 0 -5", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  const arr = input.slice(1, 1 + n);\n  console.log(arr.reverse().join(' '));\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    arr = data[1:1+n]\n    print(" ".join(arr[::-1]))\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<long long> a(n);\n        for (int i = 0; i < n; i++) cin >> a[i];\n        for (int i = n - 1; i >= 0; i--) {\n            cout << a[i] << (i == 0 ? "" : " ");\n        }\n        cout << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long[] a = new long[n];\n            for (int i = 0; i < n; i++) a[i] = sc.nextLong();\n            for (int i = n - 1; i >= 0; i--) {\n                System.out.print(a[i] + (i == 0 ? "" : " "));\n            }\n            System.out.println();\n        }\n    }\n}`
    },
    hints: ["Iterate backwards from index N-1 to 0."],
    editorial: "Traverse the array from end to start and print elements. Time O(N).",
    acceptanceRate: 96,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 24. Count Vowels and Consonants in a String
  {
    title: "Count Vowels and Consonants",
    difficulty: "Basic",
    dsaTopic: "String",
    tags: ["String", "Basics", "Counting"],
    description: "Given a string S containing lowercase English letters only, count the number of vowels (a, e, i, o, u) and consonants.\nPrint two integers separated by a space: '<vowels> <consonants>'.",
    constraints: "1 <= S.length <= 10^5",
    sampleTestCases: [
      { input: "hello", output: "2 3", visible: true },
      { input: "programming", output: "3 8", visible: true },
    ],
    testCases: [
      { input: "hello", output: "2 3", visible: true },
      { input: "programming", output: "3 8", visible: true },
      { input: "aeiou", output: "5 0", visible: false },
      { input: "bcdfg", output: "0 5", visible: false },
      { input: "codecampus", output: "4 6", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const s = input[0].toLowerCase();\n  const vowelsSet = new Set(['a', 'e', 'i', 'o', 'u']);\n  let v = 0, c = 0;\n  for (let ch of s) {\n    if (vowelsSet.has(ch)) v++;\n    else if (ch >= 'a' && ch <= 'z') c++;\n  }\n  console.log(v + ' ' + c);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    s = data[0].lower()\n    vowels = set('aeiou')\n    v = sum(1 for ch in s if ch in vowels)\n    c = sum(1 for ch in s if ch.isalpha() and ch not in vowels)\n    print(f"{v} {c}")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    if (cin >> s) {\n        int v = 0, c = 0;\n        for (char ch : s) {\n            char low = tolower(ch);\n            if (low == 'a' || low == 'e' || low == 'i' || low == 'o' || low == 'u') v++;\n            else if (low >= 'a' && low <= 'z') c++;\n        }\n        cout << v << " " << c << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String s = sc.next().toLowerCase();\n            int v = 0, c = 0;\n            for (char ch : s.toCharArray()) {\n                if ("aeiou".indexOf(ch) != -1) v++;\n                else if (ch >= 'a' && ch <= 'z') c++;\n            }\n            System.out.println(v + " " + c);\n        }\n    }\n}`
    },
    hints: ["Check if each character is in the set of vowels {'a', 'e', 'i', 'o', 'u'}."],
    editorial: "Iterate across all characters, classifying each into vowel or consonant. Time complexity O(length).",
    acceptanceRate: 95,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 25. Reverse a String
  {
    title: "Reverse a String",
    difficulty: "Basic",
    dsaTopic: "String",
    tags: ["String", "Basics", "Two Pointers"],
    description: "Given a string S, reverse the string and print the result.",
    constraints: "1 <= S.length <= 10^5",
    sampleTestCases: [
      { input: "codecampus", output: "supmacedoc", visible: true },
      { input: "racecar", output: "racecar", visible: true },
    ],
    testCases: [
      { input: "codecampus", output: "supmacedoc", visible: true },
      { input: "racecar", output: "racecar", visible: true },
      { input: "a", output: "a", visible: false },
      { input: "hello", output: "olleh", visible: false },
      { input: "123456789", output: "987654321", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  console.log(input[0].split('').reverse().join(''));\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    print(data[0][::-1])\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s;\n    if (cin >> s) {\n        reverse(s.begin(), s.end());\n        cout << s << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            System.out.println(new StringBuilder(sc.next()).reverse().toString());\n        }\n    }\n}`
    },
    hints: ["Use two pointers or the built-in string reverse method."],
    editorial: "Reverse the string using two-pointer swap from ends to center. Time complexity O(N).",
    acceptanceRate: 97,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 26. Palindrome String Check
  {
    title: "Palindrome String Check",
    difficulty: "Basic",
    dsaTopic: "String",
    tags: ["String", "Basics", "Two Pointers"],
    description: "Given a string S consisting of lowercase alphanumeric characters, determine if it is a palindrome. Print 'true' if it reads the same forward and backward, otherwise 'false'.",
    constraints: "1 <= S.length <= 10^5",
    sampleTestCases: [
      { input: "madam", output: "true", visible: true },
      { input: "platform", output: "false", visible: true },
    ],
    testCases: [
      { input: "madam", output: "true", visible: true },
      { input: "platform", output: "false", visible: true },
      { input: "a", output: "true", visible: false },
      { input: "abccba", output: "true", visible: false },
      { input: "abcdcbe", output: "false", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const s = input[0];\n  let l = 0, r = s.length - 1;\n  while (l < r) {\n    if (s[l] !== s[r]) { console.log('false'); return; }\n    l++; r--;\n  }\n  console.log('true');\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    s = data[0]\n    print("true" if s == s[::-1] else "false")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    if (cin >> s) {\n        int l = 0, r = s.length() - 1;\n        bool isPal = true;\n        while (l < r) {\n            if (s[l] != s[r]) { isPal = false; break; }\n            l++; r--;\n        }\n        cout << (isPal ? "true" : "false") << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String s = sc.next();\n            int l = 0, r = s.length() - 1;\n            boolean isPal = true;\n            while (l < r) {\n                if (s.charAt(l) != s.charAt(r)) { isPal = false; break; }\n                l++; r--;\n            }\n            System.out.println(isPal ? "true" : "false");\n        }\n    }\n}`
    },
    hints: ["Compare characters from beginning and end using two pointers moving towards the center."],
    editorial: "Check if characters at positions i and n-1-i match for all valid indices. Time O(N).",
    acceptanceRate: 96,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 27. Count Occurrences of a Character
  {
    title: "Count Occurrences of a Character",
    difficulty: "Basic",
    dsaTopic: "String",
    tags: ["String", "Basics", "Counting"],
    description: "Given a string S and a single character C, count how many times C appears in S.\nThe input consists of string S followed by character C on the same or next line.",
    constraints: "1 <= S.length <= 10^5\nC is a lowercase English letter.",
    sampleTestCases: [
      { input: "banana a", output: "3", visible: true },
      { input: "campus z", output: "0", visible: true },
    ],
    testCases: [
      { input: "banana a", output: "3", visible: true },
      { input: "campus z", output: "0", visible: true },
      { input: "aaaa a", output: "4", visible: false },
      { input: "developer e", output: "3", visible: false },
      { input: "mississippi s", output: "4", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const s = input[0];\n  const c = input[1];\n  let count = 0;\n  for (let ch of s) if (ch === c) count++;\n  console.log(count);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    s, c = data[0], data[1]\n    print(s.count(c))\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    char c;\n    if (cin >> s >> c) {\n        int cnt = 0;\n        for (char ch : s) if (ch == c) cnt++;\n        cout << cnt << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String s = sc.next();\n            char c = sc.next().charAt(0);\n            int cnt = 0;\n            for (char ch : s.toCharArray()) if (ch == c) cnt++;\n            System.out.println(cnt);\n        }\n    }\n}`
    },
    hints: ["Iterate through each character in the string and compare with C."],
    editorial: "Linear scan checking each character match against C. Time O(N).",
    acceptanceRate: 98,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 28. Swap Two Numbers
  {
    title: "Swap Two Numbers",
    difficulty: "Basic",
    dsaTopic: "Basics",
    tags: ["Basics", "Variables", "Math"],
    description: "Given two integers A and B, print them swapped: '<B> <A>'.",
    constraints: "-10^9 <= A, B <= 10^9",
    sampleTestCases: [
      { input: "10 20", output: "20 10", visible: true },
      { input: "-5 99", output: "99 -5", visible: true },
    ],
    testCases: [
      { input: "10 20", output: "20 10", visible: true },
      { input: "-5 99", output: "99 -5", visible: true },
      { input: "0 0", output: "0 0", visible: false },
      { input: "1 2", output: "2 1", visible: false },
      { input: "1000 -1000", output: "-1000 1000", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  console.log(input[1] + ' ' + input[0]);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    a, b = data[0], data[1]\n    print(f"{b} {a}")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    long long a, b;\n    if (cin >> a >> b) {\n        cout << b << " " << a << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long a = sc.nextLong(), b = sc.nextLong();\n            System.out.println(b + " " + a);\n        }\n    }\n}`
    },
    hints: ["Print B followed by A."],
    editorial: "Values can be printed in reverse order directly or swapped in place. Time O(1).",
    acceptanceRate: 99,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 29. Second Largest Element in Array
  {
    title: "Second Largest Element in Array",
    difficulty: "Basic",
    dsaTopic: "Array",
    tags: ["Array", "Basics", "Searching"],
    description: "Given an array of N integers, find the second largest distinct element. If no second largest distinct element exists, print -1.\nThe first line contains N. The second line contains N integers.",
    constraints: "2 <= N <= 10^5\n-10^9 <= A[i] <= 10^9",
    sampleTestCases: [
      { input: "5\n12 35 1 10 34", output: "34", visible: true },
      { input: "3\n10 10 10", output: "-1", visible: true },
    ],
    testCases: [
      { input: "5\n12 35 1 10 34", output: "34", visible: true },
      { input: "3\n10 10 10", output: "-1", visible: true },
      { input: "2\n5 2", output: "2", visible: false },
      { input: "4\n1 2 3 4", output: "3", visible: false },
      { input: "5\n-10 -5 -2 -1 0", output: "-1", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  const arr = input.slice(1, 1 + n).map(Number);\n  let first = -Infinity, second = -Infinity;\n  for (let x of arr) {\n    if (x > first) {\n      second = first;\n      first = x;\n    } else if (x < first && x > second) {\n      second = x;\n    }\n  }\n  console.log(second === -Infinity ? -1 : second);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    first, second = float('-inf'), float('-inf')\n    for x in arr:\n        if x > first:\n            second = first\n            first = x\n        elif first > x > second:\n            second = x\n    print(second if second != float('-inf') else -1)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n;\n    if (cin >> n) {\n        long long first = -2e18, second = -2e18;\n        for (int i = 0; i < n; i++) {\n            long long x; cin >> x;\n            if (x > first) {\n                second = first;\n                first = x;\n            } else if (x < first && x > second) {\n                second = x;\n            }\n        }\n        if (second == -2e18) cout << -1 << "\\n";\n        else cout << second << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long first = Long.MIN_VALUE, second = Long.MIN_VALUE;\n            for (int i = 0; i < n; i++) {\n                long x = sc.nextLong();\n                if (x > first) {\n                    second = first;\n                    first = x;\n                } else if (x < first && x > second) {\n                    second = x;\n                }\n            }\n            System.out.println(second == Long.MIN_VALUE ? -1 : second);\n        }\n    }\n}`
    },
    hints: ["Maintain two variables: first max and second max. Update accordingly in a single pass."],
    editorial: "Traverse the array once maintaining the largest and second largest distinct values. Time O(N), Space O(1).",
    acceptanceRate: 88,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // 30. Celsius to Fahrenheit
  {
    title: "Convert Celsius to Fahrenheit",
    difficulty: "Basic",
    dsaTopic: "Basics",
    tags: ["Math", "Basics", "Formulas"],
    description: "Given a temperature in Celsius C (as an integer), convert it to Fahrenheit and print the result rounded to 2 decimal places using the formula: F = (C * 9/5) + 32.",
    constraints: "-100 <= C <= 200",
    sampleTestCases: [
      { input: "0", output: "32.00", visible: true },
      { input: "25", output: "77.00", visible: true },
    ],
    testCases: [
      { input: "0", output: "32.00", visible: true },
      { input: "25", output: "77.00", visible: true },
      { input: "100", output: "212.00", visible: false },
      { input: "-40", output: "-40.00", visible: false },
      { input: "37", output: "98.60", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const c = parseFloat(input[0]);\n  const f = (c * 9 / 5) + 32;\n  console.log(f.toFixed(2));\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    c = float(data[0])\n    f = (c * 9 / 5) + 32\n    print(f"{f:.2f}")\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <iomanip>\nusing namespace std;\nint main() {\n    double c;\n    if (cin >> c) {\n        double f = (c * 9.0 / 5.0) + 32.0;\n        cout << fixed << setprecision(2) << f << "\\n";\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextDouble()) {\n            double c = sc.nextDouble();\n            double f = (c * 9.0 / 5.0) + 32.0;\n            System.out.printf(java.util.Locale.US, "%.2f\\n", f);\n        }\n    }\n}`
    },
    hints: ["Use formula F = (C * 9/5) + 32 and format output to 2 decimal places."],
    editorial: "Direct evaluation of temperature conversion formula. Output formatted with fixed 2 decimal points.",
    acceptanceRate: 96,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB for Basic Coding Problems...");
    await mongoose.connect(MONGO_URI, { dbName: "coding_problems_db" });
    console.log("Connected successfully to coding_problems_db ✓");

    let inserted = 0;
    let updated = 0;

    for (const prob of BASIC_CODING_PROBLEMS) {
      const existing = await CodingProblem.findOne({ title: prob.title });
      if (existing) {
        await CodingProblem.findByIdAndUpdate(existing._id, prob);
        updated++;
        console.log(`[UPDATED] ${prob.title} (${prob.difficulty} | ${prob.dsaTopic})`);
      } else {
        await CodingProblem.create(prob);
        inserted++;
        console.log(`[INSERTED] ${prob.title} (${prob.difficulty} | ${prob.dsaTopic})`);
      }
    }

    const totalCount = await CodingProblem.countDocuments();
    const basicCount = await CodingProblem.countDocuments({ difficulty: "Basic" });

    console.log(`\n========================================`);
    console.log(`Basic Problems Seeding Completed!`);
    console.log(`Newly Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    console.log(`Total Basic Problems in DB: ${basicCount}`);
    console.log(`Total Coding Problems in DB: ${totalCount}`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
