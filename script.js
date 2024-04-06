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
        changeMasterVolume(getMasterVolume())
    })
}
function disableControls(boolean) {
    let gameSelectorElement = document.getElementById('gameSelector')
    let moodSelectorElement = document.getElementById('moodSelector')
    moodSelectorElement.disabled = boolean
    gameSelectorElement.disabled = boolean
}
//global variables to remove
var presetListObject = []
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
        .then(fetchedStems => {
            createAudioElements(fetchedStems);
        })
        .catch(error => {
            alert("Error fetching stems:", error);
            disableControls(false)
        });
    console.log(fetchStems(selectedGame, selectedMood))
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
    let moodListObject = musicData[selectedGame].moods
    let selectedMoodObject = moodListObject.find(mood => mood.name === selectedMood)
    let formattedMoodIndex = String(moodListObject.indexOf(selectedMoodObject) + 1).padStart(2, '0')
    let stemNames = selectedMoodObject.stems
    let fetchedStems = []
    return new Promise((resolve, reject) => {
        let promises = stemNames.map((stemName) => {
            return fetch(`Audio/${selectedGame}/Stems/${formattedMoodIndex}. ${selectedMood}/${stemName}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok')
                    }
                    return response.blob()
                })
                .then(blob => {
                    fetchedStems.push({ blob, stemName })
                    if (fetchedStems.length === stemNames.length) {
                        fetchedStems.sort((a, b) => {
                            return stemNames.indexOf(a.stemName) - stemNames.indexOf(b.stemName)
                        })
                        resolve(fetchedStems)
                    }
                })
                .catch(error => {
                    console.error(`Error fetching ${stemName} stem:`, error.message)
                    reject(error)
                })
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
function createAudioElements(fetchedStems) {
    audioTrackList = []
    let numReady = 0
    fetchedStems.forEach((item, index) => {
        let blob = item.blob
        audioTrackVolumeList[index] = 1.0

        let audioTrack = new Audio()
        audioTrackList.push(audioTrack)

        audioTrack.addEventListener("canplaythrough", () => {
            numReady++
        })
        let objectUrl = URL.createObjectURL(blob)
        audioTrack.src = objectUrl
        syncLoop(audioTrack)
    })
    let checkIfReady = setInterval(() => {
        if (numReady == audioTrackList.length) {
            audioTrackList.forEach((audioTrack) => {
                audioTrack.play()
                audioTrack.volume = getMasterVolume();
                disableControls(false)
            })
            clearInterval(checkIfReady)
            createVolumeSliders(fetchedStems)
        }
    }, 10)
}

function createVolumeSliders(fetchedStems) {
    let container = document.getElementById('volumeSlidersContainer')
    container.innerHTML = ''
    fetchedStems.forEach((item, index) => {
        let stemName = item.stemName
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
        slider.id = 'stemSlider' + index

        slider.addEventListener('input', () => {
            changeAudioTrackVolume(index, slider.value)
        })

        sliderContainer.appendChild(label)
        sliderContainer.appendChild(slider)
        container.appendChild(sliderContainer)
    })
}
function syncLoop(audioTrack) {
    audioTrack.addEventListener('ended', () => {
        audioTrackList.forEach((audioTrack) => {
            audioTrack.load()
            audioTrack.play()
        })
    })
}
function changeAudioTrackVolume(trackIndex, trackVolume) {
    let masterVolume = getMasterVolume()
    trackSliderElement = document.getElementById('stemSlider' + trackIndex)
    trackSliderElement.value = trackVolume
    audioTrackVolumeList[trackIndex] = trackVolume
    audioTrackList[trackIndex].volume = trackVolume * masterVolume
}
function changeMasterVolume(masterVolume) {
    audioTrackList.forEach((audio, index) => {
        audio.volume = parseFloat((audioTrackVolumeList[index] * 1.0) * (masterVolume))
    })
}
function getMasterVolume() {
    let masterVolume = document.getElementById('masterVolumeSlider').value
    return masterVolume / 100
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

    paintAudio.volume = getMasterVolume()
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

    function lerpVolume(index, targetVolume, duration = 2000) {
        let startVolume = audioTrackVolumeList[index]
        let startTime = Date.now()

        function lerp(start, end, t) {
            return start + (end - start) * t
        }

        function updateVolume() {
            let currentTime = Date.now() - startTime
            let t = currentTime / duration

            if (t <= 1) {
                let newVolume = lerp(startVolume, targetVolume, t)
                changeAudioTrackVolume(index, newVolume)
                requestAnimationFrame(updateVolume)
            } else {
                changeAudioTrackVolume(index, targetVolume)
            }
        }
        updateVolume()
    }
    audioTrackList.forEach((audio, index) => {
        if (selectedPresetArray.includes(index)) {
            lerpVolume(index, 1)
        } else {
            lerpVolume(index, 0)
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
//#endregion
