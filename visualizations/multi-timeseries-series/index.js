/* eslint-disable react/prop-types */

import React, { useState, useEffect, useContext} from 'react';
import {NrqlQuery, Spinner,Grid,GridItem,AutoSizer,PlatformStateContext} from 'nr1';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart,Area,ReferenceDot} from 'recharts';
import { CSVLink } from "react-csv"
import moment from 'moment';
import { array } from 'prop-types';
import chroma from "chroma-js";

// Global variables
var _ = require('lodash');

let c_accountid
let trimpercent = 10
let clipSize=2
let avgbol = false

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





function AlignedTimeseries(props) {
    const {
        grp_data,
        grp_window,
        grp_history,
        grp_layers,
        grp_display
    } = props;

        //grp_data
        const conf_accountId = grp_data.conf_accountId;
        const conf_query = grp_data.conf_query
        const conf_timeseries = grp_data.conf_timeseries

        //grp_window
        const conf_startunixtime = grp_window.conf_startunixtime;
        const conf_endunixtime = grp_window.conf_endunixtime;
        const conf_duration = grp_window.conf_duration;
        const conf_startfromnow = grp_window.conf_startfromnow;
        const conf_endfromnow = grp_window.conf_endfromnow;
        const conf_todaystarttime = grp_window.conf_todaystarttime;
        const conf_todayendtime = grp_window.conf_todayendtime;


        //grp_history
        const conf_compare = grp_history.conf_compare
        const conf_comparestepsize = grp_history.conf_comparestepsize
        
        //grp_layers
        const conf_hideoriginaldata = grp_layers.conf_hideoriginaldata;
        const conf_average = grp_layers.conf_average;
        const conf_minmaxareabol = grp_layers.conf_minmaxareabol;
        const conf_trimmedareabol = grp_layers.conf_trimmedareabol;
        const conf_trimpercent = grp_layers.conf_trimpercent;
        const conf_clippedareabol = grp_layers.conf_clippedareabol;
        const conf_clipsize = grp_layers.conf_clipsize;

        //grp_display
        const conf_alignment = grp_display.conf_alignment;
        const conf_refreshrate = grp_display.conf_refreshrate;
        const conf_yaxislabel = grp_display.conf_yaxislabel;
        const conf_yaxismax = grp_display.conf_yaxismax;
        const conf_yaxismin = grp_display.conf_yaxismin;
        const conf_showdots = grp_display.conf_showdots;
        const conf_colortheme = grp_display.conf_colortheme;
        const conf_datetimestringformat_xaxis = grp_display.conf_datetimestringformat_xaxis;
        const conf_datetimestringformat_tooltip = grp_display.conf_datetimestringformat_tooltip;


    function convertTimestampToDate(timestamp,objname,windowsize) {
        var output
        if (objname == "tooltip"){
            let formatter= (conf_datetimestringformat_tooltip === null || conf_datetimestringformat_tooltip==="") ? "YYYY/MM/DD hh:mm:ss" : conf_datetimestringformat_tooltip
            output = moment(timestamp).format(formatter)
        } else {
            let formatter='yyyy/mm/dd hh:mm'
            if(conf_datetimestringformat_xaxis === null || conf_datetimestringformat_xaxis==="") {
                //automatic formatting of dates based on window size
                let winsizesecs=windowsize/1000
                if(winsizesecs <= moment.duration("PT1H").asSeconds()) {
                    formatter="hh:mm:ss"
                } else if(winsizesecs <= moment.duration("PT24H").asSeconds()) {
                    formatter="hh:mm"
                } else if( winsizesecs <= moment.duration("P31D").asSeconds() ){
                    formatter="YYYY/MM/DD hh:mm"
                } else {
                    formatter="YYYY/MM/DD hha"
                }
            } else {
                formatter=conf_datetimestringformat_xaxis
            }
            output = moment(timestamp).format(formatter);
        }
        return output
    }
    function exportToCsv (querydataImput){
        var querydata = _.cloneDeep(querydataImput);
        let keys = ["begin_time","end_time","x","y"]
        let data=querydata.slice(1,querydata.length)
    
        var c_newdata = _.cloneDeep(querydata[0]);
    
        data.forEach(array => {
            array.data.forEach((dict,index) => {
                    for (let key in dict){
                        if (!keys.includes(key)){
                            c_newdata.data[index][key] = dict[key]
                            // also delete unwanted keys in this loop
                            delete c_newdata.data[index]["x"]
                            delete c_newdata.data[index]["y"]
                    }
            }
            })
        })
    
        let sorted = []
        for(var key in c_newdata.data[0]) {
            sorted[0] = "begin_time"
            sorted[1] = "end_time"
            if (key != "begin_time" && key != "end_time"){
                sorted[sorted.length] = key
            }
        }
    
        let output = []
    
        c_newdata.data.forEach(array => {
            var tempDict = {};
            for(var i = 0; i < sorted.length; i++) {   
                if (i <=1) {
                    let c_key = String(sorted[i])
                    let item_val = convertTimestampToDate(array[sorted[i]])
                    tempDict[c_key]= item_val
                } else {
                let c_key = String(sorted[i])
                let item_val = array[sorted[i]]
                tempDict[c_key]=item_val
                }
            }
            output.push(tempDict)
        }
        )
        return output
    }

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
                    clipSize = 1
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
    
      
        // update queries with calculated data
        data.push({"data":[{"data":avgset, "metadata":{"viz":"main","name": "avg","id":"74B5B05EEA583471E03DCBF0123D81CC79CAE0FE9", "color": getColor(1)}}],loading: false, error: null})
        data.push({"data":[{"data":trimmedareaset, "metadata":{"viz":"main","name": "trimmedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CEE0FE9", "color":getColor("trimmedArea")}}],loading: false, error: null})
        data.push({"data":[{"data":trimmedminset, "metadata":{"viz":"main","name": "trimmedmin","id":"02D6A84F7B97E4709A11276615FDAAB3EE2BEE415", "color": getColor(2)}}],loading: false, error: null})
        data.push({"data":[{"data":trimmedmaxset, "metadata":{"viz":"main","name": "trimmedmax","id":"2C1F4F2BAA2800FD80F50C3811F38D03B52DEEEB1", "color":getColor(2)}}],loading: false, error: null})
        data.push({"data":[{"data":clippedareaset, "metadata":{"viz":"main","name": "clippedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0JE8", "color": getColor("clippedArea")}}],loading: false, error: null})
        data.push({"data":[{"data":clippedminset, "metadata":{"viz":"main","name": "clippedmin","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0LE8", "color": getColor(3)}}],loading: false, error: null})
        data.push({"data":[{"data":clippedmaxset, "metadata":{"viz":"main","name": "clippedmax","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE8", "color": getColor(3)}}],loading: false, error: null})
        data.push({"data":[{"data":minmaxareaset, "metadata":{"viz":"main","name": "minmaxarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE9", "color": getColor("minmaxArea")}}],loading: false, error: null})
        data.push({"data":[{"data":minset, "metadata":{"viz":"main","name": "min","id":"625D011FAC794651F25160AD89612DFAAE954C0CB", "color":getColor(3)}}],loading: false, error: null})
        data.push({"data":[{"data":maxset, "metadata":{"viz":"main","name": "max","id":"DDB4E3844C923B3F794EC52642E22CBE9FC8D8D31", "color": getColor(3)}}],loading: false, error: null})
       
    }

    if(conf_accountId == null || conf_accountId== "" || conf_query == null || conf_query == "") {
        return <div className="EmptyState">
         <div className="loader">Please configure a data source query.</div>
        </div>
    }
    
    let fadeColorSize=20
    if(conf_compare!=="" && conf_compare!=null) {
        fadeColorSize=parseInt(conf_compare);
    }
    console.log("fadeColorSize",fadeColorSize)
    const colorThemes={

        "pale": {
            primary: "#f58231",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'],
        },
        "strong": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'],
        },
        "greyfade": {
            primary: "#0d66d4",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: chroma.scale(['#c9c9c9', '#f2f2f2']).colors(fadeColorSize),
        },
        "bluefade": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: chroma.scale(['#5689c7', '#dae4f0']).colors(fadeColorSize),
        },
        "retrometro": {
            primary: "green",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: ["#ea5545", "#f46a9b", "#ef9b20", "#edbf33", "#ede15b", "#bdcf32", "#87bc45", "#27aeef", "#b33dc6"]
        },
        "dutchfield": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history:  ["#e60049", "#0bb4ff", "#50e991", "#e6d800", "#9b19f5", "#ffa300", "#dc0ab4", "#b3d4ff", "#00bfa0"]
        },
        "pinkblack": {
            primary: "#0d66d4",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history:  ["#2e2b28", "#3b3734", "#474440", "#54504c", "#6b506b", "#ab3da9", "#de25da", "#eb44e8", "#ff80ff"].reverse()
        },
        "brewer-YlGnBu": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history:  chroma.scale('YlGnBu').colors(fadeColorSize).reverse()
        },
        "brewer-RdPu": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history:  chroma.scale('RdPu').colors(fadeColorSize).reverse()
        }
       
        
    }

    function getColor(index) {
        let theme = (conf_colortheme !== null && conf_colortheme!=="") ? conf_colortheme:  "pale" ;
        let colorTheme=colorThemes[theme];
        if(colorTheme[index]) {
            return colorTheme[index]
        } else {
            let numColors=colorTheme.history.length;
            const chosen =  index % numColors;
            return colorTheme.history[chosen]
        }
    }

    const [queryResults, setQueryResults] = useState(null);
    const [globalError, setGlobalError] = useState(null);
    const [windowsize, setWindowsize] = useState(null);
    let timeRange;
    let overrideTimePicker=false;



    //determine time window overrides
    let startunixtime = null; //in ms
    let endunixtime = null; //in ms!
    let parsedDuration=null;
    let historicalStepSize=1000 * 60 * 60 * 24 * 7;
    let startFromNow=null;
    let endFromNow=null;


    //parsing period data
    if(conf_duration !=="" && conf_duration !==null) {
        console.log("Parsed duration",moment.duration("P"+conf_duration).asSeconds())
        parsedDuration=moment.duration("P"+conf_duration).asSeconds() * 1000;
    }
    if(conf_comparestepsize !=="" && conf_comparestepsize !==null) {
        console.log("Parsed step size",moment.duration("P"+conf_comparestepsize).asSeconds())
        historicalStepSize=moment.duration("P"+conf_comparestepsize).asSeconds() * 1000;
    }
    if(conf_startfromnow !=="" && conf_startfromnow !==null) {
        console.log("Parsed start from now",moment.duration("P"+conf_startfromnow).asSeconds())
        startFromNow=moment.duration("P"+conf_startfromnow).asSeconds() * 1000;
    }
    if(conf_endfromnow !=="" && conf_endfromnow !==null) {
        console.log("Parsed end from now",moment.duration("P"+conf_endfromnow).asSeconds())
        endFromNow=moment.duration("P"+conf_endfromnow).asSeconds() * 1000;
    }

    // Hard coded window
    if(conf_startunixtime!=="" && conf_startunixtime !== null) {
        startunixtime = parseInt(conf_startunixtime) * 1000
    }
    if(conf_endunixtime!=="" && conf_endunixtime !== null) {
        endunixtime = parseInt(conf_endunixtime) * 1000
    }

    //Offset form now window
    if(startFromNow !== null) {
        startunixtime =  Date.now() - startFromNow
    }
    if(endFromNow !== null) {
        endunixtime =  Date.now() + endFromNow
    }

    //Freetext hour
    if(conf_todaystarttime!=="" && conf_todaystarttime!==null) {
        console.log("conf_todaystarttime",conf_todaystarttime)
        startunixtime=moment(conf_todaystarttime, "hhmm").valueOf()
    }
    if(conf_todayendtime!=="" && conf_todayendtime!==null) {
        endunixtime=moment(conf_todayendtime, "hhmm").valueOf()
    }

    
    if(startunixtime!==null && endunixtime!==null) {     //start and end time provided
        console.log("Start and end time provided",startunixtime,endunixtime)
        timeRange = {
            begin_time: startunixtime,
            duration: null, 
            end_time: endunixtime
        };
        overrideTimePicker=true;
    } else if(startunixtime!==null &&  parsedDuration!==null ) {  // start and duration provided
        console.log("Start and duration provided", startunixtime, parsedDuration)
        timeRange = {
            begin_time: startunixtime,
            duration: null, 
            end_time: startunixtime + parsedDuration
        };

        overrideTimePicker=true;
    } else if(endunixtime!==null && parsedDuration!==null) { // end and duration provided
        console.log("End and duration provided")
        timeRange = {
            begin_time: endunixtime - parsedDuration,
            duration: null, 
            end_time: endunixtime
        };
        overrideTimePicker=true;
    } else if( parsedDuration!==null) { // just duration provided, assume thats a since duration time ago until now
        console.log("Just duration provided")
        timeRange = {
            begin_time: null,
            duration: parsedDuration, 
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


    // Often provided by the PlatformState provider, but not when in first creation mode
    const ctx = {tvMode: false, accountId: c_accountid, filters: undefined, timeRange: timeRange}
    const cplatformstatecontext = ctx
    // useContext(PlatformStateContext);
 

    async function  dataLoader() {
        console.log("Loading data")

        c_accountid = conf_accountId
        let mainquery = conf_query
        avgbol = conf_average
        let nrqlQueries = [{accountId: c_accountid, query: conf_query, color: getColor('primary')} ]
    
        if (conf_trimpercent != "") {
            trimpercent = conf_trimpercent
        }
        if (conf_clipsize != "") {
            clipSize = conf_clipsize
        }
    
        if(overrideTimePicker) { // if a fixed window has been provided then we use that instead of any values delivered via the time picker.
            cplatformstatecontext.timeRange = timeRange
        }
    
    
         //the amount to shift each window back in time
    
            let sinceTime, untilTime ;
    
            if (cplatformstatecontext.timeRange && cplatformstatecontext.timeRange.duration == null){ //timepicker chosen start and end time
                console.log("Time range set by start/end time")
                setWindowsize(  (parseInt(cplatformstatecontext.timeRange.end_time) - parseInt(cplatformstatecontext.timeRange.begin_time)) );
                sinceTime = cplatformstatecontext.timeRange.begin_time
                untilTime = cplatformstatecontext.timeRange.end_time
            } else if(cplatformstatecontext.timeRange && cplatformstatecontext.timeRange.duration != null) {  //timepicker value is relative
                console.log("Time range set by duration")
                let winsize = parseInt(cplatformstatecontext.timeRange.duration)
                untilTime = Date.now();
                sinceTime =  untilTime - winsize;
                setWindowsize(winsize)
            } else {
                console.log("Time range not set, using default")
                //no value set, use a default value
                untilTime = Date.now();
                sinceTime =  untilTime - DefaultWindowSize;
                setWindowsize(DefaultWindowSize)
            }
    
            let numCompare = (conf_compare !== null && conf_compare !== "") ? parseInt(conf_compare)  : 0        //default to no compare
            let timeseriesOption= (conf_timeseries !== null && conf_timeseries !== "") ? conf_timeseries : "AUTO"  // default to auto timeseries
            for (let i = 0; i <= numCompare; i++) {
                let step = historicalStepSize > 0 ? historicalStepSize : windowsize;
                let from = sinceTime - (step * i);
                let until = untilTime - (step * i);
                let query = mainquery + " SINCE " + from + " until "+ until  + " TIMESERIES " + timeseriesOption
                if (i == 0 ) { 
                    nrqlQueries[0].query = query  
                } else {
                    nrqlQueries.push({accountId: c_accountid, query: query, color: getColor(i)}) 
                }                
            }
    
    
        let promises=nrqlQueries.map((q)=>{return NrqlQuery.query({accountIds: [q.accountId], query: q.query,formatTypeenum: NrqlQuery.FORMAT_TYPE.CHART})})
        let data
        
    
        try {
            console.log("Loading data")
            data = await Promise.all(promises)
            if (data[0].error != null){
               console.log(data[0].error.message)
              setGlobalError(data[0].error.message)
            }
        } catch (e){
            console.log(e)
        }
    
    
       // name the queries and update the colours
       let count = 1
       data.forEach(el => {
           if (count != 1){
               let c_name = data[0].data[0].metadata.name
               el.data[0].metadata.name = data[0].data[0].metadata.name+(count-1)
               el.data[0].metadata.color = getColor(count-2)
               el.data[0].data.forEach(c_array => {
                   for( let item in c_array){
                       if (item == c_name){
                           let item_val = c_array[item]
                           delete c_array[item]
                           item = data[0].data[0].metadata.name+(count-1)
                           c_array[item]=item_val
                       }
                   }
               })
              
           }
           count ++
       })
    
        calculatedata(data)
        setQueryResults(data)
    }


    useEffect(async () => {   
        dataLoader()   
            let refreshratems = (conf_refreshrate === null || conf_refreshrate === "null") ? null : parseInt(conf_refreshrate)*1000

            if(refreshratems === null ) {
                if (windowsize <= 60000) { // 1 minute or less -> refresh every 10 seconds
                    refreshratems = 10*1000 
                } else if (windowsize <= 300000 ) { //1 minute to 5 minutes -> refresh every 30 seconds
                    refreshratems = 30*1000 
                } else if (windowsize <= 3600000 ) { // 5 minutes to 60 minutes -> refresh every 1 minute 
                    refreshratems = 60*1000 
                } else { // over 60 minutes -> refresh every 5 minutes
                    refreshratems = 60*5*1000
                } 

            }
            
            if(refreshratems>0) {
                console.log("Will refresh the data again in ",refreshratems);
                setInterval(() => {dataLoader();}, refreshratems);
            }
        


        return () => clearInterval(interval);            
     },{...props});

    
     if (globalError != undefined){
        return <div className="EmptyState">
        <div className="loader">ERROR: {globalError}</div>
        </div>

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
        
        if (conf_hideoriginaldata === true ) {
            vizchartData=[vizchartData[0]]
        }

        vizchartData[0].metadata.color=getColor('primary');


        //Hide future data
        let referencePoint=null;
        let nowTime =  Date.now()
        vizchartData[0].data.forEach((d,idx)=>{
            if(d.begin_time > nowTime || d.end_time > nowTime) {
                d.y = null
                if(referencePoint==null && idx > 0) {
                    referencePoint=idx-1
                }
            }
            
        })

        //Chart configuration options
        let yLabel=null
        let LeftMargin = 0
        if(conf_yaxislabel !== "" & conf_yaxislabel!== null) {
            LeftMargin = 20
            yLabel = { value: conf_yaxislabel, angle: -90, position: 'insideLeft', style: {fontSize: '0.9rem',fontWeight: 'bold',  fontFamily: '"Inter", "Segoe UI", "Tahoma", sans-serif'}}
        }


        // Y axis - supports recharts somain syntax: https://recharts.org/en-US/api/YAxis#domain
        let yAxisDomain=['auto','auto']
        if(conf_yaxismax !== "" && conf_yaxismax!= null) {
            let val = parseInt(conf_yaxismax)
             yAxisDomain[1]=isNaN(val) ? conf_yaxismax : val
        }
        if(conf_yaxismin !== "" && conf_yaxismin!= null) {
            let val = parseInt(conf_yaxismin)
            yAxisDomain[0]=isNaN(val) ? conf_yaxismin : val
        }


        //Line chart options
        let showDots=false;
        if(conf_showdots!=="" && conf_showdots!==null) {
            showDots = conf_showdots;
        }

        let refPoint= (referencePoint == null) ? null : <ReferenceDot fill={getColor('primary')}  x={vizchartData[0].data[referencePoint].x} y={vizchartData[0].data[referencePoint].y} isFront={true}/>;
        let outTable= <>
            <CSVLink filename="QueryData.csv" data={exportToCsv(exportchartData)}>Download data as CSV</CSVLink>
        </>
        return <AutoSizer>
            {({ width, height }) => (<div style={{ height: height, width: width }}>
            <ComposedChart width={width} height={height} margin={{top: 10, right: 50, bottom: 30, left: LeftMargin}}>
          <CartesianGrid strokeDasharray="3 3" /> 
          <XAxis tickFormatter={(x)=>{return convertTimestampToDate(x,'xtick',windowsize);}} dataKey="x"  type="category" allowDuplicatedCategory={false} interval="equidistantPreserveStart"  style={{
                    fontSize: '0.8rem',
                    fontFamily: '"Inter", "Segoe UI", "Tahoma", sans-serif'
                }}/>
          <YAxis 
            dataKey="y" 
            type="number" 
            interval="equidistantPreserveStart" 
            domain={yAxisDomain}
            allowDataOverflow={true} 
            label={yLabel} 
            style={{
                    fontSize: '0.8rem',
                    fontFamily: '"Inter", "Segoe UI", "Tahoma", sans-serif'
                }}
            />
          <Tooltip labelFormatter={(value)=>{return convertTimestampToDate(value,'tooltip',windowsize);}} />
          <Legend />
          {linechartdata.map((s) => (<Line type="linear" dot={false} stroke={s.metadata.color} strokeWidth={5} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>))}   
          {arechartdata.map((s) => (<Area type="monotone" fill={s.metadata.color} dataKey="y" data={s.data}  name={s.metadata.name} strokeWidth={0} key={s.metadata.name}/>))}
          {vizchartData.map((s) => {console.log("col",s.metadata.color);return <Line type="linear" dot={showDots} stroke={s.metadata.color} strokeWidth={2} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>})}
          {refPoint}
        </ComposedChart>
        <Grid>
            <GridItem columnSpan={12}>
            {outTable}            </GridItem>
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
