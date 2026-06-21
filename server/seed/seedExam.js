import mongoose from "mongoose";
import Exam from "../models/Exam.js"; // update path if needed

// CONNECT TO MONGO
mongoose
  .connect("mongodb+srv://maitymalay334_db_user:zOF33jTmJSmcFJYV@cluster0.vvosns0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// C PROGRAMMING QUESTIONS (30)
// const questions = [
//   {
//     question: "Which of the following is the correct syntax to include a header file in C?",
//     options: ["#include <stdio.h>", "include <stdio.h>", "import stdio", "#import <stdio.h>"],
//     answer: "#include <stdio.h>"
//   },
//   {
//     question: "Which data type is used to store a single character in C?",
//     options: ["string", "char", "int", "float"],
//     answer: "char"
//   },
//   {
//     question: "Which symbol is used to start a comment in C?",
//     options: ["//", "#", "/* */", "--"],
//     answer: "//"
//   },
//   {
//     question: "What is the size of an int in C (on most systems)?",
//     options: ["2 bytes", "4 bytes", "8 bytes", "1 byte"],
//     answer: "4 bytes"
//   },
//   {
//     question: "Which function is used to print output to the console?",
//     options: ["output()", "console.log()", "print()", "printf()"],
//     answer: "printf()"
//   },
//   {
//     question: "Which of the following is NOT a valid data type in C?",
//     options: ["float", "real", "int", "double"],
//     answer: "real"
//   },
//   {
//     question: "What is the correct format specifier for printing integers?",
//     options: ["%s", "%d", "%c", "%f"],
//     answer: "%d"
//   },
//   {
//     question: "Which operator is used to access the value at an address in C?",
//     options: ["*", "&", "@", "#"],
//     answer: "*"
//   },
//   {
//     question: "What is the default return type of a function in C if not specified?",
//     options: ["float", "void", "int", "char"],
//     answer: "int"
//   },
//   {
//     question: "Which loop in C executes at least once even if the condition is false?",
//     options: ["for loop", "while loop", "do-while loop", "foreach loop"],
//     answer: "do-while loop"
//   },
//   {
//     question: "What does the sizeof() operator return?",
//     options: ["Memory size of a variable", "Length of string", "Address of variable", "None"],
//     answer: "Memory size of a variable"
//   },
//   {
//     question: "Which keyword is used to define constants in C?",
//     options: ["fixed", "const", "define", "constant"],
//     answer: "const"
//   },
//   {
//     question: "Which function is used to read input from the user in C?",
//     options: ["scan()", "scanf()", "read()", "input()"],
//     answer: "scanf()"
//   },
//   {
//     question: "Which escape sequence is used for a new line?",
//     options: ["\\t", "\\n", "\\0", "\\s"],
//     answer: "\\n"
//   },
//   {
//     question: "Which operator is used to get the memory address of a variable?",
//     options: ["@", "*", "&", "%"],
//     answer: "&"
//   },
//   {
//     question: "Which keyword is used to create a structure in C?",
//     options: ["struct", "structure", "object", "class"],
//     answer: "struct"
//   },
//   {
//     question: "Arrays in C are:",
//     options: ["Dynamic", "Fixed-size", "Linked", "Tree-structured"],
//     answer: "Fixed-size"
//   },
//   {
//     question: "Which of the following is a loop control statement?",
//     options: ["break", "switch", "case", "define"],
//     answer: "break"
//   },
//   {
//     question: "Pointers in C store:",
//     options: ["values", "addresses", "arrays", "functions"],
//     answer: "addresses"
//   },
//   {
//     question: "What is the extension of a C program file?",
//     options: [".c", ".cpp", ".class", ".py"],
//     answer: ".c"
//   },
//   {
//     question: "Which of the following is used to dynamically allocate memory?",
//     options: ["malloc()", "alloc()", "memalloc()", "new"],
//     answer: "malloc()"
//   },
//   {
//     question: "Which of the following is a valid variable name in C?",
//     options: ["2num", "num_value", "num-value", "num value"],
//     answer: "num_value"
//   },
//   {
//     question: "What is the correct syntax for a while loop?",
//     options: ["while(condition)", "loop(condition)", "while condition()", "do(condition)"],
//     answer: "while(condition)"
//   },
//   {
//     question: "Which operator has the highest precedence?",
//     options: ["*", "+", "=", "++"],
//     answer: "++"
//   },
//   {
//     question: "Which keyword is used to exit a loop?",
//     options: ["return", "exit", "break", "stop"],
//     answer: "break"
//   },
//   {
//     question: "What is a function that calls itself called?",
//     options: ["callback", "nested function", "recursive function", "self function"],
//     answer: "recursive function"
//   },
//   {
//     question: "Which header file is needed for malloc()?",
//     options: ["<stdio.h>", "<stdlib.h>", "<string.h>", "<ctype.h>"],
//     answer: "<stdlib.h>"
//   },
//   {
//     question: "What is the format specifier for a float?",
//     options: ["%d", "%c", "%f", "%lf"],
//     answer: "%f"
//   },
//   {
//     question: "Which keyword is used to create a user-defined data type?",
//     options: ["typedef", "define", "struct", "alias"],
//     answer: "typedef"
//   },
//   {
//     question: "Which of the following is used to terminate a statement?",
//     options: [".", ":", ";", ","],
//     answer: ";"
//   }
// ];



// const questions = [
//   {
//     question: "What does SQL stand for?",
//     options: ["Strong Question Language", "Structured Query Language", "Structured Question List", "System Query Language"],
//     answer: "Structured Query Language"
//   },
//   {
//     question: "Which SQL statement is used to retrieve data from a database?",
//     options: ["GET", "SELECT", "FETCH", "RETRIEVE"],
//     answer: "SELECT"
//   },
//   {
//     question: "Which clause is used to filter records?",
//     options: ["WHERE", "ORDER BY", "GROUP BY", "HAVING"],
//     answer: "WHERE"
//   },
//   {
//     question: "Which SQL command is used to insert data into a table?",
//     options: ["INSERT INTO", "ADD DATA", "PUT INTO", "UPDATE INTO"],
//     answer: "INSERT INTO"
//   },
//   {
//     question: "What does the COUNT() function do?",
//     options: ["Counts rows", "Counts tables", "Counts columns", "Counts databases"],
//     answer: "Counts rows"
//   },
//   {
//     question: "Which SQL statement is used to modify existing records?",
//     options: ["CHANGE", "MODIFY", "UPDATE", "ALTER"],
//     answer: "UPDATE"
//   },
//   {
//     question: "Which keyword sorts the result-set in SQL?",
//     options: ["SORT", "ORDER BY", "GROUP BY", "ARRANGE"],
//     answer: "ORDER BY"
//   },
//   {
//     question: "Which SQL command is used to remove a table?",
//     options: ["DELETE TABLE", "DROP TABLE", "REMOVE TABLE", "CLEAR TABLE"],
//     answer: "DROP TABLE"
//   },
//   {
//     question: "Which function returns the maximum value?",
//     options: ["MAX()", "BIG()", "LARGEST()", "TOP()"],
//     answer: "MAX()"
//   },
//   {
//     question: "Which command is used to create a new table?",
//     options: ["CREATE TABLE", "ADD TABLE", "NEW TABLE", "MAKE TABLE"],
//     answer: "CREATE TABLE"
//   },
//   {
//     question: "What does the DISTINCT keyword do?",
//     options: ["Deletes duplicates", "Shows unique values", "Sorts values", "Counts values"],
//     answer: "Shows unique values"
//   },
//   {
//     question: "Which operator is used for pattern matching?",
//     options: ["LIKE", "MATCH", "PATTERN", "SEARCH"],
//     answer: "LIKE"
//   },
//   {
//     question: "Which clause groups rows that have the same values?",
//     options: ["GROUP BY", "ORDER BY", "COLLECT", "SET BY"],
//     answer: "GROUP BY"
//   },
//   {
//     question: "Which SQL operator checks for NULL values?",
//     options: ["IS NULL", "== NULL", "= NULL", "CHECK NULL"],
//     answer: "IS NULL"
//   },
//   {
//     question: "Which constraint ensures all values in a column are unique?",
//     options: ["PRIMARY", "UNIQUE", "CHECK", "NOT NULL"],
//     answer: "UNIQUE"
//   },
//   {
//     question: "What is the default sorting order of ORDER BY?",
//     options: ["Descending", "Random", "Ascending", "Alphabetical only"],
//     answer: "Ascending"
//   },
//   {
//     question: "Which function returns the number of records?",
//     options: ["TOTAL()", "COUNT()", "SUM()", "NUMBER()"],
//     answer: "COUNT()"
//   },
//   {
//     question: "Which SQL keyword combines rows from two or more tables?",
//     options: ["CONNECT", "JOIN", "MERGE", "LINK"],
//     answer: "JOIN"
//   },
//   {
//     question: "Which join returns matching rows from both tables?",
//     options: ["LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "INNER JOIN"],
//     answer: "INNER JOIN"
//   },
//   {
//     question: "Which statement deletes all records but keeps the table?",
//     options: ["DROP", "CLEAR", "TRUNCATE", "REMOVE"],
//     answer: "TRUNCATE"
//   },
//   {
//     question: "Which SQL statement is used to remove specific rows?",
//     options: ["ERASE", "DELETE", "REMOVE", "DROP ROW"],
//     answer: "DELETE"
//   },
//   {
//     question: "Which symbol is used to select all columns?",
//     options: ["%", "@", "*", "#"],
//     answer: "*"
//   },
//   {
//     question: "Which clause is used after GROUP BY to filter groups?",
//     options: ["WHERE", "HAVING", "ORDER BY", "FILTER"],
//     answer: "HAVING"
//   },
//   {
//     question: "Which constraint sets a unique key and prevents null values?",
//     options: ["FOREIGN KEY", "PRIMARY KEY", "UNIQUE", "NOT NULL"],
//     answer: "PRIMARY KEY"
//   },
//   {
//     question: "Which type of join returns all rows from the left table?",
//     options: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"],
//     answer: "LEFT JOIN"
//   },
//   {
//     question: "Which SQL command changes the structure of a table?",
//     options: ["UPDATE", "ALTER TABLE", "CHANGE TABLE", "MODIFY TABLE"],
//     answer: "ALTER TABLE"
//   },
//   {
//     question: "Which function returns the sum of a numeric column?",
//     options: ["TOTAL()", "ADD()", "SUM()", "COUNT()"],
//     answer: "SUM()"
//   },
//   {
//     question: "What does the AVG() function calculate?",
//     options: ["Total values", "Average value", "Maximum", "Minimum"],
//     answer: "Average value"
//   },
//   {
//     question: "What does the SQL LIMIT clause do?",
//     options: ["Sets max number of rows", "Limits table size", "Blocks access", "Limits columns"],
//     answer: "Sets max number of rows"
//   },
//   {
//     question: "Which SQL command is used to rename a table?",
//     options: ["RENAME TABLE", "CHANGE TABLE", "ALTER NAME", "MODIFY NAME"],
//     answer: "RENAME TABLE"
//   }
// ];



const questions = [
  {
    question: "Which of the following is the correct file extension for Python files?",
    options: [".py", ".python", ".pt", ".p"],
    answer: ".py"
  },
  {
    question: "Which keyword is used to define a function in Python?",
    options: ["func", "define", "def", "function"],
    answer: "def"
  },
  {
    question: "What is the output of: print(type(10))?",
    options: ["<class 'string'>", "<class 'float'>", "<class 'int'>", "<class 'number'>"],
    answer: "<class 'int'>"
  },
  {
    question: "Which data type is mutable in Python?",
    options: ["tuple", "string", "list", "int"],
    answer: "list"
  },
  {
    question: "Which of the following is a Python tuple?",
    options: ["[1, 2, 3]", "(1, 2, 3)", "{1, 2, 3}", "<1, 2, 3>"],
    answer: "(1, 2, 3)"
  },
  {
    question: "How do you start a comment in Python?",
    options: ["//", "#", "/*", "--"],
    answer: "#"
  },
  {
    question: "What is the output of: len('Python')?",
    options: ["5", "7", "6", "None"],
    answer: "6"
  },
  {
    question: "Which function is used to get user input?",
    options: ["scan()", "get()", "input()", "read()"],
    answer: "input()"
  },
  {
    question: "Which of the following is used to create a block of code?",
    options: ["{}", "()", "Indentation", "[]"],
    answer: "Indentation"
  },
  {
    question: "What is the correct syntax to import a module?",
    options: ["include math", "import math", "using math", "#import math"],
    answer: "import math"
  },
  {
    question: "Which operator is used for exponentiation?",
    options: ["^", "**", "exp()", "^^"],
    answer: "**"
  },
  {
    question: "What is a correct way to create a dictionary?",
    options: ["{1, 2, 3}", "{'a': 1, 'b': 2}", "[1: 'a', 2: 'b']", "(1: 'a', 2: 'b')"],
    answer: "{'a': 1, 'b': 2}"
  },
  {
    question: "Which keyword is used for loops in Python?",
    options: ["foreach", "repeat", "loop", "for"],
    answer: "for"
  },
  {
    question: "Which method is used to add an item to a list?",
    options: ["add()", "insert()", "append()", "push()"],
    answer: "append()"
  },
  {
    question: "Which of the following is NOT a Python data type?",
    options: ["list", "set", "array", "tuple"],
    answer: "array"
  },
  {
    question: "Which keyword is used to handle exceptions?",
    options: ["exception", "catch", "try", "handle"],
    answer: "try"
  },
  {
    question: "What is the output of: print(3 == 3.0)?",
    options: ["False", "True", "Error", "None"],
    answer: "True"
  },
  {
    question: "Which function converts a string to an integer?",
    options: ["toInt()", "str()", "int()", "convert()"],
    answer: "int()"
  },
  {
    question: "What is the result of: 'Python' * 2?",
    options: ["Error", "Python2", "PythonPython", "None"],
    answer: "PythonPython"
  },
  {
    question: "How is a class created in Python?",
    options: ["class MyClass:", "create MyClass:", "MyClass class()", "def class MyClass"],
    answer: "class MyClass:"
  },
  {
    question: "Which keyword is used inside a class to access instance variables?",
    options: ["self", "this", "obj", "instance"],
    answer: "self"
  },
  {
    question: "Which function is used to find the maximum value?",
    options: ["top()", "max()", "maximum()", "highest()"],
    answer: "max()"
  },
  {
    question: "Which loop runs at least once?",
    options: ["for loop", "while loop", "no guaranteed loop", "foreach"],
    answer: "no guaranteed loop"
  },
  {
    question: "What is the output of: bool(0)?",
    options: ["True", "False", "Error", "None"],
    answer: "False"
  },
  {
    question: "How do you create a set in Python?",
    options: ["[]", "()", "{}", "{1, 2, 3}"],
    answer: "{1, 2, 3}"
  },
  {
    question: "Which keyword is used to exit a loop?",
    options: ["stop", "exit", "break", "quit"],
    answer: "break"
  },
  {
    question: "Which function returns the type of variable?",
    options: ["typeof()", "type()", "vartype()", "datatype()"],
    answer: "type()"
  },
  {
    question: "Which operator is used for floor division?",
    options: ["/", "//", "%", "%%"],
    answer: "//"
  },
  {
    question: "Which of the following is used to read a file?",
    options: ["open()", "file()", "readfile()", "get()"],
    answer: "open()"
  },
  {
    question: "Which module in Python is used for regular expressions?",
    options: ["regex", "pyregex", "match", "re"],
    answer: "re"
  }
];


// SAVE EXAM FUNCTION
const saveExam = async () => {
  try {
    const exam = new Exam({
      title: "C Programming MCQ Test",
      description: "30 important MCQ questions on C programming.",
      questions,
    });

    await exam.save();
    console.log("✔ Exam Saved Successfully!");
    mongoose.disconnect();
  } catch (error) {
    console.log("Error:", error);
  }
};

saveExam();
