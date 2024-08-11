import fetch from 'node-fetch';

let currentBest = null; // Variable to lock in the correct 'best' guess
let currentWorst = null; // Variable to lock in the correct 'worst' guess

// Function to generate random values, respecting locked guesses
function generateBestAndWorst() {
    let best, worst;

    if (currentBest !== null) {
        best = currentBest;
        console.log(`'Best' is locked in at: ${best}`);
    } else {
        best = Math.floor(Math.random() * 50);
    }

    if (currentWorst !== null) {
        worst = currentWorst;
        console.log(`'Worst' is locked in at: ${worst}`);
    } else {
        worst = Math.floor(Math.random() * 50);
        // Ensure 'worst' is not the same as 'best' when 'best' isn't locked
        while (worst === best) {
            worst = Math.floor(Math.random() * 50);
        }
    }

    return { best, worst };
}

// Function to send the HTTP request
async function sendRequest(best, worst) {
    const payload = {
        best: String(best),
        worst: String(worst),
        uname: "jamesliangg_cb264c81" // Be cautious with sensitive data
    };

    const response = await fetch("https://library.hackmit.org/api/puzzle/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`Trying Best: ${best}, Worst: ${worst} - Response:`, data);
    return data;
}

// Function to reset the puzzle using HTTP request
async function resetPuzzle() {
    while (true) {
        const payload = {
            uname: "jamesliangg_cb264c81" // Be cautious with sensitive data
        };

        const response = await fetch("http://localhost:3000/api/puzzle/get", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Attempting to reset puzzle - Response:", data);

        if (data.timeout == false) {
            console.log("Puzzle reset successfully.");
            break;
        }

        // Wait for a short period before trying again if timeout is true
        await new Promise(resolve => setTimeout(resolve, 5000)); // Adjust as needed
    }
}

async function main() {
    while (true) {
        const { best, worst } = generateBestAndWorst();
        const response = await sendRequest(best, worst);

        // Check the response and lock in the correct guesses
        if (response.verdict) {
            if (response.verdict.best === "correct" && currentBest === null) {
                currentBest = best;
                console.log(`Correct 'best' found: ${best}`);
            }
            if (response.verdict.worst === "correct" && currentWorst === null) {
                currentWorst = worst;
                console.log(`Correct 'worst' found: ${worst}`);
            }
        }

        if (response.flag && response.flag.toLowerCase() === 'correct') {
            console.log(`Correct combination found! Best: ${best}, Worst: ${worst}`);
            console.log('Full Response:', response);
            process.exit(0); // Exit the process when the correct flag is found
        }

        if (response.guesses_left == 0) {
            await resetPuzzle(); // Reset the puzzle if no guesses left
            currentBest = null; // Unlock the best guess after reset
            currentWorst = null; // Unlock the worst guess after reset
        }

        // Wait for a short period before making the next guess
        await new Promise(resolve => setTimeout(resolve, 1500)); // Adjust as needed
    }
}

main();
