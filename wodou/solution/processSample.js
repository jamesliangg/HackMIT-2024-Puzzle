import fs from 'fs/promises';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

// Async function to process each entry
async function processEntries() {
    try {
        const data = await fs.readFile('cleanSample.csv', 'utf8');
        const lines = data.trim().split('\n');

        for (let line of lines) {
            const parts = line.split(',');
            const chineseChars = parts[0]; // Assuming Chinese characters are always in the first part

            // Call your async function with the Chinese characters
            const strokesArray = await getFormattedStrokesArray(chineseChars);

            // Process strokesArray and parts[1], parts[2] as needed
            for (let i = 0; i < strokesArray.length; i++) {
                const number = strokesArray[i];
                const secondColumnLetter = parts[1][i]; // Second column letter
                const index = i; // Index in the array

                // Check if third column has a value of 'c' in that index
                if (parts[2][i] === 'c') {
                    // Save to a file or process as needed
                    const output = `${index},${number},${secondColumnLetter}`;
                    console.log(output); // Example: Outputting to console
                    // Example: Save to file
                    await fs.appendFile('sampleMap.csv', output + '\n');
                }
            }
        }
    } catch (err) {
        console.error('Error reading or processing file:', err);
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

async function getFormattedStrokesArray(inputString) {
    try {
        const strokes = await getStrokesForString(inputString);

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

// Invoke the processing function
processEntries();
