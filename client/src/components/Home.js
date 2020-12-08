import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Map from './Map';
import {Row,Col,Container,Form,Button, Tab, Tabs} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import axios from 'axios';



class Home extends React.Component{

    constructor()
    {
    super();
    }
    
    render(){
    return(
        <h2>Test home page</h2>
    );
    }
}

export default Home