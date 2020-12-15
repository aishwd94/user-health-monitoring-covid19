import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Row,Col,Container,Form,Button} from 'react-bootstrap';
import axios from 'axios';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';


const SEARCH_URI='http://localhost:5000'

class TAForm extends React.Component{


    state = {isLoading : false}

    constructor(props)
    {
        super(props);
        console.log(props);
        this.handleSearch = this.handleSearch.bind(this)
    }
     
    handleSearch = (val) => {
    //setIsLoading(true);
    
    
    let col = this.props.fname;
    
    this.setState({isLoading:true});
    
    let sel = {'column' :  col , 'key' : val}

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
                <Form.Group style={this.props.style}>
                    {/*<Form.Label>{'Select '+this.props.label}</Form.Label>*/}
                <AsyncTypeahead
                    filterBy={() => true}
                    id={this.props.fname}
                    isLoading={this.state.isLoading}
                    minLength={this.props.minLength}
                    onSearch={this.handleSearch}
                    onChange={this.props.onChange}
                    options={this.state[this.props.fname]}
                    multiple
                    placeholder={"Search for a " + this.props.label}
                    
                />
                </Form.Group>
                </React.Fragment>
    );
    
    }
}

export default TAForm;