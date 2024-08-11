import fetch from 'node-fetch';
import { readFile } from 'fs/promises';
import cheerio from 'cheerio';

const userId = 'jamesliangg_cb264c81';

const retryDelay = 20000; // 20 seconds delay for retry

// Function to fetch encoded word from API
async function fetchEncodedWord() {
    const url = `https://wodou.hackmit.org/api/generate?userEmail=${userId}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.encodedWord;
    } catch (error) {
        console.error('Error fetching encoded word:', error.message);
        return null;
    }
}

async function getTotalStrokes(codepoint) {
    const url = `https://www.unicode.org/cgi-bin/GetUnihanData.pl?codepoint=${encodeURIComponent(codepoint)}`;

    try {
        const response = await fetch(url);
        const text = await response.text();

        // Load the HTML response into cheerio
        const $ = cheerio.load(text);

        // Find the kTotalStrokes row
        const strokeValue = $('a[href="http://www.unicode.org/reports/tr38/index.html#kTotalStrokes"]').closest('tr').find('td:nth-child(2) code').text().trim();

        if (strokeValue) {
            return strokeValue;
        }

        throw new Error('kTotalStrokes not found');
    } catch (error) {
        console.error(`Error fetching data for ${codepoint}:`, error);
        return null;
    }
}

async function getStrokesForString(inputString) {
    const strokePromises = Array.from(inputString).map(async (char) => {
        const strokes = await getTotalStrokes(char.codePointAt(0).toString(16).toUpperCase());
        return strokes;
    });

    const results = await Promise.all(strokePromises);
    return results;
}

async function getFormattedStrokesArray(encodedWord) {
    try {
        const strokes = await getStrokesForString(encodedWord);

        if (strokes.length !== 30) {
            throw new Error('Input string must have exactly 30 characters (5x6 grid)');
        }

        // Combine strokes into groups of 5 concatenated strings
        const formattedStrokes = [];
        for (let i = 0; i < strokes.length; i += 5) {
            const group = strokes.slice(i, i + 5).map(stroke => parseInt(stroke || '0', 10)).join('');
            formattedStrokes.push(group);
        }

        return formattedStrokes;
    } catch (error) {
        console.error('Error:', error.message);
        return [];
    }
}

// Function to decode strokes array using sampleMap.csv without headers
async function decodeStrokesArray(encodedWord, strokesArray) {
    try {
        // Read sampleMap.csv file
        const csvData = await readFile('sampleMap.csv', 'utf8');

        // Parse CSV data without headers
        const records = csvData.trim().split('\n').map(line => {
            const [index, number, letter] = line.trim().split(',');
            return { index, number, letter };
        });

        // Initialize result variables
        let decodedWord = '';
        let missingStrokes = '';

        // Iterate through strokesArray
        for (let strokes of strokesArray) {
            // Find matching record in records
            const match = records.find(record => record.number === strokes);

            if (match) {
                // Append matching letter to decodedWord
                decodedWord += match.letter;
            } else {
                // Append a placeholder for missing strokes
                decodedWord += '?';
                missingStrokes += strokes + ' ';
            }
        }

        // Output the decoded word
        console.log('Decoded word:', decodedWord);

        // Output missing strokes
        if (missingStrokes) {
            console.log('Missing strokes:', missingStrokes.trim());
            throw new Error('Missing strokes found');
        }

        // Send payload if no missing strokes
        if (!missingStrokes) {
            await sendVerifyPayload(encodedWord, decodedWord);
        }
    } catch (error) {
        console.error('Error decoding strokes array:', error);

        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await retryDecode();
    }
}

async function retryDecode() {
    try {
        // Fetch new encoded word
        const encodedWord = await fetchEncodedWord();

        if (encodedWord) {
            // Get formatted strokes array asynchronously
            const strokesArray = await getFormattedStrokesArray(encodedWord);

            // Decode strokes array using sampleMap.csv
            await decodeStrokesArray(encodedWord, strokesArray);
        }
    } catch (error) {
        console.error('Retry error:', error);

        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await retryDecode();
    }
}

async function sendVerifyPayload(encodedWord, userInput) {
    const url = 'https://wodou.hackmit.org/api/verify';
    const payload = {
        userEmail: userId,
        encodedWord: encodedWord,
        userInput: userInput
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Verify API response:', data);
    } catch (error) {
        console.error('Error sending verify payload:', error.message);
    }
}

// Example usage:
async function main() {
    try {
        // Fetch encoded word from API
        const encodedWord = await fetchEncodedWord();

        if (encodedWord) {
            // Get formatted strokes array asynchronously
            const strokesArray = await getFormattedStrokesArray(encodedWord);

            // Decode strokes array using sampleMap.csv
            await decodeStrokesArray(encodedWord, strokesArray);
        }
    } catch (error) {
        console.error('Main error:', error);

        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await retryDecode();
    }
}

// Call main function to start the process
main();
