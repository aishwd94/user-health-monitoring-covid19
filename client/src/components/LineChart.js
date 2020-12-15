import React, { useEffect } from 'react';
import * as d3 from 'd3';


function LineChart(props) {
    const { data, width, height , style } = props;

    useEffect(() => {
        drawChart();
    }, [data]);
    
    function hover(svg, path, x_scaler, y_scaler) {
        
        if ("ontouchstart" in document) svg
            .style("-webkit-tap-highlight-color", "transparent")
            .on("touchmove", moved)
            .on("touchstart", entered)
            .on("touchend", left)
        else svg
            .on("mousemove", moved)
            .on("mouseenter", entered)
            .on("mouseleave", left);
        
        const dot = svg.append("g")
            .attr("display", "none");
        
        dot.append("circle")
            .attr("r", 2.5);
        
        dot.append("text")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "middle")
            .attr("y", -8);
        
        function moved(event) {
            event.preventDefault();
            const pointer = d3.pointer(event, this);
            const xm = x_scaler.invert(pointer[0]);
            const ym = y_scaler.invert(pointer[1]);
            const i = d3.bisectCenter(data.dates, xm);
            const s = d3.least(data.series, d => Math.abs(d.values[i] - ym));
            path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
            dot.attr("transform", `translate(${x_scaler(data.dates[i])},${y_scaler(s.values[i])})`);
            dot.select("text").text(s.name);
        }
        
        function entered() {
            path.style("mix-blend-mode", null).attr("stroke", "#ddd");
            dot.attr("display", null);
        }
        
        function left() {
            path.style("mix-blend-mode", "multiply").attr("stroke", null);
            dot.attr("display", "none");
        }
        }
    
    function drawChart(){
        
            d3.select("#line_container").select('svg').remove();
            
            //debugger;
            var margin = {top: 20, right: 20, bottom: 20, left: 40}
            
            
            //  An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
            
            var dataset = data.x.map((x,i) => ({ "x" : x , "y": data.y[i] }) )
            
            //console.log(dataset)
             console.log(d3.extent(data.x))
            
            // 5. X scale will use the index of our data
            var xScale = d3.scaleTime()
                .domain(d3.extent(dataset.map(p => p.x))) // input
                .range([margin.left, width - margin.right]); // output
            
            // 6. Y scale will use the randomly generate number 
            var yScale = d3.scaleLinear()
                .domain(d3.extent(dataset.map(p => p.y))) // input 
                .range([height - margin.bottom, margin.top]); // output 
            
            // 7. d3's line generator
            var line = d3.line()
                .defined(d => !isNaN(d.y))
                .x((d)    =>  xScale(d.x)   ) // set the x values for the line generator
                .y((d)    =>  yScale(d.y) ) // set the y values for the line generator 
                .curve(d3.curveLinear) // apply smoothing to the line
            
            
            
            
            // 1. Add the SVG to the page and employ #2
            var svg = d3.select("#line_container").append("svg")
                .attr("viewBox", [0, 0, width, height])
                //.append("g")
                //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            // 3. Call the x axis in a group tag
            //svg.append("g")
            //    .attr("class", "x axis")
            //    .attr("transform", "translate(0," + height + ")")
            //    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom
            
            
            const xAxis = g => g
                    .attr("transform", `translate(0,${height - margin.bottom})`)
                    .call(d3.axisBottom(xScale).ticks(width / 80).tickSizeOuter(0))
            
            svg.append("g")
                .call(xAxis);
            
            
            
            
            // 4. Call the y axis in a group tag
            //svg.append("g")
            //    .attr("class", "y axis")
            //    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft
            
            
            
             
             const yAxis = g => g
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(d3.axisLeft(yScale))
                    .call(g => g.select(".domain").remove())
            //    .call(g => g.select(".tick:last-of-type text").clone()
            //    .attr("x", 3)
            //    .attr("text-anchor", "start")
            //    .attr("font-weight", "bold")
            //    .text(data.y))
            
            svg.append("g")
                .call(yAxis);
            
            
            // 9. Append the path, bind the data, and call the line generator 
            //svg.append("path")
            //    .datum(dataset) // 10. Binds data to the line 
            //    .attr("class", "line") // Assign a class for styling 
            //    .attr("d", line); // 11. Calls the line generator 
            
              svg.append("path")
                .datum(dataset)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("d", line);
            
            // 12. Appends a circle for each datapoint 
            svg.selectAll(".dot")
            .data(dataset)
            .enter().append("circle") // Uses the enter().append() method
                .attr("fill", "#000000")
                .attr("stroke","#fff")  
                .attr("cx", function(d, i) { return xScale(d.x) })
                .attr("cy", function(d) { return yScale(d.y) })
                .attr("r", 3)
                .on("mouseover", function(a, b, c) { 
                        console.log(a) 
                    //this.attr('class', 'focus')
                    })
                .on("mouseout", function() {  })
                
             

             // Create a rect on top of the svg area: this rectangle recovers mouse position
                
    }
    return <div id="line_container" />;
}

export default LineChart;