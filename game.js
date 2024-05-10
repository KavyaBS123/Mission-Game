// Load Game
var game = new Game();

function init() {
  game.init();
}

function Drawable() {
  
  this.init = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  };
  
  this.speed = 0;
  this.canvasWidth = 0;
  this.canvasHeight = 0;
  this.collidableWith = "";
  this.isColliding = false;
  this.type = "";

  this.draw = function() {
  };
  this.move = function() {
  };
  this.die = function() {
  };
  
  this.isCollidableWith = function(object) {
    return (this.collidableWith === object.type);
  };

}

function Ship() {
  this.speed = 4;
  this.bulletPool = new Pool(30);
  this.bulletPool.init("bullet");

  var fireRate = 15;
  var counter = 0;

  this.collidableWith = "enemyBullet";
  this.type = "ship";

  this.init = function(x, y, width, height) {
    this.x = x;
    this.y = y - 10;
    this.width = width;
    this.height = height;
    this.alive = true;
    this.isColliding = false;
    this.bulletPool.init("bullet");
  }

  this.draw = function() {
    this.context.drawImage(imageRepository.spaceship, this.x, this.y);
  };

  this.move = function() {
    counter++;
    if (KEY_STATUS.left || KEY_STATUS.right || KEY_STATUS.down || KEY_STATUS.up) {
      //The ship moved, so erase it's current image so it can be redrawn in it's new location
      this.context.clearRect(this.x, this.y, this.width, this.height);

      if(KEY_STATUS.left) {
        this.x -= this.speed;
        if(this.x <= 0) { //keep player within the screen
          this.x = 0;
        }
      }
      if(KEY_STATUS.right) {
        this.x += this.speed;
        if(this.x >= this.canvasWidth - this.width) {
          this.x = this.canvasWidth - this.width;
        }
      }
      if(KEY_STATUS.up) {
        this.y -= this.speed;
        if(this.y <= this.canvasHeight/2) {
          this.y = this.canvasHeight/2;
        }
      }
      if(KEY_STATUS.down) {
        this.y += this.speed;
        if(this.y >= this.canvasHeight - this.height) {
          this.y = this.canvasHeight - this.height;
        }
      }
    }
    
    if (!this.isColliding) {
      this.draw();
    } else {
	  this.die();
    }

    if(KEY_STATUS.space && counter >= fireRate) {
      this.fire();
      counter = 0;
    }

  };

  this.fire = function() {
    this.bulletPool.getTwo(
      this.x+6, this.y + 20, 3,
      this.x+26, this.y + 20, 3);
  };

  this.die = function() {
    game.playerLives -= 1;
    if(game.playerLives <= 0) {
      this.context.drawImage(imageRepository.spaceshipDown, this.x, this.y);
      this.alive = false;
      game.gameOver();
      document.getElementById('lives').innerHTML = "";
    } else {
      game.restart("continue");
    }
  };

}
Ship.prototype = new Drawable();

function Bullet(object) {
  this.alive = false; // Is true if the bullet is currently in use
  var self = object;
  this.spawn = function(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.alive = true;
  };

    this.draw = function() {
    this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
    this.y -= this.speed;

    if (this.isColliding) {
      return true;
    }

    if(self === "bullet" && this.y <= 0 - this.height) {
      return true;
    } else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
      return true;
    } else {
      if(self === "bullet") {
        this.context.drawImage(imageRepository.bullet, this.x, this.y);
      } else if (self === "enemyBullet") {
        this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
      }

      return false;
    }
  };
    this.clear = function() {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.alive = false;
    this.isColliding = false;
  };
}
Bullet.prototype = new Drawable();

function Enemy() {
  var percentFire = 0.01;
  var chance = 0;
  this.alive = false;
  this.collidableWith = "bullet";
  this.type = "enemy";

  this.spawn = function(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.speedX = 0;
    this.speedY = speed * 1.5;
    this.alive = true;
    this.leftEdge = this.x - 40;
    this.rightEdge = this.x + 30;
    this.bottomEdge = this.y + 200;
  };

  this.draw = function() {
    this.context.clearRect(this.x, this.y-1, this.width+1, this.height+1);
    this.x += this.speedX / 2;
    this.y += this.speedY;
    if(this.x <= this.leftEdge) {
      this.speedX = this.speed;
    } else if (this.x >= this.rightEdge + this.width) {
      this.speedX = -this.speed;
    } else if (this.y >= this.bottomEdge) {
      this.speed = 1.5;
      this.speedY = 0;
      this.y -= 5;
      this.speedX = -this.speed;
    }

    if(!this.isColliding) {
      this.context.drawImage(imageRepository.enemy, this.x, this.y);
      chance = Math.floor(Math.random()*201);
      if(chance/100 < percentFire) {
        this.fire();
      }
      return false;
    } else {
	
      this.context.drawImage(imageRepository.enemyDown, this.x, this.y);
      game.playerScore += (10 + game.level);
      return true;
    }
  };

  this.fire = function() {
    game.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -.5 - game.level);
  }

  this.clear = function() {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.speedX = 0;
    this.speedY = 0;
    this.alive = false;
    this.isColliding = false;
  };
}
Enemy.prototype = new Drawable();

function Background() {
  
  this.speed = 1;
  
  this.draw = function() {
    // pan background
    this.y += this.speed;
    this.context.drawImage(imageRepository.background, this.x, this.y);
	// draw another image at the top edge of the first image
	this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);
    // if the image scrolled off the screen, reset
    if(this.y >= this.canvasHeight) {
      this.y = 0;
    }
    
  };
}
Background.prototype = new Drawable();

var imageRepository = new function() {
  // Define images
  this.background = new Image();
  this.spaceship = new Image();
  this.spaceshipDown = new Image();
  this.bullet = new Image();
  this.enemy = new Image();
  this.enemyDown = new Image();
  this.enemyBullet = new Image();
  var numImages = 7;
  var numLoaded = 0;
  function imageLoaded() {
    numLoaded++;													
    if(numLoaded === numImages) {
      window.init();
    }
  }

  this.background.onload = function() {
    imageLoaded();
  }
  this.spaceship.onload = function() {
    imageLoaded();
  }
  this.spaceshipDown.onload = function() {
    imageLoaded();
  }
  this.bullet.onload = function() {
    imageLoaded();
  }
  this.enemy.onload = function() {
    imageLoaded();
  }
  this.enemyDown.onload = function() {
    imageLoaded();
  }
  this.enemyBullet.onload = function() {
    imageLoaded();
  }
  // Set images src  
  this.background.src = "bg.jpg";
  this.spaceship.src = "ship.png";
  this.spaceshipDown.src = "shipDown.png";
  this.bullet.src = "bullet.png";
  this.enemy.src = "enemy.png";
  this.enemyDown.src = "enemyDown.png";
  this.enemyBullet.src = "bulletEnemy.png";
}

function Pool(maxSize) {
  var size = maxSize; 
  var pool = [];
  this.init = function(object) {
    if(object == "bullet") {
      for (var i = 0; i < size; i++) {
        // Initialize the object
        var bullet = new Bullet("bullet");
        bullet.init(0,0, imageRepository.bullet.width, imageRepository.bullet.height);
        bullet.collidableWith = "enemy";
        bullet.type = "bullet";
        pool[i] = bullet;
      }
    } else if (object == "enemy") {
      for (var i = 0; i < size; i++) {
        var enemy = new Enemy();
        enemy.init(0,0, imageRepository.enemy.width, imageRepository.enemy.height);
        pool[i] = enemy;
      }																									//????
    } else if (object == "enemyBullet") {
      for (var i = 0; i < size; i++) {
        var bullet = new Bullet("enemyBullet");
        bullet.init(0,0, imageRepository.enemyBullet.width, imageRepository.enemyBullet.height);
        bullet.collidableWith = "ship";
        bullet.type = "enemyBullet";
        pool[i] = bullet;
      }
    }
  };

  this.getPool = function() {
    var obj = [];
    for (var i = 0; i < size; i++) {
      if(pool[i].alive) {
        obj.push(pool[i]);
      }
    }
    return obj;
  }


  this.get = function(x, y, speed) {						
    if(!pool[size - 1].alive) {
      pool[size - 1].spawn(x, y, speed);
      pool.unshift(pool.pop());
    }
  };

  this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
    if(!pool[size - 1].alive &&
       !pool[size - 2].alive) {
      this.get(x1, y1, speed1);
      this.get(x2, y2, speed2);
    }
  }

  this.animate = function() {
    for (var i = 0; i < size; i++) {
      // Only draw until we find a bullet that is not alive
      if (pool[i].alive) {
        if(pool[i].draw()) {
          pool[i].clear();
          pool.push(pool.splice(i,1)[0]);
        }
      } else {
        break;
      }
    }
  };
}

function Game() {
  
  this.init = function() {

    this.playerLives = 3;
    this.playerScore = 0;

    this.bgCanvas = document.getElementById('background');
    this.shipCanvas = document.getElementById('ship');
    this.mainCanvas = document.getElementById('main');
    
    // test to see if canvas is supported
    if(this.bgCanvas.getContext) {
      this.bgContext = this.bgCanvas.getContext('2d');
      this.shipContext = this.shipCanvas.getContext('2d');
      this.mainContext = this.mainCanvas.getContext('2d');
      
      Background.prototype.context = this.bgContext;
      Background.prototype.canvasWidth = this.bgCanvas.width;
      Background.prototype.canvasHeight = this.bgCanvas.height;
      
      Ship.prototype.context = this.shipContext;
      Ship.prototype.canvasWidth = this.shipCanvas.width;
      Ship.prototype.canvasHeight = this.shipCanvas.height;

      Bullet.prototype.context = this.mainContext;
      Bullet.prototype.canvasWidth = this.mainCanvas.width;
      Bullet.prototype.canvasHeight = this.mainCanvas.height;

      Enemy.prototype.context = this.mainContext;
      Enemy.prototype.canvasWidth = this.mainCanvas.width;
      Enemy.prototype.canvasHeight = this.mainCanvas.height;

      
      this.background = new Background();
      this.background.init(0,0); // set draw point to 0,0
      
      this.level = 1;

      this.ship = new Ship();
      // set the ship to start near the bottom middle of the canvas
      this.shipStartX = this.shipCanvas.width/2 - imageRepository.spaceship.width/2;
      this.shipStartY = this.shipCanvas.height - imageRepository.spaceship.height;
      this.ship.init(this.shipStartX, this.shipStartY, imageRepository.spaceship.width, imageRepository.spaceship.height);

      this.enemyPool = new Pool(30);
      this.enemyPool.init("enemy");															
      this.spawnWave();
      this.enemyBulletPool = new Pool(50);
      this.enemyBulletPool.init("enemyBullet");
	  
      // Start QuadTree
      this.quadTree = new QuadTree({x:0,y:0,width:this.mainCanvas.width,height:this.mainCanvas.height});

      this.check = window.setInterval(function() {checkReadyState()}, 1000);

      return true;
    } else {
      return false;
    }
  };
  
  // Spawn a new wave of enemies
  this.spawnWave = function() {
    var height = imageRepository.enemy.height;
    var width = imageRepository.enemy.width;
    var x = 40;
    var y = -height;
    var spacer = y * 2;
      for (var i = 1; i <= 15; i++) {
        this.enemyPool.get(x,y,2);
        x += width + 25;
        if(i % 5 == 0) {									
          x = 40;
          y += spacer;
        }
      }
  };

  // start game animation
  this.start = function() {
    this.ship.draw();
    animate();
  };

  this.gameOver = function() {
    game.playerLives = 3;
    document.getElementById('game-over').style.display = "block";
    return true;
  };

  // Restart the game
  this.restart = function(condition) {
    condition = condition || "";
    
    this.bgContext.clearRect(0,0, this.bgCanvas.width, this.bgCanvas.height);
    this.shipContext.clearRect(0,0, this.shipCanvas.width, this.shipCanvas.height);
    this.mainContext.clearRect(0,0, this.mainCanvas.width, this.mainCanvas.height);
    this.quadTree.clear();
    this.background.init(0,0);
    this.ship.init(this.shipStartX, this.shipStartY, imageRepository.spaceship.width, imageRepository.spaceship.height);
    this.enemyPool.init("enemy");
    this.spawnWave();
    this.enemyBulletPool.init("enemyBullet");

   for(var i = 1, lives = ""; i <= game.playerLives; i++) {
      lives += '<img src="live.png" />';
    }
    document.getElementById('lives').innerHTML = lives;

    if(condition !== "continue") {
      document.getElementById('game-over').style.display = "none";

      this.playerScore = 0;
      this.playerLives = 5;
      this.level = 1;
      this.background.speed = 1;
      this.start();
    }
  }
}

function checkReadyState() {
  
    window.clearInterval(game.check);
    document.getElementById('loading').onclick = function() {
      document.getElementById('loading').style.display = "none";
      game.start();      
    }  
}

function animate() {

  document.getElementById('score').innerHTML = game.playerScore;
  document.getElementById('level').innerHTML = game.level;

  // Insert objects into quadtree						
  game.quadTree.clear();
  game.quadTree.insert(game.ship);
  game.quadTree.insert(game.ship.bulletPool.getPool());
  game.quadTree.insert(game.enemyPool.getPool());
  game.quadTree.insert(game.enemyBulletPool.getPool());

  detectCollision();

  if (game.enemyPool.getPool().length === 0) {
    game.spawnWave();
    game.level += 1;
    game.background.speed = game.level;
    document.getElementById('level-up').style.display = "block";
    setTimeout(function() {
      document.getElementById('level-up').style.display = "none";
    }, 1000);
  }
  // Animate game objects
  if (game.ship.alive) {
    requestAnimFrame(animate);

    game.background.draw();
    game.ship.move();
    game.ship.bulletPool.animate();
    game.enemyPool.animate();
    game.enemyBulletPool.animate();
  }

}

function detectCollision(){
  var objects = [];
  game.quadTree.getAllObjects(objects);

  for (var x = 0, len = objects.length; x < len; x++) {
    game.quadTree.findObjects(obj = [], objects[x]);

    for (var y = 0, length = obj.length; y < length; y++) {
      // DETECT COLLISION ALGORITHM
      if (objects[x].collidableWith === obj[y].type &&
          (objects[x].x < obj[y].x + obj[y].width &&
           objects[x].x + objects[x].width > obj[y].x &&
           objects[x].y < obj[y].y + obj[y].height &&
           objects[x].y + objects[x].height > obj[y].y)) {

          objects[x].isColliding = true;
        obj[y].isColliding = true;

      }
    }
  }
}

// Collision detection
/**
 * QuadTree object.
 *
 * The quadrant indices are numberes as below:												
 *      |  
 *   1  |  0
 *  ----+----
 *   2  |  3
 *      |
 */
function QuadTree(boundBox, lvl) {
  var maxObjects = 10;
  this.bounds = boundBox || {
    x:0,
    y:0,
    width:0,
    height:0
  };
  var objects = [];
  this.nodes = [];
  var level = lvl || 0;
  var maxLevels = 5;

  // Clears the quadTree and all nodes of objects
  this.clear = function() {
    objects = [];
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear;
    }
    this.nodes = [];
  };

  // Get all objects in the QuadTree
  this.getAllObjects = function(returnedObjects) {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].getAllObjects(returnedObjects);
    }

    for (var i = 0, len = objects.length; i < len; i++) {
      returnedObjects.push(objects[i]);
    }

    return returnedObjects;
  };

  // Return all objects that the object could collide with
  this.findObjects = function(returnedObjects, obj) {
    if (typeof obj === "undefined") {
      console.log("UNDEFINED OBJECT");
      return;
    }

    var index = this.getIndex(obj);
    if(index != -1 && this.nodes.length) {
      this.nodes[index].findObjects(returnedObjects, obj);
    }

    for (var i = 0, len = objects.length; i < len; i++) {
      returnedObjects.push(objects[i]);
    }
    return returnedObjects;
  };

  /**
   * Insert the object into the QuadTree.
   * If the tree excedes the capacity, it will split
   * and all objects to their corresponding nodes.
   */
  this.insert = function(obj) {
    if (typeof obj === "undefined") {
      return;
    }

    if (obj instanceof Array) {
      for (var i = 0, len = obj.length; i < len; i++) {
        this.insert(obj[i]);
      }
      return;
    }

    if(this.nodes.length) {
      var index = this.getIndex(obj);
      // Only add the object to a subnode if it can fit complelely within one
      if(index != -1) {
        this.nodes[index].insert(obj);
        return;
      }
    }

    objects.push(obj);

    // Prevent infinite splitting
    if (objects.length > maxObjects && level < maxLevels) {
      if (this.nodes[0] == null) {
        this.split();
      }

      var i = 0;
      while (i < objects.length) {
        var index = this.getIndex(objects[i]);
        if (index != -1) {
          this.nodes[index].insert((objects.splice(i,1))[0]);
        } else {
          i++;
        }
      }
    }
  };

  /**
   * Determine which node the object belongs to. -1 means object cannot
   * completely fit within a node and is part of the current node
   */
  this.getIndex = function(obj) {
    var index = -1;
    var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

    // Object can fit completely within the top quadrant
    var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
    // Object can fit completely within the bottom quadrant
    var bottomQuadrant = (obj.y > horizontalMidpoint);

    // Object can fit completely within the left quadrants
    if (obj.x < verticalMidpoint &&
        obj.x + obj.width < verticalMidpoint) {
      if (topQuadrant) {
        index = 1;
      } else if (bottomQuadrant) {
        index = 2;
      }
    }

    // Object can fit completely within the right quadrants
    else if (obj.x >verticalMidpoint) {
      if (topQuadrant) {
        index = 0;
      } else if (bottomQuadrant) {
        index = 3;
      }
    }
    return index;
  };

  /**
   * Splits the node into 4 subnodes
   */
  this.split = function() {
    // Bitwise or [html5rocks]
    var subWidth = (this.bounds.width / 2) | 0;
    var subHeight = (this.bounds.height / 2) | 0;

    this.nodes[0] = new QuadTree({
      x: this.bounds.x + subWidth,
      y: this.bounds.y,
      width: subWidth,
      height: subHeight
    }, level+1);
    this.nodes[1] = new QuadTree({
      x: this.bounds.x,
      y: this.bounds.y,
      width: subWidth,
      height: subHeight
    }, level+1);
    this.nodes[2] = new QuadTree({
      x: this.bounds.x,
      y: this.bounds.y + subHeight,
      width: subWidth,
      height: subHeight
    }, level+1);
    this.nodes[3] = new QuadTree({
      x: this.bounds.x + subWidth,
      y: this.bounds.y + subHeight,
      width: subWidth,
      height: subHeight
    }, level+1);
  }

}

window.requestAnimFrame = (function(){
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame || 
    window.oRequestAnimationFrame || 
    window.msRequestAnimationFrame || 
    function(/* function */ callback, /* DOMElement */ element) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

 //map keys
KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
};

KEY_STATUS = {};
for(code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}

document.onkeydown = function(e) {
  // Firefox and opera use charCode instead of keyCode
  // to return which key was pressed.
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if(KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
};

document.onkeyup = function(e) {								
  // firefox and opera again...
  var keyCode = e.keyCode ? e.keyCode : e.charCode;
  if(KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
};

document.onkeypress = function(e) {
  if(e.which === 114 && document.getElementById('game-over').style.display === "block") { // "r" to restart the game
    game.restart();
  }
}