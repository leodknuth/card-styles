document.addEventListener('DOMContentLoaded', function() {
const textInput = document.getElementById('textInput');
const voiceSelect = document.getElementById('voiceSelect');
const generateBtn = document.getElementById('generateBtn');
const generateBtnText = document.getElementById('generateBtnText');
const generateBtnSpinner = document.getElementById('generateBtnSpinner');
const downloadBtn = document.getElementById('downloadBtn');
const audioContainer = document.getElementById('audioContainer');
const noAudioMessage = document.getElementById('noAudioMessage');
const downloadContainer = document.getElementById('downloadContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const statusMessage = document.getElementById('statusMessage');
const historyList = document.getElementById('historyList');
const charCount = document.getElementById('charCount');
const durationEstimate = document.getElementById('durationEstimate');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const currentVoiceContainer = document.getElementById('currentVoiceContainer');
const currentVoiceIcon = document.getElementById('currentVoiceIcon');
const currentVoiceName = document.getElementById('currentVoiceName');
const currentVoiceDesc = document.getElementById('currentVoiceDesc');
const MAX_HISTORY_ITEMS = 10; // Limit history to 10 items
const CHARS_PER_MINUTE = 150; // Estimated speaking speed
const voiceDescriptions = {
    'alloy': '平衡中性',
    'echo': '深沉有力',
    'fable': '温暖讲述',
    'onyx': '威严庄重',
    'nova': '友好专业',
    'shimmer': '轻快明亮',
    'coral': '温柔平静',
    'verse': '生动诗意',
    'ballad': '抒情柔和',
    'ash': '思考沉稳',
    'sage': '智慧老练',
    'amuch': '饱满自然',
    'aster': '清晰直接',
    'brook': '流畅舒适',
    'clover': '活泼年轻',
    'dan': '男声稳重',
    'elan': '优雅流利',
    'marilyn': '柔美圆润',
    'meadow': '平和自然'
};
const voiceColors = {
    'alloy': '#4F46E5',
    'echo': '#6366F1',
    'fable': '#8B5CF6',
    'onyx': '#333333',
    'nova': '#10B981',
    'shimmer': '#60A5FA',
    'coral': '#F87171',
    'verse': '#FBBF24',
    'ballad': '#A78BFA',
    'ash': '#4B5563',
    'sage': '#059669',
    'amuch': '#F59E0B',
    'aster': '#2563EB',
    'brook': '#3B82F6',
    'clover': '#EC4899',
    'dan': '#1F2937',
    'elan': '#7C3AED',
    'marilyn': '#DB2777',
    'meadow': '#34D399'
};
let audioBlob = null;
let history = [];
// 同步单选按钮和下拉选择
const voiceStyleOptions = document.querySelectorAll('.voice-style-option input[type="radio"]');
voiceStyleOptions.forEach(option => {
    option.addEventListener('change', function() {
        if(this.checked) {
            voiceSelect.value = this.value;
        }
    });
});
// Load history from localStorage
loadHistory();
// Update character count and duration estimate as user types
textInput.addEventListener('input', updateTextStats);
function updateTextStats() {
    const text = textInput.value.trim();
    const count = text.length;
    // Update character count
    charCount.textContent = `字符数: ${count}`;
    // Calculate and update duration estimate
    const durationMinutes = count / CHARS_PER_MINUTE;
    let durationText;
    if (durationMinutes < 1/60) {
        durationText = '不到1秒';
    } else if (durationMinutes < 1) {
        const seconds = Math.round(durationMinutes * 60);
        durationText = `${seconds} 秒`;
    } else {
        const minutes = Math.floor(durationMinutes);
        const seconds = Math.round((durationMinutes - minutes) * 60);
        if (seconds === 0) {
            durationText = `${minutes} 分钟`;
        } else {
            durationText = `${minutes} 分钟 ${seconds} 秒`;
        }
    }
    durationEstimate.textContent = `估计时长: ${durationText}`;
}
// Function to update the current voice display
function updateCurrentVoiceDisplay(voice) {
    const voiceName = voice.charAt(0).toUpperCase() + voice.slice(1);
    const voiceDesc = voiceDescriptions[voice] || '';
    const voiceColor = voiceColors[voice] || '#4F46E5';
    currentVoiceName.textContent = voiceName;
    currentVoiceDesc.textContent = voiceDesc;
    currentVoiceIcon.style.backgroundColor = voiceColor;
    currentVoiceContainer.style.display = 'flex';
}
// Function to generate audio from text
async function generateAudio() {
    const text = textInput.value.trim();
    const selectedVoiceElement = document.querySelector('.voice-style-option input[type="radio"]:checked');
    const voice = selectedVoiceElement ? selectedVoiceElement.value : voiceSelect.value;
    if (!text) {
        showStatus('请输入文本内容', 'error');
        return;
    }
    // Show loading indicators
    loadingIndicator.style.display = 'flex';
    generateBtnText.textContent = "正在生成...";
    generateBtnSpinner.style.display = 'inline-block';
    generateBtn.disabled = true;
    // Hide any previous status message
    statusMessage.style.display = 'none';
    try {
        // Create the URL with the encoded text and selected voice
        const url = `https://text.pollinations.ai/${encodeURIComponent(text)}?model=openai-audio&voice=${voice}&token=E0klKWnz6ynomvkL`;
        // Fetch the audio file
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        // Get the audio blob
        audioBlob = await response.blob();
        // Create a URL for the blob
        const audioUrl = URL.createObjectURL(audioBlob);
        // Create audio element
        if (document.getElementById('audioElement')) {
            document.getElementById('audioElement').remove();
        }
        const audioElement = document.createElement('audio');
        audioElement.id = 'audioElement';
        audioElement.controls = true;
        audioElement.src = audioUrl;
        audioElement.className = 'custom-audio';
        // Create custom player container
        const customPlayerDiv = document.createElement('div');
        customPlayerDiv.className = 'custom-audio-player';
        customPlayerDiv.appendChild(audioElement);
        // Replace no audio message with audio element
        if (noAudioMessage) {
            noAudioMessage.style.display = 'none';
        }
        audioContainer.innerHTML = ''; // 清除预览容器
        audioContainer.appendChild(customPlayerDiv);
        // Show download button
        downloadContainer.style.display = 'block';
        // Update current voice display
        updateCurrentVoiceDisplay(voice);
        // Get preview text (first 20 characters)
        const previewText = text.substring(0, 20) + (text.length > 20 ? '...' : '');
        // Add to history
        const timestamp = new Date();
        const historyItem = {
            id: Date.now(),
            timestamp: timestamp,
            voice: voice,
            text: text,
            previewText: previewText,
            blob: audioBlob
        };
        // Add new item to the beginning and limit to 10 items
        history.unshift(historyItem);
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        saveHistory();
        updateHistoryUI(historyItem.id); // Pass the new item ID to highlight it
        showStatus('语音生成成功！', 'success');
        // Play the audio automatically
        audioElement.play();
    } catch (error) {
        console.error('Error generating audio:', error);
        showStatus(`生成语音时出错: ${error.message}`, 'error');
    } finally {
        // Hide loading indicators
        loadingIndicator.style.display = 'none';
        generateBtnText.textContent = "生成语音";
        generateBtnSpinner.style.display = 'none';
        generateBtn.disabled = false;
    }
}
// Function to download the generated audio
function downloadAudio(blob, filename) {
    if (!blob) {
        showStatus('没有可下载的音频', 'error');
        return;
    }
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || `audio_${new Date().getTime()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
}
// Function to download history item
function downloadHistoryItem(id) {
    const item = history.find(h => h.id === id);
    if (item) {
        const sanitizedText = item.previewText.replace(/[^\w\u4e00-\u9fa5]/g, '');
        const fileName = `${item.voice}_${sanitizedText}.mp3`;
        downloadAudio(item.blob, fileName);
    }
}
// Function to update the history UI
function updateHistoryUI(newItemId) {
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">暂无历史记录</p>';
        return;
    }
    historyList.innerHTML = '';
    // Display only the 10 most recent items
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        if (item.id === newItemId) {
            historyItem.classList.add('new');
        }
        // Format timestamp
        const date = item.timestamp;
        const formattedDate = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        historyItem.innerHTML = `
            <div class="history-info">
                <div class="history-timestamp">${formattedDate}</div>
                <div class="history-voice">${item.voice}</div>
                <div class="history-text">${item.previewText}</div>
            </div>
            <button class="btn btn-text history-download" data-id="${item.id}">
                <i class="fas fa-download"></i> 下载
            </button>
        `;
        historyList.appendChild(historyItem);
    });
    // Add event listeners to download buttons
    document.querySelectorAll('.history-download').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            downloadHistoryItem(id);
        });
    });
}
// Function to clear all history
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？这个操作不可撤销。')) {
        history = [];
        localStorage.removeItem('audioGeneratorHistory');
        updateHistoryUI();
        showStatus('历史记录已清空', 'success');
    }
}
// Function to save history to localStorage
function saveHistory() {
    // We can't store blobs in localStorage, so we'll store other info and keep blobs in memory
    const historyData = history.map(item => ({
        id: item.id,
        timestamp: item.timestamp.toISOString(),
        voice: item.voice,
        text: item.text,
        previewText: item.previewText
    }));
    try {
        localStorage.setItem('audioGeneratorHistory', JSON.stringify(historyData));
    } catch (e) {
        console.error('Error saving history to localStorage:', e);
    }
}
// Function to load history from localStorage
function loadHistory() {
    try {
        const historyData = localStorage.getItem('audioGeneratorHistory');
        if (historyData) {
            const parsedHistory = JSON.parse(historyData);
            history = parsedHistory.map(item => ({
                ...item,
                timestamp: new Date(item.timestamp),
                blob: null // We don't store blobs in localStorage
            }));
            // Limit to MAX_HISTORY_ITEMS
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }
            updateHistoryUI();
        }
    } catch (e) {
        console.error('Error loading history from localStorage:', e);
    }
}
// Function to show status messages
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
    statusMessage.style.display = 'block';
    // Hide status after 5 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}
// Event listeners
generateBtn.addEventListener('click', generateAudio);
downloadBtn.addEventListener('click', () => {
    if (audioBlob) {
        const text = textInput.value.trim();
        const selectedVoiceElement = document.querySelector('.voice-style-option input[type="radio"]:checked');
        const voice = selectedVoiceElement ? selectedVoiceElement.value : voiceSelect.value;
        const previewText = text.substring(0, 20).replace(/[^\w\u4e00-\u9fa5]/g, '');
        const fileName = `${voice}_${previewText}.mp3`;
        downloadAudio(audioBlob, fileName);
    }
});
// Add keyboard shortcut (Ctrl+Enter) to generate audio
textInput.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateAudio();
    }
});
// Clear history button
clearHistoryBtn.addEventListener('click', clearHistory);
// Initialize text stats
updateTextStats();
});
