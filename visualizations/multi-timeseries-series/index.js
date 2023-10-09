/* eslint-disable react/prop-types */

import React, { useState, useEffect, useContext} from 'react';
import {NrqlQuery, Spinner,Grid,GridItem,AutoSizer,PlatformStateContext} from 'nr1';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart,Area} from 'recharts';
import { CSVLink } from "react-csv"


// Global variables
const defaultColors=['#e6194b', '#3cb44b', '#000000', '#f58231', '#911eb4', '#f032e6', '#bcf60c', '#008080', '#9a6324', '#800000', '#808000', '#000075', '#808080', '#000000']
let c_accountid
let trimpercent = 10
let clipSize=1
let avgbol = false
let globalerror
const DefaultWindowSize = 60 * 60 * 24  * 1000;


function avgfunction (array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return parseInt(sum / array.length)
}

function clipFunction (dataArray,size) {
    let sorted = dataArray.sort(function(a, b){return a - b});
    let clipped=sorted.slice(size,sorted.length-size)
    return clipped
}

function getMinMax(data) {
    let minValue = Infinity;
    let maxValue = -Infinity;
    for (let item of data) {
        // Find minimum value
        if (item < minValue)
            minValue = item;

        // Find maximum value
        if (item > maxValue)
            maxValue = item;                
    } 
    return [minValue,maxValue]
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
 
function exportToCsv (querydata){
    let data=[]
    querydata.forEach(r=>{ if(r.data && r.data[0] && r.data[0].metadata.name != "trimmedarea" && r.data[0].metadata.name != "minmaxarea" && r.data[0].metadata.name != "clippedarea") {data.push(r.data[0])}}) 
    // console.log("current export when function was called",data)
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

// function parse_time_string(data){
//     let dateObj = new Date(data);
//     let utcString = dateObj.toUTCString();
//     let time = utcString.slice(5,-4);
//     return time
// }

function calculatedata(data) {
   
    let resultarray = []

    let minmaxminsctrl = []
    let minmaxmaxsctrl = []
    let trimmedminctrl = []
    let trimmedmaxctrl = []
    let trimmedareactrl = []
    let clippedminctrl = []
    let clippedmaxctrl = []
    let clippedareactrl = []
    let avgarrctrl = []
    let minmaxareactrl=[]


    for (let i = 0; i < data[0].data[0].data.length; i++) {     //iterate over each bucket, using the first series as control
        let ctrlarray = [] //this is the y values for the current i'th bucket 
        data.forEach((z,idx)=>{
            if (idx > 0) { //we dont want to include the most recent series in the data
                ctrlarray.push(z.data[0].data[i].y)
             }  
        })
        resultarray.push(ctrlarray)
    } 

    let avgarr =  []

    let trimmedarea = []
    let trimmedmin= []
    let trimmedmax= []

    let minmaxarea= []
    let minmaxmins = []
    let minmaxmaxs = []

    let clippedarea = []
    let clippedmin = []
    let clippedmax = []


        resultarray.forEach((yvalues) => {

            let minMax = getMinMax(yvalues)
            let minValue = minMax[0]
            let maxValue =  minMax[1]

            avgarr.push(avgfunction(yvalues))

            let mins = parseInt(((maxValue - minValue)*(trimpercent/100))+minValue)
            let maxs = parseInt(maxValue - ((maxValue - minValue)*(trimpercent/100)))
            
            if (trimpercent == undefined){
                trimpercent = 10
            }
            if (clipSize == undefined){
                clipSize = 2
            }

            trimmedmin.push(mins)
            trimmedmax.push(maxs)
            trimmedarea.push([mins,maxs])

            minmaxmins.push(minValue)
            minmaxmaxs.push(maxValue)
            minmaxarea.push([minValue,maxValue])       

            //determine clipped area
            let clippedData=clipFunction(yvalues,parseInt(clipSize))
            let c_area = getMinMax(clippedData)
            clippedarea.push(c_area)
            clippedmin.push(c_area[0])
            clippedmax.push(c_area[1])

        })

        for (let i = 0; i < data[0].data[0].data.length; i++) {  
            let z = data[0].data[0].data[i]

            avgarrctrl.push(build_json(z,i,avgarr,"avg"))

            trimmedareactrl.push(build_json(z,i,trimmedarea,"trimmedarea"))
            trimmedminctrl.push(build_json(z,i,trimmedmin,"trimmedmin"))
            trimmedmaxctrl.push(build_json(z,i,trimmedmax,"trimmedmax"))

            minmaxareactrl.push(build_json(z,i,minmaxarea,"minmaxarea"))
            minmaxminsctrl.push(build_json(z,i,minmaxmins,"min"))
            minmaxmaxsctrl.push(build_json(z,i,minmaxmaxs,"max"))

            clippedminctrl.push(build_json(z,i,clippedmin,"clippedmin"))
            clippedmaxctrl.push(build_json(z,i,clippedmax,"clippedmax"))
            clippedareactrl.push(build_json(z,i,clippedarea,"clippedarea"))

        }

    let avgset = parse_data (avgarrctrl)
    let trimmedareaset = parse_data (trimmedareactrl)
    let trimmedminset = parse_data (trimmedminctrl)
    let trimmedmaxset = parse_data (trimmedmaxctrl)
    let minmaxareaset = parse_data (minmaxareactrl)
    let minset = parse_data (minmaxminsctrl)
    let maxset = parse_data (minmaxmaxsctrl)
    let clippedareaset = parse_data(clippedareactrl)
    let clippedminset = parse_data(clippedminctrl)
    let clippedmaxset = parse_data(clippedmaxctrl)


    // // update queries with calculated data
    // data.push({"data":[{"data":avgset, "metadata":{"viz":"main","name": "avg","id":"74B5B05EEA583471E03DCBF0123D81CC79CAE0FE9", "color": defaultColors[1]}}],loading: false, error: null})
    // data.push({"data":[{"data":trimmedareaset, "metadata":{"viz":"main","name": "trimmedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CEE0FE9", "color":defaultColors[2]}}],loading: false, error: null})
    // data.push({"data":[{"data":trimmedminset, "metadata":{"viz":"main","name": "trimmedmin","id":"02D6A84F7B97E4709A11276615FDAAB3EE2BEE415", "color": defaultColors[2]}}],loading: false, error: null})
    // data.push({"data":[{"data":trimmedmaxset, "metadata":{"viz":"main","name": "trimmedmax","id":"2C1F4F2BAA2800FD80F50C3811F38D03B52DEEEB1", "color":defaultColors[2]}}],loading: false, error: null})
    // data.push({"data":[{"data":clippedareaset, "metadata":{"viz":"main","name": "clippedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0JE8", "color": defaultColors[10]}}],loading: false, error: null})
    // data.push({"data":[{"data":clippedminset, "metadata":{"viz":"main","name": "clippedmin","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0LE8", "color": defaultColors[10]}}],loading: false, error: null})
    // data.push({"data":[{"data":clippedmaxset, "metadata":{"viz":"main","name": "clippedmax","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE8", "color": defaultColors[10]}}],loading: false, error: null})
    // data.push({"data":[{"data":minmaxareaset, "metadata":{"viz":"main","name": "minmaxarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE9", "color": defaultColors[11]}}],loading: false, error: null})
    // data.push({"data":[{"data":minset, "metadata":{"viz":"main","name": "min","id":"625D011FAC794651F25160AD89612DFAAE954C0CB", "color":defaultColors[11]}}],loading: false, error: null})
    // data.push({"data":[{"data":maxset, "metadata":{"viz":"main","name": "max","id":"DDB4E3844C923B3F794EC52642E22CBE9FC8D8D31", "color": defaultColors[11]}}],loading: false, error: null})
   
    // update queries with calculated data
    data.push({"data":[{"data":avgset, "metadata":{"viz":"main","name": "avg","id":"74B5B05EEA583471E03DCBF0123D81CC79CAE0FE9", "color": defaultColors[1]}}],loading: false, error: null})
    data.push({"data":[{"data":trimmedareaset, "metadata":{"viz":"main","name": "trimmedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CEE0FE9", "color":'#0262BC66'}}],loading: false, error: null})
    data.push({"data":[{"data":trimmedminset, "metadata":{"viz":"main","name": "trimmedmin","id":"02D6A84F7B97E4709A11276615FDAAB3EE2BEE415", "color": defaultColors[2]}}],loading: false, error: null})
    data.push({"data":[{"data":trimmedmaxset, "metadata":{"viz":"main","name": "trimmedmax","id":"2C1F4F2BAA2800FD80F50C3811F38D03B52DEEEB1", "color":defaultColors[2]}}],loading: false, error: null})
    data.push({"data":[{"data":clippedareaset, "metadata":{"viz":"main","name": "clippedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0JE8", "color": '#22DC6499'}}],loading: false, error: null})
    data.push({"data":[{"data":clippedminset, "metadata":{"viz":"main","name": "clippedmin","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0LE8", "color": defaultColors[10]}}],loading: false, error: null})
    data.push({"data":[{"data":clippedmaxset, "metadata":{"viz":"main","name": "clippedmax","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE8", "color": defaultColors[10]}}],loading: false, error: null})
    data.push({"data":[{"data":minmaxareaset, "metadata":{"viz":"main","name": "minmaxarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE9", "color": '#66666666'}}],loading: false, error: null})
    data.push({"data":[{"data":minset, "metadata":{"viz":"main","name": "min","id":"625D011FAC794651F25160AD89612DFAAE954C0CB", "color":defaultColors[11]}}],loading: false, error: null})
    data.push({"data":[{"data":maxset, "metadata":{"viz":"main","name": "max","id":"DDB4E3844C923B3F794EC52642E22CBE9FC8D8D31", "color": defaultColors[11]}}],loading: false, error: null})
   
}




function AlignedTimeseries(props) {
    const {
        conf_accountId,
        conf_query,
        conf_compare,
        conf_timeseries,
        conf_hideoriginaldata,
        conf_average,
        conf_minmaxareabol,
        conf_trimmedareabol,
        conf_trimpercent,
        conf_clippedareabol,
        conf_clipsize,
        conf_alignment,
        conf_startunixtime,
        conf_endunixtime,
        conf_duration,
        conf_refreshrate,
        conf_comparestepsize,
        conf_startsecondsfromnow,
        conf_endsecondsfromnow
    
    } = props;
    const [queryResults, setQueryResults] = useState(null);


    let timeRange;
    let overrideTimePicker=false;


    //determine time window overrides
    let startunixtime = null; //in ms
    let endunixtime = null; //in ms!

    // Hard coded window
    if(conf_startunixtime!=="" && conf_startunixtime !== null) {
        startunixtime = parseInt(conf_startunixtime) * 1000
    }
    if(conf_endunixtime!=="" && conf_endunixtime !== null) {
        endunixtime = parseInt(conf_endunixtime) * 1000
    }

    //Offset form now window
    if(conf_startsecondsfromnow!=="" && conf_startsecondsfromnow !== null) {
        startunixtime =  Date.now() - (conf_startsecondsfromnow * 1000)
    }
    if(conf_endsecondsfromnow!=="" && conf_endsecondsfromnow !== null) {
        endunixtime =  Date.now() + (conf_endsecondsfromnow * 1000)
    }

    
    if(startunixtime!==null && endunixtime!==null) {     //start and end time provided
        console.log("Start and end time provided",startunixtime,endunixtime)
        timeRange = {
            begin_time: startunixtime,
            duration: null, 
            end_time: endunixtime
        };
        overrideTimePicker=true;
    } else if(startunixtime!==null && conf_duration!=="" && conf_duration!==null ) {  // start and duration provided
        console.log("Start and duration provided", startunixtime, conf_duration)
        timeRange = {
            begin_time: startunixtime,
            duration: null, 
            end_time: startunixtime + (parseInt(conf_duration) * 1000)
        };

        overrideTimePicker=true;
    } else if(endunixtime!==null && conf_duration!=="" && conf_duration!==null) { // end and duration provided
        console.log("End and duration provided")
        timeRange = {
            begin_time: endunixtime - (parseInt(conf_duration) * 1000),
            duration: null, 
            end_time: endunixtime
        };
        overrideTimePicker=true;
    }
    else if(conf_duration!=="" && conf_duration!==null) { // just duration provided, assume thats a since duration time ago until now
        console.log("Just duration provided")
        timeRange = {
            begin_time: null,
            duration: parseInt(conf_duration) * 1000, 
            end_time: null
        };
        overrideTimePicker=true;
    } else {
        // //hard coded defaults
        // const duration = 60*60*24*1*1000
        // const enddate =  Date.now() - duration
        // const startdate = enddate - duration
    
        // // // Often provided by the PlatformState provider
        // timeRange = {
        //     begin_time: startdate,
        //     duration: null, 
        //     end_time: enddate
        // };

    }

console.log("timeRange",timeRange)

    // Often provided by the PlatformState provider, but not when in first creation mode
    const ctx = {tvMode: false, accountId: c_accountid, filters: undefined, timeRange: timeRange}
    const cplatformstatecontext = ctx
    // useContext(PlatformStateContext);
    // console.log("running ctx is ", cplatformstatecontext)



    useEffect(async () => {      
            let windowsize
            c_accountid = conf_accountId
            let mainquery = conf_query
            avgbol = conf_average
            let nrqlQueries = [{accountId: c_accountid, query: conf_query, color: defaultColors[Math.floor(Math.random() * defaultColors.length)]} ]

            if (conf_trimpercent != "") {
                trimpercent = conf_trimpercent
            }
            if (conf_clipsize != "") {
                clipSize = conf_clipsize
            }

            if(overrideTimePicker) { // if a fixed window has been provided then we use that instead of any values delivered via the time picker.
                cplatformstatecontext.timeRange = timeRange
            }


            let historicalStepSize= (conf_comparestepsize === "" || conf_comparestepsize == null) ? 0 : parseInt(conf_comparestepsize)*1000 //the amount to shift each window back in time

                let sinceTime, untilTime ;
    
                if (cplatformstatecontext.timeRange && cplatformstatecontext.timeRange.duration == null){ //timepicker chosen start and end time
                    console.log("Time range ste by start/end time")
                    windowsize = (parseInt(cplatformstatecontext.timeRange.end_time) - parseInt(cplatformstatecontext.timeRange.begin_time))
                    sinceTime = cplatformstatecontext.timeRange.begin_time
                    untilTime = cplatformstatecontext.timeRange.end_time
                } else if(cplatformstatecontext.timeRange && cplatformstatecontext.timeRange.duration != null) {  //timepicker value is relative
                    console.log("Time range set by duration")
                    windowsize = parseInt(cplatformstatecontext.timeRange.duration)
                    untilTime = Date.now();
                    sinceTime =  untilTime - windowsize;
                } else {
                    console.log("Time range not set, using default")
                    windowsize = DefaultWindowSize //no value set, use a default value
                    untilTime = Date.now();
                    sinceTime =  untilTime - windowsize;
                }

                for (let i = 0; i <= conf_compare; i++) {
                    let from = (sinceTime - (windowsize * (i))) - (i*historicalStepSize)
                    let until = (untilTime - (windowsize * (i))) - (i*historicalStepSize)
                    let query = mainquery + " SINCE " + from + " until "+ until  + " TIMESERIES " + conf_timeseries
                    if (i == 0 ) { 
                        nrqlQueries[0].query = query  
                    } else {
                        nrqlQueries.push({accountId: c_accountid, query: query, color: defaultColors[Math.floor(Math.random() * defaultColors.length)]}) 
                    }                
                }

            console.log(nrqlQueries)

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
                    el.data[0].metadata.color = defaultColors[count]
                }
                count ++
            })

            calculatedata(data)
            setQueryResults(data)


            let refreshratems = conf_refreshrate==="" ? null : parseInt(conf_refreshrate)*1000
            if(refreshratems === null ) {
                if (conf_timeseries.includes("second")) { // if the window size is 1 hour or more
                    refreshratems = 10*1000 // 10 seconds in ms
                } else if (conf_timeseries.includes("minute")) {
                    refreshratems = 30*1000 // 30 seconds in ms
                } else if (conf_timeseries.includes("hour") || conf_timeseries.includes("week")) { 
                    refreshratems = 1800*1000 // 30 minutes   
                } else {
                    refreshratems = 5*1000 // 5 seconds in ms
                }
            }
            if(refreshratems>0) {
                setInterval(() => {console.log("Will refresh the data again in ",refreshratems);setQueryResults(data);}, refreshratems);
            }
            

        return () => clearInterval(interval);            
     },[props]);

    const dataFromState = () => {
        return queryResults;
    }

    
    if (globalerror != undefined){
        return <div><Spinner inline/>ERROR: {globalerror}</div>

    } else if(queryResults) {
        let seriesAlignment = !conf_alignment || conf_alignment =="" ? "start" : conf_alignment
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

        let vizchartData=[]
        let exportchartData=[]
        let linechartdata = []
        let arechartdata = []

        queryResults.forEach(r=>{ if(r.data && r.data[0] && r.data[0].metadata.name != "trimmedarea" && r.data[0].metadata.name != "minmaxarea" && r.data[0].metadata.name != "clippedarea") {exportchartData.push(r.data[0])}}) 
        queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name != "min" && r.data[0].metadata.name != "max" && r.data[0].metadata.name != "trimmedmin" && r.data[0].metadata.name != "trimmedmax" && r.data[0].metadata.name != "avg" && r.data[0].metadata.name != "trimmedarea" && r.data[0].metadata.name != "minmaxarea" && r.data[0].metadata.name != "clippedarea" && r.data[0].metadata.name != "clippedmin" && r.data[0].metadata.name != "clippedmax") ){vizchartData.push(r.data[0])}}) 
        
        if( avgbol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "avg") ){linechartdata.push(r.data[0])}})
            
        }
        if( conf_trimmedareabol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "trimmedarea") ){arechartdata.push(r.data[0])}})
        }
        
        if( conf_minmaxareabol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "minmaxarea") ){arechartdata.push(r.data[0])}})
        }

        if( conf_clippedareabol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "clippedarea") ){arechartdata.push(r.data[0])}})
        }
        
        if (conf_hideoriginaldata == true ) {
            vizchartData=[vizchartData[0]]
        }
        let c_data = dataFromState()
        let outTable= <>
        <CSVLink filename="QueryData.csv" data={exportToCsv(c_data)}>Download data as CSV</CSVLink>
        </>
        return <AutoSizer>
            {({ width, height }) => (<div style={{ height, width }}>
            <ComposedChart width={width} height={height} margin={{top: 10, right: 10, bottom: 0, left: 0}}>
          <CartesianGrid strokeDasharray="3 3" /> 
          <XAxis dataKey="x"  type="category"  allowDuplicatedCategory={false}/>
          <YAxis dataKey="y" type="number" interval="equidistantPreserveStart" />
          <Tooltip />
          <Legend />
          {
          linechartdata.map((s) => (<Line type="linear" dot={false} stroke={s.metadata.color} strokeWidth={5} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>))
          }   
          {arechartdata.map((s) => (<Area type="monotone" fill={s.metadata.color} dataKey="y" data={s.data}  name={s.metadata.name} strokeWidth={0} key={s.metadata.name}/>))}
          {vizchartData.map((s) => (<Line type="linear" dot={false} stroke={s.metadata.color} strokeWidth={2} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>
          ))
          }
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
