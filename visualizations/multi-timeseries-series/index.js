/* eslint-disable react/prop-types */

import React, { useState, useEffect} from 'react';
import {NrqlQuery, Spinner,Grid,GridItem,AutoSizer,PlatformStateContext} from 'nr1';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart,Area} from 'recharts';
import { CSVLink } from "react-csv"


// Global variables
const defaultColors=['#e6194b', '#3cb44b', '#000000', '#f58231', '#911eb4', '#f032e6', '#bcf60c', '#008080', '#9a6324', '#800000', '#808000', '#000075', '#808080', '#000000']
const c_accountid = 3056204
let trimpercent = 10
let avgbol = false
let minmaxareabol = false
let trimmedareabol = false
let hideoriginaldata = false
let globalerror


function avgfunction (array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return parseInt(sum / array.length)
}

function unixtodatetime(data) {
    let keys = ["x","begin_time","end_time"]
    data.map((s) => {
        for (let item in s){
            if (item == "data"){
                for (let subitem in s[item]) {
                    for (let i in s[item][subitem].data){
                        for (let j in s[item][subitem].data[i]){
                            if (keys.includes(j)){
                                let value = s[item][subitem].data[i][j]
                                let dateObj = new Date(value);
                                let utcString = dateObj.toUTCString();
                                let time = utcString.slice(5,-4);
                                s[item][subitem].data[i][j] = time
                            }
                        }

                    }
                }
                    
                }
            }

    })
}
 
function exportToCsv (data){
    let newdata = []

    data.forEach(el => {
        el.data.forEach(subel => {
            newdata.push(subel)
        })
    })

    let keys = ["x","y","begin_time","end_time"]
    let sorteddata=[]
    var sorted = [];
    newdata.map(el => {
        for(var key in el) {
            if (!sorted.includes(key)){
                sorted[0] = "x";
                sorted[1] = "begin_time";
                sorted[2] = "end_time";
                sorted[3] = "y";
                if (!keys.includes(key)){
                   sorted[sorted.length] = key
            }}}

    })  
    newdata.map(el => {
        var tempDict = {};
        for(var i = 0; i < sorted.length; i++) {
            tempDict[sorted[i]] = el[sorted[i]];
        }
        sorteddata.push(tempDict)
    })
    sorteddata.sort(function(a, b) {
        var keyA = a.x,
          keyB = b.x;
        // Compare the 2
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

    return sorteddata
  }


function build_json(z,i,array,value) {
    let datatopass={}
    datatopass.begin_time=z.begin_time
    datatopass.end_time=z.end_time
    datatopass.x=z.x
    datatopass.y=array[i]
    datatopass[value]=array[i]
    return datatopass
}


function parse_data(array) {
    let sets = []
    array.forEach(el => {
        sets.push(el)
    })
    return sets
}


function calculatedata(data) {
    let ctrlarray = []
    let resultarray = []

    let minmaxminsctrl = []
    let minmaxmaxsctrl = []
    let trimmedminctrl = []
    let trimmedmaxctrl = []
    let trimmedareactrl = []
    let avgarrctrl = []
    let minmaxareactrl=[]


    let datanames = ["min","max","trimmedmin","trimmedmax","avg","trimmedarea","minmaxarea"]

    for (let i = 0; i < data[0].data[0].data.length; i++) {
        data.forEach((z)=>{
            let name = z.data[0].metadata.name
            if (!datanames.includes(name)){
                ctrlarray.push(z.data[0].data[i].y)
            }
           
        })
        let avgarr =  []

        let trimmedarea = []
        let trimmedmin= []
        let trimmedmax= []

        let minmaxarea= []
        let minmaxmins = []
        let minmaxmaxs = []
        
        resultarray.push(ctrlarray)
        ctrlarray = []
        console.log("my arrays",resultarray)
        resultarray.forEach((array,idx) => {
            let minValue = Infinity;
            let maxValue = -Infinity;
            // if (idx > 0){
            //     console.log(idx)
                for (let item of array) {
        
                    // Find minimum value
                    if (item < minValue)
                        minValue = item;
            
                    // Find maximum value
                    if (item > maxValue)
                        maxValue = item;                
                } 
    
                avgarr.push(avgfunction(array))
    
                let mins = parseInt(((maxValue - minValue)*(trimpercent/100))+minValue)
                let maxs = parseInt(maxValue - ((maxValue - minValue)*(trimpercent/100)))
    
    
                trimmedmin.push(mins)
                trimmedmax.push(maxs)
                trimmedarea.push([mins,maxs])
    
                minmaxmins.push(minValue)
                minmaxmaxs.push(maxValue)
                minmaxarea.push([minValue,maxValue])       
            // }
               
        })

        console.log(avgarr)

        let z = data[0].data[0].data[i]


        avgarrctrl.push(build_json(z,i,avgarr,"avg"))

        trimmedareactrl.push(build_json(z,i,trimmedarea,"trimmedarea"))
        trimmedminctrl.push(build_json(z,i,trimmedmin,"trimmedmin"))
        trimmedmaxctrl.push(build_json(z,i,trimmedmax,"trimmedmax"))

        minmaxareactrl.push(build_json(z,i,minmaxarea,"minmaxarea"))
        minmaxminsctrl.push(build_json(z,i,minmaxmins,"min"))
        minmaxmaxsctrl.push(build_json(z,i,minmaxmaxs,"max"))

    } 

    let avgset = parse_data (avgarrctrl)
    let trimmedareaset = parse_data (trimmedareactrl)
    let trimmedminset = parse_data (trimmedminctrl)
    let trimmedmaxset = parse_data (trimmedmaxctrl)
    let minmaxareaset = parse_data (minmaxareactrl)
    let minset = parse_data (minmaxminsctrl)
    let maxset = parse_data (minmaxmaxsctrl)



    // update queries with calculated data
    data.push({"data":[{"data":avgset, "metadata":{"viz":"main","name": "avg","id":"74B5B05EEA583471E03DCBF0123D81CC79CAE0FE9", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":trimmedareaset, "metadata":{"viz":"main","name": "trimmedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CEE0FE9", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":trimmedminset, "metadata":{"viz":"main","name": "trimmedmin","id":"02D6A84F7B97E4709A11276615FDAAB3EE2BEE415", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":trimmedmaxset, "metadata":{"viz":"main","name": "trimmedmax","id":"2C1F4F2BAA2800FD80F50C3811F38D03B52DEEEB1", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":minmaxareaset, "metadata":{"viz":"main","name": "minmaxarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE9", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":minset, "metadata":{"viz":"main","name": "min","id":"625D011FAC794651F25160AD89612DFAAE954C0CB", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":maxset, "metadata":{"viz":"main","name": "max","id":"DDB4E3844C923B3F794EC52642E22CBE9FC8D8D31", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
   
}

const duration = 60*60*24*7*1000
const enddate =  Date.now()
const startdate = enddate - duration

// // Often provided by the PlatformState provider
const timeRange = {
    begin_time: startdate,
    duration: null, 
    end_time: enddate
  };
  
// Often provided by the PlatformState provider
const ctx = {tvMode: false, accountId: c_accountid, filters: undefined, timeRange: timeRange}

function AlignedTimeseries(props) {
    const {nrqlQueries, alignment} = props;
    const [queryResults, setQueryResults] = useState(null);
    // const platformstatecontext = useContext(PlatformStateContext);
    const platformstatecontext = ctx
    
    useEffect(async () => {      
            let windowsize = 180000
            let mainquery = props.nrqlQueries[0].query
            let compare= props.nrqlQueries[0].compare
            let timeseries= props.nrqlQueries[0].timeseries
            // let aggregator= props.nrqlQueries[0].aggregator
            avgbol = props.nrqlQueries[0].average
            minmaxareabol = props.nrqlQueries[0].minmaxareabol
            trimmedareabol = props.nrqlQueries[0].trimmedareabol
            hideoriginaldata = props.nrqlQueries[0].hideoriginaldata
            if (platformstatecontext.timeRange != undefined) {
                if (platformstatecontext.timeRange.duration == null){
                    windowsize = (parseInt(platformstatecontext.timeRange.end_time) - parseInt(platformstatecontext.timeRange.begin_time)) / 1000
                } else {
                  windowsize = parseInt(platformstatecontext.timeRange.duration) / 1000
                }
                
            }

            if (props.nrqlQueries[0].trimpercent != "") {
                trimpercent = props.nrqlQueries[0].trimpercent
            }
           
            // // generate the compare queries
            // if (platformstatecontext.timeRange == undefined) {
            //     for (let i = 1; i <= compare; i++) {
            //         if (i == 1 ) {
            //             let query = mainquery + " SINCE " + (parseInt(windowsize)*(i))  + " seconds ago TIMESERIES " + timeseries
            //             props.nrqlQueries[0].query = query
            //         } else {
            //             let query = mainquery + " SINCE " + (parseInt(windowsize)*(i))  + " seconds ago " + " until "+ (parseInt(windowsize)*(i-1))  + " seconds ago TIMESERIES " + timeseries
            //             nrqlQueries.push({accountId: c_accountid, query: query, color: defaultColors[i]})
                    
            //         }                
            //     }
            // } else {
            for (let i = 0; i <= compare; i++) {
                let query = mainquery + " SINCE " + (parseInt(windowsize)*(i+1))  + " seconds ago " + " until "+ (parseInt(windowsize)*(i))  + " seconds ago TIMESERIES " + timeseries
                if (i == 0 ) {
                    //let query = mainquery + " SINCE " + ((parseInt(windowsize)*(i+1)))  + " seconds ago " + " until "+ parseInt(windowsize) + " seconds ago TIMESERIES " + timeseries
                    props.nrqlQueries[0].query = query
                } else {
                    // let query = mainquery + " SINCE " + (parseInt(windowsize)*(i+1))  + " seconds ago " + " until "+ (parseInt(windowsize)*(i))  + " seconds ago TIMESERIES " + timeseries
                    nrqlQueries.push({accountId: c_accountid, query: query, color: defaultColors[i]})
                
                }                
            }
          // }

            let promises=nrqlQueries.map((q)=>{return NrqlQuery.query({accountIds: [q.accountId], query: q.query,formatTypeenum: NrqlQuery.FORMAT_TYPE.CHART})})
            let data
            try {
                data = await Promise.all(promises)
                if (data[0].error != null){
                   console.log(data[0].error.message)
                   globalerror = data[0].error.message
                }
            } catch (e){
                console.log(e)
            }
            
            // name the queries and update the colours
            let count = 1
            data.forEach(el => {
                if (count != 1){
                    el.data[0].metadata.name = data[0].data[0].metadata.name+(count-1)
                    el.data[0].metadata.color = defaultColors[Math.floor(Math.random() * defaultColors.length)]
                }
                count ++
            })
            calculatedata(data)
            console.log("calculate data")
            setQueryResults(data)



            let refreshratems
            if (timeseries.includes("second")) { // if the window size is 1 hour or more
                refreshratems = 10*1000 // 10 seconds in ms
            } else if (timeseries.includes("minute")) {
                refreshratems = 30*1000 // 30 seconds in ms
            } else if (timeseries.includes("hour") || timeseries.includes("week")) { 
                refreshratems = 1800*1000 // 30 minutes   
            } else {
                refreshratems = 5*1000 // 5 seconds in ms
            }

            const interval = setInterval(() => {console.log("Will refresh the data again in ",refreshratems);setQueryResults(data);}, refreshratems);

        return () => clearInterval(interval);            
     },[props]);

    
    if (globalerror != undefined){
        return <div><Spinner inline/>ERROR: {globalerror}</div>

    } else if(queryResults) {
        let seriesAlignment = !alignment || alignment =="" ? "start" : alignment
        const determineComparisonPoint = (r) => {
            let comparisonPoint
            switch(seriesAlignment) {
                case "middle": {
                    let midpoint = parseInt((r.data[0].data.length / 2)) - 1
                    comparisonPoint = comparisonPoint = r.data[0].data[ midpoint].x
                    break;                
                }
                case "end": {
                    comparisonPoint = r.data[0].data[r.data[0].data.length-1].x
                    break;           
                }
                default:{
                    comparisonPoint = r.data[0].data[0].x
                }
            }
            return comparisonPoint
        }

        //start alignment
        let latest=0
        queryResults.forEach((r)=>{
            if(r.data && r.data[0] && r.data[0].metadata && r.data[0].data) {
                let comparisonPoint=determineComparisonPoint(r)
                if(comparisonPoint > latest) {
                    latest=comparisonPoint
                }
            }
        })

        queryResults.forEach((r)=>{
            if(r.data && r.data[0] && r.data[0].metadata && r.data[0].data) {
                let comparisonPoint=determineComparisonPoint(r)
                let resultSetBeginTime=comparisonPoint
                let offset=latest-resultSetBeginTime
                if(offset > 0) {
                    r.data[0].data.forEach((row)=>{
                        row.x= row.x + offset
                    })
                } 
            }
        })

        // convert unix timestamps to date time
        unixtodatetime(queryResults)

        //determine latest result set, we'll align everything to that one
        let vizchartData=[]
        let exportchartData=[]
        let linechartdata = []
        let arechartdata = []

        queryResults.forEach(r=>{ if(r.data && r.data[0] && r.data[0].metadata.name != "trimmedarea" && r.data[0].metadata.name != "minmaxarea") {exportchartData.push(r.data[0])}}) 
        queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name != "min" && r.data[0].metadata.name != "max" && r.data[0].metadata.name != "trimmedmin" && r.data[0].metadata.name != "trimmedmax" && r.data[0].metadata.name != "avg" && r.data[0].metadata.name != "trimmedarea" && r.data[0].metadata.name != "minmaxarea") ){vizchartData.push(r.data[0])}}) 
        
        if( avgbol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "avg") ){linechartdata.push(r.data[0])}})
            
        }
        if( trimmedareabol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "trimmedarea") ){arechartdata.push(r.data[0])}})
        }
        
        if( minmaxareabol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "minmaxarea") ){arechartdata.push(r.data[0])}})
        }

        if (hideoriginaldata == true ) {
            vizchartData=[vizchartData[0]]
        }
     
        let outTable= <>
        <CSVLink filename="QueryData.csv" data={exportToCsv(exportchartData)}>Download data as CSV</CSVLink>
        </>
        
        return <AutoSizer>
            {({ width, height }) => (<div style={{ height, width }}>
            <ComposedChart width={width-15} height={height-15} margin={{top: 10, right: 10, bottom: 0, left: 0}}>
          <CartesianGrid strokeDasharray="3 3" /> 
          <XAxis dataKey="x"  type="category"  allowDuplicatedCategory={false}/>
          <YAxis  dataKey="y" type="number" domain={['datamin - 10', 'dataMax + 10']} />
          <Tooltip />
          <Legend />
          {vizchartData.map((s) => (<Line type="linear" dot={false} stroke={s.metadata.color} strokeWidth={2} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>
          ))
          }
          {
          linechartdata.map((s) => (<Line type="linear" dot={false} stroke={s.metadata.color} strokeWidth={5} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>))
          }   
          {arechartdata.map((s) => (<Area type="monotone" fill={s.metadata.color} dataKey="y" data={s.data}  name={s.metadata.name} strokeWidth={0} key={s.metadata.name}/>))}
        </ComposedChart>
        <Grid>
            <GridItem columnSpan={12}>
            {outTable}
            </GridItem>
        </Grid>
          </div>
        )}
      </AutoSizer>
    } else {
        return <div className="EmptyState">
                <div className="loader"><Spinner inline/> Loading and aligning data...</div>
            </div>
    }
  }
  
export default AlignedTimeseries;
