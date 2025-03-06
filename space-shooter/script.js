// Ambil elemen canvas dan atur context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 700;

// Muat gambar
const spaceshipImg = new Image();
spaceshipImg.src = "images/spaceship.png"; 

const bulletImg = new Image();
bulletImg.src = "images/bullet.png";

const spreadBulletImg = new Image();
spreadBulletImg.src = "images/spread-bullet.png";

const weaponDropImg = new Image();
weaponDropImg.src = "images/weapon-drop.png";

const enemy1Img = new Image();
enemy1Img.src = "images/enemy.png"; 

const enemy2Img = new Image();
enemy2Img.src = "images/ufo1.png"; 

const bombImg = new Image();
bombImg.src = "images/bom.png"; 

// Muat efek suara
function loadAudio(src) {
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.preload = 'auto';
    return audio;
}

const shootSound = loadAudio("shoot.wav");
const bgMusic = loadAudio("bg-music.mp3");
const explosionSound = loadAudio("explosion.wav");

bgMusic.loop = true;

document.addEventListener("click", () => {
    if (bgMusic.paused) {
        bgMusic.play().catch((error) => console.error("Failed to play bgMusic:", error));
    }
}, { once: true });

document.addEventListener("keydown", () => {
    if (bgMusic.paused) {
        bgMusic.play().catch((error) => console.error("Failed to play bgMusic:", error));
    }
}, { once: true });

// Objek pemain
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 150,
    width: 50,
    height: 50,
    speed: 4,
    weaponType: "single"
};

// Array untuk peluru
let bullets = [];

// Menyimpan status tombol yang ditekan
let keys = {};

// Musuh dan interval spawn
let enemies = [];
const enemySpawnInterval = 3000;

// Variabel status game
let weapons = [];
let bombs = [];
let score = 0;
let lives = 3;
let gameOver = false;
let isPaused = false;

// Tembakan pesawat
let spreadMode = false;

// Waktu cooldown senjata
let spreadTimeout = null;

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " " && !gameOver && !isPaused) {
        shootBullets();
    }

    if (e.key === "p") togglePause();
    if (e.key === "l" && isPaused) togglePause();

    if (gameOver && e.key === " ") restartGame();
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// Fungsi untuk menembak peluru
function shootBullets() {
    if (spreadMode) {
        bullets.push({ x: player.x + player.width / 2 - 15, y: player.y, speed: 5, angle: -0.2, type: 'spread' });
        bullets.push({ x: player.x + player.width / 2 - 5, y: player.y, speed: 5, angle: 0, type: 'spread' });
        bullets.push({ x: player.x + player.width / 2 + 15, y: player.y, speed: 5, angle: 0.2, type: 'spread' });
    } else {
        bullets.push({ x: player.x + player.width / 2 - 5, y: player.y, speed: 5, angle: 0, type: 'single' });
    }
    shootSound.currentTime = 0;
    shootSound.play().catch((error) => console.error('Failed to play shootSound:', error));
}

// Fungsi untuk mengaktifkan mode spread
function activateSpreadMode() {
    spreadMode = true;
    clearTimeout(spreadTimeout);
    spreadTimeout = setTimeout(() => {
        spreadMode = false;
    }, 3000); // Mode spread aktif selama 3 detik
}

// Fungsi untuk menggambar peluru
function drawBullets() {
    bullets.forEach((bullet, index) => {
        let img = bullet.type === "spread" ? spreadBulletImg : bulletImg;
        ctx.drawImage(img, bullet.x, bullet.y, 10, 20);
        bullet.x += Math.sin(bullet.angle) * 3;
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });
}

// Fungsi untuk mendeteksi tabrakan peluru
function checkWeaponCollision() {
    for (let i = weapons.length - 1; i >= 0; i--) {
        let weapon = weapons[i];
        if (
            player.x < weapon.x + 30 &&
            player.x + player.width > weapon.x &&
            player.y < weapon.y + 30 &&
            player.y + player.height > weapon.y
        ) {
            weapons.splice(i, 1);
            activateSpreadMode();
        }
    }
}

// Fungsi utama game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameOver) {
        showGameOver();
    } else if (isPaused) {
        showPauseMenu();
    } else {
        updatePlayer();
        updateBullets();
        checkWeaponCollision();
        drawPlayer();
        drawBullets();
    }
    requestAnimationFrame(gameLoop);
}

spaceshipImg.onload = () => {
    gameLoop();
};



// Update posisi pemain
function updatePlayer() {
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;

    // Pemain bisa tembus dari kiri ke kanan
    if (player.x < -player.width) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;
}

function drawPlayer() {
    ctx.drawImage(spaceshipImg, player.x, player.y, player.width, player.height);
}

function drawBullets() {
    bullets.forEach((bullet, index) => {
        let img = player.weaponType === "spread" ? spreadBulletImg : bulletImg;
        ctx.drawImage(img, bullet.x, bullet.y, 10, 20);
        
        bullet.x += Math.sin(bullet.angle) * 3;
        bullet.y -= bullet.speed;

        if (bullet.y < 0) bullets.splice(index, 1);
    });
}

function spawnWeapon() {
    if (!gameOver && Math.random() < 0.5) { 
        const x = Math.random() * (canvas.width - 30);
        weapons.push({ x, y: 0, width: 30, height: 30, speed: 3 });
    }
}

function drawWeapons() {
    for (let i = weapons.length - 1; i >= 0; i--) {
        let weapon = weapons[i];
        ctx.drawImage(weaponDropImg, weapon.x, weapon.y, weapon.width, weapon.height);
        weapon.y += weapon.speed;

        if (
            player.x < weapon.x + weapon.width &&
            player.x + player.width > weapon.x &&
            player.y < weapon.y + weapon.height &&
            player.y + player.height > weapon.y
        ) {
            weapons.splice(i, 1);
            player.weaponType = "spread";
            powerUpSound.play();

            setTimeout(() => {
                player.weaponType = "normal";
            }, 10000);
        }

        if (weapon.y > canvas.height) {
            weapons.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    if (!gameOver) {
        const x = Math.random() * (canvas.width - 50);
        let type = Math.random() < 0.5 ? "enemy1" : "ufo1";
        let speed = type === "enemy1" ? 1 + Math.floor(score / 80) : 2 + Math.floor(score / 100);
        let image = type === "enemy1" ? enemy1Img : enemy2Img;

        enemies.push({ x, y: 0, width: 50, height: 50, speed, type, image });
    }
}

function drawEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
        enemy.y += enemy.speed;

        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) gameOver = true;
        }
    }
}

function drawBombs() {
    for (let i = bombs.length - 1; i >= 0; i--) {
        let bomb = bombs[i];
        ctx.drawImage(bombImg, bomb.x, bomb.y, 20, 20); // Gambar bom
        bomb.y += bomb.speed; // Gerakkan bom ke bawah

        // Cek tabrakan dengan pemain
        if (
            bomb.x < player.x + player.width &&
            bomb.x + 20 > player.x &&
            bomb.y < player.y + player.height &&
            bomb.y + 20 > player.y
        ) {
            bombs.splice(i, 1); // Hapus bom
            lives--; // Kurangi nyawa
            if (lives <= 0) gameOver = true; // Cek jika game over
        }

        // Hapus bom jika keluar dari layar
        if (bomb.y > canvas.height) {
            bombs.splice(i, 1);
        }
    }
}

// Cek tabrakan antara peluru dan bom
function checkBulletBombCollision() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = bombs.length - 1; j >= 0; j--) {
            let bullet = bullets[i];
            let bomb = bombs[j];

            if (
                bullet.x < bomb.x + 20 &&
                bullet.x + 10 > bomb.x &&
                bullet.y < bomb.y + 20 &&
                bullet.y + 20 > bomb.y
            ) {
                bullets.splice(i, 1); // Hapus peluru
                bombs.splice(j, 1); // Hapus bom
                lives--; // Kurangi nyawa
                if (lives <= 0) gameOver = true; // Cek jika game over
                break;
            }
        }
    }
}

// Cek tabrakan antara peluru dan musuh
function checkBulletEnemyCollision() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            let bullet = bullets[i];
            let enemy = enemies[j];

            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + 10 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 20 > enemy.y
            ) {
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                explosionSound.currentTime = 0;
                explosionSound.play();
                break;
            }
        }
    }
}

// Menampilkan Game Over
const gameOverImg = new Image();
gameOverImg.src = "images/alien.png"; // Ganti dengan path gambar yang sesuai

function showGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gambar Game Over di tengah layar
    let imgWidth = 200;
    let imgHeight = 250;
    let imgX = canvas.width / 2 - imgWidth / 2;
    let imgY = canvas.height / 2 - imgHeight / 2;
    ctx.drawImage(gameOverImg, imgX, imgY, imgWidth, imgHeight);

    // Tambahkan teks Game Over di atas gambar
    ctx.font = "bold 40px Orbitron";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, imgY - 50); // 20px di atas gambar

    // Teks instruksi restart di bawah gambar
    ctx.font = "20px Orbitron";
    ctx.fillStyle = "white";
    ctx.fillText("Press SPASI to Restart", canvas.width / 2, imgY + imgHeight + 30); // 30px di bawah gambar
}

// Restart game
function restartGame() {
    gameOver = false;
    score = 0;
    lives = 3;
    enemies = [];
    bullets = [];
    weapons = [];
    bombs = []; // Reset bom saat restart
    player.x = canvas.width / 2 - 25;
    player.weaponType = "normal";
    gameLoop();
}

// Game loop utama
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isPaused) {
        showPauseMenu(); // Tampilkan menu pause jika permainan dijeda
        requestAnimationFrame(gameLoop); // Tetap panggil gameLoop agar pause menu tetap ditampilkan
        return; // Hentikan eksekusi lebih lanjut
    }

    updatePlayer(); // Panggil fungsi updatePlayer
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawBombs(); // Gambar bom
    drawWeapons();
    drawScore();
    checkBulletEnemyCollision();
    checkBulletBombCollision(); // Cek tabrakan antara peluru dan bom

    if (gameOver) {
        showGameOver();
        return;
    }

    requestAnimationFrame(gameLoop);
}

function drawScore() {
    ctx.font = "bold 17px Orbitron";
    ctx.fillStyle = "white";
    ctx.textBaseline = "top"; // Pastikan teks ditampilkan dari atas
    ctx.fillText("⭐ Score: " + score, 20, 40);
    ctx.fillText("❤️ Lives: " + lives, 20, 70);
}

// Menampilkan menu pause
function showPauseMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = "bold 40px Orbitron";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = "20px Orbitron";
    ctx.fillText("Press 'P' to Resume", canvas.width / 2, canvas.height / 2 + 20);
}

// Fungsi untuk menembakkan bom setiap 7 detik
function spawnBombs() {
    setInterval(() => {
        if (!gameOver) {
            const x = Math.random() * (canvas.width - 20); // Posisi horizontal bom
            bombs.push({ x: x, y: 0, speed: 3 }); // Tambahkan bom ke array
        }
    }, 7000); // 7000 ms = 7 detik
}

// Mulai game
bgMusic.play();
setInterval(spawnEnemy, 2000);
setInterval(spawnWeapon, 10000 + Math.random() * 5000);
spawnBombs(); // Mulai menembakkan bom setiap 7 detik
gameLoop();