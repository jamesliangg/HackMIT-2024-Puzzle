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

// Read the input file
fs.readFile('../output2.txt', 'utf8', async (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    // Split data by entries using regex to handle various line endings
    const entries = data.trim().split(/\n(?=Encoded Word)/);

    // Process each entry
    for (const entry of entries) {
        // Extract parts from entry
        const lines = entry.trim().split('\n');
        const encodedWord = lines.find(line => line.startsWith('Encoded Word')).split(': ')[1].trim();
        const input = lines.find(line => line.startsWith('Input')).split(': ')[1].trim();
        const feedback = lines.find(line => line.startsWith('Feedback')).split(': ')[1].trim();

        try {
            // Call function to get formatted strokes array
            const formattedStrokesArray = await getFormattedStrokesArray(encodedWord);

            // Prepare output string
            const entryOutput = `Encoded Word: ${encodedWord}\nInput: ${input}\nFeedback: ${feedback}\nFormatted Strokes Array: ${formattedStrokesArray.join(', ')}\n\n`;

            // Append to output file
            fs.appendFileSync('output_with_strokes.txt', entryOutput, 'utf8');

            console.log(`Entry for ${encodedWord} appended to output file.`);
        } catch (error) {
            console.error(`Error processing entry for ${encodedWord}:`, error);
        }
    }

    console.log('All entries processed.');
});
