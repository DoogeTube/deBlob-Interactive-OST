document.addEventListener('DOMContentLoaded', setup)
//My one global that I'm allowed to have
let musicData = {}
fetch('./musicData.json')
    .then(response => response.json())
    .then(data => {
        musicData = data
    })
    .catch(error => {
        console.error('musicData.json not found', error)
    })
async function setup() {
    var gameSelectorElement = document.getElementById('gameSelector')
    var moodSelectorElement = document.getElementById('moodSelector')
    var colorSelectorElement = document.getElementById('colorSelector')
    var presetSliderElement = document.getElementById('presetSlider')
    var masterVolumeSliderElement = document.getElementById('masterVolumeSlider')
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
        changeVolume(masterVolumeSliderElement.value)
    })
}
function disableControls(boolean) {
    let gameSelectorElement = document.getElementById('gameSelector')
    let moodSelectorElement = document.getElementById('moodSelector')
    moodSelectorElement.disabled = boolean
    gameSelectorElement.disabled = boolean
}
//global variables to remove
var OpresetList = []
var fetchedStems = []
var fetchedSounds = []
let audioTrackList = []
let audioTrackVolumeList = []
/////////////////////////////
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
    killaudioTrackList()
    fetchStems(selectedGame, selectedMood)
    findPresets(selectedGame, selectedMood)
    fetchSounds(selectedGame, selectedMood)
}
function killaudioTrackList() {
    if (audioTrackList.length !== 0) {
        audioTrackList.forEach((audioTrack) => {
            audioTrack.pause() // Pause the audio
            audioTrack.src = '' // Clear the src attribute
            audioTrack.load() // Load the audio to unload it
            audioTrack = null // Nullify the audio object
        }
        )
    }
    audioTrackList = [] // Clear the audio elements array

}

//#region Fetch Stems
function fetchStems(selectedGame, selectedMood) {
    disableControls(true)
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
        disableControls(false)
    })
}
function fetchSounds(selectedGame, selectedMood) {
    disableControls(true)
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

    // Clear the audioTrackList array
    audioTrackList = []

    fetchedStems.forEach((item, index) => {
        let blob = item.blob
        let stemName = item.stemName
        audioTrackVolumeList[index] = 1.0

        let audioTrack = new Audio()
        let objectUrl = URL.createObjectURL(blob)
        audioTrack.src = objectUrl

        // Auto-play the audio
        audioTrack.play()
        audioTrack.volume = 1.0

        audioTrackList.push(audioTrack) // Push the audio element to the array

        let sliderContainer = document.createElement('div')
        sliderContainer.className = 'sliderContainer'

        let label = document.createElement('label')
        label.textContent = `${stemName}:` // Use stem name as label

        let slider = document.createElement('input')
        slider.type = 'range'
        slider.min = 0
        slider.max = 1
        slider.step = 0.001
        slider.value = 1
        slider.className = 'slider'

        slider.addEventListener('input', () => {
            audioTrackVolumeList[index] = slider.value
            changeVolume(getMasterVolume())
        })

        sliderContainer.appendChild(label)
        sliderContainer.appendChild(slider)
        container.appendChild(sliderContainer)

        // Clean up the object URL when no longer needed
        audioTrack.addEventListener('ended', () => {
            URL.revokeObjectURL(objectUrl)
        })
    })
}
function changeVolume(masterVolume) {
    audioTrackList.forEach((audio, index) => {
        audio.volume = parseFloat((audioTrackVolumeList[index] * 1.0) * (masterVolume / 100.0))
        console.log(parseFloat((audioTrackVolumeList[index] * 1.0) * (masterVolume / 100.0)))
    })
}
function getMasterVolume() {
    let masterVolume = document.getElementById('masterVolumeSlider').value
    return masterVolume
}
//#endregion
//#region Color
function changeColor(selectedColor) {

}
function paint() {
    let selectedGame = document.getElementById('gameSelector').value
    let selectedMood = document.getElementById('moodSelector').value
    let selectedColor = document.getElementById('colorSelector').value
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
function findPresets(selectedGame, selectedMood) {
    OpresetList = []
    let presetSliderElement = document.getElementById('presetSlider')
    let OmoodList = musicData[selectedGame].moods
    let OselectedMood = OmoodList.find(mood => mood.name === selectedMood)
    OpresetList = OselectedMood.variations
    presetSliderElement.max = OpresetList.length - 1
    changePreset(presetSliderElement, presetSliderElement.value)
}
function changePreset(presetSliderElement, selectedPreset) {
    let selectedPresetName = Object.keys(OpresetList[selectedPreset])
    let label = findLabelForControl(presetSliderElement)
    label.textContent = `preset: ${selectedPresetName}`
}
function findLabelForControl(el) {
    var idVal = el.id;
    labels = document.getElementsByTagName('label');
    for (var i = 0; i < labels.length; i++) {
        if (labels[i].htmlFor == idVal)
            return labels[i];
    }
}
//#endregion
