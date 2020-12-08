import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Row,Col,Container,Form,Button} from 'react-bootstrap';
import axios from 'axios';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';


const SEARCH_URI='http://localhost:5000'

class TAForm extends React.Component{


    state = {isLoading : false}

    constructor()
    {
        super();
    }
     
    handleSearch = (val) => {
    //setIsLoading(true);
    
    
    const col = this.props.column_name;
    
    this.setState({isLoading:true});
    
    let sel = {'column' :  col , 'key' : val}
    console.log(val)

    axios.get(`http://localhost:5000/get_form_fields`,  { 'params' : sel} )
        .then((resp) => {
            //console.log(resp.data[col]);
            let options = resp.data[col];
            console.log(options);
            //setOptions(options);
            this.setState({[col]:options});
            
        this.setState({isLoading:false});
        } )
      
  }
    render(){
    return(
                <React.Fragment>
                <Form.Group>
                <Form.Label>{'Select '+this.props.label}</Form.Label>
                <AsyncTypeahead
                    filterBy={() => true}
                    id={this.props.column_name}
                    isLoading={this.state.isLoading}
                    minLength={this.props.minLength}
                    onSearch={this.handleSearch}
                    options={this.state[this.props.column_name]}
                    multiple
                    placeholder={"Search for a " + this.props.label}
                    
                />
                </Form.Group>
                </React.Fragment>
    );
    
    }
}

export default TAForm;