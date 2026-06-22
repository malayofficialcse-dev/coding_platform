import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Course.js";

dotenv.config();

const courses = [
  // {
  //   title: "DevOps Full Course",
  //   description:
  //     "Complete Beginner to Advanced DevOps Course covering CI/CD, Docker, Kubernetes, and Cloud.",
  //   image:
  //     "https://res.cloudinary.com/dykpztnpu/image/upload/v1759323860/online-exam/course-images/dgcn0l80cl3oh5buo4us.jpg",
  //   contents: [
  //     {
  //       title: "1. What is DevOps?",
  //       body: "DevOps is a set of practices that combines software development (Dev) and IT operations (Ops). It aims to shorten the development lifecycle and provide continuous delivery with high software quality.\n\nKey Concepts:\n- Collaboration between development and operations\n- Automation of processes\n- Continuous Integration & Continuous Deployment (CI/CD)\n- Monitoring and feedback",
  //       order: 1,
  //       images: [
  //         "https://www.redhat.com/cms/managed-files/styles/wysiwyg_full_width/s3/DevOps-Process-Flow-Red-Hat.png",
  //         "https://www.atlassian.com/dam/jcr:813202b8-6e7e-4c7e-8e2d-7b6b6b6b6b6b/DevOps-diagram.svg",
  //       ],
  //       codeBlocks: [],
  //     },
  //     {
  //       title: "2. Docker Basics",
  //       body: "Docker is a platform for developing, shipping, and running applications in containers.\n\n- Containers are lightweight, portable, and self-sufficient.\n- Docker images are blueprints for containers.",
  //       order: 2,
  //       images: [
  //         "https://www.docker.com/wp-content/uploads/2022/03/what-is-docker.png",
  //       ],
  //       codeBlocks: [
  //         {
  //           language: "dockerfile",
  //           code: 'FROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node", "server.js"]',
  //         },
  //       ],
  //     },
  //     {
  //       title: "3. CI/CD Pipeline Example (GitHub Actions)",
  //       body: "A CI/CD pipeline automates the process of building, testing, and deploying code.\n\nGitHub Actions is a popular CI/CD tool.",
  //       order: 3,
  //       images: [
  //         "https://docs.github.com/assets/images/help/actions/actions-diagram.png",
  //       ],
  //       codeBlocks: [
  //         {
  //           language: "yaml",
  //           code: "name: CI/CD Pipeline\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Set up Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n      - run: npm install\n      - run: npm test",
  //         },
  //       ],
  //     },
  //     {
  //       title: "4. Kubernetes Overview",
  //       body: "Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.",
  //       order: 4,
  //       images: [
  //         "https://kubernetes.io/images/kubernetes-horizontal-color.png",
  //       ],
  //       codeBlocks: [
  //         {
  //           language: "yaml",
  //           code: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: myapp-pod\nspec:\n  containers:\n    - name: myapp-container\n      image: myapp:latest",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   title: "Java OOPs Concepts",
  //   description:
  //     "Learn Java Object-Oriented Programming concepts with practical examples.",
  //   image:
  //     "https://www.courselounge.com/wp-content/uploads/best-java-courses-online-768x379.png",
  //   contents: [
  //     {
  //       title: "1. What is OOP?",
  //       body: "OOP stands for Object-Oriented Programming. It is a programming paradigm based on the concept of objects, which can contain data and code to manipulate that data.\n\nMain Principles:\n- Encapsulation\n- Inheritance\n- Polymorphism\n- Abstraction",
  //       order: 1,
  //       images: [
  //         "https://media.geeksforgeeks.org/wp-content/uploads/20230918144209/OOPs-Concepts.png",
  //       ],
  //       codeBlocks: [],
  //     },
  //     {
  //       title: "2. Java Class Example",
  //       body: "A class is a blueprint for objects. Here is a simple Java class:",
  //       order: 2,
  //       images: [],
  //       codeBlocks: [
  //         {
  //           language: "java",
  //           code: 'public class Student {\n    String name;\n    int age;\n\n    void display() {\n        System.out.println(name + " " + age);\n    }\n}',
  //         },
  //       ],
  //     },
  //     {
  //       title: "3. Inheritance Example",
  //       body: "Inheritance allows one class to inherit the fields and methods of another class.",
  //       order: 3,
  //       images: [],
  //       codeBlocks: [
  //         {
  //           language: "java",
  //           code: 'class Animal {\n    void eat() { System.out.println("eating..."); }\n}\nclass Dog extends Animal {\n    void bark() { System.out.println("barking..."); }\n}\nclass TestInheritance {\n    public static void main(String args[]) {\n        Dog d = new Dog();\n        d.eat();\n        d.bark();\n    }\n}',
  //         },
  //       ],
  //     },
  //     {
  //       title: "4. Polymorphism Example",
  //       body: "Polymorphism allows methods to do different things based on the object it is acting upon.",
  //       order: 4,
  //       images: [],
  //       codeBlocks: [
  //         {
  //           language: "java",
  //           code: 'class Animal {\n    void sound() { System.out.println("Animal makes a sound"); }\n}\nclass Dog extends Animal {\n    void sound() { System.out.println("Dog barks"); }\n}\nclass Cat extends Animal {\n    void sound() { System.out.println("Cat meows"); }\n}\npublic class TestPolymorphism {\n    public static void main(String[] args) {\n        Animal a;\n        a = new Dog();\n        a.sound();\n        a = new Cat();\n        a.sound();\n    }\n}',
  //         },
  //       ],
  //     },
  //   ],
  // },
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

  //   {
  //     title: "Python Programming",
  //     body: "A comprehensive course covering Python from basics to advanced with projects.",
  //     order: 3,
  //     images: [
  //       "https://i.ibb.co/8mTn2bF/python-logo.png",
  //       "https://i.ibb.co/2dL5Y8S/python-code.png",
  //     ],
  //     codeBlocks: [
  //       {
  //         title: "1. Hello World",
  //         body: "Every Python program starts simple. Let's print Hello World.",
  //         order: 1,
  //         images: ["https://i.ibb.co/4V6HqkY/hello-world.png"],
  //         code: `
  // # Hello World Program
  // print("Hello, World!")
  //       `,
  //       },
  //       {
  //         title: "2. Variables and Data Types",
  //         body: "Python variables don’t need explicit declaration.",
  //         order: 2,
  //         images: ["https://i.ibb.co/n0VZC9d/variables.png"],
  //         code: `
  // # Integer
  // x = 10
  // print("Integer:", x)

  // # Float
  // y = 3.14
  // print("Float:", y)

  // # String
  // name = "Alice"
  // print("String:", name)

  // # Boolean
  // is_active = True
  // print("Boolean:", is_active)
  //       `,
  //       },
  //       {
  //         title: "3. Operators",
  //         body: "Python supports arithmetic, comparison, and logical operators.",
  //         order: 3,
  //         images: ["https://i.ibb.co/cc7K3FT/operators.png"],
  //         code: `
  // a, b = 15, 4

  // # Arithmetic
  // print("Addition:", a + b)
  // print("Subtraction:", a - b)
  // print("Multiplication:", a * b)
  // print("Division:", a / b)
  // print("Floor Division:", a // b)
  // print("Modulus:", a % b)
  // print("Exponent:", a ** b)

  // # Comparison
  // print("Is a > b?", a > b)
  // print("Is a == b?", a == b)
  // print("Is a != b?", a != b)

  // # Logical
  // x, y = True, False
  // print("AND:", x and y)
  // print("OR:", x or y)
  // print("NOT:", not x)
  //       `,
  //       },
  //       {
  //         title: "4. Strings",
  //         body: "Strings in Python are versatile with many built-in methods.",
  //         order: 4,
  //         images: ["https://i.ibb.co/QDmmvD4/strings.png"],
  //         code: `
  // s = "Python Programming"

  // print("Length:", len(s))
  // print("Lowercase:", s.lower())
  // print("Uppercase:", s.upper())
  // print("First 6 chars:", s[:6])
  // print("Last 6 chars:", s[-6:])
  // print("Replace:", s.replace("Python", "Java"))
  // print("Split:", s.split(" "))
  //       `,
  //       },
  //       {
  //         title: "5. Lists",
  //         body: "Lists are mutable collections in Python.",
  //         order: 5,
  //         images: ["https://i.ibb.co/ZcgGZ8k/lists.png"],
  //         code: `
  // fruits = ["apple", "banana", "cherry"]

  // # Access
  // print(fruits[0])  # apple

  // # Modify
  // fruits[1] = "blueberry"
  // print(fruits)

  // # Add
  // fruits.append("mango")
  // print(fruits)

  // # Remove
  // fruits.remove("apple")
  // print(fruits)

  // # Loop
  // for fruit in fruits:
  //     print(fruit)
  //       `,
  //       },
  //       {
  //         title: "6. Tuples",
  //         body: "Tuples are immutable sequences in Python.",
  //         order: 6,
  //         images: ["https://i.ibb.co/NsCmC8K/tuples.png"],
  //         code: `
  // numbers = (1, 2, 3, 4, 5)

  // print("Tuple:", numbers)
  // print("First:", numbers[0])
  // print("Last:", numbers[-1])

  // # Tuple unpacking
  // a, b, c, d, e = numbers
  // print("Unpacked:", a, b, c, d, e)
  //       `,
  //       },
  //       {
  //         title: "7. Dictionaries",
  //         body: "Dictionaries store key-value pairs.",
  //         order: 7,
  //         images: ["https://i.ibb.co/mzQWj0n/dict.png"],
  //         code: `
  // person = {
  //     "name": "Alice",
  //     "age": 25,
  //     "city": "New York"
  // }

  // print("Name:", person["name"])
  // person["age"] = 26
  // print("Updated:", person)

  // for key, value in person.items():
  //     print(key, ":", value)
  //       `,
  //       },
  //       {
  //         title: "8. If-Else Conditions",
  //         body: "Python uses indentation for blocks.",
  //         order: 8,
  //         images: ["https://i.ibb.co/7RVV5Kp/ifelse.png"],
  //         code: `
  // age = 18

  // if age < 18:
  //     print("Minor")
  // elif age == 18:
  //     print("Just an adult")
  // else:
  //     print("Adult")
  //       `,
  //       },
  //       {
  //         title: "9. Loops",
  //         body: "For and while loops in Python.",
  //         order: 9,
  //         images: ["https://i.ibb.co/wzQykh2/loops.png"],
  //         code: `
  // # For loop
  // for i in range(1, 6):
  //     print("For Loop:", i)

  // # While loop
  // count = 1
  // while count <= 5:
  //     print("While Loop:", count)
  //     count += 1
  //       `,
  //       },
  //       {
  //         title: "10. Functions",
  //         body: "Functions help in reusability.",
  //         order: 10,
  //         images: ["https://i.ibb.co/3hsXz1r/functions.png"],
  //         code: `
  // def greet(name):
  //     return "Hello, " + name

  // print(greet("Alice"))
  // print(greet("Bob"))

  // def add(a, b):
  //     return a + b

  // print("Sum:", add(10, 20))
  //       `,
  //       },
  //     ],
  //   },


  {
    title: "Master DevOps Engineering: Beginner to Production Expert",
    description:
      "The complete DevOps course covering Linux, Docker, Kubernetes, CI/CD, Cloud, Monitoring, Security, System Design, and Real Production Projects.",

    image:
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9",

    topics: [
      {
        title: "Introduction to DevOps",
        order: 1,

        subtopics: [
          {
            title: "What is DevOps?",
            order: 1,

            body: `
DevOps is a culture, methodology, and set of practices that combines software development and IT operations.

Goals:

1. Faster Development
2. Continuous Delivery
3. Automation
4. Scalability
5. Reliability
6. Monitoring
7. Collaboration

Traditional:

Developer → QA → Ops

DevOps:

Developer ↔ QA ↔ Security ↔ Operations ↔ Monitoring

Benefits:

• Faster releases
• Less downtime
• Better quality
• Automated deployments
• Higher scalability
• Reduced costs
          `,

            images: [
              "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9",
              "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
            ],

            codeBlocks: []
          },

          {
            title: "DevOps Lifecycle",
            order: 2,

            body: `
Phases:

1. Plan
2. Develop
3. Build
4. Test
5. Release
6. Deploy
7. Operate
8. Monitor

Tools:

Planning -> Jira
Code -> Git
Build -> Maven
CI -> Jenkins
Container -> Docker
Orchestration -> Kubernetes
IaC -> Terraform
Monitoring -> Prometheus + Grafana
          `,

            images: [
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
            ],

            codeBlocks: []
          }
        ]
      },

      {
        title: "Linux Fundamentals",
        order: 2,

        subtopics: [
          {
            title: "Linux File System",

            order: 1,

            body: `
Directories:

/

/home
/etc
/var
/opt
/usr
/tmp
/root

Important Concepts:

inode
permissions
ownership
symlinks
hard links
          `,

            images: [
              "https://images.unsplash.com/photo-1518770660439-4636190af475"
            ],

            codeBlocks: [
              {
                language: "bash",
                code: `
pwd
ls
ls -la
cd
mkdir devops
touch file.txt
rm file.txt
rm -rf folder
              `
              }
            ]
          },

          {
            title: "Linux Permissions",
            order: 2,

            body: `
Permission Types:

r = read
w = write
x = execute

Users:

owner
group
others

Examples:

755
644
777
600
          `,

            images: [],

            codeBlocks: [
              {
                language: "bash",
                code: `
chmod 755 script.sh
chmod +x script.sh
chown ubuntu:ubuntu app.js
ls -l
              `
              }
            ]
          }
        ]
      },

      {
        title: "Docker",
        order: 7,

        subtopics: [
          {
            title: "What is Docker?",
            order: 1,

            body: `
Docker is a containerization platform.

Advantages:

1. Lightweight
2. Portable
3. Consistent Environment
4. Faster Deployment
5. Scalability
6. Isolation

Architecture:

Docker Client
Docker Daemon
Docker Registry
Containers
Images
Volumes
Networks
          `,

            images: [
              "https://images.unsplash.com/photo-1605745341112-85968b19335b",
              "https://images.unsplash.com/photo-1555949963-aa79dcee981c"
            ],

            codeBlocks: []
          },

          {
            title: "Docker Commands",
            order: 2,

            body: `
Important Docker commands used in interviews and production.
          `,

            codeBlocks: [
              {
                language: "bash",
                code: `
docker pull nginx
docker images
docker ps
docker ps -a
docker run nginx
docker run -d nginx
docker stop container_id
docker rm container_id
docker rmi image_id
docker logs container_id
docker exec -it container_id bash
docker build -t myapp .
docker tag myapp username/myapp:v1
docker push username/myapp:v1
              `
              }
            ],

            images: []
          },

          {
            title: "Dockerfile",

            order: 3,

            body: `
Dockerfile Instructions:

FROM
WORKDIR
COPY
RUN
ENV
EXPOSE
CMD
ENTRYPOINT
          `,

            codeBlocks: [
              {
                language: "dockerfile",
                code: `
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm","start"]
              `
              }
            ],

            images: []
          }
        ]
      },

      {
        title: "Kubernetes",
        order: 9,

        subtopics: [
          {
            title: "Kubernetes Architecture",
            order: 1,

            body: `
Master Components:

API Server
Scheduler
Controller Manager
ETCD

Worker Components:

Kubelet
Container Runtime
Kube Proxy

Objects:

Pods
Deployments
ReplicaSets
Services
Ingress
ConfigMaps
Secrets
Persistent Volumes
Namespaces
          `,

            images: [
              "https://images.unsplash.com/photo-1667372393249-8b0c7c4d0cce"
            ],

            codeBlocks: []
          },

          {
            title: "Creating a Deployment",

            order: 2,

            body: `
Deploying a Node.js application in Kubernetes.
          `,

            codeBlocks: [
              {
                language: "yaml",
                code: `
apiVersion: apps/v1
kind: Deployment

metadata:
  name: backend

spec:
  replicas: 3

  selector:
    matchLabels:
      app: backend

  template:
    metadata:
      labels:
        app: backend

    spec:
      containers:
      - name: backend
        image: username/backend:v1

        ports:
        - containerPort: 5000
              `
              }
            ],

            images: []
          },

          {
            title: "Service",

            order: 3,

            body: `
Types:

ClusterIP
NodePort
LoadBalancer
ExternalName
          `,

            codeBlocks: [
              {
                language: "yaml",
                code: `
apiVersion: v1
kind: Service

metadata:
  name: backend-service

spec:
  selector:
    app: backend

  ports:
  - port: 80
    targetPort: 5000

  type: LoadBalancer
              `
              }
            ]
          }
        ]
      },
      {
        title: "Networking for DevOps",
        order: 3,
        subtopics: [
          {
            title: "OSI Model",
            order: 1,
            body: `
The OSI (Open Systems Interconnection) model consists of 7 layers.

1. Physical Layer
2. Data Link Layer
3. Network Layer
4. Transport Layer
5. Session Layer
6. Presentation Layer
7. Application Layer

Example:

Application -> HTTP
Transport -> TCP
Network -> IP
Data Link -> MAC Address
Physical -> Cables
      `,
            images: [
              "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
            ],
            codeBlocks: []
          },
          {
            title: "TCP vs UDP",
            order: 2,
            body: `
TCP:
• Connection Oriented
• Reliable
• Ordered Delivery
• Error Checking

UDP:
• Connectionless
• Faster
• No Guarantee
• Used in Streaming and Gaming
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
ping google.com
traceroute google.com
netstat -ano
ss -tuln
          `
              }
            ]
          },
          {
            title: "DNS",
            order: 3,
            body: `
DNS converts domain names into IP addresses.

Example:
google.com -> 142.x.x.x

Record Types:
A
AAAA
CNAME
MX
TXT
NS
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
nslookup google.com
dig google.com
host google.com
          `
              }
            ]
          }
        ]
      },

      {
        title: "Git and GitHub",
        order: 4,
        subtopics: [
          {
            title: "Introduction to Git",
            order: 1,
            body: `
Git is a distributed version control system.

Advantages:
• Track changes
• Collaboration
• Branching
• Rollback
• Code History
      `,
            images: [
              "https://images.unsplash.com/photo-1556075798-4825dfaaf498"
            ],
            codeBlocks: []
          },
          {
            title: "Basic Git Commands",
            order: 2,
            body: `
Most used Git commands in real projects.
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
git init
git clone repo-url
git status
git add .
git commit -m "first commit"
git push origin main
git pull origin main
git fetch
git log
git diff
          `
              }
            ]
          },
          {
            title: "Branching and Merging",
            order: 3,
            body: `
Git Branching Strategies:

1. Main
2. Develop
3. Feature
4. Release
5. Hotfix
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
git branch
git branch feature-login
git checkout feature-login
git switch main
git merge feature-login
git branch -d feature-login
          `
              }
            ]
          }
        ]
      },

      {
        title: "Shell Scripting",
        order: 5,
        subtopics: [
          {
            title: "Variables",
            order: 1,
            body: `
Shell variables store values.

Examples:
NAME=Malay
AGE=24
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
#!/bin/bash

NAME="Malay"

echo $NAME
          `
              }
            ]
          },
          {
            title: "Conditions",
            order: 2,
            body: `
if
if else
nested if
case
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
#!/bin/bash

AGE=20

if [ $AGE -ge 18 ]
then
  echo "Adult"
else
  echo "Minor"
fi
          `
              }
            ]
          },
          {
            title: "Loops",
            order: 3,
            body: `
Loops automate repetitive tasks.

for
while
until
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
for i in {1..5}
do
  echo $i
done
          `
              }
            ]
          }
        ]
      },

      {
        title: "Docker Compose",
        order: 8,
        subtopics: [
          {
            title: "Introduction to Docker Compose",
            order: 1,
            body: `
Docker Compose helps run multiple containers together.

Example:
Node.js
MongoDB
Redis
Nginx
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "docker-compose.yml",
            order: 2,
            body: `
Running MERN stack using Docker Compose.
      `,
            images: [],
            codeBlocks: [
              {
                language: "yaml",
                code: `
services:
  backend:
    build: .
    ports:
      - "5000:5000"

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"

  redis:
    image: redis:7
    ports:
      - "6379:6379"
          `
              }
            ]
          }
        ]
      },

      {
        title: "Helm",
        order: 10,
        subtopics: [
          {
            title: "Introduction to Helm",
            order: 1,
            body: `
Helm is the package manager for Kubernetes.

Components:
Chart
Release
Repository
Values
Templates
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "Helm Commands",
            order: 2,
            body: `
Common Helm commands.
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo nginx
helm install my-nginx bitnami/nginx
helm list
helm uninstall my-nginx
          `
              }
            ]
          }
        ]
      },

      {
        title: "Terraform",
        order: 11,
        subtopics: [
          {
            title: "Introduction to Terraform",
            order: 1,
            body: `
Terraform is an Infrastructure as Code tool.

Advantages:
• Version Controlled Infrastructure
• Reusable
• Automated
• Multi Cloud
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "Terraform Commands",
            order: 2,
            body: `
Most important commands.
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
terraform init
terraform validate
terraform plan
terraform apply
terraform destroy
terraform fmt
terraform state list
          `
              }
            ]
          },
          {
            title: "Azure Resource Group Creation",
            order: 3,
            body: `
Creating Azure Resource Group using Terraform.
      `,
            images: [],
            codeBlocks: [
              {
                language: "hcl",
                code: `
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name = "zerodha-rg"
  location = "Central India"
}
          `
              }
            ]
          }
        ]
      },

      {
        title: "Jenkins",
        order: 12,
        subtopics: [
          {
            title: "Introduction to Jenkins",
            order: 1,
            body: `
Jenkins is an automation server used for CI/CD pipelines.

Features:
• Build
• Test
• Deploy
• Integration
• Plugins
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "Jenkins Pipeline",
            order: 2,
            body: `
Declarative Pipeline.
      `,
            images: [],
            codeBlocks: [
              {
                language: "groovy",
                code: `
pipeline {
  agent any

  stages {

    stage('Build') {
      steps {
        sh 'npm install'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker build -t app .'
      }
    }
  }
}
          `
              }
            ]
          }
        ]
      },

      {
        title: "GitHub Actions",
        order: 13,
        subtopics: [
          {
            title: "Introduction to GitHub Actions",
            order: 1,
            body: `
GitHub Actions is a CI/CD service integrated with GitHub.

Features:
• Automated Builds
• Automated Tests
• Deployments
• Workflows
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "CI Pipeline",
            order: 2,
            body: `
Node.js CI Pipeline.
      `,
            images: [],
            codeBlocks: [
              {
                language: "yaml",
                code: `
name: CI

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install
      - run: npm test
      - run: npm run build
          `
              }
            ]
          }
        ]
      },

      {
        title: "AWS Fundamentals",
        order: 14,
        subtopics: [
          {
            title: "Core AWS Services",
            order: 1,
            body: `
Compute:
EC2
Lambda
ECS
EKS

Storage:
S3
EBS
EFS

Database:
RDS
DynamoDB
ElastiCache

Networking:
VPC
Route53
CloudFront
      `,
            images: [],
            codeBlocks: []
          }
        ]
      },

      {
        title: "Azure DevOps and AKS",
        order: 15,
        subtopics: [
          {
            title: "Azure Kubernetes Service",
            order: 1,
            body: `
AKS is a managed Kubernetes service by Microsoft Azure.

Features:
• Managed Control Plane
• Auto Scaling
• Azure Monitor
• Security
• Azure Integration
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "AKS Commands",
            order: 2,
            body: `
Deploying Kubernetes cluster in Azure.
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
az login

az group create \
--name zerodha-rg \
--location centralindia

az aks create \
--resource-group zerodha-rg \
--name zerodha-aks \
--node-count 2 \
--generate-ssh-keys

az aks get-credentials \
--resource-group zerodha-rg \
--name zerodha-aks

kubectl get nodes
kubectl get pods -A
          `
              }
            ]
          }
        ]
      },

      {
        title: "Monitoring with Prometheus and Grafana",
        order: 16,
        subtopics: [
          {
            title: "Prometheus",
            order: 1,
            body: `
Prometheus collects metrics.

Components:
Prometheus Server
Exporters
AlertManager
TSDB
PromQL
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "Grafana",
            order: 2,
            body: `
Grafana visualizes metrics.

Dashboards:
CPU
Memory
Network
Pod Metrics
Node Metrics
      `,
            images: [],
            codeBlocks: []
          }
        ]
      },

      {
        title: "Redis and Kafka",
        order: 17,
        subtopics: [
          {
            title: "Redis",
            order: 1,
            body: `
Redis is an in-memory data structure store.

Uses:
Caching
Sessions
Pub/Sub
Rate Limiting
Queues
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
docker run -d --name redis -p 6379:6379 redis
redis-cli
SET name Malay
GET name
          `
              }
            ]
          },
          {
            title: "Apache Kafka",
            order: 2,
            body: `
Kafka is a distributed event streaming platform.

Components:
Producer
Consumer
Broker
Topic
Partition
Offset
      `,
            images: [],
            codeBlocks: [
              {
                language: "bash",
                code: `
docker compose up -d
kafka-topics --create
kafka-topics --list
kafka-console-producer
kafka-console-consumer
          `
              }
            ]
          }
        ]
      },

      {
        title: "Production Projects and Interview Preparation",
        order: 18,
        subtopics: [
          {
            title: "Project 1 - MERN on Docker",
            order: 1,
            body: `
Architecture:

React
Node.js
MongoDB
Redis
Docker Compose
Nginx
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "Project 2 - Zerodha Clone on AKS",
            order: 2,
            body: `
Architecture:

Frontend -> React
Backend -> Node.js
Database -> MongoDB Atlas
Cache -> Redis Railway
Container -> Docker
Orchestration -> AKS
CI/CD -> GitHub Actions
Monitoring -> Prometheus + Grafana
      `,
            images: [],
            codeBlocks: []
          },
          {
            title: "DevOps Interview Questions",
            order: 3,
            body: `
1. What is DevOps?
2. Difference between Docker and VM?
3. What is Kubernetes?
4. What is CI/CD?
5. Difference between Deployment and StatefulSet?
6. What is Terraform State?
7. Explain DNS.
8. What is a Load Balancer?
9. What is Redis?
10. Explain Kafka Partitions.
11. Difference between Git Merge and Rebase?
12. Explain Pod Lifecycle.
13. Explain Ingress.
14. What is Helm?
15. Explain Blue Green Deployment.
16. Explain Canary Deployment.
      `,
            images: [],
            codeBlocks: []
          }
        ]
      }
    ]
  }
];



async function seedCourses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    // await Course.deleteMany({});
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
