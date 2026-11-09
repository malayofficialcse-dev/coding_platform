import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import CodingProblem from "./src/models/CodingProblem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.CODING_MONGO_URI || process.env.MONGO_URI;

const NEW_DSA_PROBLEMS = [
  // ==========================================
  // TOPIC: BINARY SEARCH
  // ==========================================
  {
    title: "Binary Search",
    difficulty: "Easy",
    dsaTopic: "Binary Search",
    tags: ["Binary Search", "Array"],
    description: "Given a sorted array of N integers and a target value, return the 0-based index if the target is found. If not, return -1.\nYou must write an algorithm with O(log N) runtime complexity.",
    constraints: "1 <= N <= 10^5\n-10^9 <= A[i], target <= 10^9\nArray is sorted in ascending order.",
    sampleTestCases: [
      { input: "6 9\n-1 0 3 5 9 12", output: "4", visible: true },
      { input: "6 2\n-1 0 3 5 9 12", output: "-1", visible: true },
    ],
    testCases: [
      { input: "6 9\n-1 0 3 5 9 12", output: "4", visible: true },
      { input: "6 2\n-1 0 3 5 9 12", output: "-1", visible: true },
      { input: "1 5\n5", output: "0", visible: false },
      { input: "1 3\n5", output: "-1", visible: false },
      { input: "5 10\n2 4 6 8 10", output: "4", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  const target = parseInt(input[1]);\n  const arr = input.slice(2, 2 + n).map(Number);\n  let left = 0, right = n - 1, ans = -1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) { ans = mid; break; }\n    else if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  console.log(ans);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n, target = int(data[0]), int(data[1])\n    arr = [int(x) for x in data[2:2+n]]\n    left, right = 0, n - 1\n    ans = -1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            ans = mid\n            break\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    print(ans)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n, target;\n    if (!(cin >> n >> target)) return 0;\n    vector<int> arr(n);\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    int left = 0, right = n - 1, ans = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) { ans = mid; break; }\n        else if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    cout << ans << "\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int left = 0, right = n - 1, ans = -1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (arr[mid] == target) { ans = mid; break; }\n            else if (arr[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        System.out.println(ans);\n    }\n}`
    },
    hints: ["Divide the search space in half each iteration using mid = (left + right) / 2.", "If arr[mid] < target, narrow to the right half; otherwise the left half."],
    editorial: "Standard binary search implementation running in O(log N) time and O(1) auxiliary space.",
    acceptanceRate: 85,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },
  {
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    dsaTopic: "Binary Search",
    tags: ["Binary Search", "Array", "Rotated Array"],
    description: "There is an integer array nums sorted in ascending order with distinct values. Prior to being passed to your function, nums is possibly rotated at an unknown pivot index k.\nGiven the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.\nYou must write an algorithm with O(log N) runtime complexity.",
    constraints: "1 <= N <= 10^5\n-10^9 <= nums[i], target <= 10^9\nAll values of nums are unique.",
    sampleTestCases: [
      { input: "7 0\n4 5 6 7 0 1 2", output: "4", visible: true },
      { input: "7 3\n4 5 6 7 0 1 2", output: "-1", visible: true },
    ],
    testCases: [
      { input: "7 0\n4 5 6 7 0 1 2", output: "4", visible: true },
      { input: "7 3\n4 5 6 7 0 1 2", output: "-1", visible: true },
      { input: "1 0\n0", output: "0", visible: false },
      { input: "3 1\n1 3 5", output: "0", visible: false },
      { input: "5 5\n4 5 1 2 3", output: "1", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input.length < 2) return;\n  const n = parseInt(input[0]);\n  const target = parseInt(input[1]);\n  const nums = input.slice(2, 2 + n).map(Number);\n  let left = 0, right = n - 1, ans = -1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) { ans = mid; break; }\n    if (nums[left] <= nums[mid]) {\n      if (nums[left] <= target && target < nums[mid]) right = mid - 1;\n      else left = mid + 1;\n    } else {\n      if (nums[mid] < target && target <= nums[right]) left = mid + 1;\n      else right = mid - 1;\n    }\n  }\n  console.log(ans);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n, target = int(data[0]), int(data[1])\n    nums = [int(x) for x in data[2:2+n]]\n    left, right = 0, n - 1\n    ans = -1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            ans = mid\n            break\n        if nums[left] <= nums[mid]:\n            if nums[left] <= target < nums[mid]:\n                right = mid - 1\n            else:\n                left = mid + 1\n        else:\n            if nums[mid] < target <= nums[right]:\n                left = mid + 1\n            else:\n                right = mid - 1\n    print(ans)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n, target;\n    if (!(cin >> n >> target)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int left = 0, right = n - 1, ans = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) { ans = mid; break; }\n        if (nums[left] <= nums[mid]) {\n            if (nums[left] <= target && target < nums[mid]) right = mid - 1;\n            else left = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[right]) left = mid + 1;\n            else right = mid - 1;\n        }\n    }\n    cout << ans << "\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int left = 0, right = n - 1, ans = -1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) { ans = mid; break; }\n            if (nums[left] <= nums[mid]) {\n                if (nums[left] <= target && target < nums[mid]) right = mid - 1;\n                else left = mid + 1;\n            } else {\n                if (nums[mid] < target && target <= nums[right]) left = mid + 1;\n                else right = mid - 1;\n            }\n        }\n        System.out.println(ans);\n    }\n}`
    },
    hints: ["At least one half (left or right) of the array is always sorted.", "Check if target falls within the bounds of the sorted half."],
    editorial: "Modified binary search: determine which half is normally sorted and test if the target lies within that range. Time complexity O(log N).",
    acceptanceRate: 68,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // ==========================================
  // TOPIC: STRINGS & TWO POINTERS
  // ==========================================
  {
    title: "Valid Anagram",
    difficulty: "Easy",
    dsaTopic: "String",
    tags: ["String", "Hash Table", "Sorting"],
    description: "Given two strings s and t, return 'true' if t is an anagram of s, and 'false' otherwise.\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    constraints: "1 <= s.length, t.length <= 10^5\ns and t consist of lowercase English letters.",
    sampleTestCases: [
      { input: "anagram nagaram", output: "true", visible: true },
      { input: "rat car", output: "false", visible: true },
    ],
    testCases: [
      { input: "anagram nagaram", output: "true", visible: true },
      { input: "rat car", output: "false", visible: true },
      { input: "a a", output: "true", visible: false },
      { input: "ab a", output: "false", visible: false },
      { input: "listen silent", output: "true", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const [s, t] = input;\n  if (s.length !== t.length) { console.log('false'); return; }\n  const count = {};\n  for (const c of s) count[c] = (count[c] || 0) + 1;\n  for (const c of t) {\n    if (!count[c]) { console.log('false'); return; }\n    count[c]--;\n  }\n  console.log('true');\n}\nsolve();`,
      python3: `import sys\nfrom collections import Counter\ndef solve():\n    data = sys.stdin.read().split()\n    if len(data) < 2: return\n    s, t = data[0], data[1]\n    print('true' if Counter(s) == Counter(t) else 'false')\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    string s, t;\n    if (!(cin >> s >> t)) return 0;\n    if (s.length() != t.length()) { cout << "false\\n"; return 0; }\n    vector<int> count(26, 0);\n    for (char c : s) count[c - 'a']++;\n    for (char c : t) {\n        count[c - 'a']--;\n        if (count[c - 'a'] < 0) { cout << "false\\n"; return 0; }\n    }\n    cout << "true\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        String t = sc.next();\n        if (s.length() != t.length()) { System.out.println("false"); return; }\n        int[] count = new int[26];\n        for (char c : s.toCharArray()) count[c - 'a']++;\n        for (char c : t.toCharArray()) {\n            count[c - 'a']--;\n            if (count[c - 'a'] < 0) { System.out.println("false"); return; }\n        }\n        System.out.println("true");\n    }\n}`
    },
    hints: ["Check if string lengths are identical first.", "Count the character frequencies of both strings using an array of size 26."],
    editorial: "Frequency array matching counts occurrences of all lowercase characters in O(N) time and O(1) space.",
    acceptanceRate: 92,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },
  {
    title: "Container With Most Water",
    difficulty: "Medium",
    dsaTopic: "Two Pointers",
    tags: ["Array", "Two Pointers", "Greedy"],
    description: "You are given an integer array height of length N. There are N vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\nReturn the maximum amount of water a container can store.",
    constraints: "2 <= N <= 10^5\n0 <= height[i] <= 10^4",
    sampleTestCases: [
      { input: "9\n1 8 6 2 5 4 8 3 7", output: "49", visible: true },
      { input: "2\n1 1", output: "1", visible: true },
    ],
    testCases: [
      { input: "9\n1 8 6 2 5 4 8 3 7", output: "49", visible: true },
      { input: "2\n1 1", output: "1", visible: true },
      { input: "5\n4 3 2 1 4", output: "16", visible: false },
      { input: "3\n1 2 1", output: "2", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const n = parseInt(input[0]);\n  const h = input.slice(1, 1 + n).map(Number);\n  let left = 0, right = n - 1, maxArea = 0;\n  while (left < right) {\n    const area = Math.min(h[left], h[right]) * (right - left);\n    if (area > maxArea) maxArea = area;\n    if (h[left] < h[right]) left++;\n    else right--;\n  }\n  console.log(maxArea);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    h = [int(x) for x in data[1:1+n]]\n    left, right, max_area = 0, n - 1, 0\n    while left < right:\n        area = min(h[left], h[right]) * (right - left)\n        if area > max_area: max_area = area\n        if h[left] < h[right]: left += 1\n        else: right -= 1\n    print(max_area)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> h(n);\n    for (int i = 0; i < n; i++) cin >> h[i];\n    int left = 0, right = n - 1;\n    long long maxArea = 0;\n    while (left < right) {\n        long long area = 1LL * min(h[left], h[right]) * (right - left);\n        if (area > maxArea) maxArea = area;\n        if (h[left] < h[right]) left++;\n        else right--;\n    }\n    cout << maxArea << "\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] h = new int[n];\n        for (int i = 0; i < n; i++) h[i] = sc.nextInt();\n        int left = 0, right = n - 1;\n        long maxArea = 0;\n        while (left < right) {\n            long area = (long) Math.min(h[left], h[right]) * (right - left);\n            if (area > maxArea) maxArea = area;\n            if (h[left] < h[right]) left++;\n            else right--;\n        }\n        System.out.println(maxArea);\n    }\n}`
    },
    hints: ["Start with the widest container using pointers at 0 and N-1.", "Move the pointer that points to the shorter line inward."],
    editorial: "Two-pointer approach: shrinking the width while greedily keeping the higher wall gives an optimal O(N) solution with O(1) extra space.",
    acceptanceRate: 74,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // ==========================================
  // TOPIC: DYNAMIC PROGRAMMING
  // ==========================================
  {
    title: "Climbing Stairs",
    difficulty: "Easy",
    dsaTopic: "Dynamic Programming",
    tags: ["Dynamic Programming", "Math", "Memoization"],
    description: "You are climbing a staircase. It takes N steps to reach the top.\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    constraints: "1 <= N <= 45",
    sampleTestCases: [
      { input: "2", output: "2", visible: true },
      { input: "3", output: "3", visible: true },
    ],
    testCases: [
      { input: "2", output: "2", visible: true },
      { input: "3", output: "3", visible: true },
      { input: "1", output: "1", visible: false },
      { input: "5", output: "8", visible: false },
      { input: "10", output: "89", visible: false },
      { input: "30", output: "1346269", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim();\n  if (!input) return;\n  const n = parseInt(input);\n  if (n <= 2) { console.log(n); return; }\n  let a = 1, b = 2;\n  for (let i = 3; i <= n; i++) {\n    const c = a + b;\n    a = b;\n    b = c;\n  }\n  console.log(b);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    if n <= 2:\n        print(n)\n        return\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    print(b)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    if (n <= 2) { cout << n << "\\n"; return 0; }\n    long long a = 1, b = 2;\n    for (int i = 3; i <= n; i++) {\n        long long c = a + b;\n        a = b;\n        b = c;\n    }\n    cout << b << "\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        if (n <= 2) { System.out.println(n); return; }\n        long a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            long c = a + b;\n            a = b;\n            b = c;\n        }\n        System.out.println(b);\n    }\n}`
    },
    hints: ["To reach step i, you could have come from step i-1 or step i-2.", "This is the Fibonacci sequence: ways[i] = ways[i-1] + ways[i-2]."],
    editorial: "Dynamic programming with O(1) space keeping track of the last two states in O(N) time.",
    acceptanceRate: 88,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },
  {
    title: "Coin Change",
    difficulty: "Medium",
    dsaTopic: "Dynamic Programming",
    tags: ["Dynamic Programming", "Breadth-First Search"],
    description: "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.\nYou may assume that you have an infinite number of each kind of coin.",
    constraints: "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
    sampleTestCases: [
      { input: "3 11\n1 2 5", output: "3", visible: true },
      { input: "1 3\n2", output: "-1", visible: true },
      { input: "1 0\n1", output: "0", visible: true },
    ],
    testCases: [
      { input: "3 11\n1 2 5", output: "3", visible: true },
      { input: "1 3\n2", output: "-1", visible: true },
      { input: "1 0\n1", output: "0", visible: true },
      { input: "3 7\n2 4 6", output: "-1", visible: false },
      { input: "4 6249\n186 419 83 408", output: "20", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const n = parseInt(input[0]);\n  const amount = parseInt(input[1]);\n  const coins = input.slice(2, 2 + n).map(Number);\n  const dp = new Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  for (let i = 1; i <= amount; i++) {\n    for (const c of coins) {\n      if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i - c] + 1);\n    }\n  }\n  console.log(dp[amount] === Infinity ? -1 : dp[amount]);\n}\nsolve();`,
      python3: `import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n, amount = int(data[0]), int(data[1])\n    coins = [int(x) for x in data[2:2+n]]\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for i in range(1, amount + 1):\n        for c in coins:\n            if i - c >= 0:\n                dp[i] = min(dp[i], dp[i - c] + 1)\n    print(-1 if dp[amount] == float('inf') else dp[amount])\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n, amount;\n    if (!(cin >> n >> amount)) return 0;\n    vector<int> coins(n);\n    for (int i = 0; i < n; i++) cin >> coins[i];\n    vector<int> dp(amount + 1, 1e9);\n    dp[0] = 0;\n    for (int i = 1; i <= amount; i++) {\n        for (int c : coins) {\n            if (i - c >= 0) dp[i] = min(dp[i], dp[i - c] + 1);\n        }\n    }\n    cout << (dp[amount] >= 1e9 ? -1 : dp[amount]) << "\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\nimport java.util.Arrays;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int amount = sc.nextInt();\n        int[] coins = new int[n];\n        for (int i = 0; i < n; i++) coins[i] = sc.nextInt();\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp, 1000000000);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int c : coins) {\n                if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i - c] + 1);\n            }\n        }\n        System.out.println(dp[amount] >= 1000000000 ? -1 : dp[amount]);\n    }\n}`
    },
    hints: ["Use bottom-up DP where dp[i] represents minimum coins to form value i.", "Initialize dp array with infinity and dp[0] = 0."],
    editorial: "Classic Unbounded Knapsack / Coin Change DP: for each target from 1 to amount, dp[i] = min(dp[i], dp[i - coin] + 1). Time O(N * amount), Space O(amount).",
    acceptanceRate: 62,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // ==========================================
  // TOPIC: TREES
  // ==========================================
  {
    title: "Maximum Depth of Binary Tree",
    difficulty: "Easy",
    dsaTopic: "Tree",
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"],
    description: "Given the root of a binary tree represented as an array in level-order traversal where -1 represents a NULL node, return its maximum depth.\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    constraints: "The number of nodes in the tree is in the range [0, 10^4].\n-100 <= Node.val <= 100",
    sampleTestCases: [
      { input: "7\n3 9 20 -1 -1 15 7", output: "3", visible: true },
      { input: "2\n1 -1", output: "1", visible: true },
    ],
    testCases: [
      { input: "7\n3 9 20 -1 -1 15 7", output: "3", visible: true },
      { input: "2\n1 -1", output: "1", visible: true },
      { input: "0", output: "0", visible: false },
      { input: "1\n42", output: "1", visible: false },
      { input: "5\n1 2 3 4 5", output: "3", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (!input || input[0] === '') return;\n  const n = parseInt(input[0]);\n  if (n === 0) { console.log(0); return; }\n  const vals = input.slice(1, 1 + n).map(Number);\n  if (vals[0] === -1) { console.log(0); return; }\n  let maxDepth = 0;\n  const queue = [{ idx: 0, depth: 1 }];\n  while (queue.length > 0) {\n    const { idx, depth } = queue.shift();\n    if (depth > maxDepth) maxDepth = depth;\n    const left = 2 * idx + 1;\n    const right = 2 * idx + 2;\n    if (left < n && vals[left] !== -1) queue.push({ idx: left, depth: depth + 1 });\n    if (right < n && vals[right] !== -1) queue.push({ idx: right, depth: depth + 1 });\n  }\n  console.log(maxDepth);\n}\nsolve();`,
      python3: `import sys\nfrom collections import deque\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    if n == 0:\n        print(0)\n        return\n    vals = [int(x) for x in data[1:1+n]]\n    if vals[0] == -1:\n        print(0)\n        return\n    q = deque([(0, 1)])\n    max_depth = 0\n    while q:\n        idx, depth = q.popleft()\n        if depth > max_depth: max_depth = depth\n        left = 2 * idx + 1\n        right = 2 * idx + 2\n        if left < n and vals[left] != -1: q.append((left, depth + 1))\n        if right < n and vals[right] != -1: q.append((right, depth + 1))\n    print(max_depth)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint main() {\n    int n;\n    if (!(cin >> n) || n == 0) { cout << 0 << "\\n"; return 0; }\n    vector<int> vals(n);\n    for (int i = 0; i < n; i++) cin >> vals[i];\n    if (vals[0] == -1) { cout << 0 << "\\n"; return 0; }\n    queue<pair<int, int>> q;\n    q.push({0, 1});\n    int maxDepth = 0;\n    while (!q.empty()) {\n        auto [idx, depth] = q.front(); q.pop();\n        if (depth > maxDepth) maxDepth = depth;\n        int left = 2 * idx + 1, right = 2 * idx + 2;\n        if (left < n && vals[left] != -1) q.push({left, depth + 1});\n        if (right < n && vals[right] != -1) q.push({right, depth + 1});\n    }\n    cout << maxDepth << "\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\nimport java.util.Queue;\nimport java.util.LinkedList;\npublic class Main {\n    static class Node { int idx, depth; Node(int i, int d){ idx = i; depth = d; } }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) { System.out.println(0); return; }\n        int n = sc.nextInt();\n        if (n == 0) { System.out.println(0); return; }\n        int[] vals = new int[n];\n        for (int i = 0; i < n; i++) vals[i] = sc.nextInt();\n        if (vals[0] == -1) { System.out.println(0); return; }\n        Queue<Node> q = new LinkedList<>();\n        q.add(new Node(0, 1));\n        int maxDepth = 0;\n        while (!q.isEmpty()) {\n            Node cur = q.poll();\n            if (cur.depth > maxDepth) maxDepth = cur.depth;\n            int left = 2 * cur.idx + 1, right = 2 * cur.idx + 2;\n            if (left < n && vals[left] != -1) q.add(new Node(left, cur.depth + 1));\n            if (right < n && vals[right] != -1) q.add(new Node(right, cur.depth + 1));\n        }\n        System.out.println(maxDepth);\n    }\n}`
    },
    hints: ["Level order traversal (BFS) with a queue counts tree levels directly.", "Recursion: depth = 1 + max(depth(left), depth(right))."],
    editorial: "Level-order traversal or recursive DFS traverses every node once in O(N) time with O(W) queue space.",
    acceptanceRate: 86,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },

  // ==========================================
  // TOPIC: GRAPHS
  // ==========================================
  {
    title: "Number of Islands",
    difficulty: "Medium",
    dsaTopic: "Graph",
    tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix"],
    description: "Given an M x N 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
    constraints: "M == grid.length\nN == grid[i].length\n1 <= M, N <= 300\ngrid[i][j] is '0' or '1'.",
    sampleTestCases: [
      { input: "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", output: "1", visible: true },
      { input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", output: "3", visible: true },
    ],
    testCases: [
      { input: "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", output: "1", visible: true },
      { input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", output: "3", visible: true },
      { input: "1 1\n1", output: "1", visible: false },
      { input: "1 1\n0", output: "0", visible: false },
      { input: "3 3\n1 0 1\n0 1 0\n1 0 1", output: "5", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const m = parseInt(input[0]);\n  const n = parseInt(input[1]);\n  let ptr = 2;\n  const grid = [];\n  for (let i = 0; i < m; i++) {\n    grid.push(input.slice(ptr, ptr + n).map(Number));\n    ptr += n;\n  }\n  let count = 0;\n  function dfs(r, c) {\n    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== 1) return;\n    grid[r][c] = 0;\n    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);\n  }\n  for (let i = 0; i < m; i++) {\n    for (let j = 0; j < n; j++) {\n      if (grid[i][j] === 1) {\n        count++;\n        dfs(i, j);\n      }\n    }\n  }\n  console.log(count);\n}\nsolve();`,
      python3: `import sys\nsys.setrecursionlimit(200000)\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    m, n = int(data[0]), int(data[1])\n    grid = []\n    ptr = 2\n    for _ in range(m):\n        grid.append([int(x) for x in data[ptr:ptr+n]])\n        ptr += n\n    count = 0\n    def dfs(r, c):\n        if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != 1:\n            return\n        grid[r][c] = 0\n        dfs(r + 1, c)\n        dfs(r - 1, c)\n        dfs(r, c + 1)\n        dfs(r, c - 1)\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] == 1:\n                count += 1\n                dfs(i, j)\n    print(count)\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint m, n;\nvector<vector<int>> grid;\nvoid dfs(int r, int c) {\n    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != 1) return;\n    grid[r][c] = 0;\n    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);\n}\nint main() {\n    if (!(cin >> m >> n)) return 0;\n    grid.assign(m, vector<int>(n));\n    for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) cin >> grid[i][j];\n    int count = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (grid[i][j] == 1) { count++; dfs(i, j); }\n        }\n    }\n    cout << count << "\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\npublic class Main {\n    static int m, n;\n    static int[][] grid;\n    static void dfs(int r, int c) {\n        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != 1) return;\n        grid[r][c] = 0;\n        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        m = sc.nextInt();\n        n = sc.nextInt();\n        grid = new int[m][n];\n        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) grid[i][j] = sc.nextInt();\n        int count = 0;\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (grid[i][j] == 1) { count++; dfs(i, j); }\n            }\n        }\n        System.out.println(count);\n    }\n}`
    },
    hints: ["Iterate through every cell in the grid. When you find a '1', trigger a Flood Fill (DFS/BFS) to visit and mark all connected land cells as '0'.", "Increment the island count for each unvisited '1' you encounter."],
    editorial: "Connected components in an undirected grid graph. Standard DFS/BFS traversal with O(M * N) time and O(M * N) call stack space.",
    acceptanceRate: 70,
    timeLimit: "1.5s",
    memoryLimit: "256 MB",
  },

  // ==========================================
  // TOPIC: HEAP / PRIORITY QUEUE
  // ==========================================
  {
    title: "Kth Largest Element in an Array",
    difficulty: "Medium",
    dsaTopic: "Heap",
    tags: ["Array", "Divide and Conquer", "Sorting", "Heap", "Quickselect"],
    description: "Given an integer array nums and an integer k, return the kth largest element in the array.\nNote that it is the kth largest element in the sorted order, not the kth distinct element.\nCan you solve it without sorting in O(N log K) time?",
    constraints: "1 <= k <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
    sampleTestCases: [
      { input: "6 2\n3 2 1 5 6 4", output: "5", visible: true },
      { input: "9 4\n3 2 3 1 2 4 5 5 6", output: "4", visible: true },
    ],
    testCases: [
      { input: "6 2\n3 2 1 5 6 4", output: "5", visible: true },
      { input: "9 4\n3 2 3 1 2 4 5 5 6", output: "4", visible: true },
      { input: "1 1\n100", output: "100", visible: false },
      { input: "4 3\n7 10 4 20", output: "7", visible: false },
    ],
    boilerplateCodes: {
      javascript: `const fs = require('fs');\nfunction solve() {\n  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n  if (input.length < 2) return;\n  const n = parseInt(input[0]);\n  const k = parseInt(input[1]);\n  const nums = input.slice(2, 2 + n).map(Number);\n  nums.sort((a, b) => b - a);\n  console.log(nums[k - 1]);\n}\nsolve();`,
      python3: `import sys, heapq\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n, k = int(data[0]), int(data[1])\n    nums = [int(x) for x in data[2:2+n]]\n    print(heapq.nlargest(k, nums)[-1])\nif __name__ == '__main__':\n    solve()`,
      cpp: `#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint main() {\n    int n, k;\n    if (!(cin >> n >> k)) return 0;\n    priority_queue<int, vector<int>, greater<int>> minHeap;\n    for (int i = 0; i < n; i++) {\n        int x; cin >> x;\n        minHeap.push(x);\n        if (minHeap.size() > k) minHeap.pop();\n    }\n    cout << minHeap.top() << "\\n";\n    return 0;\n}`,
      java: `import java.util.Scanner;\nimport java.util.PriorityQueue;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n        PriorityQueue<Integer> pq = new PriorityQueue<>();\n        for (int i = 0; i < n; i++) {\n            pq.add(sc.nextInt());\n            if (pq.size() > k) pq.poll();\n        }\n        System.out.println(pq.peek());\n    }\n}`
    },
    hints: ["Use a min-heap of size K. When the heap exceeds size K, pop the smallest element.", "The root of the min-heap will always contain the Kth largest element."],
    editorial: "Using a min-heap of size K processes all N numbers in O(N log K) time with O(K) space.",
    acceptanceRate: 77,
    timeLimit: "1.0s",
    memoryLimit: "256 MB",
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB for Coding Problems...");
    await mongoose.connect(MONGO_URI, { dbName: "coding_problems_db" });
    console.log("Connected successfully to coding_problems_db ✓");

    let inserted = 0;
    let updated = 0;

    for (const prob of NEW_DSA_PROBLEMS) {
      const existing = await CodingProblem.findOne({ title: prob.title });
      if (existing) {
        await CodingProblem.findByIdAndUpdate(existing._id, prob);
        updated++;
        console.log(`Updated: ${prob.title} (${prob.dsaTopic})`);
      } else {
        await CodingProblem.create(prob);
        inserted++;
        console.log(`Inserted: ${prob.title} (${prob.dsaTopic})`);
      }
    }

    const totalCount = await CodingProblem.countDocuments();
    console.log(`\n=== Seeding Finished ===`);
    console.log(`Newly Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    console.log(`Total coding problems now in DB: ${totalCount}`);

    const topics = await CodingProblem.distinct("dsaTopic");
    console.log(`All available topics now:`, topics);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
