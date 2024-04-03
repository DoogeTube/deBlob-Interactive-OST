import os
import json

# Define the base directory paths
base_colour_directory_paths = {
    "deBlob": "audio/deblob/Sounds/{mood_index}. {mood_name}/Colour Sounds",
    "deBlob2": "Audio/DeBlob2/Sounds/{mood_index}. {mood_name}/Colour Sounds"
}

base_stem_directory_paths = {
    "deBlob": "audio/deblob/Stems/{mood_index}. {mood_name}",
    "deBlob2": "Audio/DeBlob2/Stems/{mood_index}. {mood_name}"
}

# Load the existing JSON data
with open('musicData.json', 'r') as file:
    data = json.load(file)

# Fetch mood names and indices dynamically from game objects
games = data["game"]

# Update "stems" and "colors" values
for game in games:
    for section, section_data in game.items():
        for mood_index, mood_data in enumerate(section_data["moods"]):
            mood_name = mood_data["name"]
            
            # Determine base directory paths based on the game
            base_colour_directory_path = base_colour_directory_paths.get(section, "")
            base_stem_directory_path = base_stem_directory_paths.get(section, "")
            
            # Format the mood index with a leading zero
            formatted_mood_index = "{:02d}".format(mood_index + 1)
            
            # Replace the directory paths based on the formatted mood index and mood name
            colour_directory_path = base_colour_directory_path.format(mood_index=formatted_mood_index, mood_name=mood_name)
            stem_directory_path = base_stem_directory_path.format(mood_index=formatted_mood_index, mood_name=mood_name)
            
            # List all directories in the Colour Sounds directory
            colour_directories = [d for d in os.listdir(colour_directory_path) if os.path.isdir(os.path.join(colour_directory_path, d))]
            
            # Populate the "colors" array
            mood_data["colors"] = {}
            for directory in colour_directories:
                color_files = [f for f in os.listdir(os.path.join(colour_directory_path, directory)) if f.endswith('.flac')]
                mood_data["colors"][directory.lower()] = color_files
            
            # List all files in the Stems directory
            stem_files = [f for f in os.listdir(stem_directory_path) if f.endswith('.flac')]
            
            # Populate the "stems" array
            mood_data["stems"] = stem_files

# Save the updated JSON data
with open('musicData.json', 'w') as file:
    json.dump(data, file, indent=4)

print("Stems & Colors arrays updated successfully!")
