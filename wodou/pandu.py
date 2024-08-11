# Initialize a list of sets to store possible characters for each position
positions = [set() for _ in range(1000)]  # Assuming max positions, adjust as needed

# Read the .txt file
with open('../output.txt', 'r', encoding='utf-8') as file:
    lines = file.readlines()

# Process each line
i = 0
while i < len(lines):
    if lines[i].startswith('Encoded Word:'):
        # Extract the encoded word line
        encoded_word_line = lines[i].strip()

        # Extract encoded word
        encoded_word = encoded_word_line.split(': ')[1]

        # Add characters to respective positions
        for pos, char in enumerate(encoded_word):
            positions[pos].add(char)

        # Move to the next set of lines
        i += 3  # Move to the next set of lines after current set (encoded word, input, feedback)
    else:
        i += 1  # Move to next line if not starting with 'Encoded Word:'

# Print or manipulate positions list as needed
for pos, characters in enumerate(positions):
    if characters:
        print(f"Position {pos + 1} can have characters: {list(characters)}")
