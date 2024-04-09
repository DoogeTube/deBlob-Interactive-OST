document.addEventListener('DOMContentLoaded', setup)
//My one global that I'm allowed to have
let musicData = {}
fetch('./musicData.json')
    .then(response => response.json())
    .then(data => {
        musicData = data
    })
    .catch(error => {
        alert('musicData.json not found', error)
    })
async function setup() {
    var gameSelectorElement = document.getElementById('gameSelector')
    var moodSelectorElement = document.getElementById('moodSelector')
    var colorSelectorElement = document.getElementById('colorSelector')
    var presetSliderElement = document.getElementById('presetSlider')
    var masterVolumeSliderElement = document.getElementById('masterVolumeSlider')
    var playPauseElement = document.getElementById('playPause')
    gameSelectorElement.addEventListener('change', function () {
        let selectedGame = gameSelectorElement.value
        changeGame(selectedGame)
    })
    moodSelectorElement.addEventListener('change', function () {
        let selectedGame = gameSelectorElement.value
        let selectedMood = moodSelectorElement.value
        changeMood(selectedGame, selectedMood)
    })
    colorSelectorElement.addEventListener('change', function () {
        let selectedColor = colorSelectorElement.value
        changeColor(selectedColor)
    })
    presetSliderElement.addEventListener('input', function () {
        let selectedPreset = presetSliderElement.value
        changePreset(presetSliderElement, selectedPreset)
    })
    masterVolumeSliderElement.addEventListener('input', function () {
        masterGainNode.gain.setValueAtTime(masterVolumeSliderElement.value, stemAudioContext.currentTime)
    })
    playPauseElement.addEventListener('click', function () {
        togglePlayPauseAllTracks(playPauseElement)
    })
}
function disableControls(boolean) {
    let gameSelectorElement = document.getElementById('gameSelector')
    let moodSelectorElement = document.getElementById('moodSelector')
    let playPauseElement = document.getElementById('playPause')
    moodSelectorElement.disabled = boolean
    gameSelectorElement.disabled = boolean
    playPauseElement.disabled = boolean
}
var presetListObject = []
var fetchedSounds = []
let trackGainNodes = [];
let masterGainNode;
let stemAudioContext = new (window.AudioContext || window.webkitAudioContext)();
randomColor()
function randomColor() {
    let randomNumber = Math.floor(Math.random() * 360)
    let bgVideo = document.getElementById('bgVideo')
    bgVideo.style.filter = `hue-rotate(${randomNumber}deg)`
}
//#region Game Selector
// Function to populate the mood selector based on selected game
function changeGame(selectedGame) {
    let moodSelectorElement = document.getElementById('moodSelector')
    let moods = musicData[selectedGame].moods

    moodSelectorElement.innerHTML = '<option value="" disabled selected hidden>Select a Mood</option>'


    // Populate the mood selector with new options
    moods.forEach(mood => {
        const option = document.createElement('option')
        option.value = mood.name
        option.textContent = mood.name
        moodSelectorElement.appendChild(option)
    })
}
//#endregion
function changeMood(selectedGame, selectedMood) {
    fetchStems(selectedGame, selectedMood)
        .then(fetchedStems => {
            createAudioElements(fetchedStems);
        })
        .catch(error => {
            alert(`Couldn't create audio Elements \n${error}`);
            disableControls(false)
        });
    findPresets(selectedGame, selectedMood)
    fetchSounds(selectedGame, selectedMood)
}
//#region Fetch Stems
function fetchStems(selectedGame, selectedMood) {
    disableControls(true)
    let moodListObject = musicData[selectedGame].moods
    let selectedMoodObject = moodListObject.find(mood => mood.name === selectedMood)
    let formattedMoodIndex = String(moodListObject.indexOf(selectedMoodObject) + 1).padStart(2, '0')
    let stemNames = selectedMoodObject.stems
    let fetchedStems = []
    return new Promise((resolve, reject) => {
        let promises = stemNames.map(async (stemName) => {
            try {
                const response = await fetch(`Audio/${selectedGame}/Stems/${formattedMoodIndex}. ${selectedMood}/${stemName}`)
                if (!response.ok) {
                    throw new Error('Network response was not ok')
                }
                const blob = await response.blob()
                fetchedStems.push({ blob, stemName })
                if (fetchedStems.length === stemNames.length) {
                    fetchedStems.sort((a, b) => {
                        return stemNames.indexOf(a.stemName) - stemNames.indexOf(b.stemName)
                    })
                    resolve(fetchedStems)
                }
            } catch (error) {
                console.error(`Error fetching ${stemName} stem:`, error.message)
                reject(error)
            }
        })
        Promise.all(promises)
            .catch(() => {
                alert('Failed to fetch one or more stems from the server')
            })
    })
}
function fetchSounds(selectedGame, selectedMood) {
    disableControls(true)
    let moodListObject = musicData[selectedGame].moods
    let selectedMoodObject = moodListObject.find(mood => mood.name === selectedMood)
    let formattedMoodIndex = String(moodListObject.indexOf(selectedMoodObject) + 1).padStart(2, '0')
    let colorNames = Object.keys(selectedMoodObject.colors)

    var soundPromise = new Promise((resolve, reject) => {
        colorNames.forEach((color) => {
            let sounds = selectedMoodObject.colors[color]
            sounds.forEach((soundName) => {
                return fetch(`Audio/${selectedGame}/Sounds/${formattedMoodIndex}. ${selectedMood}/Colour Sounds/${color}/${soundName}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('NAUGHTY RESPONSE')
                        }
                        return response.blob()
                    })
                    .then(blob => {
                        fetchedSounds.push({ blob, soundName })
                        resolve()
                    })
                    .catch(error => {
                        console.error(`Error fetching ${soundName} stem:`, error.message)
                        reject()
                        throw error
                    })
            })
        })
    })
    soundPromise.then(() => {
        console.log(`all sounds fetched`)
    })
    soundPromise.catch(() => {
        alert('Failed to fetch one or more paint sounds from the server')
        disableControls(false)
    })
}

//#endregion
//#region Handle Audio Elements
function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = function () {
            const arrayBuffer = this.result;
            resolve(arrayBuffer);
        };

        fileReader.onerror = function () {
            reject(new Error("Error reading blob"));
        };

        fileReader.readAsArrayBuffer(blob);
    });
}
async function createAudioElements(fetchedStems) {
    stemAudioContext.close().then(async () => {
        stemAudioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 32000,
            latencyHint: "playback"
        });
        stemAudioContext.suspend();
        masterGainNode = stemAudioContext.createGain();
        masterGainNode.connect(stemAudioContext.destination);
        masterGainNode.gain.value = document.getElementById('masterVolumeSlider').value;
        trackGainNodes = [];

        for (let stemIndex = 0; stemIndex < fetchedStems.length; stemIndex++) {
            let stemBlob = fetchedStems[stemIndex].blob;

            try {
                let arrayBuffer = await blobToArrayBuffer(stemBlob);
                let audioBuffer = await stemAudioContext.decodeAudioData(arrayBuffer);

                let source = stemAudioContext.createBufferSource();
                let gainNode = stemAudioContext.createGain();
                trackGainNodes.push(gainNode);
                gainNode.gain.value = 1;

                source.buffer = audioBuffer;
                console.log(audioBuffer)
                source.loop = true;
                source.connect(gainNode);
                gainNode.connect(masterGainNode);
                source.start();

            } catch (error) {
                console.error("Error decoding audio data:", error);
            }
        }

        disableControls(false);
        createVolumeSliders(fetchedStems);
    })
}



function createVolumeSliders(fetchedStems) {
    let container = document.getElementById('trackSlidersContainer');
    container.innerHTML = '';

    fetchedStems.forEach((item, index) => {
        let stemName = item.stemName;
        let sliderContainer = document.createElement('div');
        sliderContainer.className = 'sliderContainer';

        let label = document.createElement('label');
        label.textContent = `${stemName}:`;

        let slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.001;
        slider.value = 1;
        slider.className = 'slider';
        slider.id = 'stemSlider' + index;

        slider.addEventListener('input', () => {
            changeAudioTrackVolume(index, slider.value);
        });

        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        container.appendChild(sliderContainer);
    });
}

function changeAudioTrackVolume(index, volume) {
    trackGainNodes[index].gain.setValueAtTime(volume, stemAudioContext.currentTime);
    let stemSliderElement = document.getElementById('stemSlider' + index);
    stemSliderElement.value = volume;
}
function lerpAudioTrackVolume(index, volume, lerpLength = 1) {
    trackGainNodes[index].gain.linearRampToValueAtTime(volume, (stemAudioContext.currentTime + lerpLength));
    let stemSliderElement = document.getElementById('stemSlider' + index);
    stemSliderElement.value = volume;
}
function togglePlayPauseAllTracks(playPauseElement) {
    switch (stemAudioContext.state) {
        case 'running':
            stemAudioContext.suspend()
            playPauseElement.innerHTML = "▶"
            break;
        case 'suspended':
            stemAudioContext.resume()
            playPauseElement.innerHTML = "⏸"
            break;
        default:
            alert(`pick a track before pressing play!`)
            break;
    }
}
//#endregion
//#region Color
function changeColor(selectedColor) {

}
function paint() {
    let selectedGame = document.getElementById('gameSelector').value
    let selectedMood = document.getElementById('moodSelector').value
    let selectedColor = document.getElementById('colorSelector').value
    let moodListObject = musicData[selectedGame].moods
    let selectedMoodObject = moodListObject.find(mood => mood.name === selectedMood)
    let availableSoundNames = []
    if (selectedColor == "rainbow") {
        let allSoundNames = selectedMoodObject.colors["red"].concat(selectedMoodObject.colors["yellow"]).concat(selectedMoodObject.colors["blue"]).concat(selectedMoodObject.colors["orange"]).concat(selectedMoodObject.colors["green"]).concat(selectedMoodObject.colors["purple"]).concat(selectedMoodObject.colors["brown"])
        availableSoundNames = allSoundNames
    } else { availableSoundNames = selectedMoodObject.colors[selectedColor] }
    let randomIndex = Math.floor(Math.random() * availableSoundNames.length)
    let randomSoundName = availableSoundNames[randomIndex]

    let objectUrl = URL.createObjectURL(fetchedSounds.find(sound => sound.soundName === randomSoundName).blob)
    console.log(randomIndex)
    console.log(objectUrl)

    let paintAudio = new Audio()
    paintAudio.src = objectUrl

    paintAudio.play()

    paintAudio.volume = document.getElementById('masterVolumeSlider').value
}
function findPresets(selectedGame, selectedMood) {
    presetListObject = []
    let presetSliderElement = document.getElementById('presetSlider')
    let presetSliderContainerElement = document.getElementById('presetSliderContainer')
    let moodListObject = musicData[selectedGame].moods
    let selectedMoodObject = moodListObject.find(mood => mood.name === selectedMood)
    presetListObject = selectedMoodObject.variations
    presetSliderElement.max = presetListObject.length - 1
    if (presetListObject.length == 0) {
        presetSliderContainerElement.style = "display:none"
    } else {
        changePreset(presetSliderElement, presetSliderElement.value)
        presetSliderContainerElement.style = "display:visible"
    }
}
function changePreset(presetSliderElement, selectedPreset) {
    let selectedPresetObject = presetListObject[selectedPreset]
    let label = findLabelForControl(presetSliderElement)
    label.textContent = `preset: ${Object.keys(selectedPresetObject)[0]}`
    applyPreset(selectedPresetObject)
}
function applyPreset(selectedPresetObject) { // duration in milliseconds
    let selectedPresetArray = Object.values(selectedPresetObject)[0];

    trackGainNodes.forEach((node, index) => {
        if (selectedPresetArray.includes(index)) {
            if (stemAudioContext.state === "suspended") {
                changeAudioTrackVolume(index, 1)
            } else {
                lerpAudioTrackVolume(index, 1)
            }
        } else if (stemAudioContext.state === "suspended") {
            changeAudioTrackVolume(index, 0)
        }
        else {
            lerpAudioTrackVolume(index, 0)
        }
    })
}
function findLabelForControl(el) {
    var idVal = el.id
    labels = document.getElementsByTagName('label')
    for (var i = 0; i < labels.length; i++) {
        if (labels[i].htmlFor == idVal)
            return labels[i]
    }
}