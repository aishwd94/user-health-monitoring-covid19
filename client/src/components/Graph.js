import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Row,Col,Container,Form,Button, Tab, Tabs} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import axios from 'axios';
import * as d3 from 'd3';



class Graph extends React.Component {
    state = {updating : false, no_data:true };


    constructor(props){
        super(props);
        this.loadRefreshGraph = this.loadRefreshGraph.bind(this);
    }
    
    componentDidMount(){
        
        this.loadRefreshGraph();
    }
    
    loadRefreshGraph(){
        
        this.setState({updating:true})
        axios.get(`http://localhost:5000/get_graph` )
        .then((resp) => {
            console.log(resp.data);
            //debugger;
            if(resp.data.overlap == 'success')
            {
                
                this.setState({data:resp.data})
                this.setState({no_data:false})
                this.drawGraph(resp.data.graph)
            }
            else{
                this.setState({no_data:true})
            }
            this.setState({updating:false})
            
        } )
        
        
    }
    
    
    componentWillReceiveProps(props) {
    const { counter } = this.props;
    if (props.counter != counter) {
        this.loadRefreshGraph()
    }
    }
    
    drawGraph(data){
        
        
        d3.select("#graph_container").select('svg').remove();
        
        const color = () => {
            const scale = d3.scaleOrdinal(d3.schemeCategory10);
            return d => scale(d.id);
        }
        
        console.log(data)
        
        
        const drag = simulation => {
  
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
            
            
        }
            
        const height = 600;
        const width = 600;
       
        
        const links = data.links.map(d => Object.create(d));
        const nodes = data.nodes.map(d => Object.create(d));
        
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));
        
        const svg = d3.select('#graph_container').append("svg")
            .attr("viewBox", [0, 0, width, height]);
        
        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.weight));
        
        const node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 8)
            .attr("fill", color)
            .call(drag(simulation));
        
        node.append("text")
                .text(d =>  d.id)
                .attr('x', 6)
                .attr('y', 3)
                .style("font-size",'10px');
        
        node.append("title")
            .text(d => d.id);
        
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });
        
    }
    
    
    
        getHeader(){
            var keys = this.getKeys(this.state.data.graph.nodes);
            return keys.map((key, index)=>{
            return <th key={key}>{key.toUpperCase()}</th>
            })
        }
        
        getKeys(items){
            return Object.keys(items[0]);
        }
        
        getRowsData(){
            
            const RenderRow = (props) =>{
            return props.keys.map((key, index)=>{
            return <td key={props.data[key]}>{props.data[key]}</td>
            })
            }
            
            var items = this.state.data.graph.nodes;
            var keys = this.getKeys(items);
            return items.map((row, index)=>{
            return <tr key={index}><RenderRow key={index} data={row} keys={keys}/></tr>
            })
        }
        

   
    render(){
        return(
            <Container fluid>
            <div id="graph_container" style={{width:600,height:500}}>
            </div>
            <div>
            { !this.state.updating && this.state.no_data && <p>No graph data returned. There is no overlap between nodes.</p> }
            { this.state.updating && <p>Graph is updating...</p>}
            {  !this.state.no_data && !this.state.updating &&
                <div>
                <table border={2} cellPadding={5}>
                    <thead>
                    <tr>
                        {this.getHeader()}
                    </tr>
                    </thead>
                    <tbody>
                        {this.getRowsData()}
                    </tbody>
                </table>
                </div>
             }
            </div> 
            </Container>
        );
    }
    
}

export default Graph;