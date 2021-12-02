//Resque
import React, { Component, useState } from 'react';
import Home from './components/home/Home';
import Nav from './components/header/Nav';
import About from "./components/about/About";
import Error from "./components/error/Error";
import Register from "./components/registration/register";
import Login from "./components/registration/login";
import Dashboard from "./components/dashboard/Dashboard";
import Createsupply from "./components/createSupplyChain/createsupply";
import Selectsupplychain from "./components/selectSupplyChain/SelectSupplyChain";
import Enroll from "./components/enroll/Enroll";
import Createsupplyhome from "./components/createsupplyhome/createsupplyhome";
import Createsupplyflow from "./components/createsupplyflow/createsupplyflow";
import TransferProduct from "./components/transferProduct/TransferProduct";
import CreateProduct from "./components/createProduct/CreateProduct";
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SupplyChainManagement from "./contracts/SupplyChainManagement.json";
import getWeb3 from "./getWeb3";
import './App.scss';
import Progress from './components/progress/progress';
import Request from './components/request/request';

class App extends Component {
  //const [products, setProducts] = useState();
  constructor(props) {
    super(props)
    this.state = {
      auth:(localStorage.getItem(`token`)!==null)?true:false,
      token: localStorage.getItem(`token`),
      account: '',
      contract: null,
      products: [],
      loading: true,
      productsCount: 0,
      batchesInOwnership: 0,
      unitsInOwnership: 0,
      productHistory: [],
      batchIdsInOwnership: [],
      notificationsCount : 0,
      notifications : []
    }

    this.addProduct = this.addProduct.bind(this)
    this.transferProduct = this.transferProduct.bind(this)
    this.currentBatchesInOwnership = this.currentBatchesInOwnership.bind(this)
    this.currentUnitsInOwnership = this.currentUnitsInOwnership.bind(this)
    this.productsInSupplyChain = this.productsInSupplyChain.bind(this)
    this.getProductName = this.getProductName.bind(this)
    this.getProductHistory = this.getProductHistory.bind(this)
    //this.getBatchIdsInOwnership = this.getBatchIdsInOwnership.bind(this)
    this.requestTransfer = this.requestTransfer.bind(this)
    this.acceptTransfer = this.acceptTransfer.bind(this)
    this.getNotificationsOfUser = this.getNotificationsOfUser.bind(this)
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      console.log(accounts);
      this.setState({ account: accounts[0] });

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SupplyChainManagement.networks[networkId];
      const contract = new web3.eth.Contract(
        SupplyChainManagement.abi,
        "0x7B9eeb3D7D95F27d9f9Cd41Fb131b6A1e9F5D96f",
      );



      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract });

  

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  onAuthConfirm = (t) =>{
    this.setState({
      auth:true,
      token: t,
    },() => {
    localStorage.setItem('token', (this.state.token))
  })}


  logout=()=>{
    // Request to backend in future
    this.setState({
      auth:false,
      token:null
    },() => {
    localStorage.removeItem('token')
  })
}

  addProduct = (productNo, productName, noOfBatches, unitsPerBatch, supplyChainId, ownerName, timestamp) => {
    this.setState({ loading: true })
    console.log(this.state.contract)
    console.log(productNo, productName, noOfBatches, unitsPerBatch, supplyChainId, ownerName, timestamp, this.state.account)
    this.state.contract.methods.addProduct(productNo, productName, noOfBatches, unitsPerBatch, supplyChainId, ownerName, timestamp).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  transferProduct = (productNo, productName, batchesToTransfer, supplyChainId, transferTo, transferToName, timestamp, notificationId) => {
    this.setState({ loading: true })
    this.state.contract.methods.transferProduct(productNo, productName, batchesToTransfer, supplyChainId, transferTo, transferToName, timestamp, notificationId).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  requestTransfer = (productNo, productName, batchesToTransfer, supplyChainId, currentOwnerName, transferTo, transferToName, timestamp) => {
    console.log("hello")
    this.setState({ loading: true })
    this.state.contract.methods.requestTransfer(productNo, productName, batchesToTransfer, supplyChainId, currentOwnerName, transferTo, transferToName, timestamp).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  currentBatchesInOwnership = (productNo, supplyChainId) => {
    console.log(this.state.contract)
    const batches = this.state.contract.methods.batchesInOwnership(productNo, this.state.account).call().then((res) => { return res })
    console.log("bathches", batches)
    return batches;
  }

  currentUnitsInOwnership = async (productNo, supplyChainId) => {
    const units = await this.state.contract.methods.currentUnitsInOwnership(productNo, supplyChainId).call();
    console.log(units)
    //this.setState({UnitsInOwnership : units})
    //return this.state.unitsInOwnership;
    return units;
  }

  getNotificationsOfUser = async () => {
    const web3 = await getWeb3();
    const accounts = await web3.eth.getAccounts();
    console.log(accounts[0]);

    const networkId = await web3.eth.net.getId();
    const deployedNetwork = SupplyChainManagement.networks[networkId];
    const contract = new web3.eth.Contract(
      SupplyChainManagement.abi,
      "0x7B9eeb3D7D95F27d9f9Cd41Fb131b6A1e9F5D96f",
    );

    const notificationsCount = await contract.methods.getNotificationsCount(accounts[0]).call();
    let notifications = []
    for(var i=1;i<=notificationsCount;i++){
      const notification = await contract.methods.getNotifications(accounts[0] , i).call()
      notifications = [...notifications, notification]
    }
    return notifications;
  }

  acceptTransfer = async (notificationId, timestamp) => {
    this.setState({ loading: true })
    console.log(this.state.contract)
    this.state.contract.methods.acceptTransfer(notificationId, timestamp).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    }) 
  }
  
  getProductName = async (productNo) => {
    const productName = await this.state.contract.methods.getProductName(productNo).call();
    console.log(productName)
    return productName;
  }

  productsInSupplyChain = async (supplyChainId) => {
    //this.setState({ products: [] })
    const productsCount = await this.state.contract.methods.productCountInSupplyChain(supplyChainId).call()
    console.log(productsCount)
    this.setState({ productsCount: productsCount })
    //const products = []
    this.setState({ products: [] })
    for (var i = 1; i <= productsCount; i++) {
      const product = await this.state.contract.methods.productBySupplyChain(supplyChainId, i).call()
      this.setState({
        products: [...this.state.products, product]
      })
      console.log("Debug Products", this.state.products);
      //products = [...products, product]
    }
    return this.state.products;
  }

  getProductHistory = async (supplyChainId, productNo, batchId) => {
    this.setState({ productHistory: [] })
    /*const productHistory = await this.state.contract.methods.productHistory(productNo).call()
    this.setState({
      productHistory: [...this.state.productHistory, productHistory]
    })*/

    const productHistoryCount = await this.state.contract.methods.productHistoryCount(productNo).call()
    console.log(productHistoryCount)
    this.setState({ productHistoryCount: productHistoryCount })

    for (var i = 1; i <= productHistoryCount; i++) {
      const batchHistory = await this.state.contract.methods.productHistory(productNo, i).call()
      console.log("history", batchHistory)
      if ((batchId >= batchHistory.firstBatch) && (batchId <= batchHistory.lastBatch)){
        this.setState({
          productHistory: [...this.state.productHistory, batchHistory]
        })
      }
      console.log("Debug Product History", this.state.productHistory);
    }
    return this.state.productHistory;
  }

  /*getBatchIdsInOwnership = async(supplyChainId, productNo) => {
    const firstBatchIdInOwnership = await this.state.contract.methods.getFirstBatchIdInOwnership(supplyChainId, productNo).call()
    console.log("firstBatchIdInOwnership", firstBatchIdInOwnership)

    const lastBatchIdInOwnership = await this.state.contract.methods.getLastBatchIdInOwnership(supplyChainId, productNo).call()
    console.log("lastBatchIdInOwnership", lastBatchIdInOwnership)

    this.setState({
      batchIdsInOwnership: []
    })
    for (var i = firstBatchIdInOwnership; i <= lastBatchIdInOwnership; i++){
      this.setState({
        batchIdsInOwnership: [...this.state.batchIdsInOwnership, i]
      })
    }
    return this.state.batchIdsInOwnership;
  }*/

  render() {
    return (
      <div className="app">
        <Router>
          <Nav AuthState={this.state.auth} logout = {this.logout}/>
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route exact path="/about">
              <About />
            </Route>
            <Route exact path="/register">
              <Register />
            </Route>
            <Route exact path="/request">
              <Request 
              getNotificationsOfUser = {this.getNotificationsOfUser}
              acceptTransfer = {this.acceptTransfer}
              />
            </Route>
            <Route exact path="/login" render={(props)=><Login {...props} AuthState={this.state.auth} Auth={this.onAuthConfirm}/>}>
            </Route>
            <Route exact path="/dashboard">
              <Dashboard />
            </Route>
            <Route exact path="/createsupply">
              <Createsupply />
            </Route>
            <Route exact path="/createsupplyflow">
              <Createsupplyflow />
            </Route>
            <Route exact path="/selectsupplychain">
              <Selectsupplychain />
            </Route>
            <Route exact path="/selectsupplychain/enroll">
              <Enroll />
            </Route>
            <Route exact path="/createsupplyhome">
              <Createsupplyhome />
            </Route>
            <Route exact path="/transferproduct">
              <TransferProduct
                //batchesOwnership={this.state.batchesInOwnership}
                //unitsOwnership={this.state.unitsInOwnership}
                getProductName={this.getProductName}
                productsInSupplyChain={this.productsInSupplyChain}
                currentBatchesInOwnership={this.currentBatchesInOwnership}
                currentUnitsInOwnership={this.currentUnitsInOwnership}
                transferProduct={this.transferProduct}
                requestTransfer={this.requestTransfer}
              />
            </Route>
            <Route exact path="/createproduct">
              <CreateProduct 
                addProduct={this.addProduct}
                currentBatchesInOwnership = {this.currentBatchesInOwnership}
              />
            </Route>
            <Route exact path="/progress" >
              <Progress 
                getBatchIdsInOwnership={this.getBatchIdsInOwnership}
                getProductHistory = {this.getProductHistory}
              />
            </Route>
            <Route path="*">
              <Error />
            </Route>
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App
