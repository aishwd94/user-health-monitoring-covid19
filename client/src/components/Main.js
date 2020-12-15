import React from 'react';
import {Tab,Tabs, Container} from 'react-bootstrap';
import App from './App';
import Graph from './Graph';

import {Link, Switch, Route, HashRouter} from 'react-router-dom';


class Main extends React.Component{
    
    
    constructor() {
    super();
    this.state = {activeTab:'app' , 'style':{}, counter:0};
    this.updateCounter = this.updateCounter.bind(this);
    
    }
  
    handleSelect(selectedTab) {
        console.log(selectedTab);
     this.setState({
       activeTab: selectedTab
     });
    }
    
    updateCounter(){
        this.setState(prevState => ({ counter : prevState.counter+1 }))
    }
    
    render(){
        return(
        <Container id="main_container"> 
        <Tabs>
          <Tab eventKey="app" title="App">< App updateCounter={this.updateCounter} /></Tab>
          <Tab eventKey="graph" title="Graph">< Graph counter={this.state.counter} /></Tab>
        </Tabs>
        </Container>

    );
}
}

export default Main;