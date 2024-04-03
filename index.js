//Globals
const range = document.getElementById('variation');
const output = document.getElementById('variationValue');
const gameSelector = document.getElementById('gameSelector');
const moodSelector = document.getElementById('moodSelector');
const colorSelector = document.getElementById('colorSelector')
var selectedGame = gameSelector.value;
var selectedMood = moodSelector.value;
var selectedColor = colorSelector.value;
var fetchedStems = [];
let audioElements = [];
// Object to hold the tracks for each game
const tracks = {
    deBlob: ['Blissful', 'Funky', 'Unstoppable', 'Righteous', 'Euphoric', 'Smooth', 'Fearless', 'Defiant', 'Brazen', 'Revolutionary', 'Victorious', 'Energetic'],
    deBlob2: ['Tranquil', 'Intrepid', 'Irrepressible', 'Steppin\'', 'Empowered', 'Gonzo', 'Fizzy', 'Chilled', 'Incendiary', 'Spirited', 'Playful', 'Riotous', 'Pan-Galactic']
};
//#region Game Selector
// Function to populate moodSelector based on selected game
function changeGame() {
    selectedGame = gameSelector.value;
    gameTracks = tracks[selectedGame];

    // Clear current options
    moodSelector.innerHTML = '';

    // Populate moodSelector with new options
    gameTracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track;
        option.textContent = track;
        moodSelector.appendChild(option);
    });
    changeMood();
}
// Initial population of moodSelector based on default game
changeGame();
//#endregion
function changeMood() {
    selectedMood = moodSelector.value;
    killAudioElements()
    fetchStems();
}
function killAudioElements() {
    audioElements.forEach((audio) => {
        audio.pause(); // Pause the audio
        audio.src = ''; // Clear the src attribute
        audio.load(); // Load the audio to unload it
        audio = null; // Nullify the audio object
    });
    audioElements = []; // Clear the audio elements array
};

//#region Fetch Stems
function fetchStems() {
    moodSelector.disabled = true
    gameSelector.disabled = true
    fetchedStems = [];
    let stemTypes = [];

    const games = {
        'deBlob': ['inked', 'piano', 'mezzo', 'forte'],
        'deBlob2': ['clear', 'inked', 'low', 'medium', 'high']
    };

    if (games[selectedGame]) {
        stemTypes = games[selectedGame];
    } else {
        throw new Error(`Invalid selectedGame: ${selectedGame}`);
    }

    let moodIndex = tracks[selectedGame].indexOf(selectedMood);
    let formattedMoodIndex = String(moodIndex + 1).padStart(2, '0');

    function fetchStem(stemType, stemIndex = 1) {
        let stemTypeKey = (selectedGame === 'deBlob') ? `${selectedMood.toLowerCase()}-${stemType}-${stemIndex}` : `${stemType} ${stemIndex}`;
    
        return fetch(`Audio/${selectedGame}/Stems/${formattedMoodIndex}. ${selectedMood}/${stemTypeKey}.flac`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                fetchedStems.push({ blob, stemTypeKey });
                console.log(`Fetched ${stemTypeKey} stem.`);
            })
            .catch(error => {
                console.error(`Error fetching ${stemTypeKey} stem:`, error.message);
                throw error;
            });
    }

    function fetchStemTypesSequentially() {
        return new Promise(async (resolve, reject) => {
            for (let stemType of stemTypes) {
                for (let stemIndex = 1; ; stemIndex++) {
                    try {
                        await fetchStem(stemType, stemIndex);
                    } catch (error) {
                        break;
                    }
                }
            }
            resolve();
        });
    }

    fetchStemTypesSequentially()
        .then(() => {
            console.log("All stems fetched");
            createVolumeSliders();
            moodSelector.disabled = false;
            gameSelector.disabled = false;
        })
        .catch(error => {
            console.error("Error fetching stems:", error);
        });
}
//#endregion
//#region Handle Audio Elements
function createVolumeSliders() {
    let container = document.getElementById('volumeSlidersContainer'); // Assuming you have a container element with id 'volumeSlidersContainer'

    // Clear previous sliders
    container.innerHTML = '';

    // Clear the audioElements array
    audioElements = [];

    fetchedStems.forEach((item) => {
        let blob = item.blob;
        let stemTypeKey = item.stemTypeKey;

        let audio = new Audio();
        let objectUrl = URL.createObjectURL(blob);
        audio.src = objectUrl;

        // Auto-play the audio
        audio.play();

        audioElements.push(audio); // Push the audio element to the array

        let sliderContainer = document.createElement('div');
        sliderContainer.className = 'sliderContainer';

        let label = document.createElement('label');
        label.textContent = `${stemTypeKey}:`; // Use stem name as label

        let slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;
        slider.value = audio.volume;

        slider.addEventListener('input', () => {
            audio.volume = slider.value;
        });

        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        container.appendChild(sliderContainer);

        // Clean up the object URL when no longer needed
        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(objectUrl);
        });
    });
}
//#endregion
//#region Color
function changeColor(){
    selectedColor = colorSelector.value
}
function paint(){
    
}
//#endregion
//#region Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    //Event listener for gameSelector change
    gameSelector.addEventListener('change', function () {
        changeGame();
    });
    // Event listener for moodSelector change
    moodSelector.addEventListener('change', function () {
        changeMood();
    });
    // Event listener for colorSelector change
    colorSelector.addEventListener('change', function () {
        changeColor();
    });
})
//#endregion