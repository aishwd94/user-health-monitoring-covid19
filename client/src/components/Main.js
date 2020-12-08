import React from 'react';
import {Tab,Tabs, Container} from 'react-bootstrap';
import Home from './Home';
import App from './App';
import Admin from './Admin';

import {Link, Switch, Route, HashRouter} from 'react-router-dom';


class Main extends React.Component{
    
    
    constructor() {
    super();
    this.state = {activeTab:'home' , 'style':{}};
    
    }
  
    handleSelect(selectedTab) {
        console.log(selectedTab);
     this.setState({
       activeTab: selectedTab
     });
    }
    
    render(){
        return(
        <Container> 
        <Tabs>
          <Tab eventKey="home" title="Home">< Home /></Tab>
          <Tab eventKey="app" title="App">< App /></Tab>
          <Tab eventKey="admin" title="Admin">< Admin /></Tab>
        </Tabs>
        </Container>

    );
}
}

export default Main;