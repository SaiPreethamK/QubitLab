const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

// --------------------------------------------------
// CORS
// --------------------------------------------------

// Allows the Netlify frontend to communicate with
// the Render backend.
app.use(cors());

// --------------------------------------------------
// PORT
// --------------------------------------------------

// Render provides its own PORT through process.env.PORT
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// CHECK GEMINI API KEY
// --------------------------------------------------

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing.");
    console.error(
        "Please add GEMINI_API_KEY to your Render Environment Variables."
    );
    process.exit(1);
}

// --------------------------------------------------
// INITIALIZE GEMINI
// --------------------------------------------------

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(express.json({ limit: "1mb" }));

// --------------------------------------------------
// FRONTEND
// --------------------------------------------------

const frontendPath = path.join(__dirname, "frontend");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// --------------------------------------------------
// AI TUTOR
// --------------------------------------------------

app.post("/api/tutor", async (req, res) => {
    try {
        const { question, history = [] } = req.body;

        // Validate question
        if (
            typeof question !== "string" ||
            question.trim() === ""
        ) {
            return res.status(400).json({
                error: "Please enter a question."
            });
        }

        // Prevent extremely large requests
        if (question.length > 10000) {
            return res.status(400).json({
                error:
                    "Your question is too long. Please keep it below 10,000 characters."
            });
        }

        // Keep only recent conversation history
        const recentHistory = Array.isArray(history)
            ? history.slice(-20)
            : [];

        // --------------------------------------------------
        // GEMINI TUTOR INSTRUCTIONS
        // --------------------------------------------------

        const tutorInstruction = `
You are the AI Tutor for QubitLab, an interactive quantum computing
learning platform.

Your job is to help students understand quantum computing,
quantum algorithms, programming, mathematics, and related
computer science concepts.

IMPORTANT RULES:

1. Explain concepts clearly and accurately.
2. Assume the student may be a beginner.
3. Start with a simple explanation before going into deeper detail.
4. Use examples whenever they make the concept easier to understand.
5. For mathematical concepts, explain the meaning of the symbols.
6. For programming questions, provide correct and understandable code.
7. When explaining quantum computing, use technically accurate terminology.
8. Do not invent facts, formulas, algorithms, or experimental results.
9. If you are uncertain about something, clearly say so.
10. Do not claim that a qubit is simply "0 and 1 at the same time."
    Explain superposition more accurately when needed.
11. Explain that quantum measurement produces classical outcomes
    according to the probabilities determined by the quantum state.
12. Do not claim that quantum entanglement allows faster-than-light
    communication.
13. Distinguish classical bits from qubits clearly.
14. When discussing quantum gates, explain their purpose and effect.
15. When discussing algorithms, explain the main idea before the
    implementation details.
16. Keep answers relevant to the student's question.
17. If a question is outside quantum computing, you may still help
    if it is related to mathematics, programming, computer science,
    or learning.
18. If the student asks a very simple question, do not unnecessarily
    make the answer extremely complicated.

FORMATTING:

Use Markdown when useful.

You may use:
- Headings
- Bullet points
- Numbered lists
- Bold text
- Inline code
- Code blocks
- Mathematical notation

For code, always use fenced code blocks.

Make the response readable and suitable for a student.

QubitLab topics include:

- Qubits
- Superposition
- Entanglement
- Measurement
- Quantum Gates
- Pauli Gates
- Hadamard Gate
- CNOT Gate
- Bloch Sphere
- Quantum Interference
- Quantum Circuits
- Quantum Algorithms
- Grover's Algorithm
- Deutsch-Jozsa Algorithm
- Shor's Algorithm
- Quantum Programming
- Quantum Mathematics
- Linear Algebra
- Probability
- Python
- Computer Science

When appropriate, structure explanations like:

1. Simple definition
2. How it works
3. Example
4. Important points
5. Summary

Your goal is to make quantum computing easier to learn,
while maintaining scientific accuracy.
`;

        // --------------------------------------------------
        // CONVERSATION HISTORY
        // --------------------------------------------------

        const contents = [];

        for (const message of recentHistory) {
            if (
                message &&
                (message.role === "user" ||
                    message.role === "model") &&
                typeof message.text === "string" &&
                message.text.trim() !== ""
            ) {
                contents.push({
                    role: message.role,
                    parts: [
                        {
                            text: message.text
                        }
                    ]
                });
            }
        }

        // Add current question
        contents.push({
            role: "user",
            parts: [
                {
                    text: question.trim()
                }
            ]
        });

        // --------------------------------------------------
        // GEMINI API REQUEST
        // --------------------------------------------------

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: contents,
            config: {
                systemInstruction: tutorInstruction,
                temperature: 0.7,
                maxOutputTokens: 4096
            }
        });

        const answer = response.text;

        // --------------------------------------------------
        // SEND RESPONSE TO FRONTEND
        // --------------------------------------------------

        res.json({
            answer:
                answer ||
                "I could not generate an answer. Please try again."
        });

    } catch (error) {
        console.error("Gemini API Error:", error);

        res.status(500).json({
            error:
                "Unable to connect to Gemini right now. Please check the Gemini API configuration and try again."
        });
    }
});

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "QubitLab server is running."
    });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

// 0.0.0.0 allows Render to receive external requests.

app.listen(PORT, "0.0.0.0", () => {
    console.log(`QubitLab is running on port ${PORT}`);
});