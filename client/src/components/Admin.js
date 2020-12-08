import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Row,Col,Container,Form,Button, Tab, Tabs} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import axios from 'axios';



class Admin extends React.Component{

    constructor()
    {
    super();
    }
    
    render(){
    return(
        <h2>Test admin page</h2>
    );
    }
}

export default Admin