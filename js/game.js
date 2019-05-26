var gameLoseBgTimer=3000;
var Game = Class.extend({

    time: null,
    isPlaying: false,
    interval: null,
    svg: null,

    labyrinth: null,
    pacman: null,
    ghosts: [],
    width: 1200,
    height: 500,

    fps: 60,
    now: null,
    then: null,
    intervalFps: 200,
    delta: null,
    info: {
        time: null,
        cheeseEated: 0,
        cheeseTotal: null,
        life: 3
    },
    counter: 0,
    first: null,

    init: function (size) {

        console.log("init Game with size " + size);
        this.intervalFps = this.intervalFps / this.fps;
        this.then = Date.now();
        this.first = this.then;

        this.size = size,

            // Prepare game area
            this.svg = d3.select("#game")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        var me = this;

        // Prepare Labyrinth
        this.labyrinth = new Labyrinth(this.size, this.svg, function () {
            me.pacman = new Pacman(me.size, me.labyrinth.pacmanStartPosition, 2, me.svg);
            me.labyrinth.ghostsStartPosition.forEach(function (ghostPosition, i) {
                me.ghosts.push(new Ghost(size, ghostPosition, 2, me.svg, 'ghost' + i));
            })
        });

        document.onkeydown = this.keyEvent;

        EventBus.addEventListener("timeChanged", this.timeChanged, this);
        EventBus.addEventListener("cheeseEated", this.cheeseEated, this);
        EventBus.addEventListener("cheeseTotal", this.cheeseTotal, this);
        EventBus.addEventListener("displayInfo", this.displayInfo, this);
        EventBus.addEventListener("loose", this.loose, this);
        EventBus.addEventListener("win", this.win, this);
        EventBus.addEventListener("pacmanDead", this.pacmanDead, this);
    },
    timeChanged: function (event) {
        this.info.time = parseInt(event.target);
    },
    cheeseEated: function (event) {
        this.info.cheeseEated = event.target;
    },
    cheeseTotal: function (event) {
        this.info.cheeseTotal = event.target;
    },
    displayInfo: function () {
        document.getElementById('info').innerHTML = "<h2>Pacman</h2><h2>" + this.info.time + " sec</h2><h2 class=\"life\">" + this.info.life + "</h2><h2>" + this.info.cheeseEated + "/" + this.info.cheeseTotal + "</h2>";
    },
    start: function () {
        if (this.info.life == 0) {
            window.location.reload();
        } else {
            this.time = Date.now();
            this.isPlaying = true;
            this.play(this);
        }
    },
    getBody: function () {
        return document.getElementsByTagName('body')[0];
    },
    setBackground: function (newColor) {
        var color = this.getBody().style.backgroundColor;
        this.getBody().style.backgroundColor = newColor;
        var me = this;
        window.setTimeout(function () {
            me.getBody().style.backgroundColor = color;
        }, gameLoseBgTimer);
    },

    play: function () {
        var me = this;
        if (this.isPlaying) {
            window.setTimeout(me.play.bind(this), 1e3 / 1120);
            me.now = Date.now();
            me.delta = me.now - me.then;
            //console.log(delta);

            if (me.delta > me.intervalFps) {
                // update time stuffs

                // Just `then = now` is not enough.
                // Lets say we set fps at 10 which means
                // each frame must take 100ms
                // Now frame executes in 16ms (60fps) so
                // the loop iterates 7 times (16*7 = 112ms) until
                // delta > interval === true
                // Eventually this lowers down the FPS as
                // 112*10 = 1120ms (NOT 1000ms).
                // So we have to get rid of that extra 12ms
                // by subtracting delta (112) % interval (100).
                // Hope that makes sense.

                me.then = me.now - (me.delta % me.intervalFps);
                me.movePacman();
                me.ghosts.forEach(function (ghost) {
                    me.moveGhost(ghost);
                })
                var time_el = (me.then - me.first) / 1000;
                EventBus.dispatch("timeChanged", time_el);
                EventBus.dispatch("displayInfo", null);
            }
        }
    },

    loose: function () {
        this.stop();
        if (this.info.life > 1)
            this.setBackground('red');
        this.pacman.dead();
    },

    pacmanDead: function () {
        if (this.info.life == 1) {
            this.getBody().style.backgroundColor = 'red';
            this.info.life = 0;
            this.displayInfo();
        } else {
            this.info.life--;
            this.pacman.movement = {
                x: 0,
                y: 0
            };
            this.pacman.position = this.labyrinth.pacmanStartPosition;
            var me = this;
            this.labyrinth.ghostsStartPosition.forEach(function (ghostPosition, i) {
                me.ghosts[i].position = ghostPosition;
            })
            this.start();
        }
    },

    win: function () {
        this.stop();
        alert('WIN !! ;)')
    },

    stop: function () {
        this.isPlaying = false;
        clearInterval(this.interval);
    },

    keyEvent: function (e) {
        e = e || window.event;
        if (e.keyCode == 37) {
            game.pacman.movement = {
                x: -1,
                y: 0
            };
        } else if (e.keyCode == 38) {
            game.pacman.movement = {
                x: 0,
                y: -1
            };
        } else if (e.keyCode == 39) {
            game.pacman.movement = {
                x: 1,
                y: 0
            };
        } else if (e.keyCode == 40) {
            game.pacman.movement = {
                x: 0,
                y: 1
            };
        } else if (e.keyCode == 32 && game.isPlaying) {
            game.stop();
        } else if (e.keyCode == 32 && !game.isPlaying) {
            game.start();
        }
    },

    movePacman: function () {
        if (!this.labyrinth.isCollision(this.pacman, this.pacman.movement))
            this.moveElement(this.pacman, this.pacman.movement);
        else {
            if (!this.labyrinth.isCollision(this.pacman, this.pacman.validMovement))
                this.moveElement(this.pacman, this.pacman.validMovement);
        }
        this.isCollisionWithGhost();
    },

    isCollisionWithGhost: function () {
        var pacmanExt = this.getExtrimity(this.pacman);
        var me = this;
        this.ghosts.forEach(function (ghost) {
            var ghostExt = me.getExtrimity(ghost);
            if (ghostExt.left < pacmanExt.right &&
                ghostExt.right > pacmanExt.left &&
                ghostExt.up < pacmanExt.down &&
                ghostExt.down > pacmanExt.up)
                EventBus.dispatch("loose", null);
        });
    },

    getExtrimity: function (elt) {
        return {
            left: elt.position.x - this.size,
            right: elt.position.x,
            up: elt.position.y - this.size,
            down: elt.position.y
        };
    },

    moveGhost: function (ghost) {
        var me = this;
        /*var movements = new Array();
        var totalMvt = [{x:-1,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1}];
        totalMvt.forEach(function(mvt){
            if(mvt.x == (-ghost.movement.x) && mvt.y == ghost.movement.y
                || (mvt.y == (-ghost.movement.y) && mvt.x == ghost.movement.x)){
                console.log(JSON.stringify(mvt));
                console.log(JSON.stringify(ghost.movement));
            }else
                movements.push(mvt);

        });
        movements.forEach(function(mvt){
            if(!me.labyrinth.isCollision(ghost, mvt)){
                me.moveElement(ghost, mvt);
                return;
            }
        });*/
        while (true) {
            if (!me.labyrinth.isCollision(ghost, ghost.movement))
                break;
            else
                ghost.setNewRandomMovement();
        }
        this.moveElement(ghost, ghost.movement);
    },

    findMovementAvailable: function (position) {

    },

    isCollision: function (elt, mvt) {
        return this.labyrinth.isCollision(elt, mvt);
    },

    moveElement: function (elt, mvt) {
        if ((mvt.x + elt.position.x) < 0)
            elt.position.x = this.labyrinth.getWidth();

        if ((mvt.y + elt.position.x) > this.labyrinth.getWidth())
            elt.position.x = 0;

        elt.move(mvt);
    }
});
