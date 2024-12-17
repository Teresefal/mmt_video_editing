const audio = document.getElementById('audio');
const playPauseButton = document.getElementById('play-pause');
const seekBar = document.getElementById('seek-bar');
const volumeControl = document.getElementById('volume-control');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const imageDisplay = document.getElementById('image-display');
const trackTitle = document.getElementById('track-title');

const visualizer = document.getElementById('visualizer');
const canvasContext = visualizer.getContext('2d');

const tracks = [
    { title: "Aegir", src: "audio/Aegir.mp3", cover: "images/Aegir.png" },
    { title: "Memory", src: "audio/Memory.mp3", cover: "images/Memory.png" },
];
let currentTrackIndex = 0;

function loadTrack(index) {
    const track = tracks[index];
    audio.src = track.src;
    trackTitle.textContent = track.title;
    imageDisplay.src = track.cover;
    audio.load();
    audio.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audio.duration);
        seekBar.max = Math.floor(audio.duration);
    });
}

function previousTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrackIndex);
    togglePlayPause(true);
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(currentTrackIndex);
    togglePlayPause(true);
}

function togglePlayPause(playImmediately = false) {
    if (playImmediately || audio.paused) {
        audio.play();
        playPauseButton.innerHTML = '&#10074;&#10074;';
    } else {
        audio.pause();
        playPauseButton.innerHTML = '&#9658;';
    }
}

audio.addEventListener('timeupdate', () => {
    seekBar.value = Math.floor(audio.currentTime);
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
});

seekBar.addEventListener('input', () => {
    audio.currentTime = seekBar.value;
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Обработчик изменения громкости
volumeControl.addEventListener('input', () => {
    audio.volume = volumeControl.value;
});

// Инициализация
loadTrack(currentTrackIndex);

// AudioContext и Analyser
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;

const audioSource = audioContext.createMediaElementSource(audio);
audioSource.connect(analyser);
analyser.connect(audioContext.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);

// Настройки для визуализатора
const gridSize = 15;  // Размер квадрата
let columns = Math.floor(visualizer.width / gridSize);
let rows = Math.floor(visualizer.height / gridSize);

visualizer.width = window.innerWidth;
visualizer.height = window.innerHeight;

// Массив цветов для каждого квадрата (все начальные цвета — rgb(28, 28, 28))
let squareColors = Array(rows * columns).fill('rgb(28, 28, 28)');

// Генерация случайного индекса частоты для каждого квадрата
function generateRandomFrequencyIndex() {
    return Math.floor(Math.random() * (analyser.frequencyBinCount / 2)); // Ограничиваем диапазон
}

// Инициализация массива индексов частот для квадратов
let squareFrequencyIndexes = [];
function initializeFrequencyIndexes() {
    squareFrequencyIndexes = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            squareFrequencyIndexes.push(generateRandomFrequencyIndex());
        }
    }
}

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
    visualizer.width = window.innerWidth;
    visualizer.height = window.innerHeight;
    columns = Math.floor(visualizer.width / gridSize);
    rows = Math.floor(visualizer.height / gridSize);
    squareColors = Array(rows * columns).fill('rgb(28, 28, 28)');
    initializeFrequencyIndexes();
});

// Инициализация визуализатора при загрузке страницы
window.dispatchEvent(new Event('resize'));

function drawVisualizer() {
    analyser.getByteFrequencyData(dataArray);

    canvasContext.clearRect(0, 0, visualizer.width, visualizer.height);

    // Отображаем сетку квадратов, которые заполняют весь экран
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const squareIndex = row * columns + col;
            const frequencyIndex = squareFrequencyIndexes[squareIndex];
            const frequencyValue = dataArray[frequencyIndex];

            const x = col * gridSize;
            const y = row * gridSize;

            // Начальный цвет квадрата — темно-серый (rgb(28, 28, 28))
            const squareColor = squareColors[squareIndex];

            // Рассчитываем яркость для квадрата на основе частоты
            const brightness = frequencyValue / 255;

            // Применяем яркость, оставляя исходный цвет
            const [r, g, b] = squareColor.match(/\d+/g).map(Number);  // Извлекаем RGB компоненты
            canvasContext.fillStyle = `rgb(${r * brightness}, ${g * brightness}, ${b * brightness})`;
            canvasContext.fillRect(x, y, gridSize, gridSize);
        }
    }

    requestAnimationFrame(drawVisualizer);
}

audio.onplay = () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    drawVisualizer();
};

// Инициализация
initializeFrequencyIndexes();
