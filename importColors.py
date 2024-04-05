import os
import json

with open('musicData.json', 'r') as file:
        data = json.load(file)

game_names = [d for d in os.listdir("Audio") if os.path.isdir(os.path.join("Audio", d))]

for game in game_names:
    if game not in data:
        data[game] = {"moods": []}
        
    mood_name_list = []    
    mood_foldernames = [d for d in os.listdir(f"Audio/{game}/Stems") if os.path.isdir(os.path.join(f"Audio/{game}/Stems", d))]
    
    for mood in mood_foldernames:
        mood_name = mood.split(". ")[1]
        mood_name_list.append(mood_name)
        
    for mood_name in mood_name_list:
        mood_object = {"name": mood_name}
        if not any(mood['name'] == mood_name for mood in data[game]["moods"]):
            mood_object = {
                "name": mood_name,
                "stems": [],
                "variations": [],
                "colors": {}
            }
            data[game]["moods"].append(mood_object)
    
    for mood in data[game]["moods"]:
        formatted_mood_index = "{:02d}".format(data[game]['moods'].index(mood) + 1)
        
        colour_directory_path = f"Audio/{game}/Sounds/{formatted_mood_index}. {mood['name']}/Colour Sounds"
        stem_directory_path = f"Audio/{game}/Stems/{formatted_mood_index}. {mood['name']}"
        
        if os.path.exists(colour_directory_path):
            colour_directories = [d for d in os.listdir(colour_directory_path) if os.path.isdir(os.path.join(colour_directory_path, d))]
            
            mood["colors"] = {}
            for directory in colour_directories:
                color_files = [f for f in os.listdir(os.path.join(colour_directory_path, directory)) if f.endswith('.flac')]
                mood["colors"][directory.lower()] = color_files
                
        if os.path.exists(stem_directory_path):
            stem_files = [f for f in os.listdir(stem_directory_path) if f.endswith('.flac')]
            mood["stems"] = stem_files

# Save the updated JSON data
with open('musicData.json', 'w') as file:
    json.dump(data, file, indent=4)

print("Stems & Colors arrays updated successfully!")
