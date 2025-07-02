class FishingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.depthElement = document.getElementById('depth');
        this.fishCountElement = document.getElementById('fishCount');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        // 遊戲狀態
        this.gameRunning = false;
        this.score = 0;
        this.fishCount = 0;
        this.maxDepth = 500;
        this.currentDepth = 0;
        this.targetDepth = 0;
        this.divingSpeed = 2;
        this.risingSpeed = 1.5;
        
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
            { name: '水雷', color: '#FF4757', minDepth: 100, maxDepth: 400, size: 20, speed: 0.5, type: 'mine' },
            { name: '廢棄漁網', color: '#747D8C', minDepth: 50, maxDepth: 300, size: 25, speed: 0.3, type: 'net' },
            { name: '有毒水母', color: '#FFA502', minDepth: 0, maxDepth: 200, size: 18, speed: 0.8, type: 'jellyfish' },
            { name: '沉船碎片', color: '#2F3542', minDepth: 200, maxDepth: 500, size: 22, speed: 0.2, type: 'debris' }
        ];
        
        this.fishes = [];
        this.dangerousItemsList = [];
        this.caughtFish = [];
        
        // 控制
        this.keys = {};
        this.isDiving = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.generateFish();
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
        
        // 按鈕事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameRunning = true;
        this.startBtn.style.display = 'none';
        this.restartBtn.style.display = 'inline-block';
    }
    
    restartGame() {
        this.gameRunning = false;
        this.score = 0;
        this.fishCount = 0;
        this.currentDepth = 0;
        this.targetDepth = 0;
        this.fishes = [];
        this.dangerousItemsList = [];
        this.caughtFish = [];
        this.generateFish();
        this.updateUI();
        this.startBtn.style.display = 'inline-block';
        this.restartBtn.style.display = 'none';
    }
    
    generateFish() {
        this.fishes = [];
        for (let i = 0; i < 20; i++) {
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
    
    update() {
        if (!this.gameRunning) return;
        
        // 更新深度
        if (this.isDiving && this.currentDepth < this.maxDepth) {
            this.currentDepth += this.divingSpeed;
        } else if (!this.isDiving && this.currentDepth > 0) {
            this.currentDepth -= this.risingSpeed;
        }
        
        this.currentDepth = Math.max(0, Math.min(this.maxDepth, this.currentDepth));
        
        // 更新釣魚線長度
        this.fishingLine.length = 50 + (this.currentDepth / this.maxDepth) * (this.fishingLine.maxLength - 50);
        
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
        
        // 檢查碰撞
        this.checkCollisions();
        
        this.updateUI();
    }
    
    checkCollisions() {
        const hookX = this.fishingLine.x;
        const hookY = this.fishingLine.y + this.fishingLine.length;
        
        for (let i = this.fishes.length - 1; i >= 0; i--) {
            const fish = this.fishes[i];
            const distance = Math.sqrt(
                Math.pow(hookX - fish.x, 2) + 
                Math.pow(hookY - fish.y, 2)
            );
            
            if (distance < fish.type.size + this.fishingLine.hookSize) {
                // 檢查是否在正確的深度範圍內
                const fishDepth = fish.y - 50;
                if (fishDepth >= fish.type.minDepth && fishDepth <= fish.type.maxDepth) {
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
    }
    
    generateNewFish() {
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
        
        // 繪製釣魚線
        this.drawFishingLine();
        
        // 繪製釣到的魚
        this.drawCaughtFish();
        
        // 繪製深度指示器
        this.drawDepthIndicator();
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
                
                this.ctx.fillStyle = fish.type.color;
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`+${fish.type.points}`, x, y);
                
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