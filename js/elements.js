var Elements = Class.extend({

    position : null,
    svg: null,
    size: null,

    init: function(size, position){
        this.position = position;
        this.size = size;
    },

    comparePosition: function(elementPosition){
        if(this.position.x == elementPosition.x && this.position.y == elementPosition.y)
            return true;
        return false;
    }
});

var MovingElements = Elements.extend({

    validMovement : {x:0,y:0},
    movement : {x:0,y:0},
    speed: null,

    init: function(size, position, speed){
        this._super(size, position);
        this.speed = speed;
    },

    move: function(movement){
        this.validMovement = movement;
        this.position = {x:this.position.x + (this.validMovement.x*this.speed), y : this.position.y + (this.validMovement.y*this.speed)};
        this.draw();
    },

    getNextPosition: function(movement){
        return {
            x: this.position.x + (movement.x*this.speed),
            y: this.position.y + (movement.y*this.speed)
        };
    }
});

var Pacman = MovingElements.extend({

    rayon: null,
    iscrunch: null,
    arc: null,
    interval: null,

    init: function(size, position, speed, svgArea){
        this._super(size, position, speed);
        this.rayon = (this.size * (1/2));
        this.arc = d3.svg.arc()
            .innerRadius(0)
            .outerRadius(this.rayon);

        var me = this;
        this.iscrunch = false;
        this.interval = setInterval(function(){me.crunch()}, 250);

        this.svg = svgArea.append("path")
            .datum({startAngle: 0, endAngle: 1.5*Math.PI})
            .attr("d", this.arc)
            .attr("transform", "translate("+this.position.x+","+this.position.y+")")
            .style("fill","#FFD700");
    },

    isPacman: function(){
        return true;
    },

    draw: function(){
        var rotation =  this.findRotation();
        var me = this;
        if(this.interval == false)
            this.interval = setInterval(function(){me.crunch()}, 250);
        // move svg
        this.svg.attr("transform", "translate("+this.position.x+","+this.position.y+") rotate("+rotation+")");
    },

    crunch: function(){
        var newStartAngle;
        var newEndAngle;

        if(this.iscrunch){
            newStartAngle = -0.25*Math.PI;
            newEndAngle = 1.75*Math.PI;
            this.iscrunch = false;
        }else{
            newStartAngle = 0;
            newEndAngle = 1.5*Math.PI;
            this.iscrunch = true;
        }
        this.svg.transition()
            .duration(250)
            .ease("linear")
            .call(this.arcTween, newStartAngle, newEndAngle, this.arc);
    },

    dead: function(){
        clearInterval(this.interval);
        this.interval = false;
        this.svg.transition()
            .duration(gameLoseBgTimer)
            .ease("linear")
            .call(this.arcTween, Math.PI, Math.PI, this.arc);
        window.setTimeout(this.isDead, gameLoseBgTimer);
    },

    isDead: function(){
        EventBus.dispatch("pacmanDead", null)
    },

    arcTween: function (transition, newStartAngle, newEndAngle, arc) {
        transition.attrTween("d", function(d) {
            var interpolate = d3.interpolate(d.endAngle, newEndAngle);
            var interpolate2 = d3.interpolate(d.startAngle, newStartAngle);
            return function(t) {
                d.endAngle = interpolate(t);
                d.startAngle = interpolate2(t);
                return arc(d);
            };
        });
    },

    findRotation: function(){
        if(this.validMovement.x == 1)
            return 135;
        if(this.validMovement.x == -1)
            return -45;
        if(this.validMovement.y == -1)
            return 45;
        if(this.validMovement.y == 1)
            return -135;
        return -45
    }
});

var Ghost = MovingElements.extend({

    rayon: null,
    name: null,
    path_bigline: [{x:350.7621, y:193.52242}, {x:0, y:88.1699},{x:35.7914, y:110.8994},{x:35.7914, y:151.79174},{x:0, y:22.68064},{x:-48.8838, y:6.13428},{x:-68.744, y:17.60056},{x:-18.4201, y:10.63485},{x:-10.8743, y:26.65472},{x:-37.3952, y:36.93284},{x:-19.0542, y:7.38443},{x:-44.4598, y:-26.28197},{x:-70.9798, y:-26.28197},{x:-21.1538, y:0},{x:-60.1969, y:28.37631},{x:-78.534, y:19.35723},{x:-18.3371, y:-9.01907},{x:-16.5978, y:-39.06597},{x:-44.949497, y:-41.96901},{x:-21.159, y:-2.16656},{x:-75.039118, y:27.11334},{x:-75.039118, y:4.4327},{x:0, y:-28.88522},{x:33.273238, y:-60.35212},{x:33.273238, y:-161.86409},{x:0, y:-98.341329},{x:68.673277, y:-178.154597},{x:153.288477, y:-178.154597},{x:84.6153, y:0},{x:153.2885, y:79.813268},{x:153.2885, y:178.154597}],
    path_eyes:[{x:138.02955,y:89.96716},{x:-20.56311,y:2e-5},{x:-37.25136,y:19.17438},{x:-37.25136,y:42.80137},{x:2e-5,y:23.62698},{x:16.68825,y:42.80137},{x:37.25136,y:42.80137},{x:15.88829,y:1e-5},{x:29.45986,y:-11.46059},{x:34.81114,y:-27.56439},{x:5.35129,y:16.1038},{x:18.92284,y:27.5644},{x:34.81115,y:27.56439},{x:20.56311,y:0},{x:37.25136,y:-19.17439},{x:37.25135,y:-42.80137},{x:0,y:-23.62699},{x:-16.68825,y:-42.80135},{x:-37.25135,y:-42.80137},{x:-15.88517,y:0},{x:-29.45768,y:11.42732},{x:-34.81115,y:27.52611},{x:-5.35347,y:-16.09879},{x:-18.92597,y:-27.52611},{x:-34.81114,y:-27.52611}],
    path_eye_center1:[{x:214.94527,y:140.13128}, {x:16.129736, y:16.195543, param:'0 0 1', x1:-32.25947, y1:0}, {x:16.129736 ,y:16.195543, param:'0 1 1', x1:32.25947, y1:0}],
    path_eye_center2:[{x:163.7592,y:140.13128}, {x:16.129736, y:16.195543, param:'0 0 1', x1:-32.25947, y1:0}, {x:16.129736 ,y:16.195543, param:'0 1 1', x1:32.25947, y1:0}],
    colors : {'ghost0':'#E51F1E', 'ghost1':'#F05597', 'ghost2':'#6BCCDD', 'ghost3':'#F4771D'},

    init: function(size, position, speed, svgArea, name){
        this._super(size, position, speed);
        //this.position = {x: position.x ,y: position.y-10};
        this.name = name;
        this.resize = 3/7;
        color = this.colors[this.name];
        svgArea.append('path')
            .attr("class", this.name)
            .attr("style","fill:"+color+";fill-rule:nonzero;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1")
            .attr('d', this.constructPath(this.path_bigline, this.size * this.resize))
            .attr("transform",this.getTranslate());

        svgArea.append('path')
            .attr("class", this.name)
            .attr("style","fill:#ffffff;fill-opacity:0.62745098;fill-rule:nonzero;stroke:#000000;stroke-width:1;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1")
            .attr('d', this.constructPath(this.path_eyes, this.size * this.resize))
            .attr("transform",this.getTranslate());

        svgArea.append('path')
            .attr("class", this.name)
            .attr("style","fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none")
            .attr('d', this.constructPathEyes(this.path_eye_center1, this.size * this.resize))
            .attr("transform", this.getTranslate());

        svgArea.append('path')
            .attr("class", this.name)
            .attr("style","fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none")
            .attr('d', this.constructPathEyes(this.path_eye_center2, this.size * this.resize))
            .attr("transform", this.getTranslate());

        this.setNewRandomMovement();
    },

    isPacman: function(){
        return false;
    },

    draw: function(){
        d3.selectAll('.'+this.name)
            .attr("transform", this.getTranslate())
    },

    getTranslate: function(){
        return "translate("+(this.position.x - (this.size / 2))+","+(this.position.y - (this.size / 2))+")";
    },

    constructPath: function(array, size){
        var pathData = "";
        array.forEach(function(e,i){
            //e.x = e.x + 10;
            if(i == 0)
                pathData += "M "+e.x/size+","+ e.y/size+" c ";
            else
                pathData += +e.x/size+","+ e.y/size+" ";
        });
        pathData += " ";
        return pathData;
    },

    constructPathEyes: function(array, size){
        var pathData = "";
        array.forEach(function(e,i){
            //e.y = e.y + 10;
            if(i == 0)
                pathData += "M "+e.x/size+","+ e.y/size+" a ";
            else
                pathData += +e.x/size+","+ e.y/size+" "+ e.param +" "+ e.x1/size+","+ e.y1/size+ " ";
        });
        pathData += " z";
        return pathData;
    },

    setNewRandomMovement: function(){
        this.movement = this.getRandomMovement();
        return this.movement;
    },
    getRandomMovement: function() {
        var randomMovement = {x:this.getRandom(), y:this.getRandom()};
        if(randomMovement.x == 0 && randomMovement.y == 0)
            return this.getRandomMovement();
        return randomMovement;
    },
    compareMovement: function(mvt){
        if(mvt.x == this.movement.x && mvt.y == this.movement.y)
            return true;
        return false;
    },
    getRandom: function(){
        var min = -1, max = 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
});