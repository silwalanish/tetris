var Keys = [];

class Input{

	static KeyDown(keyCode){
		Keys[keyCode] = true;
	}

	static KeyUp(keyCode){
		Keys[keyCode] = false;
	}
	
	static GetKey(keyCode){
		return Keys[keyCode];
    }

}

window.addEventListener("keydown", function(e){
	Keys = Keys || [];
	Input.KeyDown(e.keyCode);
});

window.addEventListener("keyup", function(e){
	Keys = Keys || [];
	Input.KeyUp(e.keyCode);
});

class ColorRGB{
 
    constructor (r, g, b){
        this.r = r || 255;
        this.g = g || 255;
        this.b = b || 255;
    }

    asRgb () {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }

    static random () {
      let r, g, b;
      r = Math.max(Math.round(Math.random() * 255), 40);
      g = Math.max(Math.round(Math.random() * 255), 40);
      b = Math.max(Math.round(Math.random() * 255), 40);
      return new ColorRGB(r, g, b);
    }

}

class Vec2{

    constructor (x, y){
        this.x = x || 0;
        this.y = y || 0;
    }

    static add (a, b) {
        return new Vec2(a.x + b.x, a.y + b.y);
    }
    
    static ONE () {
        return new Vec2(1, 1);
    }

    equals(other) {
        return (this.x == other.x && this.y == other.y);
    }

    get X () {
        return this.x;
    }

    get Y () {
        return this.y;
    }

    set X (x) {
        this.x = x;
    }

    set Y (y) {
        this.y = y;
    }

}

class Grid{

    constructor(width, height, gridSize, maxCols){
        this.width = width;
        this.height = height;
        this.gridSize = gridSize;
        this.maxCols = maxCols;

        this.init();
    }

    init () {
        this.nCols = Math.ceil(this.width / this.gridSize);
        this.nRows = Math.ceil(this.height / this.gridSize);
        this.maxCols = (this.maxCols > this.nCols) ? this.nCols: this.maxCols;
        this.grids = new Array(this.nCols * this.nRows).fill({ filled: false, shape: null });
    }

    addTetris (tetris) {
        let gridPos = tetris.GridPos;
        if(gridPos){
            this.removeTetris(tetris);
        }
        gridPos = tetris.AbsPos;
        this.grids[gridPos.X + gridPos.Y * this.nCols] = { filled: true, tetris: tetris };
        tetris.GridPos = gridPos;
    }

    removeTetris (tetris) {
        let gridPos = tetris.GridPos;
        this.grids[gridPos.X + gridPos.Y * this.nCols] = { filled: false, tetris: null };
        tetris.gridPos = null;
    }

    hasTetrisAt (gridPos) {
        if(this.inGrid(gridPos)){
            return this.grids[gridPos.X + gridPos.Y * this.nCols];
        }else{
            return { filled: false, tetris: null };
        }
    }

    inGrid (pos) {
        return (pos.X >=0 && pos.X < this.nCols) && (pos.Y >= 0 && pos.Y < this.nRows);
    }

    actualPosition(gridPos){
        return new Vec2(gridPos.X * this.gridSize, gridPos.Y * this.gridSize);
    }

    draw (ctx) {
        let pos;
        for (let i = 0; i < this.nCols; i++) {
            pos = this.actualPosition(new Vec2(i, 0));
            ctx.beginPath();
            ctx.strokeStyle = "#ffffff3f";
            ctx.moveTo(pos.X, pos.Y);
            ctx.lineTo(pos.X, this.height);    
            ctx.stroke();
            ctx.closePath();     
        }
        for (let i = 0; i < this.nRows; i++) {
            pos = this.actualPosition(new Vec2(0, i));
            ctx.beginPath();
            ctx.strokeStyle = "#ffffff3f";
            ctx.moveTo(pos.X, pos.Y);
            ctx.lineTo(this.width, pos.Y);    
            ctx.stroke();
            ctx.closePath();          
        }
        ctx.beginPath();
        ctx.strokeStyle = "#ffffff3f";
        ctx.moveTo(0, 0);
        ctx.rect(0, 0, this.width, this.height);
        ctx.stroke();
        ctx.closePath();
    }

    RemoveFilledRow () {
        let numRow = 0;
        let rowComplete = false;
        for(let i = 0; i < this.nRows; i++){
            rowComplete = true;
            for(let j = 0; j < this.maxCols; j++){
                let entry = this.hasTetrisAt(new Vec2(j, i));
                if(!entry.filled){
                    rowComplete = false;
                    break;
                }
            }
            if(rowComplete){
                numRow ++;
                this.EmptyRow(i);
            }
        }
        return numRow;
    }

    EmptyRow (i) {
        for(let j = 0; j < this.maxCols; j++){
            let entry = this.hasTetrisAt(new Vec2(j, i));
            this.removeTetris(entry.tetris);
            entry.tetris.shape.RemoveTetris(entry.tetris);
        }
    }

}

class Tetris{

    constructor(pos, game, shape){
        this.game = game;
        this.position = pos || new Vec2();
        this.timer = 0;
        this.shape = shape || null;
        this.gridPos = null;
    }

    set Shape (shape) {
        this.shape = shape;
    }

    get Shape () {
        return this.shape;
    }

    updatePos () {
        this.shape.Game.grids.addTetris(this);
    }

    draw (ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.shape.color.asRgb();
        let pos = this.shape.Game.grids.actualPosition(this.AbsPos);
        ctx.fillRect(pos.X + 1, pos.Y + 1, 25 - 1, 25 - 1);
        ctx.closePath();
    }

    CanMoveDown () {
        let down = Vec2.add(this.AbsPos, new Vec2(0, 1));
        if(down.Y < this.shape.Game.grids.nRows){
            let hasTetrisBelow = this.shape.Game.grids.hasTetrisAt(down);
            return (!hasTetrisBelow.filled || hasTetrisBelow.tetris.Shape == this.shape);
        }else{
            return false;
        }
    }

    CanMoveLeft () {
        let left = Vec2.add(this.AbsPos, new Vec2(-1, 0));
        if(left.X >= 0){
            let hasTetrisToLeft = this.shape.Game.grids.hasTetrisAt(left);
            return (!hasTetrisToLeft.filled || hasTetrisToLeft.tetris.Shape == this.shape);
        }else{
            return false;
        }
    }

    CanMoveRight () {
        let right = Vec2.add(this.AbsPos, new Vec2(1, 0));
        if(right.X < this.shape.Game.grids.maxCols){
            let hasTetrisToRight = this.shape.Game.grids.hasTetrisAt(right);
            return (!hasTetrisToRight.filled || hasTetrisToRight.tetris.Shape == this.shape);
        }else{
            return false;
        }
    }

    get Pos () {
        return this.position;
    }

    set Pos (pos) {
        this.position = pos;
    }

    get AbsPos () {
        return Vec2.add(this.position, this.shape.Pos);
    }

    get GridPos () {
        return this.gridPos;
    }

    set GridPos (pos) {
        this.gridPos = pos;
    }

}

class Shape {

    constructor (pos, rotation, controlled, game) {
        this.game = game;
        this.position = pos || new Vec2();
        this.tetris = [];
        this.timer = 0;
        this.color = ColorRGB.random();
        this.controlled = controlled || false;
        this.rotation = rotation || 0;

        this.init();
    }

    init () {
        if(this.tetris.length > 0){
            for(let i = 0; i < this.tetris.length; i++){
                this.game.grids.removeTetris(this.tetris[i]);
                delete this.tetris[i];
            }
        }
        this.tetris = [];
    }

    input () {
        if(Input.GetKey(37) && this.CanMoveLeft()){
            this.position.X -= 1;
        }else if(Input.GetKey(39) && this.CanMoveRight()){
            this.position.X += 1;
        }else if(Input.GetKey(40) && this.CanMoveDown()){
            this.position.Y += 1;
        }else if(Input.GetKey(38)){
            this.Rotate();
        }
    }

    update (deltaTime) {
        this.timer += deltaTime % 0.5;
        if(this.timer >= 0.5){
            if(this.CanMoveDown()){
                this.position.Y += 1;
            }
            this.timer = 0;
        }
        this.tetris.forEach(t => t.updatePos());
    }

    draw (ctx) {
        this.tetris.forEach(t => t.draw(ctx));
    }

    CanMoveDown () {
        for (let i = 0; i < this.tetris.length; i++) {
            if(!this.tetris[i].CanMoveDown()){
                return false;
            }
        }
        return true;
    }

    CanMoveLeft () {
        for (let i = 0; i < this.tetris.length; i++) {
            if(!this.tetris[i].CanMoveLeft()){
                return false;
            }
        }
        return true;
    }

    CanMoveRight () {
        for (let i = 0; i < this.tetris.length; i++) {
            if(!this.tetris[i].CanMoveRight()){
                return false;
            }
        }
        return true;
    }

    Rotate () {
        this.rotation += 1;
        this.rotation %= 4;
        this.init();
        this.ensureInGrid();
    }

    ensureInGrid () {
        let move = 0;
        for (let i = 0; i < this.tetris.length; i++) {
            if(this.tetris[i].AbsPos.X < 0){
                move++;
            }else if(this.tetris[i].AbsPos.X >= this.game.grids.maxCols){
                move--;
            }
        }
        this.position.X += move;
    }

    AddTetris (tetris) {
        tetris.Shape = this;
        this.tetris.push(tetris);
    }

    RemoveTetris (tetris){
        let index = this.tetris.indexOf(tetris);
        if(index >= 0){
            this.tetris.splice(index, 1);
        }
    }
    
    set Game (game) {
        this.game = game;
    }

    get Game () {
        return this.game;
    }

    get Pos () {
        return this.position;
    }

    set Pos (pos) {
        this.position = pos;
    }

    set Height (h) {
        this.height = h;
    }

}

class Square extends Shape {

    init () {
        super.init();
        this.AddTetris(new Tetris(new Vec2(1, 1), game, this));
        this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
        this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
        this.AddTetris(new Tetris(new Vec2(), game, this));
    }
    
}

class ShapeLR extends Shape {

    init () {
        super.init();
        if(this.rotation == 0){
            this.AddTetris(new Tetris(new Vec2(-1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(1, 1), game, this));
        }else if(this.rotation == 1){
            this.AddTetris(new Tetris(new Vec2(0, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
            this.AddTetris(new Tetris(new Vec2(-1, 1), game, this));
        }else if(this.rotation == 2){
            this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(-1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(-1, -1), game, this));
        }else{
            this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(0, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(-1, -1), game, this));
        }
    }

}

class ShapeLL extends Shape {

    init () {
        super.init();
        if(this.rotation == 0){
            this.AddTetris(new Tetris(new Vec2(-1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(-1, 1), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
        }else if(this.rotation == 1){
            this.AddTetris(new Tetris(new Vec2(0, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(-1, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
        }else if(this.rotation == 2){
            this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(1, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(-1, 0), game, this));
        }else{
            this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
            this.AddTetris(new Tetris(new Vec2(1, 1), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(0, -1), game, this));
        }
    }

}

class Straight extends Shape{

    init () {
        super.init();
        if(this.rotation == 0 || this.rotation == 2){
            this.AddTetris(new Tetris(new Vec2(0, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
            this.AddTetris(new Tetris(new Vec2(0, 2), game, this));
        }else{
            this.AddTetris(new Tetris(new Vec2(-1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(2, 0), game, this));
        }
    }

}

class ShapeT extends Shape{

    init () {
        super.init();
        if(this.rotation == 0){
            this.AddTetris(new Tetris(new Vec2(-1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
        }else if(this.rotation == 1){
            this.AddTetris(new Tetris(new Vec2(-1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(0, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
        }else if(this.rotation == 2){
            this.AddTetris(new Tetris(new Vec2(-1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(0, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
        }else{
            this.AddTetris(new Tetris(new Vec2(0, -1), game, this));
            this.AddTetris(new Tetris(new Vec2(), game, this));
            this.AddTetris(new Tetris(new Vec2(1, 0), game, this));
            this.AddTetris(new Tetris(new Vec2(0, 1), game, this));
        }
    }

}

class ShapeZL extends Shape{

    init () {
        super.init();
        if(this.rotation % 2 == 0){
            this.AddTetris(new Tetris(new Vec2(-1, 0)));
            this.AddTetris(new Tetris(new Vec2()));
            this.AddTetris(new Tetris(new Vec2(0, 1)));
            this.AddTetris(new Tetris(new Vec2(1, 1)));
        }else{
            this.AddTetris(new Tetris(new Vec2(0, -1)));
            this.AddTetris(new Tetris(new Vec2()));
            this.AddTetris(new Tetris(new Vec2(-1, 0)));
            this.AddTetris(new Tetris(new Vec2(-1, 1)));
        }
    }

}

class ShapeZR extends Shape{

    init () {
        super.init();
        if(this.rotation % 2 == 0){
            this.AddTetris(new Tetris(new Vec2(1, 0), this));
            this.AddTetris(new Tetris(new Vec2(), this));
            this.AddTetris(new Tetris(new Vec2(0, 1), this));
            this.AddTetris(new Tetris(new Vec2(-1, 1), this));
        }else{
            this.AddTetris(new Tetris(new Vec2(0, 1), this));
            this.AddTetris(new Tetris(new Vec2(), this));
            this.AddTetris(new Tetris(new Vec2(-1, 0), this));
            this.AddTetris(new Tetris(new Vec2(-1, -1), this));
        }
    }

}

class Game{

    constructor(elm, width, height){
        this.elm = elm;
        this.context = null;
        this.width = width;
        this.height = height;
        this.startTime = null;
        this.grids = null;
        this.paused = true;
        this.quit = false;
        this.score = 0;
        this.timer = 0;

        this.shapes = [];
        this.controlledShape = null;
        this.nextShape = null;

        this.init();
    }

    init () {
        // Get the canvas
        this.container = document.querySelector(this.elm);
        this.container.classList.add("game-container");
        this.container.style.width = this.width + "px";
        this.container.style.height = this.height + "px";

        let canvas = document.createElement("canvas");
        // Set canvas dimensions
        canvas.width = this.width;
        canvas.height = this.height;
        this.container.appendChild(canvas);
        // Get canvas context
        this.context = canvas.getContext('2d');

        let playAgain = document.createElement("button");
        playAgain.textContent = "Play Again";
        playAgain.classList.add("game-button", "play", "hide");
        this.container.appendChild(playAgain);
        
        let resumeBtn = document.createElement("button");
        resumeBtn.textContent = "Resume";
        resumeBtn.classList.add("game-button", "resume-btn", "hide");
        this.container.appendChild(resumeBtn);

        let pauseBtn = document.createElement("button");
        pauseBtn.textContent = "||";
        pauseBtn.classList.add("game-button", "pause-btn", "fab", "top");
        this.container.appendChild(pauseBtn);

        playAgain.addEventListener("click", (e) => {
            this.start();
            playAgain.classList.add("hide");
            pauseBtn.classList.remove("hide");
        });

        pauseBtn.addEventListener("click", (e) => {
            this.pause();
            pauseBtn.classList.add("hide");
            resumeBtn.classList.remove("hide");
        });

        resumeBtn.addEventListener("click", (e) => {
            this.resume();
            resumeBtn.classList.add("hide");
            pauseBtn.classList.remove("hide");
        });

        var VT323_font = new FontFace('VT323', 'url(fonts/VT323-Regular.ttf)');
        VT323_font.load().then(function(loaded_face) {
            document.fonts.add(loaded_face);
        }).catch(function(error) {
            console.log("Error while loading font.");
            console.log(error);
        });
        
        window.addEventListener("keydown", (e) => {
            this.input();
        });
        this.start();
    }

    GenerateShape (controlled) {
        controlled = controlled || false;
        let rand = Math.round(Math.random() * 6);
        let rot = Math.round(Math.random() * 3);
        switch(rand){
            case 0:
                return new Square(new Vec2(), rot, controlled, this);
            case 1:
                return new ShapeLR(new Vec2(), rot, controlled, this);
            case 2:
                return new ShapeT(new Vec2(), rot, controlled, this);
            case 3:
                return new ShapeLL(new Vec2(), rot, controlled, this);
            case 4:
                return new Straight(new Vec2(), rot, controlled, this);
            case 5:
                return new ShapeZL(new Vec2(), rot, controlled, this);
            case 6:
                return new ShapeZR(new Vec2(), rot, controlled, this);
            default:
        }
    }

    GenerateNextShape () {
        this.nextShape = this.GenerateShape();
        this.nextShape.Pos = new Vec2(24, 9);

        this.AddShape(this.controlledShape);
    }

    pause () {
        this.paused = true;
    }

    resume () {
        this.paused = false;
    }

    start () {
        this.grids = new Grid(this.width - 300, this.height, 25, 20);
        this.paused = false;
        this.quit = false;
        this.startTime = Date.now();
        this.score = 0;
        this.timer = 0;

        this.shapes = [];

        this.controlledShape = this.GenerateShape(true);
        this.controlledShape.Pos = new Vec2(Math.floor(this.grids.maxCols / 2), 0);
        this.GenerateNextShape();
        this.run();
    }

    run () {
        if(!this.paused){
            let currentTime = Date.now();
            let deltaTime = (currentTime - this.startTime) / 1000;
            this.startTime = currentTime;

            this.update(deltaTime);
            this.draw();
        }else{
            this.context.beginPath();
            this.context.font = "50px VT323";
            this.context.textAlign = "center";
            this.context.fillStyle = "#ffff00";
            this.context.fillText("Paused!", this.grids.width / 2, this.grids.height / 2);
            this.context.closePath();
        }
        
        if(!this.quit){
            window.requestAnimationFrame(() => {
                this.run();
            });
        }else{
            this.context.beginPath();
            this.context.font = "100px VT323";
            this.context.textAlign = "center";
            this.context.fillStyle = "#ff0000";
            this.context.fillText("GAME OVER!", this.grids.width / 2, this.grids.height / 2);
            this.context.closePath();
            document.querySelectorAll(".game-container .game-button").forEach((btn) => {
                btn.classList.add("hide");
            });
            document.querySelector(".game-container .play").classList.remove("hide");
        }
    }

    clear () {
        this.context.beginPath();
        this.context.fillStyle = "#000000";
        this.context.fillRect(0, 0, this.width, this.height);
        this.context.closePath();
        this.grids.draw(this.context);

        this.context.beginPath();
        this.context.font = "30px VT323";
        this.context.fillStyle = "#ffffff";
        this.context.textAlign = "left";
        this.context.fillText("Score: "+this.score, this.grids.width + 25, 50);
        this.context.fillText("Next: ", this.grids.width + 25, 145);
        this.context.strokeStyle = "#ffffff4f";
        this.context.rect(this.grids.width + 25, 150, 200, 200);
        this.context.stroke();
        this.nextShape.draw(this.context);
        this.context.closePath();

        this.context.beginPath();
        this.context.fillStyle = "#59d76e";
        this.context.fillText("Tips: ", this.grids.width + 25, 385);
        this.context.closePath();

        this.drawHelp("\u25B2", "Rotate", this.grids.width + 50, 400);
        this.drawHelp("\u25C0", "Move Left", this.grids.width + 50, 460);
        this.drawHelp("\u25B6", "Move Right", this.grids.width + 50, 520);

    }

    drawHelp (key, text, x, y){
        this.context.beginPath();
        this.context.strokeStyle = "#ffffff";
        this.context.fillStyle = "#ffffff";
        this.context.rect(x, y, 50, 50);
        this.context.stroke();
        this.context.textAlign = "center";
        this.context.font = "30px VT323";
        this.context.fillText(key, x + 25, y + 35);
        this.context.textAlign = "left";
        this.context.fillText(text, x + 60, y + 35);
        this.context.closePath();
    }

    draw () {
        this.clear();
        this.shapes.forEach(shape => {
            shape.draw(this.context);
        });
    }

    update (deltaTime) {
        this.shapes.forEach(shape => {
            shape.update(deltaTime);
        });
        if(!this.controlledShape.CanMoveDown() && this.timer >= 0.2){
            let score = this.grids.RemoveFilledRow();
            this.score += score * 100;
            
            this.nextShape.Pos = new Vec2(Math.floor(this.grids.maxCols / 2), 0);
            if(!this.nextShape.CanMoveDown()){
                this.quit = true;
            }else{
                this.nextShape.controlled = true;
                this.controlledShape = this.nextShape;
                this.GenerateNextShape();
                this.timer = 0;
            }
        }else if(!this.controlledShape.CanMoveDown()){
            this.timer += deltaTime;
        }
    }

    input () {
        this.controlledShape.input();
    }

    AddShape (shape) {
        shape.Game = this;
        this.shapes.push(shape);
    }

    RemoveShape (shape) {
        let index = this.entities.indexOf(shape);
        if(index == -1) { 
            return;
        }
        this.entities.splice(index, 1);
    }

}

var game = new Game("#app", 800, 600);