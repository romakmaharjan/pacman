var Labyrinth = Elements.extend({

    map: [],
    pathLength: null,
    pacmanStartPosition: null,
    ghostsStartPosition: [],
    cheeses: {},
    totalCheese : 0,

    init: function(size, svgArea, callback){
        this.svg = svgArea;
        this.pathLength = size;
        this.loadFile('labyrinth/1.map', callback);
    },

    loadFile: function(file, callback){
        var me = this;
        d3.text(file, function(error, text){
            if(error != null)
                alert('error '+error);
            else{
                console.info(text);
                me.parseFile(text);
                callback();
            }
        });
    },

    parseFile:function(text){
        var lines = text.split("\r\n");
        var i = 0;
        var me = this;
        lines.forEach(function(entry){
            me.map[i] = entry.split('');
            i++;
        });
        this.drawPaths(this.map);
    },

    drawPaths: function(map){
        for(i=0 ; i < map.length; i++){
            for(j=0 ; j < map[i].length; j++){
                if(i == (map.length -1) || j == (map[i].length -1)){
                    //console.log("last square ");
                }else{

                    if(map[i][j] == 'P')
                        this.pacmanStartPosition = {y: i * this.pathLength, x: j * this.pathLength};

                    if(map[i][j] == 'G')
                        this.ghostsStartPosition.push({y: i * this.pathLength, x: j * this.pathLength });

                    var a = {value : map[i][j], y: this.dimension(i), x: this.dimension(j)};
                    var b = {value : map[i+1][j], y: this.dimension(i+1), x: this.dimension(j)};
                    var c = {value : map[i+1][j+1], y: this.dimension(i+1), x: this.dimension(j+1)};
                    var d = {value : map[i][j+1], y: this.dimension(i), x: this.dimension(j+1)};

                    if(a.value != '0' && a.value != '-'){
                        this.cheeses["cheese_"+i+"_"+j] = this.svg.append("rect")
                            .attr("x", a.x - this.pathLength / 6)
                            .attr("y", a.y - this.pathLength / 6)
                            .attr("width", this.pathLength / 3)
                            .attr("height", this.pathLength / 3)
                            .attr("class", "cheese")
                            .attr("id","cheese_"+i+"_"+j);
                    }

                    if(a.value == '0' && d.value == '0'){
                        this.svg.append("path")
                            .attr("d","M "+a.x+" "+a.y+" L "+d.x+" "+d.y+"")
                            .attr("class", "line");
                    }
                    if(a.value == '0' && b.value == '0'){
                        this.svg.append("path")
                            .attr("d","M "+a.x+" "+a.y+" L "+b.x+" "+b.y+"")
                            .attr("class", "line");
                    }
                    if(b.value == '0' && c.value == '0'){
                        this.svg.append("path")
                            .attr("d","M "+b.x+" "+b.y+" L "+c.x+" "+c.y+"")
                            .attr("class", "line");
                    }
                    if(c.value == '0' && d.value == '0'){
                        this.svg.append("path")
                            .attr("d","M "+c.x+" "+c.y+" L "+d.x+" "+d.y+"")
                            .attr("class", "line");
                    }
                }
            }
        }
        this.totalCheese = this.size(this.cheeses);
        EventBus.dispatch("cheeseTotal", this.totalCheese);
    },

    isCollision: function(element, movement){
        var nextPosition = element.getNextPosition(movement);

        leftUp = {
            x: Math.floor(nextPosition.x/this.pathLength),
            y: Math.floor(nextPosition.y/this.pathLength)
        };

        rightDown = {
            x: Math.floor((nextPosition.x + this.pathLength - 1)/this.pathLength),
            y: Math.floor((nextPosition.y + this.pathLength - 1)/this.pathLength)
        };

        var y,x;

        // eat cheese if pacman
        if(element.isPacman())
            this.isCheese(nextPosition, element);

        for(y=leftUp.y;y<=rightDown.y;y++)
        {
            for(x=leftUp.x;x<=rightDown.x;x++)
            {
                if(this.map[y][x] == '0')
                    return true;
            }
        }
        return false;
    },

    isCheese: function(position, element){
        var middleX = 0, middleY = 0;

        if(element.movement.x == -1)
            middleX = this.pathLength - 1;

        if(element.movement.y == -1)
            middleY = this.pathLength - 1;

        var middle = {
            x: Math.floor((position.x + middleX)/this.pathLength),
            y: Math.floor((position.y + middleY)/this.pathLength)
        };

        if(this.map[middle.y][middle.x] != 'E' && this.map[middle.y][middle.x] != '0'){
            this.map[middle.y][middle.x] = 'E';
            var sibling = this.cheeses['cheese_'+middle.y+'_'+middle.x];
            if(sibling != null){
                var svgEl = sibling.attr('opacity', 0);
                delete this.cheeses['cheese_'+middle.y+'_'+middle.x];
            }
            var cheeseNotEated= this.size(this.cheeses);
            EventBus.dispatch("cheeseEated", this.totalCheese - cheeseNotEated);
            if(cheeseNotEated == 0)
                EventBus.dispatch("win", null);
        }
    },

    size: function(json){
        var key, count = 0;
        for(key in json) {
            if(json.hasOwnProperty(key)) {
                count++;
            }
        }
        return count;
    },

    dimension: function (x){
        return x * this.pathLength;
    },

    getWidth: function(){
        return this.map[0].length * this.pathLength;
    }
});