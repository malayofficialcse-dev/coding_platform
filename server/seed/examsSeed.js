import mongoose from "mongoose";
import dotenv from "dotenv";
import Exam from "../models/Exam.js";

dotenv.config();

const exams = [
  {
    title: "HTML Fundamentals",
    description: "Test your basic HTML knowledge.",
    questions: [
      {
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "Home Tool Markup Language",
          "Hyperlinks and Text Markup Language",
          "Hyper Tool Multi Language",
        ],
        answer: "Hyper Text Markup Language",
      },
      {
        question: "Choose the correct HTML element for the largest heading:",
        options: ["<heading>", "<h5>", "<h4>", "<h1>"],
        answer: "<h1>",
      },
      {
        question:
          "What is the correct HTML element for inserting a line break?",
        options: ["<break>", "<br>", "<lb>", "<line>"],
        answer: "<br>",
      },
      {
        question: "What is the paragraph tag",
        options: ["<p>", "<P>", "<para>", "<Paragraph>"],
        answer: "<p>",
      },
    ],
  },
  {
    title: "Python Basics",
    description: "Test your basic Python knowledge.",
    questions: [
      {
        question: "What is the output of print(2 * 3)?",
        options: ["5", "6", "'6'", "23"],
        answer: "6",
      },
      {
        question: "Which keyword is used to define a function in Python?",
        options: ["function", "def", "fun", "define"],
        answer: "def",
      },
      {
        question: "What is the correct file extension for Python files?",
        options: [".py", ".python", ".pt", ".pyt"],
        answer: ".py",
      },
    ],
  },
  {
    title: "Java Advanced Concepts",
    description:
      "Hard level exam to test your advanced Java programming knowledge.",
    questions: [
      {
        question: "Which of the following is NOT a feature of Java?",
        options: [
          "Object-Oriented",
          "Platform Independent",
          "Pointer Arithmetic",
          "Robust",
        ],
        answer: "Pointer Arithmetic",
      },
      {
        question:
          "Which JVM memory area stores class-level data such as method code and static variables?",
        options: ["Stack", "Heap", "Method Area", "Register"],
        answer: "Method Area",
      },
      {
        question: "Which keyword in Java is used to prevent method overriding?",
        options: ["static", "const", "final", "abstract"],
        answer: "final",
      },
      {
        question:
          "Which of these is not a valid functional interface in java.util.function package?",
        options: ["Predicate", "Supplier", "Consumer", "Comparator"],
        answer: "Comparator",
      },
      {
        question: "What will happen if a constructor is declared private?",
        options: [
          "Class cannot be instantiated outside the class",
          "It throws compile-time error",
          "It throws runtime error",
          "Class becomes abstract automatically",
        ],
        answer: "Class cannot be instantiated outside the class",
      },
      {
        question:
          "Which collection class allows you to access elements using FIFO order?",
        options: ["Stack", "ArrayList", "Queue", "HashMap"],
        answer: "Queue",
      },
      {
        question: "Which Java concept is implemented using interfaces?",
        options: [
          "Polymorphism",
          "Abstraction",
          "Encapsulation",
          "Inheritance",
        ],
        answer: "Abstraction",
      },
      {
        question:
          "Which exception is thrown when a thread is waiting and another thread interrupts it?",
        options: [
          "IllegalThreadStateException",
          "InterruptedException",
          "ThreadDeath",
          "IllegalMonitorStateException",
        ],
        answer: "InterruptedException",
      },
      {
        question: "Which type of class cannot be extended?",
        options: ["Abstract Class", "Interface", "Final Class", "Static Class"],
        answer: "Final Class",
      },
      {
        question: "Which of these is not a feature of Java Streams API?",
        options: [
          "Lazy Evaluation",
          "Parallel Execution",
          "Modifying Source Collection",
          "Functional Operations",
        ],
        answer: "Modifying Source Collection",
      },
      {
        question: "Which keyword is used to define a package in Java?",
        options: ["namespace", "include", "package", "import"],
        answer: "package",
      },
      {
        question: "Which keyword is used to import a class in Java?",
        options: ["use", "import", "package", "include"],
        answer: "import",
      },
      {
        question:
          "Which thread runs in the background and provides services to other threads?",
        options: [
          "Daemon Thread",
          "Main Thread",
          "Worker Thread",
          "Child Thread",
        ],
        answer: "Daemon Thread",
      },
      {
        question: "Which of the following is not a Java primitive data type?",
        options: ["int", "boolean", "String", "double"],
        answer: "String",
      },
      {
        question:
          "Which feature of Java helps in achieving multiple inheritance?",
        options: ["Classes", "Abstract Classes", "Interfaces", "Final Classes"],
        answer: "Interfaces",
      },
      {
        question: "What is the default value of a local variable in Java?",
        options: ["null", "0", "Depends on data type", "No default value"],
        answer: "No default value",
      },
      {
        question: "Which Java keyword is used for exception handling?",
        options: ["throw", "throws", "try-catch-finally", "All of the above"],
        answer: "All of the above",
      },
      {
        question: "Which collection in Java does not allow duplicate keys?",
        options: ["HashMap", "ArrayList", "LinkedList", "Vector"],
        answer: "HashMap",
      },
      {
        question: "Which method is called when an object is garbage collected?",
        options: ["delete()", "finalize()", "free()", "destroy()"],
        answer: "finalize()",
      },
      {
        question:
          "Which Java API provides classes for reading and writing JSON?",
        options: ["javax.json", "java.sql", "java.util", "java.io"],
        answer: "javax.json",
      },
      {
        question: "Which design pattern does Java Singleton class represent?",
        options: ["Factory", "Builder", "Singleton", "Prototype"],
        answer: "Singleton",
      },
      {
        question: "Which operator is used to compare two objects in Java?",
        options: ["==", "=", "equals()", "compare()"],
        answer: "equals()",
      },
      {
        question:
          "Which collection allows duplicate elements and maintains insertion order?",
        options: ["HashSet", "TreeSet", "LinkedHashSet", "ArrayList"],
        answer: "ArrayList",
      },
      {
        question: "Which stream class is used for handling binary data?",
        options: [
          "FileReader",
          "FileWriter",
          "FileInputStream",
          "BufferedReader",
        ],
        answer: "FileInputStream",
      },
      {
        question:
          "Which JDBC interface is used for executing SQL stored procedures?",
        options: [
          "Statement",
          "PreparedStatement",
          "CallableStatement",
          "Connection",
        ],
        answer: "CallableStatement",
      },
      {
        question: "Which annotation in JUnit is used before each test method?",
        options: ["@BeforeClass", "@Before", "@Test", "@Setup"],
        answer: "@Before",
      },
      {
        question: "Which module in Java 9 introduced the module system?",
        options: ["java.sql", "java.base", "java.module", "java.compiler"],
        answer: "java.base",
      },
      {
        question: "Which keyword is used to stop a loop in Java?",
        options: ["stop", "return", "exit", "break"],
        answer: "break",
      },
      {
        question: "Which version of Java introduced Lambda Expressions?",
        options: ["Java 6", "Java 7", "Java 8", "Java 9"],
        answer: "Java 8",
      },
      {
        question:
          "Which collection implementation provides constant time performance for basic operations like add, remove, and contains?",
        options: ["TreeSet", "LinkedList", "HashSet", "PriorityQueue"],
        answer: "HashSet",
      },
    ],
  },
  {
    title: "Java Medium",
    description: "Medium level Java programming exam.",
    questions: [
      {
        question: "Which of these is a valid Java identifier?",
        options: ["1variable", "_variable", "variable-1", "variable 1"],
        answer: "_variable",
      },
      {
        question: "Which method is the entry point of a Java program?",
        options: ["start()", "main()", "run()", "init()"],
        answer: "main()",
      },
      {
        question: "Which of these is not a Java access modifier?",
        options: ["public", "private", "protected", "package"],
        answer: "package",
      },
      {
        question: "Which operator is used for concatenation in Java?",
        options: ["+", "&", ".", "*"],
        answer: "+",
      },
    ],
  },
  {
    title: "Java Easy",
    description: "Easy level Java programming exam.",
    questions: [
      {
        question: "Which company originally developed Java?",
        options: ["Sun Microsystems", "Microsoft", "Apple", "Google"],
        answer: "Sun Microsystems",
      },
      {
        question: "Which file extension is used for Java source files?",
        options: [".java", ".js", ".class", ".jav"],
        answer: ".java",
      },
      {
        question: "Which keyword is used to create an object in Java?",
        options: ["new", "create", "object", "make"],
        answer: "new",
      },
    ],
  },
  {
    title: "SQL Medium",
    description: "Medium level SQL exam.",
    questions: [
      {
        question:
          "Which SQL statement is used to extract data from a database?",
        options: ["GET", "OPEN", "SELECT", "EXTRACT"],
        answer: "SELECT",
      },
      {
        question: "Which SQL clause is used to filter the results?",
        options: ["WHERE", "ORDER BY", "GROUP BY", "HAVING"],
        answer: "WHERE",
      },
      {
        question: "Which SQL keyword is used to sort the result-set?",
        options: ["SORT BY", "ORDER", "ORDER BY", "SORT"],
        answer: "ORDER BY",
      },
      {
        question: "Which SQL statement is used to update data in a database?",
        options: ["MODIFY", "UPDATE", "CHANGE", "ALTER"],
        answer: "UPDATE",
      },
    ],
  },
  {
    title: "Python Advanced",
    description: "Advanced Python programming concepts.",
    questions: [
      {
        question:
          "Which of the following is used to define an anonymous function in Python?",
        options: ["lambda", "def", "fun", "anonymous"],
        answer: "lambda",
      },
      {
        question: "Which module in Python is used for regular expressions?",
        options: ["re", "regex", "pyregex", "expressions"],
        answer: "re",
      },
      {
        question: "What is the output of: print('Hello'[::-1])?",
        options: ["Hello", "olleH", "Error", "None"],
        answer: "olleH",
      },
    ],
  },
  {
    title: "HTML Advanced",
    description: "Advanced HTML concepts and tags.",
    questions: [
      {
        question: "Which HTML tag is used to define an internal style sheet?",
        options: ["<style>", "<css>", "<script>", "<link>"],
        answer: "<style>",
      },
      {
        question:
          "Which attribute is used to specify a unique identifier for an HTML element?",
        options: ["id", "class", "name", "key"],
        answer: "id",
      },
      {
        question: "Which tag is used to embed a video in HTML5?",
        options: ["<media>", "<movie>", "<video>", "<embed>"],
        answer: "<video>",
      },
    ],
  },
  {
    title: "SQL Advanced",
    description: "Advanced SQL queries and concepts.",
    questions: [
      {
        question: "Which SQL function returns the number of rows in a table?",
        options: ["COUNT()", "SUM()", "TOTAL()", "NUMBER()"],
        answer: "COUNT()",
      },
      {
        question: "Which SQL statement is used to delete data from a database?",
        options: ["REMOVE", "DELETE", "DROP", "ERASE"],
        answer: "DELETE",
      },
      {
        question:
          "Which SQL clause is used to group rows that have the same values?",
        options: ["GROUP BY", "ORDER BY", "WHERE", "HAVING"],
        answer: "GROUP BY",
      },
    ],
  },
];

async function seedExams() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online-exam",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    await Exam.deleteMany({});
    await Exam.insertMany(exams);
    console.log("✅ Exams seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding exams:", err);
    process.exit(1);
  }
}

seedExams();
