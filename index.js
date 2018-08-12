/**
 * Generate random 2D points. 
 */
var generate_points = function(n) {
  var dataset = []
  for (var i = 0; i < n; i++) {
    var x = d3.randomNormal(5,10)();
    var y = d3.randomNormal(3,10)();
    dataset.push({"x": x, "y": y});
  }
  return dataset;
};



var get_means = function(dataset) {

    return {
        "x" : d3.mean(dataset.map(function(d) {return d.x})),
        "y" : d3.mean(dataset.map(function(d) {return d.y}))    
    };
}


/**
 * Returns Euclidean distance between two 2D points.
 * @param {JSON} point1 object with two keys: x, y
 * @param {JSON} point2 object with two keys: x, y
 */
var euclidean_distance = function(point1, point2) {
  return Math.sqrt( (point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

var line = d3.line()
        .x(function(d) {return xScale(d.x)})
        .y(function(d) {return yScale(d.y)});


var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// set the ranges
var xScale = d3.scaleLinear().range([0, width]);
var yScale = d3.scaleLinear().range([height, 0]);

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var my_svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);


var intervalId = null;
  



d3.select("#generate")
    .on("click", function() {

        // Clean previous state.
        if(intervalId != null) {
            clearInterval(intervalId);
        }
        my_svg.select("g").remove();

        // Generate new state.
        // Number of observations to generate.
        let numOfPoints = parseFloat(d3.select("#numOfGeneratedPoints").node().value);

        // Generate randoms points.
        let data = generate_points(numOfPoints);

        // Construct the fig.
        construct(data);
    });




function construct(data) {


    // scale the range of the data
    xScale.domain([-100, 100]);
    yScale.domain([-50, 50]);

    var svg = my_svg
    .append("g")
    .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    data.forEach(function(d) {
    d.x = +d.x;
    d.y = +d.y;
    });


    // add the dots
    svg.append("g").attr("id","dots")
        .selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r", 5)
        .attr("cx", function(d) { return xScale(d.x); })
        .attr("cy", function(d) { return yScale(d.y); });

    // add the X Axis
    svg.append("g")
        .attr("id", "xaxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    // add the Y Axis
    svg.append("g")
        .attr("id", "yaxis")
        .call(d3.axisLeft(yScale));

    var circle = svg.select("#dots").selectAll("circle");
    var means = get_means(circle.data());
    var shifted = data.map(function(d) {
      return {"x": d.x - means.x, "y": d.y - means.y};
    });
    
    circle.data(shifted);

    circle.transition()
        .duration(750)
        .attr("cx", function(d) { return xScale(d.x)})
        .attr("cy", function(d) { return yScale(d.y)});  

    var distance_from_center = function(point) {
      return euclidean_distance(point, {x: 0, y: 0});
    };
    

    setTimeout(() => {

      let distances = shifted.map(function(d) {return distance_from_center(d);});
      var normalised = shifted.map(function(d, i) {
        return {"x": d.x / distances[i], "y": d.y / distances[i], "dist": distances[i]};
      });

      circle.data(normalised);

      circle.transition()
          .duration(2000)
          .attrTween("fill", function() {
          return d3.interpolateRgb("black", "steelblue");
          })
          .transition()
          .duration(2050)
          .attr("cx", function(d) { return xScale(d.x)})
          .attr("cy", function(d) { return yScale(d.y) })
          .attr("r", 0.6);


        setTimeout(() => {

          let distances = normalised.map(function(d) { return distance_from_center(d)});
          let normalised_with_arc = normalised.map(function(d, i) {
            return {"x": d.x, "y": d.y, "dist": d.dist, "arc": Math.atan2(d.y, d.x)};
          }).sort(function(d) {
            return d.arc;
          });

          let linesGroup = svg.append("g");
          

          linesGroup.classed("lines", true);
          linesGroup.datum(normalised_with_arc);

          linesGroup
            .selectAll("path")
            .data(function(d) {return d;})
            .enter()
            .append("path")
            .attr("d", function(d) {
                return line([{"x": 0, "y": 0}, {"x": 40 * d.x, "y": 40 * d.y}])
            })
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 0.4)
            .attr("opacity", 0);
            
        }, 2000);

    }, 1000);


    setTimeout(() => {
      let allPaths = d3.select(".lines")
          .selectAll("path")
          .nodes()
          .sort(function(a, b) {
              let adata = d3.select(a).datum().arc,
                  bdata = d3.select(b).datum().arc;
              adata = adata < 0 ? 2 *  Math.PI - Math.abs(adata) : adata;
              bdata = bdata < 0 ? 2 *  Math.PI - Math.abs(bdata) : bdata;

              if(adata < bdata) return -1;
              if(adata > bdata) return 1;
              if(adata == bdata) return 0;
          });
      

      let i = 0;
      intervalId = setInterval(() => {
          
          d3.select(allPaths[i]).attr("opacity", 1);
          console.log(d3.select(allPaths[i]).datum().arc);
          i++;
          if(i == allPaths.length) {
              clearInterval(intervalId);
          }
      }, 100);

      let newLines = svg.append("g");
      newLines.classed("newLines", true);

      let linesData = d3.select(".lines")
          .datum();

      linesData.forEach(function(d) {
          d.arc = d.arc < 0 ? 2 * Math.PI - Math.abs(d.arc) : d.arc;
      });

      linesData.forEach(function(d) {
          d.end_x = 40 * d.x - Math.sin(d.arc) * d.dist;
      });

      linesData.forEach(function(d) {
          //let arc = d.arc < Math.PI ? d.arc : 2 * Math.PI - d.arc;
          d.end_y = d.end_x * Math.tan(d.arc) + d.dist / Math.cos(d.arc) ;
      });

      newLines.datum(linesData);
      newLines.selectAll("path")
          .data(function(d) {return d;})
          .enter()
          .append("path")
          .attr("d", function(d) {
              return line([{"x": 40 * d.x, "y": 40 * d.y}, {"x": d.end_x, "y": d.end_y}]);
          })
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", 0.4)
          .attr("opacity", 0);

      let lines_perpendicular = newLines.selectAll("path")
          .nodes()
          .sort(function(a, b) {
              let aarc = d3.select(a).datum().arc,
                  barc = d3.select(b).datum().arc;
              
              if(aarc < barc) return -1;
              if(aarc > barc) return 1;
              return 0;
          })
          ;

      setTimeout(() => {
          i = 0;
          intervalId = setInterval(() => {
              d3.select(lines_perpendicular[i]).attr("opacity", 1);
              i++;
              if(i == lines_perpendicular.length) {
                  clearInterval(intervalId);
              }
          }, 100);

          


      }, allPaths.length * 100 + 200)
      

      setTimeout(() => {

          let newdata = lines_perpendicular.map(function(d, i) {

              d = d3.select(d).datum();
              if(i == 0) {
                  d.new_start_x = 40 * d.x;
                  d.new_end_x = d.end_x;
                  d.new_start_y = 40 * d.y;
                  d.new_end_y = d.end_y;
              } else {
                  let previous = d3.select(lines_perpendicular[i-1]).datum();
                  let vec_x = previous.new_end_x - 40 * d.x,
                      vec_y = previous.new_end_y - 40 * d.y;
                  d.new_start_x = 40 * d.x + vec_x;
                  d.new_end_x = d.end_x + vec_x;
                  d.new_start_y = 40 * d.y + vec_y;
                  d.new_end_y = d.end_y + vec_y;
              }
              return d;
          });

          newLines.selectAll("path").data(newdata);

        let newExtentX = d3.extent(newdata.map(function(d) { return d.new_start_x; })
            ),
            newExtentY = d3.extent(newdata.map(function(d) { return  d.new_start_y; }));
        
        let extentAddX = 0.01 * (newExtentX[1] - newExtentX[0]),
            extentAddY = 0.01 * (newExtentY[1] - newExtentY[0]);

        newExtentX[0] = newExtentX[0] - extentAddX;
        newExtentX[1] = newExtentX[1] + extentAddX;
        newExtentY[0] = newExtentY[0] - extentAddY;
        newExtentY[1] = newExtentY[1] + extentAddY;
        

        if(newExtentX[0] < xScale.domain()[0] || newExtentX[1] > xScale.domain()[1] ||
            newExtentY[0] < yScale.domain()[0] || newExtentY[1] > yScale.domain()[1]) {

                console.log(newExtentX);
                console.log(newExtentY);

                let maxExtent = d3.max(
                    newExtentX.map(function(d) {return Math.abs(d);})
                    .concat(newExtentY.map(function(d) { return Math.abs(d); }))
                );


                newExtentY = [-maxExtent, maxExtent];
                newExtentX = newExtentY.map(function(d) {return 2 * d;})

                xScale.domain(newExtentX);
                yScale.domain(newExtentY);
                d3.select("#xaxis").transition()
                    .duration(2000)
                    .call(d3.axisBottom(xScale));
                d3.select("#yaxis").transition()
                    .duration(2000)
                    .call(d3.axisLeft(yScale));

        }

        d3.select("svg").select("g").append("g")
                .attr("id", "circles")
                .datum(newdata);
        
        d3.select("#circles")    
            .selectAll("circle")
            .data(function(d) {return d;})
            .enter()
            .append("circle")
            .attr("cx", function(d) {return xScale(d.new_end_x);})
            .attr("cy", function(d) {return yScale(d.new_end_y); })
            .attr("r", 2)
            .attr("fill", "red")
            .attr("opacity", 0);


        newLines.selectAll("path")
            .transition()
            .duration(2000)
            .attr("d", function(d) {
                return line([
                    {"x": d.new_start_x, "y": d.new_start_y},
                    {"x": d.new_end_x, "y": d.new_end_y}]
                );
            })
            .attr("stroke-width", 2);


        
        
        d3.select(".lines").selectAll("path").transition().duration(2000).attr("opacity", 0);

        d3.select("#dots").selectAll("circle").data(shifted);
        d3.select("#dots").selectAll("circle")
            .transition()
            .duration(2000)
            .attr("cx", function(d) {return xScale(d.x);})
            .attr("cy", function(d) {return yScale(d.y);})
            .attr("r", 3)
            .attr("fill", "black");
        


        d3.select("#circles").selectAll("circle")
            .transition()
            .duration(8000)
            .attr("opacity", 1);
    

        
          
          

      }, allPaths.length * 100 + 200 + lines_perpendicular.length * 100 + 200)
      
      

    }, 6000);

}

