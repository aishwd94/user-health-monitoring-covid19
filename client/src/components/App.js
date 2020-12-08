import React from 'react';
import '../css/App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Map from './Map';
import {Row,Col,Container,Form,Button} from 'react-bootstrap';
import axios from 'axios';
import TAForm from './TAForm';

import * as d3 from "d3";



const hours = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24'];

const MAPBOX_ACCESS_TOKEN='pk.eyJ1IjoiYWlzaHdhcnlhZGFiaGFkZSIsImEiOiJja2ZscGc4OG0wd2xpMndtcWRrOGd4d2RiIn0.3r_VOvQWdMWLQ5qKXP6WYg';
// Viewport settings


// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: -122.41669,
  latitude: 37.7853,
  zoom: 13,
  pitch: 0,
  bearing: 0
};

const style = {} //{backgroundColor:"#101010" , color:"#33FFFF"}

// Data to be used by the LineLayer
const data = [
  {sourcePosition: [-122.41669, 37.7853], targetPosition: [-123.41569, 36.5557]}
];

//backgroundColor:"#1e1e1e" , color:"#93DFB8"
class App extends React.Component{
    
    state = { 'style': style  , data : {} }

    constructor()
    {
    super();
    
    }

    fetchFormFields(){
        
    let sel = { 'selections' : this.state.selections };
    console.log('Posting data')

    axios.get(`http://localhost:5000/get_form_fields` )
      .then(res => {
          
          let viewform_data = {}
          
          for (const [key, value] of Object.entries(res.data)) 
          {
              viewform_data[key] = Object.values(value)
          }
          console.log(viewform_data)
        //console.log(Object.entries(res.data).map(     (k,v) => Object.values(k)));
        this.setState({ 'viewform_data': viewform_data });
      })
    }


    fetchData(filters){
        
    let sel = { 'params' : filters };
    console.log('Posting data')

    let params  = {'Content-Type' : 'application/json'}
    axios.post(`http://localhost:5000/get_data`, sel, params )
      .then(res => {
        console.log(res);
        this.setState({ 'data': res.data });
      })
    }
    

    componentDidMount(){
        this.fetchData({});
        //this.fetchFormFields();
    }
  
    
    
  render(){
    return (
  <Container fluid style={this.state.style}>
    <Col className="mx-auto" style={{minHeight:"100vh"}}>
    <Row>
        <Col >
            <h2 className="m-2">LOCATION DATA DASHBOARD</h2>
        </Col>
    </Row>
        <Row>
        <Col style={{height:'60vh'}} md={{ span: 7, offset: 0}}>
            <Map data={this.state.data} initial_view_state={INITIAL_VIEW_STATE} mapbox_key={MAPBOX_ACCESS_TOKEN} />
        </Col>
        <Col md={{span:5 , offset:0}}>
                <Form>
                    <TAForm column_name={'device_key'} label={'Device Key'} minLength={3}/>
                    <TAForm column_name={'zipcode'} label={'Zipcode'} minLength={3}/>
                    <TAForm column_name={'state'} label={'State'} minLength={1} />
                    <TAForm column_name={'hour'} label={'Hour'} minLength={1} />
                </Form>
        </Col>
        </Row>
    </Col>
    </Container>
    );
}
}

export default App;
