import fetch from 'node-fetch';

async function solvePuzzle(userInput) {
    const endpointGenerate = 'https://wodou.hackmit.org/api/generate?userEmail=jamesliangg_cb264c81';
    const endpointVerify = 'https://wodou.hackmit.org/api/verify';
    const userEmail = 'jamesliangg_cb264c81';

    try {
        // Fetch encodedWord from the generate endpoint
        const responseGenerate = await fetch(endpointGenerate);
        if (!responseGenerate.ok) {
            throw new Error(`Failed to fetch encodedWord. Status: ${responseGenerate.status}`);
        }
        const dataGenerate = await responseGenerate.json();
        const encodedWord = dataGenerate.encodedWord;

        // console.log('Encoded Word:', encodedWord);

        const payload = {
            userEmail: userEmail,
            encodedWord: encodedWord,
            userInput: userInput
        };

        // Submitting the userInput to the verify endpoint
        const responseVerify = await fetch(endpointVerify, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!responseVerify.ok) {
            throw new Error(`HTTP error! Status: ${responseVerify.status}`);
        }

        const dataVerify = await responseVerify.json();

        const allAbsent = !dataVerify.feedback.some(feedback => feedback == 'correct');
        if (!allAbsent) {
            console.log('Encoded Word:', encodedWord);
            console.log(`Input: ${userInput}`);
            console.log(`Feedback: ${dataVerify.feedback}`);
            // console.log(`Secret Message: ${dataVerify.secretMessage}`);
        }
        // Check if secret message is present
        if (dataVerify.secretMessage) {
            console.log(`Secret Message: ${dataVerify.secretMessage}`);
            return; // Stop recursion if secret message is found
        }

        // Check if all feedback entries are not "absent"
        const allCorrect = dataVerify.feedback.every(feedback => feedback == 'correct');

        if (!allCorrect) {
            // If not all present, recursively call solvePuzzle with a new userInput
            await solvePuzzle(generateRandomString(6));
        } else {
            console.log('All feedback entries are present!');
            process.exit(); // Exit process when all feedback is present
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to generate a random string of specified length
function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        let randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }
    return randomString;
}

// Call solvePuzzle initially
solvePuzzle(generateRandomString(6));
