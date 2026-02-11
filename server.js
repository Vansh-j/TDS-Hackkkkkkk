const express = require('express');
const seedrandom = require('seedrandom');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware securely parse JSON bodies
app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Core Logic ported from reference/main.js
function getAgentId(email) {
    const prng = seedrandom("q-share-secret-server#agent-id#" + email);
    return Math.floor(prng() * 100);
}

function getPassword(email) {
    const salt = "tds-share-secret-default-salt";
    const str = "q-share-secret-server#" + salt + "#" + email;
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

// API Endpoint to solve the challenge
app.post('/api/solve', (req, res) => {
    const { agents } = req.body;

    if (!agents || !Array.isArray(agents) || agents.length !== 3) {
        return res.status(400).json({ error: "Please provide exactly 3 agent IDs." });
    }

    const targets = agents.map(id => String(id).padStart(3, '0'));
    const foundAgents = {};

    console.log(`Starting search for agents: ${targets.join(', ')}`);

    // Search Space Configuration
    const years = ["21", "22", "23", "24"];
    const batches = ["1", "2", "3"];
    const limit = 5000; // Search space per batch (0-5000)

    // Brute-force search
    outerLoop:
    for (const year of years) {
        for (const batch of batches) {
            for (let i = 0; i < limit; i++) {
                const roll = String(i).padStart(6, '0');
                const email = `${year}f${batch}${roll}@ds.study.iitm.ac.in`;

                const id = getAgentId(email);
                const idStr = String(id).padStart(3, '0');

                if (targets.includes(idStr) && !foundAgents[idStr]) {
                    foundAgents[idStr] = {
                        agent_id: idStr,
                        email: email,
                        password: getPassword(email)
                    };

                    if (Object.keys(foundAgents).length === 3) break outerLoop;
                }
            }
        }
    }

    // Format results to match input order
    const results = targets.map(target => {
        if (foundAgents[target]) {
            return foundAgents[target];
        } else {
            return { agent_id: target, error: "Not found in common range" };
        }
    });

    res.json(results);
});

// Fallback route for SPA (though this is simple enough not to need it, good practice)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Agent Decoder Server running on port ${PORT}`);
});
