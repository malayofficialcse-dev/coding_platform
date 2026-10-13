import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/code_campus";

const dsaQuestions = [
  {
    question: "What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: "O(log n)",
  },
  {
    question: "Which data structure follows the LIFO (Last In First Out) principle?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    answer: "Stack",
  },
  {
    question: "Which sorting algorithm has the best average-case time complexity of O(n log n) and is stable?",
    options: ["Quick Sort", "Merge Sort", "Heap Sort", "Selection Sort"],
    answer: "Merge Sort",
  },
  {
    question: "What is the worst-case time complexity of QuickSort?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    answer: "O(n^2)",
  },
  {
    question: "Which data structure is primarily used for implementing Breadth-First Search (BFS) in a graph?",
    options: ["Stack", "Queue", "Priority Queue", "Binary Tree"],
    answer: "Queue",
  },
  {
    question: "What is the time complexity to insert a node at the beginning of a singly linked list?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    answer: "O(1)",
  },
  {
    question: "Which data structure uses key-value pairs and offers O(1) average lookup time?",
    options: ["Binary Heap", "Hash Table", "Trie", "Red-Black Tree"],
    answer: "Hash Table",
  },
  {
    question: "In a circular queue with size N, when is the queue considered full?",
    options: ["front == rear", "(rear + 1) % N == front", "rear == N - 1", "front == 0"],
    answer: "(rear + 1) % N == front",
  },
  {
    question: "What is the height of a balanced binary tree containing n nodes?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n/2)"],
    answer: "O(log n)",
  },
  {
    question: "Which algorithm is used to find the shortest path from a single source in a weighted graph with non-negative edge weights?",
    options: ["Prim's Algorithm", "Dijkstra's Algorithm", "Kruskal's Algorithm", "Floyd-Warshall Algorithm"],
    answer: "Dijkstra's Algorithm",
  },
  {
    question: "What is the minimum number of queues required to implement a stack?",
    options: ["1", "2", "3", "4"],
    answer: "2",
  },
  {
    question: "Which of the following traversals of a Binary Search Tree produces elements in sorted ascending order?",
    options: ["Pre-order", "In-order", "Post-order", "Level-order"],
    answer: "In-order",
  },
  {
    question: "What is the maximum number of children a node can have in a binary tree?",
    options: ["1", "2", "3", "Any number"],
    answer: "2",
  },
  {
    question: "Which algorithm is commonly used to find the Minimum Spanning Tree (MST) of a graph?",
    options: ["Bellman-Ford Algorithm", "Kruskal's Algorithm", "Kadane's Algorithm", "KMP Algorithm"],
    answer: "Kruskal's Algorithm",
  },
  {
    question: "What is the space complexity of Depth First Search (DFS) on a tree of height h?",
    options: ["O(1)", "O(h)", "O(V + E)", "O(V^2)"],
    answer: "O(h)",
  },
  {
    question: "Which technique is used to resolve hash collisions by storing multiple elements at the same hash index in a linked list?",
    options: ["Linear Probing", "Chaining", "Quadratic Probing", "Double Hashing"],
    answer: "Chaining",
  },
  {
    question: "What is the best-case time complexity of Bubble Sort when an optimized flag is used?",
    options: ["O(1)", "O(n)", "O(n log n)", "O(n^2)"],
    answer: "O(n)",
  },
  {
    question: "A tree in which every node except the leaves has either 0 or 2 children is called a:",
    options: ["Full Binary Tree", "Complete Binary Tree", "Perfect Binary Tree", "Degenerate Tree"],
    answer: "Full Binary Tree",
  },
  {
    question: "Which data structure is optimal for implementing an LRU (Least Recently Used) cache?",
    options: ["Array and Stack", "Hash Map and Doubly Linked List", "Queue and Binary Tree", "Max Heap"],
    answer: "Hash Map and Doubly Linked List",
  },
  {
    question: "What is the prefix notation equivalent of the infix expression (A + B) * C?",
    options: ["* + A B C", "+ * A B C", "A B + C *", "* A + B C"],
    answer: "* + A B C",
  },
  {
    question: "What is the time complexity of deleting an arbitrary node from a Doubly Linked List given its pointer?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    answer: "O(1)",
  },
  {
    question: "Which algorithm design paradigm does the 0/1 Knapsack problem typically use for an optimal solution?",
    options: ["Greedy Algorithm", "Dynamic Programming", "Divide and Conquer", "Backtracking"],
    answer: "Dynamic Programming",
  },
  {
    question: "What is the minimum number of nodes in an AVL tree of height 3 (with height of single node = 1)?",
    options: ["3", "4", "7", "8"],
    answer: "4",
  },
  {
    question: "What is the balance factor of any node in an AVL tree allowed to be?",
    options: ["-1, 0, or 1", "0 or 1", "-2, -1, or 0", "Any integer"],
    answer: "-1, 0, or 1",
  },
  {
    question: "In a min-heap, where is the minimum element always located?",
    options: ["At any leaf node", "At the root node", "At the leftmost node", "At index n/2"],
    answer: "At the root node",
  },
  {
    question: "What is the time complexity to build a binary heap from an unsorted array of n elements?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    answer: "O(n)",
  },
  {
    question: "Which algorithm is used to find the maximum contiguous subarray sum in O(n) time?",
    options: ["Dijkstra's Algorithm", "Kadane's Algorithm", "Floyd's Cycle Finding", "Boyer-Moore Voting"],
    answer: "Kadane's Algorithm",
  },
  {
    question: "How many edges does a connected acyclic graph (tree) with V vertices have?",
    options: ["V", "V - 1", "V + 1", "2V"],
    answer: "V - 1",
  },
  {
    question: "What is the primary advantage of a Trie data structure?",
    options: ["Constant space complexity", "Fast prefix-based searching of strings", "Sorting numerical values in O(1)", "Guaranteed O(1) graph traversal"],
    answer: "Fast prefix-based searching of strings",
  },
  {
    question: "Which algorithm detects a cycle in a linked list using two pointers (slow and fast)?",
    options: ["Tarjan's Algorithm", "Floyd's Tortoise and Hare Algorithm", "Kosaraju's Algorithm", "Kruskal's Algorithm"],
    answer: "Floyd's Tortoise and Hare Algorithm",
  },
];

const webDevQuestions = [
  {
    question: "Which HTML5 element is used to specify a header for a document or section?",
    options: ["<top>", "<head>", "<header>", "<section-header>"],
    answer: "<header>",
  },
  {
    question: "In CSS Flexbox, which property defines how items are positioned along the main axis?",
    options: ["align-items", "justify-content", "align-content", "flex-direction"],
    answer: "justify-content",
  },
  {
    question: "Which JavaScript keyword declares a block-scoped variable that cannot be reassigned?",
    options: ["var", "let", "const", "static"],
    answer: "const",
  },
  {
    question: "What does the '=== ' operator do in JavaScript?",
    options: ["Compares values only", "Assigns a variable", "Compares value and type without coercion", "Checks if undefined"],
    answer: "Compares value and type without coercion",
  },
  {
    question: "Which React hook is used to manage side effects such as data fetching and subscriptions?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    answer: "useEffect",
  },
  {
    question: "What does CSS 'box-sizing: border-box' do?",
    options: ["Adds a border to all boxes", "Includes padding and border in the element's total width and height", "Excludes padding from the width", "Renders shadows around the border"],
    answer: "Includes padding and border in the element's total width and height",
  },
  {
    question: "Which HTTP status code signifies a resource was successfully created?",
    options: ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
    answer: "201 Created",
  },
  {
    question: "What is the purpose of the 'async' attribute on an HTML <script> tag?",
    options: ["Executes the script after DOM is completely parsed", "Executes the script asynchronously as soon as it is downloaded", "Prevents script execution until user interaction", "Forces synchronous script execution"],
    answer: "Executes the script asynchronously as soon as it is downloaded",
  },
  {
    question: "Which of the following is NOT a primitive data type in JavaScript?",
    options: ["String", "Number", "Boolean", "Object"],
    answer: "Object",
  },
  {
    question: "What does CORS stand for in web security and API integration?",
    options: ["Cross-Origin Resource Sharing", "Central Object Relay Service", "Cross-Origin Routing System", "Client Operational Request Standard"],
    answer: "Cross-Origin Resource Sharing",
  },
  {
    question: "In React, what is the role of the 'key' prop when rendering lists of elements?",
    options: ["Provides CSS styling to the item", "Helps React identify which items have changed, been added, or removed", "Defines the encryption key for component data", "Binds data to the global context"],
    answer: "Helps React identify which items have changed, been added, or removed",
  },
  {
    question: "Which method converts a JavaScript object into a JSON string?",
    options: ["JSON.parse()", "JSON.stringify()", "JSON.toString()", "JSON.encode()"],
    answer: "JSON.stringify()",
  },
  {
    question: "What is an Immediately Invoked Function Expression (IIFE) in JavaScript?",
    options: ["A function that executes automatically as soon as it is defined", "A function executed in a web worker", "A recursive function that never halts", "A higher-order function that returns a promise"],
    answer: "A function that executes automatically as soon as it is defined",
  },
  {
    question: "Which storage mechanism stores data with no expiration time across browser sessions?",
    options: ["sessionStorage", "localStorage", "Cookies with Max-Age=0", "Memory Cache"],
    answer: "localStorage",
  },
  {
    question: "Which CSS layout system is two-dimensional, handling both rows and columns simultaneously?",
    options: ["Flexbox", "CSS Grid", "Float layout", "Position absolute"],
    answer: "CSS Grid",
  },
  {
    question: "What is event bubbling in the browser DOM?",
    options: ["Events propagating from target node up to the window object", "Events firing from window down to target node", "Creating multiple custom events simultaneously", "Canceling the default browser behavior"],
    answer: "Events propagating from target node up to the window object",
  },
  {
    question: "What will `typeof NaN` evaluate to in JavaScript?",
    options: ["'nan'", "'undefined'", "'number'", "'object'"],
    answer: "'number'",
  },
  {
    question: "In React, what does the 'useMemo' hook return?",
    options: ["A memoized callback function", "A memoized value resulting from a computation", "A DOM node reference", "A mutable state object"],
    answer: "A memoized value resulting from a computation",
  },
  {
    question: "Which HTTP method is idempotent and intended to replace an existing resource completely?",
    options: ["POST", "PUT", "PATCH", "CONNECT"],
    answer: "PUT",
  },
  {
    question: "What is a closure in JavaScript?",
    options: ["A function that has access to its outer function scope even after the outer function has closed", "A function that terminates immediately upon execution", "A way to close browser tabs via JavaScript", "An object that hides all properties using symbols"],
    answer: "A function that has access to its outer function scope even after the outer function has closed",
  },
  {
    question: "What does the 'z-index' CSS property control?",
    options: ["The zoom level of an element", "The stacking order of positioned elements along the z-axis", "The 3D perspective distance", "The transparency percentage"],
    answer: "The stacking order of positioned elements along the z-axis",
  },
  {
    question: "Which JavaScript Array method returns a new array with all elements that pass the provided test function?",
    options: ["map()", "filter()", "reduce()", "forEach()"],
    answer: "filter()",
  },
  {
    question: "What is the Virtual DOM in React?",
    options: ["A direct copy of the HTML markup in localStorage", "A lightweight in-memory representation of the real DOM tree", "A browser plugin for debugging React components", "A shadow DOM implementation for custom elements"],
    answer: "A lightweight in-memory representation of the real DOM tree",
  },
  {
    question: "Which response header prevents Cross-Site Scripting (XSS) by restricting where scripts can be loaded from?",
    options: ["Access-Control-Allow-Origin", "Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security"],
    answer: "Content-Security-Policy",
  },
  {
    question: "How can you cancel an ongoing fetch request in modern JavaScript?",
    options: ["Using clearTimeout()", "Using AbortController", "Using window.stop()", "Setting fetch options to cancel: true"],
    answer: "Using AbortController",
  },
  {
    question: "What is the output of `[] + []` in JavaScript?",
    options: ["[]", "'' (empty string)", "undefined", "NaN"],
    answer: "'' (empty string)",
  },
  {
    question: "Which CSS unit is relative to the font-size of the root <html> element?",
    options: ["em", "rem", "vh", "%"],
    answer: "rem",
  },
  {
    question: "In a React Controlled Component, where is form input data typically handled?",
    options: ["By the browser DOM natively", "By React component state", "In cookies", "Through hidden input fields"],
    answer: "By React component state",
  },
  {
    question: "Which JavaScript API is used to run scripts in background threads without blocking the user interface?",
    options: ["Web Workers", "Service Workers", "WebSockets", "Shadow DOM"],
    answer: "Web Workers",
  },
  {
    question: "What does the 'defer' attribute on an HTML <script> tag ensure?",
    options: ["The script is executed immediately while halting HTML parsing", "The script is executed only after the HTML document is fully parsed", "The script is executed on mouse hover", "The script is never executed"],
    answer: "The script is executed only after the HTML document is fully parsed",
  },
];

const cppQuestions = [
  {
    question: "Which concept of OOP allows the same function name to behave differently based on arguments?",
    options: ["Polymorphism", "Encapsulation", "Abstraction", "Inheritance"],
    answer: "Polymorphism",
  },
  {
    question: "What is the purpose of a virtual destructor in C++?",
    options: ["To prevent memory leaks when deleting derived class objects through base pointers", "To make the destructor private", "To speed up object deallocation", "To prevent class inheritance"],
    answer: "To prevent memory leaks when deleting derived class objects through base pointers",
  },
  {
    question: "Which access specifier in C++ allows member access only to the class itself and derived classes?",
    options: ["private", "public", "protected", "internal"],
    answer: "protected",
  },
  {
    question: "What is an abstract class in C++?",
    options: ["A class that contains only private variables", "A class with at least one pure virtual function", "A class that cannot have derived classes", "A class defined with the 'abstract' keyword"],
    answer: "A class with at least one pure virtual function",
  },
  {
    question: "How is a pure virtual function declared in C++?",
    options: ["virtual void display() = 0;", "pure virtual void display();", "void display() virtual = null;", "virtual void display() {}"],
    answer: "virtual void display() = 0;",
  },
  {
    question: "Which operator cannot be overloaded in C++?",
    options: ["+", "==", ":: (scope resolution)", "[]"],
    answer: ":: (scope resolution)",
  },
  {
    question: "What happens when an object is passed by value to a function in C++?",
    options: ["The original object is modified directly", "The copy constructor is invoked to create a local copy", "The default constructor is invoked", "A pointer is implicitly passed"],
    answer: "The copy constructor is invoked to create a local copy",
  },
  {
    question: "Which smart pointer in modern C++ (C++11+) provides exclusive ownership of dynamically allocated memory?",
    options: ["std::shared_ptr", "std::unique_ptr", "std::weak_ptr", "std::auto_ptr"],
    answer: "std::unique_ptr",
  },
  {
    question: "What is the Diamond Problem in C++ object-oriented programming?",
    options: ["Circular dependency between headers", "Ambiguity arising from multiple inheritance having a common ancestor", "Memory fragmentation in heap memory", "Stack overflow in recursive calls"],
    answer: "Ambiguity arising from multiple inheritance having a common ancestor",
  },
  {
    question: "How do you solve the Diamond Problem in C++?",
    options: ["By using virtual inheritance", "By making all base functions private", "By using friend functions", "By declaring templates"],
    answer: "By using virtual inheritance",
  },
  {
    question: "What does RAII stand for in C++ design philosophy?",
    options: ["Resource Acquisition Is Initialization", "Random Access Indexing Interface", "Runtime Allocation In Instances", "Reference Allocation And Initialization"],
    answer: "Resource Acquisition Is Initialization",
  },
  {
    question: "Which STL container is implemented as a contiguous dynamic array?",
    options: ["std::list", "std::vector", "std::deque", "std::set"],
    answer: "std::vector",
  },
  {
    question: "What is the time complexity of searching an element in std::unordered_map on average?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: "O(1)",
  },
  {
    question: "What is a friend function in C++?",
    options: ["A function that belongs to all derived classes", "A non-member function granted access to private and protected members of a class", "A function that cannot take arguments", "A constructor defined outside the class"],
    answer: "A non-member function granted access to private and protected members of a class",
  },
  {
    question: "Which keyword is used to prevent a class from being inherited in C++11?",
    options: ["sealed", "final", "const", "static"],
    answer: "final",
  },
  {
    question: "What is the size of an empty class in C++?",
    options: ["0 bytes", "1 byte", "4 bytes", "Compiler error"],
    answer: "1 byte",
  },
  {
    question: "What is a vtable (virtual table) in C++?",
    options: ["A table storing class member variables", "A table of function pointers used for dynamic dispatch of virtual functions", "A database table connected via ODBC", "A cache for template instantiations"],
    answer: "A table of function pointers used for dynamic dispatch of virtual functions",
  },
  {
    question: "Which casting operator performs safe runtime downcasting in polymorphic class hierarchies?",
    options: ["static_cast", "dynamic_cast", "reinterpret_cast", "const_cast"],
    answer: "dynamic_cast",
  },
  {
    question: "What is the output of `delete` when used on a pointer allocated with `new[]`?",
    options: ["It frees all elements safely", "Undefined behavior", "Compiler error", "Memory is moved to stack"],
    answer: "Undefined behavior",
  },
  {
    question: "Which constructor is called when an object is initialized with another object of the same class?",
    options: ["Default constructor", "Copy constructor", "Parameterized constructor", "Conversion constructor"],
    answer: "Copy constructor",
  },
  {
    question: "What does the keyword 'explicit' on a single-argument constructor prevent?",
    options: ["Object destruction", "Implicit type conversions", "Virtual inheritance", "Dynamic memory allocation"],
    answer: "Implicit type conversions",
  },
  {
    question: "What is the underlying data structure of std::map in C++ STL?",
    options: ["Hash Table", "Red-Black Tree", "B-Tree", "Linked List"],
    answer: "Red-Black Tree",
  },
  {
    question: "Which smart pointer breaks circular references caused by shared_ptr?",
    options: ["std::unique_ptr", "std::weak_ptr", "std::auto_ptr", "std::scoped_ptr"],
    answer: "std::weak_ptr",
  },
  {
    question: "What does 'const' at the end of a member function declaration mean: `void getValue() const;`?",
    options: ["The function returns a constant value", "The function cannot modify any non-mutable member variables of the object", "The function is executed at compile-time", "The function cannot be overloaded"],
    answer: "The function cannot modify any non-mutable member variables of the object",
  },
  {
    question: "Which mechanism allows templates to accept types as parameters?",
    options: ["Generic programming", "Late binding", "Macro pre-processing", "Reflection"],
    answer: "Generic programming",
  },
  {
    question: "What is early binding (static binding) in C++?",
    options: ["Resolving function calls at compile time", "Resolving function calls at run time using vtable", "Binding variables to memory during execution", "Dynamic loading of DLLs"],
    answer: "Resolving function calls at compile time",
  },
  {
    question: "What is a move constructor in C++11?",
    options: ["A constructor that moves an object across threads", "A constructor that transfers resource ownership from an rvalue object without deep copying", "A constructor called when copying arrays", "A constructor replacing destructors"],
    answer: "A constructor that transfers resource ownership from an rvalue object without deep copying",
  },
  {
    question: "What syntax represents an rvalue reference in C++11?",
    options: ["Type&", "Type&&", "Type*", "Type^"],
    answer: "Type&&",
  },
  {
    question: "Which keyword specifies that a function or variable can be evaluated at compile time?",
    options: ["constexpr", "const", "static", "inline"],
    answer: "constexpr",
  },
  {
    question: "What is encapsulation in OOP?",
    options: ["Hiding internal details and binding data with methods that manipulate it", "Deriving new classes from existing classes", "Writing code that handles multiple data types", "Executing code across multiple processors"],
    answer: "Hiding internal details and binding data with methods that manipulate it",
  },
];

const osQuestions = [
  {
    question: "What is a process in operating systems?",
    options: ["A program stored on disk", "A program in execution", "A hardware component", "A compiler directive"],
    answer: "A program in execution",
  },
  {
    question: "Which of the following is NOT a valid state of a process?",
    options: ["Ready", "Running", "Blocked/Waiting", "Compiled"],
    answer: "Compiled",
  },
  {
    question: "What is the primary difference between a process and a thread?",
    options: ["Threads do not share memory; processes share memory", "Threads within the same process share code, data, and resources", "A process can have only one thread", "Processes are scheduled faster than threads"],
    answer: "Threads within the same process share code, data, and resources",
  },
  {
    question: "Which CPU scheduling algorithm is non-preemptive and prone to the convoy effect?",
    options: ["First-Come, First-Served (FCFS)", "Round Robin (RR)", "Shortest Remaining Time First (SRTF)", "Priority Scheduling with preemption"],
    answer: "First-Come, First-Served (FCFS)",
  },
  {
    question: "What is thrashing in an operating system?",
    options: ["A condition where high CPU utilization occurs", "A state where the system spends more time paging than executing processes", "A failure in the hard drive motor", "A sudden termination of deadlocked threads"],
    answer: "A state where the system spends more time paging than executing processes",
  },
  {
    question: "Which of the following is NOT one of Coffman's four necessary conditions for deadlock?",
    options: ["Mutual Exclusion", "Hold and Wait", "Preemption allowed", "Circular Wait"],
    answer: "Preemption allowed",
  },
  {
    question: "Which algorithm is used by the operating system for Deadlock Avoidance?",
    options: ["Banker's Algorithm", "Dijkstra's Algorithm", "Round Robin Algorithm", "SSTF Disk Scheduling"],
    answer: "Banker's Algorithm",
  },
  {
    question: "What is a context switch in an OS?",
    options: ["Switching from user mode to kernel mode only", "Saving the state of an active process and restoring another process state", "Changing network interfaces", "Switching screen resolution"],
    answer: "Saving the state of an active process and restoring another process state",
  },
  {
    question: "What data structure does the OS kernel use to hold information about a specific process?",
    options: ["PCB (Process Control Block)", "FAT (File Allocation Table)", "MBR (Master Boot Record)", "TLB (Translation Lookaside Buffer)"],
    answer: "PCB (Process Control Block)",
  },
  {
    question: "What is the purpose of the Translation Lookaside Buffer (TLB)?",
    options: ["To store user passwords", "To cache recent virtual-to-physical address translations", "To buffer disk read operations", "To manage socket connections"],
    answer: "To cache recent virtual-to-physical address translations",
  },
  {
    question: "Which page replacement algorithm suffers from Belady's Anomaly?",
    options: ["FIFO (First In First Out)", "LRU (Least Recently Used)", "Optimal Page Replacement", "LFU (Least Frequently Used)"],
    answer: "FIFO (First In First Out)",
  },
  {
    question: "What is virtual memory primarily used for?",
    options: ["Increasing CPU cache speed", "Allowing execution of processes that may not be completely in physical memory", "Speeding up disk rotations", "Replacing physical RAM permanently"],
    answer: "Allowing execution of processes that may not be completely in physical memory",
  },
  {
    question: "Which Linux command displays real-time system process metrics and CPU usage?",
    options: ["ls", "top", "grep", "chmod"],
    answer: "top",
  },
  {
    question: "What does the command `chmod 755 file.sh` do in Linux?",
    options: ["Gives rwx to owner, and rx to group and others", "Gives read-only access to all", "Deletes file.sh after 755 seconds", "Encrypts file.sh"],
    answer: "Gives rwx to owner, and rx to group and others",
  },
  {
    question: "What is a zombie process in Unix/Linux?",
    options: ["A process that consumes 100% CPU", "A process that has completed execution but still has an entry in the process table", "A malicious process running without permissions", "A process waiting for I/O indefinitely"],
    answer: "A process that has completed execution but still has an entry in the process table",
  },
  {
    question: "What is an orphan process in Linux?",
    options: ["A process whose parent process terminated before it did", "A process without memory allocation", "A process without child threads", "A daemon process without standard input"],
    answer: "A process whose parent process terminated before it did",
  },
  {
    question: "Which system call is used to create a new child process in Unix/Linux?",
    options: ["fork()", "exec()", "wait()", "signal()"],
    answer: "fork()",
  },
  {
    question: "What does the `kill -9 <PID>` command do in Linux?",
    options: ["Sends SIGTERM to gracefully shut down the process", "Sends SIGKILL to forcefully terminate the process immediately", "Pauses process execution", "Decreases process priority by 9"],
    answer: "Sends SIGKILL to forcefully terminate the process immediately",
  },
  {
    question: "What is the critical section problem in multi-threaded programming?",
    options: ["A portion of code where shared resources are accessed that requires mutual exclusion", "A hardware defect in the CPU cache", "An unhandled divide-by-zero exception", "A section of memory reserved exclusively for bootloaders"],
    answer: "A portion of code where shared resources are accessed that requires mutual exclusion",
  },
  {
    question: "Which synchronization primitive maintains an integer count and supports wait() and signal() operations?",
    options: ["Mutex", "Semaphore", "Spinlock", "Condition Variable"],
    answer: "Semaphore",
  },
  {
    question: "What is internal fragmentation in memory allocation?",
    options: ["Unused memory space within an allocated block or page", "Memory that is free outside allocated partitions but too small to use", "Fragmentation of files on a hard drive", "Damage to physical RAM cells"],
    answer: "Unused memory space within an allocated block or page",
  },
  {
    question: "Which disk scheduling algorithm services requests closest to the current head position first?",
    options: ["FCFS", "SSTF (Shortest Seek Time First)", "SCAN", "C-LOOK"],
    answer: "SSTF (Shortest Seek Time First)",
  },
  {
    question: "Which Linux command is used to inspect disk space usage of file systems?",
    options: ["df -h", "du -sh", "free -m", "lsblk"],
    answer: "df -h",
  },
  {
    question: "What is the role of the 'init' (or systemd PID 1) process in Linux?",
    options: ["It is the ancestor of all processes and initializes the system", "It handles network traffic exclusively", "It formats unmounted disks", "It is the root user password manager"],
    answer: "It is the ancestor of all processes and initializes the system",
  },
  {
    question: "Which CPU scheduling algorithm gives each process a small fixed unit of CPU time called a time quantum?",
    options: ["SJF", "Round Robin", "Priority Scheduling", "Multilevel Feedback Queue"],
    answer: "Round Robin",
  },
  {
    question: "What is a race condition in operating systems?",
    options: ["A condition where two or more threads compete for shared data and final result depends on timing", "Two CPU cores competing for overclocking speed", "Processes racing to terminate first", "Network packets arriving out of order"],
    answer: "A condition where two or more threads compete for shared data and final result depends on timing",
  },
  {
    question: "Which Linux command searches for text patterns within files using regular expressions?",
    options: ["find", "grep", "sed", "awk"],
    answer: "grep",
  },
  {
    question: "What is the function of the swap space on a hard drive?",
    options: ["To store backup copies of the kernel", "To extend physical RAM by moving inactive memory pages to disk", "To store temporary user downloads", "To enable dual-booting"],
    answer: "To extend physical RAM by moving inactive memory pages to disk",
  },
  {
    question: "What is an inode in a Linux file system?",
    options: ["A data structure that stores all metadata about a file except its name and actual content", "The network socket descriptor for remote files", "A hardware interface connecting storage drives", "The root directory shortcut"],
    answer: "A data structure that stores all metadata about a file except its name and actual content",
  },
  {
    question: "Which memory management technique divides physical memory into fixed-size blocks called frames?",
    options: ["Paging", "Segmentation", "Overlaying", "Dynamic Partitioning"],
    answer: "Paging",
  },
];

const networkQuestions = [
  {
    question: "How many layers are in the OSI Reference Model?",
    options: ["4", "5", "7", "8"],
    answer: "7",
  },
  {
    question: "Which layer of the OSI model is responsible for end-to-end reliable transmission, error recovery, and flow control?",
    options: ["Network Layer", "Transport Layer", "Data Link Layer", "Session Layer"],
    answer: "Transport Layer",
  },
  {
    question: "Which protocol is connection-oriented, provides reliable delivery, and uses a three-way handshake?",
    options: ["UDP", "TCP", "ICMP", "IP"],
    answer: "TCP",
  },
  {
    question: "What is the standard port number for HTTPS traffic?",
    options: ["80", "443", "8080", "22"],
    answer: "443",
  },
  {
    question: "What does DNS stand for in computer networking?",
    options: ["Domain Name System", "Data Network Service", "Dynamic Network Server", "Direct Name Storage"],
    answer: "Domain Name System",
  },
  {
    question: "Which protocol translates an IP address to a physical MAC address on a local network?",
    options: ["DHCP", "ARP (Address Resolution Protocol)", "DNS", "RARP"],
    answer: "ARP (Address Resolution Protocol)",
  },
  {
    question: "What is the default subnet mask for a Class C IPv4 network?",
    options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"],
    answer: "255.255.255.0",
  },
  {
    question: "What type of attack involves overwhelming a network server with excessive traffic to make it unavailable?",
    options: ["Man-in-the-Middle (MitM)", "DDoS (Distributed Denial of Service)", "SQL Injection", "Cross-Site Scripting (XSS)"],
    answer: "DDoS (Distributed Denial of Service)",
  },
  {
    question: "Which symmetric encryption standard is widely used globally with key lengths of 128, 192, and 256 bits?",
    options: ["DES", "AES (Advanced Encryption Standard)", "RSA", "Diffie-Hellman"],
    answer: "AES (Advanced Encryption Standard)",
  },
  {
    question: "Which asymmetric encryption algorithm relies on the mathematical difficulty of factoring large prime numbers?",
    options: ["AES", "RSA", "SHA-256", "Blowfish"],
    answer: "RSA",
  },
  {
    question: "What does the TTL (Time to Live) field in an IPv4 packet header prevent?",
    options: ["Data corruption", "Packets from circulating endlessly in routing loops", "Bandwidth throttling", "Packet reassembly failure"],
    answer: "Packets from circulating endlessly in routing loops",
  },
  {
    question: "Which protocol is used by the 'ping' utility to check network connectivity?",
    options: ["TCP", "UDP", "ICMP (Internet Control Message Protocol)", "IGMP"],
    answer: "ICMP (Internet Control Message Protocol)",
  },
  {
    question: "What is the purpose of NAT (Network Address Translation)?",
    options: ["Translating private IP addresses into a public IP address for internet routing", "Encrypting web traffic across tunnels", "Resolving domain names to IP addresses", "Allocating bandwidth to specific routers"],
    answer: "Translating private IP addresses into a public IP address for internet routing",
  },
  {
    question: "In public-key cryptography, which key is used to decrypt a message encrypted with a recipient's public key?",
    options: ["The sender's private key", "The recipient's private key", "A shared secret key", "The recipient's public key"],
    answer: "The recipient's private key",
  },
  {
    question: "Which security protocol provides encrypted communications over the web, succeeding SSL?",
    options: ["TLS (Transport Layer Security)", "IPsec", "SSH", "WPA3"],
    answer: "TLS (Transport Layer Security)",
  },
  {
    question: "What is an SQL Injection (SQLi) vulnerability?",
    options: ["Executing unauthorized malicious SQL queries by injecting user input into backend database calls", "Cracking database passwords using rainbow tables", "Overflowing database connection pools", "Corrupting SQLite files on client machines"],
    answer: "Executing unauthorized malicious SQL queries by injecting user input into backend database calls",
  },
  {
    question: "Which attack tricks a victim into submitting an authenticated transaction or state-change request on a web app?",
    options: ["Cross-Site Request Forgery (CSRF)", "Cross-Site Scripting (XSS)", "Clickjacking", "DNS Spoofing"],
    answer: "Cross-Site Request Forgery (CSRF)",
  },
  {
    question: "How does the 'SameSite' attribute on HTTP cookies help prevent CSRF attacks?",
    options: ["By encrypting the cookie payload", "By restricting whether cookies are sent with cross-site requests", "By deleting cookies on browser close", "By disallowing JavaScript access via document.cookie"],
    answer: "By restricting whether cookies are sent with cross-site requests",
  },
  {
    question: "What does the 'HttpOnly' flag on a cookie do?",
    options: ["Forces the cookie to only be sent over HTTPS", "Prevents client-side scripts from accessing the cookie via document.cookie", "Restricts the cookie to HTTP port 80 only", "Sets the cookie expiry to 1 hour"],
    answer: "Prevents client-side scripts from accessing the cookie via document.cookie",
  },
  {
    question: "Which layer in the OSI model handles data encryption, compression, and format translation?",
    options: ["Application Layer", "Presentation Layer", "Session Layer", "Network Layer"],
    answer: "Presentation Layer",
  },
  {
    question: "What is the size of an IPv6 address?",
    options: ["32 bits", "64 bits", "128 bits", "256 bits"],
    answer: "128 bits",
  },
  {
    question: "Which cryptographic algorithm is a one-way mathematical function that produces a 256-bit hash?",
    options: ["AES-256", "SHA-256", "RSA-2048", "Diffie-Hellman"],
    answer: "SHA-256",
  },
  {
    question: "What is a Man-in-the-Middle (MitM) attack?",
    options: ["An attacker secretly intercepting and relaying communication between two parties who believe they are communicating directly", "An insider stealing server backup drives", "An attacker breaking into a physical server room", "A brute force attack on router passwords"],
    answer: "An attacker secretly intercepting and relaying communication between two parties who believe they are communicating directly",
  },
  {
    question: "Which device operates at Layer 2 (Data Link Layer) and forwards frames based on MAC addresses?",
    options: ["Hub", "Switch", "Router", "Gateway"],
    answer: "Switch",
  },
  {
    question: "What is the purpose of salting passwords before hashing?",
    options: ["To speed up hashing performance", "To ensure identical passwords result in different hashes and defend against rainbow table attacks", "To make passwords shorter for storage", "To allow two-way password recovery"],
    answer: "To ensure identical passwords result in different hashes and defend against rainbow table attacks",
  },
  {
    question: "What protocol automatically assigns IP addresses, subnet masks, and default gateways to devices on a network?",
    options: ["DNS", "DHCP (Dynamic Host Configuration Protocol)", "SNMP", "BGP"],
    answer: "DHCP (Dynamic Host Configuration Protocol)",
  },
  {
    question: "What is the standard port number for SSH (Secure Shell)?",
    options: ["20", "21", "22", "23"],
    answer: "22",
  },
  {
    question: "Which routing protocol is an exterior gateway protocol used for routing between Autonomous Systems on the global internet?",
    options: ["OSPF", "RIP", "BGP (Border Gateway Protocol)", "EIGRP"],
    answer: "BGP (Border Gateway Protocol)",
  },
  {
    question: "What does the TCP three-way handshake sequence consist of?",
    options: ["SYN -> SYN-ACK -> ACK", "ACK -> SYN -> FIN", "HELLO -> ACK -> DATA", "PING -> PONG -> ACK"],
    answer: "SYN -> SYN-ACK -> ACK",
  },
  {
    question: "What is Zero Trust architecture in cybersecurity?",
    options: ["Assuming all internal network users are fully trusted", "A security model requiring continuous verification of every user and device regardless of location", "Disabling all firewalls to speed up throughput", "Only trusting requests from VPN IP addresses"],
    answer: "A security model requiring continuous verification of every user and device regardless of location",
  },
];

const newExams = [
  {
    title: "Data Structures & Algorithms MCQ Test",
    description: "30 comprehensive questions covering Arrays, Trees, Graphs, Sorting, Dynamic Programming, and Time Complexity.",
    duration: 35,
    questions: dsaQuestions,
  },
  {
    title: "Web Development & JavaScript MCQ Test",
    description: "30 in-depth questions testing HTML5, CSS Flexbox/Grid, ES6+ JavaScript, React Hooks, and Modern Web APIs.",
    duration: 30,
    questions: webDevQuestions,
  },
  {
    title: "C++ & Object-Oriented Programming MCQ Test",
    description: "30 rigorous questions on Classes, Virtual Functions, Inheritance, STL, RAII, Smart Pointers, and Memory Management.",
    duration: 35,
    questions: cppQuestions,
  },
  {
    title: "Operating Systems & Linux MCQ Test",
    description: "30 essential questions covering Processes, Threads, CPU Scheduling, Deadlocks, Virtual Memory, and Linux Commands.",
    duration: 30,
    questions: osQuestions,
  },
  {
    title: "Computer Networks & Web Security MCQ Test",
    description: "30 vital questions on OSI Model, TCP/IP, Cryptography, Web Vulnerabilities (XSS, CSRF, SQLi), and TLS Security.",
    duration: 30,
    questions: networkQuestions,
  },
];

async function seed() {
  console.log("Connecting to MongoDB:", MONGO_URI ? "URI provided" : "Missing URI");
  await mongoose.connect(MONGO_URI);
  console.log("Connected successfully to DB:", mongoose.connection.name);

  const examsCol = mongoose.connection.db.collection("exams");

  // Ensure all existing exams have duration defined
  await examsCol.updateMany(
    { duration: { $exists: false } },
    { $set: { duration: 30 } }
  );

  for (const examData of newExams) {
    const existing = await examsCol.findOne({ title: examData.title });
    if (existing) {
      console.log(`Updating existing exam: "${examData.title}" (${examData.questions.length} questions)...`);
      await examsCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            description: examData.description,
            duration: examData.duration,
            questions: examData.questions,
            updatedAt: new Date(),
          },
        }
      );
      console.log(`✓ Updated "${examData.title}" (ID: ${existing._id})`);
    } else {
      console.log(`Inserting new exam: "${examData.title}" (${examData.questions.length} questions)...`);
      const result = await examsCol.insertOne({
        ...examData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✓ Created "${examData.title}" (ID: ${result.insertedId})`);
    }
  }

  // Summary
  const allExams = await examsCol.find({}).toArray();
  console.log("\n========================================================");
  console.log(`Total Exams in Database: ${allExams.length}`);
  for (const e of allExams) {
    console.log(`- [${e.questions?.length || 0} Questions | ${e.duration} mins] ${e.title} (ID: ${e._id})`);
  }
  console.log("========================================================\n");

  await mongoose.disconnect();
  console.log("Seeding complete and disconnected!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
