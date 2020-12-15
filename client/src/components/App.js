import React from 'react';
import 'react-dates/initialize';
import '../css/App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-dates/lib/css/_datepicker.css';
//import Map from './Map';
import {Row,Col,Container,Form,Button,DropdownButton, Dropdown} from 'react-bootstrap';
import axios from 'axios';
import TAForm from './TAForm';

//------------------Deck GL imports---------------------------------------
import {StaticMap} from 'react-map-gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';
import {HexagonLayer} from '@deck.gl/aggregation-layers';
//------------------------------------------------------------------------

//----------------------------D3 imports-----------------------------------
import * as d3 from 'd3';
import MultiLineChart from './MultiLineChart';
//---------------------------------------------------------------------------

import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';

const MAPBOX_ACCESS_TOKEN='pk.eyJ1IjoiYWlzaHdhcnlhZGFiaGFkZSIsImEiOiJja2ZscGc4OG0wd2xpMndtcWRrOGd4d2RiIn0.3r_VOvQWdMWLQ5qKXP6WYg';


const test_d = [{
    "coordinates": [
      [
        -88.00036,
        42.24795
        
      ],
      [
      -83.00045,
        47.24781
        
      ],
      [
      -75.01775,
        49.26717,
        
      ],
      [
      -74.0119,
        56.26796
        
      ],
      [
      -71.98664,
        63.24837
        
      ],
      [
      -65.01695,
       67.25699,
        
      ],
      [
       -63.01408,
        69.27538
        
      ]
    ],
    "unix_time": [134555, 134557, 134559,134611,134623,134678,134698],
    "device_key" : ['333644','1234','1234'] 
  },
  
  {
    "coordinates": [
      [
        -45.00036,
        42.24795
        
      ],
      [
      -53.00045,
        47.24781
        
      ],
      [
      -56.01775,
        49.26717,
        
      ],
      [
      -57.0119,
        56.26796
        
      ],
      [
      -62.98664,
        63.24837
        
      ],
      [
      -65.01695,
       67.25699,
        
      ],
      [
       -69.01408,
        69.27538
        
      ]
    ],
    "unix_time": [134455, 134457, 134459,134511,134555,134562,134575],
    "device_key" : ['333544','333335','344444'] 
  }
  ];
  
  
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect]
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';   // pass in StaticMap mapStyle={mapStyle}

// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: -122.41669,
  latitude: 37.7853,
  zoom: 13,
  pitch: 0,
  bearing: 0
};

const style = {} //{backgroundColor:"#101010" , color:"#FFFFFF"}

//backgroundColor:"#1e1e1e" , color:"#93DFB8"
class App extends React.Component{
    
    state = { style: style  , filters:{ 'max_items' : [100] } , dropdown_value : 'Trips', hoverInfo:{} , pathSlider : 50,  time_scale : {min:0 , max: 0}}

    constructor(props)
    {
    super(props);

    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.setHoverInfo = this.setHoverInfo.bind(this);
    this.triggerDataReload = this.triggerDataReload.bind(this);
    }

    componentDidMount(){
        this.triggerDataReload();
        

    }
    
    triggerDataReload(){
        
        let sel = { 'filters' : this.state.filters };
        //sel.filters['max_items'] = this.state.dropdown_records;
        console.log('Posting data:', sel);

        let params  = {'Content-Type' : 'application/json'}
        axios.post(`http://localhost:5000/get_data`, sel, params )
        .then(res => {
                console.log(res);
                this.setState({ 'data': res.data.data }, () => {
                    
                    console.log(this.state.data);
                    if(this.state.data){
                        const timescale = {'min' : Math.min(...res.data.data.map(o => o.unix_time ).flat()) , 'max' : Math.max(...res.data.data.map(o => o.unix_time ).flat())};
                        this.setState({ 'time_scale' : timescale})
                        
                        console.log('props',this.props);
                        
                    }
                } );
                
                
        })
        this.props.updateCounter();
    }
    
    callbackSetFilters(key,valueArray){
        //console.log(key);
        //console.log(valueArray);
        let fil = this.state.filters;
        
        if(valueArray.length == 0){
            delete fil[key]
            
        }
        else{
            fil[key] = valueArray;
                
            }
        this.setState({'filters':fil});
        this.triggerDataReload();
        
        
    }
    
    
    
    handleSliderChange(event){
        
        this.setState({'pathSlider': event.target.value  })
    }
    
    
    scale = (num, in_min, in_max, out_min, out_max) => {
        var scaled = (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        if(!num)
            scaled = num;
        return scaled;
    }
    
    setHoverInfo(info){
        this.setState({'hoverInfo': { x: info.x , y : info.y , coordinate:info.coordinate  } })
        //{ x: info.x , y : info.y , coordinate:info.coordinate  }
    }
    
    hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
} 

    intToRGB(hash){
        var color = []
          for (var i = 0; i < 3; i++) {
            color[i] = (hash >> (i * 8)) & 0xFF;
        }
        return color
    }

    stringToColor = str => this.intToRGB(this.hashCode(str))
  
  
  
    getTooltip(object){
        if (this.state.dropdown_value == "Trips")
        {
            return `Long: ${this.state.hoverInfo.coordinate[0]}\nLat: ${this.state.hoverInfo.coordinate[1]}\nDevice Key: ${object.device_key[0]}`;
        }
        if (this.state.dropdown_value == "Hexagons"){
            //console.log(object);
            return `Long: ${object.position[0]}\nLat: ${object.position[1]}\nCount: ${object.points.length}`;
        }
    }
  
    getInitialViewState(){
        //console.log(this.state.data[0]);
        return  { longitude: this.state.data[0].coordinates[0][0] , latitude:this.state.data[0].coordinates[0][1],   zoom: 9    , pitch: 45, bearing: 0}
    } 
    
  render(){
    return (
  <Container fluid style={this.state.style}>
    <Col className="mx-auto">
    <Row>
        <Col >
            <h2 className="m-2">LOCATION DATA DASHBOARD</h2>
        </Col>
    </Row>
    <Row>
        <Col style={{height:'60vh'}} md={{ span: 8, offset: 0}}>
            <DeckGL
                effects={DEFAULT_THEME.effects}
                initialViewState={ this.state.data && this.getInitialViewState() }
                controller={true}
                getTooltip={({object}) => object && this.getTooltip(object) }
                >
                {(this.state.dropdown_value == "Trips") && <TripsLayer 
                    id= 'trips'
                    data= {this.state.data}
                    getPath= {d => d.coordinates}
                    getTimestamps= {d => d.unix_time }
                    getColor= {d => this.stringToColor(d.device_key[0])}
                    opacity= {0.5}
                    widthMinPixels= {2}
                    rounded= {true}
                    onHover = {info => this.setHoverInfo(info)}
                    currentTime= { this.state.pathSlider && Math.ceil(this.scale(this.state.pathSlider,0,100,this.state.time_scale.min,this.state.time_scale.max)) }
                    trailLength = {(this.state.time_scale.min + this.state.time_scale.max )/ 2}
                    shadowEnabled= {false}
                    pickable= {true}
                />}
                {(this.state.dropdown_value == "Hexagons") && 
                <HexagonLayer 
                    id= 'hexagons'
                    data= {this.state.data.map(o => o.coordinates ).flat()}
                    getPosition= {d => d}
                    pickable= {true}
                    extruded={ true}
                    radius ={ 200}
                    elevationScale ={4}
                    pickable= {true}
                />}
                <StaticMap reuseMaps mapStyle={MAP_STYLE} mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}   preventStyleDiffing={false} /> 
                
            </DeckGL> 

        </Col>
        <Col md={{span:4 , offset:0}}>
                
                    <Form>
                    <div className="m-2">
                        <p className="d-inline m-2">Showing</p>
                        <Dropdown className="d-inline"  onSelect= { (e,key) => this.callbackSetFilters("max_items",[key.target.firstChild.data])}>
                        <Dropdown.Toggle variant="info" id="dropdown-records"   >
                            { this.state.filters.max_items }
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {[10,100,500,1000,2000,3000,5000,10000].map(p => (<Dropdown.Item>{p}</Dropdown.Item>))}
                        </Dropdown.Menu>
                        </Dropdown>
                        <p className="d-inline m-2" > Records</p>
                    </div>
                    <div className="m-2">
                    <p className="d-inline m-2">Select Map Type</p>
                    <Dropdown className="d-inline m-2" onSelect= { (e,key) => this.setState({ dropdown_value : key.target.firstChild.data})} >
                    <Dropdown.Toggle variant="info" id="dropdown-map"   >
                        {this.state.dropdown_value || 'Select Map Type' }
                    </Dropdown.Toggle>
                    
                    <Dropdown.Menu>
                        <Dropdown.Item >Trips</Dropdown.Item>
                        <Dropdown.Item >Hexagons</Dropdown.Item>
                    </Dropdown.Menu>
                    </Dropdown>
                    </div>
                    <TAForm fname='device_key' 
                        onChange={(val) => {this.callbackSetFilters('device_key',val)}} // send callback function to TAForm component for setting filters
                        label='Device Key' minLength={3} 
                        style={{marginBottom:"0.5rem"}}
                    />
                    <TAForm fname='zipcode' 
                        onChange={(val) => {this.callbackSetFilters('zipcode',val)}} 
                        label='Zipcode' minLength={3} 
                        style={{marginBottom:"0.5rem"}}
                    />
                    <TAForm fname='state' 
                        onChange={(val) => {this.callbackSetFilters('state',val)}} 
                        label='State' minLength={1} 
                        style={{marginBottom:"0.5rem"}}
                    />
                    
                    <Form.Group>
                        <Form.Label>Path</Form.Label>
                        <Form.Control
                            type="range"
                            onChange={this.handleSliderChange}
                        />
                    </Form.Group>
                    
                </Form>
                    {
                        <Row style={{border: '1px solid black' , position: 'relative', zIndex: 1, pointerEvents: 'none', padding : "10px", margin : "10px"}}>
                            <p>
                            Long : { this.state.hoverInfo.coordinate ? this.state.hoverInfo.coordinate[0]  : this.state.data && this.getInitialViewState().longitude }  <br/>
                            Lat : { this.state.hoverInfo.coordinate ? this.state.hoverInfo.coordinate[1]  : this.state.data && this.getInitialViewState().latitude }  <br/>
                            Time: {new Date(Math.ceil(this.scale(this.state.pathSlider,0,100,this.state.time_scale.min,this.state.time_scale.max)) * 1000).toString()}
                            
                           </p>
                        </Row>
                    }
        </Col>
    </Row>
    <Row>
        <Col md={{ span: 7, offset: 0}} style={{'padding':0}} >
                            {
                            this.state.data && 
                            <MultiLineChart data={
                                                { 
                                                    y: "Velocity m/s",
                                                    dates: this.state.data.map(o => o.unix_time ).flat() , 
                                                    series: this.state.data.map( (d,i) => ({
                                                            name: d.device_key[0] ,
                                                            values : this.state.data.map((o,j) => (  i==j ? o.velocity_mps : new Array(o.unix_time.length).fill(0)   ) ).flat() 
                                                    }))
                                                }
                                        
                            }
                                        //x: this.state.data.map(o => o.unix_time ).flat(), (p,j) => (d.unix_time.indexOf(p) != -1 ? d.observation_count[d.unix_time.indexOf(p)]  : NaN)
                                        //y: this.state.data.map(o => o.observation_count ).flat()}
                                        
                            width="630"
                            height="200"
                            />
            }
        </Col>
    </Row>
    </Col>
    </Container>
    );
}
}

/*
                    <p style={{marginBottom:"0.5rem"}}>Select Date</p>
                    <DateRangePicker
                        startDate={this.state.startDate} // momentPropTypes.momentObj or null,
                        startDateId="your_unique_start_date_id" // PropTypes.string.isRequired,
                        endDate={this.state.endDate} // momentPropTypes.momentObj or null,
                        endDateId="your_unique_end_date_id" // PropTypes.string.isRequired,
                        onDatesChange={({ startDate, endDate }) => this.setState({ startDate, endDate })} // PropTypes.func.isRequired,
                        focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
                        onFocusChange={focusedInput => this.setState({ focusedInput })} // PropTypes.func.isRequired,
                        small={true}
                    />
*/

export default App;
