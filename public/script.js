document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');

    generateBtn.addEventListener('click', startSearch);
    copyBtn.addEventListener('click', copyToClipboard);
});

async function startSearch() {
    // 1. Get Inputs
    const inputs = [
        document.getElementById('agent1').value.trim(),
        document.getElementById('agent2').value.trim(),
        document.getElementById('agent3').value.trim()
    ];

    // 2. Validate Inputs
    const targets = inputs.filter(i => i !== "");

    if (targets.length !== 3) {
        setStatus("Please enter all 3 Agent IDs.", "error");
        return;
    }

    // UI Updates
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    document.getElementById('output-area').style.display = 'none';
    setStatus("Accessing mainframe... searching student database...", "loading");

    try {
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agents: targets })
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Display
        const jsonStr = JSON.stringify(data, null, 2);
        document.getElementById('json-output').textContent = jsonStr;
        document.getElementById('output-area').style.display = 'block';
        setStatus("Decryption Complete.", "");

    } catch (e) {
        console.error(e);
        setStatus("System Failure: " + e.message, "error");
    } finally {
        generateBtn.disabled = false;
    }
}

// UI Helpers
function setStatus(msg, type) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = 'status ' + type;
}

function copyToClipboard() {
    const text = document.getElementById('json-output').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btnText = document.getElementById('copy-text');
        const original = btnText.textContent;
        btnText.textContent = "Copied!";
        setTimeout(() => btnText.textContent = original, 2000);
    });
}
