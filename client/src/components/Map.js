/* global window */
import React, {useState, useEffect} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';


const test_data = [{
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
    "unix_time": [0, 2, 3, 4, 5, 6, 9],
    "color" : [[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0],[0, 0, 0]]
  }
  ];
    


// Source data CSV
const DATA_URL = {
  BUILDINGS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json' // eslint-disable-line
};

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

const INITIAL_VIEW_STATE = {
  longitude: -74,
  latitude: 40.72,
  zoom: 13,
  pitch: 45,
  bearing: 0
};

const data ={};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';   // pass in StaticMap mapStyle={mapStyle}

const landCover = [[[-74.0, 40.7], [-74.02, 40.7], [-74.02, 40.72], [-74.0, 40.72]]];

export default class Map extends React.Component{

        //({
            
            state = {}
            
            constructor(props){
                super(props)
                
                const trailLength = 180;
                const mapStyle = MAP_STYLE;
                const theme = DEFAULT_THEME;
                const loopLength = 1800; // unit corresponds to the timestamp in source data
                const animationSpeed = 1;
                const initialViewState=INITIAL_VIEW_STATE;
                const trips = test_data;
                const time=4;
                
                
                const layers = [ new TripsLayer({
                    id: 'trips',
                    data: trips,
                    getPath: d => d.coordinates,
                    getTimestamps: d => d.unix_time - 1546391797,
                    getColor: [253, 128, 93],
                    opacity: 0.5,
                    widthMinPixels: 2,
                    rounded: true,
                    trailLength ,
                    currentTime: time,
                    shadowEnabled: false
                    })
                        ];
            }
        //}) {
            
    //const [time, setTime] = useState(0);
    //const [animation] = useState({});
    //
    //const animate = () => {
    //    setTime(t => (t + animationSpeed) % loopLength);
    //    animation.id = window.requestAnimationFrame(animate);
    //};
    //
    //useEffect(
    //    () => {
    //    animation.id = window.requestAnimationFrame(animate);
    //    return () => window.cancelAnimationFrame(animation.id);
    //    },
    //    [animation]
    //);


    //const initialViewState = { latitude: -87.99456 , longitude : 42.0754 ,  pitch: 45, bearing: 0 }

    //const layers = [
    // This is only needed when using shadow effects
    //new PolygonLayer({
    //  id: 'ground',
    //  data: landCover,
    //  getPolygon: f => f,
    //  stroked: false,
    //  getFillColor: [0, 0, 0, 0]
    //}),

    /*new PolygonLayer({
      id: 'buildings',
      data: buildings,
      extruded: true,
      wireframe: false,
      opacity: 0.5,
      getPolygon: f => f.polygon,
      getElevation: f => f.height,
      getFillColor: theme.buildingColor,
      material: theme.material
    })*/
  //];
  


render(){
  return (
    <DeckGL
      layers={this.layers}
      effects={this.props.theme.effects}
      initialViewState={this.propsinitialViewState}
      controller={true}
    >
    
      <StaticMap reuseMaps mapStyle={this.props.mapStyle} mapboxApiAccessToken={this.props.mapboxApiAccessToken}   preventStyleDiffing={false} /> 
    </DeckGL>
  );
    }
}

