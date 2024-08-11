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

// Example usage
const inputString = '邡厾讲证扤灳圴证阿证论作丽仳励汛芳扰夛证亨伒刎屰兑宇伖序巟污';
getFormattedStrokesArray(inputString).then(result => {
    console.log(result); // Output: [ '76676', '76666', '66666', '76677', '66766', '67676' ]
});

