class FishingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.depthElement = document.getElementById('depth');
        this.fishCountElement = document.getElementById('fishCount');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.diveBtn = document.getElementById('diveBtn');
        
        // 遊戲狀態
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.fishCount = 0;
        this.maxDepth = 500;
        this.currentDepth = 0;
        this.targetDepth = 0;
        this.divingSpeed = 2;
        this.risingSpeed = 1.5;
        this.gameTime = 0;
        this.maxGameTime = 30000; // 30秒遊戲時間
        
        // 釣魚線
        this.fishingLine = {
            x: this.canvas.width / 2,
            y: 50,
            length: 50,
            maxLength: 550,
            hookSize: 8
        };
        
        // 魚類配置
        this.fishTypes = [
            { name: '小魚', color: '#FF6B6B', points: 10, minDepth: 0, maxDepth: 50, size: 15, speed: 1 },
            { name: '熱帶魚', color: '#4ECDC4', points: 25, minDepth: 50, maxDepth: 150, size: 20, speed: 1.2 },
            { name: '金槍魚', color: '#45B7D1', points: 50, minDepth: 100, maxDepth: 300, size: 25, speed: 1.5 },
            { name: '鯊魚', color: '#96CEB4', points: 100, minDepth: 200, maxDepth: 400, size: 30, speed: 2 },
            { name: '深海魚', color: '#FFEAA7', points: 200, minDepth: 300, maxDepth: 500, size: 35, speed: 1.8 }
        ];
        
        // 危險物品配置
        this.dangerousItems = [
            { name: '水雷', color: '#FF4757', minDepth: 100, maxDepth: 400, size: 20, speed: 0.5, type: 'mine', damage: 50 },
            { name: '廢棄漁網', color: '#747D8C', minDepth: 50, maxDepth: 300, size: 25, speed: 0.3, type: 'net', damage: 30 },
            { name: '有毒水母', color: '#FFA502', minDepth: 0, maxDepth: 200, size: 18, speed: 0.8, type: 'jellyfish', damage: 20 },
            { name: '沉船碎片', color: '#2F3542', minDepth: 200, maxDepth: 500, size: 22, speed: 0.2, type: 'debris', damage: 40 }
        ];
        
        this.fishes = [];
        this.dangerousItemsList = [];
        this.caughtFish = [];
        this.maxFishCount = 15; // 限制魚的數量
        
        // 控制
        this.keys = {};
        this.isDiving = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.generateFish();
        this.generateDangerousItems();
        this.gameLoop();
    }
    
    bindEvents() {
        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.isDiving = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') {
                this.isDiving = false;
            }
        });
        
        // 手機按鈕事件
        if (this.diveBtn) {
            // 觸摸開始
            this.diveBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.isDiving = true;
                this.diveBtn.classList.add('pressed');
                this.diveBtn.textContent = '🎣 下潛中...';
            });
            
            // 觸摸結束
            this.diveBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.isDiving = false;
                this.diveBtn.classList.remove('pressed');
                this.diveBtn.textContent = '🎣 按住下潛';
            });
            
            // 滑鼠按下（桌面測試用）
            this.diveBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.isDiving = true;
                this.diveBtn.classList.add('pressed');
                this.diveBtn.textContent = '🎣 下潛中...';
            });
            
            // 滑鼠放開
            this.diveBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.isDiving = false;
                this.diveBtn.classList.remove('pressed');
                this.diveBtn.textContent = '🎣 按住下潛';
            });
            
            // 滑鼠離開按鈕
            this.diveBtn.addEventListener('mouseleave', (e) => {
                e.preventDefault();
                this.isDiving = false;
                this.diveBtn.classList.remove('pressed');
                this.diveBtn.textContent = '🎣 按住下潛';
            });
        }
        
        // 按鈕事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameOver = false;
        this.gameTime = 0;
        this.startBtn.style.display = 'none';
        this.restartBtn.style.display = 'inline-block';
        
        // 顯示手機控制按鈕
        if (this.diveBtn) {
            this.diveBtn.style.display = 'inline-block';
        }
    }
    
    restartGame() {
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.fishCount = 0;
        this.currentDepth = 0;
        this.targetDepth = 0;
        this.gameTime = 0;
        this.fishes = [];
        this.dangerousItemsList = [];
        this.caughtFish = [];
        this.generateFish();
        this.generateDangerousItems();
        this.updateUI();
        this.startBtn.style.display = 'inline-block';
        this.restartBtn.style.display = 'none';
        
        // 隱藏手機控制按鈕
        if (this.diveBtn) {
            this.diveBtn.style.display = 'none';
        }
    }
    
    generateFish() {
        this.fishes = [];
        for (let i = 0; i < this.maxFishCount; i++) {
            const fishType = this.fishTypes[Math.floor(Math.random() * this.fishTypes.length)];
            const depth = Math.random() * (fishType.maxDepth - fishType.minDepth) + fishType.minDepth;
            const x = Math.random() * (this.canvas.width - 100) + 50;
            
            this.fishes.push({
                x: x,
                y: depth + 50, // 轉換深度為畫布座標
                type: fishType,
                direction: Math.random() > 0.5 ? 1 : -1,
                speed: fishType.speed * (0.5 + Math.random() * 0.5)
            });
        }
    }
    
    generateDangerousItems() {
        this.dangerousItemsList = [];
        
        // 根據深度分層生成危險物品，越深越多
        const depthLayers = [
            { min: 0, max: 100, count: 2 },    // 0-100m: 2個
            { min: 100, max: 250, count: 4 },  // 100-250m: 4個
            { min: 250, max: 400, count: 6 },  // 250-400m: 6個
            { min: 400, max: 500, count: 8 }   // 400-500m: 8個
        ];
        
        depthLayers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                // 選擇適合該深度的危險物品
                const suitableItems = this.dangerousItems.filter(item => 
                    item.minDepth <= layer.max && item.maxDepth >= layer.min
                );
                
                if (suitableItems.length > 0) {
                    const itemType = suitableItems[Math.floor(Math.random() * suitableItems.length)];
                    const depth = Math.random() * (layer.max - layer.min) + layer.min;
                    const x = Math.random() * (this.canvas.width - 100) + 50;
                    
                    this.dangerousItemsList.push({
                        x: x,
                        y: depth + 50,
                        type: itemType,
                        direction: Math.random() > 0.5 ? 1 : -1,
                        speed: itemType.speed * (0.5 + Math.random() * 0.5)
                    });
                }
            }
        });
    }
    
    update() {
        if (!this.gameRunning || this.gameOver) return;
        
        // 更新遊戲時間
        this.gameTime += 16; // 假設60FPS
        
        // 檢查遊戲時間
        if (this.gameTime >= this.maxGameTime) {
            this.endGame();
            return;
        }
        
        // 更新深度
        if (this.isDiving && this.currentDepth < this.maxDepth) {
            this.currentDepth += this.divingSpeed;
        } else if (!this.isDiving && this.currentDepth > 0) {
            this.currentDepth -= this.risingSpeed;
        }
        
        this.currentDepth = Math.max(0, Math.min(this.maxDepth, this.currentDepth));
        
        // 更新釣魚線長度 - 修復深度計算問題
        this.fishingLine.length = this.currentDepth * (this.canvas.height - 100) / this.maxDepth;
        
        // 更新魚的位置
        this.fishes.forEach(fish => {
            fish.x += fish.speed * fish.direction;
            
            // 魚游出邊界時從另一邊出現
            if (fish.x < -50) {
                fish.x = this.canvas.width + 50;
            } else if (fish.x > this.canvas.width + 50) {
                fish.x = -50;
            }
        });
        
        // 更新危險物品的位置
        this.dangerousItemsList.forEach(item => {
            item.x += item.speed * item.direction;
            
            // 危險物品游出邊界時從另一邊出現
            if (item.x < -50) {
                item.x = this.canvas.width + 50;
            } else if (item.x > this.canvas.width + 50) {
                item.x = -50;
            }
        });
        
        // 檢查碰撞
        this.checkCollisions();
        
        this.updateUI();
    }
    
    checkCollisions() {
        const hookX = this.fishingLine.x;
        const hookY = this.fishingLine.y + this.fishingLine.length;
        
        // 檢查與魚的碰撞
        for (let i = this.fishes.length - 1; i >= 0; i--) {
            const fish = this.fishes[i];
            const distance = Math.sqrt(
                Math.pow(hookX - fish.x, 2) + 
                Math.pow(hookY - fish.y, 2)
            );
            
            if (distance < fish.type.size + this.fishingLine.hookSize) {
                // 檢查釣魚線是否在正確的深度範圍內
                const hookDepth = this.currentDepth;
                if (hookDepth >= fish.type.minDepth && hookDepth <= fish.type.maxDepth) {
                    // 成功釣到魚
                    this.score += fish.type.points;
                    this.fishCount++;
                    this.caughtFish.push({
                        ...fish,
                        caughtAt: Date.now()
                    });
                    
                    // 移除魚並生成新魚
                    this.fishes.splice(i, 1);
                    this.generateNewFish();
                }
            }
        }
        
        // 檢查與危險物品的碰撞
        for (let i = this.dangerousItemsList.length - 1; i >= 0; i--) {
            const item = this.dangerousItemsList[i];
            const distance = Math.sqrt(
                Math.pow(hookX - item.x, 2) + 
                Math.pow(hookY - item.y, 2)
            );
            
            if (distance < item.type.size + this.fishingLine.hookSize) {
                // 碰到危險物品，扣分
                this.score = Math.max(0, this.score - item.type.damage);
                this.caughtFish.push({
                    ...item,
                    caughtAt: Date.now(),
                    isDangerous: true
                });
                
                // 移除危險物品並生成新的
                this.dangerousItemsList.splice(i, 1);
                this.generateNewDangerousItem();
            }
        }
    }
    
    generateNewFish() {
        if (this.fishes.length < this.maxFishCount) {
            const fishType = this.fishTypes[Math.floor(Math.random() * this.fishTypes.length)];
            const depth = Math.random() * (fishType.maxDepth - fishType.minDepth) + fishType.minDepth;
            const x = Math.random() > 0.5 ? -50 : this.canvas.width + 50;
            
            this.fishes.push({
                x: x,
                y: depth + 50,
                type: fishType,
                direction: x < 0 ? 1 : -1,
                speed: fishType.speed * (0.5 + Math.random() * 0.5)
            });
        }
    }
    
    generateNewDangerousItem() {
        // 計算當前各深度的危險物品數量
        const depthCounts = {
            shallow: this.dangerousItemsList.filter(item => item.y - 50 < 100).length,
            medium: this.dangerousItemsList.filter(item => item.y - 50 >= 100 && item.y - 50 < 250).length,
            deep: this.dangerousItemsList.filter(item => item.y - 50 >= 250 && item.y - 50 < 400).length,
            veryDeep: this.dangerousItemsList.filter(item => item.y - 50 >= 400).length
        };
        
        // 決定在哪個深度生成新物品（越深越容易生成）
        const totalItems = this.dangerousItemsList.length;
        let targetLayer;
        
        if (depthCounts.veryDeep < 8 && Math.random() < 0.4) {
            targetLayer = { min: 400, max: 500 };
        } else if (depthCounts.deep < 6 && Math.random() < 0.3) {
            targetLayer = { min: 250, max: 400 };
        } else if (depthCounts.medium < 4 && Math.random() < 0.2) {
            targetLayer = { min: 100, max: 250 };
        } else if (depthCounts.shallow < 2) {
            targetLayer = { min: 0, max: 100 };
        } else {
            // 隨機選擇一個層級
            const layers = [
                { min: 0, max: 100 },
                { min: 100, max: 250 },
                { min: 250, max: 400 },
                { min: 400, max: 500 }
            ];
            targetLayer = layers[Math.floor(Math.random() * layers.length)];
        }
        
        // 選擇適合該深度的危險物品
        const suitableItems = this.dangerousItems.filter(item => 
            item.minDepth <= targetLayer.max && item.maxDepth >= targetLayer.min
        );
        
        if (suitableItems.length > 0 && this.dangerousItemsList.length < 20) {
            const itemType = suitableItems[Math.floor(Math.random() * suitableItems.length)];
            const depth = Math.random() * (targetLayer.max - targetLayer.min) + targetLayer.min;
            const x = Math.random() > 0.5 ? -50 : this.canvas.width + 50;
            
            this.dangerousItemsList.push({
                x: x,
                y: depth + 50,
                type: itemType,
                direction: x < 0 ? 1 : -1,
                speed: itemType.speed * (0.5 + Math.random() * 0.5)
            });
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        alert(`遊戲結束！\n最終分數: ${this.score}\n釣到魚數: ${this.fishCount}`);
    }
    
    draw() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製背景漸層
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#74b9ff');
        gradient.addColorStop(0.5, '#0984e3');
        gradient.addColorStop(1, '#2d3436');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製深度標記
        this.drawDepthMarkers();
        
        // 繪製魚
        this.fishes.forEach(fish => this.drawFish(fish));
        
        // 繪製危險物品
        this.dangerousItemsList.forEach(item => this.drawDangerousItem(item));
        
        // 繪製釣魚線
        this.drawFishingLine();
        
        // 繪製釣到的魚
        this.drawCaughtFish();
        
        // 繪製深度指示器
        this.drawDepthIndicator();
        
        // 繪製遊戲時間
        this.drawGameTime();
        
        // 繪製遊戲結束畫面
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawDepthMarkers() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        for (let depth = 0; depth <= this.maxDepth; depth += 50) {
            const y = 50 + (depth / this.maxDepth) * (this.canvas.height - 100);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
            
            this.ctx.fillText(`${depth}m`, 10, y - 5);
        }
    }
    
    drawFish(fish) {
        this.ctx.save();
        this.ctx.translate(fish.x, fish.y);
        this.ctx.scale(fish.direction, 1);
        
        // 魚身
        this.ctx.fillStyle = fish.type.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, fish.type.size, fish.type.size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 魚尾
        this.ctx.beginPath();
        this.ctx.moveTo(-fish.type.size * 0.8, 0);
        this.ctx.lineTo(-fish.type.size * 1.2, -fish.type.size * 0.3);
        this.ctx.lineTo(-fish.type.size * 1.2, fish.type.size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 魚眼
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(fish.type.size * 0.3, -fish.type.size * 0.2, fish.type.size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(fish.type.size * 0.35, -fish.type.size * 0.2, fish.type.size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawDangerousItem(item) {
        this.ctx.save();
        this.ctx.translate(item.x, item.y);
        this.ctx.scale(item.direction, 1);
        
        // 危險物品主體
        this.ctx.fillStyle = item.type.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.type.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 危險標記
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-item.type.size * 0.7, -item.type.size * 0.7);
        this.ctx.lineTo(item.type.size * 0.7, item.type.size * 0.7);
        this.ctx.moveTo(-item.type.size * 0.7, item.type.size * 0.7);
        this.ctx.lineTo(item.type.size * 0.7, -item.type.size * 0.7);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawFishingLine() {
        // 釣魚線
        this.ctx.strokeStyle = '#2d3436';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.fishingLine.x, this.fishingLine.y);
        this.ctx.lineTo(this.fishingLine.x, this.fishingLine.y + this.fishingLine.length);
        this.ctx.stroke();
        
        // 魚鉤
        this.ctx.fillStyle = '#2d3436';
        this.ctx.beginPath();
        this.ctx.arc(this.fishingLine.x, this.fishingLine.y + this.fishingLine.length, this.fishingLine.hookSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 釣竿
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(this.fishingLine.x - 30, this.fishingLine.y);
        this.ctx.lineTo(this.fishingLine.x, this.fishingLine.y);
        this.ctx.stroke();
    }
    
    drawCaughtFish() {
        this.caughtFish.forEach((fish, index) => {
            const timeSinceCaught = Date.now() - fish.caughtAt;
            if (timeSinceCaught < 2000) { // 顯示2秒
                const alpha = 1 - (timeSinceCaught / 2000);
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                
                // 在釣魚線附近顯示釣到的魚
                const x = this.fishingLine.x + (index * 30);
                const y = this.fishingLine.y + 20;
                
                if (fish.isDangerous) {
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.font = '16px Arial';
                    this.ctx.fillText(`-${fish.type.damage}`, x, y);
                } else {
                    this.ctx.fillStyle = fish.type.color;
                    this.ctx.font = '16px Arial';
                    this.ctx.fillText(`+${fish.type.points}`, x, y);
                }
                
                this.ctx.restore();
            }
        });
        
        // 清理過期的釣魚記錄
        this.caughtFish = this.caughtFish.filter(fish => Date.now() - fish.caughtAt < 2000);
    }
    
    drawDepthIndicator() {
        const indicatorWidth = 20;
        const indicatorHeight = 200;
        const x = this.canvas.width - 40;
        const y = 50;
        
        // 背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, indicatorWidth, indicatorHeight);
        
        // 深度條
        const depthPercentage = this.currentDepth / this.maxDepth;
        const barHeight = indicatorHeight * depthPercentage;
        
        this.ctx.fillStyle = '#00b894';
        this.ctx.fillRect(x, y + indicatorHeight - barHeight, indicatorWidth, barHeight);
        
        // 當前深度文字
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.round(this.currentDepth)}m`, x + indicatorWidth / 2, y + indicatorHeight + 20);
        this.ctx.textAlign = 'left';
    }
    
    drawGameTime() {
        const remainingTime = Math.max(0, this.maxGameTime - this.gameTime);
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`時間: ${minutes}:${seconds.toString().padStart(2, '0')}`, this.canvas.width / 2, 30);
        this.ctx.textAlign = 'left';
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('遊戲結束', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`最終分數: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`釣到魚數: ${this.fishCount}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        this.ctx.textAlign = 'left';
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.depthElement.textContent = Math.round(this.currentDepth);
        this.fishCountElement.textContent = this.fishCount;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new FishingGame();
}); 