document.addEventListener('DOMContentLoaded', function() {
            // --- 全局变量 ---
            let writer = null; // 保存当前的 HanziWriter 实例
            let characters = []; // 保存输入框里的所有字符
            let currentCharacterIndex = 0; // 当前显示的是第几个字符
            
            const targetDiv = document.getElementById('character-target'); // 获取目标容器

            // --- 核心函数：创建/更新汉字 ---
            function renderCharacter(character) {
                // 1. (核心修正) 清空容器：在创建新的 writer 之前，直接、彻底地清空目标div
                targetDiv.innerHTML = '';

                // 2. 创建新的 HanziWriter 实例
                writer = HanziWriter.create(targetDiv, character, {
                    width: 250,
                    height: 250,
                    padding: 20,
                    showOutline: true,
                    strokeAnimationSpeed: 1,
                    delayBetweenStrokes: 200,
                    strokeColor: '#333',
                    highlightColor: '#4285F4',
                    outlineColor: '#DDD',
                });

                // 3. (体验优化) 让输入框也同步显示当前字符
                document.getElementById('char-input').value = character;
            }

            // --- 事件监听 ---

            // "查询" 按钮：从输入框加载所有字符，并显示第一个
            document.getElementById('lookup-btn').addEventListener('click', function() {
                const inputText = document.getElementById('char-input').value.trim();
                characters = inputText ? inputText.split('') : [];
                currentCharacterIndex = 0;
                
                if (characters.length > 0) {
                    renderCharacter(characters[currentCharacterIndex]);
                } else {
                    // 如果输入框为空，则清空画布
                    targetDiv.innerHTML = '';
                    writer = null;
                }
            });

            // "下一个" 按钮：显示字符列表中的下一个
            document.getElementById('next-char-btn').addEventListener('click', function() {
                if (characters.length > 1) { // 只有多于一个字时才有效
                    currentCharacterIndex = (currentCharacterIndex + 1) % characters.length;
                    renderCharacter(characters[currentCharacterIndex]);
                }
            });

            // 控制按钮现在可以正确工作了，因为 writer 变量总是指向当前唯一存在的实例
            document.getElementById('animate-btn').addEventListener('click', () => writer && writer.animateCharacter());
            document.getElementById('quiz-btn').addEventListener('click', () => writer && writer.quiz());

            let isOutlineShown = true;
            document.getElementById('hide-btn').addEventListener('click', function() {
                if (!writer) return;
                isOutlineShown = !isOutlineShown;
                if (isOutlineShown) {
                    writer.showOutline();
                } else {
                    writer.hideOutline();
                }
            });

            document.getElementById('reset-btn').addEventListener('click', () => {
                // 重置当前字符
                if (writer) {
                    renderCharacter(writer.character);
                }
            });

            // 页面首次加载时，自动查询输入框里的 "你好"
            document.getElementById('lookup-btn').click();
            // 并显示第一个字 "你"
            // 为了和您的截图一致，我将初始值改为“你”，然后点击下一个
            document.getElementById('char-input').value = "你好";
            document.getElementById('lookup-btn').click();

        });
