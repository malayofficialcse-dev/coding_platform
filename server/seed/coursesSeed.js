import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Course.js";

dotenv.config();

const courses = [
  {
    title: "DevOps Full Course",
    description:
      "Complete Beginner to Advanced DevOps Course covering CI/CD, Docker, Kubernetes, and Cloud.",
    image:
      "https://res.cloudinary.com/dykpztnpu/image/upload/v1759323860/online-exam/course-images/dgcn0l80cl3oh5buo4us.jpg",
    contents: [
      {
        title: "1. What is DevOps?",
        body: "DevOps is a set of practices that combines software development (Dev) and IT operations (Ops). It aims to shorten the development lifecycle and provide continuous delivery with high software quality.\n\nKey Concepts:\n- Collaboration between development and operations\n- Automation of processes\n- Continuous Integration & Continuous Deployment (CI/CD)\n- Monitoring and feedback",
        order: 1,
        images: [
          "https://www.redhat.com/cms/managed-files/styles/wysiwyg_full_width/s3/DevOps-Process-Flow-Red-Hat.png",
          "https://www.atlassian.com/dam/jcr:813202b8-6e7e-4c7e-8e2d-7b6b6b6b6b6b/DevOps-diagram.svg",
        ],
        codeBlocks: [],
      },
      {
        title: "2. Docker Basics",
        body: "Docker is a platform for developing, shipping, and running applications in containers.\n\n- Containers are lightweight, portable, and self-sufficient.\n- Docker images are blueprints for containers.",
        order: 2,
        images: [
          "https://www.docker.com/wp-content/uploads/2022/03/what-is-docker.png",
        ],
        codeBlocks: [
          {
            language: "dockerfile",
            code: 'FROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node", "server.js"]',
          },
        ],
      },
      {
        title: "3. CI/CD Pipeline Example (GitHub Actions)",
        body: "A CI/CD pipeline automates the process of building, testing, and deploying code.\n\nGitHub Actions is a popular CI/CD tool.",
        order: 3,
        images: [
          "https://docs.github.com/assets/images/help/actions/actions-diagram.png",
        ],
        codeBlocks: [
          {
            language: "yaml",
            code: "name: CI/CD Pipeline\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Set up Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n      - run: npm install\n      - run: npm test",
          },
        ],
      },
      {
        title: "4. Kubernetes Overview",
        body: "Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.",
        order: 4,
        images: [
          "https://kubernetes.io/images/kubernetes-horizontal-color.png",
        ],
        codeBlocks: [
          {
            language: "yaml",
            code: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: myapp-pod\nspec:\n  containers:\n    - name: myapp-container\n      image: myapp:latest",
          },
        ],
      },
    ],
  },
  {
    title: "Java OOPs Concepts",
    description:
      "Learn Java Object-Oriented Programming concepts with practical examples.",
    image:
      "https://www.courselounge.com/wp-content/uploads/best-java-courses-online-768x379.png",
    contents: [
      {
        title: "1. What is OOP?",
        body: "OOP stands for Object-Oriented Programming. It is a programming paradigm based on the concept of objects, which can contain data and code to manipulate that data.\n\nMain Principles:\n- Encapsulation\n- Inheritance\n- Polymorphism\n- Abstraction",
        order: 1,
        images: [
          "https://media.geeksforgeeks.org/wp-content/uploads/20230918144209/OOPs-Concepts.png",
        ],
        codeBlocks: [],
      },
      {
        title: "2. Java Class Example",
        body: "A class is a blueprint for objects. Here is a simple Java class:",
        order: 2,
        images: [],
        codeBlocks: [
          {
            language: "java",
            code: 'public class Student {\n    String name;\n    int age;\n\n    void display() {\n        System.out.println(name + " " + age);\n    }\n}',
          },
        ],
      },
      {
        title: "3. Inheritance Example",
        body: "Inheritance allows one class to inherit the fields and methods of another class.",
        order: 3,
        images: [],
        codeBlocks: [
          {
            language: "java",
            code: 'class Animal {\n    void eat() { System.out.println("eating..."); }\n}\nclass Dog extends Animal {\n    void bark() { System.out.println("barking..."); }\n}\nclass TestInheritance {\n    public static void main(String args[]) {\n        Dog d = new Dog();\n        d.eat();\n        d.bark();\n    }\n}',
          },
        ],
      },
      {
        title: "4. Polymorphism Example",
        body: "Polymorphism allows methods to do different things based on the object it is acting upon.",
        order: 4,
        images: [],
        codeBlocks: [
          {
            language: "java",
            code: 'class Animal {\n    void sound() { System.out.println("Animal makes a sound"); }\n}\nclass Dog extends Animal {\n    void sound() { System.out.println("Dog barks"); }\n}\nclass Cat extends Animal {\n    void sound() { System.out.println("Cat meows"); }\n}\npublic class TestPolymorphism {\n    public static void main(String[] args) {\n        Animal a;\n        a = new Dog();\n        a.sound();\n        a = new Cat();\n        a.sound();\n    }\n}',
          },
        ],
      },
    ],
  },
  //   {
  //     title: "Python Programming",
  //     description: "Python is a versatile and powerful programming language that is widely used for various applications, including web development, data analysis, artificial intelligence, and more.",
  //     image: "https://res.cloudinary.com/dykpztnpu/image/upload/v1759323946/online-exam/course-images/g0nsaa3zmfcsg2eeawl4.jpg",
  //     contents: [
  //       {
  //         title: "1. What is Python?",
  //         body: "Python is a high-level, interpreted, general-purpose programming language.\n\nCreated by Guido van Rossum in 1991.\n\nKnown for its simplicity and readability.\n\nUsed in:\n- Web Development (Django, Flask)\n- Data Science (NumPy, Pandas, TensorFlow)\n- AI & ML\n- Automation\n- Cybersecurity\n\nKey Features:\n- Easy to learn & write\n- Open-source and free\n- Cross-platform (Windows, Linux, Mac)\n- Huge community support",
  //         order: 1,
  //         images: [],
  //         codeBlocks: []
  //       },
  //       {
  //         title: "2. Installing Python & IDEs",
  //         body: "Install Python\n\nDownload from: https://www.python.org/downloads/\n\nInstall and check version:\n\npython --version\n\nInstall IDEs:\n- PyCharm – Best for projects.\n- VS Code – Lightweight editor.\n- Jupyter Notebook – Best for Data Science.",
  //         order: 2,
  //         images: [],
  //         codeBlocks: []
  //       },
  //       {
  //         title: "3. First Python Program (Hello World)",
  //         body: "# hello.py\nprint(\"Hello, World!\")\n\nRun the program:\n\npython hello.py\n\nOutput:\nHello, World!",
  //         order: 3,
  //         images: [],
  //         codeBlocks: [
  //           {
  //             language: "python",
  //             code: "print(\"Hello, World!\")"
  //           }
  //         ]
  //       },
  //       {
  //         title: "4. Python Syntax & Comments",
  //         body: "if 5 > 2:\n    print(\"Five is greater than two!\")   # Correct\n\n# Single-line comment\n\"\"\"\nMulti-line\ncomment\n\"\"\"",
  //         order: 4,
  //         images: [],
  //         codeBlocks: [
  //           {
  //             language: "python",
  //             code: "# Single-line comment\n# This is a comment\n\n\"\"\"\nThis is a\nmulti-line comment\n\"\"\""
  //           }
  //         ]
  //       },
  //       {
  //         title: "5. Variables & Data Types",
  //         body: "name = \"Alice\"\nage = 21\nheight = 5.6\n\nData Types:\n- int → whole numbers → x = 10\n- float → decimal numbers → y = 3.14\n- str → text → name = \"Alice\"\n- bool → True/False → is_active = True",
  //         order: 5,
  //         images: [
  //           "https://tse3.mm.bing.net/th/id/OIP.BikgekosKXOnZSBERp4o9AHaE8?rs=1&pid=ImgDetMain&o=7&rm=3",
  //           "https://i.pinimg.com/originals/80/c4/cf/80c4cf63f0c2e987c5f51f62a3fe0711.jpg"
  //         ],
  //         codeBlocks: [
  //           {
  //             language: "python",
  //             code: "x = 50  # int\nx = 60.5  # float\nx = \"Hello World\"  # string\nx = [\"geeks\", \"for\", \"geeks\"]  # list \nx = (\"geeks\", \"for\", \"geeks\")  # tuple"
  //           },
  //           {
  //             language: "python",
  //             code: "a = 5\nprint(type(a))\n\nb = 5.0\nprint(type(b))\n\nc = 2 + 4j\nprint(type(c))"
  //           }
  //         ]
  //       },
  //       {
  //         title: "6. Sum of Two Numbers",
  //         body: "Sum of two numbers using input and print.",
  //         order: 6,
  //         images: [],
  //         codeBlocks: [
  //           {
  //             language: "python",
  //             code: "# Sum of two numbers\nx = int(input(\"Enter a number: \"))\ny = int(input(\"Enter the second number: \"))\nz = x + y\nprint(z)"
  //           }
  //         ]
  //       }
  //     ]
  //   }

  {
    title: "Python Programming",
    body: "A comprehensive course covering Python from basics to advanced with projects.",
    order: 3,
    images: [
      "https://i.ibb.co/8mTn2bF/python-logo.png",
      "https://i.ibb.co/2dL5Y8S/python-code.png",
    ],
    codeBlocks: [
      {
        title: "1. Hello World",
        body: "Every Python program starts simple. Let's print Hello World.",
        order: 1,
        images: ["https://i.ibb.co/4V6HqkY/hello-world.png"],
        code: `
# Hello World Program
print("Hello, World!")
      `,
      },
      {
        title: "2. Variables and Data Types",
        body: "Python variables don’t need explicit declaration.",
        order: 2,
        images: ["https://i.ibb.co/n0VZC9d/variables.png"],
        code: `
# Integer
x = 10
print("Integer:", x)

# Float
y = 3.14
print("Float:", y)

# String
name = "Alice"
print("String:", name)

# Boolean
is_active = True
print("Boolean:", is_active)
      `,
      },
      {
        title: "3. Operators",
        body: "Python supports arithmetic, comparison, and logical operators.",
        order: 3,
        images: ["https://i.ibb.co/cc7K3FT/operators.png"],
        code: `
a, b = 15, 4

# Arithmetic
print("Addition:", a + b)
print("Subtraction:", a - b)
print("Multiplication:", a * b)
print("Division:", a / b)
print("Floor Division:", a // b)
print("Modulus:", a % b)
print("Exponent:", a ** b)

# Comparison
print("Is a > b?", a > b)
print("Is a == b?", a == b)
print("Is a != b?", a != b)

# Logical
x, y = True, False
print("AND:", x and y)
print("OR:", x or y)
print("NOT:", not x)
      `,
      },
      {
        title: "4. Strings",
        body: "Strings in Python are versatile with many built-in methods.",
        order: 4,
        images: ["https://i.ibb.co/QDmmvD4/strings.png"],
        code: `
s = "Python Programming"

print("Length:", len(s))
print("Lowercase:", s.lower())
print("Uppercase:", s.upper())
print("First 6 chars:", s[:6])
print("Last 6 chars:", s[-6:])
print("Replace:", s.replace("Python", "Java"))
print("Split:", s.split(" "))
      `,
      },
      {
        title: "5. Lists",
        body: "Lists are mutable collections in Python.",
        order: 5,
        images: ["https://i.ibb.co/ZcgGZ8k/lists.png"],
        code: `
fruits = ["apple", "banana", "cherry"]

# Access
print(fruits[0])  # apple

# Modify
fruits[1] = "blueberry"
print(fruits)

# Add
fruits.append("mango")
print(fruits)

# Remove
fruits.remove("apple")
print(fruits)

# Loop
for fruit in fruits:
    print(fruit)
      `,
      },
      {
        title: "6. Tuples",
        body: "Tuples are immutable sequences in Python.",
        order: 6,
        images: ["https://i.ibb.co/NsCmC8K/tuples.png"],
        code: `
numbers = (1, 2, 3, 4, 5)

print("Tuple:", numbers)
print("First:", numbers[0])
print("Last:", numbers[-1])

# Tuple unpacking
a, b, c, d, e = numbers
print("Unpacked:", a, b, c, d, e)
      `,
      },
      {
        title: "7. Dictionaries",
        body: "Dictionaries store key-value pairs.",
        order: 7,
        images: ["https://i.ibb.co/mzQWj0n/dict.png"],
        code: `
person = {
    "name": "Alice",
    "age": 25,
    "city": "New York"
}

print("Name:", person["name"])
person["age"] = 26
print("Updated:", person)

for key, value in person.items():
    print(key, ":", value)
      `,
      },
      {
        title: "8. If-Else Conditions",
        body: "Python uses indentation for blocks.",
        order: 8,
        images: ["https://i.ibb.co/7RVV5Kp/ifelse.png"],
        code: `
age = 18

if age < 18:
    print("Minor")
elif age == 18:
    print("Just an adult")
else:
    print("Adult")
      `,
      },
      {
        title: "9. Loops",
        body: "For and while loops in Python.",
        order: 9,
        images: ["https://i.ibb.co/wzQykh2/loops.png"],
        code: `
# For loop
for i in range(1, 6):
    print("For Loop:", i)

# While loop
count = 1
while count <= 5:
    print("While Loop:", count)
    count += 1
      `,
      },
      {
        title: "10. Functions",
        body: "Functions help in reusability.",
        order: 10,
        images: ["https://i.ibb.co/3hsXz1r/functions.png"],
        code: `
def greet(name):
    return "Hello, " + name

print(greet("Alice"))
print(greet("Bob"))

def add(a, b):
    return a + b

print("Sum:", add(10, 20))
      `,
      },
    ],
  },
];

async function seedCourses() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online-exam",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    await Course.deleteMany({});
    await Course.insertMany(courses);
    console.log("✅ Courses seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding courses:", err);
    process.exit(1);
  }
}

seedCourses();

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Course from "../models/Course.js";

// dotenv.config();

// const courses = [
//   {
//     title: "DevOps Full Course",
//     description:
//       "Complete Beginner to Advanced DevOps Course covering CI/CD, Docker, Kubernetes, and Cloud.",
//     image:
//       "https://res.cloudinary.com/dykpztnpu/image/upload/v1759323860/online-exam/course-images/dgcn0l80cl3oh5buo4us.jpg",
//     contents: [
//       {
//         title: "1. What is DevOps?",
//         body: "DevOps is a set of practices that combines software development (Dev) and IT operations (Ops).",
//         order: 1,
//         images: [
//           "https://www.redhat.com/cms/managed-files/styles/wysiwyg_full_width/s3/DevOps-Process-Flow-Red-Hat.png",
//           "https://www.atlassian.com/dam/jcr:813202b8-6e7e-4c7e-8e2d-7b6b6b6b6b6b/DevOps-diagram.svg",
//         ],
//         codeBlocks: [],
//       },
//       {
//         title: "2. Docker Basics",
//         body: "Docker is a platform for developing, shipping, and running applications in containers.",
//         order: 2,
//         images: [
//           "https://www.docker.com/wp-content/uploads/2022/03/what-is-docker.png",
//         ],
//         codeBlocks: [
//           {
//             language: "dockerfile",
//             code: 'FROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node", "server.js"]',
//           },
//         ],
//       },
//       {
//         title: "3. CI/CD Pipeline Example (GitHub Actions)",
//         body: "A CI/CD pipeline automates the process of building, testing, and deploying code.",
//         order: 3,
//         images: [
//           "https://docs.github.com/assets/images/help/actions/actions-diagram.png",
//         ],
//         codeBlocks: [
//           {
//             language: "yaml",
//             code: "name: CI/CD Pipeline\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Set up Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n      - run: npm install\n      - run: npm test",
//           },
//         ],
//       },
//       {
//         title: "4. Kubernetes Overview",
//         body: "Kubernetes automates deployment, scaling, and management of containerized applications.",
//         order: 4,
//         images: [
//           "https://kubernetes.io/images/kubernetes-horizontal-color.png",
//         ],
//         codeBlocks: [
//           {
//             language: "yaml",
//             code: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: myapp-pod\nspec:\n  containers:\n    - name: myapp-container\n      image: myapp:latest",
//           },
//         ],
//       },
//     ],
//   },
//   {
//     title: "Java OOPs Concepts",
//     description:
//       "Learn Java Object-Oriented Programming concepts with practical examples.",
//     image:
//       "https://www.courselounge.com/wp-content/uploads/best-java-courses-online-768x379.png",
//     contents: [
//       {
//         title: "1. What is OOP?",
//         body: "OOP is a paradigm based on objects that contain data and methods.",
//         order: 1,
//         images: [
//           "https://media.geeksforgeeks.org/wp-content/uploads/20230918144209/OOPs-Concepts.png",
//         ],
//         codeBlocks: [],
//       },
//       {
//         title: "2. Java Class Example",
//         body: "A class is a blueprint for objects.",
//         order: 2,
//         codeBlocks: [
//           {
//             language: "java",
//             code: 'public class Student {\n    String name;\n    int age;\n\n    void display() {\n        System.out.println(name + " " + age);\n    }\n}',
//           },
//         ],
//       },
//       {
//         title: "3. Inheritance Example",
//         body: "Inheritance allows one class to inherit another.",
//         order: 3,
//         codeBlocks: [
//           {
//             language: "java",
//             code: 'class Animal {\n    void eat() { System.out.println("eating..."); }\n}\nclass Dog extends Animal {\n    void bark() { System.out.println("barking..."); }\n}\nclass TestInheritance {\n    public static void main(String args[]) {\n        Dog d = new Dog();\n        d.eat();\n        d.bark();\n    }\n}',
//           },
//         ],
//       },
//       {
//         title: "4. Polymorphism Example",
//         body: "Methods behave differently depending on the object.",
//         order: 4,
//         codeBlocks: [
//           {
//             language: "java",
//             code: 'class Animal { void sound() { System.out.println("Animal sound"); } }\nclass Dog extends Animal { void sound() { System.out.println("Dog barks"); } }\nclass Cat extends Animal { void sound() { System.out.println("Cat meows"); } }\npublic class TestPolymorphism {\n    public static void main(String[] args) {\n        Animal a;\n        a = new Dog(); a.sound();\n        a = new Cat(); a.sound();\n    }\n}',
//           },
//         ],
//       },
//     ],
//   },
//   {
//     title: "Python Programming",
//     description:
//       "Master Python with basics, advanced topics, libraries, and real projects.",
//     image:
//       "https://res.cloudinary.com/dykpztnpu/image/upload/v1759323946/online-exam/course-images/g0nsaa3zmfcsg2eeawl4.jpg",
//     contents: [
//       {
//         title: "1. Introduction to Python",
//         body: "Python is a high-level, interpreted language created by Guido van Rossum.",
//         order: 1,
//         codeBlocks: [],
//       },
//       {
//         title: "2. First Program",
//         body: "Printing Hello World",
//         order: 2,
//         codeBlocks: [{ language: "python", code: "print('Hello, World!')" }],
//       },
//       {
//         title: "3. Variables & Data Types",
//         body: "Python has dynamic typing.",
//         order: 3,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "x = 10 # int\ny = 3.14 # float\nname = 'Alice' # string\nis_active = True # bool\nprint(type(x), type(y), type(name), type(is_active))",
//           },
//         ],
//       },
//       {
//         title: "4. Control Statements",
//         body: "If-Else and Loops in Python",
//         order: 4,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "age = 18\nif age >= 18:\n    print('Adult')\nelse:\n    print('Minor')\n\nfor i in range(5):\n    print('Number:', i)\n\ncount = 0\nwhile count < 3:\n    print('Count:', count)\n    count += 1",
//           },
//         ],
//       },
//       {
//         title: "5. Functions",
//         body: "Functions in Python improve reusability.",
//         order: 5,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "def greet(name):\n    return f'Hello, {name}'\n\nprint(greet('Alice'))\n\nadd = lambda a, b: a + b\nprint('Sum:', add(10, 20))",
//           },
//         ],
//       },
//       {
//         title: "6. Data Structures",
//         body: "Lists, Tuples, Sets, and Dictionaries",
//         order: 6,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "fruits = ['apple','banana','cherry']\nfruits.append('mango')\nprint(fruits)\n\nnums = (1,2,3)\nprint(nums)\n\ncolors = {'red','blue','green'}\ncolors.add('yellow')\nprint(colors)\n\nperson = {'name':'Bob','age':25}\nprint(person['name'])",
//           },
//         ],
//       },
//       {
//         title: "7. File Handling",
//         body: "Read and write files in Python.",
//         order: 7,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "with open('sample.txt','w') as f:\n    f.write('Hello File!')\n\nwith open('sample.txt','r') as f:\n    print(f.read())",
//           },
//         ],
//       },
//       {
//         title: "8. Exception Handling",
//         body: "Use try-except for errors.",
//         order: 8,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "try:\n    x = 10/0\nexcept ZeroDivisionError:\n    print('Cannot divide by zero')\nfinally:\n    print('Done')",
//           },
//         ],
//       },
//       {
//         title: "9. Object-Oriented Programming",
//         body: "Classes and Objects in Python",
//         order: 9,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "class Car:\n    def __init__(self, brand):\n        self.brand = brand\n    def drive(self):\n        print(self.brand, 'is driving')\n\ncar1 = Car('Tesla')\ncar1.drive()",
//           },
//         ],
//       },
//       {
//         title: "10. Popular Libraries",
//         body: "NumPy, Pandas, Matplotlib basics",
//         order: 10,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "import numpy as np\narr = np.array([1,2,3])\nprint(arr*2)\n\nimport pandas as pd\ndf = pd.DataFrame({'Name':['Alice','Bob'],'Age':[25,30]})\nprint(df)\n\nimport matplotlib.pyplot as plt\nplt.plot([1,2,3],[2,4,6])\nplt.show()",
//           },
//         ],
//       },
//       {
//         title: "11. Mini Project - Calculator",
//         body: "A simple CLI calculator",
//         order: 11,
//         codeBlocks: [
//           {
//             language: "python",
//             code: "def calc():\n    a = int(input('Enter first: '))\n    b = int(input('Enter second: '))\n    op = input('Enter + - * /: ')\n    if op=='+': print(a+b)\n    elif op=='-': print(a-b)\n    elif op=='*': print(a*b)\n    elif op=='/': print(a/b)\n\ncalc()",
//           },
//         ],
//       },
//     ],
//   },
// ];

// async function seedCourses() {
//   try {
//     await mongoose.connect(
//       process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online-exam",
//       {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       }
//     );
//     await Course.deleteMany({});
//     await Course.insertMany(courses);
//     console.log("✅ Courses seeded successfully!");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error seeding courses:", err);
//     process.exit(1);
//   }
// }

// seedCourses();
