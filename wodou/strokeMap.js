import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';


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

// Function to process entries and append to CSV
async function processEntries(filename) {
    const lines = fs.readFileSync(filename, 'utf8').split('\n');
    let index = 0;

    while (index < lines.length) {
        if (lines[index].startsWith('Encoded Word:')) {
            const encodedWord = lines[index].split(': ')[1].trim();
            const inputLine = lines[index + 1].split(': ')[1].trim();
            const feedbackLine = lines[index + 2].split(': ')[1].trim().split(',');

            // Get strokes for the encoded word
            const strokes = await getFormattedStrokesArray(encodedWord);

            // Determine correct positions and write to CSV
            for (let i = 0; i < feedbackLine.length; i++) {
                if (feedbackLine[i] === 'correct') {
                    const entry = `${strokes[i]},${i + 1},${inputLine[i]}\n`;
                    fs.appendFileSync('output.csv', entry);
                }
            }

            index += 3; // Move to the next set of entries
        }

        index++;
    }
}

// Clear existing output.csv file if it exists
fs.writeFileSync('stroke_map.csv', 'strokes,position,letter\n');

// Replace 'output2.txt' with your actual filename containing the entries
await processEntries('../output2.txt');
