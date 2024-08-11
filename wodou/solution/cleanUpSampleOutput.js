import fs from 'fs';

function parseTextFileToCSV(filename) {
    // Read the entire file
    const data = fs.readFileSync(filename, 'utf8');

    // Split the file content by lines
    const lines = data.trim().split('\n');

    // Initialize an empty array to store CSV lines
    let csvLines = [];

    // Iterate through each line
    lines.forEach(line => {
        // Check if the line starts with "Encoded Word"
        if (line.startsWith('Encoded Word:')) {
            // Extract encoded word, input, and feedback
            const encodedWord = line.split(': ')[1].trim();

            // Move to the next line (assuming it contains "Input:")
            const inputLine = lines[lines.indexOf(line) + 1];
            const input = inputLine.split(': ')[1].trim();

            // Move to the next line (assuming it contains "Feedback:")
            const feedbackLine = lines[lines.indexOf(line) + 2];
            const feedbackParts = feedbackLine.split(': ')[1].trim().split(',');

            // Convert feedback parts to single string representation
            const feedbackString = feedbackParts.map(part => {
                if (part === 'correct') return 'c';
                else if (part === 'absent') return 'a';
                else if (part === 'present') return 'p';
                else return ''; // Handle unexpected feedback types
            }).join('');

            // Format into CSV line
            const csvLine = `${encodedWord},${input},${feedbackString}`;
            csvLines.push(csvLine);
        }
    });

    // Join all CSV lines with newline characters
    const csvContent = csvLines.join('\n');

    // Write to a CSV file
    const outputFile = 'cleanSample.csv';
    fs.writeFileSync(outputFile, csvContent);

    console.log(`CSV file '${outputFile}' has been created.`);
}

// Example usage:
const filename = './output2.txt';
parseTextFileToCSV(filename);
