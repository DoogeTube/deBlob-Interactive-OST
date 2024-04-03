//Globalsd
let musicData = {}
fetch('./musicData.json')
    .then(response => response.json())
    .then(data => {
        musicData = data
        changeGame()
    })
    .catch(error => {
        console.error('Error fetching the JSON file:', error)
    })
const range = document.getElementById('variation')
const output = document.getElementById('variationValue')
const gameSelector = document.getElementById('gameSelector')
const moodSelector = document.getElementById('moodSelector')
const colorSelector = document.getElementById('colorSelector')
const presetSlider = document.getElementById('presetSlider')
const masterVolumeSlider = document.getElementById('masterVolumeSlider')
var selectedGame = gameSelector.value
var selectedMood = moodSelector.value
var selectedColor = colorSelector.value
var OpresetList = []
var fetchedStems = []
var fetchedSounds = []
let audioElements = []

randomColor()
function randomColor() {
    let randomNumber = Math.floor(Math.random() * 360)
    let bgVideo = document.getElementById('bgVideo')
    bgVideo.style.filter = `hue-rotate(${randomNumber}deg)`
}
//#region Game Selector
// Function to populate moodSelector based on selected game
function changeGame() {
    selectedGame = gameSelector.value
    let moods = musicData[selectedGame].moods

    // Clear current options
    moodSelector.innerHTML = '<option value="" disabled selected hidden>Select a Mood</option>'


    // Populate moodSelector with new options
    moods.forEach(mood => {
        const option = document.createElement('option')
        option.value = mood.name
        option.textContent = mood.name
        moodSelector.appendChild(option)
    })
}
//#endregion
function changeMood() {
    selectedMood = moodSelector.value
    killAudioElements()
    fetchStems()
    findPresets()
}
function killAudioElements() {
    if (audioElements.length !== 0) {
        audioElements.forEach((audio) => {
            audio.pause() // Pause the audio
            audio.src = '' // Clear the src attribute
            audio.load() // Load the audio to unload it
            audio = null // Nullify the audio object
        }
        )
    }
    audioElements = [] // Clear the audio elements array
}

//#region Fetch Stems
function fetchStems() {
    moodSelector.disabled = true
    gameSelector.disabled = true
    let OmoodList = musicData[selectedGame].moods
    let OselectedMood = OmoodList.find(mood => mood.name === selectedMood)
    let formattedMoodIndex = String(OmoodList.indexOf(OselectedMood) + 1).padStart(2, '0')
    let stemNames = OselectedMood.stems
    fetchedStems = []
    var stemPromise = new Promise((resolve, reject) => {
        stemNames.forEach((stemName) => {
            return fetch(`Audio/${selectedGame}/Stems/${formattedMoodIndex}. ${selectedMood}/${stemName}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok')
                    }
                    return response.blob()
                })
                .then(blob => {
                    fetchedStems.push({ blob, stemName })
                    console.log(`Fetched ${stemName} stem.`)
                    if (fetchedStems.length === stemNames.length) resolve()
                })
                .catch(error => {
                    console.error(`Error fetching ${stemName} stem:`, error.message)
                    throw error
                })
        })
    })
    stemPromise.then(() => {
        console.log("All stems fetched")
        fetchedStems.sort((a, b) => {
            return stemNames.indexOf(a.stemName) - stemNames.indexOf(b.stemName);
        });
        console.log(fetchedStems)
        createVolumeSliders()
        fetchSounds()
        moodSelector.disabled = false
        gameSelector.disabled = false
    })
}
function fetchSounds() {
    moodSelector.disabled = true
    gameSelector.disabled = true
    let OmoodList = musicData[selectedGame].moods
    let OselectedMood = OmoodList.find(mood => mood.name === selectedMood)
    let formattedMoodIndex = String(OmoodList.indexOf(OselectedMood) + 1).padStart(2, '0')
    let colorNames = Object.keys(OselectedMood.colors)

    console.log(`colorNames:` + colorNames)
    colorNames.forEach((color) => {
        let sounds = OselectedMood.colors[color]
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
                    console.log(`Fetched ${soundName} stem.`)
                    if (fetchedSounds.length === sounds.length) console.log(`fetched All Sounds!` + fetchedSounds)
                })
                .catch(error => {
                    console.error(`Error fetching ${soundName} stem:`, error.message)
                    throw error
                })
        })
    })
}
//#endregion
//#region Handle Audio Elements
function createVolumeSliders() {
    let container = document.getElementById('volumeSlidersContainer')

    // Clear previous sliders
    container.innerHTML = ''

    // Clear the audioElements array
    audioElements = []

    fetchedStems.forEach((item) => {
        let blob = item.blob
        let stemName = item.stemName

        let audio = new Audio()
        let objectUrl = URL.createObjectURL(blob)
        audio.src = objectUrl

        // Auto-play the audio
        audio.play()

        audioElements.push(audio) // Push the audio element to the array

        let sliderContainer = document.createElement('div')
        sliderContainer.className = 'sliderContainer'

        let label = document.createElement('label')
        label.textContent = `${stemName}:` // Use stem name as label

        let slider = document.createElement('input')
        slider.type = 'range'
        slider.min = 0
        slider.max = 1
        slider.step = 0.001
        slider.value = audio.volume
        slider.className = 'slider'

        slider.addEventListener('input', () => {
            audio.volume = slider.value
        })

        sliderContainer.appendChild(label)
        sliderContainer.appendChild(slider)
        container.appendChild(sliderContainer)

        // Clean up the object URL when no longer needed
        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(objectUrl)
        })
    })
}
//#endregion
//#region Color
function changeColor() {
    selectedColor = colorSelector.value
}
function paint() {
    let OmoodList = musicData[selectedGame].moods
    let OselectedMood = OmoodList.find(mood => mood.name === selectedMood)
    let availableSoundNames = []
    if (selectedColor == "rainbow") {
        let allSoundNames = OselectedMood.colors["red"].concat(OselectedMood.colors["yellow"]).concat(OselectedMood.colors["blue"]).concat(OselectedMood.colors["orange"]).concat(OselectedMood.colors["green"]).concat(OselectedMood.colors["purple"]).concat(OselectedMood.colors["brown"])
        availableSoundNames = allSoundNames
    } else { availableSoundNames = OselectedMood.colors[selectedColor] }
    let randomIndex = Math.floor(Math.random() * availableSoundNames.length)
    let randomSoundName = availableSoundNames[randomIndex]

    let objectUrl = URL.createObjectURL(fetchedSounds.find(sound => sound.soundName === randomSoundName).blob)
    console.log(randomIndex)
    console.log(objectUrl)

    let paintAudio = new Audio()
    paintAudio.src = objectUrl

    paintAudio.play()

    paintAudio.volume = 1.0
}
function findPresets() {
    let OmoodList = musicData[selectedGame].moods
    let OselectedMood = OmoodList.find(mood => mood.name === selectedMood)
    OpresetList = OselectedMood.variations
    presetSlider.max = OpresetList.length - 1
}
function changePreset() {
    let selectedPresetName = Object.keys(OpresetList[presetSlider.value])
    let label = findLableForControl(presetSlider)
    label.textContent = `preset: ${selectedPresetName}`
}
function findLableForControl(el) {
    var idVal = el.id;
    labels = document.getElementsByTagName('label');
    for (var i = 0; i < labels.length; i++) {
        if (labels[i].htmlFor == idVal)
            return labels[i];
    }
}
//#endregion
//#region Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    //Event listener for gameSelector change
    gameSelector.addEventListener('change', function () {
        changeGame()
    })
    // Event listener for moodSelector change
    moodSelector.addEventListener('change', function () {
        changeMood()
    })
    // Event listener for colorSelector change
    colorSelector.addEventListener('change', function () {
        changeColor()
    })
    presetSlider.addEventListener('input', function () {
        changePreset()
    })
    masterVolumeSlider.addeventListener('input', function () {

    })
})
//#endregion